'use client';
import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Calculator,
  Plus,
  Trash2,
  AlertCircle,
  AlertTriangle,
  Layers,
  Loader2,
} from 'lucide-react';
import Shell from '@/components/Shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { api, rp, useMe } from '@/lib/api';

export default function DetailPekerjaan() {
  const me = useMe();
  const { uuid } = useParams<{ uuid: string }>();
  const [p, setP] = React.useState<any>(null);
  const [sdList, setSdList] = React.useState<any[]>([]);
  const [pkList, setPkList] = React.useState<any[]>([]);
  const [bumdesList, setBumdesList] = React.useState<any[]>([]);
  const [err, setErr] = React.useState('');

  const [compType, setCompType] = React.useState<'sumber_daya' | 'pekerjaan'>('sumber_daya');
  const [f, setF] = React.useState<any>({
    sumberDayaUuid: '',
    subPekerjaanUuid: '',
    basisHarga: 'final',
    koefisien: '',
  });

  const [previewBumdes, setPreviewBumdes] = React.useState<string>('');
  const [previewTahun, setPreviewTahun] = React.useState<number>(new Date().getFullYear());
  const [previewOverhead, setPreviewOverhead] = React.useState<number>(10);
  const [previewRes, setPreviewRes] = React.useState<any>(null);
  const [previewLoading, setPreviewLoading] = React.useState(false);

  const load = () => {
    api(`/pekerjaan/${uuid}`).then(setP).catch((e) => setErr(e.message));
  };

  React.useEffect(() => {
    if (me) {
      load();
      api('/sumber-daya').then(setSdList).catch((e) => setErr(e.message));
      api('/pekerjaan')
        .then((res) => setPkList(res.filter((item: any) => item.uuid !== uuid)))
        .catch((e) => setErr(e.message));
      api('/bumdes')
        .then((res) => {
          setBumdesList(res);
          if (res.length > 0 && !previewBumdes) setPreviewBumdes(res[0].uuid);
        })
        .catch((e) => setErr(e.message));
    }
  }, [me, uuid]);

  if (!me) return null;
  if (me.role !== 'superadmin') {
    return (
      <Shell me={me}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <AlertDescription>Hanya superadmin yang berhak mengakses rincian pekerjaan.</AlertDescription>
        </Alert>
      </Shell>
    );
  }
  if (!p) {
    return (
      <Shell me={me}>
        {err ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <AlertDescription className="text-sm">{err}</AlertDescription>
          </Alert>
        ) : (
          <div className="flex items-center justify-center py-24 gap-3 text-muted-foreground text-sm">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span>Memuat rincian analisa pekerjaan...</span>
          </div>
        )}
      </Shell>
    );
  }

  const run = async (fn: () => Promise<any>) => {
    try {
      setErr('');
      setPreviewRes(null);
      await fn();
      await load();
    } catch (x: any) {
      setErr(x.message || 'Terjadi kesalahan saat menyimpan komponen.');
    }
  };

  const handleHitungPratinjau = async () => {
    if (!previewBumdes) {
      setErr('Pilih BUMDes acuan terlebih dahulu');
      return;
    }
    try {
      setErr('');
      setPreviewLoading(true);
      const res = await api(
        `/pekerjaan/${uuid}/hitung?tahun=${previewTahun}&overhead=${previewOverhead}&bumdesUuid=${previewBumdes}`,
      );
      setPreviewRes(res);
    } catch (x: any) {
      setErr(x.message || 'Gagal menghitung pratinjau harga satuan.');
      setPreviewRes(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <Shell me={me}>
      <div className="space-y-6">
        <div>
          <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-xs text-muted-foreground mb-2">
            <Link href="/admin/pekerjaan">
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              Master Pekerjaan
            </Link>
          </Button>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {p.kode} — {p.nama}
            </h1>
            <Badge
              variant="secondary"
              className={
                p.kategori?.pembulatan === 'none'
                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
              }
            >
              {p.kategori?.pembulatan === 'none' ? 'Tidak dibulatkan' : 'Dipotong ke rupiah'}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-muted-foreground">
            <span>Satuan: <b className="text-foreground">{p.satuan}</b></span>
            <span>·</span>
            <span>Kategori: <b className="text-foreground">{p.kategori?.nama}</b></span>
          </div>
        </div>

        {err && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <AlertDescription className="text-sm">{err}</AlertDescription>
          </Alert>
        )}

        {/* Components Table */}
        <Card className="border-border bg-card overflow-hidden shadow-sm">
          <CardHeader className="p-5 pb-3 border-b border-border bg-muted/20">
            <CardTitle className="text-base font-semibold">Rincian Komponen Analisis (AHSP)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">Kode</TableHead>
                  <TableHead>Uraian Komponen</TableHead>
                  <TableHead className="w-28">Tipe</TableHead>
                  <TableHead className="w-36">Basis Harga</TableHead>
                  <TableHead className="w-20">Satuan</TableHead>
                  <TableHead className="w-36 text-right">Koefisien</TableHead>
                  <TableHead className="w-16 text-center" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {p.koefisien.map((k: any) => {
                  const isSd = !!k.sumberDaya;
                  const kode = isSd ? k.sumberDaya.kode : k.subPekerjaan?.kode;
                  const nama = isSd ? k.sumberDaya.nama : k.subPekerjaan?.nama;
                  const tipe = isSd ? k.sumberDaya.tipe : 'pekerjaan';
                  const satuan = isSd ? k.sumberDaya.satuan : k.subPekerjaan?.satuan;

                  return (
                    <TableRow key={k.uuid}>
                      <TableCell className="kode font-medium text-foreground">{kode}</TableCell>
                      <TableCell className="font-medium text-foreground">{nama}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            tipe === 'tenaga'
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                              : tipe === 'bahan'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : tipe === 'alat'
                              ? 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          }
                        >
                          {tipe}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {!isSd ? (
                          <Badge variant="outline" className="gap-1 border-primary/30 text-primary">
                            <Layers className="h-3 w-3" />
                            <span>Pakai {k.basisHarga === 'direct' ? 'D' : 'F'}</span>
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{satuan}</TableCell>
                      <TableCell className="text-right num font-semibold">
                        {rp(k.koefisien, 4)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          title="Hapus komponen"
                          onClick={() =>
                            confirm(`Hapus komponen ${kode} - ${nama}?`) &&
                            run(() => api(`/koefisien/${k.uuid}`, { method: 'DELETE' }))
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {p.koefisien.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-sm text-muted-foreground">
                      Belum ada koefisien. Tambahkan komponen sumber daya atau pekerjaan bertingkat di bawah.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Add Component Form */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="pb-3 border-b border-border bg-muted/20">
            <CardTitle className="text-base font-semibold">Tambah Komponen Analisis</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="inline-flex rounded-lg border border-border p-1 bg-muted/30">
              <button
                type="button"
                onClick={() => {
                  setCompType('sumber_daya');
                  setF({ ...f, sumberDayaUuid: '', subPekerjaanUuid: '' });
                }}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  compType === 'sumber_daya'
                    ? 'bg-background text-foreground shadow-sm font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Sumber Daya (HSD)
              </button>
              <button
                type="button"
                onClick={() => {
                  setCompType('pekerjaan');
                  setF({ ...f, sumberDayaUuid: '', subPekerjaanUuid: '' });
                }}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  compType === 'pekerjaan'
                    ? 'bg-background text-foreground shadow-sm font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Pekerjaan Bertingkat
              </button>
            </div>

            {compType === 'pekerjaan' && (
              <Alert variant="info" className="py-2.5">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <AlertDescription className="text-xs">
                  <b>Basis Final (F)</b>: Overhead dihitung dua kali (di pekerjaan turunan dan induk). Gunakan <b>Basis Direct (D)</b> jika overhead hanya ingin dihitung satu kali di tingkat teratas.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              {compType === 'sumber_daya' ? (
                <div className="sm:col-span-8 space-y-1.5">
                  <Label htmlFor="sdSelect">Sumber Daya</Label>
                  <select
                    id="sdSelect"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                    value={f.sumberDayaUuid}
                    onChange={(e) => setF({ ...f, sumberDayaUuid: e.target.value })}
                  >
                    <option value="">Pilih Sumber Daya</option>
                    {sdList.map((s) => (
                      <option key={s.uuid} value={s.uuid}>
                        {s.kode} — {s.nama} ({s.satuan}) [{s.tipe}]
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <div className="sm:col-span-5 space-y-1.5">
                    <Label htmlFor="subPkSelect">Pekerjaan Komponen</Label>
                    <select
                      id="subPkSelect"
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                      value={f.subPekerjaanUuid}
                      onChange={(e) => setF({ ...f, subPekerjaanUuid: e.target.value })}
                    >
                      <option value="">Pilih Pekerjaan Lain</option>
                      {pkList.map((item) => (
                        <option key={item.uuid} value={item.uuid}>
                          {item.kode} — {item.nama} ({item.satuan})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-3 space-y-1.5">
                    <Label htmlFor="basisSelect">Basis Harga</Label>
                    <select
                      id="basisSelect"
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                      value={f.basisHarga}
                      onChange={(e) => setF({ ...f, basisHarga: e.target.value })}
                    >
                      <option value="final">Pakai F (Final)</option>
                      <option value="direct">Pakai D (Direct)</option>
                    </select>
                  </div>
                </>
              )}

              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="koefInput">Koefisien</Label>
                <Input
                  id="koefInput"
                  type="number"
                  step="0.0001"
                  min={0}
                  placeholder="0.0000"
                  value={f.koefisien}
                  onChange={(e) => setF({ ...f, koefisien: e.target.value })}
                />
              </div>

              <div className="sm:col-span-2">
                <Button
                  className="w-full gap-1.5"
                  disabled={
                    !(Number(f.koefisien) > 0) ||
                    (compType === 'sumber_daya' && !f.sumberDayaUuid) ||
                    (compType === 'pekerjaan' && !f.subPekerjaanUuid)
                  }
                  onClick={() =>
                    run(async () => {
                      const payload: any = { koefisien: Number(f.koefisien) };
                      if (compType === 'sumber_daya') {
                        payload.sumberDayaUuid = f.sumberDayaUuid;
                      } else {
                        payload.subPekerjaanUuid = f.subPekerjaanUuid;
                        payload.basisHarga = f.basisHarga;
                      }
                      await api(`/pekerjaan/${uuid}/koefisien`, { method: 'POST', body: payload });
                      setF({ ...f, sumberDayaUuid: '', subPekerjaanUuid: '', koefisien: '' });
                    })
                  }
                >
                  <Plus className="h-4 w-4" />
                  <span>Tambah</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calculation Preview (D, E, F) (Design System 6.6) */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="pb-3 border-b border-border bg-muted/20">
            <CardTitle className="text-base font-semibold">Pratinjau Perhitungan Harga Satuan</CardTitle>
            <CardDescription className="text-sm">
              Simulasi kalkulasi Biaya Langsung (D), Overhead (E), dan Harga Satuan (F) sesuai harga lokal BUMDes.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-5 space-y-1.5">
                <Label htmlFor="bumdesAcuan">BUMDes Acuan</Label>
                <select
                  id="bumdesAcuan"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                  value={previewBumdes}
                  onChange={(e) => setPreviewBumdes(e.target.value)}
                >
                  <option value="">Pilih BUMDes</option>
                  {bumdesList.map((b) => (
                    <option key={b.uuid} value={b.uuid}>
                      {b.kode} — {b.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="previewTahun">Tahun</Label>
                <Input
                  id="previewTahun"
                  type="number"
                  value={previewTahun}
                  onChange={(e) => setPreviewTahun(Number(e.target.value))}
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="previewOverhead">Overhead (%)</Label>
                <Input
                  id="previewOverhead"
                  type="number"
                  step="0.1"
                  min={0}
                  max={100}
                  value={previewOverhead}
                  onChange={(e) => setPreviewOverhead(Number(e.target.value))}
                />
              </div>

              <div className="sm:col-span-3">
                <Button
                  className="w-full gap-2"
                  onClick={handleHitungPratinjau}
                  disabled={previewLoading || !previewBumdes}
                >
                  {previewLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Menghitung...</span>
                    </>
                  ) : (
                    <>
                      <Calculator className="h-4 w-4" />
                      <span>Hitung Pratinjau</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {previewRes && (
              <div className="mt-4 rounded-xl border border-border bg-muted/30 p-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Biaya Langsung (D)
                    </p>
                    <p className="num text-xl font-bold text-primary">Rp {rp(previewRes.d)}</p>
                    <p className="text-xs text-muted-foreground">Jumlah seluruh komponen</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Overhead & Keuntungan (E)
                    </p>
                    <p className="num text-xl font-bold text-amber-600 dark:text-amber-400">
                      Rp {rp(previewRes.e)}
                    </p>
                    <p className="text-xs text-muted-foreground">D × {previewOverhead}%</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Harga Satuan Pekerjaan (F)
                    </p>
                    <p className="num text-xl font-bold text-emerald-600 dark:text-emerald-400">
                      Rp {rp(previewRes.f)}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span>D + E ·</span>
                      <Badge
                        variant="secondary"
                        className={
                          previewRes.pembulatan === 'none'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        }
                      >
                        {previewRes.pembulatan === 'down_0' ? 'Dipotong ke rupiah' : 'Tidak dibulatkan'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}
