import { BadRequestException, ForbiddenException } from '@nestjs/common';
import Decimal from 'decimal.js';
import { PrismaService } from './prisma.service';

export type AuthUser = { id: number; role: string; bumdesId: number | null };
export const D = (x: any) => new Decimal(x?.toString() ?? 0);

export function must(b: any, ...fields: string[]) {
  for (const f of fields) if (b?.[f] === undefined || b[f] === null || b[f] === '') throw new BadRequestException(`Field wajib: ${f}`);
}
export function onlySuper(u: AuthUser) { if (u.role !== 'superadmin') throw new ForbiddenException('Hanya superadmin'); }
export function canWrite(u: AuthUser) { if (u.role === 'viewer') throw new ForbiddenException('Peran Anda hanya bisa melihat'); }

export async function safe<T>(fn: () => Promise<T>): Promise<T> {
  try { return await fn(); } catch (e: any) {
    if (e?.code === 'P2002') throw new BadRequestException('Data dengan kode/nilai itu sudah ada');
    if (e?.code === 'P2003') throw new BadRequestException('Data masih dipakai oleh data lain');
    throw e;
  }
}

/** Desa yang dipakai: operator/viewer = desanya sendiri; superadmin wajib menyebut bumdesUuid. */
export async function bumdesIdFor(db: PrismaService, u: AuthUser, bumdesUuid?: string): Promise<number> {
  if (u.role === 'superadmin') {
    if (!bumdesUuid) throw new BadRequestException('Pilih desa/BUMDes terlebih dahulu');
    const b = await db.bumdes.findUnique({ where: { uuid: bumdesUuid } });
    if (!b) throw new BadRequestException('BUMDes tidak ditemukan');
    return b.id;
  }
  if (!u.bumdesId) throw new ForbiddenException('Akun belum terhubung ke BUMDes');
  return u.bumdesId;
}
