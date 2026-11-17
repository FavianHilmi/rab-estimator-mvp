# Rencana Pengerjaan, Pembagian Peran (Task Worker), dan Fase Pengembangan
**Aplikasi: RAB Desa (SaaS Penyusunan Rencana Anggaran Biaya Berbasis AHSP)**  
*Dokumen Rujukan:* `PRD RAB Desa.md` (Versi 1.0, 21 Oktober 2026)  
*Tanggal Dokumen:* 1 November 2026  

---

## 1. Ringkasan Eksekutif & Status Baseline (R1 MVP)

RAB Desa adalah aplikasi web SaaS multi-tenant untuk menyusun RAB fisik desa berdasarkan Analisis Harga Satuan Pekerjaan (AHSP) kementerian. Arsitektur sistem menggunakan **NestJS + Prisma + PostgreSQL** di backend dan **Next.js 14 (App Router) + Mantine 7** di frontend, dengan mesin hitung berbasis **Decimal.js** untuk akurasi finansial.

### Status Implementasi R1 (MVP):
- **Sudah Terpasang di Kode**:
  - Autentikasi dan otorisasi peran (`superadmin`, `operator`, `viewer`).
  - Master kategori, sumber daya (upah/bahan/alat), pekerjaan, dan koefisien.
  - Komponen bertingkat dengan basis harga (`final` vs `direct`) & deteksi siklus.
  - Pengaturan harga lokal per BUMDes per tahun.
  - Pembuatan RAB proyek, bab romawi, item pekerjaan, volume, dan rekapitulasi.
  - Alur draft $\rightarrow$ finalisasi (penguncian harga satuan & total).
  - Cetak via layout browser (`@media print`).
- **Kebutuhan Mendesak**:
  - Belum ada automated test komprehensif (`TC-01` s/d `TC-12`).
  - Struktur kategori masih datar (belum hierarkis sesuai pohon AHSP kementerian).
  - Pengisian master masih manual (belum ada modul impor Excel AHSP).
  - Format ekspor resmi (.xlsx dan PDF berlembar pengesahan) belum tersedia.

---

## 2. Fase Pengembangan (Development Phases) & Milestone

Pengembangan dibagi ke dalam 5 fase terukur:

```
+-----------------------------------------------------------------------------+
| FASE 1: Stabilisasi & Hardening R1 (Testing & Precision QA)                |
| - Automated test Jest (TC-01 s/d TC-12)                                     |
| - Verifikasi isolasi data BUMDes & penanganan galat kalkulasi               |
+-----------------------------------------------------------------------------+
                                       │
                                       ▼
+-----------------------------------------------------------------------------+
| FASE 2: Rilis 1.1 - Kategori Bertingkat & Impor AHSP (Core Scale)          |
| - Kategori hierarkis (tree, inheritance pembulatan)                         |
| - Excel Importer AHSP (.xlsx) dengan mode Dry-run & laporan validasi        |
| - Acceptance Test dataset besar (TC-13, 12 bab RAB)                         |
+-----------------------------------------------------------------------------+
                                       │
                                       ▼
+-----------------------------------------------------------------------------+
| FASE 3: Rilis 2.0 - Ekspor Resmi, Keamanan & Tata Kelola                   |
| - Generator spreadsheet .xlsx & PDF standar inspektorat/PMD                |
| - Fungsi Terbilang rupiah & lembar penandatangan/lokasi proyek              |
| - Audit Log terpusat & Salin Harga Lokal tahun lalu                         |
| - Migrasi auth ke HttpOnly Cookies & brute force protection                 |
+-----------------------------------------------------------------------------+
                                       │
                                       ▼
+-----------------------------------------------------------------------------+
| FASE 4: Pilot Project & Validasi Lapangan                                  |
| - Deployment staging/produksi VPS via Docker Compose & Caddy/HTTPS          |
| - Uji coba riil dengan 1-3 BUMDes/Pendamping Desa                           |
| - Menjawab pertanyaan regulasi swakelola, overhead, dan format cetak fisik  |
+-----------------------------------------------------------------------------+
                                       │
                                       ▼
+-----------------------------------------------------------------------------+
| FASE 5: Rilis 3.0 - Skalabilitas Lanjutan & Fitur Khusus                   |
| - Edisi AHSP multi-versi (arsip, draft, terbit)                             |
| - Keanggotaan Multi-Desa (1 user banyak BUMDes)                             |
| - Item di luar AHSP (Taksir) & Tabel Hitung Volume                          |
+-----------------------------------------------------------------------------+
```

