# Design System — RAB Desa

> Panduan desain antarmuka untuk aplikasi web RAB Desa. Dokumen ini mengadaptasi referensi dashboard DesignMD menjadi antarmuka SaaS yang tenang, profesional, padat informasi, dan berorientasi pada pekerjaan administrasi anggaran.

## 1. Tujuan desain

RAB Desa membantu operator BUMDes dan pendamping desa menyusun Rencana Anggaran Biaya berdasarkan AHSP, mengelola harga lokal, memeriksa hasil perhitungan, memfinalkan, serta mencetak dokumen. Antarmuka harus membuat alur tersebut mudah dipahami tanpa mengharuskan pengguna memahami rumus analisis.

Prinsip utama:

- **Clarity over decoration** — utamakan hierarki informasi, tabel yang mudah dipindai, dan angka yang terbaca.
- **Calm and professional** — hindari gradien mencolok, efek glow, dekorasi berlebihan, dan animasi yang tidak perlu.
- **Consistent calculations** — angka pada kartu, tabel, rekapitulasi, dan tampilan cetak harus berasal dari hasil perhitungan sistem yang sama.
- **Visible state** — status Draft, Final, harga belum lengkap, dan akses hanya-baca harus mudah dikenali.
- **Role-aware UI** — tampilkan aksi sesuai peran, tetapi tetap anggap pemeriksaan hak akses backend sebagai sumber keamanan utama.
- **Desktop-first editing** — pengeditan RAB dioptimalkan untuk laptop/desktop; tampilan ponsel tetap mendukung membaca dan mencetak.

## 2. Arah visual

Gunakan struktur dashboard pada referensi: sidebar navigasi yang stabil, header halaman yang ringkas, konten utama dalam panel, kartu ringkasan, dan tabel yang terorganisasi. Jangan menyalin aksen hijau gelap atau latar bergradasi dari referensi. Gunakan permukaan solid, border tipis, serta aksen warna yang terkendali.

### Karakter visual

- Bersih, administratif, modern, dan tepercaya.
- Latar belakang tidak menggunakan gradien.
- Mode terang dan gelap tersedia dengan kontras yang baik.
- Mode terang menggunakan putih dan putih kebiruan sebagai warna dasar.
- Gunakan ikon antarmuka dari satu keluarga ikon konsisten; **jangan menggunakan emotikon** sebagai ikon.
- Jangan menggunakan font-mono untuk judul, teks, tabel, angka, atau kode. Gunakan font sans-serif; kode analisis tetap menggunakan font sans-serif dan dapat dibedakan melalui warna atau label.
- Hindari bayangan tebal. Gunakan border dan perbedaan permukaan untuk membentuk hierarki.
- Transisi singkat hanya untuk perubahan state, dropdown, dialog, dan navigasi.

## 3. Design tokens

Gunakan token semantik agar mode terang dan gelap dapat diganti tanpa mengubah komponen satu per satu.

### 3.1 Tipografi

Font utama: **Inter**. Fallback: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`.

| Token | Nilai | Pemakaian |
|---|---|---|
| `font-sans` | Inter, sans-serif | Semua teks UI |
| `text-xs` | 12px / 16px | Metadata, label tambahan |
| `text-sm` | 14px / 20px | Tabel, input, navigasi, teks sekunder |
| `text-base` | 16px / 24px | Teks isi dan form utama |
| `text-lg` | 18px / 28px | Judul kartu |
| `text-xl` | 20px / 28px | Subjudul halaman |
| `text-2xl` | 24px / 32px | Judul halaman |
| `text-3xl` | 30px / 36px | Angka total utama jika diperlukan |
| `font-normal` | 400 | Isi teks |
| `font-medium` | 500 | Label, tombol, item navigasi |
| `font-semibold` | 600 | Judul, angka ringkasan |
| `font-bold` | 700 | Gunakan secara terbatas untuk total penting |

Gunakan angka tabular bila tersedia agar angka pada kolom tabel sejajar, tetapi jangan menggunakan font-mono. Terapkan format Indonesia: pemisah ribuan titik dan desimal koma.

### 3.2 Warna — light mode

| Token | Nilai | Pemakaian |
|---|---|---|
| `background` | `#F4F7FB` | Latar utama putih kebiruan |
| `surface` | `#FFFFFF` | Panel, kartu, sidebar |
| `surface-muted` | `#F8FAFD` | Area tabel sekunder, input nonaktif |
| `surface-hover` | `#EEF3F9` | Hover baris dan navigasi |
| `border` | `#DCE4EE` | Border panel dan divider |
| `border-strong` | `#C6D2E1` | Outline input atau tabel yang perlu tegas |
| `text-primary` | `#172033` | Judul dan isi utama |
| `text-secondary` | `#586579` | Keterangan dan label |
| `text-muted` | `#7A8799` | Placeholder dan metadata |
| `primary` | `#285EA8` | Tombol utama, tautan, fokus |
| `primary-hover` | `#214F90` | Hover tombol utama |
| `primary-subtle` | `#EAF2FF` | Pilihan aktif dan highlight lembut |
| `success` | `#18794E` | Status berhasil/final |
| `success-subtle` | `#E8F6EE` | Latar status berhasil |
| `warning` | `#9A6700` | Peringatan harga belum lengkap |
| `warning-subtle` | `#FFF5D8` | Latar peringatan |
| `danger` | `#C0362C` | Galat validasi dan aksi berbahaya |
| `danger-subtle` | `#FFF0EE` | Latar galat |
| `info` | `#245E9B` | Informasi sistem |
| `info-subtle` | `#EAF3FC` | Latar informasi |

