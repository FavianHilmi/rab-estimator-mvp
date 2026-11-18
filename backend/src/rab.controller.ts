import { BadRequestException, Body, Controller, Delete, ForbiddenException, Get, NotFoundException, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import Decimal from 'decimal.js';
import { PrismaService } from './prisma.service';
import { CalcContext, CalcService } from './calc.service';
import { CurrentUser, JwtGuard } from './auth';
import { AuthUser, D, bumdesIdFor, canWrite, must, safe } from './util';

// ================= Harga lokal (milik BUMDes) =================
@Controller('harga')
@UseGuards(JwtGuard)
export class HargaController {
  constructor(private db: PrismaService) {}

  /** Daftar tahun yang sudah memiliki data harga lokal untuk BUMDes terpilih (terbaru lebih dulu). */
  @Get('tahun')
  async tahunTersedia(@CurrentUser() u: AuthUser, @Query('bumdesUuid') bumdesUuid?: string) {
    const bumdesId = await bumdesIdFor(this.db, u, bumdesUuid);
    const rows = await this.db.hargaLokal.groupBy({ by: ['tahun'], where: { bumdesId }, orderBy: { tahun: 'desc' } });
    return rows.map((r) => r.tahun);
  }

  /** Salin seluruh harga dari satu tahun ke tahun baru. Harga yang sudah ada di tahun tujuan tidak ditimpa. */
  @Post('salin')
  async salin(@CurrentUser() u: AuthUser, @Body() b: any) {
    canWrite(u); must(b, 'dariTahun', 'keTahun');
    const dari = Number(b.dariTahun);
    const ke = Number(b.keTahun);
    const valid = (t: number) => Number.isInteger(t) && t >= 2000 && t <= 2100;
    if (!valid(dari) || !valid(ke)) throw new BadRequestException('Tahun tidak valid (2000-2100)');
    if (dari === ke) throw new BadRequestException('Tahun asal dan tujuan tidak boleh sama');
    const bumdesId = await bumdesIdFor(this.db, u, b.bumdesUuid);
    const sumber = await this.db.hargaLokal.findMany({ where: { bumdesId, tahun: dari } });
    if (!sumber.length) throw new BadRequestException(`Tidak ada harga lokal pada tahun ${dari} untuk disalin`);
    const res = await this.db.hargaLokal.createMany({
      data: sumber.map((s) => ({ bumdesId, sumberDayaId: s.sumberDayaId, tahun: ke, harga: s.harga })),
      skipDuplicates: true,
    });
    return { ok: true, disalin: res.count, dariTahun: dari, keTahun: ke };
  }

  @Get()
  async list(
    @CurrentUser() u: AuthUser,
    @Query('tahun') tahun: string,
    @Query('bandingkanTahun') bandingkanTahun?: string,
    @Query('bumdesUuid') bumdesUuid?: string
  ) {
    const bumdesId = await bumdesIdFor(this.db, u, bumdesUuid);
    const t = Number(tahun) || new Date().getFullYear();
    const tLalu = bandingkanTahun ? Number(bandingkanTahun) : null;

    const [sd, harga, hargaLalu] = await Promise.all([
      this.db.masterSumberDaya.findMany({ orderBy: [{ tipe: 'asc' }, { kode: 'asc' }] }),
      this.db.hargaLokal.findMany({ where: { bumdesId, tahun: t } }),
      tLalu ? this.db.hargaLokal.findMany({ where: { bumdesId, tahun: tLalu } }) : Promise.resolve([]),
    ]);
    const map: Record<number, string> = {};
    for (const h of harga) map[h.sumberDayaId] = h.harga.toString();

    const mapLalu: Record<number, string> = {};
    for (const h of hargaLalu) mapLalu[h.sumberDayaId] = h.harga.toString();

    return sd.map((s) => ({
      uuid: s.uuid,
      kode: s.kode,
      nama: s.nama,
      tipe: s.tipe,
      satuan: s.satuan,
      harga: map[s.id] ?? null,
      hargaLalu: tLalu ? (mapLalu[s.id] ?? null) : undefined,
    }));
  }

  @Put(':sdUuid')
  async set(@CurrentUser() u: AuthUser, @Param('sdUuid') sdUuid: string, @Body() b: any) {
    canWrite(u); must(b, 'tahun', 'harga');
    if (!(Number(b.harga) >= 0)) throw new BadRequestException('Harga tidak valid');
    const bumdesId = await bumdesIdFor(this.db, u, b.bumdesUuid);
    const sd = await this.db.masterSumberDaya.findUnique({ where: { uuid: sdUuid } });
    if (!sd) throw new NotFoundException('Sumber daya tidak ditemukan');
    const key = { bumdesId_sumberDayaId_tahun: { bumdesId, sumberDayaId: sd.id, tahun: Number(b.tahun) } };
    await this.db.hargaLokal.upsert({ where: key, update: { harga: String(b.harga) }, create: { bumdesId, sumberDayaId: sd.id, tahun: Number(b.tahun), harga: String(b.harga) } });
    return { ok: true };
  }
}

// ================= Proyek RAB =================
@Controller()
@UseGuards(JwtGuard)
export class RabController {
  constructor(private db: PrismaService, private calc: CalcService) {}

  private check(u: AuthUser, p: { bumdesId: number; status: string }, write: boolean) {
    if (u.role !== 'superadmin' && p.bumdesId !== u.bumdesId) throw new ForbiddenException('Tidak punya akses ke proyek ini');
    if (write) {
      canWrite(u);
      if (p.status === 'final') throw new BadRequestException('Proyek sudah final dan dikunci');
    }
  }
  private async proyek(u: AuthUser, uuid: string, write = false) {
    const p = await this.db.rabProyek.findUnique({ where: { uuid } });
    if (!p) throw new NotFoundException('Proyek tidak ditemukan');
    this.check(u, p, write);
    return p;
  }

  @Get('proyek')
  async list(@CurrentUser() u: AuthUser) {
    return this.db.rabProyek.findMany({ where: u.role === 'superadmin' ? {} : { bumdesId: u.bumdesId ?? -1 }, include: { bumdes: { select: { nama: true } } }, orderBy: { id: 'desc' } });
  }

  @Post('proyek')
  async create(@CurrentUser() u: AuthUser, @Body() b: any) {
    canWrite(u); must(b, 'namaProyek', 'tahun');
    const bumdesId = await bumdesIdFor(this.db, u, b.bumdesUuid);
    const bd = await this.db.bumdes.findUniqueOrThrow({ where: { id: bumdesId } });
    const tahun = Number(b.tahun);
    const n = (await this.db.rabProyek.count({ where: { bumdesId, tahun } })) + 1;
    return safe(() => this.db.rabProyek.create({ data: {
      bumdesId, tahun, namaProyek: String(b.namaProyek), nomorDokumen: `RAB/${tahun}/${bd.kode}/${String(n).padStart(3, '0')}`,
      overheadPersen: String(b.overheadPersen ?? 10), ppnPersen: String(b.ppnPersen ?? 0),
    } }));
  }

  @Patch('proyek/:uuid')
  async update(@CurrentUser() u: AuthUser, @Param('uuid') uuid: string, @Body() b: any) {
    const p = await this.proyek(u, uuid, true);
    const data: any = {};
    for (const k of ['overheadPersen', 'ppnPersen']) if (b[k] !== undefined) { if (!(Number(b[k]) >= 0 && Number(b[k]) <= 100)) throw new BadRequestException(`${k} tidak valid`); data[k] = String(b[k]); }
    if (b.namaProyek) data.namaProyek = String(b.namaProyek);
    return this.db.rabProyek.update({ where: { id: p.id }, data });
  }

  /** RAB lengkap. Draft: dihitung langsung dari harga lokal. Final: memakai nilai terkunci. */
  @Get('proyek/:uuid')
  async detail(@CurrentUser() u: AuthUser, @Param('uuid') uuid: string) {
    const p = await this.proyek(u, uuid);
    const bab = await this.db.rabBab.findMany({ where: { rabId: p.id }, orderBy: { id: 'asc' }, include: { items: { orderBy: { id: 'asc' }, include: { pekerjaan: true } } } });
    const cache: Record<number, { hs?: Decimal; err?: string }> = {};
    const ctx = new CalcContext();
    let real = new Decimal(0); let lengkap = true;
    const out = [];
    for (const b of bab) {
      let sub = new Decimal(0); const items = [];
      for (const it of b.items) {
        let hs: Decimal | null = null; let total: Decimal | null = null; let error: string | null = null;
        if (p.status === 'final') {
          hs = it.hargaSatuanTerkunci ? D(it.hargaSatuanTerkunci) : null;
          total = it.totalHargaTerkunci ? D(it.totalHargaTerkunci) : null;
        } else {
          let c = cache[it.pekerjaanId];
          if (!c) {
            try { c = { hs: await this.calc.hargaSatuan(it.pekerjaanId, p.bumdesId, p.tahun, p.overheadPersen, ctx) }; }
            catch (e: any) { c = { err: e?.response?.message ?? e.message }; }
            cache[it.pekerjaanId] = c;
          }
          hs = c.hs ?? null; error = c.err ?? null;
          total = hs ? D(it.volume).times(hs) : null;
        }
        if (total) sub = sub.plus(total); else lengkap = false;
        items.push({ uuid: it.uuid, kode: it.pekerjaan.kode, nama: it.pekerjaan.nama, satuan: it.pekerjaan.satuan, volume: it.volume.toString(), hargaSatuan: hs?.toString() ?? null, total: total?.toString() ?? null, error });
      }
      real = real.plus(sub);
      out.push({ uuid: b.uuid, kode: b.kode, namaBab: b.namaBab, subtotal: sub.toString(), items });
    }
    const ppn = real.times(D(p.ppnPersen)).div(100);
    const total = real.plus(ppn);
    return {
      proyek: { uuid: p.uuid, nomorDokumen: p.nomorDokumen, namaProyek: p.namaProyek, tahun: p.tahun, overheadPersen: p.overheadPersen.toString(), ppnPersen: p.ppnPersen.toString(), status: p.status },
      bab: out,
      rekap: { realCost: real.toString(), ppn: ppn.toString(), total: total.toString(), dibulatkan: total.div(1000).floor().times(1000).toString(), lengkap },
    };
  }

  /** Finalisasi: hitung semua item, simpan harga & total terkunci, lalu kunci proyek. */
  @Post('proyek/:uuid/finalisasi')
  async finalisasi(@CurrentUser() u: AuthUser, @Param('uuid') uuid: string) {
    const p = await this.proyek(u, uuid, true);
    const items = await this.db.rabItem.findMany({ where: { bab: { rabId: p.id } } });
    if (!items.length) throw new BadRequestException('RAB masih kosong');
    const ctx = new CalcContext();
    const ops: any[] = [];
    for (const it of items) {
      const hs = await this.calc.hargaSatuan(it.pekerjaanId, p.bumdesId, p.tahun, p.overheadPersen, ctx);
      ops.push(this.db.rabItem.update({
        where: { id: it.id },
        data: {
          hargaSatuanTerkunci: hs.toString(),
          totalHargaTerkunci: D(it.volume).times(hs).toString(),
        },
      }));
    }
    ops.push(this.db.rabProyek.update({ where: { id: p.id }, data: { status: 'final' } }));
    await this.db.$transaction(ops);
    return { ok: true };
  }

  // ---------- bab ----------
  @Post('proyek/:uuid/bab')
  async addBab(@CurrentUser() u: AuthUser, @Param('uuid') uuid: string, @Body() b: any) {
    const p = await this.proyek(u, uuid, true); must(b, 'kode', 'namaBab');
    return this.db.rabBab.create({ data: { rabId: p.id, kode: String(b.kode), namaBab: String(b.namaBab) } });
  }
  @Delete('bab/:uuid')
  async delBab(@CurrentUser() u: AuthUser, @Param('uuid') uuid: string) {
    const b = await this.db.rabBab.findUnique({ where: { uuid }, include: { rab: true } });
    if (!b) throw new NotFoundException(); this.check(u, b.rab, true);
    await this.db.rabBab.delete({ where: { id: b.id } }); return { ok: true };
  }

  // ---------- item ----------
  @Post('bab/:uuid/item')
  async addItem(@CurrentUser() u: AuthUser, @Param('uuid') uuid: string, @Body() b: any) {
    must(b, 'pekerjaanUuid', 'volume');
    const bab = await this.db.rabBab.findUnique({ where: { uuid }, include: { rab: true } });
    if (!bab) throw new NotFoundException(); this.check(u, bab.rab, true);
    if (!(Number(b.volume) >= 0)) throw new BadRequestException('Volume tidak valid');
    const pk = await this.db.masterPekerjaan.findUnique({ where: { uuid: b.pekerjaanUuid } });
    if (!pk) throw new BadRequestException('Pekerjaan tidak ditemukan');
    return this.db.rabItem.create({ data: { babId: bab.id, pekerjaanId: pk.id, volume: String(b.volume) } });
  }
  @Patch('item/:uuid')
  async patchItem(@CurrentUser() u: AuthUser, @Param('uuid') uuid: string, @Body() b: any) {
    must(b, 'volume');
    const it = await this.db.rabItem.findUnique({ where: { uuid }, include: { bab: { include: { rab: true } } } });
    if (!it) throw new NotFoundException(); this.check(u, it.bab.rab, true);
    if (!(Number(b.volume) >= 0)) throw new BadRequestException('Volume tidak valid');
    return this.db.rabItem.update({ where: { id: it.id }, data: { volume: String(b.volume) } });
  }
  @Delete('item/:uuid')
  async delItem(@CurrentUser() u: AuthUser, @Param('uuid') uuid: string) {
    const it = await this.db.rabItem.findUnique({ where: { uuid }, include: { bab: { include: { rab: true } } } });
    if (!it) throw new NotFoundException(); this.check(u, it.bab.rab, true);
    await this.db.rabItem.delete({ where: { id: it.id } }); return { ok: true };
  }
}
