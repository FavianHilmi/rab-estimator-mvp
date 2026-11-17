# PRD: RAB Desa

Product Requirements Document · Versi 1.0, acuan pengembangan · 21 Oktober 2026

## 1. Ringkasan produk

RAB Desa adalah aplikasi web multi-pengguna (SaaS) untuk menyusun Rencana Anggaran Biaya (RAB) pekerjaan fisik desa dan BUMDes berdasarkan Analisis Harga Satuan Pekerjaan (AHSP) kementerian. Koefisien tenaga, bahan, dan alat tiap pekerjaan sama untuk semua desa dan dikelola admin sistem. Tiap desa mengisi harga upah, bahan, dan alat sesuai kondisi setempat, lalu menyusun RAB dengan memilih pekerjaan dan mengisi volume.

Sistem menghitung harga satuan, jumlah harga, subtotal, dan rekapitulasi; mengunci angka saat RAB difinalkan; dan mencetaknya. Sasaran awal adalah pendamping desa dan operator BUMDes (puluhan pengguna), dengan rancangan yang siap tumbuh ke ratusan pengguna tanpa perubahan arsitektur.

Dokumen ini adalah acuan pengembangan. Kolom Status pada tabel menandai apa yang sudah ada di kode (Selesai) dan apa yang belum (Rencana).

## 2. Tujuan dan batasan

**Tujuan**

1. Harga satuan, jumlah harga, subtotal, dan rekapitulasi dihitung otomatis dan konsisten di layar, cetakan, dan berkas ekspor.
2. Operator desa dapat menyusun RAB tanpa memahami rumus analisis.
3. Data AHSP dikelola di satu tempat dan dipakai semua desa; yang berbeda per desa hanya harga dasar.
4. RAB yang sudah final tidak berubah oleh perubahan harga atau data master.
5. Data satu desa tidak dapat diakses desa lain.
6. Mudah dipahami dan dirawat oleh satu pengembang.

**Bukan tujuan rilis awal**

- Mode offline; penagihan dan pembayaran otomatis; integrasi dengan sistem keuangan desa; aplikasi mobile native.
- Item di luar AHSP, tabel hitung volume, dan banyak edisi AHSP sekaligus (spesifikasinya ada di bagian 12).
- Tampilan ponsel yang nyaman untuk mengedit RAB. Melihat dan mencetak di ponsel cukup; mengedit dioptimalkan untuk laptop.

## 3. Pengguna, peran, dan hak akses

| Peran | Siapa | Ruang lingkup |
| --- | --- | --- |
| superadmin | Pemilik produk dan ahli perhitungan yang mengelola data master | Seluruh sistem; tidak terikat ke satu BUMDes |
| operator | Pendamping desa atau staf BUMDes yang menyusun RAB | Tepat satu BUMDes |
| viewer | Kepala desa, bendahara, BPD, atau peninjau lain | Tepat satu BUMDes, hanya baca |

**Aturan akun.** Operator dan viewer wajib memiliki `bumdes_id`; akun tanpa BUMDes ditolak dengan galat 403. Superadmin tidak memiliki `bumdes_id` dan harus menyebut BUMDes yang dituju saat membuat proyek atau mengisi harga.

**Matriks hak akses (R1)**

| Aksi | superadmin | operator | viewer |
| --- | --- | --- | --- |
| Melihat proyek dan RAB | Semua BUMDes | BUMDes sendiri | BUMDes sendiri |
| Membuat dan mengubah proyek (nama, overhead, PPN) | Ya | Ya | Tidak |
| Menambah dan menghapus bab dan item, mengubah volume | Ya, saat draft | Ya, saat draft | Tidak |
| Memfinalkan proyek | Ya | Ya | Tidak |
| Melihat dan mengisi harga lokal | Ya, setelah memilih BUMDes | Ya | Hanya melihat |
| Melihat master kategori, sumber daya, pekerjaan | Ya | Ya | Ya |
| Mengubah master dan koefisien | Ya | Tidak | Tidak |
| Pratinjau perhitungan pekerjaan | Ya | Tidak | Tidak |
| Mengelola BUMDes dan pengguna | Ya | Tidak | Tidak |

## 4. Cakupan dan status rilis

| Rilis | Isi | Status |
| --- | --- | --- |
| R1 (MVP) | Login dan peran; master kategori, sumber daya, pekerjaan, koefisien; AHS bertingkat dengan deteksi siklus; pembulatan per kategori; harga lokal per BUMDes per tahun; proyek, bab, item, volume; rekapitulasi; draft dan final dengan harga terkunci; cetak lewat browser | Selesai, belum diuji menyeluruh |
| R1.1 | Kategori bertingkat; impor berkas AHSP dengan laporan validasi; tes otomatis terhadap data uji (bagian 15) | Rencana |
| R2 | Ekspor .xlsx dan PDF; terbilang; audit log; login aman; validasi input lengkap; keanggotaan banyak desa; salin harga tahun lalu; lokasi proyek dan tanda tangan; peran editor data AHSP | Rencana |
| R3 | Edisi AHSP berstatus draft, terbit, arsip; item di luar AHSP; tabel hitung volume; kategori sumber daya dan konversi satuan; paket dan penagihan | Opsional |

## 5. Istilah

