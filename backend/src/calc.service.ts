import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import Decimal from 'decimal.js';
import { PrismaService } from './prisma.service';
import { D } from './util';

export interface CalcResult {
  d: string;
  e: string;
  f: string;
  pembulatan: string;
}

export class CalcContext {
  visited = new Set<number>();
  memo = new Map<number, { d: Decimal; e: Decimal; f: Decimal; pembulatan: string }>();
}

/**
 * Mesin hitung tunggal RAB Desa (C1 - C15).
 * Menghitung biaya langsung (D), overhead (E), dan harga satuan (F) dengan presisi Decimal.js.
 */
@Injectable()
export class CalcService {
  constructor(private db: PrismaService) {}

  /**
   * C14: Deteksi siklus sebelum menambah komponen bertingkat.
   * Memastikan subPekerjaanId tidak memakai parentPekerjaanId baik langsung maupun tak langsung.
   */
  async checkCycle(parentPekerjaanId: number, subPekerjaanId: number): Promise<void> {
    if (parentPekerjaanId === subPekerjaanId) {
      throw new BadRequestException('Ditolak: menimbulkan siklus (pekerjaan saling memakai satu sama lain)');
    }

    const visited = new Set<number>();
    const queue = [subPekerjaanId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (currentId === parentPekerjaanId) {
        throw new BadRequestException('Ditolak: menimbulkan siklus (pekerjaan saling memakai satu sama lain)');
      }
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const rows = await this.db.masterKoefisien.findMany({
        where: { pekerjaanId: currentId, subPekerjaanId: { not: null } },
        select: { subPekerjaanId: true },
      });

      for (const r of rows) {
        if (r.subPekerjaanId) {
          if (r.subPekerjaanId === parentPekerjaanId) {
            throw new BadRequestException('Ditolak: menimbulkan siklus (pekerjaan saling memakai satu sama lain)');
          }
          if (!visited.has(r.subPekerjaanId)) {
            queue.push(r.subPekerjaanId);
          }
        }
      }
    }
  }

  /**
   * Hitung D, E, F lengkap untuk satu pekerjaan.
   */
  async hitung(
    pekerjaanId: number,
    bumdesId: number,
    tahun: number,
    overheadPersen: any,
    ctx = new CalcContext(),
  ): Promise<{ d: Decimal; e: Decimal; f: Decimal; pembulatan: string }> {
    // C14: Siklus terdeteksi saat menghitung
    if (ctx.visited.has(pekerjaanId)) {
      throw new BadRequestException('Ditolak: menimbulkan siklus (pekerjaan saling memakai satu sama lain)');
    }

    // C15: Memo per permintaan
    if (ctx.memo.has(pekerjaanId)) {
      return ctx.memo.get(pekerjaanId)!;
    }

    ctx.visited.add(pekerjaanId);

    try {
      const pk = await this.db.masterPekerjaan.findUnique({
        where: { id: pekerjaanId },
        include: {
          kategori: true,
          koefisien: {
            include: { sumberDaya: true, subPekerjaan: true },
            orderBy: { id: 'asc' },
          },
        },
      });

      if (!pk) throw new NotFoundException('Pekerjaan tidak ditemukan');

      // C13: Pekerjaan tanpa komponen
      if (!pk.koefisien.length) {
        throw new BadRequestException(`Pekerjaan ${pk.kode} belum punya koefisien`);
      }

      // Ambil harga lokal sumber daya pada level ini
      const sdIds = pk.koefisien.filter((r) => r.sumberDayaId !== null).map((r) => r.sumberDayaId!);
      const hargaMap: Record<number, Decimal> = {};
      if (sdIds.length > 0) {
        const harga = await this.db.hargaLokal.findMany({
          where: { bumdesId, tahun, sumberDayaId: { in: sdIds } },
        });
        for (const h of harga) hargaMap[h.sumberDayaId] = D(h.harga);
      }

      const missing: string[] = [];
      let d = new Decimal(0);

      for (const r of pk.koefisien) {
        const koef = D(r.koefisien);
        if (r.sumberDayaId) {
          // C2: Komponen sumber daya = koefisien x harga lokal
          const h = hargaMap[r.sumberDayaId];
          if (h === undefined || h === null) {
            missing.push(`${r.sumberDaya?.kode ?? ''} ${r.sumberDaya?.nama ?? ''}`.trim());
          } else {
            d = d.plus(koef.times(h));
          }
        } else if (r.subPekerjaanId) {
          // C3: Komponen berupa pekerjaan lain: F bila basis_harga = final, D bila direct
          const subRes = await this.hitung(r.subPekerjaanId, bumdesId, tahun, overheadPersen, ctx);
          const val = r.basisHarga === 'direct' ? subRes.d : subRes.f;
          d = d.plus(koef.times(val));
        }
      }

      // C12: Harga lokal kosong menghentikan perhitungan dengan rincian
      if (missing.length > 0) {
        throw new BadRequestException(`Harga lokal ${tahun} belum diisi: ${Array.from(new Set(missing)).join(', ')}`);
      }

      // C5: E = D x overhead_persen proyek / 100
      const e = d.times(D(overheadPersen)).div(100);

      // C6: F = D + E. Bila down_0, dipotong ke bilangan bulat ke bawah
      let f = d.plus(e);
      const pembulatan = pk.kategori.pembulatan ?? 'down_0';
      if (pembulatan === 'down_0') {
        f = f.toDecimalPlaces(0, Decimal.ROUND_DOWN);
      }

      const res = { d, e, f, pembulatan };
      ctx.memo.set(pekerjaanId, res);
      return res;
    } finally {
      ctx.visited.delete(pekerjaanId);
    }
  }

  /**
   * Mengembalikan harga satuan (F) untuk pekerjaan tertentu.
   */
  async hargaSatuan(
    pekerjaanId: number,
    bumdesId: number,
    tahun: number,
    overheadPersen: any,
    ctx = new CalcContext(),
  ): Promise<Decimal> {
    const res = await this.hitung(pekerjaanId, bumdesId, tahun, overheadPersen, ctx);
    return res.f;
  }
}