### 3.3 Warna — dark mode

| Token | Nilai | Pemakaian |
|---|---|---|
| `background` | `#11151C` | Latar utama |
| `surface` | `#191F29` | Panel, kartu, sidebar |
| `surface-muted` | `#202835` | Area tabel sekunder dan input |
| `surface-hover` | `#283344` | Hover baris dan navigasi |
| `border` | `#303B4B` | Border panel dan divider |
| `border-strong` | `#435168` | Outline input dan tabel |
| `text-primary` | `#F1F5F9` | Judul dan isi utama |
| `text-secondary` | `#B4C0D0` | Keterangan dan label |
| `text-muted` | `#8794A7` | Placeholder dan metadata |
| `primary` | `#8AB4F8` | Tombol utama, tautan, fokus |
| `primary-hover` | `#A6C7FF` | Hover tombol utama |
| `primary-subtle` | `#233753` | Pilihan aktif dan highlight lembut |
| `success` | `#6DD6A0` | Status berhasil/final |
| `success-subtle` | `#1D3B30` | Latar status berhasil |
| `warning` | `#F2C66D` | Peringatan harga belum lengkap |
| `warning-subtle` | `#44371F` | Latar peringatan |
| `danger` | `#FF938A` | Galat validasi dan aksi berbahaya |
| `danger-subtle` | `#482725` | Latar galat |
| `info` | `#8ABCF2` | Informasi sistem |
| `info-subtle` | `#21364B` | Latar informasi |

**Aturan warna:** tidak ada gradien sebagai latar halaman atau kartu. Gunakan warna solid. Aksen utama biru dipakai untuk tindakan utama dan navigasi aktif, bukan sebagai dekorasi di seluruh layar. Warna status harus selalu disertai teks atau ikon, tidak hanya dibedakan melalui warna.

### 3.4 Spasi, radius, dan elevasi

| Token | Nilai | Pemakaian |
|---|---|---|
| `space-1` | 4px | Jarak ikon dan label |
| `space-2` | 8px | Jarak komponen rapat |
| `space-3` | 12px | Padding kontrol kecil |
| `space-4` | 16px | Padding standar |
| `space-5` | 20px | Jarak antarkomponen |
| `space-6` | 24px | Padding kartu |
| `space-8` | 32px | Jarak antarbagian |
| `radius-sm` | 6px | Badge, kontrol kecil |
| `radius-md` | 8px | Input dan tombol |
| `radius-lg` | 12px | Kartu dan panel |
| `radius-xl` | 16px | Dialog besar bila diperlukan |
| `shadow-sm` | Sangat halus | Dropdown dan popover |
| `shadow-md` | Halus | Dialog di atas halaman |

Utamakan border `1px solid` daripada bayangan. Hindari panel yang tampak mengambang tanpa alasan.

## 4. Layout aplikasi

### 4.1 Kerangka utama