| Istilah | Arti dalam sistem |
| --- | --- |
| AHSP | Analisis Harga Satuan Pekerjaan: acuan kementerian yang memuat koefisien tiap pekerjaan |
| Kategori | Pengelompokan pekerjaan (bab). Menyimpan aturan pembulatan harga satuan |
| Pekerjaan (AHS) | Satu analisis: kode analisa, uraian, satuan, dan daftar komponen |
| Sumber daya | Tenaga (upah), bahan, atau alat yang harganya diisi desa |
| Koefisien | Jumlah sumber daya (atau pekerjaan lain) yang dibutuhkan untuk satu satuan pekerjaan |
| Harga lokal | Harga satu sumber daya di satu BUMDes pada satu tahun |
| D | Biaya langsung: jumlah semua komponen |
| E | Biaya umum dan keuntungan (overhead): D × persentase overhead proyek |
| F | Harga satuan pekerjaan: D + E, lalu dibulatkan sesuai kategori |
| Bab RAB | Pengelompokan item dalam satu proyek (I, II, III, dan seterusnya) |
| Item RAB | Satu pekerjaan dalam proyek beserta volumenya |
| Terkunci | Harga satuan dan total yang disimpan saat proyek difinalkan |
| Real Cost | Jumlah seluruh bab sebelum PPN |

## 6. Alur utama

**A. Persiapan data (superadmin)**

1. Buat BUMDes dan akun operator atau viewer yang terhubung ke BUMDes itu.
2. Buat kategori dan tentukan aturan pembulatannya.
3. Buat sumber daya (tipe, kode, nama, satuan).
4. Buat pekerjaan, lalu tambahkan komponen: sumber daya, atau pekerjaan lain bila analisisnya bertingkat.
5. Periksa angka dengan Pratinjau perhitungan (D, E, F) pada halaman detail pekerjaan.

**B. Menyusun RAB (operator)**

1. Masuk, lalu isi harga lokal semua sumber daya untuk tahun proyek di menu Harga lokal.
2. Buat proyek: nama, tahun, overhead, PPN. Sistem membuat nomor dokumen.
3. Tambah bab, lalu tambah item dengan memilih pekerjaan dari daftar yang bisa dicari dan mengisi volume.
4. Baca pesan merah pada baris yang harganya belum lengkap, lengkapi harga lokal, dan periksa rekapitulasi.
5. Finalkan proyek. Harga satuan dan total terkunci; RAB tidak bisa diubah lagi.
6. Cetak.

**C. Meninjau (viewer)** membuka proyek BUMDes-nya, membaca, dan mencetak. Semua kontrol ubah disembunyikan.

## 7. Aturan perhitungan

Semua perhitungan dilakukan di backend dengan tipe desimal (Decimal.js), tidak memakai floating point. Satu mesin hitung (`calc.service.ts`) dipakai oleh layar, pratinjau, finalisasi, dan nanti ekspor.

| No | Aturan |
| --- | --- |
| C1 | Harga sumber daya diambil dari `harga_lokal` milik BUMDes proyek untuk **tahun proyek** (bukan tahun hari ini) |
| C2 | Jumlah komponen sumber daya = koefisien × harga lokal |
| C3 | Jumlah komponen berupa pekerjaan lain = koefisien × nilai pekerjaan itu: F bila `basis_harga` = final, D bila direct |
| C4 | D = jumlah semua komponen |
| C5 | E = D × overhead\_persen proyek ÷ 100. Overhead proyek berlaku juga untuk pekerjaan yang dipakai sebagai komponen |
| C6 | F = D + E. Bila kategori pekerjaan berpembulatan `down_0`, F dipotong ke bilangan bulat ke bawah. Bila `none`, F tidak dibulatkan |
| C7 | Jumlah item = volume × F, tidak dibulatkan |
| C8 | Subtotal bab = jumlah semua item di dalamnya |
| C9 | Real Cost = jumlah semua subtotal bab. PPN = Real Cost × ppn\_persen ÷ 100. Total = Real Cost + PPN |
| C10 | Dibulatkan = Total dipotong ke bawah kelipatan 1.000 |
| C11 | Status draft: harga satuan dihitung ulang setiap RAB dibuka. Status final: dibaca dari `harga_satuan_terkunci` dan `total_harga_terkunci` |
| C12 | Harga lokal yang kosong pada komponen mana pun menghentikan perhitungan pekerjaan itu dengan pesan yang menyebut kode dan nama sumber daya yang kosong. Item lain tetap dihitung, dan `rekap.lengkap` bernilai false |
| C13 | Pekerjaan tanpa komponen tidak dapat dihitung |
| C14 | Siklus (A memakai B, B memakai A, termasuk tak langsung) ditolak saat komponen ditambahkan, dan terdeteksi lagi saat menghitung |
| C15 | Dalam satu permintaan, hasil tiap pekerjaan disimpan sementara (memo) agar pekerjaan yang dipakai berulang tidak dihitung ulang. Hasil yang belum lengkap tidak disimpan |

**Contoh angka (data demo, tahun 2026, overhead 10%)**

| Kasus | Perhitungan | Hasil |
| --- | --- | --- |
| Pekerjaan 3.6.1.10, pembulatan down\_0 | Tenaga: 0,2×100.000 + 0,1×150.000 + 0,01×150.000 + 0,0033×200.000 = 37.160. Bahan: 71,91×10.000 + 8,32×10.000 + 0,049×10.000 = 802.790. D = 839.950; E = 83.995 | F = 923.945 |
| Pekerjaan 1.1.1.1, pembulatan none | D = 0,2×100.000 + 0,0491×10.000 = 20.491; E = 2.049,1 | F = 22.540,1 |
| Pekerjaan 1.1.1.1 bila kategori diubah ke down\_0 | Nilai yang sama, dipotong | F = 22.540 |
| Pekerjaan 3.6.9.9 (2 × pekerjaan 3.6.1.10 + 0,5 OH tukang), basis final | D = 2×923.945 + 0,5×150.000 = 1.922.890 | F = 2.115.179 |
| Pekerjaan 3.6.9.9, basis direct | D = 2×839.950 + 0,5×150.000 = 1.754.900 | F = 1.930.390 |
| Rekapitulasi, Real Cost 1.234.567,89 dan PPN 10% | PPN = 123.456,789; Total = 1.358.024,679 | Dibulatkan = 1.358.000 |

