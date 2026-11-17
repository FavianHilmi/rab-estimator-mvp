'use client';
import * as React from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  ChevronRight,
  FileText,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import Shell from '@/components/Shell';
import StatusBadge from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { api, useMe } from '@/lib/api';
import { useDebounce } from '@/lib/useDebounce';

export default function ProyekList() {
  const me = useMe();
  const [rows, setRows] = React.useState<any[]>([]);
  const [bumdes, setBumdes] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [err, setErr] = React.useState('');
  const [search, setSearch] = React.useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [filterStatus, setFilterStatus] = React.useState<'semua' | 'draft' | 'final'>('semua');
  const [modalOpen, setModalOpen] = React.useState(false);
  const [formErr, setFormErr] = React.useState('');

  const [f, setF] = React.useState<any>({
    namaProyek: '',
    tahun: new Date().getFullYear(),
    overheadPersen: 10,
    ppnPersen: 0,
    bumdesUuid: '',
  });

  const load = () => {
    setLoading(true);
    api('/proyek')
      .then(setRows)
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  };

  React.useEffect(() => {
    if (!me) return;
    load();
    if (me.role === 'superadmin') {
      api('/bumdes').then((bList) => {
        setBumdes(bList);
        if (bList.length > 0 && !f.bumdesUuid) {
          setF((prev: any) => ({ ...prev, bumdesUuid: bList[0].uuid }));
        }
      });
    }
  }, [me]);

  if (!me) return null;

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setFormErr('');
    setCreating(true);
    try {
      await api('/proyek', { method: 'POST', body: f });
      setF((prev: any) => ({
        ...prev,
        namaProyek: '',
        tahun: new Date().getFullYear(),
        overheadPersen: 10,
        ppnPersen: 0,
      }));
      setModalOpen(false);
      load();
    } catch (x: any) {
      setFormErr(x.message || 'Gagal menyimpan proyek');
    } finally {
      setCreating(false);
    }
  }

  const filteredRows = rows.filter((r) => {
    const q = debouncedSearch.toLowerCase().trim();
    const matchSearch =
      !q ||
      r.nomorDokumen.toLowerCase().includes(q) ||
      r.namaProyek.toLowerCase().includes(q) ||
      (r.bumdes?.nama && r.bumdes.nama.toLowerCase().includes(q));

    const matchStatus = filterStatus === 'semua' || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const countDraft = rows.filter((r) => r.status === 'draft').length;
  const countFinal = rows.filter((r) => r.status === 'final').length;

  return (
    <Shell me={me}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Proyek RAB</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Daftar Rencana Anggaran Biaya fisik desa dan BUMDes
            </p>
          </div>

          {me.role !== 'viewer' && (
            <Button
              onClick={() => {
                setFormErr('');
                setModalOpen(true);
              }}
              className="gap-2 self-start sm:self-auto"
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
              <span>Buat Proyek Baru</span>
            </Button>
          )}
        </div>

        {err && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <AlertDescription className="text-sm">{err}</AlertDescription>
          </Alert>
        )}

        {/* Modal Dialog Buat Proyek Baru */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-lg sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Buat Dokumen Proyek RAB Baru</DialogTitle>
            </DialogHeader>

            {formErr && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <AlertDescription className="text-sm">{formErr}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={create} className="space-y-4 pt-1">
              {me.role === 'superadmin' && (
                <div className="space-y-1.5">
                  <Label htmlFor="bumdesSelect">
                    Desa / BUMDes <span className="text-destructive">*</span>
                  </Label>
                  <select
                    id="bumdesSelect"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                    value={f.bumdesUuid}
                    onChange={(e) => setF({ ...f, bumdesUuid: e.target.value })}
                    required
                  >
                    <option value="">Pilih BUMDes</option>
                    {bumdes.map((b) => (
                      <option key={b.uuid} value={b.uuid}>
                        {b.nama}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="namaProyek">
                  Nama Proyek Kegiatan <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="namaProyek"
                  placeholder="Mis. Pembangunan Saluran Drainase Dusun II"
                  value={f.namaProyek}
                  onChange={(e) => setF({ ...f, namaProyek: e.target.value })}
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="tahun">
                    Tahun Anggaran <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="tahun"
                    type="number"
                    value={f.tahun}
                    onChange={(e) => setF({ ...f, tahun: Number(e.target.value) })}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="overhead">Overhead (%)</Label>
                  <Input
                    id="overhead"
                    type="number"
                    step="0.1"
                    min={0}
                    max={100}
                    value={f.overheadPersen}
                    onChange={(e) => setF({ ...f, overheadPersen: Number(e.target.value) })}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ppn">PPN (%)</Label>
                  <Input
                    id="ppn"
                    type="number"
                    step="0.1"
                    min={0}
                    max={100}
                    value={f.ppnPersen}
                    onChange={(e) => setF({ ...f, ppnPersen: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={creating || !f.namaProyek.trim() || (me.role === 'superadmin' && !f.bumdesUuid)}
                >
                  {creating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan Dokumen Proyek'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nomor dokumen atau nama proyek..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="inline-flex rounded-lg border border-border p-1 bg-card self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setFilterStatus('semua')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                filterStatus === 'semua'
                  ? 'bg-primary-subtle text-primary font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Semua ({rows.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('draft')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                filterStatus === 'draft'
                  ? 'bg-primary-subtle text-primary font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Draft ({countDraft})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('final')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                filterStatus === 'final'
                  ? 'bg-primary-subtle text-primary font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Final ({countFinal})
            </button>
          </div>
        </div>

        {/* Projects Data Table */}
        <Card className="border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-48">Nomor Dokumen</TableHead>
                <TableHead>Nama Proyek</TableHead>
                <TableHead className="w-48">BUMDes</TableHead>
                <TableHead className="w-24 text-center">Tahun</TableHead>
                <TableHead className="w-32 text-center">Status</TableHead>
                <TableHead className="w-24 text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-36 text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span>Memuat daftar proyek...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredRows.map((r) => (
                <TableRow key={r.uuid}>
                  <TableCell className="kode font-medium text-foreground">{r.nomorDokumen}</TableCell>
                  <TableCell>
                    <Link
                      href={`/proyek/${r.uuid}`}
                      className="font-semibold text-primary hover:underline"
                    >
                      {r.namaProyek}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {r.bumdes?.nama ?? '-'}
                  </TableCell>
                  <TableCell className="text-center num text-sm">{r.tahun}</TableCell>
                  <TableCell className="text-center">
                    <StatusBadge status={r.status} />
                  </TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="sm" asChild className="h-8 px-2 text-xs">
                      <Link href={`/proyek/${r.uuid}`}>
                        <span>Buka</span>
                        <ChevronRight className="h-3.5 w-3.5 ml-1" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {!loading && filteredRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                      <FileText className="h-10 w-10 text-muted-foreground/60" strokeWidth={1.5} />
                      <p className="text-sm font-semibold text-foreground">
                        {search ? 'Tidak ada proyek yang sesuai dengan pencarian' : 'Belum ada proyek terdaftar'}
                      </p>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        {search
                          ? 'Coba gunakan kata kunci pencarian yang berbeda'
                          : 'Mulai dengan membuat proyek kegiatan baru untuk menyusun Rencana Anggaran Biaya.'}
                      </p>
                      {!search && me.role !== 'viewer' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setFormErr('');
                            setModalOpen(true);
                          }}
                          className="mt-2 text-xs"
                        >
                          <Plus className="h-3.5 w-3.5 mr-1" />
                          Buat Proyek Sekarang
                        </Button>
                      )}
                    </div>
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
