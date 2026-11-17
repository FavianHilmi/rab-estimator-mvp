'use client';
import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Printer,
  Lock,
  Coins,
  AlertTriangle,
  AlertCircle,
  Trash2,
  Plus,
  Loader2,
  Search,
  Check,
  Layers,
  X,
  FileCheck,
} from 'lucide-react';
import Shell from '@/components/Shell';
import StatusBadge from '@/components/ui/StatusBadge';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { api, rp, useMe } from '@/lib/api';
import { useDebounce } from '@/lib/useDebounce';

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV'];

export default function RabDetail() {
  const me = useMe();
  const { uuid } = useParams<{ uuid: string }>();
  const [d, setD] = React.useState<any>(null);
  const [pk, setPk] = React.useState<any[]>([]);
  const [katList, setKatList] = React.useState<any[]>([]);
  const [err, setErr] = React.useState('');
  const [babForm, setBabForm] = React.useState({ kode: '', namaBab: '' });

  // Modal Opsi A: Tambah Item Dua Panel
  const [showItemModal, setShowItemModal] = React.useState(false);
  const [targetBabUuid, setTargetBabUuid] = React.useState<string>('');
  const [modalSearch, setModalSearch] = React.useState('');
  const debouncedModalSearch = useDebounce(modalSearch, 300);
  const [modalKat, setModalKat] = React.useState<string>('semua');
  const [selectedPkUuid, setSelectedPkUuid] = React.useState<string>('');
  const [pkDetail, setPkDetail] = React.useState<any>(null);
  const [pkPreview, setPkPreview] = React.useState<any>(null);
  const [loadingDetail, setLoadingDetail] = React.useState(false);
  const [itemVolume, setItemVolume] = React.useState('');
  const [addingItem, setAddingItem] = React.useState(false);
  const [modalSuccessNotice, setModalSuccessNotice] = React.useState<string | null>(null);

  // Cache detail & pratinjau agar klik antar item instan
  const detailCache = React.useRef<Record<string, any>>({});
  const previewCache = React.useRef<Record<string, any>>({});

  // Modal Finalisasi
  const [showFinalModal, setShowFinalModal] = React.useState(false);
  const [finalizing, setFinalizing] = React.useState(false);

  const load = () => api(`/proyek/${uuid}`).then(setD).catch((e) => setErr(e.message));

  React.useEffect(() => {
    if (me) {
      load();
      api('/pekerjaan').then(setPk).catch((e) => setErr(e.message));
      api('/kategori').then(setKatList).catch(() => {});
    }
  }, [me, uuid]);

  // Efek saat item dipilih di modal Opsi A
  React.useEffect(() => {
    if (!selectedPkUuid || !d?.proyek) return;

    let isMounted = true;
    setLoadingDetail(true);

    const fetchItemInfo = async () => {
      try {
        // Ambil detail komponen
        let detail = detailCache.current[selectedPkUuid];
        if (!detail) {
          detail = await api(`/pekerjaan/${selectedPkUuid}`);
          detailCache.current[selectedPkUuid] = detail;
        }

        // Ambil pratinjau perhitungan D, E, F
        let preview = previewCache.current[selectedPkUuid];
        if (!preview) {
          const bumdesQuery = d.proyek.bumdes?.uuid ? `&bumdesUuid=${d.proyek.bumdes.uuid}` : '';
          preview = await api(
            `/pekerjaan/${selectedPkUuid}/hitung?tahun=${d.proyek.tahun}&overhead=${d.proyek.overheadPersen}${bumdesQuery}`
          ).catch(() => null);
          previewCache.current[selectedPkUuid] = preview;
        }

        if (isMounted) {
          setPkDetail(detail);
          setPkPreview(preview);
        }
      } catch (e) {
        // fallback jika error
      } finally {
        if (isMounted) setLoadingDetail(false);
      }
    };

    fetchItemInfo();

    return () => {
      isMounted = false;
    };
  }, [selectedPkUuid, d?.proyek]);

  if (!me) return null;
  if (!d) {
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
            <span>Memuat data rincian proyek RAB...</span>
          </div>
        )}
      </Shell>
    );
  }

  const locked = d.proyek.status === 'final';
  const canEdit = me.role !== 'viewer' && !locked;

  const run = async (fn: () => Promise<any>) => {
    try {
      setErr('');
      await fn();
      await load();
    } catch (x: any) {
      setErr(x.message || 'Terjadi kesalahan saat memproses permintaan.');
    }
  };

  const handleFinalisasi = async () => {
    setFinalizing(true);
    try {
      await api(`/proyek/${uuid}/finalisasi`, { method: 'POST' });
      setShowFinalModal(false);
      await load();
    } catch (x: any) {
      setErr(x.message || 'Gagal memfinalkan RAB.');
    } finally {
      setFinalizing(false);
    }
  };

  // Buka Modal Tambah Item (Opsi A)
  const openItemModal = (babUuid?: string) => {
    const activeBabUuid = babUuid || (d.bab[0]?.uuid ?? '');
    setTargetBabUuid(activeBabUuid);
    setModalSearch('');
    setModalKat('semua');
    setItemVolume('');
    setModalSuccessNotice(null);

    // Otomatis pilih item pertama jika ada
    if (pk.length > 0) {
      setSelectedPkUuid(pk[0].uuid);
    }
    setShowItemModal(true);
  };

  // Submit tambah item dari dalam modal Opsi A (modal TETAP TERBUKA)
  const handleAddItemFromModal = async () => {
    if (!targetBabUuid || !selectedPkUuid || !itemVolume || Number(itemVolume) <= 0) return;
    setAddingItem(true);
    setModalSuccessNotice(null);
    try {
      await api(`/bab/${targetBabUuid}/item`, {
        method: 'POST',
        body: {
          pekerjaanUuid: selectedPkUuid,
          volume: Number(itemVolume),
        },
      });

      // Update data RAB di background
      await load();

      // Berikan notifikasi sukses di dalam modal dan reset volume
      const targetBab = d.bab.find((b: any) => b.uuid === targetBabUuid);
      const currentSelected = pk.find((p) => p.uuid === selectedPkUuid);
      setModalSuccessNotice(
        `Berhasil ditambahkan: ${currentSelected?.kode} (Volume: ${rp(itemVolume, 2)} ${currentSelected?.satuan}) ke Bab ${targetBab?.kode ?? ''}!`
      );
      setItemVolume('');
    } catch (x: any) {
      setErr(x.message || 'Gagal menambahkan item ke bab.');
    } finally {
      setAddingItem(false);
    }
  };

  // Filter list AHSP di panel kiri modal
  const filteredModalPk = pk.filter((p) => {
    const q = debouncedModalSearch.toLowerCase().trim();
    const matchSearch =
      !q ||
      p.kode.toLowerCase().includes(q) ||
      p.nama.toLowerCase().includes(q);
    const matchKat = modalKat === 'semua' || p.kategori?.uuid === modalKat;
    return matchSearch && matchKat;
  });

  const currentBab = d.bab.find((b: any) => b.uuid === targetBabUuid);
  const currentBabItemPks = currentBab?.items?.map((it: any) => it.pekerjaanUuid) || [];
  const allRabItemPks = d.bab.flatMap((b: any) => b.items.map((it: any) => it.pekerjaanUuid));

  const selectedPkItem = pk.find((p) => p.uuid === selectedPkUuid);

  return (
    <Shell me={me}>
      <div className="space-y-6">
        {/* A. Project Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 noprint">
              <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-xs text-muted-foreground">
                <Link href="/proyek">
                  <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                  Proyek RAB
                </Link>
              </Button>
              <span className="text-muted-foreground/60 text-xs">/</span>
              <span className="kode text-xs text-muted-foreground font-medium">{d.proyek.nomorDokumen}</span>
            </div>

            {/* Print Header Information */}
            <div className="print-only mb-6">
              <h1 className="text-xl font-bold uppercase tracking-wide">
                RENCANA ANGGARAN BIAYA (RAB)
              </h1>
              <p className="text-sm font-semibold mt-1">{d.proyek.namaProyek}</p>
              <div className="grid grid-cols-2 gap-2 text-xs mt-3 border-t border-b border-black py-2">
                <div>
                  <p>Nomor Dokumen: <b>{d.proyek.nomorDokumen}</b></p>
                  <p>BUMDes / Desa: <b>{d.proyek.bumdes?.nama ?? '-'}</b></p>
                </div>
                <div>
                  <p>Tahun Anggaran: <b>{d.proyek.tahun}</b></p>
                  <p>Status Dokumen: <b>{locked ? 'FINAL (Telah Dikunci)' : 'DRAFT (Belum Difinalkan)'}</b></p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 noprint">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{d.proyek.namaProyek}</h1>
              <StatusBadge status={d.proyek.status} />
            </div>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-sm text-muted-foreground noprint">
              <span className="kode">{d.proyek.nomorDokumen}</span>
              <span>·</span>
              <span>Tahun {d.proyek.tahun}</span>
              <span>·</span>
              <span>Overhead {d.proyek.overheadPersen}%</span>
              <span>·</span>
              <span>PPN {d.proyek.ppnPersen}%</span>
            </div>
          </div>

          <div className="flex items-center gap-2 noprint self-start md:self-auto">
            <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2">
              <Printer className="h-4 w-4" />
              <span>Cetak / PDF</span>
            </Button>

            {canEdit && (
              <Button
                size="sm"
                onClick={() => setShowFinalModal(true)}
                disabled={!d.rekap.lengkap}
                className="gap-2"
              >
                <Lock className="h-4 w-4" />
                <span>Finalkan RAB</span>
              </Button>
            )}
          </div>
        </div>

        {/* B. Cost Settings (Overhead & PPN) */}
        {canEdit && (
          <Card className="noprint border-border bg-card shadow-sm">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="overheadInput">Overhead & Keuntungan Proyek (%)</Label>
                  <p className="text-xs text-muted-foreground">Berlaku untuk seluruh pekerjaan dan perhitungan rekap</p>
                  <Input
                    id="overheadInput"
                    type="number"
                    step="0.1"
                    min={0}
                    max={100}
                    defaultValue={Number(d.proyek.overheadPersen)}
                    onBlur={(e) =>
                      run(() =>
                        api(`/proyek/${uuid}`, {
                          method: 'PATCH',
                          body: { overheadPersen: Number(e.target.value.replace(',', '.')) },
                        })
                      )
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ppnInput">Pajak Pertambahan Nilai / PPN (%)</Label>
                  <p className="text-xs text-muted-foreground">Persentase pajak yang dihitung dari Real Cost</p>
                  <Input
                    id="ppnInput"
                    type="number"
                    step="0.1"
                    min={0}
                    max={100}
                    defaultValue={Number(d.proyek.ppnPersen)}
                    onBlur={(e) =>
                      run(() =>
                        api(`/proyek/${uuid}`, {
                          method: 'PATCH',
                          body: { ppnPersen: Number(e.target.value.replace(',', '.')) },
                        })
                      )
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {err && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <AlertDescription className="text-sm">{err}</AlertDescription>
          </Alert>
        )}

        {/* Warning if local prices incomplete */}
        {!d.rekap.lengkap && (
          <Alert variant="warning" className="noprint">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
              <div>
                <AlertTitle className="text-sm font-semibold">Harga lokal belum lengkap</AlertTitle>
                <AlertDescription className="text-xs mt-0.5">
                  Sebagian item belum bisa dihitung karena harga sumber daya belum diisi untuk tahun {d.proyek.tahun}. Total rekapitulasi belum lengkap.
                </AlertDescription>
              </div>
              <Button variant="outline" size="sm" asChild className="h-8 text-xs shrink-0 bg-background self-start sm:self-auto">
                <Link href="/harga">
                  <Coins className="h-3.5 w-3.5 mr-1.5" />
                  Lengkapi Harga Lokal
                </Link>
              </Button>
            </div>
          </Alert>
        )}

        {/* C. Budget Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 noprint">
          <Card className="border-border bg-card shadow-sm">
            <CardContent className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                A. Real Cost (Subtotal Bab)
              </p>
              <p className="num text-xl font-bold text-foreground mt-2">
                Rp {rp(d.rekap.realCost)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Total biaya langsung sebelum PPN</p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-sm">
            <CardContent className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                B. PPN ({d.proyek.ppnPersen}%)
              </p>
              <p className="num text-xl font-bold text-foreground mt-2">
                Rp {rp(d.rekap.ppn)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Real Cost × {d.proyek.ppnPersen}%</p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-sm">
            <CardContent className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                C. Total Harga Pekerjaan
              </p>
              <p className="num text-xl font-bold text-foreground mt-2">
                Rp {rp(d.rekap.total)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Real Cost + PPN</p>
            </CardContent>
          </Card>

          <Card className="border-primary/40 bg-primary-subtle text-primary shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-primary">
                  D. Nilai Dibulatkan
                </p>
                {!d.rekap.lengkap && (
                  <StatusBadge status="incomplete" label="Belum lengkap" />
                )}
              </div>
              <p className="num text-2xl font-bold text-primary mt-2">
                Rp {rp(d.rekap.dibulatkan, 0)}
              </p>
              <p className="text-xs text-primary/80 mt-1">Dipotong ke kelipatan 1.000</p>
            </CardContent>
          </Card>
        </div>

        {/* D & E. Chapters & Items List */}
        <div className="space-y-6">
          {d.bab.map((b: any) => (
            <Card key={b.uuid} className="border-border bg-card overflow-hidden shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between p-4 px-5 border-b border-border bg-muted/20">
                <div>
                  <CardTitle className="text-base font-bold">
                    Bab {b.kode}. {b.namaBab}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm mr-2">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="num font-bold text-foreground">Rp {rp(b.subtotal)}</span>
                  </div>

                  {canEdit && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1.5 text-xs noprint"
                        onClick={() => openItemModal(b.uuid)}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Tambah Item</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10 noprint"
                        title="Hapus bab"
                        onClick={() =>
                          confirm(`Hapus Bab ${b.kode} beserta seluruh item pekerjaannya?`) &&
                          run(() => api(`/bab/${b.uuid}`, { method: 'DELETE' }))
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-32">Kode Analisa</TableHead>
                      <TableHead>Uraian Pekerjaan</TableHead>
                      <TableHead className="w-28 text-right">Volume</TableHead>
                      <TableHead className="w-20">Satuan</TableHead>
                      <TableHead className="w-36 text-right">Harga Satuan (Rp)</TableHead>
                      <TableHead className="w-36 text-right">Jumlah Harga (Rp)</TableHead>
                      <TableHead className="w-12 noprint text-center" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {b.items.map((it: any) => {
                      const hasError = !!it.error;
                      return (
                        <TableRow key={it.uuid} className={hasError ? 'bg-warning-subtle/40' : undefined}>
                          <TableCell className="kode font-medium text-foreground">{it.kode}</TableCell>
                          <TableCell>
                            <span className="text-sm font-medium text-foreground">{it.nama}</span>
                            {hasError && (
                              <p className="text-xs text-destructive mt-1 font-normal">{it.error}</p>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {canEdit ? (
                              <Input
                                type="number"
                                step="0.0001"
                                min={0}
                                className="h-7 text-right text-xs num w-24 ml-auto"
                                defaultValue={Number(it.volume)}
                                onBlur={(e) =>
                                  run(() =>
                                    api(`/item/${it.uuid}`, {
                                      method: 'PATCH',
                                      body: { volume: Number(e.target.value.replace(',', '.')) },
                                    })
                                  )
                                }
                              />
                            ) : (
                              <span className="num text-sm">{rp(it.volume, 2)}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{it.satuan}</TableCell>
                          <TableCell className="num text-sm">
                            {it.hargaSatuan ? rp(it.hargaSatuan) : <span className="text-muted-foreground">-</span>}
                          </TableCell>
                          <TableCell className="num text-sm font-semibold">
                            {it.total ? rp(it.total) : <span className="text-muted-foreground">-</span>}
                          </TableCell>
                          <TableCell className="noprint text-center">
                            {canEdit && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                onClick={() => run(() => api(`/item/${it.uuid}`, { method: 'DELETE' }))}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}

                    {b.items.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-sm text-muted-foreground">
                          Belum ada item di bab ini.{' '}
                        </TableCell>
                      </TableRow>
                    )}

                    {/* Subtotal Row */}
                    <TableRow className="bg-muted/40 font-bold">
                      <TableCell colSpan={5} className="text-right text-sm">
                        Sub Total Bab {b.kode}
                      </TableCell>
                      <TableCell className="num text-sm font-bold">
                        Rp {rp(b.subtotal)}
                      </TableCell>
                      <TableCell className="noprint" />
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}

          {d.bab.length === 0 && (
            <Card className="border-dashed border-border bg-card p-12 text-center text-muted-foreground">
              <p className="font-semibold text-foreground text-sm">Belum ada bab pekerjaan</p>
              <p className="text-xs mt-1">Tambahkan bab pertama di bawah ini untuk mulai memasukkan item RAB.</p>
            </Card>
          )}
        </div>

        {/* Formal Rekapitulasi Table for Print */}
        <div className="print-only mt-8 border border-black p-4">
          <h2 className="text-sm font-bold uppercase mb-3 text-center">REKAPITULASI BIAYA</h2>
          <table className="w-full text-xs">
            <tbody>
              {d.bab.map((b: any) => (
                <tr key={b.uuid} className="border-b border-black/40">
                  <td className="py-1">Bab {b.kode}. {b.namaBab}</td>
                  <td className="text-right num py-1">Rp {rp(b.subtotal)}</td>
                </tr>
              ))}
              <tr className="border-t border-black font-semibold">
                <td className="py-1">A. Real Cost (Jumlah Biaya Langsung)</td>
                <td className="text-right num py-1">Rp {rp(d.rekap.realCost)}</td>
              </tr>
              <tr>
                <td className="py-1">B. Pajak Pertambahan Nilai (PPN {d.proyek.ppnPersen}%)</td>
                <td className="text-right num py-1">Rp {rp(d.rekap.ppn)}</td>
              </tr>
              <tr className="font-semibold">
                <td className="py-1">C. Total Harga Pekerjaan (A + B)</td>
                <td className="text-right num py-1">Rp {rp(d.rekap.total)}</td>
              </tr>
              <tr className="font-bold border-t border-black text-sm">
                <td className="py-2">D. Total Nilai Dibulatkan</td>
                <td className="text-right num py-2">Rp {rp(d.rekap.dibulatkan, 0)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Form Tambah Bab Baru */}
        {canEdit && (
          <div className="space-y-4 noprint">
            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="pb-3 border-b border-border bg-muted/20">
                <CardTitle className="text-base font-semibold">Tambah Bab Pekerjaan Baru</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-3 space-y-1.5">
                    <Label htmlFor="babKode">Kode Romawi</Label>
                    <Input
                      id="babKode"
                      placeholder={ROMAN[d.bab.length] ?? 'I'}
                      value={babForm.kode}
                      onChange={(e) => setBabForm({ ...babForm, kode: e.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-7 space-y-1.5">
                    <Label htmlFor="babNama">Nama Bab Pekerjaan</Label>
                    <Input
                      id="babNama"
                      placeholder="Mis. Pekerjaan Pondasi & Dinding"
                      value={babForm.namaBab}
                      onChange={(e) => setBabForm({ ...babForm, namaBab: e.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Button
                      className="w-full gap-1.5"
                      disabled={!babForm.namaBab}
                      onClick={() =>
                        run(async () => {
                          await api(`/proyek/${uuid}/bab`, {
                            method: 'POST',
                            body: {
                              kode: babForm.kode || ROMAN[d.bab.length] || String(d.bab.length + 1),
                              namaBab: babForm.namaBab,
                            },
                          });
                          setBabForm({ kode: '', namaBab: '' });
                        })
                      }
                    >
                      <Plus className="h-4 w-4" />
                      <span>Tambah Bab</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* MODAL OPSI A: Tambah Item Analisis Pekerjaan (Master-Detail 2 Panel) */}
        <Dialog open={showItemModal} onOpenChange={setShowItemModal}>
          <DialogContent className="max-w-5xl h-[88vh] max-h-[820px] p-0 flex flex-col overflow-hidden">
            {/* Header Modal */}
            <DialogHeader className="p-4 px-6 border-b border-border bg-card shrink-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pr-6">
                <div>
                  <DialogTitle className="text-lg font-bold text-foreground">
                    Pilih Analisis Harga Satuan Pekerjaan (AHSP)
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    Pilih analisis dan masukkan volume pekerjaan. Modal tetap terbuka setelah item ditambahkan.
                  </DialogDescription>
                </div>

                {/* Pemilih Bab Tujuan di Header */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Target Bab:</span>
                  <select
                    className="flex h-8 rounded-md border border-input bg-background px-2.5 py-1 text-xs font-semibold shadow-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                    value={targetBabUuid}
                    onChange={(e) => setTargetBabUuid(e.target.value)}
                  >
                    {d.bab.map((b: any) => (
                      <option key={b.uuid} value={b.uuid}>
                        Bab {b.kode}. {b.namaBab}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </DialogHeader>

            {/* Notifikasi Sukses Inline bila baru menambah item */}
            {modalSuccessNotice && (
              <div className="px-6 py-2 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border-b border-emerald-200 dark:border-emerald-800 text-xs flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{modalSuccessNotice}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setModalSuccessNotice(null)}
                  className="text-emerald-700 hover:text-emerald-900 ml-4 font-bold"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Badan Modal: Split 2 Panel */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-border">
              {/* PANEL KIRI: Katalog & Pencarian (40% / 5 kolom) */}
              <div className="md:col-span-5 flex flex-col bg-muted/20 min-h-0">
                {/* Search & Filter Header */}
                <div className="p-3 space-y-2 border-b border-border bg-card shrink-0">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Cari kode atau uraian pekerjaan..."
                      value={modalSearch}
                      onChange={(e) => setModalSearch(e.target.value)}
                      className="pl-8 h-8 text-xs"
                      autoFocus
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <select
                      className="flex h-7 w-full rounded border border-input bg-background px-2 py-0.5 text-xs shadow-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                      value={modalKat}
                      onChange={(e) => setModalKat(e.target.value)}
                    >
                      <option value="semua">Semua Kategori</option>
                      {katList.map((k) => (
                        <option key={k.uuid} value={k.uuid}>
                          {k.kode} — {k.nama}
                        </option>
                      ))}
                    </select>
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                      {filteredModalPk.length} item
                    </span>
                  </div>
                </div>

                {/* Daftar Item Scrollable */}
                <div className="flex-1 overflow-y-auto divide-y divide-border/60">
                  {filteredModalPk.map((item) => {
                    const isSelected = selectedPkUuid === item.uuid;
                    const inThisBab = currentBabItemPks.includes(item.uuid);
                    const inOtherBab = !inThisBab && allRabItemPks.includes(item.uuid);

                    return (
                      <div
                        key={item.uuid}
                        onClick={() => setSelectedPkUuid(item.uuid)}
                        className={`p-3 text-xs cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-primary-subtle text-primary border-l-4 border-primary font-medium'
                            : 'hover:bg-muted/40 text-foreground'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1.5 mb-1">
                          <span className="kode font-semibold text-xs tracking-tight">{item.kode}</span>
                          <span className="text-[11px] px-1.5 py-0.2 rounded bg-background border border-border text-muted-foreground">
                            {item.satuan}
                          </span>
                        </div>

                        <p className={`line-clamp-2 text-xs leading-snug ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                          {item.nama}
                        </p>

                        <div className="flex items-center gap-1.5 mt-1.5">
                          {inThisBab && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-medium">
                              Ada di bab ini
                            </span>
                          )}
                          {inOtherBab && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-medium">
                              Ada di bab lain
                            </span>
                          )}
                          <span className="text-[10px] text-muted-foreground truncate">
                            {item.kategori?.nama}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {filteredModalPk.length === 0 && (
                    <div className="p-8 text-center text-xs text-muted-foreground">
                      Tidak ada pekerjaan yang cocok dengan filter pencarian.
                    </div>
                  )}
                </div>
              </div>

              {/* PANEL KANAN: Detail Analisis & Input Volume (60% / 7 kolom) */}
              <div className="md:col-span-7 flex flex-col min-h-0 bg-card overflow-y-auto p-5 space-y-4">
                {selectedPkItem ? (
                  <>
                    {/* Judul & Metadata Utuh */}
                    <div className="space-y-1.5 border-b border-border pb-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="kode text-xs font-bold text-primary px-2 py-0.5 bg-primary-subtle rounded border border-primary/20">
                          {selectedPkItem.kode}
                        </span>
                        <Badge
                          variant="secondary"
                          className={
                            selectedPkItem.kategori?.pembulatan === 'none'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          }
                        >
                          {selectedPkItem.kategori?.pembulatan === 'none' ? 'Tidak dibulatkan' : 'Dipotong ke rupiah'}
                        </Badge>
                      </div>

                      {/* Judul Teks Utuh Tanpa Terpotong */}
                      <h3 className="text-base font-bold text-foreground leading-snug pt-1">
                        {selectedPkItem.nama}
                      </h3>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground pt-0.5">
                        <span>Satuan Pengukuran: <b className="text-foreground">{selectedPkItem.satuan}</b></span>
                        <span>·</span>
                        <span>Kategori: <b className="text-foreground">{selectedPkItem.kategori?.nama}</b></span>
                      </div>
                    </div>

                    {/* Rincian Komponen Analisis (Upah, Bahan, Alat) */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Komposisi Koefisien Analisis (AHSP)
                        </span>
                        {loadingDetail && (
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Loader2 className="h-3 w-3 animate-spin text-primary" />
                            Memuat...
                          </span>
                        )}
                      </div>

                      <div className="rounded-md border border-border overflow-hidden">
                        <table className="w-full text-xs">
                          <thead className="bg-muted/40 border-b border-border text-muted-foreground">
                            <tr>
                              <th className="p-2 text-left font-medium">Uraian Komponen</th>
                              <th className="p-2 text-left font-medium w-24">Tipe</th>
                              <th className="p-2 text-right font-medium w-24">Koefisien</th>
                              <th className="p-2 text-left font-medium w-16">Satuan</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/60">
                            {pkDetail?.koefisien?.map((k: any) => {
                              const isSd = !!k.sumberDaya;
                              const nama = isSd ? k.sumberDaya.nama : k.subPekerjaan?.nama;
                              const tipe = isSd ? k.sumberDaya.tipe : 'pekerjaan';
                              const satuan = isSd ? k.sumberDaya.satuan : k.subPekerjaan?.satuan;

                              return (
                                <tr key={k.uuid} className="hover:bg-muted/20">
                                  <td className="p-2 text-foreground font-medium">
                                    {nama}
                                    {!isSd && (
                                      <span className="ml-1.5 text-[10px] text-primary bg-primary-subtle px-1.5 py-0.2 rounded border border-primary/20">
                                        Pakai {k.basisHarga === 'direct' ? 'D' : 'F'}
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-2">
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
                                  </td>
                                  <td className="p-2 text-right num font-semibold">{rp(k.koefisien, 4)}</td>
                                  <td className="p-2 text-muted-foreground">{satuan}</td>
                                </tr>
                              );
                            })}

                            {(!pkDetail?.koefisien || pkDetail.koefisien.length === 0) && (
                              <tr>
                                <td colSpan={4} className="p-4 text-center text-muted-foreground">
                                  {loadingDetail ? 'Mengambil rincian komponen...' : 'Tidak ada komponen terdaftar.'}
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Pratinjau Perhitungan Harga Satuan Acuan */}
                    {pkPreview && (
                      <div className="rounded-lg border border-border bg-muted/20 p-3.5 space-y-2">
                        <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                          <span>Estimasi Harga Satuan AHSP</span>
                          <span className="text-muted-foreground font-normal">
                            Tahun {d.proyek.tahun} · Overhead {d.proyek.overheadPersen}%
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 pt-1">
                          <div className="p-2 rounded bg-background border border-border">
                            <span className="text-[10px] text-muted-foreground uppercase block">Biaya Langsung (D)</span>
                            <span className="num font-semibold text-xs text-foreground">Rp {rp(pkPreview.d)}</span>
                          </div>
                          <div className="p-2 rounded bg-background border border-border">
                            <span className="text-[10px] text-muted-foreground uppercase block">Overhead (E)</span>
                            <span className="num font-semibold text-xs text-amber-600 dark:text-amber-400">Rp {rp(pkPreview.e)}</span>
                          </div>
                          <div className="p-2 rounded bg-primary-subtle/50 border border-primary/20">
                            <span className="text-[10px] text-primary uppercase block font-semibold">Harga Satuan (F)</span>
                            <span className="num font-bold text-xs text-primary">Rp {rp(pkPreview.f)}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Form Input Volume & Eksekusi Tambah */}
                    <div className="border-t border-border pt-3 mt-auto space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                        <div className="sm:col-span-6 space-y-1">
                          <Label htmlFor="modalVolume" className="text-xs font-semibold">
                            Masukkan Volume Pekerjaan ({selectedPkItem.satuan})
                          </Label>
                          <div className="relative">
                            <Input
                              id="modalVolume"
                              type="number"
                              step="0.0001"
                              min={0}
                              placeholder="0.00"
                              value={itemVolume}
                              onChange={(e) => setItemVolume(e.target.value)}
                              className="pr-12 text-sm font-semibold num"
                              autoFocus
                            />
                            <span className="absolute right-3 top-2 text-xs text-muted-foreground font-medium pointer-events-none">
                              {selectedPkItem.satuan}
                            </span>
                          </div>
                        </div>

                        <div className="sm:col-span-6 space-y-1">
                          <span className="text-xs text-muted-foreground block">Estimasi Jumlah Harga</span>
                          <div className="h-9 flex items-center px-3 rounded-md bg-muted/40 border border-border num font-bold text-sm text-foreground">
                            {Number(itemVolume) > 0 && pkPreview?.f
                              ? `Rp ${rp(Number(itemVolume) * Number(pkPreview.f))}`
                              : 'Rp 0'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowItemModal(false)}
                          className="text-xs text-muted-foreground"
                        >
                          Selesai & Tutup Modal
                        </Button>

                        <Button
                          size="sm"
                          disabled={addingItem || !itemVolume || Number(itemVolume) <= 0 || !targetBabUuid}
                          onClick={handleAddItemFromModal}
                          className="gap-1.5"
                        >
                          {addingItem ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Menyimpan...</span>
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4" />
                              <span>Tambahkan ke Bab {currentBab?.kode ?? ''}</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground space-y-2 py-12">
                    <Layers className="h-10 w-10 text-muted-foreground/60" strokeWidth={1.5} />
                    <p className="font-semibold text-foreground text-sm">Pilih Analisis Pekerjaan</p>
                    <p className="text-xs max-w-xs">
                      Pilih salah satu item di panel kiri untuk meninjau rincian komponen, koefisien, serta memasukkan volume pekerjaan.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Finalization Confirmation Dialog */}
        <Dialog open={showFinalModal} onOpenChange={setShowFinalModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">Konfirmasi Finalisasi Dokumen RAB</DialogTitle>
              <DialogDescription className="text-sm pt-2">
                Apakah Anda yakin ingin memfinalkan dokumen proyek <b>{d.proyek.namaProyek}</b>?
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Bab & Item:</span>
                <span className="font-semibold text-foreground">
                  {d.bab.length} Bab · {d.bab.reduce((acc: number, curr: any) => acc + curr.items.length, 0)} Item
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Real Cost:</span>
                <span className="num font-semibold text-foreground">Rp {rp(d.rekap.realCost)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <span className="text-muted-foreground font-medium">Nilai Akhir Dibulatkan:</span>
                <span className="num font-bold text-primary text-base">Rp {rp(d.rekap.dibulatkan, 0)}</span>
              </div>
            </div>

            <Alert variant="info" className="py-2.5">
              <AlertDescription className="text-xs">
                Seluruh item pekerjaan akan dihitung ulang secara menyeluruh dan dikunci secara permanen. RAB yang telah difinalkan tidak dapat disunting kembali.
              </AlertDescription>
            </Alert>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setShowFinalModal(false)} disabled={finalizing}>
                Batal
              </Button>
              <Button onClick={handleFinalisasi} disabled={finalizing}>
                {finalizing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  'Finalkan RAB Sekarang'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Shell>
  );
}