Basis final berarti overhead dihitung dua kali pada bagian yang memakai pekerjaan lain (sekali di pekerjaan komponen, sekali di pekerjaan induk). Basis direct menghindarinya. Pilihan mana yang sesuai aturan resmi belum dipastikan (bagian 17), sehingga sistem menyediakan keduanya dengan nilai awal final.

## 8. Model data

Database PostgreSQL dengan Prisma. Setiap tabel memiliki `id` integer (kunci relasi) dan `uuid` unik (dipakai di URL dan API). Nama tabel dan kolom memakai snake\_case. Status: Selesai.

| Tabel | Kolom | Tipe | Aturan |
| --- | --- | --- | --- |
| bumdes | id, uuid | int PK, string | uuid unik |
| bumdes | kode | string | Unik, mis. BMD-3525 |
| bumdes | nama, desa, kecamatan | string | Wajib |
| users | id, uuid | int PK, string | uuid unik |
| users | bumdes\_id | int FK ke bumdes | Kosong untuk superadmin; wajib untuk operator dan viewer |
| users | nama | string | Wajib |
| users | email | string | Unik, disimpan huruf kecil |
| users | password | string | Hash bcrypt (cost 10); panjang minimal 8 karakter sebelum di-hash |
| users | role | string | superadmin, operator, atau viewer |
| master\_kategori | id, uuid | int PK, string | uuid unik |
| master\_kategori | kode, nama | string | kode unik |
| master\_kategori | pembulatan | string | none atau down\_0; nilai awal down\_0 |
| master\_pekerjaan | id, uuid | int PK, string | uuid unik |
| master\_pekerjaan | kategori\_id | int FK ke master\_kategori | Wajib |
| master\_pekerjaan | kode | string | Unik (kode analisa), mis. 3.6.1.10 |
| master\_pekerjaan | nama, satuan | string | Wajib |
| master\_sumber\_daya | id, uuid | int PK, string | uuid unik |
| master\_sumber\_daya | tipe | string | tenaga, bahan, atau alat |
| master\_sumber\_daya | kode | string | Unik, mis. L.01, B.012 |
| master\_sumber\_daya | nama, satuan | string | Wajib |
| master\_koefisien | id, uuid | int PK, string | uuid unik |
| master\_koefisien | pekerjaan\_id | int FK ke master\_pekerjaan | Terhapus bersama pekerjaannya |
| master\_koefisien | sumber\_daya\_id | int FK ke master\_sumber\_daya | Boleh kosong |
| master\_koefisien | sub\_pekerjaan\_id | int FK ke master\_pekerjaan | Boleh kosong. Tepat satu dari sumber\_daya\_id dan sub\_pekerjaan\_id terisi (divalidasi aplikasi) |
| master\_koefisien | basis\_harga | string | final atau direct; nilai awal final; hanya berlaku bila sub\_pekerjaan\_id terisi |
| master\_koefisien | koefisien | decimal(10,4) | Lebih dari 0 |
| harga\_lokal | id, uuid | int PK, string | uuid unik |
| harga\_lokal | bumdes\_id, sumber\_daya\_id | int FK | Wajib |
| harga\_lokal | tahun | int | Wajib |
| harga\_lokal | harga | decimal(18,2) | Nol atau lebih. Unik pada (bumdes\_id, sumber\_daya\_id, tahun) |
| rab\_proyek | id, uuid | int PK, string | uuid unik |
| rab\_proyek | bumdes\_id | int FK ke bumdes | Wajib |
| rab\_proyek | nomor\_dokumen | string | Unik, dibuat otomatis |
| rab\_proyek | nama\_proyek | string | Wajib |
| rab\_proyek | tahun | int | Tahun harga lokal yang dipakai |
| rab\_proyek | overhead\_persen | decimal(5,2) | 0 sampai 100; nilai awal 10 |
| rab\_proyek | ppn\_persen | decimal(5,2) | 0 sampai 100; nilai awal 0 |
| rab\_proyek | status | string | draft atau final; nilai awal draft |
| rab\_bab | id, uuid | int PK, string | uuid unik |
| rab\_bab | rab\_id | int FK ke rab\_proyek | Terhapus bersama proyek |
| rab\_bab | kode, nama\_bab | string | Wajib. kode bebas, mis. I, II |
| rab\_item | id, uuid | int PK, string | uuid unik |
| rab\_item | bab\_id | int FK ke rab\_bab | Terhapus bersama bab |
| rab\_item | pekerjaan\_id | int FK ke master\_pekerjaan | Wajib |
| rab\_item | volume | decimal(14,4) | Nol atau lebih; disimpan dengan presisi penuh, dibulatkan hanya saat tampil |
| rab\_item | harga\_satuan\_terkunci | decimal(24,6) | Kosong saat draft; diisi saat finalisasi |
| rab\_item | total\_harga\_terkunci | decimal(24,6) | Kosong saat draft; diisi saat finalisasi |

**Aturan data**

- Nomor dokumen: `RAB/{tahun}/{kode BUMDes}/{nomor urut 3 digit}`. Nomor urut = jumlah proyek BUMDes itu pada tahun itu + 1.
- Urutan tampil bab dan item = urutan pembuatan (id naik).
- Menghapus kategori, sumber daya, atau pekerjaan yang masih dipakai ditolak. Menghapus bab atau proyek ikut menghapus isinya.
- Nilai desimal dikirim API sebagai string.

## 9. Spesifikasi API

**Konvensi**

