'use client';
import * as React from 'react';
import {
  Search,
  AlertCircle,
  Loader2,
  Check,
  Plus,
  Copy,
  ArrowUpRight,
  ArrowDownRight,
  Equal,
} from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { api, rp, useMe } from '@/lib/api';
import { useDebounce } from '@/lib/useDebounce';

export default function HargaLokalPage() {
  const me = useMe();
  const [tahun, setTahun] = React.useState<number>(new Date().getFullYear());
  const [serverYears, setServerYears] = React.useState<number[]>([]);
  const [bumdes, setBumdes] = React.useState<any[]>([]);
  const [bUuid, setBUuid] = React.useState<string>('');
  const [rows, setRows] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [savingId, setSavingId] = React.useState<string | null>(null);
  const [err, setErr] = React.useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = React.useState('');
  const [search, setSearch] = React.useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [filterStatus, setFilterStatus] = React.useState<'semua' | 'belum_diisi' | 'berubah' | 'sama'>('semua');
  const [filterTipe, setFilterTipe] = React.useState<'semua' | 'tenaga' | 'bahan' | 'alat'>('semua');

  // Modal Dialog Tambah Tahun Baru & Salin
  const [yearModalOpen, setYearModalOpen] = React.useState(false);
  const [newYear, setNewYear] = React.useState('');
  const [copyFrom, setCopyFrom] = React.useState('');
  const [yearModalErr, setYearModalErr] = React.useState('');
  const [creatingYear, setCreatingYear] = React.useState(false);

  const readOnly = me?.role === 'viewer';

  // Tahun pembanding: tahun tertinggi di bawah tahun aktif, atau tahun - 1
  const bandingkanTahun = React.useMemo(() => {
    if (!serverYears.length) return null;
    const lowerYears = serverYears.filter((y) => y < tahun);
    return lowerYears.length > 0 ? lowerYears[0] : null;
  }, [serverYears, tahun]);

  React.useEffect(() => {
    if (me?.role === 'superadmin') {
      api('/bumdes').then((res) => {
        setBumdes(res);
        if (res.length > 0 && !bUuid) setBUuid(res[0].uuid);
      });
    }
  }, [me]);

  const loadYears = React.useCallback(async () => {
    if (!me || (me.role === 'superadmin' && !bUuid)) return [] as number[];
    try {
      const list: number[] = await api(`/harga/tahun${bUuid ? `?bumdesUuid=${bUuid}` : ''}`);
      setServerYears(list);
      return list;
    } catch {
      return [];
    }
  }, [me, bUuid]);

  const loadData = React.useCallback(() => {
    if (!me || (me.role === 'superadmin' && !bUuid)) return;
    setLoading(true);
    const compareParam = bandingkanTahun ? `&bandingkanTahun=${bandingkanTahun}` : '';
    api(`/harga?tahun=${tahun}${compareParam}${bUuid ? `&bumdesUuid=${bUuid}` : ''}`)
      .then(setRows)
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, [me, tahun, bandingkanTahun, bUuid]);

  // Load daftar tahun saat BUMDes berubah
  React.useEffect(() => {
    if (me) {
      loadYears().then((list) => {
        if (list.length > 0 && !list.includes(tahun)) {
          setTahun(list[0]);
        }
      });
    }
  }, [me, bUuid, loadYears]);

  // Load data tabel saat tahun, BUMDes, atau pembanding berubah
  React.useEffect(() => {
    loadData();
  }, [loadData]);

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
      loadYears();
      loadData();
    } catch (x: any) {
      setErr(x.message || 'Gagal menyimpan harga lokal.');
    } finally {
      setSavingId(null);
    }
  }

  function openNewYearModal() {
    const highest = serverYears.length > 0 ? Math.max(...serverYears) : new Date().getFullYear();
    setNewYear(String(highest + 1));
    setCopyFrom(serverYears.length > 0 ? String(serverYears[0]) : '');
    setYearModalErr('');
    setYearModalOpen(true);
  }

  async function handleCreateYear(e: React.FormEvent) {
    e.preventDefault();
    const targetY = Number(newYear);
    if (!Number.isInteger(targetY) || targetY < 2000 || targetY > 2100) {
      setYearModalErr('Masukkan tahun yang valid (2000 - 2100).');
      return;
    }
    if (serverYears.includes(targetY)) {
      setYearModalErr(`Tahun ${targetY} sudah terdaftar. Silakan pilih dari dropdown tahun.`);
      return;
    }
    if (!copyFrom) {
      setYearModalErr('Pilih tahun acuan yang ingin disalin.');
      return;
    }

    setCreatingYear(true);
    setYearModalErr('');
    try {
      const res = await api('/harga/salin', {
        method: 'POST',
        body: {
          dariTahun: Number(copyFrom),
          keTahun: targetY,
          bumdesUuid: bUuid || undefined,
        },
      });

      setSaveSuccessMsg(`Tahun anggaran ${targetY} berhasil dibuka! ${res.disalin} harga disalin dari tahun ${copyFrom}.`);
      setTimeout(() => setSaveSuccessMsg(''), 4000);

      await loadYears();
      setTahun(targetY);
      setYearModalOpen(false);
    } catch (x: any) {
      setYearModalErr(x.message || 'Gagal membuat tahun anggaran baru.');
    } finally {
      setCreatingYear(false);
    }
  }

  const totalItems = rows.length;
  const filledItems = rows.filter((r) => r.harga !== null && r.harga !== '').length;
  const percentFilled = totalItems > 0 ? Math.round((filledItems / totalItems) * 100) : 0;

  // Hitung jumlah item yang berubah vs sama dari tahun acuan
  const changedItemsCount = rows.filter((r) => {
    const isFilled = r.harga !== null && r.harga !== '';
    const hasPrev = r.hargaLalu !== null && r.hargaLalu !== undefined && r.hargaLalu !== '';
    return isFilled && hasPrev && Number(r.harga) !== Number(r.hargaLalu);
  }).length;

  const sameItemsCount = rows.filter((r) => {
    const isFilled = r.harga !== null && r.harga !== '';
    const hasPrev = r.hargaLalu !== null && r.hargaLalu !== undefined && r.hargaLalu !== '';
    return isFilled && hasPrev && Number(r.harga) === Number(r.hargaLalu);
  }).length;

  const filteredRows = rows.filter((r) => {
    const q = debouncedSearch.toLowerCase().trim();
    const matchSearch =
      !q ||
      r.kode.toLowerCase().includes(q) ||
      r.nama.toLowerCase().includes(q);

    const isFilled = r.harga !== null && r.harga !== '';
    const hasPrev = r.hargaLalu !== null && r.hargaLalu !== undefined && r.hargaLalu !== '';
    const isChanged = isFilled && hasPrev && Number(r.harga) !== Number(r.hargaLalu);
    const isSame = isFilled && hasPrev && Number(r.harga) === Number(r.hargaLalu);

    let matchStatus = true;
    if (filterStatus === 'belum_diisi') matchStatus = !isFilled;
    else if (filterStatus === 'berubah') matchStatus = isChanged;
    else if (filterStatus === 'sama') matchStatus = isSame;

    const matchTipe = filterTipe === 'semua' || r.tipe === filterTipe;

    return matchSearch && matchStatus && matchTipe;
  });

  return (
    <Shell me={me}>
      <div className="space-y-6">
        {/* Header */}
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

            {/* Dropdown Selector Tahun + Tombol Tambah Tahun Baru */}
            <div className="space-y-1">
              <Label htmlFor="tahunSelect" className="text-xs">Tahun Anggaran</Label>
              <div className="flex items-center gap-1.5">
                <select
                  id="tahunSelect"
                  className="flex h-9 min-w-[120px] rounded-md border border-input bg-background px-3 py-1 text-sm font-semibold shadow-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary cursor-pointer"
                  value={tahun}
                  onChange={(e) => setTahun(Number(e.target.value))}
                >
                  {serverYears.length > 0 ? (
                    serverYears.map((y) => (
                      <option key={y} value={y}>
                        Tahun {y}
                      </option>
                    ))
                  ) : (
                    <option value={tahun}>Tahun {tahun}</option>
                  )}
                </select>

                {!readOnly && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={openNewYearModal}
                    className="h-9 gap-1.5 text-xs font-semibold"
                    title="Buka Tahun Anggaran Baru"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Tahun Baru</span>
                  </Button>
                )}
              </div>
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
                  {bandingkanTahun && (
                    <span className="text-xs text-muted-foreground ml-1">
                      (Acuan komparasi: Tahun {bandingkanTahun})
                    </span>
                  )}
                </div>

                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      percentFilled === 100 ? 'bg-success' : 'bg-warning'
                    }`}
                    style={{ width: `${percentFilled}%` }}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span>
                    <b>{filledItems}</b> dari <b>{totalItems}</b> sumber daya telah ditentukan harga lokasinya.
                  </span>
                  {bandingkanTahun && changedItemsCount > 0 && (
                    <span className="text-amber-600 dark:text-amber-400 font-medium">
                      · {changedItemsCount} item disesuaikan dari {bandingkanTahun}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                <Button
                  variant={filterStatus === 'belum_diisi' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus(filterStatus === 'belum_diisi' ? 'semua' : 'belum_diisi')}
                  className="text-xs"
                >
                  {filterStatus === 'belum_diisi'
                    ? 'Tampilkan Semua'
                    : `Belum Diisi (${totalItems - filledItems})`}
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

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {/* Filter Status Komparasi */}
            {bandingkanTahun && (
              <div className="inline-flex rounded-lg border border-border p-1 bg-card">
                <button
                  type="button"
                  onClick={() => setFilterStatus('semua')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    filterStatus === 'semua'
                      ? 'bg-primary-subtle text-primary font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Semua
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus('berubah')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    filterStatus === 'berubah'
                      ? 'bg-primary-subtle text-primary font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="Harga yang berbeda dari tahun acuan"
                >
                  Berubah ({changedItemsCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus('sama')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    filterStatus === 'sama'
                      ? 'bg-primary-subtle text-primary font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="Harga yang masih sama persis dengan tahun acuan"
                >
                  Tetap Sama ({sameItemsCount})
                </button>
              </div>
            )}

            {/* Filter Tipe */}
            <div className="inline-flex rounded-lg border border-border p-1 bg-card">
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
        </div>

        {/* Local Prices Table */}
        <Card className="border-border bg-card overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">Kode</TableHead>
                <TableHead>Uraian Sumber Daya</TableHead>
                <TableHead className="w-24">Tipe</TableHead>
                <TableHead className="w-20">Satuan</TableHead>
                {bandingkanTahun && (
                  <TableHead className="w-44 text-right">
                    Harga Thn {bandingkanTahun}
                  </TableHead>
                )}
                <TableHead className="w-48 text-right">
                  Harga Satuan Thn {tahun} (Rp)
                </TableHead>
                <TableHead className="w-36 text-center">
                  {bandingkanTahun ? 'Status / Selisih' : 'Status'}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={bandingkanTahun ? 7 : 6} className="h-36 text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span>Memuat data harga lokal...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredRows.map((r) => {
                const isFilled = r.harga !== null && r.harga !== '';
                const isSavingThis = savingId === r.uuid;

                const hargaNow = isFilled ? Number(r.harga) : null;
                const hasPrev = r.hargaLalu !== null && r.hargaLalu !== undefined && r.hargaLalu !== '';
                const hargaPrev = hasPrev ? Number(r.hargaLalu) : null;

                let selisihNominal: number | null = null;
                let selisihPersen: number | null = null;
                if (hargaNow !== null && hargaPrev !== null && hargaPrev > 0) {
                  selisihNominal = hargaNow - hargaPrev;
                  selisihPersen = ((hargaNow - hargaPrev) / hargaPrev) * 100;
                }

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

                    {/* Kolom Harga Acuan Tahun Pembanding */}
                    {bandingkanTahun && (
                      <TableCell className="text-right text-sm text-muted-foreground num font-normal">
                        {hargaPrev !== null ? `Rp ${rp(hargaPrev)}` : '-'}
                      </TableCell>
                    )}

                    {/* Kolom Harga Satuan Tahun Aktif */}
                    <TableCell className="text-right">
                      <div className="relative inline-block w-40">
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

                    {/* Kolom Status / Indikator Selisih */}
                    <TableCell className="text-center">
                      {!isFilled ? (
                        <StatusBadge status="belum_diisi" />
                      ) : !bandingkanTahun || hargaPrev === null ? (
                        <StatusBadge status="terisi" />
                      ) : selisihNominal === 0 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          <Equal className="h-3 w-3" /> Tetap (Sama)
                        </span>
                      ) : selisihNominal !== null && selisihNominal > 0 ? (
                        <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-full">
                          <ArrowUpRight className="h-3 w-3" /> +{selisihPersen?.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">
                          <ArrowDownRight className="h-3 w-3" /> {selisihPersen?.toFixed(1)}%
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}

              {!loading && filteredRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={bandingkanTahun ? 7 : 6} className="h-32 text-center text-sm text-muted-foreground">
                    Tidak ada sumber daya yang sesuai dengan kriteria filter pencarian.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Modal Dialog Buka Tahun Anggaran Baru */}
        <Dialog open={yearModalOpen} onOpenChange={setYearModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Copy className="h-5 w-5 text-primary" />
                <span>Buka Tahun Anggaran Baru</span>
              </DialogTitle>
              <DialogDescription>
                Buat tahun anggaran baru dan salin seluruh data harga lokal dari tahun acuan yang sudah ada.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateYear} className="space-y-4 pt-2">
              {yearModalErr && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <AlertDescription className="text-xs">{yearModalErr}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="inputTahunBaru" className="text-xs font-semibold">Tahun Anggaran Baru</Label>
                <Input
                  id="inputTahunBaru"
                  type="number"
                  min={2000}
                  max={2100}
                  value={newYear}
                  onChange={(e) => setNewYear(e.target.value)}
                  placeholder="contoh: 2027"
                  required
                  autoFocus
                />
                <p className="text-[11px] text-muted-foreground">Tahun anggaran baru yang akan dibuka.</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="selectTahunSumber" className="text-xs font-semibold">Salin Seluruh Harga Dari Tahun</Label>
                <select
                  id="selectTahunSumber"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary cursor-pointer"
                  value={copyFrom}
                  onChange={(e) => setCopyFrom(e.target.value)}
                  required
                >
                  {serverYears.map((y) => (
                    <option key={y} value={y}>
                      Tahun {y}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-muted-foreground">
                  Semua harga lokal dari tahun {copyFrom || 'ini'} akan disalin otomatis ke tahun {newYear || 'baru'}. Anda dapat mengubah harga satuan item yang mengalami kenaikan setelahnya.
                </p>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setYearModalOpen(false)}
                  disabled={creatingYear}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={creatingYear || !newYear || !copyFrom} className="gap-2">
                  {creatingYear ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Menyalin Data...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Buat & Salin Harga</span>
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Shell>
  );
}