- **Sidebar desktop:** lebar 240–256px, dapat diciutkan menjadi rail ikon.
- **Header aplikasi:** tinggi sekitar 60–64px; berisi judul konteks bila diperlukan, pemilih BUMDes untuk superadmin, toggle tema, dan menu akun.
- **Area konten:** padding 24–32px di desktop, 16px di tablet, 12–16px di ponsel.
- **Lebar konten:** gunakan lebar penuh untuk tabel dan editor RAB; batasi lebar form sederhana agar mudah dibaca.
- **Latar:** background solid; panel menggunakan surface.
- **Pemisah:** gunakan divider dan border tipis, bukan gradien.
- **Responsif:** sidebar menjadi drawer pada layar kecil. Tabel lebar dapat digulir horizontal. Form pengeditan RAB tetap mengutamakan layar laptop.

### 4.2 Navigasi sidebar

Kelompok navigasi:

1. **Workspace**
   - Proyek RAB
   - Harga Lokal
2. **Data Master** — hanya superadmin
   - Pekerjaan & Kategori
   - Sumber Daya
   - Desa & Pengguna
3. **Akun**
   - Profil / Keluar

Gunakan ikon outline konsisten, misalnya ikon proyek/folder, calculator, tags, package, building, users, settings, sun/moon, dan log-out dari satu pustaka seperti Lucide. Ikon harus punya label teks di sidebar desktop; mode rail menggunakan tooltip aksesibel.

Item aktif memakai `primary-subtle`, teks `primary`, dan indikator aktif tipis. Jangan mengandalkan ikon saja untuk menunjukkan halaman aktif.

### 4.3 Header halaman

Setiap halaman memiliki:
- Breadcrumb bila halaman berada di dalam detail.
- Judul yang jelas dan satu kalimat penjelas opsional.
- Aksi utama di kanan atas, misalnya **Buat Proyek** atau **Tambah Sumber Daya**.
- Filter relevan dalam baris tersendiri, bukan ditumpuk dengan judul.
- Status halaman dan konteks BUMDes/tahun jika penting.

## 5. Komponen dasar

### 5.1 Tombol

Varian:
- **Primary:** tindakan utama seperti Buat Proyek, Simpan, Finalkan.
- **Secondary:** tindakan pendamping seperti Tambah Bab atau Ekspor.
- **Tertiary/Ghost:** aksi ringan seperti Batal atau navigasi kecil.
- **Danger:** hapus dan tindakan yang tidak dapat dibatalkan.
- **Icon button:** hanya untuk tindakan ringkas; wajib memiliki accessible label atau tooltip.

Ukuran:
- Small: tinggi 32px untuk toolbar tabel.
- Medium: tinggi 40px sebagai default.
- Large: tinggi 44–48px untuk aksi utama pada form.

Gunakan label yang spesifik: “Finalkan RAB”, bukan “OK”. Tombol finalisasi harus menggunakan varian primary atau konfirmasi yang jelas; jangan gunakan warna danger kecuali aksi tersebut benar-benar merusak data.

### 5.2 Input dan form

- Tinggi input standar 40px.
- Label berada di atas input.
- Tampilkan satuan di suffix atau kolom terpisah; jangan menyisipkan satuan ke dalam nilai yang disimpan.
- Berikan teks bantuan untuk overhead, PPN, tahun harga, dan aturan input yang tidak jelas.
- Validasi inline muncul dekat field yang bermasalah.
- Pertahankan input angka saat fokus; simpan setelah pengguna meninggalkan field dan nilai berubah, sesuai PRD.
- Jangan hanya mengandalkan placeholder sebagai label.
- Untuk nilai desimal, izinkan presisi yang ditentukan sistem dan formatkan sesuai lokal Indonesia.

Komponen khusus:
- `BlurNumberInput`: mempertahankan nilai presisi saat diedit, memformat saat blur, serta menghindari kehilangan digit desimal.
- `SearchableSelect`: untuk memilih pekerjaan, dengan pencarian langsung berdasarkan awalan kode atau bagian nama.
- `YearSelect`: memilih tahun proyek/harga lokal.
- `BumdesSelect`: wajib untuk superadmin saat membuat proyek atau mengisi harga; tidak ditampilkan untuk operator/viewer yang sudah terikat BUMDes.

### 5.3 Tabel data

Tabel adalah komponen inti untuk data master, harga lokal, daftar proyek, dan rincian RAB.