- Alamat dasar diatur di variabel `NEXT_PUBLIC_API_URL` (awal `http://localhost:3001`). Isi dan balasan berformat JSON.
- Semua endpoint selain login memerlukan header `Authorization: Bearer <token>`. Token JWT berlaku 8 jam; isinya `sub` (id pengguna), `role`, `bumdesId`.
- Objek di path dikenali lewat uuid.
- Galat berbentuk `{statusCode, message}`: 400 validasi, 401 token tidak valid atau kedaluwarsa, 403 tidak berhak, 404 tidak ada.
- Hak akses selalu diperiksa di backend; menyembunyikan tombol di layar bukan pengamanan.

**Autentikasi**

| Metode | Path | Peran | Isi | Balasan |
| --- | --- | --- | --- | --- |
| POST | /auth/login | Publik | email, password | token, user (nama, role, bumdes) |
| GET | /me | Semua | - | nama, role, bumdes |

**Master data**

| Metode | Path | Peran | Isi atau parameter | Balasan |
| --- | --- | --- | --- | --- |
| GET | /kategori | Semua | - | Daftar kategori, urut kode |
| POST | /kategori | superadmin | kode, nama, pembulatan (opsional) | Kategori |
| PATCH | /kategori/:uuid | superadmin | pembulatan | Kategori |
| DELETE | /kategori/:uuid | superadmin | - | ok |
| GET | /sumber-daya | Semua | - | Daftar, urut tipe lalu kode |
| POST | /sumber-daya | superadmin | tipe, kode, nama, satuan | Sumber daya |
| DELETE | /sumber-daya/:uuid | superadmin | - | ok |
| GET | /pekerjaan | Semua | q (opsional): awalan kode atau bagian nama | Daftar pekerjaan beserta kategori |
| GET | /pekerjaan/:uuid | Semua | - | Pekerjaan, kategori, dan komponen (sumber daya atau pekerjaan lain) |
| GET | /pekerjaan/:uuid/hitung | superadmin | tahun, overhead, bumdesUuid | d, e, f, pembulatan |
| POST | /pekerjaan | superadmin | kategoriUuid, kode, nama, satuan | Pekerjaan |
| DELETE | /pekerjaan/:uuid | superadmin | - | ok |
| POST | /pekerjaan/:uuid/koefisien | superadmin | koefisien, dan sumberDayaUuid atau (subPekerjaanUuid, basisHarga) | Komponen |
| DELETE | /koefisien/:uuid | superadmin | - | ok |
| GET | /bumdes | Semua | - | superadmin: semua BUMDes; lainnya: miliknya |
| POST | /bumdes | superadmin | kode, nama, desa, kecamatan | BUMDes |
| GET | /users | superadmin | - | Daftar pengguna tanpa password |
| POST | /users | superadmin | nama, email, password, role, bumdesUuid | uuid |

**Harga lokal**

| Metode | Path | Peran | Isi atau parameter | Balasan |
| --- | --- | --- | --- | --- |
| GET | /harga | Semua | tahun (awal: tahun berjalan), bumdesUuid (wajib untuk superadmin) | Semua sumber daya beserta harga atau null bila belum diisi |
| PUT | /harga/:sumberDayaUuid | superadmin, operator | tahun, harga, bumdesUuid (superadmin) | ok; menyimpan atau memperbarui |

**Proyek dan RAB**

| Metode | Path | Peran | Isi atau parameter | Balasan |
| --- | --- | --- | --- | --- |
| GET | /proyek | Semua | - | Daftar proyek (superadmin: semua; lainnya: BUMDes sendiri) |
| POST | /proyek | superadmin, operator | namaProyek, tahun, overheadPersen, ppnPersen, bumdesUuid (superadmin) | Proyek |
| PATCH | /proyek/:uuid | superadmin, operator | namaProyek, overheadPersen, ppnPersen | Proyek; hanya saat draft |
| GET | /proyek/:uuid | Semua | - | proyek, bab (beserta item), rekap |
| POST | /proyek/:uuid/finalisasi | superadmin, operator | - | ok; menghitung semua item, mengunci harga, status final |
| POST | /proyek/:uuid/bab | superadmin, operator | kode, namaBab | Bab |
| DELETE | /bab/:uuid | superadmin, operator | - | ok |
| POST | /bab/:uuid/item | superadmin, operator | pekerjaanUuid, volume | Item |
| PATCH | /item/:uuid | superadmin, operator | volume | Item |
| DELETE | /item/:uuid | superadmin, operator | - | ok |

Bentuk balasan `GET /proyek/:uuid`:

```json
{
  "proyek": { "uuid": "...", "nomorDokumen": "RAB/2026/BMD-0001/001", "namaProyek": "...", "tahun": 2026, "overheadPersen": "10", "ppnPersen": "0", "status": "draft" },
  "bab": [ { "uuid": "...", "kode": "I", "namaBab": "Pekerjaan Dinding", "subtotal": "92394.5",
             "items": [ { "uuid": "...", "kode": "3.6.1.10", "nama": "...", "satuan": "m2", "volume": "0.1",
                          "hargaSatuan": "923945", "total": "92394.5", "error": null } ] } ],
  "rekap": { "realCost": "92394.5", "ppn": "0", "total": "92394.5", "dibulatkan": "92000", "lengkap": true }
}
```

Bila harga lokal belum lengkap, `hargaSatuan` dan `total` item bernilai null, `error` berisi pesan, dan `rekap.lengkap` bernilai false.

## 10. Validasi dan pesan galat

