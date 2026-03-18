/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV === 'development'

const nextConfig = {
  async headers() {
    const csp = [
      "default-src 'self'",

      // Next.js always needs unsafe-inline for its inline scripts.
      // Dev mode also needs unsafe-eval for React Fast Refresh (hot reload).
      isDev
        ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
        : "script-src 'self' 'unsafe-inline'",

      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",

      // Dev: allow WebSocket connections for HMR (hot module replacement).
      // Prod: only same-origin API calls.
      isDev
        ? "connect-src 'self' ws://localhost:* http://localhost:*"
        : "connect-src 'self'",

      "img-src 'self' data:",
      "frame-ancestors 'none'",
    ].join('; ')

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options',        value: 'DENY' },
          { key: 'X-Content-Type-Options',  value: 'nosniff' },
          { key: 'Referrer-Policy',         value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',      value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Content-Security-Policy', value: csp },
        ],
      },
    ]
  },
}

module.exports = nextConfig
