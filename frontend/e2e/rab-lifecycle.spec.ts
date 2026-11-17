import { test, expect } from '@playwright/test';

test.describe('E2E RAB Desa: Skenario Fungsional & UI di Lingkungan Lokal', () => {

  test('E2E-01: Autentikasi Login Operator & Validasi Redirect', async ({ page }) => {
    await page.goto('/');

    // 1. Cek elemen halaman login
    await expect(page.getByRole('heading', { name: /Masuk ke Akun/i })).toBeVisible();

    // 2. Coba login gagal terlebih dahulu
    await page.fill('input#email', 'operator@desa.test');
    await page.fill('input#password', 'passwordSALAH');
    await page.getByRole('button', { name: /Masuk ke Akun/i }).click();

    // Pastikan muncul alert error
    await expect(page.getByText(/Email atau password salah/i)).toBeVisible();

    // 3. Login sukses dengan password benar
    await page.fill('input#password', 'password123');
    await page.getByRole('button', { name: /Masuk ke Akun/i }).click();

    // Verifikasi otomatis berpindah ke halaman /proyek
    await expect(page).toHaveURL(/\/proyek/);
    await expect(page.getByRole('heading', { name: /Proyek RAB/i })).toBeVisible();

    // Verifikasi profil pengguna di sidebar
    await expect(page.locator('aside').getByText('Operator Desa')).toBeVisible();
  });

  test('E2E-02: Pembuatan Proyek Baru via Modal Dialog & Verifikasi Debounce', async ({ page }) => {
    // Login
    await page.goto('/');
    await page.fill('input#email', 'operator@desa.test');
    await page.fill('input#password', 'password123');
    await page.getByRole('button', { name: /Masuk ke Akun/i }).click();
    await expect(page).toHaveURL(/\/proyek/);

    // 1. Klik tombol "Buat Proyek Baru"
    const btnBuat = page.getByRole('button', { name: /Buat Proyek Baru/i });
    await expect(btnBuat).toBeVisible();
    await btnBuat.click();

    // 2. Verifikasi Modal Terbuka
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();
    await expect(modal.getByText(/Buat Dokumen Proyek RAB Baru/i)).toBeVisible();

    // 3. Isi formulir
    const projectName = `Proyek Irigasi Desa Playwright ${Date.now()}`;
    await page.fill('#namaProyek', projectName);
    await page.fill('#tahun', '2026');

    // 4. Submit formulir proyek
    await modal.getByRole('button', { name: /Simpan Dokumen Proyek/i }).click();

    // 5. Verifikasi modal tertutup dan proyek baru muncul di tabel
    await expect(modal).not.toBeVisible();
    await expect(page.getByText(projectName)).toBeVisible();

    // 6. Uji Debounce Pencarian
    const searchInput = page.getByPlaceholder(/Cari nomor dokumen atau nama proyek/i);
    await searchInput.fill(projectName);
    // Tunggu jeda debounce 300ms
    await page.waitForTimeout(400);
    await expect(page.getByText(projectName)).toBeVisible();
  });

  test('E2E-03: Alur Lengkap RAB: Tambah Bab, Modal Opsi A (2 Panel), Subtotal, & Finalisasi', async ({ page }) => {
    // Login
    await page.goto('/');
    await page.fill('input#email', 'operator@desa.test');
    await page.fill('input#password', 'password123');
    await page.getByRole('button', { name: /Masuk ke Akun/i }).click();
    await expect(page).toHaveURL(/\/proyek/);

    // 1. Buat 1 proyek baru khusus untuk pengujian RAB
    await page.getByRole('button', { name: /Buat Proyek Baru/i }).click();
    const testProjectName = `Proyek Gedung Serbaguna E2E ${Date.now()}`;
    await page.fill('#namaProyek', testProjectName);
    await page.getByRole('button', { name: /Simpan Dokumen Proyek/i }).click();

    // Buka detail proyek tersebut
    await page.getByRole('link', { name: testProjectName }).click();
    await expect(page.getByRole('heading', { name: testProjectName })).toBeVisible();

    // 2. Tambah Bab Baru (Bab I)
    await page.fill('#babKode', 'I');
    await page.fill('#babNama', 'Pekerjaan Struktur');
    await page.getByRole('button', { name: /Tambah Bab/i }).click();
    await expect(page.getByRole('heading', { name: /Bab I\. Pekerjaan Struktur/i })).toBeVisible();

    // 3. Buka Modal Opsi A via tombol "Tambah Item" pada Bab I
    await page.getByRole('button', { name: /Tambah Item/i }).first().click();

    // Verifikasi modal Opsi A terbuka
    const itemModal = page.getByRole('dialog');
    await expect(itemModal).toBeVisible();
    await expect(itemModal.getByText(/Pilih Analisis Harga Satuan/i)).toBeVisible();

    // 4. Pilih item pekerjaan dari katalog di panel kiri
    const firstItem = itemModal.locator('div.cursor-pointer').first();
    await firstItem.click();

    // 5. Masukkan Volume di panel kanan
    const volumeInput = page.locator('#modalVolume');
    await expect(volumeInput).toBeVisible();
    await volumeInput.fill('25.5');

    // 6. Klik tombol "+ Tambahkan ke Bab Ini"
    await itemModal.getByRole('button', { name: /Tambahkan ke Bab/i }).click();

    // 7. VERIFIKASI UTAMA OPSI A:
    // Modal HARUS TETAP TERBUKA, notifikasi sukses hijau muncul, dan volume ter-reset
    await expect(itemModal).toBeVisible();
    await expect(itemModal.getByText(/Berhasil ditambahkan/i)).toBeVisible();
    await expect(volumeInput).toHaveValue('');

    // 8. Tutup modal secara manual
    await itemModal.getByRole('button', { name: /Selesai/i }).click();
    await expect(itemModal).not.toBeVisible();

    // 9. Verifikasi item muncul di tabel bab dengan volume 25.5
    await expect(page.locator('table input[type="number"]').first()).toHaveValue('25.5');

    // 10. Uji Finalisasi Dokumen
    const btnFinalisasi = page.getByRole('button', { name: /Finalisasi Dokumen/i });
    if (await btnFinalisasi.isVisible()) {
      await btnFinalisasi.click();
      const confirmModal = page.getByRole('dialog');
      await expect(confirmModal.getByText(/Konfirmasi Finalisasi Dokumen/i)).toBeVisible();
      await confirmModal.getByRole('button', { name: /Finalkan RAB Sekarang/i }).click();

      // Verifikasi status berubah menjadi FINAL dan tombol aksi hilang
      await expect(page.getByText('FINAL')).toBeVisible();
      await expect(page.getByRole('button', { name: /Tambah Item/i })).not.toBeVisible();
    }
  });

  test('E2E-04: Auto-Save HSD di /harga & Validasi Sticky Sidebar', async ({ page }) => {
    // Login
    await page.goto('/');
    await page.fill('input#email', 'operator@desa.test');
    await page.fill('input#password', 'password123');
    await page.getByRole('button', { name: /Masuk ke Akun/i }).click();

    // 1. Navigasi ke menu Harga Lokal (HSD)
    await page.getByRole('link', { name: /Harga Lokal/i }).click();
    await expect(page).toHaveURL(/\/harga/);
    await expect(page.getByRole('heading', { name: /Harga Lokal \(HSD\)/i })).toBeVisible();

    // 2. Ubah harga salah satu sumber daya & trigger auto-save (blur)
    const priceInput = page.locator('table tbody tr input').first();
    await priceInput.click();
    await priceInput.fill('175000');
    // Klik ke luar untuk trigger blur auto-save
    await page.getByRole('heading', { name: /Harga Lokal/i }).click();

    // Verifikasi alert sukses hijau auto-save
    await expect(page.getByText(/Harga lokal berhasil diperbarui/i)).toBeVisible();

    // 3. Verifikasi Sticky Sidebar
    // Scroll halaman ke bawah sejauh 1000px
    await page.evaluate(() => window.scrollTo(0, 1000));
    const sidebar = page.locator('aside');
    const box = await sidebar.boundingBox();
    // Posisi y (top) dari sidebar tetap harus berada di bagian atas viewport (0 / <= 1px toleransi subpixel)
    expect(Math.abs(box?.y ?? 0)).toBeLessThanOrEqual(1);

    // 4. Verifikasi Print Stylesheet (@media print)
    await page.emulateMedia({ media: 'print' });
    // Elemen sidebar (.noprint) harus tersembunyi saat dicetak
    await expect(sidebar).toBeHidden();
    // Kembalikan ke screen media
    await page.emulateMedia({ media: 'screen' });
    await expect(sidebar).toBeVisible();
  });

});