| Situasi | Status | Pesan |
| --- | --- | --- |
| Email atau password salah | 401 | Email atau password salah |
| Token tidak ada atau kedaluwarsa | 401 | Unauthorized |
| Viewer mengubah data | 403 | Peran Anda hanya bisa melihat |
| Bukan superadmin pada aksi master | 403 | Hanya superadmin |
| Membuka proyek BUMDes lain | 403 | Tidak punya akses ke proyek ini |
| Operator atau viewer tanpa BUMDes | 403 | Akun belum terhubung ke BUMDes |
| Superadmin tidak memilih BUMDes | 400 | Pilih desa/BUMDes terlebih dahulu |
| Mengubah proyek final | 400 | Proyek sudah final dan dikunci |
| Field wajib kosong | 400 | Field wajib: {nama field} |
| Kode atau email sudah ada | 400 | Data dengan kode/nilai itu sudah ada |
| Menghapus data yang masih dipakai | 400 | Data masih dipakai oleh data lain |
| Tipe sumber daya tidak valid | 400 | Tipe harus tenaga, bahan, atau alat |
| Pembulatan tidak valid | 400 | Pembulatan harus none atau down\_0 |
| Koefisien nol atau negatif | 400 | Koefisien harus lebih dari 0 |
| Komponen tidak menyebut tepat satu jenis | 400 | Isi salah satu: sumber daya atau pekerjaan lain |
| Komponen menimbulkan siklus | 400 | Ditolak: menimbulkan siklus (pekerjaan saling memakai satu sama lain) |
| Harga lokal kosong | 400 | Harga lokal {tahun} belum diisi: {kode nama, ...} |
| Pekerjaan tanpa komponen | 400 | Pekerjaan {kode} belum punya koefisien |
| Volume atau harga negatif | 400 | Volume tidak valid, Harga tidak valid |
| Overhead atau PPN di luar 0 sampai 100 | 400 | overheadPersen tidak valid, ppnPersen tidak valid |
| Finalisasi RAB tanpa item | 400 | RAB masih kosong |
| Password kurang dari 8 karakter | 400 | Password minimal 8 karakter |
| Role tidak valid | 400 | Role tidak valid |
| Operator atau viewer dibuat tanpa BUMDes | 400 | Operator/viewer wajib dihubungkan ke BUMDes |

## 11. Spesifikasi layar

Semua layar selain login dibungkus komponen `AppPage`: belum login diarahkan ke login; halaman bertanda superadmin menolak peran lain sebelum isinya dibuat. Elemen berkelas `noprint` disembunyikan saat dicetak. Kolom angka menyimpan hanya saat ditinggalkan dan nilainya berubah. Aksi merusak (hapus bab, hapus kategori, finalkan) meminta konfirmasi.

| Rute | Peran | Isi dan perilaku |
| --- | --- | --- |
| / | Publik | Form email dan password. Berhasil: simpan sesi, menuju /proyek. Gagal: tampilkan pesan |
| /proyek | Semua | Tabel proyek (nomor, nama, BUMDes, tahun, status) dengan tautan ke detail. Form Proyek baru untuk superadmin dan operator: BUMDes (hanya superadmin), nama, tahun, overhead (awal 10), PPN (awal 0) |
| /proyek/\[uuid\] | Semua | Kepala proyek (nama, nomor, tahun, status), kolom overhead dan PPN (hanya draft dan bisa menulis), tombol Finalkan dan Cetak. Kartu per bab dengan tabel item: kode, uraian, volume (bisa diedit saat draft), satuan, harga satuan, jumlah harga, subtotal. Pesan merah pada item yang harganya belum lengkap dan peringatan kuning bila rekap belum lengkap. Tabel rekap A sampai D. Form Tambah bab (kode awal romawi otomatis) dan Tambah item (bab, pekerjaan yang bisa dicari, volume) hanya saat draft dan bisa menulis |
| /harga | Semua | Pilih tahun (awal tahun berjalan) dan, untuk superadmin, BUMDes. Tabel semua sumber daya dengan kolom harga; kolom kosong ditandai. Viewer hanya melihat |
| /admin/pekerjaan | superadmin | Tabel kategori dengan pilihan pembulatan yang langsung tersimpan, form kategori baru, form pekerjaan baru, dan tabel pekerjaan dengan tautan ke detail |
| /admin/pekerjaan/\[uuid\] | superadmin | Tabel komponen (sumber daya atau pekerjaan lain beserta basis harga), form Tambah komponen dengan pilihan jenis, dan Pratinjau perhitungan (BUMDes, tahun, overhead) yang menampilkan D, E, F. Hasil pratinjau dihapus setiap komponen berubah |
| /admin/sumber-daya | superadmin | Form dan tabel sumber daya dengan aksi hapus |
| /admin/desa | superadmin | Form dan tabel BUMDes; form dan tabel pengguna. Pilihan BUMDes pada form pengguna hanya muncul untuk peran non-superadmin |

## 12. Spesifikasi fitur rilis berikutnya

Status semua bagian ini: Rencana.

### 12.1 Kategori bertingkat (R1.1)

Struktur AHSP berbentuk pohon berkode, mis. 1, lalu 1.3, lalu 1.3.1, lalu pekerjaan 1.3.1.1. Berkas sumber edisi 2026 memuat 134 judul pada empat tingkat dan sekitar 733 pekerjaan berkode angka murni; pekerjaan berada di tingkat 3 sampai 5. Kategori yang datar tidak cukup.

