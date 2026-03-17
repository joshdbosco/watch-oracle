// src/app/api/watches/[id]/route.ts
// PUT    /api/watches/:id  — update a watch (admin only)
// DELETE /api/watches/:id  — archive a watch (admin only)

import { NextResponse } from 'next/server'
import { updateWatch, deleteWatch } from '@/lib/notion'
import { isAdminLoggedIn } from '@/lib/session'

type Params = { params: { id: string } }

export async function PUT(req: Request, { params }: Params) {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { name, brand, price, tags, pitch } = body

    if (!name || !brand || !price || !pitch || !Array.isArray(tags)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const safeTags = tags
      .filter((t: unknown) => typeof t === 'string')
      .map((t: string) => t.trim().toLowerCase().replace(/[^a-z0-9_]/g, ''))

    const watch = await updateWatch(params.id, { name, brand, price, tags: safeTags, pitch })
    return NextResponse.json(watch)
  } catch (err) {
    console.error(`PUT /api/watches/${params.id} failed:`, err)
    return NextResponse.json({ error: 'Failed to update watch' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await deleteWatch(params.id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(`DELETE /api/watches/${params.id} failed:`, err)
    return NextResponse.json({ error: 'Failed to delete watch' }, { status: 500 })
  }
}
