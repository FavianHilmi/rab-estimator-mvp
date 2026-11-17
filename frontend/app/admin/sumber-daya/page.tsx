'use client';
import * as React from 'react';
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

export default function SumberDayaPage() {
  const me = useMe();
  const [rows, setRows] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState('');
  const [search, setSearch] = React.useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [filterTipe, setFilterTipe] = React.useState<'semua' | 'tenaga' | 'bahan' | 'alat'>('semua');
  const [f, setF] = React.useState<any>({ tipe: 'bahan', kode: '', nama: '', satuan: '' });

  const load = () => {
    setLoading(true);
    api('/sumber-daya')
      .then(setRows)
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  };

  React.useEffect(() => {
    if (me) load();
  }, [me]);

  if (!me) return null;
  if (me.role !== 'superadmin') {
    return (
      <Shell me={me}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <AlertDescription>Hanya superadmin yang berhak mengakses master sumber daya.</AlertDescription>
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
      setErr(x.message || 'Gagal memproses data sumber daya.');
    }
  };

  const filteredRows = rows.filter((r) => {
    const q = debouncedSearch.toLowerCase().trim();
    const matchSearch =
      !q ||
      r.kode.toLowerCase().includes(q) ||
      r.nama.toLowerCase().includes(q);

    const matchTipe = filterTipe === 'semua' || r.tipe === filterTipe;
    return matchSearch && matchTipe;
  });

  return (
    <Shell me={me}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Master Sumber Daya
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Daftar acuan upah tenaga kerja, bahan material, dan sewa alat standar HSD
          </p>
        </div>

        {err && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <AlertDescription className="text-sm">{err}</AlertDescription>
          </Alert>
        )}

        {/* Tambah Sumber Daya Baru */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="pb-3 border-b border-border bg-muted/20">
            <CardTitle className="text-base font-semibold">Tambah Sumber Daya Baru</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-3 space-y-1.5">
                <Label htmlFor="sdTipe">Tipe Sumber Daya</Label>
                <select
                  id="sdTipe"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                  value={f.tipe}
                  onChange={(e) => setF({ ...f, tipe: e.target.value })}
                >
                  <option value="tenaga">Tenaga Kerja</option>
                  <option value="bahan">Bahan Material</option>
                  <option value="alat">Peralatan</option>
                </select>
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="sdKode">Kode</Label>
                <Input
                  id="sdKode"
                  placeholder="Mis. L.01 / B.001"
                  value={f.kode}
                  onChange={(e) => setF({ ...f, kode: e.target.value })}
                />
              </div>

              <div className="sm:col-span-4 space-y-1.5">
                <Label htmlFor="sdNama">Nama Sumber Daya</Label>
                <Input
                  id="sdNama"
                  placeholder="Mis. Tukang Batu / Semen Portland"
                  value={f.nama}
                  onChange={(e) => setF({ ...f, nama: e.target.value })}
                />
              </div>

              <div className="sm:col-span-1 space-y-1.5">
                <Label htmlFor="sdSatuan">Satuan</Label>
                <Input
                  id="sdSatuan"
                  placeholder="OH / kg"
                  value={f.satuan}
                  onChange={(e) => setF({ ...f, satuan: e.target.value })}
                />
              </div>

              <div className="sm:col-span-2">
                <Button
                  className="w-full gap-1.5"
                  disabled={!f.kode || !f.nama || !f.satuan}
                  onClick={() =>
                    run(async () => {
                      await api('/sumber-daya', { method: 'POST', body: f });
                      setF({ ...f, kode: '', nama: '' });
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

        {/* Resources Table & Filters */}
        <Card className="border-border bg-card overflow-hidden shadow-sm">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-5 pb-3 gap-3">
            <CardTitle className="text-base font-semibold">
              Katalog Sumber Daya ({filteredRows.length})
            </CardTitle>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="inline-flex rounded-lg border border-border p-1 bg-muted/40">
                {(['semua', 'tenaga', 'bahan', 'alat'] as const).map((tp) => (
                  <button
                    key={tp}
                    type="button"
                    onClick={() => setFilterTipe(tp)}
                    className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-colors ${
                      filterTipe === tp
                        ? 'bg-background text-foreground shadow-sm font-semibold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tp === 'semua' ? 'Semua' : tp}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari kode atau nama..."
                  className="pl-9 h-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">Kode</TableHead>
                  <TableHead>Nama Sumber Daya</TableHead>
                  <TableHead className="w-28">Tipe</TableHead>
                  <TableHead className="w-24">Satuan</TableHead>
                  <TableHead className="w-16 text-center" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-36 text-center">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span>Memuat katalog sumber daya...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredRows.map((r) => (
                  <TableRow key={r.uuid}>
                    <TableCell className="kode font-medium text-foreground">{r.kode}</TableCell>
                    <TableCell className="font-medium text-foreground">{r.nama}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          r.tipe === 'tenaga'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                            : r.tipe === 'bahan'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                        }
                      >
                        {r.tipe}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.satuan}</TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        title={`Hapus ${r.nama}`}
                        onClick={() =>
                          confirm(`Hapus sumber daya ${r.kode} - ${r.nama}?`) &&
                          run(() => api(`/sumber-daya/${r.uuid}`, { method: 'DELETE' }))
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {!loading && filteredRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-sm text-muted-foreground">
                      Tidak ada sumber daya ditemukan.
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
