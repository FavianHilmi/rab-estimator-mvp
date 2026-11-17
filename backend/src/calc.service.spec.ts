import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import Decimal from 'decimal.js';
import { CalcContext, CalcService } from './calc.service';
import { D } from './util';

// Mock DB InMemory untuk unit test
function createMockPrismaService(data: {
  pekerjaan: any[];
  kategori: any[];
  sumberDaya: any[];
  koefisien: any[];
  hargaLokal: any[];
}) {
  return {
    masterPekerjaan: {
      findUnique: async ({ where }: any) => {
        const pk = data.pekerjaan.find((p) => p.id === where.id || p.uuid === where.uuid);
        if (!pk) return null;
        const kat = data.kategori.find((k) => k.id === pk.kategoriId);
        const koef = data.koefisien
          .filter((k) => k.pekerjaanId === pk.id)
          .map((k) => {
            const sd = data.sumberDaya.find((s) => s.id === k.sumberDayaId) ?? null;
            const subP = data.pekerjaan.find((p) => p.id === k.subPekerjaanId) ?? null;
            return { ...k, sumberDaya: sd, subPekerjaan: subP };
          });
        return { ...pk, kategori: kat, koefisien: koef };
      },
    },
    masterKoefisien: {
      findMany: async ({ where }: any) => {
        return data.koefisien.filter((k) => {
          if (where.pekerjaanId && k.pekerjaanId !== where.pekerjaanId) return false;
          if (where.subPekerjaanId?.not !== undefined && k.subPekerjaanId === null) return false;
          return true;
        });
      },
    },
    hargaLokal: {
      findMany: async ({ where }: any) => {
        return data.hargaLokal.filter((h) => {
          if (where.bumdesId && h.bumdesId !== where.bumdesId) return false;
          if (where.tahun && h.tahun !== where.tahun) return false;
          if (where.sumberDayaId?.in && !where.sumberDayaId.in.includes(h.sumberDayaId)) return false;
          return true;
        });
      },
    },
  } as any;
}