---

### Rincian Tiap Fase

### Fase 1: Stabilisasi & Verifikasi R1 (Testing & Precision QA)
- **Fokus Utama**: Menjamin akurasi mesin hitung 100% dan integritas isolasi data antar desa.
- **Deliverables**:
  1. Unit test suite untuk `calc.service.ts` memverifikasi `TC-01` sampai `TC-06`.
  2. Integration test suite untuk route controller dan guards (`TC-07` sampai `TC-12`).
  3. Verifikasi rounding rule (`down_0` vs `none`) dan decimal formatting.
  4. Perbaikan bug handling ketika harga lokal kosong (tampilan pesan merah dan status `rekap.lengkap = false`).
- **Kriteria Keberhasilan (DoD)**: Seluruh test case `TC-01` s/d `TC-12` lulus uji otomatis (100% pass) di CI/lokal.

### Fase 2: Rilis 1.1 — Kategori Bertingkat & Engine Impor AHSP
- **Fokus Utama**: Menampung struktur lengkap AHSP kementerian (134 judul bab, 700+ pekerjaan) tanpa entri manual.
- **Deliverables**:
  1. **Kategori Bertingkat (Tree)**:
     - Prisma Schema: Relasi self-referencing `parent_id`, atribut `jenis` (`ahs` atau `sumber_daya`), validasi kedalaman max 6 tingkat.
     - Pewarisan pembulatan: Mengambil aturan pembulatan dari induk terdekat.
     - UI Hierarchical Tree di admin dan cascading dropdown saat memilih pekerjaan di RAB.
  2. **Engine Impor Excel (.xlsx)**:
     - Ekstraksi 3 blok: daftar sumber daya, blok analisis koefisien, dan daftar harga pekerjaan.
     - Fitur **Dry-Run**: Menampilkan statistik impor (jumlah baru, duplikat, satuan bentrok) sebelum simpan ke DB.
     - Normalisasi satuan baku (`m³` $\rightarrow$ `m3`, `bh` $\rightarrow$ `buah`, dsb.) dan auto-generate kode sumber daya.
     - Pengujian `TC-13` (RAB 12 bab data besar dengan verifikasi Real Cost Rp 249.491.694,16).
- **Kriteria Keberhasilan (DoD)**: File AHSP 2026 kementerian sukses diimpor, laporan validasi akurat, dan kalkulasi `TC-13` tepat tanpa galat.

### Fase 3: Rilis 2.0 — Dokumen Resmi, Audit Log & Keamanan
- **Fokus Utama**: Kesiapan operasional desa, penerbitan dokumen resmi, dan pengerasan sistem.
- **Deliverables**:
  1. **Ekspor Berkas Resmi (E1, E2, T1)**:
     - Ekspor `.xlsx` berformat resmi menggunakan library `exceljs` (RAB kuantitas, rekapitulasi, lampiran analisis koefisien).
     - Ekspor PDF siap cetak dengan header lokasi proyek dan lembar penandatanganan (Kades, Pengelola Kegiatan).
     - Generator teks `Terbilang` otomatis dalam Bahasa Indonesia.
  2. **Audit Logging (A1)**:
     - Pencatatan seluruh perubahan nilai harga lokal, finalisasi proyek, dan data master ke tabel `audit_logs`.
     - Tampilan log riwayat untuk superadmin dan operator desa.
  3. **Keamanan & Operasional (S1, H1)**:
     - Peningkatan session auth: Migrasi ke Cookie `httpOnly`, `SameSite=Lax`, dan flag `Secure`.
     - Rate limiter login (proteksi brute-force).
     - Fitur Salin Harga Lokal dari tahun anggaran sebelumnya.
- **Kriteria Keberhasilan (DoD)**: Dokumen Excel/PDF dapat dibuka dan diverifikasi oleh pihak peninjau/inspektorat; sesi aman dari manipulasi XSS.

