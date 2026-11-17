'use client';
import * as React from 'react';
import { Search, AlertCircle, Loader2, Check } from 'lucide-react';
import Shell from '@/components/Shell';
import StatusBadge from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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

export default function HargaLokalPage() {
  const me = useMe();
  const [tahun, setTahun] = React.useState<number>(new Date().getFullYear());
  const [bumdes, setBumdes] = React.useState<any[]>([]);
  const [bUuid, setBUuid] = React.useState<string>('');
  const [rows, setRows] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [savingId, setSavingId] = React.useState<string | null>(null);
  const [err, setErr] = React.useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [filterStatus, setFilterStatus] = React.useState<'semua' | 'belum_diisi' | 'terisi'>('semua');
  const [filterTipe, setFilterTipe] = React.useState<'semua' | 'tenaga' | 'bahan' | 'alat'>('semua');

  const readOnly = me?.role === 'viewer';

  React.useEffect(() => {
    if (me?.role === 'superadmin') {
      api('/bumdes').then((res) => {
        setBumdes(res);
        if (res.length > 0 && !bUuid) setBUuid(res[0].uuid);
      });
    }
  }, [me]);

  const loadData = () => {
    if (!me || (me.role === 'superadmin' && !bUuid)) return;
    setLoading(true);
    api(`/harga?tahun=${tahun}${bUuid ? `&bumdesUuid=${bUuid}` : ''}`)
      .then(setRows)
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  };

  React.useEffect(() => {
    loadData();
  }, [me, tahun, bUuid]);

  if (!me) return null;

  async function save(uuid: string, v: string) {
    if (v === '') return;
    try {
      setErr('');
      setSavingId(uuid);
      await api(`/harga/${uuid}`, {
        method: 'PUT',
        body: { tahun, harga: Number(v), bumdesUuid: bUuid || undefined },
      });
      setSaveSuccessMsg('Harga lokal berhasil diperbarui');
      setTimeout(() => setSaveSuccessMsg(''), 3000);
      loadData();
    } catch (x: any) {
      setErr(x.message || 'Gagal menyimpan harga lokal.');
    } finally {
      setSavingId(null);
    }
  }

  const totalItems = rows.length;
  const filledItems = rows.filter((r) => r.harga !== null && r.harga !== '').length;
  const percentFilled = totalItems > 0 ? Math.round((filledItems / totalItems) * 100) : 0;

  const filteredRows = rows.filter((r) => {
    const matchSearch =
      r.kode.toLowerCase().includes(search.toLowerCase()) ||
      r.nama.toLowerCase().includes(search.toLowerCase());

    const isFilled = r.harga !== null && r.harga !== '';
    const matchStatus =
      filterStatus === 'semua' ||
      (filterStatus === 'terisi' && isFilled) ||
      (filterStatus === 'belum_diisi' && !isFilled);

    const matchTipe = filterTipe === 'semua' || r.tipe === filterTipe;

    return matchSearch && matchStatus && matchTipe;
  });

  return (
    <Shell me={me}>
      <div className="space-y-6">
        {/* Header (Design System 6.4) */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Harga Lokal (HSD)</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Kelola harga satuan dasar upah tenaga, bahan material, dan sewa alat per desa & tahun
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
            {me.role === 'superadmin' && (
              <div className="space-y-1">
                <Label htmlFor="bumdesSelect" className="text-xs">BUMDes Acuan</Label>
                <select
                  id="bumdesSelect"
                  className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                  value={bUuid}
                  onChange={(e) => setBUuid(e.target.value)}
                >
                  {bumdes.map((b) => (
                    <option key={b.uuid} value={b.uuid}>
                      {b.nama}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1 w-32">
              <Label htmlFor="tahunInput" className="text-xs">Tahun Anggaran</Label>
              <Input
                id="tahunInput"
                type="number"
                value={tahun}
                onChange={(e) => setTahun(Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        {err && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <AlertDescription className="text-sm">{err}</AlertDescription>
          </Alert>
        )}

        {saveSuccessMsg && (
          <Alert variant="success" className="py-2.5">
            <Check className="h-4 w-4 shrink-0" />
            <AlertDescription className="text-xs font-medium">{saveSuccessMsg}</AlertDescription>
          </Alert>
        )}

        {/* Progress & Completeness Banner */}
        {totalItems > 0 && (
          <Card className="border-border bg-card shadow-sm">
            <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-2 flex-1 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-foreground">
                    Kelengkapan Harga Tahun {tahun}
                  </span>
                  <Badge variant={percentFilled === 100 ? 'success' : 'warning'}>
                    {percentFilled}% Terisi
                  </Badge>
                </div>

                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      percentFilled === 100 ? 'bg-success' : 'bg-warning'
                    }`}
                    style={{ width: `${percentFilled}%` }}
                  />
                </div>

                <p className="text-xs text-muted-foreground">
                  <b>{filledItems}</b> dari <b>{totalItems}</b> sumber daya telah ditentukan harga lokasinya.
                  {!readOnly && ' Nilai tersimpan otomatis saat input kehilangan fokus (blur).'}
                </p>
              </div>

              <div className="self-start sm:self-auto">
                <Button
                  variant={filterStatus === 'belum_diisi' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus(filterStatus === 'belum_diisi' ? 'semua' : 'belum_diisi')}
                  className="text-xs"
                >
                  {filterStatus === 'belum_diisi'
                    ? 'Tampilkan Semua'
                    : `Lihat Belum Diisi (${totalItems - filledItems})`}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari kode atau uraian sumber daya..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="inline-flex rounded-lg border border-border p-1 bg-card self-start sm:self-auto">
            {(['semua', 'tenaga', 'bahan', 'alat'] as const).map((tp) => (
              <button
                key={tp}
                type="button"
                onClick={() => setFilterTipe(tp)}
                className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-colors ${
                  filterTipe === tp
                    ? 'bg-primary-subtle text-primary font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tp === 'semua' ? 'Semua Tipe' : tp}
              </button>
            ))}
          </div>
        </div>

        {/* Local Prices Table */}
        <Card className="border-border bg-card overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">Kode</TableHead>
                <TableHead>Uraian Sumber Daya</TableHead>
                <TableHead className="w-28">Tipe</TableHead>
                <TableHead className="w-24">Satuan</TableHead>
                <TableHead className="w-52 text-right">Harga Satuan (Rp)</TableHead>
                <TableHead className="w-32 text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-36 text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span>Memuat data harga lokal...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredRows.map((r) => {
                const isFilled = r.harga !== null && r.harga !== '';
                const isSavingThis = savingId === r.uuid;
                return (
                  <TableRow key={r.uuid + tahun} className={!isFilled ? 'bg-warning-subtle/30' : undefined}>
                    <TableCell className="kode font-medium text-foreground">{r.kode}</TableCell>
                    <TableCell className="font-medium text-foreground text-sm">{r.nama}</TableCell>
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
                    <TableCell className="text-right">
                      <div className="relative inline-block w-44">
                        <Input
                          type="number"
                          min={0}
                          step="1"
                          placeholder="Belum diisi"
                          readOnly={readOnly}
                          disabled={isSavingThis}
                          className="h-8 text-right num font-medium text-sm w-full"
                          defaultValue={r.harga ?? ''}
                          onBlur={(e) => save(r.uuid, e.target.value)}
                        />
                        {isSavingThis && (
                          <Loader2 className="absolute left-2.5 top-2 h-4 w-4 animate-spin text-primary" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusBadge status={isFilled ? 'terisi' : 'belum_diisi'} />
                    </TableCell>
                  </TableRow>
                );
              })}

              {!loading && filteredRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-sm text-muted-foreground">
                    Tidak ada sumber daya yang sesuai dengan kriteria filter pencarian.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </Shell>
  );
}
