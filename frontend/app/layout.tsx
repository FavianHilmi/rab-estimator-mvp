import './globals.css';
import Providers from './providers';

export const metadata = {
  title: 'RAB Desa — Sistem Penyusunan Rencana Anggaran Biaya AHSP',
  description: 'Penyusunan Rencana Anggaran Biaya standar AHSP dan pengelolaan harga lokal desa',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-background font-sans antialiased text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
