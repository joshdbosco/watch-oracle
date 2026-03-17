import type { Metadata } from 'next'
import { EB_Garamond, DM_Mono } from 'next/font/google'
import './globals.css'

const garamond = EB_Garamond({
  subsets: ['latin'],
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-garamond',
  display: 'swap',
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['300', '400'],
  variable: '--font-dm-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'The Watch Oracle',
  description: 'Seven questions. No watch knowledge needed. The perfect watch for the person you\'re buying for.',
  openGraph: {
    title: 'The Watch Oracle',
    description: 'Seven questions. The perfect watch gift — found.',
    type: 'website',
  },
  // GDPR: no tracking, no analytics unless you add them explicitly
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${garamond.variable} ${dmMono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