### Fase 4: Pilot Project & Uji Lapangan
- **Fokus Utama**: Validasi sistem di lapangan dengan pengguna riil dan klarifikasi regulasi.
- **Deliverables**:
  1. Infrastruktur deployment: Docker Compose, Caddy Reverse Proxy (Auto-HTTPS), backup database PostgreSQL harian otomatis.
  2. Uji coba langsung dengan 1–3 BUMDes / Pendamping Desa.
  3. Mengonfirmasi poin diskusi regulasi (overhead swakelola desa, perlakuan PPN APBDes, dan format pengesahan tanda tangan).
- **Kriteria Keberhasilan (DoD)**: Proyek RAB riil berhasil disusun hingga terbit dokumen final siap lampir APBDes oleh mitra pilot.

### Fase 5: Rilis 3.0 — Fitur Skalabilitas & Khusus
- **Fokus Utama**: Fleksibilitas lanjutan dan efisiensi penyusunan RAB.
- **Deliverables**:
  1. **Edisi AHSP (V1)**: Pengelolaan versi edisi (2024, 2026) berstatus draft, terbit, atau arsip tanpa mengganggu proyek historis.
  2. **Multi-Desa (M1)**: Tabel `memberships` agar 1 pendamping desa dapat mengelola beberapa BUMDes dengan switch-tenant instan.
  3. **Item Non-AHSP / Taksir (X1)**: Penambahan pekerjaan swadaya/lokal yang tidak tercantum dalam standar kementerian.
  4. **Tabel Hitung Volume (L1)**: Kalkulator backup volume (P $\times$ L $\times$ T $\times$ Unit) langsung terhubung ke item RAB.
- **Kriteria Keberhasilan (DoD)**: Sistem mampu mengelola banyak edisi tahunan dan multi-desa secara modular.

---

## 3. Matriks Pembagian Peran Kerja (Task Workers)

| Peran Worker | Ruang Lingkup & Tanggung Jawab | File / Area Terkait |
| :--- | :--- | :--- |
| **Backend Worker** | • Migrasi skema Prisma (`schema.prisma`)<br>• Mesin hitung & logika tree di `calc.service.ts`<br>• Parser & Importer Excel AHSP via ExcelJS<br>• Generator ekspor XLSX & PDF resmi<br>• Authentication hardening (HttpOnly cookies, guards, audit log interceptor) | `backend/src/*`<br>`backend/prisma/*`<br>`backend/src/calc.service.ts`<br>`backend/src/rab.controller.ts` |
| **Frontend Worker** | • Antarmuka Next.js 14 App Router & Mantine 7<br>• Tree View & Cascading Selector Kategori AHSP<br>• Interaksi form RAB: inline volume editing, blur-saving, badge status<br>• Dialog upload & visualisasi laporan Dry-Run Impor AHSP<br>• Styling layout cetak `@media print` & pemicu download berkas | `frontend/src/app/*`<br>`frontend/src/components/*`<br>`frontend/src/hooks/*`<br>`frontend/src/types/api.ts` |
| **QA / Domain Expert Worker** | • Penyusunan test suites Jest (`TC-01` s/d `TC-13`)<br>• Verifikasi formula AHSP resmi (Komponen bertingkat basis Final vs Direct)<br>• Validasi aturan pembulatan per bab kementerian (`down_0` vs `none`)<br>• Penyusunan data mock / seed & kurasi anomali impor berkas | `backend/test/*`<br>Dokumen standar AHSP Kementerian PUPR/PMD |
| **DevOps / Sysadmin Worker** | • Multi-stage Dockerfile & `docker-compose.yml`<br>• Konfigurasi web server Caddy / Nginx (HTTPS, TLS, compression)<br>• Setup cron job backup database PostgreSQL harian<br>• Integrasi APM / Error tracking (Sentry) | `docker-compose.yml`<br>`Caddyfile`<br>Scripts backup & restore |

---

## 4. Work Breakdown Structure (WBS) & Sprint Backlog

