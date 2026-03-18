import type { Metadata } from 'next'
import { Fraunces, Syne, Syne_Mono } from 'next/font/google'
import './globals.css'

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  weight: ['300', '400', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
})

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  weight: ['400', '500', '600'],
  display: 'swap',
})

const syneMono = Syne_Mono({
  subsets: ['latin'],
  variable: '--font-syne-mono',
  weight: ['400'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'The Watch Oracle — Find the Perfect Watch Gift',
  description: 'Seven questions. No watch knowledge required. We find the perfect watch gift. You get the credit.',
  metadataBase: new URL('https://thewatchoracle.com'),
  openGraph: {
    title: 'The Watch Oracle',
    description: 'Seven questions. No watch knowledge required. We find the perfect watch gift.',
    url: 'https://thewatchoracle.com',
    siteName: 'The Watch Oracle',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Watch Oracle',
    description: 'Seven questions. No watch knowledge required. We find the perfect watch gift.',
  },
  alternates: { canonical: 'https://thewatchoracle.com' },
  robots: { index: true, follow: true },
}

// WebSite + Organization schema — injected on every page
// Tells Google and AI engines what this site is and what it does
const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'The Watch Oracle',
  url: 'https://thewatchoracle.com',
  description: 'A watch gift recommendation tool. Answer seven questions and receive three personalised watch recommendations.',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://thewatchoracle.com/?q={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
}

const orgSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'The Watch Oracle',
  url: 'https://thewatchoracle.com',
  description: 'Watch gift recommendations for non-watch people. Seven questions, no jargon, three personalised picks.',
  sameAs: [],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${syne.variable} ${syneMono.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
