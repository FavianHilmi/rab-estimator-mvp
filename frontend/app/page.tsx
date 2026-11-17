'use client';
import * as React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FileText, AlertCircle, Loader2, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Login() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = React.useState(true);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [err, setErr] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  // Jika user sudah memiliki sesi valid, langsung arahkan ke /proyek (tanpa kedip form)
  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setCheckingAuth(false);
      return;
    }

    api('/me')
      .then((userData) => {
        localStorage.setItem('user', JSON.stringify(userData));
        router.replace('/proyek');
      })
      .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setCheckingAuth(false);
      });
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      const r = await api('/auth/login', { method: 'POST', body: { email, password } });
      localStorage.setItem('token', r.token);
      localStorage.setItem('user', JSON.stringify(r.user));
      router.replace('/proyek');
    } catch (x: any) {
      setErr(x.message || 'Gagal masuk. Periksa kembali email dan kata sandi Anda.');
      setBusy(false);
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background p-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <FileText className="h-6 w-6" strokeWidth={2} />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>Memeriksa sesi pengguna...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 bg-background">
      {/* Kolom Kiri: Form UI Simple & Tenang */}
      <div className="flex flex-col justify-between p-6 sm:p-10 lg:p-16">
        {/* Header Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <FileText className="h-5 w-5" strokeWidth={2} />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-foreground block leading-none">
              RAB Desa
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              Sistem Penyusunan AHSP
            </span>
          </div>
        </div>

        {/* Form Container */}
        <div className="w-full max-w-sm mx-auto my-10 space-y-6">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Masuk ke Akun
            </h1>
          </div>

          {err && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <AlertDescription className="text-xs">{err}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Alamat Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@desa.test"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={busy}
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Kata Sandi</Label>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={busy}
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground focus:outline-none"
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memverifikasi...
                </>
              ) : (
                'Masuk ke Akun'
              )}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-xs text-muted-foreground text-center sm:text-left">
          © 2026 RAB Desa · Sistem Pengelolaan Anggaran Desa & BUMDes
        </div>
      </div>

      {/* Kolom Kanan: Gambar Login (Desktop Only) */}
      <div className="hidden lg:relative lg:flex lg:flex-col lg:justify-end overflow-hidden bg-muted">
        <Image
          src="/login-image.jpg"
          alt="Pembangunan Fisik Desa"
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
        {/* Overlay Gradien Halus & Teks Informasi */}
        <div className="relative z-10 p-96 bg-gradient-to-t from-sky-700 via-sky-500/30 to-transparent text-white space-y-2">
          {/* <span className="inline-block px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wider bg-primary/90 text-white">
            Pembangunan Fisik Desa
          </span>
          <h2 className="text-2xl font-bold leading-snug">
            Penyusunan Anggaran Fisik Desa Terstandarisasi AHSP
          </h2>
          <p className="text-sm text-white/80 max-w-lg leading-relaxed">
            Menyusun Rencana Anggaran Biaya pekerjaan fisik secara transparan, akurat, dan terstruktur sesuai harga satuan dasar lokal.
          </p> */}
        </div>
      </div>
    </div>
  );
}