- Header tabel menggunakan `surface-muted`, teks medium, dan tinggi sekitar 40–44px.
- Baris standar 44–52px; tabel RAB dapat lebih padat jika banyak item.
- Kolom teks rata kiri; kolom angka rata kanan.
- Gunakan angka tabular bila tersedia, bukan font-mono.
- Header kolom angka harus menjelaskan satuan bila tidak jelas.
- Aksi baris ditempatkan di kolom paling kanan atau menu tindakan.
- Gunakan hover lembut; hindari zebra stripe yang kontras.
- Tampilkan empty state dengan ikon, penjelasan singkat, dan aksi berikutnya bila tersedia.
- Untuk data yang belum lengkap, tampilkan status dan pesan yang bisa ditindaklanjuti.
- Sediakan loading skeleton atau indikator progres yang tidak menggeser layout secara berlebihan.
- Pada layar kecil, tabel dapat digulir horizontal; jangan memampatkan angka sampai sulit dibaca.

### 5.4 Kartu dan ringkasan

Kartu memakai surface solid, border tipis, radius 12px, dan padding 16–24px. Jangan memakai gradien, glow, atau ilustrasi dekoratif.

Untuk dashboard ringkasan, prioritaskan:
- Jumlah proyek.
- Proyek draft.
- Proyek final.
- Harga lokal yang belum lengkap untuk tahun/BUMDes aktif.
- Aktivitas terbaru hanya jika data aktivitas tersedia; jangan membuat data dummy seolah-olah nyata.

Angka total harus punya label dan konteks. Jangan menampilkan KPI yang tidak tersedia di API atau PRD tanpa menandainya sebagai usulan.

### 5.5 Badge status

Status menggunakan label teks dan warna semantik:
- `Draft`: netral/biru lembut.
- `Final`: hijau lembut dengan ikon check-circle.
- `Belum lengkap`: kuning lembut dengan ikon alert-triangle.
- `Galat`: merah lembut dengan ikon circle-alert.
- `Hanya baca`: netral dengan ikon eye.

Badge tidak boleh menjadi satu-satunya sumber informasi penting. Gunakan ikon dari pustaka ikon, bukan emotikon.

### 5.6 Alert dan pesan validasi

- `ErrorAlert`: surface merah lembut, ikon alert-circle, judul singkat, pesan penyebab, dan langkah perbaikan jika tersedia.
- `WarningAlert`: untuk rekap yang belum lengkap atau harga lokal yang kosong.
- `InfoAlert`: untuk informasi status atau batasan.
- Jangan menampilkan pesan teknis mentah kepada pengguna bila pesan dapat diterjemahkan ke bahasa Indonesia yang jelas.
- Pesan harga kosong harus menyebut tahun, kode, dan nama sumber daya sesuai respons sistem.
- Error global tidak menggantikan error inline di field atau item.

### 5.7 Dialog konfirmasi

Wajib digunakan sebelum:
- Menghapus bab.
- Menghapus kategori, sumber daya, atau pekerjaan.
- Memfinalkan RAB.

Dialog berisi judul spesifik, konsekuensi tindakan, tombol Batal, dan tombol konfirmasi. Untuk finalisasi, jelaskan bahwa harga satuan dan total akan dikunci dan RAB tidak dapat diedit lagi. Jangan gunakan konfirmasi generik “Apakah Anda yakin?” tanpa konteks.

### 5.8 Navigasi halaman dan filter

- Search input memiliki ikon search dan label/placeholder yang menjelaskan data yang dicari.
- Filter tahun dan BUMDes berada dekat tabel yang dipengaruhi.
- Pagination hanya digunakan bila jumlah data membuatnya diperlukan.
- Pertahankan filter saat pengguna membuka detail dan kembali jika implementasi memungkinkan.

### 5.9 Ikon

- Gunakan satu pustaka ikon outline yang konsisten, direkomendasikan **Lucide**.
- Ukuran default 16px untuk tabel, 18–20px untuk navigasi dan tombol, 24px untuk empty state.
- Stroke konsisten dan warna mengikuti teks atau status semantik.
- Ikon dekoratif tidak menggantikan label tindakan.
- Jangan menggunakan emotikon, emoji, atau karakter Unicode dekoratif sebagai ikon UI.

## 6. Struktur dan kebutuhan layar

### 6.1 Login — `/`

**Tujuan:** pengguna masuk menggunakan email dan password.

Komponen:
- Logo/nama RAB Desa.
- Heading “Masuk ke RAB Desa”.
- Input email dan password.
- Tombol tampil/sembunyikan password dengan ikon.
- Tombol primary “Masuk”.
- Area pesan autentikasi gagal.
- Indikator loading saat proses login.