- `master_kategori`: tambah `parent_id` (FK ke tabel sendiri; kosong berarti bab tingkat teratas), `jenis` (ahs atau sumber\_daya), dan `urutan` (opsional). Kunci unik berubah dari `kode` menjadi (`jenis`, `kode`).
- `pembulatan` menjadi boleh kosong dan diwarisi dari induk terdekat yang memiliki nilai. Bab tingkat teratas wajib berisi nilai. Mesin hitung menelusuri induk ke atas untuk menemukannya.
- `master_pekerjaan.kategori_id` menunjuk judul terdekat di tingkat mana pun. Tambah `catatan` (teks, boleh kosong) untuk baris keterangan di bawah uraian.
- `master_sumber_daya.kategori_id` opsional, hanya ke kategori berjenis sumber\_daya.
- Validasi: induk bukan diri sendiri maupun turunannya; jenis induk dan anak sama; kedalaman maksimum 6; pekerjaan hanya menunjuk kategori berjenis ahs.
- Tampilan: halaman master menampilkan pohon. Pemilih pekerjaan di RAB bertingkat (bab, lalu kategori, lalu pekerjaan) dan tetap bisa dicari.
- Penerimaan: pekerjaan di kategori tanpa nilai pembulatan mengikuti induknya; mengubah nilai di bab mengubah hasil semua turunan; kategori yang membentuk siklus ditolak.

### 12.2 Impor berkas AHSP (R1.1)

Admin mengunggah berkas spreadsheet (.xlsx) AHSP lewat halaman admin. Berkas berisi tiga bagian: (a) daftar sumber daya (nama, satuan, harga acuan) dalam kelompok upah, bahan, dan alat; (b) blok analisis tiap pekerjaan (kode, uraian, satuan, dan komponen: nama, satuan, koefisien); (c) daftar harga satuan pekerjaan beserta keterangan status TETAP, REVISI, atau BARU.

- **Mode uji coba (dry-run)** menampilkan laporan tanpa menulis ke database. Mode tulis idempoten: mengimpor berkas yang sama dua kali tidak menggandakan data.
- **Identitas sumber daya** = nama ternormalisasi (huruf kecil, spasi dirapikan) + satuan baku. Nama sama dengan satuan berbeda adalah dua sumber daya.
- **Satuan baku:** huruf kecil, ³ menjadi 3, ² menjadi 2, bh menjadi buah, lbr menjadi lembar, ltr menjadi liter.
- **Kode sumber daya** yang kosong di sumber dibuat otomatis dengan awalan tipe dan nomor urut (L. untuk tenaga, B. untuk bahan, A. untuk alat).
- **Pencocokan komponen** memakai nama dan satuan. Bila hanya nama yang cocok (satuan berbeda), jangan ditebak: masukkan ke laporan Perlu ditinjau.
- **Komponen yang mengambil harga dari pekerjaan lain** diimpor sebagai komponen bertingkat dengan basis final.
- **Kategori bertingkat** diturunkan dari kode: induk = kode tanpa segmen terakhir. Kode berhuruf di ujung (mis. 2.2.1.1.3a) valid.
- **Diabaikan:** nilai D hasil rumus sumber, persentase overhead di tiap blok, serta definisi nama dan tautan eksternal yang rusak di dalam berkas. Sistem menghitung ulang semuanya.
- **Laporan** memuat jumlah dibuat, diperbarui, dilewati; nama ganda; satuan tidak cocok; blok tanpa harga; komponen tanpa koefisien; siklus; kode tidak unik.
- **Penerimaan pada berkas edisi 2026:** sekitar 746 pekerjaan dan 134 judul kategori terbaca; laporan memuat 20 nama sumber daya ganda dan 48 pencarian dengan satuan tidak cocok; 13 komponen bertingkat terdeteksi.

### 12.3 Fitur lainnya

| ID | Fitur | Spesifikasi | Kriteria penerimaan |
| --- | --- | --- | --- |
| E1 | Ekspor spreadsheet (.xlsx) dan PDF | Dokumen: RAB (daftar kuantitas dan harga), rekapitulasi, rincian analisis tiap pekerjaan yang dipakai, daftar harga lokal. Isi: nama pekerjaan, lokasi, tahun, nomor dokumen, bab bernomor romawi, kode, uraian, volume, satuan, harga satuan, jumlah, subtotal, rekap A sampai D, terbilang, tempat tanda tangan, tanggal cetak. Angka diambil dari mesin hitung yang sama dengan layar | Angka berkas sama dengan layar; proyek draft diberi tanda Draft; berkas terbuka tanpa galat |
| E2 | Lokasi dan penandatangan proyek | Kolom lokasi pada `rab_proyek`; nama dan jabatan penandatangan per proyek | Tampil di cetakan dan ekspor |
| T1 | Terbilang | Mengubah nilai Dibulatkan menjadi kalimat bahasa Indonesia diakhiri rupiah | 249.491.000 menjadi dua ratus empat puluh sembilan juta empat ratus sembilan puluh satu ribu rupiah |
| A1 | Audit log | Tabel `audit_logs`: waktu, user\_id, bumdes\_id (kosong untuk master), aksi, objek, uuid\_objek, nilai sebelum dan sesudah (json). Dicatat: ubah harga lokal, bab dan item, overhead dan PPN, finalisasi, master dan koefisien, pengguna, login gagal berulang. Operator melihat log desanya; superadmin melihat semua | Setiap perubahan menghasilkan satu baris; log tidak dapat diubah lewat API |
| M1 | Keanggotaan banyak desa | Tabel `memberships` (user\_id, bumdes\_id, role) menggantikan `users.bumdes_id`; pengguna memilih desa aktif; token memuat desa aktif | Pengguna di dua desa berpindah tanpa login ulang; isolasi data tetap |
| V1 | Edisi AHSP | Tabel `ahsp_versions` (tahun unik, nama, status draft, terbit, atau arsip, is\_default); kategori dan pekerjaan terikat ke satu edisi; proyek menyimpan edisinya; edisi terbit yang dipakai proyek terkunci; perbandingan antar edisi | Proyek lama tidak berubah ketika edisi baru terbit |
| X1 | Item di luar AHSP | `rab_item.pekerjaan_id` boleh kosong; tambah uraian, satuan, dan harga satuan manual; ditandai Taksir; ikut subtotal | Tampil dan tercetak dengan penanda |
| L1 | Tabel hitung volume | Tabel `volume_calc_rows` (item, uraian, panjang, lebar, tinggi, jumlah unit, volume); jumlah baris mengisi volume item | Volume item sama dengan jumlah baris |
| U1 | Satuan baku dan konversi | Tabel `units`, `unit_aliases`, dan opsional `resource_conversions` (harga satu satuan diturunkan dari satuan lain dengan faktor) | m3 dan m³ dianggap sama |
| H1 | Salin harga tahun lalu | Menyalin `harga_lokal` satu BUMDes dari satu tahun ke tahun lain; harga yang sudah ada tidak ditimpa kecuali dipilih | Jumlah baris tersalin ditampilkan |
| S1 | Keamanan login | Cookie httpOnly dan secure, verifikasi email, lupa password, pembatasan percobaan login, argon2 | Token tidak lagi di localStorage |
| P1 | Peran editor data AHSP | Boleh mengubah master dan menerbitkan edisi, tanpa akses data keuangan desa | Tidak dapat membuka proyek atau harga desa |

