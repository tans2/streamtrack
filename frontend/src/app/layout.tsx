import type { Metadata } from 'next';
import { Be_Vietnam_Pro } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { BugReportButton } from '@/components/ui/bug-report-button';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/components/ui/toast-provider';
import { BottomTabBar } from '@/components/ui/bottom-tab-bar';

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-be-vietnam-pro',
});

export const metadata: Metadata = {
  title: 'Scout - Track Your Favorite Shows',
  description: 'Discover and track your favorite shows across all streaming platforms',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={beVietnamPro.className}>
      <body className="min-h-screen bg-background">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
            <BottomTabBar />
            <div className="fixed bottom-20 right-6 md:bottom-6 z-50 flex flex-col gap-2 items-center">
              <BugReportButton />
              <ThemeToggle />
            </div>
            <ToastProvider />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