Visual:
- Form terpusat dalam panel putih/permukaan gelap, dengan latar solid.
- Hindari ilustrasi besar, gradien mencolok, dan elemen pemasaran yang tidak relevan.
- Setelah berhasil, arahkan pengguna ke `/proyek`.

### 6.2 Daftar Proyek — `/proyek`

**Tujuan:** menemukan proyek dan membuat RAB baru.

Komponen:
- Page header “Proyek RAB”.
- Tombol “Buat Proyek” untuk superadmin dan operator.
- Tabel proyek dengan kolom nomor dokumen, nama proyek, BUMDes, tahun, status, dan aksi buka.
- Filter/pencarian bila dibutuhkan.
- Form proyek baru berisi BUMDes (khusus superadmin), nama proyek, tahun, overhead, dan PPN.
- Empty state saat belum ada proyek.
- Badge Draft/Final.

Perilaku:
- Operator dan viewer hanya melihat proyek BUMDes sendiri.
- Superadmin melihat seluruh proyek dan memilih BUMDes ketika membuat proyek.
- Viewer tidak melihat tombol pembuatan atau perubahan.
- Nomor dokumen dibuat oleh sistem; jangan meminta pengguna mengisinya secara manual.

### 6.3 Detail Proyek / Editor RAB — `/proyek/[uuid]`

Ini adalah layar utama aplikasi. Gunakan lebar konten yang luas dan hierarki visual yang jelas.

**A. Project header**
- Breadcrumb kembali ke Proyek.
- Nama proyek dan nomor dokumen.
- Metadata tahun dan BUMDes.
- Badge Draft/Final.
- Aksi Cetak.
- Aksi Finalkan RAB hanya untuk peran yang bisa menulis dan proyek berstatus draft.

**B. Pengaturan biaya**
- Input overhead (%).
- Input PPN (%).
- Hanya bisa diedit pada draft oleh superadmin/operator.
- Viewer melihat nilai sebagai teks read-only.
- Berikan keterangan ringkas bahwa nilai tersebut memengaruhi perhitungan rekapitulasi.

**C. Kartu rekapitulasi**
Tampilkan angka dengan label yang eksplisit:
- **A — Jumlah Harga** / subtotal bab sesuai struktur rekap yang digunakan.
- **B — PPN** beserta persentase.
- **C — Total** sebelum pembulatan, bila struktur cetak menggunakan label tersebut.
- **D — Dibulatkan** sebagai nilai akhir yang menonjol.
- **Real Cost** dapat ditampilkan sebagai jumlah seluruh subtotal bab sebelum PPN.
- Indikator kelengkapan rekap (`lengkap`) harus tampak jelas.

Catatan implementasi: PRD menyebut “Tabel rekap A sampai D” pada layar, sedangkan API memuat `realCost`, `ppn`, `total`, dan `dibulatkan`. Pastikan label final diselaraskan dengan format rekap resmi sebelum rilis; jangan mengubah definisi perhitungan hanya demi tampilan.

**D. Bab RAB**
Setiap bab ditampilkan sebagai section/card dengan:
- Kode bab (misalnya I, II, III) dan nama bab.
- Subtotal bab rata kanan.
- Menu aksi bab untuk pengguna yang dapat menulis pada draft.
- Tombol “Tambah Bab” pada proyek draft.
- Tombol “Tambah Item” pada setiap bab.
- Konfirmasi sebelum menghapus bab.

**E. Tabel item per bab**
Kolom:
1. Kode analisa.
2. Uraian pekerjaan.
3. Volume.
4. Satuan.
5. Harga satuan.
6. Jumlah harga.
7. Aksi (hanya pada draft dan pengguna yang dapat menulis).

Perilaku:
- Pekerjaan dipilih lewat pencarian kode/nama.
- Volume dapat diedit pada draft dan diformat sesuai lokal Indonesia.
- Harga satuan dan jumlah dihitung otomatis backend.
- Harga lokal yang belum lengkap menampilkan pesan merah yang menyebut kode dan nama sumber daya yang kosong.
- Item lain tetap dihitung bila satu item tidak lengkap.
- Tampilkan warning pada rekap jika `rekap.lengkap` bernilai false.
- Proyek final menampilkan nilai terkunci dan tidak memiliki kontrol ubah/hapus/tambah.
- Gunakan garis pemisah antarbaris yang tipis; hindari warna latar yang terlalu kuat.

**F. Tambah item**
Dialog atau side panel dengan:
- Pemilih bab.
- Searchable select pekerjaan (kode dan nama).
- Informasi satuan pekerjaan.
- Input volume.
- Validasi sebelum menyimpan.

