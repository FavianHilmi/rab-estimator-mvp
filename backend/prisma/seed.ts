import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const db = new PrismaClient();

async function main() {
  const pw = await bcrypt.hash('password123', 10);

  // 1. BUMDes Demo
  const bumdes = await db.bumdes.upsert({
    where: { kode: 'BMD-0001' },
    update: {},
    create: {
      kode: 'BMD-0001',
      nama: 'BUMDes Contoh',
      desa: 'Desa Contoh',
      kecamatan: 'Kecamatan Contoh',
    },
  });

  // 2. Akun Demo
  await db.user.upsert({
    where: { email: 'superadmin@rab.test' },
    update: {},
    create: { nama: 'Super Admin', email: 'superadmin@rab.test', password: pw, role: 'superadmin' },
  });
  await db.user.upsert({
    where: { email: 'operator@desa.test' },
    update: {},
    create: { nama: 'Operator Desa', email: 'operator@desa.test', password: pw, role: 'operator', bumdesId: bumdes.id },
  });
  await db.user.upsert({
    where: { email: 'viewer@desa.test' },
    update: {},
    create: { nama: 'Viewer Desa', email: 'viewer@desa.test', password: pw, role: 'viewer', bumdesId: bumdes.id },
  });

  // 3. Kategori: 3 (down_0) dan 1 (none)
  const kat3 = await db.masterKategori.upsert({
    where: { kode: '3' },
    update: { pembulatan: 'down_0' },
    create: { kode: '3', nama: 'Pekerjaan Arsitektur', pembulatan: 'down_0' },
  });
  const kat1 = await db.masterKategori.upsert({
    where: { kode: '1' },
    update: { pembulatan: 'none' },
    create: { kode: '1', nama: 'Pekerjaan Persiapan', pembulatan: 'none' },
  });

  // 4. Sumber Daya (7 sumber daya demo)
  const SD: [string, string, string, string, number][] = [
    ['L.01', 'tenaga', 'Pekerja', 'OH', 100000],
    ['L.02', 'tenaga', 'Tukang', 'OH', 150000],
    ['L.03', 'tenaga', 'Kepala Tukang', 'OH', 150000],
    ['L.04', 'tenaga', 'Mandor', 'OH', 200000],
    ['B.001', 'bahan', 'Bata Merah', 'buah', 10000],
    ['B.002', 'bahan', 'Semen Portland', 'kg', 10000],
    ['B.003', 'bahan', 'Pasir Pasang', 'm3', 10000],
  ];

  const sdMap: Record<string, any> = {};
  for (const [kode, tipe, nama, satuan, harga] of SD) {
    const sd = await db.masterSumberDaya.upsert({
      where: { kode },
      update: {},
      create: { kode, tipe, nama, satuan },
    });
    sdMap[kode] = sd;
    await db.hargaLokal.upsert({
      where: { bumdesId_sumberDayaId_tahun: { bumdesId: bumdes.id, sumberDayaId: sd.id, tahun: 2026 } },
      update: { harga: String(harga) },
      create: { bumdesId: bumdes.id, sumberDayaId: sd.id, tahun: 2026, harga: String(harga) },
    });
  }

  // 5. Pekerjaan 3.6.1.10 (Dinding Bata Merah, kategori 3, down_0) -> TC-01
  const pk1 = await db.masterPekerjaan.upsert({
    where: { kode: '3.6.1.10' },
    update: { kategoriId: kat3.id },
    create: {
      kategoriId: kat3.id,
      kode: '3.6.1.10',
      nama: 'Pemasangan 1 m2 Dinding Bata Merah Tebal 1/2 Batu Campuran 1SP : 6PP',
      satuan: 'm2',
    },
  });

  const koefPk1: [string, number][] = [
    ['L.01', 0.2],
    ['L.02', 0.1],
    ['L.03', 0.01],
    ['L.04', 0.0033],
    ['B.001', 71.91],
    ['B.002', 8.32],
    ['B.003', 0.049],
  ];
  for (const [sdKode, koef] of koefPk1) {
    const sd = sdMap[sdKode];
    if (!(await db.masterKoefisien.findFirst({ where: { pekerjaanId: pk1.id, sumberDayaId: sd.id } }))) {
      await db.masterKoefisien.create({
        data: { pekerjaanId: pk1.id, sumberDayaId: sd.id, koefisien: String(koef) },
      });
    }
  }

  // 6. Pekerjaan 1.1.1.1 (Pengukuran & Pematokan, kategori 1, none) -> TC-02
  const pk2 = await db.masterPekerjaan.upsert({
    where: { kode: '1.1.1.1' },
    update: { kategoriId: kat1.id },
    create: {
      kategoriId: kat1.id,
      kode: '1.1.1.1',
      nama: 'Pengukuran dan Pemasangan Patok',
      satuan: 'm',
    },
  });

  const koefPk2: [string, number][] = [
    ['L.01', 0.2],
    ['B.003', 0.0491],
  ];
  for (const [sdKode, koef] of koefPk2) {
    const sd = sdMap[sdKode];
    if (!(await db.masterKoefisien.findFirst({ where: { pekerjaanId: pk2.id, sumberDayaId: sd.id } }))) {
      await db.masterKoefisien.create({
        data: { pekerjaanId: pk2.id, sumberDayaId: sd.id, koefisien: String(koef) },
      });
    }
  }

  // 7. Pekerjaan 3.6.9.9 (AHS Bertingkat: 2 x 3.6.1.10 [basis final] + 0.5 x Tukang) -> TC-03
  const pk3 = await db.masterPekerjaan.upsert({
    where: { kode: '3.6.9.9' },
    update: { kategoriId: kat3.id },
    create: {
      kategoriId: kat3.id,
      kode: '3.6.9.9',
      nama: 'Pekerjaan Dinding Bertingkat Khusus',
      satuan: 'm2',
    },
  });

  if (!(await db.masterKoefisien.findFirst({ where: { pekerjaanId: pk3.id, subPekerjaanId: pk1.id } }))) {
    await db.masterKoefisien.create({
      data: {
        pekerjaanId: pk3.id,
        subPekerjaanId: pk1.id,
        basisHarga: 'final',
        koefisien: '2.0000',
      },
    });
  }
  const sdTukang = sdMap['L.02'];
  if (!(await db.masterKoefisien.findFirst({ where: { pekerjaanId: pk3.id, sumberDayaId: sdTukang.id } }))) {
    await db.masterKoefisien.create({
      data: {
        pekerjaanId: pk3.id,
        sumberDayaId: sdTukang.id,
        koefisien: '0.5000',
      },
    });
  }

  console.log('Seed selesai.');
  console.log('Akun demo: superadmin@rab.test | operator@desa.test | viewer@desa.test (password: password123)');
  console.log('Pekerjaan demo: 3.6.1.10 (down_0), 1.1.1.1 (none), 3.6.9.9 (bertingkat)');
}

main().finally(() => db.$disconnect());
