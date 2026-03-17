// src/app/api/submit/route.ts
// POST /api/submit
// Called when a gifter fills in the email form.
// Sends a notification email via Resend and saves a record to Notion.

import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { saveSubmission } from '@/lib/notion'
import type { Submission } from '@/lib/types'
import { BUDGET_LABELS } from '@/lib/types'

const resend = new Resend(process.env.RESEND_API_KEY)

// Basic email regex — not RFC 5322 complete but fine for this use case
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, extra, tags } = body as Submission

    // Validate
    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }
    if (!Array.isArray(tags)) {
      return NextResponse.json({ error: 'Missing quiz data' }, { status: 400 })
    }

    // Sanitise inputs — strip HTML to prevent injection in the email
    const safeName  = (name  || '').replace(/</g, '&lt;').trim().slice(0, 200)
    const safeExtra = (extra || '').replace(/</g, '&lt;').trim().slice(0, 2000)
    const safeEmail = email.trim().slice(0, 254)

    // Build a human-readable summary of the quiz answers for the email
    const budgetTag   = tags.find((t: string) => t.startsWith('budget_')) ?? ''
    const budgetLabel = BUDGET_LABELS[budgetTag as keyof typeof BUDGET_LABELS] ?? budgetTag
    const otherTags   = tags.filter((t: string) => !t.startsWith('budget_')).join(', ')

    // Send notification to the watch oracle team
    await resend.emails.send({
      from:    process.env.RESEND_FROM_EMAIL!,
      to:      process.env.RESEND_TO_EMAIL!,
      replyTo: safeEmail,
      subject: `New Oracle request — ${budgetLabel}${safeName ? ` from ${safeName}` : ''}`,
      html: `
        <h2 style="font-family:Georgia,serif">New Watch Oracle submission</h2>
        <table style="font-family:Georgia,serif;border-collapse:collapse;width:100%">
          <tr><td style="padding:8px 12px;font-weight:bold">Name</td>
              <td style="padding:8px 12px">${safeName || '(not given)'}</td></tr>
          <tr><td style="padding:8px 12px;font-weight:bold">Email</td>
              <td style="padding:8px 12px"><a href="mailto:${safeEmail}">${safeEmail}</a></td></tr>
          <tr><td style="padding:8px 12px;font-weight:bold">Budget</td>
              <td style="padding:8px 12px">${budgetLabel}</td></tr>
          <tr><td style="padding:8px 12px;font-weight:bold">Quiz tags</td>
              <td style="padding:8px 12px;color:#666">${otherTags}</td></tr>
          <tr><td style="padding:8px 12px;font-weight:bold;vertical-align:top">Extra info</td>
              <td style="padding:8px 12px">${safeExtra || '(nothing added)'}</td></tr>
        </table>
        <p style="font-family:Georgia,serif;color:#999;font-size:12px">
          Reply directly to this email to respond to ${safeName || 'the gifter'}.
        </p>
      `,
    })

    // Also save to Notion for your records
    await saveSubmission({ name: safeName, email: safeEmail, extra: safeExtra, tags })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('POST /api/submit failed:', err)
    return NextResponse.json({ error: 'Submission failed' }, { status: 500 })
  }
}