**G. Finalisasi**
Dialog konfirmasi berisi:
- Ringkasan bahwa semua item akan dihitung ulang.
- Penjelasan bahwa harga satuan dan total akan dikunci.
- Peringatan jika masih ada harga lokal yang belum lengkap.
- Tombol kembali untuk memperbaiki data dan tombol konfirmasi finalisasi.
- Jangan mengizinkan finalisasi bila RAB kosong atau validasi backend menolaknya.

### 6.4 Harga Lokal — `/harga`

**Tujuan:** mengisi harga tenaga, bahan, dan alat berdasarkan BUMDes serta tahun proyek.

Komponen:
- Page header “Harga Lokal”.
- Filter tahun (default tahun berjalan).
- Pemilih BUMDes untuk superadmin.
- Tabel sumber daya dengan kolom tipe, kode, nama, satuan, harga, dan status.
- Input harga yang bisa diedit bagi superadmin/operator.
- Viewer hanya membaca.
- Penanda jelas untuk harga kosong.
- Search/filter tipe tenaga, bahan, alat jika membantu navigasi data.
- Pesan penyimpanan berhasil/gagal.

Perilaku:
- Harga selalu terkait dengan BUMDes dan tahun yang dipilih.
- Harga kosong ditampilkan sebagai “Belum diisi”, bukan angka nol.
- Simpan perubahan saat input kehilangan fokus dan nilainya berubah.
- Format angka menggunakan pemisah Indonesia tanpa mengubah presisi nilai yang disimpan.

### 6.5 Master Pekerjaan — `/admin/pekerjaan`

**Akses:** superadmin.

Komponen:
- Page header “Pekerjaan & Kategori”.
- Tabel kategori dan kontrol aturan pembulatan (`none` atau `down_0`).
- Form tambah kategori.
- Form tambah pekerjaan: kategori, kode analisa, nama pekerjaan, satuan.
- Tabel pekerjaan dengan kode, uraian, kategori, satuan, dan tautan detail.
- Pencarian kode/nama.
- Dialog konfirmasi sebelum menghapus data yang boleh dihapus.

Untuk R1.1, desain harus dapat dikembangkan menjadi tree view kategori bertingkat tanpa merombak seluruh layout. Fitur kategori bertingkat masih berstatus rencana di PRD.

### 6.6 Detail Pekerjaan — `/admin/pekerjaan/[uuid]`

**Akses:** superadmin.

Komponen:
- Header berisi kode, nama pekerjaan, kategori, dan satuan.
- Tabel komponen analisis.
- Setiap komponen menampilkan jenis (sumber daya atau pekerjaan lain), kode/nama, satuan, koefisien, dan basis harga jika berupa pekerjaan lain.
- Form tambah komponen dengan pemilihan jenis.
- Aksi hapus komponen dengan konfirmasi.
- Panel “Pratinjau Perhitungan” dengan pilihan BUMDes, tahun, dan overhead.
- Hasil D (biaya langsung), E (overhead), dan F (harga satuan).
- Penjelasan pembulatan kategori.
- Pesan siklus atau komponen tidak valid.
- Pratinjau harus dimuat ulang setelah komponen berubah.

### 6.7 Master Sumber Daya — `/admin/sumber-daya`

**Akses:** superadmin.

Komponen:
- Form tambah sumber daya: tipe, kode, nama, satuan.
- Tipe berupa pilihan Tenaga, Bahan, atau Alat.
- Tabel sumber daya dengan tipe, kode, nama, satuan, dan aksi.
- Pencarian/filter tipe.
- Konfirmasi hapus.
- Pesan bahwa data yang masih dipakai oleh pekerjaan tidak dapat dihapus.

### 6.8 Desa & Pengguna — `/admin/desa`

**Akses:** superadmin.

Komponen:
- Section BUMDes: tabel kode, nama BUMDes, desa, kecamatan.
- Form tambah BUMDes.
- Section pengguna: tabel nama, email, peran, BUMDes.
- Form tambah pengguna: nama, email, password, role, BUMDes.
- Field BUMDes hanya tampil untuk peran operator/viewer; superadmin tidak terikat BUMDes.
- Validasi password minimal 8 karakter dan email unik.
- Jangan pernah menampilkan hash/password pengguna pada tabel.

## 7. Format angka dan informasi finansial

