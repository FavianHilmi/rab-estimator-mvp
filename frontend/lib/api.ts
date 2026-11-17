'use client';
import { useEffect, useState } from 'react';

const rawBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const BASE = rawBase.replace(/\/+$/, '');

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

/** Membaca pengguna dan memverifikasi token dengan backend; kembali ke login bila sesi invalid. */
export function useMe(): Me | null {
  const [me, setMe] = useState<Me | null>(() => {
    if (typeof window === 'undefined') return null;
    const u = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!u || !token) return null;
    try {
      return JSON.parse(u);
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const u = localStorage.getItem('user');
    if (!token || !u) {
      location.href = '/';
      return;
    }

    try {
      const parsed = JSON.parse(u);
      setMe(parsed);
    } catch {
      logout();
      return;
    }

    // Verifikasi sesi aktif ke backend (/me)
    let isMounted = true;
    api('/me')
      .then((serverMe: Me) => {
        if (isMounted) {
          setMe(serverMe);
          localStorage.setItem('user', JSON.stringify(serverMe));
        }
      })
      .catch(() => {
        // Jika 401 atau error autentikasi, api() otomatis memanggil logout()
      });

    // Sinkronisasi sesi antar-tab: jika tab lain logout, tab ini otomatis logout
    const handleStorage = (e: StorageEvent) => {
      if ((e.key === 'token' || e.key === 'user') && !localStorage.getItem('token')) {
        location.href = '/';
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  return me;
}
