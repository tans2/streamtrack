import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';

export const metadata: Metadata = {
  title: 'WallyWatch - Track Your Favorite Shows',
  description: 'Discover and track your favorite shows across all streaming platforms',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
