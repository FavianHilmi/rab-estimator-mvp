'use client';
import * as React from 'react';
import Link from 'next/link';
import { Plus, Search, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import Shell from '@/components/Shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { api, useMe } from '@/lib/api';
import { useDebounce } from '@/lib/useDebounce';

export default function MasterPekerjaan() {
  const me = useMe();
  const [rows, setRows] = React.useState<any[]>([]);
  const [kat, setKat] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState('');
  const [q, setQ] = React.useState('');
  const debouncedQ = useDebounce(q, 300);
  const [fk, setFk] = React.useState({ kode: '', nama: '', pembulatan: 'down_0' });
  const [fp, setFp] = React.useState<any>({ kategoriUuid: '', kode: '', nama: '', satuan: '' });

  const load = () => {
    setLoading(true);
    Promise.all([
      api(`/pekerjaan${debouncedQ ? `?q=${encodeURIComponent(debouncedQ)}` : ''}`),
      api('/kategori'),
    ])
      .then(([pRes, kRes]) => {
        setRows(pRes);
        setKat(kRes);
        if (kRes.length > 0 && !fp.kategoriUuid) {
          setFp((prev: any) => ({ ...prev, kategoriUuid: kRes[0].uuid }));
        }
      })
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  };

  React.useEffect(() => {
    if (me) load();
  }, [me, debouncedQ]);

  if (!me) return null;
  if (me.role !== 'superadmin') {
    return (
      <Shell me={me}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <AlertDescription>Hanya superadmin yang berhak mengakses master pekerjaan.</AlertDescription>
        </Alert>
      </Shell>
    );
  }

  const run = async (fn: () => Promise<any>) => {
    try {
      setErr('');
      await fn();
      load();
    } catch (x: any) {
      setErr(x.message || 'Terjadi kesalahan saat memproses data.');
    }
  };

  return (
    <Shell me={me}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Master Pekerjaan (AHSP)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Standar Analisis Harga Satuan Pekerjaan dan aturan pembulatan per kategori pekerjaan
          </p>
        </div>

        {err && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <AlertDescription className="text-sm">{err}</AlertDescription>
          </Alert>
        )}

        {/* Kategori & Aturan Pembulatan */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="pb-3 border-b border-border bg-muted/20">
            <CardTitle className="text-base font-semibold">
              Kategori & Aturan Pembulatan
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-28">Kode</TableHead>
                  <TableHead>Nama Kategori</TableHead>
                  <TableHead className="w-72">Aturan Pembulatan</TableHead>
                  <TableHead className="w-16 text-center" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {kat.map((k) => (
                  <TableRow key={k.uuid}>
                    <TableCell className="kode font-medium">{k.kode}</TableCell>
                    <TableCell className="font-medium text-foreground">{k.nama}</TableCell>
                    <TableCell>
                      <select
                        className="flex h-8 w-full rounded-md border border-input bg-background px-2.5 py-1 text-xs shadow-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                        value={k.pembulatan ?? 'down_0'}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val && val !== k.pembulatan) {
                            run(() => api(`/kategori/${k.uuid}`, { method: 'PATCH', body: { pembulatan: val } }));
                          }
                        }}
                      >
                        <option value="down_0">Bulat ke Bawah (Rupiah Utuh)</option>
                        <option value="none">Tanpa Pembulatan (Desimal)</option>
                      </select>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        title={`Hapus kategori ${k.nama}`}
                        onClick={() =>
                          confirm(`Hapus kategori ${k.kode} - ${k.nama}?`) &&
                          run(() => api(`/kategori/${k.uuid}`, { method: 'DELETE' }))
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end pt-2 border-t border-border">
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="katKode">Kode Kategori</Label>
                <Input
                  id="katKode"
                  placeholder="Mis. 3"
                  value={fk.kode}
                  onChange={(e) => setFk({ ...fk, kode: e.target.value })}
                />
              </div>

              <div className="sm:col-span-5 space-y-1.5">
                <Label htmlFor="katNama">Nama Kategori</Label>
                <Input
                  id="katNama"
                  placeholder="Pekerjaan Arsitektur"
                  value={fk.nama}
                  onChange={(e) => setFk({ ...fk, nama: e.target.value })}
                />
              </div>

              <div className="sm:col-span-3 space-y-1.5">
                <Label htmlFor="katBulat">Aturan Pembulatan</Label>
                <select
                  id="katBulat"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                  value={fk.pembulatan}
                  onChange={(e) => setFk({ ...fk, pembulatan: e.target.value })}
                >
                  <option value="down_0">Bulat ke Bawah (Rupiah Utuh)</option>
                  <option value="none">Tanpa Pembulatan (Desimal)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <Button
                  className="w-full gap-1.5"
                  disabled={!fk.kode || !fk.nama}
                  onClick={() =>
                    run(async () => {
                      await api('/kategori', { method: 'POST', body: fk });
                      setFk({ kode: '', nama: '', pembulatan: 'down_0' });
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

        {/* Add New AHSP Form */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="pb-3 border-b border-border bg-muted/20">
            <CardTitle className="text-base font-semibold">Tambah Analisis Pekerjaan Baru</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-3 space-y-1.5">
                <Label htmlFor="pkKat">Kategori</Label>
                <select
                  id="pkKat"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                  value={fp.kategoriUuid}
                  onChange={(e) => setFp({ ...fp, kategoriUuid: e.target.value })}
                >
                  <option value="">Pilih Kategori</option>
                  {kat.map((k) => (
                    <option key={k.uuid} value={k.uuid}>
                      {k.kode} — {k.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="pkKode">Kode Analisa</Label>
                <Input
                  id="pkKode"
                  placeholder="3.6.1.10"
                  value={fp.kode}
                  onChange={(e) => setFp({ ...fp, kode: e.target.value })}
                />
              </div>

              <div className="sm:col-span-4 space-y-1.5">
                <Label htmlFor="pkNama">Uraian Pekerjaan</Label>
                <Input
                  id="pkNama"
                  placeholder="Pemasangan 1 m2 Dinding Bata Merah..."
                  value={fp.nama}
                  onChange={(e) => setFp({ ...fp, nama: e.target.value })}
                />
              </div>

              <div className="sm:col-span-1 space-y-1.5">
                <Label htmlFor="pkSatuan">Satuan</Label>
                <Input
                  id="pkSatuan"
                  placeholder="m2"
                  value={fp.satuan}
                  onChange={(e) => setFp({ ...fp, satuan: e.target.value })}
                />
              </div>

              <div className="sm:col-span-2">
                <Button
                  className="w-full gap-1.5"
                  disabled={!fp.kategoriUuid || !fp.kode || !fp.nama || !fp.satuan}
                  onClick={() =>
                    run(async () => {
                      await api('/pekerjaan', { method: 'POST', body: fp });
                      setFp({ ...fp, kode: '', nama: '' });
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

        {/* AHSP List Table */}
        <Card className="border-border bg-card overflow-hidden shadow-sm">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-5 pb-3 gap-3">
            <CardTitle className="text-base font-semibold">
              Daftar Analisis Harga Satuan Pekerjaan ({rows.length})
            </CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari kode analisa atau uraian..."
                className="pl-9 h-9"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">Kode</TableHead>
                  <TableHead>Uraian Pekerjaan</TableHead>
                  <TableHead className="w-24">Satuan</TableHead>
                  <TableHead className="w-48">Kategori</TableHead>
                  <TableHead className="w-44">Aturan Pembulatan</TableHead>
                  <TableHead className="w-16 text-center" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-36 text-center">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span>Memuat data AHSP...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : rows.map((r) => (
                  <TableRow key={r.uuid}>
                    <TableCell className="kode font-medium text-foreground">{r.kode}</TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/pekerjaan/${r.uuid}`}
                        className="font-semibold text-primary hover:underline"
                      >
                        {r.nama}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.satuan}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.kategori?.nama}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          r.kategori?.pembulatan === 'none'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        }
                      >
                        {r.kategori?.pembulatan === 'none' ? 'Tanpa Pembulatan' : 'Bulat ke Bawah (Rp)'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        title={`Hapus ${r.kode}`}
                        onClick={() =>
                          confirm(`Hapus analisis pekerjaan ${r.kode}?`) &&
                          run(() => api(`/pekerjaan/${r.uuid}`, { method: 'DELETE' }))
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {!loading && rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-sm text-muted-foreground">
                      Tidak ada pekerjaan ditemukan.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}
