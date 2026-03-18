// src/app/api/submit/route.ts
// POST /api/submit
// Saves a quiz submission with full tracking:
//   - Name, email, extra notes
//   - Quiz tags (full answer fingerprint)
//   - Top 3 watch results shown to the user
//   - IP address (from Vercel/CF headers, falls back to socket)
//   - User agent (browser/device info)
//   - Country (from Vercel's x-vercel-ip-country header)
// Sends a notification email via Resend.
// Saves everything to the Notion Submissions database.

import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { saveSubmission } from '@/lib/notion'
import type { Submission } from '@/lib/types'
import { BUDGET_LABELS } from '@/lib/types'

const resend = new Resend(process.env.RESEND_API_KEY)

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// ── IP extraction ────────────────────────────────────────────────────────────
// Priority order: Vercel real IP → CF-Connecting-IP → X-Forwarded-For → unknown
function getIP(req: Request): string {
  const headers = req.headers
  return (
    headers.get('x-real-ip') ||
    headers.get('cf-connecting-ip') ||
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  )
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, extra, tags, results } = body as Submission

    // ── Validate ────────────────────────────────────────────────────────────
    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }
    if (!Array.isArray(tags)) {
      return NextResponse.json({ error: 'Missing quiz data' }, { status: 400 })
    }

    // ── Sanitise ────────────────────────────────────────────────────────────
    const safeName    = (name  || '').replace(/</g, '&lt;').trim().slice(0, 200)
    const safeExtra   = (extra || '').replace(/</g, '&lt;').trim().slice(0, 2000)
    const safeEmail   = email.trim().slice(0, 254)
    const safeResults = Array.isArray(results) ? results.slice(0, 3).map(r => String(r).slice(0, 100)) : []

    // ── Tracking ────────────────────────────────────────────────────────────
    const ip        = getIP(req)
    const userAgent = req.headers.get('user-agent') || 'unknown'
    const country   = req.headers.get('x-vercel-ip-country') ||
                      req.headers.get('cf-ipcountry') || ''

    // ── Build email ─────────────────────────────────────────────────────────
    const budgetTag   = tags.find((t: string) => t.startsWith('budget_')) ?? ''
    const budgetLabel = BUDGET_LABELS[budgetTag as keyof typeof BUDGET_LABELS] ?? budgetTag
    const otherTags   = tags.filter((t: string) => !t.startsWith('budget_')).join(', ')

    const resultsHtml = safeResults.length
      ? safeResults.map((r, i) => `<tr><td style="padding:8px 12px;font-weight:bold">${i === 0 ? 'Top pick' : `Option ${i + 1}`}</td><td style="padding:8px 12px">${r}</td></tr>`).join('')
      : '<tr><td colspan="2" style="padding:8px 12px;color:#999">No results recorded</td></tr>'

    // ── Send email ──────────────────────────────────────────────────────────
    await resend.emails.send({
      from:    process.env.RESEND_FROM_EMAIL!,
      to:      process.env.RESEND_TO_EMAIL!,
      reply_to: safeEmail,
      subject: `New Oracle request — ${budgetLabel}${safeName ? ` from ${safeName}` : ''}`,
      html: `
        <h2 style="font-family:Georgia,serif;margin-bottom:16px">New Watch Oracle submission</h2>
        <table style="font-family:Georgia,serif;border-collapse:collapse;width:100%;max-width:560px">
          <tr style="background:#f5f5f5">
            <td style="padding:8px 12px;font-weight:bold">Name</td>
            <td style="padding:8px 12px">${safeName || '(not given)'}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;font-weight:bold">Email</td>
            <td style="padding:8px 12px"><a href="mailto:${safeEmail}">${safeEmail}</a></td>
          </tr>
          <tr style="background:#f5f5f5">
            <td style="padding:8px 12px;font-weight:bold">Budget</td>
            <td style="padding:8px 12px">${budgetLabel}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;font-weight:bold;vertical-align:top">Extra info</td>
            <td style="padding:8px 12px">${safeExtra || '(nothing added)'}</td>
          </tr>
          <tr style="background:#f5f5f5">
            <td style="padding:8px 12px;font-weight:bold">Quiz tags</td>
            <td style="padding:8px 12px;color:#666;font-size:12px">${otherTags}</td>
          </tr>
          <tr>
            <td colspan="2" style="padding:12px 12px 4px;font-weight:bold;border-top:2px solid #eee">
              Watches shown to them
            </td>
          </tr>
          ${resultsHtml}
          <tr style="background:#f5f5f5">
            <td style="padding:8px 12px;font-weight:bold">IP</td>
            <td style="padding:8px 12px;font-size:12px;color:#999">${ip}${country ? ` (${country})` : ''}</td>
          </tr>
        </table>
        <p style="font-family:Georgia,serif;color:#999;font-size:12px;margin-top:16px">
          Reply directly to this email to respond to ${safeName || 'the gifter'}.
        </p>
      `,
    })

    // ── Save to Notion ──────────────────────────────────────────────────────
    await saveSubmission({
      name:      safeName,
      email:     safeEmail,
      extra:     safeExtra,
      tags,
      results:   safeResults,
      ip,
      userAgent,
      country,
    })

    return NextResponse.json({ ok: true })

  } catch (err) {
    console.error('POST /api/submit failed:', err)
    return NextResponse.json({ error: 'Submission failed' }, { status: 500 })
  }
}
