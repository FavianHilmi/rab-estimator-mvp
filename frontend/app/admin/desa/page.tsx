'use client';
import * as React from 'react';
import { Building2, Users, Plus, AlertCircle, UserCheck, Loader2 } from 'lucide-react';
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

export default function DesaPage() {
  const me = useMe();
  const [bd, setBd] = React.useState<any[]>([]);
  const [us, setUs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState('');
  const [activeTab, setActiveTab] = React.useState<'bumdes' | 'pengguna'>('bumdes');

  const [fb, setFb] = React.useState({ kode: '', nama: '', desa: '', kecamatan: '' });
  const [fu, setFu] = React.useState<any>({
    nama: '',
    email: '',
    password: '',
    role: 'operator',
    bumdesUuid: '',
  });

  const load = () => {
    setLoading(true);
    Promise.all([api('/bumdes'), api('/users')])
      .then(([bRes, uRes]) => {
        setBd(bRes);
        setUs(uRes);
      })
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
          <AlertDescription>Hanya superadmin yang berhak mengelola data desa dan akun pengguna.</AlertDescription>
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
      setErr(x.message || 'Gagal menyimpan perubahan data.');
    }
  };

  return (
    <Shell me={me}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Desa, BUMDes & Pengguna
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pengaturan unit BUMDes dan hak akses pengguna sistem (Design System 6.8)
          </p>
        </div>

        {err && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <AlertDescription className="text-sm">{err}</AlertDescription>
          </Alert>
        )}

        {/* Tab Switcher (Design System 6.8) */}
        <div className="inline-flex rounded-lg border border-border p-1 bg-muted/40">
          <button
            type="button"
            onClick={() => setActiveTab('bumdes')}
            className={`flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'bumdes'
                ? 'bg-background text-foreground shadow-sm font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Building2 className="h-4 w-4" />
            <span>Daftar BUMDes ({bd.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pengguna')}
            className={`flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'pengguna'
                ? 'bg-background text-foreground shadow-sm font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Akun Pengguna ({us.length})</span>
          </button>
        </div>

        {activeTab === 'bumdes' ? (
          <div className="space-y-6">
            {/* Add BUMDes Form */}
            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="pb-3 border-b border-border bg-muted/20">
                <CardTitle className="text-base font-semibold">Tambah Unit BUMDes Baru</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label htmlFor="bmdKode">Kode BUMDes</Label>
                    <Input
                      id="bmdKode"
                      placeholder="BMD-0001"
                      value={fb.kode}
                      onChange={(e) => setFb({ ...fb, kode: e.target.value })}
                    />
                  </div>

                  <div className="sm:col-span-4 space-y-1.5">
                    <Label htmlFor="bmdNama">Nama BUMDes</Label>
                    <Input
                      id="bmdNama"
                      placeholder="BUMDes Mandiri Sejahtera"
                      value={fb.nama}
                      onChange={(e) => setFb({ ...fb, nama: e.target.value })}
                    />
                  </div>

                  <div className="sm:col-span-3 space-y-1.5">
                    <Label htmlFor="bmdDesa">Nama Desa</Label>
                    <Input
                      id="bmdDesa"
                      placeholder="Desa Sukamaju"
                      value={fb.desa}
                      onChange={(e) => setFb({ ...fb, desa: e.target.value })}
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <Label htmlFor="bmdKec">Kecamatan</Label>
                    <Input
                      id="bmdKec"
                      placeholder="Kecamatan Makmur"
                      value={fb.kecamatan}
                      onChange={(e) => setFb({ ...fb, kecamatan: e.target.value })}
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <Button
                      className="w-full"
                      disabled={Object.values(fb).some((v) => !v)}
                      onClick={() =>
                        run(async () => {
                          await api('/bumdes', { method: 'POST', body: fb });
                          setFb({ kode: '', nama: '', desa: '', kecamatan: '' });
                        })
                      }
                      title="Tambah BUMDes"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* BUMDes Table */}
            <Card className="border-border bg-card overflow-hidden shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32">Kode</TableHead>
                    <TableHead>Nama BUMDes</TableHead>
                    <TableHead className="w-48">Desa</TableHead>
                    <TableHead className="w-48">Kecamatan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-36 text-center">
                        <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          <span>Memuat data BUMDes...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : bd.map((b) => (
                    <TableRow key={b.uuid}>
                      <TableCell className="kode font-medium text-foreground">{b.kode}</TableCell>
                      <TableCell className="font-semibold text-foreground">{b.nama}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{b.desa}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{b.kecamatan}</TableCell>
                    </TableRow>
                  ))}

                  {!loading && bd.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-sm text-muted-foreground">
                        Belum ada unit BUMDes terdaftar.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Add User Form */}
            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="pb-3 border-b border-border bg-muted/20">
                <CardTitle className="text-base font-semibold">Tambah Akun Pengguna Baru</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-3 space-y-1.5">
                    <Label htmlFor="uNama">Nama Lengkap</Label>
                    <Input
                      id="uNama"
                      placeholder="Ahmad Fauzi"
                      value={fu.nama}
                      onChange={(e) => setFu({ ...fu, nama: e.target.value })}
                      required
                    />
                  </div>

                  <div className="sm:col-span-3 space-y-1.5">
                    <Label htmlFor="uEmail">Email</Label>
                    <Input
                      id="uEmail"
                      type="email"
                      placeholder="operator@desa.test"
                      value={fu.email}
                      onChange={(e) => setFu({ ...fu, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <Label htmlFor="uPass">Kata Sandi (Min 8 Karakter)</Label>
                    <Input
                      id="uPass"
                      type="password"
                      placeholder="••••••••"
                      value={fu.password}
                      onChange={(e) => setFu({ ...fu, password: e.target.value })}
                      required
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <Label htmlFor="uRole">Peran / Role</Label>
                    <select
                      id="uRole"
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                      value={fu.role}
                      onChange={(e) => setFu({ ...fu, role: e.target.value })}
                    >
                      <option value="operator">Operator</option>
                      <option value="viewer">Viewer</option>
                      <option value="superadmin">Superadmin</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <Label htmlFor="uBumdes">BUMDes Terhubung</Label>
                    {fu.role !== 'superadmin' ? (
                      <select
                        id="uBumdes"
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                        value={fu.bumdesUuid}
                        onChange={(e) => setFu({ ...fu, bumdesUuid: e.target.value })}
                      >
                        <option value="">Pilih BUMDes</option>
                        {bd.map((b) => (
                          <option key={b.uuid} value={b.uuid}>
                            {b.nama}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="h-9 flex items-center text-xs text-muted-foreground italic">
                        Semua BUMDes (Pusat)
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    className="gap-2"
                    disabled={
                      !fu.nama ||
                      !fu.email ||
                      fu.password.length < 8 ||
                      (fu.role !== 'superadmin' && !fu.bumdesUuid)
                    }
                    onClick={() =>
                      run(async () => {
                        await api('/users', {
                          method: 'POST',
                          body: { ...fu, bumdesUuid: fu.bumdesUuid || null },
                        });
                        setFu({ ...fu, nama: '', email: '', password: '', bumdesUuid: '' });
                      })
                    }
                  >
                    <UserCheck className="h-4 w-4" />
                    <span>Tambah Pengguna</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Users Table */}
            <Card className="border-border bg-card overflow-hidden shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Pengguna</TableHead>
                    <TableHead>Alamat Email</TableHead>
                    <TableHead className="w-36">Peran</TableHead>
                    <TableHead className="w-64">BUMDes Terhubung</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-36 text-center">
                        <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          <span>Memuat daftar pengguna...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : us.map((u) => (
                    <TableRow key={u.uuid}>
                      <TableCell className="font-semibold text-foreground">{u.nama}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            u.role === 'superadmin'
                              ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                              : u.role === 'operator'
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-muted text-muted-foreground'
                          }
                        >
                          {u.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {u.bumdes ?? 'Semua BUMDes (Pusat)'}
                      </TableCell>
                    </TableRow>
                  ))}

                  {!loading && us.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-sm text-muted-foreground">
                        Belum ada pengguna terdaftar.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </div>
        )}
      </div>
    </Shell>
  );
}
