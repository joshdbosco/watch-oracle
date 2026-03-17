// src/app/api/watches/route.ts
// GET  /api/watches        — returns all watches (used by the quiz)
// POST /api/watches        — creates a new watch (admin only)

import { NextResponse } from 'next/server'
import { getAllWatches, createWatch } from '@/lib/notion'
import { isAdminLoggedIn } from '@/lib/session'

export async function GET() {
  try {
    const watches = await getAllWatches()
    return NextResponse.json(watches)
  } catch (err) {
    console.error('GET /api/watches failed:', err)
    return NextResponse.json({ error: 'Failed to fetch watches' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  // Auth check — only the logged-in admin can create watches
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { name, brand, price, tags, pitch } = body

    // Basic validation — all fields required
    if (!name || !brand || !price || !pitch || !Array.isArray(tags)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Sanitise: ensure every tag is a plain string with no weird characters
    const safeTags = tags
      .filter((t: unknown) => typeof t === 'string')
      .map((t: string) => t.trim().toLowerCase().replace(/[^a-z0-9_]/g, ''))

    const watch = await createWatch({ name, brand, price, tags: safeTags, pitch })
    return NextResponse.json(watch, { status: 201 })
  } catch (err) {
    console.error('POST /api/watches failed:', err)
    return NextResponse.json({ error: 'Failed to create watch' }, { status: 500 })
  }
}
