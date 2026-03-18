// src/app/robots.ts
// Tells all crawlers — including AI crawlers (GPTBot, ClaudeBot, PerplexityBot)
// — to index everything and where to find the sitemap.

import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // All crawlers including AI
        userAgent: '*',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        // Explicitly allow major AI crawlers — GEO signal
        userAgent: 'GPTBot',
        allow: '/',
      },
      {
        userAgent: 'ClaudeBot',
        allow: '/',
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/',
      },
      {
        userAgent: 'GoogleExtendedBot',
        allow: '/',
      },
      {
        userAgent: 'Applebot-Extended',
        allow: '/',
      },
    ],
    sitemap: 'https://thewatchoracle.com/sitemap.xml',
    host: 'https://thewatchoracle.com',
  }
}