describe('CalcService: Test Suites TC-01 s/d TC-06', () => {
  // Data Demo 2026
  const kategoriList = [
    { id: 1, uuid: 'kat-1', kode: '1', nama: 'Pekerjaan Persiapan', pembulatan: 'none' },
    { id: 3, uuid: 'kat-3', kode: '3', nama: 'Pekerjaan Arsitektur', pembulatan: 'down_0' },
  ];

  const sumberDayaList = [
    { id: 101, uuid: 'sd-l01', kode: 'L.01', tipe: 'tenaga', nama: 'Pekerja', satuan: 'OH' },
    { id: 102, uuid: 'sd-l02', kode: 'L.02', tipe: 'tenaga', nama: 'Tukang', satuan: 'OH' },
    { id: 103, uuid: 'sd-l03', kode: 'L.03', tipe: 'tenaga', nama: 'Kepala Tukang', satuan: 'OH' },
    { id: 104, uuid: 'sd-l04', kode: 'L.04', tipe: 'tenaga', nama: 'Mandor', satuan: 'OH' },
    { id: 201, uuid: 'sd-b001', kode: 'B.001', tipe: 'bahan', nama: 'Bata Merah', satuan: 'buah' },
    { id: 202, uuid: 'sd-b002', kode: 'B.002', tipe: 'bahan', nama: 'Semen Portland', satuan: 'kg' },
    { id: 203, uuid: 'sd-b003', kode: 'B.003', tipe: 'bahan', nama: 'Pasir Pasang', satuan: 'm3' },
  ];

  const hargaLokalList = [
    { id: 1, bumdesId: 1, sumberDayaId: 101, tahun: 2026, harga: new Decimal('100000') },
    { id: 2, bumdesId: 1, sumberDayaId: 102, tahun: 2026, harga: new Decimal('150000') },
    { id: 3, bumdesId: 1, sumberDayaId: 103, tahun: 2026, harga: new Decimal('150000') },
    { id: 4, bumdesId: 1, sumberDayaId: 104, tahun: 2026, harga: new Decimal('200000') },
    { id: 5, bumdesId: 1, sumberDayaId: 201, tahun: 2026, harga: new Decimal('10000') },
    { id: 6, bumdesId: 1, sumberDayaId: 202, tahun: 2026, harga: new Decimal('10000') },
    { id: 7, bumdesId: 1, sumberDayaId: 203, tahun: 2026, harga: new Decimal('10000') },
  ];

  const pekerjaanList = [
    { id: 10, uuid: 'pk-36110', kategoriId: 3, kode: '3.6.1.10', nama: 'Dinding Bata Merah', satuan: 'm2' },
    { id: 20, uuid: 'pk-1111', kategoriId: 1, kode: '1.1.1.1', nama: 'Pengukuran dan Patok', satuan: 'm' },
    { id: 30, uuid: 'pk-3699', kategoriId: 3, kode: '3.6.9.9', nama: 'Dinding Khusus Bertingkat', satuan: 'm2' },
    { id: 40, uuid: 'pk-cycle-a', kategoriId: 3, kode: 'A.01', nama: 'Pekerjaan A', satuan: 'm' },
    { id: 50, uuid: 'pk-cycle-b', kategoriId: 3, kode: 'B.01', nama: 'Pekerjaan B', satuan: 'm' },
  ];

  const koefisienList = [
    // 3.6.1.10
    { id: 1, pekerjaanId: 10, sumberDayaId: 101, subPekerjaanId: null, koefisien: new Decimal('0.2'), basisHarga: 'final' },
    { id: 2, pekerjaanId: 10, sumberDayaId: 102, subPekerjaanId: null, koefisien: new Decimal('0.1'), basisHarga: 'final' },
    { id: 3, pekerjaanId: 10, sumberDayaId: 103, subPekerjaanId: null, koefisien: new Decimal('0.01'), basisHarga: 'final' },
    { id: 4, pekerjaanId: 10, sumberDayaId: 104, subPekerjaanId: null, koefisien: new Decimal('0.0033'), basisHarga: 'final' },
    { id: 5, pekerjaanId: 10, sumberDayaId: 201, subPekerjaanId: null, koefisien: new Decimal('71.91'), basisHarga: 'final' },
    { id: 6, pekerjaanId: 10, sumberDayaId: 202, subPekerjaanId: null, koefisien: new Decimal('8.32'), basisHarga: 'final' },
    { id: 7, pekerjaanId: 10, sumberDayaId: 203, subPekerjaanId: null, koefisien: new Decimal('0.049'), basisHarga: 'final' },

    // 1.1.1.1
    { id: 8, pekerjaanId: 20, sumberDayaId: 101, subPekerjaanId: null, koefisien: new Decimal('0.2'), basisHarga: 'final' },
    { id: 9, pekerjaanId: 20, sumberDayaId: 203, subPekerjaanId: null, koefisien: new Decimal('0.0491'), basisHarga: 'final' },

    // 3.6.9.9 (2 x 3.6.1.10 + 0.5 x L.02 Tukang)
    { id: 10, pekerjaanId: 30, sumberDayaId: null, subPekerjaanId: 10, koefisien: new Decimal('2'), basisHarga: 'final' },
    { id: 11, pekerjaanId: 30, sumberDayaId: 102, subPekerjaanId: null, koefisien: new Decimal('0.5'), basisHarga: 'final' },

    // Siklus: A memakai B, B memakai A
    { id: 12, pekerjaanId: 40, sumberDayaId: null, subPekerjaanId: 50, koefisien: new Decimal('1'), basisHarga: 'final' },
    { id: 13, pekerjaanId: 50, sumberDayaId: null, subPekerjaanId: 40, koefisien: new Decimal('1'), basisHarga: 'final' },
  ];

  const db = createMockPrismaService({
    pekerjaan: pekerjaanList,
    kategori: kategoriList,
    sumberDaya: sumberDayaList,
    koefisien: koefisienList,
    hargaLokal: hargaLokalList,
  });

  const calc = new CalcService(db);

  it('TC-01: Pratinjau pekerjaan 3.6.1.10, overhead 10%, pembulatan down_0 -> D=839.950, E=83.995, F=923.945', async () => {
    const res = await calc.hitung(10, 1, 2026, 10);
    assert.equal(res.d.toString(), '839950', 'Biaya langsung D harus 839.950');
    assert.equal(res.e.toString(), '83995', 'Overhead E harus 83.995');
    assert.equal(res.f.toString(), '923945', 'Harga satuan F harus 923.945');
    assert.equal(res.pembulatan, 'down_0');
  });

  it('TC-02: Pekerjaan 1.1.1.1 pada kategori none (F=22.540,1), lalu down_0 (F=22.540)', async () => {
    // 1. Pada kategori 'none'
    const resNone = await calc.hitung(20, 1, 2026, 10, new CalcContext());
    assert.equal(resNone.d.toString(), '20491', 'D harus 20.491');
    assert.equal(resNone.e.toString(), '2049.1', 'E harus 2.049,1');
    assert.equal(resNone.f.toString(), '22540.1', 'F pada pembulatan none harus 22.540,1');

    // 2. Ubah kategori ke 'down_0'
    const kat1 = kategoriList.find((k) => k.id === 1)!;
    kat1.pembulatan = 'down_0';
    const resDown = await calc.hitung(20, 1, 2026, 10, new CalcContext());
    assert.equal(resDown.f.toString(), '22540', 'F pada pembulatan down_0 harus 22.540');
    kat1.pembulatan = 'none'; // reset
  });

  it('TC-03: Pekerjaan bertingkat 3.6.9.9 dengan basis final (F=2.115.179), lalu direct (F=1.930.390)', async () => {
    const koefBertingkat = koefisienList.find((k) => k.id === 10)!;

    // 1. Basis Final
    koefBertingkat.basisHarga = 'final';
    const resFinal = await calc.hitung(30, 1, 2026, 10, new CalcContext());
    assert.equal(resFinal.d.toString(), '1922890', 'D basis final harus 1.922.890');
    assert.equal(resFinal.f.toString(), '2115179', 'F basis final harus 2.115.179');

    // 2. Basis Direct
    koefBertingkat.basisHarga = 'direct';
    const resDirect = await calc.hitung(30, 1, 2026, 10, new CalcContext());
    assert.equal(resDirect.d.toString(), '1754900', 'D basis direct harus 1.754.900');
    assert.equal(resDirect.f.toString(), '1930390', 'F basis direct harus 1.930.390');
    koefBertingkat.basisHarga = 'final'; // reset
  });

  it('TC-04: Rekapitulasi Real Cost 1.234.567,89 dan PPN 10% -> PPN 123.456,789, Total 1.358.024,679, Dibulatkan 1.358.000', () => {
    const realCost = new Decimal('1234567.89');
    const ppnPersen = new Decimal('10');
    const ppn = realCost.times(ppnPersen).div(100);
    const total = realCost.plus(ppn);
    const dibulatkan = total.div(1000).floor().times(1000);

    assert.equal(ppn.toString(), '123456.789');
    assert.equal(total.toString(), '1358024.679');
    assert.equal(dibulatkan.toString(), '1358000');
  });

  it('TC-05: Penolakan perhitungan saat harga lokal salah satu komponen belum diisi', async () => {
    // Hitung untuk tahun 2025 yang belum ada harga lokalnya
    await assert.rejects(
      async () => {
        await calc.hitung(10, 1, 2025, 10);
      },
      (err: any) => {
        assert.match(err.message, /Harga lokal 2025 belum diisi/);
        assert.match(err.message, /L\.01 Pekerja/);
        return true;
      },
    );
  });

  it('TC-06: Deteksi siklus ketergantungan (A memakai B dan B memakai A)', async () => {
    // 1. checkCycle saat penambahan komponen
    await assert.rejects(
      async () => {
        await calc.checkCycle(40, 50); // A memakai B padahal B sudah memakai A
      },
      (err: any) => {
        assert.match(err.message, /Ditolak: menimbulkan siklus/);
        return true;
      },
    );

    // 2. Deteksi siklus saat hitung
    await assert.rejects(
      async () => {
        await calc.hitung(40, 1, 2026, 10);
      },
      (err: any) => {
        assert.match(err.message, /Ditolak: menimbulkan siklus/);
        return true;
      },
    );
  });
});