### Sprint 1 (Fase 1: Testing & Stabilisasi)
- [x] **[QA/BE]** Buat unit test `calc.service.spec.ts` untuk memvalidasi (Status: **Selesai, 100% Pass**):
  - `TC-01`: Pekerjaan 3.6.1.10 (overhead 10%) $\rightarrow$ F = 923.945.
  - `TC-02`: Pekerjaan 1.1.1.1 pembulatan `none` $\rightarrow$ 22.540,1, `down_0` $\rightarrow$ 22.540.
  - `TC-03`: Pekerjaan 3.6.9.9 basis `final` $\rightarrow$ 2.115.179, basis `direct` $\rightarrow$ 1.930.390.
  - `TC-04`: Rekap Real Cost Rp 1.234.567,89 $\rightarrow$ Dibulatkan Rp 1.358.000.
  - `TC-05`: Penanganan galat harga lokal kosong.
  - `TC-06`: Deteksi dan penolakan siklus komponen berulang.
- [x] **[BE/FE]** Sinkronisasi Skema Prisma (Langkah 1) & Mesin Hitung (Langkah 2) (Status: **Selesai**):
  - Model `MasterKategori` tambah `pembulatan` (`down_0` / `none`).
  - Model `MasterKoefisien` tambah `subPekerjaanId` & `basisHarga` (`final` / `direct`).
  - Model `RabItem` presisi desimal diperlebar ke `@db.Decimal(24, 6)`.
- [x] **[FE]** UI Admin Kategori & Detail Pekerjaan (Langkah 4) (Status: **Selesai**):
  - Form pembulatan kategori & tabel pengaturan pembulatan di `/admin/pekerjaan`.
  - Dukungan komponen sub-pekerjaan bertingkat dan widget Pratinjau Perhitungan D, E, F di `/admin/pekerjaan/[uuid]`.
- [ ] **[BE]** Buat integration test e2e untuk otorisasi & hak akses:
  - `TC-07` & `TC-08`: Immutability proyek final (perubahan harga lokal tidak mengubah RAB final, penolakan edit item).
  - `TC-09` & `TC-10`: Isolasi BUMDes (HTTP 403 saat akses BUMDes lain) & proteksi peran viewer.
  - `TC-12`: Validasi finalisasi RAB kosong (HTTP 400).
- [ ] **[FE]** Verifikasi input desimal presisi penuh volume (`TC-11`: input 12,3456 tersimpan presisi dan tampil 12,35 pada view mode).

### Sprint 2 (Fase 2.1: Kategori Bertingkat)
- [ ] **[BE]** Update model `master_kategori` pada Prisma: tambah `parent_id`, `jenis`, `urutan`.
- [ ] **[BE]** Update `calc.service.ts` untuk recursive lookup aturan pembulatan ke kategori induk.
- [ ] **[FE]** Bangun komponen Mantine Tree View untuk mengelola hirarki kategori di `/admin/pekerjaan`.
- [ ] **[FE]** Update modal pemilihan item pada RAB agar mendukung navigasi pohon kategori yang tetap cepat dicari (Searchable Tree/Select).

### Sprint 3 (Fase 2.2: Importer Excel AHSP)
- [ ] **[BE]** Kembangkan service `AhspImportService`:
  - Parsing file Excel (.xlsx) dengan stream parser.
  - Algoritma pencocokan sumber daya (Normalisasi Nama + Satuan Baku).
  - Ekstraksi koefisien dan pembuatan kode otomatis (`L.xxx`, `B.xxx`, `A.xxx`).
  - Fitur Dry-Run return laporan JSON: `created`, `updated`, `skipped`, `duplicate_names`, `mismatched_units`.
- [ ] **[FE]** Buat halaman UI Admin Impor AHSP:
  - File Dropzone untuk upload file Excel.
  - Modal review hasil Dry-Run (menampilkan tabel peringatan anomali sebelum konfirmasi simpan).
- [ ] **[QA]** Jalankan uji beban data resmi AHSP 2026 (`TC-13`): Verifikasi target Real Cost Rp 249.491.694,16.