## 13. Kebutuhan non-fungsional

- **Keamanan:** isolasi data antar BUMDes diperiksa di setiap permintaan; password di-hash; HTTPS di produksi; rahasia JWT di variabel lingkungan; batasan hak akses diuji otomatis.
- **Performa:** halaman RAB berisi ratusan baris tampil kurang dari 2 detik pada koneksi biasa; pencarian pekerjaan langsung saat mengetik.
- **Skala:** puluhan pengguna pada tahap awal; arsitektur siap ke ratusan tanpa perubahan struktur. Data kecil (ratusan kategori, ratusan sampai ribuan pekerjaan) cukup dimuat penuh dan disusun di memori.
- **Kegunaan:** antarmuka berbahasa Indonesia; angka berformat Indonesia (titik ribuan, koma desimal); pesan galat menyebut penyebab dan tindakan; melihat dan mencetak nyaman di ponsel.
- **Keandalan:** pencadangan database harian ke penyimpanan terpisah dan uji pemulihan berkala; pemantauan galat dan uptime.
- **Perawatan:** kode ringkas dan terstruktur; satu mesin hitung; semua panggilan API lewat satu pintu di frontend.

## 14. Arsitektur, struktur kode, dan konfigurasi

| Lapisan | Pilihan |
| --- | --- |
| Frontend | Next.js 14 (App Router), Mantine 7, TypeScript |
| Backend | NestJS (Express), TypeScript, Prisma |
| Database | PostgreSQL |
| Perhitungan | Decimal.js di backend |
| Ekspor (R2) | ExcelJS untuk spreadsheet; PDF dari templat HTML atau konversi dari spreadsheet, diputuskan setelah contoh dicoba |
| Hosting | Satu VPS, Docker Compose, Caddy atau Nginx untuk HTTPS |
| Pemantauan | Sentry dan pemantau uptime |

**Backend (`backend/`)**

| File | Peran |
| --- | --- |
| `src/main.ts` | Pintu masuk, CORS |
| `src/app.module.ts` | Perakitan modul dan JWT |
| `src/prisma.service.ts` | Koneksi database. Dipisah agar tidak terjadi impor melingkar |
| `src/auth.ts` | JwtGuard, penanda pengguna, login, `/me` |
| `src/util.ts` | Pemeriksaan hak akses, validasi isian, penerjemah galat database, pemilihan BUMDes |
| `src/calc.service.ts` | Mesin hitung (D, E, F), deteksi siklus |
| `src/master.controller.ts` | Kategori, sumber daya, pekerjaan, koefisien, BUMDes, pengguna |
| `src/rab.controller.ts` | Harga lokal, proyek, bab, item, finalisasi |
| `prisma/schema.prisma`, `prisma/seed.ts` | Skema dan data demo |

**Frontend (`frontend/src/`)**

| Folder | Isi |
| --- | --- |
| `app/` | Rute; tiap `page.tsx` tipis: memanggil hook lalu merangkai komponen |
| `components/` | `AppPage` (cek login dan peran, menyediakan `useMe`), `Shell`, `ui/` (ErrorAlert, ConfirmButton, BlurNumberInput), dan komponen per fitur (proyek, rab, harga, admin) yang hanya menampilkan data lewat props |
| `hooks/` | `useFetch` dan `useAction`; `useProyek`, `useHarga`, `useMaster`; `useMe` |
| `lib/` | `http.ts` (satu-satunya pintu ke backend dan penyimpan sesi), `format.ts`, `constants.ts` |
| `types/api.ts` | Bentuk data dari backend; ubah di sini lebih dulu bila API berubah |

Menambah fitur: tipe di `types/api.ts`, lalu fungsi di hook, lalu komponen, lalu rangkai di `page.tsx`.

**Konfigurasi**

| Variabel | Lokasi | Keterangan |
| --- | --- | --- |
| DATABASE\_URL | backend/.env | Alamat PostgreSQL |
| JWT\_SECRET | backend/.env | String acak panjang; wajib diganti di produksi |
| PORT | backend/.env | Awal 3001 |
| CORS\_ORIGIN | backend/.env | Asal frontend, awal http://localhost:3000 |
| NEXT\_PUBLIC\_API\_URL | frontend/.env.local | Alamat backend |

**Data demo (`npm run seed`)**

- Akun (password password123, wajib diganti di produksi): superadmin@rab.test, operator@desa.test, viewer@desa.test.
- BUMDes Contoh (BMD-0001); tujuh sumber daya dengan harga 2026; kategori 3 (down\_0) dan 1 (none); pekerjaan 3.6.1.10, 1.1.1.1, dan 3.6.9.9.

