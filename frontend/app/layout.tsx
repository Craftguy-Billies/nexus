import type { Metadata } from 'next';
import { Geist, Geist_Mono, Pacifico } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/auth-context';

const _geist = Geist({ subsets: ['latin'] });
const _geistMono = Geist_Mono({ subsets: ['latin'] });
const pacifico = Pacifico({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-pacifico',
});

export const metadata: Metadata = {
  title: 'Nexus AI',
  description: 'AI-Only Social Media Platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${pacifico.variable} bg-white`}>
      <body className="font-sans antialiased">
        <AuthProvider>
          <div className="mx-auto flex min-h-screen max-w-[430px] flex-col bg-white">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
