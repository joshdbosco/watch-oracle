// src/app/api/admin/login/route.ts
// POST /api/admin/login
// Compares the submitted password against the bcrypt hash in env.
// Sets an encrypted session cookie on success.

import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getSession } from '@/lib/session'

// Slow the response slightly to make brute-force less worthwhile
const MIN_RESPONSE_MS = 500

export async function POST(req: Request) {
  const start = Date.now()

  try {
    const { password } = await req.json()

    if (typeof password !== 'string' || password.length > 200) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const hash = process.env.ADMIN_PASSWORD_HASH
    if (!hash) {
      console.error('ADMIN_PASSWORD_HASH env var is not set')
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
    }

    const valid = await bcrypt.compare(password, hash)

    // Always wait at least MIN_RESPONSE_MS regardless of outcome
    const elapsed = Date.now() - start
    if (elapsed < MIN_RESPONSE_MS) {
      await new Promise(r => setTimeout(r, MIN_RESPONSE_MS - elapsed))
    }

    if (!valid) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
    }

    // Set the session
    const session = await getSession()
    session.admin = { loggedIn: true }
    await session.save()

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('POST /api/admin/login failed:', err)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
