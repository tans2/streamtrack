import type { Metadata } from 'next'
import { Be_Vietnam_Pro } from 'next/font/google'
import './globals.css'

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'Scout — Your TV Sidekick',
  description: 'Track every show, get notified when new episodes drop, and watch together with friends. Join the Scout private beta.',
  keywords: ['streaming', 'watchlist', 'tv shows', 'netflix', 'hulu', 'disney+', 'tracking', 'watch groups'],
  icons: {
    icon: '/icon-192.png',
    apple: '/apple-icon.png',
  },
  openGraph: {
    title: 'Scout — Your TV Sidekick',
    description: 'Track every show, get notified when new episodes drop, and watch together with friends.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={beVietnamPro.className}>{children}</body>
    </html>
  )
}
