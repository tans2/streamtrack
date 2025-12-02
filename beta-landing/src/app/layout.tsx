import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Scout - Private Beta | Always Know Where & When to Watch',
  description: 'Join the Scout private beta. One unified watchlist across all your streaming platforms. Never lose track of your shows again.',
  keywords: ['streaming', 'watchlist', 'tv shows', 'netflix', 'hulu', 'disney+', 'tracking'],
  openGraph: {
    title: 'Scout - Private Beta',
    description: 'One unified watchlist across all your streaming platforms.',
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
      <body className={inter.className}>{children}</body>
    </html>
  )
}
