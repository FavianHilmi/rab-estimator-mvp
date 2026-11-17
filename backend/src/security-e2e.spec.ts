import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import 'dotenv/config';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './prisma.service';
import * as bcrypt from 'bcryptjs';

describe('Security, RBAC & Functional Integrity Test Suite', () => {
  let app: any;
  let baseUrl: string;
  let db: PrismaService;
  let tokenSuperadmin: string;
  let tokenOperator1: string;
  let tokenOperator2: string;
  let tokenViewer: string;
  let bumdes1: any;
  let bumdes2: any;

  before(async () => {
    app = await NestFactory.create(AppModule, { logger: false });
    await app.listen(0);
    const addr = app.getHttpServer().address();
    baseUrl = `http://127.0.0.1:${addr.port}`;
    db = app.get(PrismaService);

    // Pastikan BUMDes 1 & 2 ada untuk pengujian multi-tenancy
    const pw = await bcrypt.hash('password123', 10);
    bumdes1 = await db.bumdes.findFirstOrThrow({ where: { kode: 'BMD-0001' } });
    bumdes2 = await db.bumdes.upsert({
      where: { kode: 'BMD-0002' },
      update: {},
      create: {
        kode: 'BMD-0002',
        nama: 'BUMDes Desa Sebelah',
        desa: 'Desa Sebelah',
        kecamatan: 'Kecamatan Sebelah',
      },
    });

    await db.user.upsert({
      where: { email: 'operator2@desa.test' },
      update: {},
      create: {
        nama: 'Operator Desa 2',
        email: 'operator2@desa.test',
        password: pw,
        role: 'operator',
        bumdesId: bumdes2.id,
      },
    });

    const login = async (email: string, password = 'password123') => {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      return { status: res.status, data };
    };

    const s = await login('superadmin@rab.test');
    tokenSuperadmin = s.data.token;

    const o1 = await login('operator@desa.test');
    tokenOperator1 = o1.data.token;

    const o2 = await login('operator2@desa.test');
    tokenOperator2 = o2.data.token;

    const v = await login('viewer@desa.test');
    tokenViewer = v.data.token;
  });

  after(async () => {
    if (app) await app.close();
  });

  // Helper fetch request dengan auth
  const req = async (path: string, options: { method?: string; token?: string; body?: any } = {}) => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (options.token) headers['Authorization'] = `Bearer ${options.token}`;
    const res = await fetch(`${baseUrl}${path}`, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    let json: any = null;
    try {
      json = await res.json();
    } catch {}
    return { status: res.status, data: json };
  };

  // ================= 1. PENGUJIAN AUTENTIKASI =================
  describe('1. Autentikasi & Guard Validasi Token', () => {
    it('AUTH-01: Menolak login dengan kredensial salah (HTTP 401)', async () => {
      const r = await req('/auth/login', {
        method: 'POST',
        body: { email: 'operator@desa.test', password: 'wrongpassword' },
      });
      assert.equal(r.status, 401);
      assert.match(r.data.message, /Email atau password salah/);
    });

    it('AUTH-02: Menolak akses endpoint terproteksi tanpa Bearer Token (HTTP 401)', async () => {
      const r = await req('/proyek');
      assert.equal(r.status, 401);
    });

    it('AUTH-03: Menolak akses dengan Bearer Token palsu / malformed (HTTP 401)', async () => {
      const r = await req('/proyek', { token: 'token-ngawur-12345' });
      assert.equal(r.status, 401);
    });
  });

  // ================= 2. PENGUJIAN HAK AKSES PERAN (RBAC) =================
  describe('2. Kontrol Akses Peran (RBAC)', () => {
    it('RBAC-01: Viewer DITOLAK saat mencoba membuat proyek baru (HTTP 403)', async () => {
      const r = await req('/proyek', {
        method: 'POST',
        token: tokenViewer,
        body: { namaProyek: 'Proyek Ilegal Viewer', tahun: 2026 },
      });
      assert.equal(r.status, 403);
      assert.match(r.data.message, /Peran Anda hanya bisa melihat/);
    });

    it('RBAC-02: Viewer DITOLAK saat mencoba mengubah harga lokal (HTTP 403)', async () => {
      const r = await req('/harga/sd-uuid-test', {
        method: 'PUT',
        token: tokenViewer,
        body: { tahun: 2026, harga: 250000 },
      });
      assert.equal(r.status, 403);
      assert.match(r.data.message, /Peran Anda hanya bisa melihat/);
    });

    it('RBAC-03: Operator DITOLAK saat mencoba mengubah Master Kategori (HTTP 403)', async () => {
      const r = await req('/kategori', {
        method: 'POST',
        token: tokenOperator1,
        body: { kode: '99', nama: 'Kategori Ilegal' },
      });
      assert.equal(r.status, 403);
      assert.match(r.data.message, /Hanya superadmin/);
    });

    it('RBAC-04: Operator DITOLAK saat mencoba menambah Master Sumber Daya (HTTP 403)', async () => {
      const r = await req('/sumber-daya', {
        method: 'POST',
        token: tokenOperator1,
        body: { tipe: 'bahan', kode: 'X.999', nama: 'Bahan Rahasia', satuan: 'kg' },
      });
      assert.equal(r.status, 403);
      assert.match(r.data.message, /Hanya superadmin/);
    });

    it('RBAC-05: Superadmin berhasil menambah Master Kategori baru (HTTP 201)', async () => {
      const uniqueKode = `K-${Date.now().toString().slice(-4)}`;
      const r = await req('/kategori', {
        method: 'POST',
        token: tokenSuperadmin,
        body: { kode: uniqueKode, nama: 'Kategori Pengujian Otomatis', pembulatan: 'down_0' },
      });
      assert.equal(r.status, 201);
      assert.equal(r.data.kode, uniqueKode);
    });
  });

  // ================= 3. PENGUJIAN ISOLASI DATA ANTAR-DESA (ANTI-IDOR) =================
  describe('3. Multi-Tenancy Data Isolation (Anti-IDOR)', () => {
    let proyekBumdes1Uuid: string;

    before(async () => {
      // Buat 1 proyek oleh Operator 1 (BUMDes 1)
      const res = await req('/proyek', {
        method: 'POST',
        token: tokenOperator1,
        body: { namaProyek: 'Proyek Rahasia Desa 1', tahun: 2026, overheadPersen: 10, ppnPersen: 11 },
      });
      assert.equal(res.status, 201);
      proyekBumdes1Uuid = res.data.uuid;
    });

    it('IDOR-01: Operator Desa 2 DITOLAK saat membaca detail proyek Desa 1 via UUID (HTTP 403)', async () => {
      const r = await req(`/proyek/${proyekBumdes1Uuid}`, { token: tokenOperator2 });
      assert.equal(r.status, 403);
      assert.match(r.data.message, /Tidak punya akses ke proyek ini/);
    });

    it('IDOR-02: Operator Desa 2 DITOLAK saat mencoba menambah Bab ke proyek Desa 1 (HTTP 403)', async () => {
      const r = await req(`/proyek/${proyekBumdes1Uuid}/bab`, {
        method: 'POST',
        token: tokenOperator2,
        body: { kode: 'I', namaBab: 'Pekerjaan Ilegal' },
      });
      assert.equal(r.status, 403);
      assert.match(r.data.message, /Tidak punya akses ke proyek ini/);
    });

    it('IDOR-03: Operator Desa 2 DITOLAK saat mencoba update parameter proyek Desa 1 (HTTP 403)', async () => {
      const r = await req(`/proyek/${proyekBumdes1Uuid}`, {
        method: 'PATCH',
        token: tokenOperator2,
        body: { overheadPersen: 5 },
      });
      assert.equal(r.status, 403);
      assert.match(r.data.message, /Tidak punya akses ke proyek ini/);
    });

    it('IDOR-04: Operator Desa 1 berhasil membaca detail proyek miliknya sendiri (HTTP 200)', async () => {
      const r = await req(`/proyek/${proyekBumdes1Uuid}`, { token: tokenOperator1 });
      assert.equal(r.status, 200);
      assert.equal(r.data.proyek.uuid, proyekBumdes1Uuid);
    });
  });

  // ================= 4. PENGUJIAN PENGUNCIAN STATUS & IMMUTABILITY =================
  describe('4. Penguncian Dokumen Final (Immutability & Integrity)', () => {
    let testProyekUuid: string;
    let babUuid: string;
    let pkUuid: string;

    before(async () => {
      // Ambil 1 pekerjaan demo untuk ditambahkan
      const pkList = await req('/pekerjaan', { token: tokenOperator1 });
      pkUuid = pkList.data[0].uuid;

      // 1. Operator 1 buat proyek baru
      const p = await req('/proyek', {
        method: 'POST',
        token: tokenOperator1,
        body: { namaProyek: 'Proyek Uji Finalisasi', tahun: 2026, overheadPersen: 10, ppnPersen: 11 },
      });
      testProyekUuid = p.data.uuid;

      // 2. Buat Bab I
      const b = await req(`/proyek/${testProyekUuid}/bab`, {
        method: 'POST',
        token: tokenOperator1,
        body: { kode: 'I', namaBab: 'Pekerjaan Awal' },
      });
      babUuid = b.data.uuid;

      // 3. Tambahkan 1 item pekerjaan
      const itm = await req(`/bab/${babUuid}/item`, {
        method: 'POST',
        token: tokenOperator1,
        body: { pekerjaanUuid: pkUuid, volume: 15.5 },
      });
      assert.equal(itm.status, 201);
    });

    it('FINAL-01: Proyek berhasil di-finalisasi saat RAB terisi lengkap (HTTP 201)', async () => {
      const r = await req(`/proyek/${testProyekUuid}/finalisasi`, {
        method: 'POST',
        token: tokenOperator1,
      });
      assert.equal(r.status, 201);
      assert.equal(r.data.ok, true);

      // Verifikasi status sekarang 'final'
      const check = await req(`/proyek/${testProyekUuid}`, { token: tokenOperator1 });
      assert.equal(check.data.proyek.status, 'final');
    });

    it('FINAL-02: Menolak penambahan item baru ke proyek yang sudah final (HTTP 400)', async () => {
      const r = await req(`/bab/${babUuid}/item`, {
        method: 'POST',
        token: tokenOperator1,
        body: { pekerjaanUuid: pkUuid, volume: 5 },
      });
      assert.equal(r.status, 400);
      assert.match(r.data.message, /Proyek sudah final dan dikunci/);
    });

    it('FINAL-03: Menolak penambahan Bab baru ke proyek yang sudah final (HTTP 400)', async () => {
      const r = await req(`/proyek/${testProyekUuid}/bab`, {
        method: 'POST',
        token: tokenOperator1,
        body: { kode: 'II', namaBab: 'Bab Susulan' },
      });
      assert.equal(r.status, 400);
      assert.match(r.data.message, /Proyek sudah final dan dikunci/);
    });

    it('FINAL-04: Menolak perubahan parameter overhead/PPN pada proyek yang sudah final (HTTP 400)', async () => {
      const r = await req(`/proyek/${testProyekUuid}`, {
        method: 'PATCH',
        token: tokenOperator1,
        body: { overheadPersen: 15 },
      });
      assert.equal(r.status, 400);
      assert.match(r.data.message, /Proyek sudah final dan dikunci/);
    });

    it('FINAL-05: Menolak penghapusan Bab pada proyek yang sudah final (HTTP 400)', async () => {
      const r = await req(`/bab/${babUuid}`, {
        method: 'DELETE',
        token: tokenOperator1,
      });
      assert.equal(r.status, 400);
      assert.match(r.data.message, /Proyek sudah final dan dikunci/);
    });
  });

  // ================= 5. PENGUJIAN BATAS INPUT (BOUNDARY CHECKS) =================
  describe('5. Validasi Batas Input Nilai (Boundary Checks)', () => {
    let dummyProyekUuid: string;
    let dummyBabUuid: string;
    let pkUuid: string;

    before(async () => {
      const pkList = await req('/pekerjaan', { token: tokenOperator1 });
      pkUuid = pkList.data[0].uuid;

      const p = await req('/proyek', {
        method: 'POST',
        token: tokenOperator1,
        body: { namaProyek: 'Proyek Uji Boundary', tahun: 2026 },
      });
      dummyProyekUuid = p.data.uuid;

      const b = await req(`/proyek/${dummyProyekUuid}/bab`, {
        method: 'POST',
        token: tokenOperator1,
        body: { kode: 'I', namaBab: 'Bab Uji Boundary' },
      });
      dummyBabUuid = b.data.uuid;
    });

    it('BOUND-01: Menolak volume negatif pada item pekerjaan (HTTP 400)', async () => {
      const r = await req(`/bab/${dummyBabUuid}/item`, {
        method: 'POST',
        token: tokenOperator1,
        body: { pekerjaanUuid: pkUuid, volume: -10 },
      });
      assert.equal(r.status, 400);
      assert.match(r.data.message, /Volume tidak valid/);
    });

    it('BOUND-02: Menolak nilai overhead > 100% atau < 0% (HTTP 400)', async () => {
      const r1 = await req(`/proyek/${dummyProyekUuid}`, {
        method: 'PATCH',
        token: tokenOperator1,
        body: { overheadPersen: 120 },
      });
      assert.equal(r1.status, 400);
      assert.match(r1.data.message, /overheadPersen tidak valid/);

      const r2 = await req(`/proyek/${dummyProyekUuid}`, {
        method: 'PATCH',
        token: tokenOperator1,
        body: { overheadPersen: -5 },
      });
      assert.equal(r2.status, 400);
      assert.match(r2.data.message, /overheadPersen tidak valid/);
    });

    it('BOUND-03: Menolak nilai harga lokal negatif (HTTP 400)', async () => {
      const sdList = await req('/sumber-daya', { token: tokenOperator1 });
      const sdUuid = sdList.data[0].uuid;

      const r = await req(`/harga/${sdUuid}`, {
        method: 'PUT',
        token: tokenOperator1,
        body: { tahun: 2026, harga: -50000 },
      });
      assert.equal(r.status, 400);
      assert.match(r.data.message, /Harga tidak valid/);
    });
  });
});
