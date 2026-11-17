'use client';
import { useEffect, useState } from 'react';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export async function api(path: string, opts: { method?: string; body?: unknown } = {}) {
  const token = localStorage.getItem('token');
  const r = await fetch(BASE + path, {
    method: opts.method ?? 'GET',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (r.status === 401 && path !== '/auth/login') { logout(); }
  const j = await r.json().catch(() => null);
  if (!r.ok) throw new Error(Array.isArray(j?.message) ? j.message.join(', ') : j?.message ?? r.statusText);
  return j;
}

export function logout() { localStorage.removeItem('token'); localStorage.removeItem('user'); location.href = '/'; }

export const rp = (v: any, d = 2) => Number(v).toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d });

export type Me = { nama: string; email?: string; role: 'superadmin' | 'operator' | 'viewer'; bumdes: { uuid: string; nama: string } | null };
export type User = Me;

/** Membaca pengguna dari localStorage; kembali ke halaman login bila belum masuk. */
export function useMe(): Me | null {
  const [me, setMe] = useState<Me | null>(null);
  useEffect(() => {
    const u = localStorage.getItem('user');
    if (!u || !localStorage.getItem('token')) location.href = '/';
    else setMe(JSON.parse(u));
  }, []);
  return me;
}
