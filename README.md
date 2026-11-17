# RAB Desa: MVP

Backend NestJS (Express) + Prisma + PostgreSQL. Frontend Next.js 14 (App Router) + Mantine 7.
Skema mengikuti ERD MVP (tabel: bumdes, users, master_kategori, master_pekerjaan, master_sumber_daya,
master_koefisien, harga_lokal, rab_proyek, rab_bab, rab_item).

## Menjalankan
```bash
# 1. Database
docker run -d --name rabmvp-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=rabmvp -p 5432:5432 -v rabmvp-data:/var/lib/postgresql/data postgres:16

# 2. Backend (terminal 1)
cd backend
cp .env.example .env          # Windows CMD: copy .env.example .env
npm install                   # otomatis menjalankan prisma generate
npx prisma migrate dev --name init
npm run seed
npm run start:dev             # http://localhost:3001

# 3. Frontend (terminal 2)
cd frontend
cp .env.example .env.local
npm install
npm run dev                   # http://localhost:3000
```

## Akun demo (password: password123)
`superadmin@rab.test` (kelola master, desa, pengguna) · `operator@desa.test` · `viewer@desa.test`

## Cek cepat
Login operator, buka Proyek, buat proyek (overhead 10%), tambah bab, tambah item `3.6.1.10` volume 1.
Harga satuan harus **923.945** (harga demo tahun 2026; pakai tahun proyek 2026).

## Cara kerja
- Draft: harga satuan dihitung langsung dari `harga_lokal` BUMDes pada tahun proyek: D = jumlah(koefisien x harga),
  F = D x (1 + overhead%), dipotong ke rupiah.
- Finalisasi: harga satuan dan total tiap item disimpan ke kolom `*_terkunci`, proyek terkunci.
- Operator/viewer hanya melihat data BUMDes-nya sendiri. Viewer tidak bisa mengubah apa pun.

## Penyimpangan kecil dari ERD
- `rab_item.volume` dilebarkan menjadi decimal(14,4) (Excel contoh menyimpan volume berdesimal panjang).
- Ditambah unique (bumdes_id, sumber_daya_id, tahun) di `harga_lokal` agar satu harga per tahun.

## Belum ada
Impor Excel AHSP, ekspor Excel/PDF resmi (saat ini cetak lewat browser), terbilang, audit log, versi edisi AHSP,
AHS bertingkat, item di luar AHSP, validasi input lengkap (class-validator), tes otomatis.
Token login disimpan di localStorage: cukup untuk uji coba, ganti ke cookie httpOnly sebelum produksi.
Aturan pembulatan (dipotong ke rupiah, total ke ribuan) adalah dugaan dari file Excel contoh; verifikasi.