- Bahasa UI: Bahasa Indonesia.
- Format tampilan: `1.234.567,89`.
- Nilai mata uang menggunakan awalan `Rp` bila sesuai konteks; hindari mengulang `Rp` di setiap sel jika header kolom sudah menyebut “Harga (Rp)”.
- Kolom angka rata kanan dan angka penting tidak terpotong.
- Volume dapat disimpan hingga 4 angka desimal, tetapi tampilan baca dapat dibulatkan sesuai spesifikasi PRD.
- Harga satuan dan total pada proyek final berasal dari nilai terkunci, bukan dihitung ulang dari harga lokal terbaru.
- Nilai kosong berbeda dari nol: kosong berarti data belum lengkap, sedangkan nol adalah nilai yang sah bila aturan mengizinkan.
- Jangan menghitung ulang nilai finansial hanya di frontend. UI menampilkan hasil dari backend.

## 8. State dan perilaku

Setiap komponen yang mengambil data harus memiliki state yang dirancang:

- **Loading:** skeleton tabel/kartu atau indikator pada tombol yang sedang memproses.
- **Empty:** jelaskan mengapa belum ada data dan tawarkan aksi yang sesuai hak akses.
- **Success:** notifikasi singkat setelah simpan, tambah, hapus, atau finalisasi berhasil.
- **Validation error:** pesan dekat field atau baris terkait.
- **API error:** alert dengan penyebab yang bisa dipahami dan opsi mencoba lagi bila aman.
- **Forbidden (403):** tampilkan pesan akses ditolak; jangan hanya menghilangkan halaman tanpa penjelasan.
- **Expired session (401):** arahkan ke login dengan pesan sesi berakhir.
- **Read-only:** tampilkan data dengan jelas tanpa affordance input palsu.
- **Final/locked:** semua input dan aksi perubahan dihilangkan atau diganti tampilan baca; tampilkan keterangan bahwa proyek telah final.
- **Unsaved/pending save:** beri indikator kecil pada field jika penyimpanan berlangsung atau gagal.

Jangan membuat toast terlalu panjang atau menutupi tabel. Pesan penting seperti harga belum lengkap harus tetap berada di konteks item/rekap, bukan hanya muncul sebentar sebagai toast.

## 9. Aksesibilitas

- Pastikan kontras teks dan kontrol memenuhi WCAG AA bila memungkinkan.
- Semua field memiliki label yang jelas.
- Semua aksi dapat digunakan dengan keyboard.
- Focus ring terlihat jelas pada kedua tema.
- Icon-only button wajib memiliki accessible name.
- Status tidak dibedakan berdasarkan warna saja; sertakan label teks dan ikon.
- Dialog mengunci fokus dan mengembalikan fokus ke pemicu saat ditutup.
- Jangan menggunakan ukuran teks di bawah 12px untuk informasi yang perlu dibaca.
- Hormati preferensi `prefers-reduced-motion`.

## 10. Responsif

### Desktop (≥ 1200px)
- Sidebar tetap terlihat.
- Tabel RAB menggunakan lebar penuh area konten.
- Kartu rekap dapat ditampilkan dalam satu baris.
- Form tambah item dapat memakai modal lebar atau side panel.

### Tablet (768–1199px)
- Sidebar dapat diciutkan.
- Kartu rekap menjadi grid dua kolom.
- Tabel tetap dapat digulir horizontal.

### Ponsel (< 768px)
- Sidebar menjadi drawer.
- Kartu rekap ditumpuk vertikal.
- Halaman detail proyek mengutamakan baca, status, rekap, dan tombol cetak.
- Pengeditan tabel RAB tidak perlu dioptimalkan penuh untuk ponsel pada rilis awal sesuai PRD.
- Tombol dan target sentuh memiliki area yang memadai.

## 11. Cetak

Tampilan cetak harus berbeda dari dashboard aplikasi: dokumen bersih, latar putih, teks hitam, tanpa sidebar, navigasi, tombol, dialog, atau elemen `noprint`.

- Gunakan aturan `@media print`.
- Hindari latar berwarna pada tabel agar hemat tinta dan terbaca saat dicetak.
- Tampilkan nama proyek, nomor dokumen, BUMDes/lokasi bila tersedia, tahun, bab, rincian item, subtotal, rekapitulasi, dan status draft bila belum final.
- Jaga agar header tabel berulang ketika tabel berlanjut ke halaman berikutnya.
- Hindari pemotongan baris item di tengah halaman bila memungkinkan.
- Angka cetak harus sama dengan hasil layar dan mesin hitung backend.
- Fitur ekspor PDF/XLSX, terbilang, lokasi, dan tanda tangan merupakan rencana R2 di PRD; jangan menampilkan kontrol ekspor yang belum tersedia. Untuk MVP, gunakan cetak melalui browser.

