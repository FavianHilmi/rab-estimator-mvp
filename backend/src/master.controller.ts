import { BadRequestException, Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from './prisma.service';
import { CalcService } from './calc.service';
import { CurrentUser, JwtGuard } from './auth';
import { AuthUser, bumdesIdFor, must, onlySuper, safe } from './util';

// Master data: semua pengguna boleh membaca, hanya superadmin yang boleh mengubah.
@Controller()
@UseGuards(JwtGuard)
export class MasterController {
  constructor(private db: PrismaService, private calc: CalcService) {}

  // ---------- kategori ----------
  @Get('kategori')
  kategori() {
    return this.db.masterKategori.findMany({ orderBy: { kode: 'asc' } });
  }

  @Post('kategori')
  async addKategori(@CurrentUser() u: AuthUser, @Body() b: any) {
    onlySuper(u);
    must(b, 'kode', 'nama');
    const pembulatan = b.pembulatan ?? 'down_0';
    if (!['none', 'down_0'].includes(pembulatan)) {
      throw new BadRequestException('Pembulatan harus none atau down_0');
    }
    return safe(() => this.db.masterKategori.create({
      data: { kode: String(b.kode), nama: String(b.nama), pembulatan },
    }));
  }

  @Patch('kategori/:uuid')
  async patchKategori(@CurrentUser() u: AuthUser, @Param('uuid') uuid: string, @Body() b: any) {
    onlySuper(u);
    must(b, 'pembulatan');
    if (!['none', 'down_0'].includes(b.pembulatan)) {
      throw new BadRequestException('Pembulatan harus none atau down_0');
    }
    return safe(() => this.db.masterKategori.update({
      where: { uuid },
      data: { pembulatan: b.pembulatan },
    }));
  }

  @Delete('kategori/:uuid')
  async delKategori(@CurrentUser() u: AuthUser, @Param('uuid') uuid: string) {
    onlySuper(u);
    await safe(() => this.db.masterKategori.delete({ where: { uuid } }));
    return { ok: true };
  }

  // ---------- sumber daya ----------
  @Get('sumber-daya')
  sumberDaya() {
    return this.db.masterSumberDaya.findMany({ orderBy: [{ tipe: 'asc' }, { kode: 'asc' }] });
  }

  @Post('sumber-daya')
  async addSd(@CurrentUser() u: AuthUser, @Body() b: any) {
    onlySuper(u);
    must(b, 'tipe', 'kode', 'nama', 'satuan');
    if (!['tenaga', 'bahan', 'alat'].includes(b.tipe)) {
      throw new BadRequestException('Tipe harus tenaga, bahan, atau alat');
    }
    return safe(() => this.db.masterSumberDaya.create({
      data: { tipe: b.tipe, kode: String(b.kode), nama: String(b.nama), satuan: String(b.satuan) },
    }));
  }

  @Delete('sumber-daya/:uuid')
  async delSd(@CurrentUser() u: AuthUser, @Param('uuid') uuid: string) {
    onlySuper(u);
    await safe(() => this.db.masterSumberDaya.delete({ where: { uuid } }));
    return { ok: true };
  }

  // ---------- pekerjaan + koefisien ----------
  @Get('pekerjaan')
  pekerjaan(@Query('q') q = '') {
    return this.db.masterPekerjaan.findMany({
      where: q ? { OR: [{ kode: { startsWith: q } }, { nama: { contains: q, mode: 'insensitive' } }] } : {},
      include: { kategori: true },
      orderBy: { kode: 'asc' },
    });
  }

  @Get('pekerjaan/:uuid')
  async pekerjaanDetail(@Param('uuid') uuid: string) {
    const p = await this.db.masterPekerjaan.findUnique({
      where: { uuid },
      include: {
        kategori: true,
        koefisien: {
          include: { sumberDaya: true, subPekerjaan: true },
          orderBy: { id: 'asc' },
        },
      },
    });
    if (!p) throw new NotFoundException('Pekerjaan tidak ditemukan');
    return p;
  }

  @Get('pekerjaan/:uuid/hitung')
  async hitungPekerjaan(
    @CurrentUser() u: AuthUser,
    @Param('uuid') uuid: string,
    @Query('tahun') tahunStr: string,
    @Query('overhead') overheadStr: string,
    @Query('bumdesUuid') bumdesUuid?: string,
  ) {
    const p = await this.db.masterPekerjaan.findUnique({ where: { uuid } });
    if (!p) throw new NotFoundException('Pekerjaan tidak ditemukan');
    const bumdesId = await bumdesIdFor(this.db, u, bumdesUuid);
    const tahun = Number(tahunStr) || new Date().getFullYear();
    const overhead = overheadStr !== undefined && overheadStr !== '' ? Number(overheadStr) : 10;
    const res = await this.calc.hitung(p.id, bumdesId, tahun, overhead);
    return {
      d: res.d.toString(),
      e: res.e.toString(),
      f: res.f.toString(),
      pembulatan: res.pembulatan,
    };
  }

  @Post('pekerjaan')
  async addPekerjaan(@CurrentUser() u: AuthUser, @Body() b: any) {
    onlySuper(u);
    must(b, 'kategoriUuid', 'kode', 'nama', 'satuan');
    const k = await this.db.masterKategori.findUnique({ where: { uuid: b.kategoriUuid } });
    if (!k) throw new BadRequestException('Kategori tidak ditemukan');
    return safe(() => this.db.masterPekerjaan.create({
      data: { kategoriId: k.id, kode: String(b.kode), nama: String(b.nama), satuan: String(b.satuan) },
    }));
  }

  @Delete('pekerjaan/:uuid')
  async delPekerjaan(@CurrentUser() u: AuthUser, @Param('uuid') uuid: string) {
    onlySuper(u);
    await safe(() => this.db.masterPekerjaan.delete({ where: { uuid } }));
    return { ok: true };
  }

  @Post('pekerjaan/:uuid/koefisien')
  async addKoef(@CurrentUser() u: AuthUser, @Param('uuid') uuid: string, @Body() b: any) {
    onlySuper(u);
    must(b, 'koefisien');
    if (!(Number(b.koefisien) > 0)) throw new BadRequestException('Koefisien harus lebih dari 0');

    const hasSd = !!b.sumberDayaUuid;
    const hasSubP = !!b.subPekerjaanUuid;
    if ((hasSd && hasSubP) || (!hasSd && !hasSubP)) {
      throw new BadRequestException('Isi salah satu: sumber daya atau pekerjaan lain');
    }

    const p = await this.db.masterPekerjaan.findUnique({ where: { uuid } });
    if (!p) throw new NotFoundException('Pekerjaan tidak ditemukan');

    if (hasSd) {
      const sd = await this.db.masterSumberDaya.findUnique({ where: { uuid: b.sumberDayaUuid } });
      if (!sd) throw new BadRequestException('Sumber daya tidak ditemukan');
      return this.db.masterKoefisien.create({
        data: { pekerjaanId: p.id, sumberDayaId: sd.id, koefisien: String(b.koefisien) },
      });
    } else {
      const subP = await this.db.masterPekerjaan.findUnique({ where: { uuid: b.subPekerjaanUuid } });
      if (!subP) throw new BadRequestException('Pekerjaan komponen tidak ditemukan');

      await this.calc.checkCycle(p.id, subP.id);

      const basisHarga = b.basisHarga ?? 'final';
      if (!['final', 'direct'].includes(basisHarga)) {
        throw new BadRequestException('Basis harga harus final atau direct');
      }

      return this.db.masterKoefisien.create({
        data: {
          pekerjaanId: p.id,
          subPekerjaanId: subP.id,
          basisHarga,
          koefisien: String(b.koefisien),
        },
      });
    }
  }

  @Delete('koefisien/:uuid')
  async delKoef(@CurrentUser() u: AuthUser, @Param('uuid') uuid: string) {
    onlySuper(u);
    await this.db.masterKoefisien.delete({ where: { uuid } });
    return { ok: true };
  }

  // ---------- BUMDes & pengguna (superadmin) ----------
  @Get('bumdes')
  bumdes(@CurrentUser() u: AuthUser) {
    return this.db.bumdes.findMany({
      where: u.role === 'superadmin' ? {} : { id: u.bumdesId ?? -1 },
      orderBy: { nama: 'asc' },
    });
  }

  @Post('bumdes')
  async addBumdes(@CurrentUser() u: AuthUser, @Body() b: any) {
    onlySuper(u);
    must(b, 'kode', 'nama', 'desa', 'kecamatan');
    return safe(() => this.db.bumdes.create({
      data: { kode: String(b.kode), nama: String(b.nama), desa: String(b.desa), kecamatan: String(b.kecamatan) },
    }));
  }

  @Get('users')
  async users(@CurrentUser() u: AuthUser) {
    onlySuper(u);
    const rows = await this.db.user.findMany({ include: { bumdes: true }, orderBy: { id: 'asc' } });
    return rows.map((x) => ({ uuid: x.uuid, nama: x.nama, email: x.email, role: x.role, bumdes: x.bumdes?.nama ?? null }));
  }

  @Post('users')
  async addUser(@CurrentUser() u: AuthUser, @Body() b: any) {
    onlySuper(u);
    must(b, 'nama', 'email', 'password', 'role');
    if (!['superadmin', 'operator', 'viewer'].includes(b.role)) throw new BadRequestException('Role tidak valid');
    if (String(b.password).length < 8) throw new BadRequestException('Password minimal 8 karakter');
    let bumdesId: number | null = null;
    if (b.role !== 'superadmin') {
      const bd = b.bumdesUuid ? await this.db.bumdes.findUnique({ where: { uuid: b.bumdesUuid } }) : null;
      if (!bd) throw new BadRequestException('Operator/viewer wajib dihubungkan ke BUMDes');
      bumdesId = bd.id;
    }
    const password = await bcrypt.hash(String(b.password), 10);
    const x = await safe(() => this.db.user.create({
      data: { nama: String(b.nama), email: String(b.email).toLowerCase(), password, role: b.role, bumdesId },
    }));
    return { uuid: x.uuid };
  }
}
