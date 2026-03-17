// src/lib/session.ts
// Thin wrapper around iron-session. Used by the admin login API route
// and the admin page to check if the user is authenticated.

import { getIronSession, type IronSessionData } from 'iron-session'
import { cookies } from 'next/headers'

// Extend the session data type with our fields
declare module 'iron-session' {
  interface IronSessionData {
    admin?: { loggedIn: boolean }
  }
}

const SESSION_OPTIONS = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'watch-oracle-admin',
  cookieOptions: {
    secure:   process.env.NODE_ENV === 'production',  // HTTPS only in prod
    httpOnly: true,                                    // Not accessible from JS
    sameSite: 'lax' as const,
    maxAge:   60 * 60 * 8,                             // 8 hours
  },
}

// Returns the session object. Use in API routes and Server Components.
export async function getSession() {
  return getIronSession<IronSessionData>(await cookies(), SESSION_OPTIONS)
}

// Returns true if the admin is currently logged in
export async function isAdminLoggedIn(): Promise<boolean> {
  const session = await getSession()
  return session.admin?.loggedIn === true
}