## 12. Tema gelap dan terang

- Sediakan toggle tema pada header atau menu akun dengan ikon sun/moon.
- Gunakan token semantik; jangan menanam warna light/dark langsung pada komponen.
- Simpan pilihan tema bila mekanisme persistensi tersedia; jika belum, gunakan preferensi sistem sebagai nilai awal.
- Pastikan status success, warning, dan error tetap terbaca pada kedua tema.
- Dark mode menggunakan permukaan abu-abu kebiruan gelap, bukan hitam pekat untuk semua elemen.
- Light mode memakai putih dan putih kebiruan; hindari latar abu-abu gelap atau putih menyilaukan yang memenuhi seluruh halaman.

## 13. Aturan implementasi

- Ikuti stack yang disebutkan PRD: Next.js App Router, Mantine 7, TypeScript; backend NestJS/Express, Prisma, PostgreSQL; mesin hitung di backend menggunakan Decimal.js.
- Gunakan komponen yang sudah direncanakan dalam PRD: `AppPage`, `Shell`, `ErrorAlert`, `ConfirmButton`, `BlurNumberInput`, serta komponen per fitur.
- Page hanya merangkai komponen dan hook; komponen fitur menerima data melalui props.
- Semua panggilan API frontend melalui `lib/http.ts`.
- Format angka terpusat di `lib/format.ts`; konstanta status dan pilihan terpusat di `lib/constants.ts`.
- Perubahan struktur API diperbarui terlebih dahulu pada `types/api.ts`.
- Jangan mengimplementasikan perhitungan finansial terpisah di komponen UI.
- Sembunyikan elemen `noprint` saat mencetak.
- Hak akses visual mengikuti role, tetapi validasi akses wajib tetap dilakukan backend.
- Pertahankan desain komponen yang konsisten dan dapat digunakan ulang; hindari variasi styling per halaman tanpa alasan.

## 14. Hal yang perlu dikonfirmasi

PRD mencatat beberapa keputusan domain belum final. Jangan menyelesaikannya melalui keputusan desain visual. Konfirmasikan dengan ahli/perwakilan desa sebelum menetapkan tampilan atau label final:

1. Label dan struktur resmi rekap A–D pada dokumen cetak.
2. Aturan pembulatan per kategori.
3. Penggunaan basis harga `final` atau `direct` untuk pekerjaan bertingkat.
4. Aturan overhead dan PPN untuk pekerjaan swakelola.
5. Contoh format cetak yang disetujui pemeriksa.
6. Waktu penerapan kategori bertingkat dan impor AHSP yang masih berstatus rencana.

## 15. Checklist penerimaan desain

- [ ] Light mode menggunakan putih dan putih kebiruan sebagai dasar.
- [ ] Dark mode tersedia dan semua komponen memakai token semantik.
- [ ] Tidak ada gradien mencolok pada latar halaman atau kartu.
- [ ] Tidak ada font-mono.
- [ ] Tidak ada emotikon/emoji sebagai ikon UI; gunakan pustaka ikon konsisten.
- [ ] Semua halaman memakai kerangka navigasi dan header yang konsisten.
- [ ] Status Draft, Final, harga belum lengkap, dan hanya-baca mudah dikenali.
- [ ] Kolom angka rata kanan, format Indonesia, dan mudah dipindai.
- [ ] Editor RAB jelas membedakan volume, harga satuan, jumlah, subtotal, Real Cost, PPN, Total, dan Dibulatkan.
- [ ] Finalisasi memiliki konfirmasi eksplisit dan menjelaskan penguncian nilai.
- [ ] Viewer tidak mendapat kontrol ubah.
- [ ] Harga kosong memiliki pesan yang dapat ditindaklanjuti.
- [ ] Layout desktop mendukung pengeditan RAB; ponsel nyaman untuk membaca dan mencetak.
- [ ] Tampilan cetak tidak menyertakan navigasi atau kontrol aplikasi.
- [ ] Tidak ada fitur R2/R3 yang ditampilkan sebagai tersedia sebelum benar-benar diimplementasikan.