## 15. Data uji dan kriteria penerimaan

| ID | Skenario | Hasil yang diharapkan |
| --- | --- | --- |
| TC-01 | Pratinjau pekerjaan 3.6.1.10, overhead 10%, harga demo 2026 | D = 839.950; E = 83.995; F = 923.945 |
| TC-02 | Pekerjaan 1.1.1.1 pada kategori none, lalu diubah ke down\_0 | F = 22.540,1, lalu 22.540 |
| TC-03 | Pekerjaan 3.6.9.9 dengan basis final, lalu direct | F = 2.115.179, lalu 1.930.390 |
| TC-04 | Rekapitulasi: Real Cost 1.234.567,89, PPN 10% | PPN = 123.456,789; Total = 1.358.024,679; Dibulatkan = 1.358.000 |
| TC-05 | Item dengan satu harga lokal dikosongkan | Item bernilai null dengan pesan yang menyebut kode dan nama; item lain tetap dihitung; rekap.lengkap = false |
| TC-06 | Menambah komponen yang membuat A memakai B dan B memakai A | Ditolak dengan pesan siklus |
| TC-07 | Memfinalkan proyek, lalu mengubah harga lokal | Harga satuan dan total RAB tidak berubah |
| TC-08 | Menambah atau mengubah item pada proyek final | 400: Proyek sudah final dan dikunci |
| TC-09 | Operator BUMDes A membuka proyek BUMDes B melalui API | 403 |
| TC-10 | Viewer memanggil endpoint yang mengubah data | 403 |
| TC-11 | Volume 12,3456 disimpan dan dibuka kembali | Tampil 12,3456 di kolom ubah dan 12,35 di tampilan baca |
| TC-12 | Memfinalkan RAB tanpa item | 400: RAB masih kosong |
| TC-13 | Data uji besar: RAB 12 bab berisi pekerjaan hasil impor | Real Cost 249.491.694,16 dan Dibulatkan 249.491.000 setelah data impor dan harga acuan dimuat |

TC-01 sampai TC-12 harus dijadikan tes otomatis pada mesin hitung dan lapisan hak akses sebelum pilot.

## 16. Risiko dan asumsi

| Risiko atau asumsi | Dampak | Tindakan |
| --- | --- | --- |
| Aturan pembulatan per kategori dan basis harga pekerjaan bertingkat adalah dugaan dari data sumber | Angka bisa selisih dari acuan resmi | Ahli perhitungan memverifikasi ke dokumen AHSP; jadikan tes otomatis |
| Aturan biaya umum dan keuntungan untuk pekerjaan swakelola belum jelas | Nilai awal overhead | Tanyakan ke dinas PMD atau pendamping desa; overhead dibuat parameter per proyek |
| Kode sumber daya wajib unik, sedangkan data sumber tidak selalu memberi kode | Impor tidak otomatis | Pembuatan kode dan laporan Perlu ditinjau |
| Nama sumber daya sama dengan satuan berbeda | Harga salah bila dicocokkan dari nama saja | Identitas = nama + satuan (12.2) |
| Tahap awal belum punya edisi AHSP | Edisi baru menimpa data lama | Edisi AHSP (V1) dimajukan bila dibutuhkan |
| Satu pengguna terikat satu BUMDes | Pendamping banyak desa butuh banyak akun | Keanggotaan banyak desa (M1) |
| Aplikasi belum diuji menyeluruh | Galat tersembunyi | TC-01 sampai TC-12 sebelum pilot |
| Perawatan oleh satu pengembang | Perbaikan lambat | Stack sederhana, pemantauan, tes otomatis, dokumentasi ini |
| Format cetak yang diminta pemeriksa belum dikumpulkan | Ekspor perlu dikerjakan ulang | Kumpulkan contoh dari 1 sampai 2 desa sebelum E1 |

## 17. Pertanyaan terbuka

1. Apakah desa boleh menetapkan biaya umum dan keuntungan, dan berapa nilai wajarnya untuk swakelola? (dinas PMD atau pendamping desa)
2. Untuk komponen yang memakai pekerjaan lain, apakah resminya memakai F atau D? (ahli perhitungan)
3. Apa aturan pembulatan yang benar per bab? (ahli perhitungan)
4. Bagaimana perlakuan PPN dan pajak lain pada pekerjaan desa? (dinas PMD)
5. Apakah kategori dibuat bertingkat sekarang atau ditunda, dan apakah kategori sumber daya ikut?
6. Format cetak seperti apa yang diminta pemeriksa? (pendamping desa pilot)
7. Sumber daya yang sama dengan satuan berbeda: dua sumber daya terpisah atau memakai konversi satuan?
8. Model bisnis: paket, masa uji coba, dan siapa yang membayar (desa, BUMDes, atau pendamping)?
9. Apakah ada ketentuan lokasi penyimpanan data dari desa atau instansi pengguna?

## 18. Peta jalan

- **Fase 1:** uji R1 dengan data demo; tes otomatis TC-01 sampai TC-12; perbaikan galat.
- **Fase 2:** kategori bertingkat (12.1) dan impor berkas AHSP (12.2); ahli perhitungan memeriksa hasil impor; TC-13.
- **Fase 3:** ekspor spreadsheet dan PDF, terbilang, lokasi dan penandatangan (E1, E2, T1); audit log (A1); keamanan login (S1); validasi input lengkap; pencadangan dan pemantauan.
- **Fase 4:** pilot terbatas dengan beberapa pendamping desa; kumpulkan umpan balik dan tetapkan target indikator keberhasilan.
- **Fase 5:** keanggotaan banyak desa, edisi AHSP, item di luar AHSP, tabel volume, paket dan penagihan (M1, V1, X1, L1), sesuai hasil pilot.