### Sprint 4 (Fase 3.1: Ekspor Dokumen & Penandatangan)
- [ ] **[BE]** Buat utility `terbilang.ts` mengubah angka desimal menjadi kalimat rupiah resmi.
- [ ] **[BE]** Buat generator Excel (.xlsx) resmi:
  - Lembar 1: Ringkasan RAB & Rekapitulasi (Kop, No Dokumen, Bab Romawi, Subtotal).
  - Lembar 2: Rincian Analisis Harga Satuan Pekerjaan yang digunakan.
  - Lembar 3: Daftar Harga Satuan Upah, Bahan, dan Alat Lokal BUMDes.
- [ ] **[BE]** Tambahkan kolom metadata proyek pada `rab_proyek`: `lokasi_proyek`, `nama_kades`, `nama_pk` (Pelaksana Kegiatan).
- [ ] **[FE]** Tambahkan tombol "Ekspor Excel" dan "Cetak PDF" dengan lembar penandatanganan di halaman detail RAB.

### Sprint 5 (Fase 3.2: Keamanan, Audit Log & Salin Harga)
- [ ] **[BE]** Implementasi tabel dan interceptor `audit_logs` (mencatat user, waktu, aksi, payload before/after).
- [ ] **[BE]** Refactor autentikasi: simpan JWT di HttpOnly cookie bukan localStorage; pasang rate-limiter login.
- [ ] **[BE/FE]** Endpoint & UI fitur "Salin Harga Tahun Lalu" (menyalin harga lokal dari tahun sebelumnya tanpa menimpa data yang sudah ada).
- [ ] **[DevOps]** Buat `docker-compose.prod.yml`, Caddy reverse-proxy SSL, dan script backup DB otomatis.

---

## 5. Rujukan Tabel Test Case & Kriteria Penerimaan

| ID | Skenario Pengujian | Hasil yang Diharapkan | Prioritas |
| :--- | :--- | :--- | :--- |
| **TC-01** | Pratinjau pekerjaan `3.6.1.10`, overhead 10%, harga demo 2026 | D = 839.950; E = 83.995; F = 923.945 | P0 (Fase 1) |
| **TC-02** | Pekerjaan `1.1.1.1` pada kategori `none`, lalu diubah ke `down_0` | F = 22.540,1, lalu 22.540 | P0 (Fase 1) |
| **TC-03** | Pekerjaan `3.6.9.9` bertingkat dengan basis `final`, lalu `direct` | F = 2.115.179, lalu 1.930.390 | P0 (Fase 1) |
| **TC-04** | Rekapitulasi: Real Cost 1.234.567,89, PPN 10% | PPN = 123.456,789; Total = 1.358.024,679; Dibulatkan = 1.358.000 | P0 (Fase 1) |
| **TC-05** | Salah satu harga lokal komponen dikosongkan | Item bernilai null + error rincian kode/nama; rekap.lengkap = false | P0 (Fase 1) |
| **TC-06** | Penambahan komponen rekursif (A memakai B, B memakai A) | Ditolak dengan galat siklus terdeteksi | P0 (Fase 1) |
| **TC-07** | Proyek difinalkan, lalu harga lokal diubah di kemudian hari | Harga satuan terkunci & total RAB tidak berubah | P0 (Fase 1) |
| **TC-08** | Menambah/mengubah item pada proyek berstatus final | Ditolak HTTP 400: Proyek sudah final dan dikunci | P0 (Fase 1) |
| **TC-09** | Operator BUMDes A membuka proyek milik BUMDes B via API | Ditolak HTTP 403 Forbidden | P0 (Fase 1) |
| **TC-10** | Viewer mencoba memanggil endpoint mutasi data (POST/PATCH/DELETE) | Ditolak HTTP 403: Peran Anda hanya bisa melihat | P0 (Fase 1) |
| **TC-11** | Volume bernilai 12,3456 disimpan dan dibuka kembali | Tampil 12,3456 di mode ubah dan 12,35 di mode baca | P1 (Fase 1) |
| **TC-12** | Finalisasi proyek RAB tanpa bab atau tanpa item | Ditolak HTTP 400: RAB masih kosong | P1 (Fase 1) |
| **TC-13** | Impor dataset besar AHSP 2026 & hitung RAB 12 bab | Real Cost Rp 249.491.694,16 & Dibulatkan Rp 249.491.000 | P0 (Fase 2) |
