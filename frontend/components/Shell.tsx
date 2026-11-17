'use client';
import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FileText,
  DollarSign,
  Briefcase,
  Layers,
  Users,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  Building2,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, logout } from '@/lib/api';

interface ShellProps {
  children: React.ReactNode;
  me: User;
}

export default function Shell({ children, me }: ShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    const isDarkStored = localStorage.getItem('theme') === 'dark';
    setIsDark(isDarkStored);
    if (isDarkStored) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const navItems = [
    {
      group: 'Workspace',
      items: [
        { href: '/proyek', label: 'Proyek RAB', icon: FileText },
        { href: '/harga', label: 'Harga Lokal (HSD)', icon: DollarSign },
      ],
    },
    ...(me.role === 'superadmin'
      ? [
          {
            group: 'Data Master',
            items: [
              { href: '/admin/pekerjaan', label: 'Pekerjaan (AHSP)', icon: Briefcase },
              { href: '/admin/sumber-daya', label: 'Sumber Daya', icon: Layers },
              { href: '/admin/desa', label: 'Desa & Pengguna', icon: Users },
            ],
          },
        ]
      : []),
  ];

  const initials = me.nama
    ? me.nama
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden noprint"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Stable Sidebar (Design System 4.1 & 4.2) */}
      <aside
        className={cn(
          'noprint fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card transition-transform duration-200 lg:static lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-border px-6">
          <Link href="/proyek" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold shadow-sm">
              <FileText className="h-5 w-5" strokeWidth={2} />
            </div>
            <div>
              <div className="text-base font-bold leading-tight tracking-tight text-foreground">
                RAB Desa
              </div>
              <div className="text-xs text-muted-foreground font-medium">
                Penyusunan AHSP
              </div>
            </div>
          </Link>
          <button
            type="button"
            className="lg:hidden p-1 text-muted-foreground hover:text-foreground"
            onClick={() => setMobileOpen(false)}
            aria-label="Tutup navigasi"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-6" aria-label="Navigasi Utama">
          {navItems.map((group) => (
            <div key={group.group} className="space-y-1">
              <div className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 mb-2">
                {group.group}
              </div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || (item.href !== '/proyek' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      active
                        ? 'bg-primary-subtle text-primary border-l-2 border-primary font-semibold'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer: User profile, theme toggle & Logout */}
        <div className="border-t border-border p-4 bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="h-8 w-8 rounded-md border border-border">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold rounded-md">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="truncate">
                <p className="truncate text-sm font-medium text-foreground">{me.nama}</p>
                <p className="truncate text-xs capitalize text-muted-foreground">{me.role}</p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={toggleTheme}
              aria-label="Ganti mode terang/gelap"
              title="Ganti mode terang/gelap"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full mt-3 h-8 text-xs font-medium text-muted-foreground hover:text-destructive hover:border-destructive/30"
            onClick={logout}
          >
            <LogOut className="h-3.5 w-3.5 mr-2" />
            Keluar
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Header Bar */}
        <header className="noprint sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card/90 px-6 backdrop-blur">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="lg:hidden p-1.5 -ml-1.5 rounded-md text-muted-foreground hover:bg-muted"
              onClick={() => setMobileOpen(true)}
              aria-label="Buka menu navigasi"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4 text-primary" />
              <span className="font-medium text-foreground">
                {me.bumdes?.nama ?? 'Semua BUMDes (Pusat)'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-2 text-xs font-medium">
                  <span>{me.nama}</span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <p className="text-sm font-medium">{me.nama}</p>
                  <p className="text-xs text-muted-foreground font-normal">{me.email ?? '-'}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={toggleTheme}>
                  {isDark ? (
                    <>
                      <Sun className="h-4 w-4 mr-2" /> Tema Terang
                    </>
                  ) : (
                    <>
                      <Moon className="h-4 w-4 mr-2" /> Tema Gelap
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4 mr-2" /> Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
