'use client'

// src/components/QuizApp.tsx
// The entire quiz experience — intro, questions, thinking screen, fork,
// email form, sent confirmation, and results — all in one client component.
// Receives watches as a prop from the server component (page.tsx).

import { useState, useEffect, useRef } from 'react'
import type { Watch } from '@/lib/types'
import { QUESTIONS, THINKING_PHRASES, recommend, buildPersona } from '@/lib/quiz'

type Screen = 'intro' | 'quiz' | 'thinking' | 'fork' | 'email' | 'sent' | 'result'

interface Props { watches: Watch[] }

export function QuizApp({ watches }: Props) {
  const [screen,   setScreen]   = useState<Screen>('intro')
  const [question, setQuestion] = useState(0)
  const [tags,     setTags]     = useState<string[]>([])
  const [phrase,   setPhrase]   = useState('')
  const [results,  setResults]  = useState<Watch[]>([])

  // Email form state
  const [name,    setName]    = useState('')
  const [email,   setEmail]   = useState('')
  const [extra,   setExtra]   = useState('')
  const [emailErr,setEmailErr] = useState(false)
  const [sending, setSending] = useState(false)

  const thinkingTimer = useRef<ReturnType<typeof setTimeout>>()

  // ── Navigation ──────────────────────────────────────────────────────────────
  function go(s: Screen) {
    setScreen(s)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── Quiz ────────────────────────────────────────────────────────────────────
  function startQuiz() {
    setQuestion(0)
    setTags([])
    go('quiz')
  }

  function pick(optIdx: number) {
    const opt = QUESTIONS[question].opts[optIdx]
    const newTags = [...tags, ...opt.tags]
    setTags(newTags)

    setTimeout(() => {
      const nextQ = question + 1
      if (nextQ < QUESTIONS.length) {
        setQuestion(nextQ)
      } else {
        // Last question answered
        if (newTags.includes('budget_personal')) {
          go('email')
        } else {
          startThinking(newTags)
        }
      }
    }, 280)
  }

  // ── Thinking screen ─────────────────────────────────────────────────────────
  function startThinking(collectedTags: string[]) {
    go('thinking')
    const pool = [...THINKING_PHRASES].sort(() => Math.random() - 0.5)
    let i = 0
    setPhrase(pool[0])

    const iv = setInterval(() => {
      i++
      if (i < pool.length) setPhrase(pool[i])
    }, 1800)

    // 10–18 second theatrical wait (Sutherland: the wait IS the trust signal)
    const ms = 10000 + Math.random() * 8000
    thinkingTimer.current = setTimeout(() => {
      clearInterval(iv)
      go('fork')
    }, ms)
  }

  // Clean up timer if component unmounts mid-thinking
  useEffect(() => () => clearTimeout(thinkingTimer.current), [])

  // ── Results ─────────────────────────────────────────────────────────────────
  function showResult() {
    setResults(recommend(watches, tags))
    go('result')
  }

  // ── Email submit ─────────────────────────────────────────────────────────────
  async function submitForm() {
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    if (!emailValid) { setEmailErr(true); return }
    setEmailErr(false)
    setSending(true)

    try {
      await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email:   email.trim(),
          extra,
          tags,
          results: results.map(w => `${w.name} — ${w.brand}`),
        }),
      })
    } catch {
      // Fail silently — still show confirmation
    } finally {
      setSending(false)
      go('sent')
    }
  }

  // ── Restart ──────────────────────────────────────────────────────────────────
  function restart() {
    setQuestion(0)
    setTags([])
    setResults([])
    setName(''); setEmail(''); setExtra('')
    go('intro')
  }

  // ── Persona ──────────────────────────────────────────────────────────────────
  const persona = results.length ? buildPersona(tags) : null

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ position: 'relative', zIndex: 1 }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 36px 140px' }}>

        {/* ── INTRO ──────────────────────────────────────────────────────────── */}
        {screen === 'intro' && (
          <div style={{ paddingTop: 130, textAlign: 'center', animation: 'rise 1s cubic-bezier(.16,1,.3,1) both' }}>
            <Clock />
            <div className="eyebrow" style={{ marginBottom: 32 }}>The Watch Oracle</div>
            <h1 style={{ fontSize: 'clamp(42px,7.5vw,68px)', fontWeight: 400, lineHeight: 1.05, letterSpacing: '-.02em', marginBottom: 32 }}>
              Looking to gift a watch<br />but don&apos;t know <em style={{ fontStyle: 'italic', color: 'var(--rust2)' }}>where to start?</em>
            </h1>
            <p style={{ fontSize: 22, fontStyle: 'italic', color: 'var(--muted)', lineHeight: 1.7, marginBottom: 64 }}>
              Take the quiz for a personalised recommendation based on your answers.
            </p>
            <OracleButton onClick={startQuiz}>Take the quiz →</OracleButton>
          </div>
        )}

        {/* ── QUIZ ───────────────────────────────────────────────────────────── */}
        {screen === 'quiz' && (
          <div style={{ paddingTop: 88 }}>
            {/* Progress pips */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 80 }}>
              {QUESTIONS.map((_, i) => (
                <div key={i} style={{
                  flex: 1, height: 1, borderRadius: 1,
                  background: i < question ? 'var(--rust)' : i === question ? 'var(--rust2)' : 'var(--rule)',
                  transition: 'background .4s',
                }} />
              ))}
            </div>

            {/* Question */}
            <div key={question} style={{ animation: 'rise .38s cubic-bezier(.16,1,.3,1) both' }}>
              <div className="eyebrow" style={{ marginBottom: 28 }}>{QUESTIONS[question].ctx}</div>
              <h2 style={{ fontSize: 'clamp(30px,5vw,46px)', fontWeight: 400, lineHeight: 1.2, marginBottom: 14 }}>
                {QUESTIONS[question].h}
              </h2>
              <p style={{ fontSize: 19, fontStyle: 'italic', color: 'var(--muted)', lineHeight: 1.65, marginBottom: 56 }}>
                {QUESTIONS[question].note}
              </p>
              <div style={{ display: 'grid', gap: 12 }}>
                {QUESTIONS[question].opts.map((opt, i) => (
                  <OptButton key={i} icon={opt.icon} label={opt.label} onClick={() => pick(i)} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── THINKING ───────────────────────────────────────────────────────── */}
        {screen === 'thinking' && (
          <div style={{ paddingTop: 150, minHeight: '50vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <ThinkingRing />
            <div style={{ height: 80, width: 380, maxWidth: '100%', position: 'relative', overflow: 'hidden' }}>
              <p key={phrase} style={{
                fontSize: 20, fontStyle: 'italic', color: 'var(--mid)', lineHeight: 1.5,
                animation: 'rise .55s cubic-bezier(.16,1,.3,1) both',
              }}>
                {phrase}
              </p>
            </div>
          </div>
        )}

        {/* ── FORK ───────────────────────────────────────────────────────────── */}
        {screen === 'fork' && (
          <div style={{ paddingTop: 108, animation: 'rise .42s cubic-bezier(.16,1,.3,1) both' }}>
            <div className="eyebrow" style={{ marginBottom: 16 }}>Almost there</div>
            <h2 style={{ fontSize: 'clamp(30px,5.5vw,48px)', fontWeight: 400, lineHeight: 1.12, marginBottom: 14 }}>
              We&apos;ve <em style={{ fontStyle: 'italic', color: 'var(--rust2)' }}>worked it out.</em>
            </h2>
            <p style={{ fontSize: 18, fontStyle: 'italic', color: 'var(--muted)', marginBottom: 48, lineHeight: 1.6 }}>
              How would you like your recommendation?
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <ForkCard icon="⌚" title="Show me now" desc="Three matches. Instant." onClick={showResult} />
              <ForkCard icon="✉" title="Personal list" desc="A watch obsessive replies within 24 hours. Human, not algorithm." onClick={() => go('email')} />
            </div>
          </div>
        )}

        {/* ── EMAIL ──────────────────────────────────────────────────────────── */}
        {screen === 'email' && (
          <div style={{ paddingTop: 96, animation: 'rise .42s cubic-bezier(.16,1,.3,1) both' }}>
            <div className="eyebrow" style={{ marginBottom: 16 }}>Personal recommendation</div>
            <h2 style={{ fontSize: 'clamp(28px,5vw,44px)', fontWeight: 400, lineHeight: 1.15, marginBottom: 12 }}>
              That&apos;s a <em style={{ fontStyle: 'italic', color: 'var(--rust2)' }}>serious</em> budget.
            </h2>
            <p style={{ fontSize: 18, fontStyle: 'italic', color: 'var(--muted)', marginBottom: 48, lineHeight: 1.65 }}>
              Tell us about them. A real person, not an algorithm, will come back with something worth every penny.
            </p>
            <Field label="Your name">
              <input className="oracle-input" value={name} onChange={e => setName(e.target.value)} placeholder="How should we address you?" />
            </Field>
            <Field label="Your email *">
              <input className="oracle-input" type="email" value={email} onChange={e => { setEmail(e.target.value); setEmailErr(false) }} placeholder="We'll reply within 24 hours" style={{ borderColor: emailErr ? '#b04030' : undefined }} />
              {emailErr && <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#b04030', marginTop: 7 }}>Please enter a valid email address.</p>}
            </Field>
            <Field label="Anything else?">
              <textarea className="oracle-input" rows={4} value={extra} onChange={e => setExtra(e.target.value)} placeholder="Their personality, a watch they once admired, an occasion..." style={{ resize: 'vertical', lineHeight: 1.7 }} />
            </Field>
            <div style={{ margin: '36px 0', padding: '24px 28px', borderLeft: '2px solid rgba(192,64,42,.35)', background: 'rgba(192,64,42,.04)' }}>
              <p style={{ fontSize: 17, fontStyle: 'italic', color: 'var(--mid)', lineHeight: 1.85 }}>
                <strong style={{ fontStyle: 'normal', color: 'var(--ink)' }}>A real person who loves watches</strong> will read this and reply personally within 24 hours. Not a template. Not a bot.
              </p>
            </div>
            <OracleButton onClick={submitForm} disabled={sending}>
              {sending ? 'Sending…' : 'Send my answers →'}
            </OracleButton>
          </div>
        )}

        {/* ── SENT ───────────────────────────────────────────────────────────── */}
        {screen === 'sent' && (
          <div style={{ paddingTop: 150, textAlign: 'center', animation: 'rise .55s cubic-bezier(.16,1,.3,1) both' }}>
            <div style={{ width: 60, height: 60, border: '1px solid var(--rust)', borderRadius: '50%', margin: '0 auto 44px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, animation: 'pop .55s cubic-bezier(.34,1.56,.64,1) both .15s' }}>✓</div>
            <div className="eyebrow" style={{ marginBottom: 16 }}>On its way</div>
            <h2 style={{ fontSize: 'clamp(30px,5vw,46px)', fontWeight: 400, lineHeight: 1.1, marginBottom: 18 }}>You&apos;ve done<br />your part.</h2>
            <p style={{ fontSize: 18, fontStyle: 'italic', color: 'var(--muted)', lineHeight: 1.8, maxWidth: 380, margin: '0 auto 56px' }}>
              Check your inbox within 24 hours.
            </p>
            <GhostButton onClick={restart}>← Start again</GhostButton>
          </div>
        )}

        {/* ── RESULT ─────────────────────────────────────────────────────────── */}
        {screen === 'result' && persona && (
          <div style={{ paddingTop: 88 }}>
            <div className="eyebrow" style={{ marginBottom: 16 }}>The Oracle Has Spoken</div>
            <p style={{ fontSize: 18, fontStyle: 'italic', color: 'var(--muted)', marginBottom: 8 }}>
              Based on everything you&apos;ve told us, the person you&apos;re buying for is...
            </p>
            <h2 style={{ fontSize: 'clamp(34px,5.5vw,52px)', fontWeight: 400, lineHeight: 1.1, marginBottom: 14 }}>
              {persona.headline}
            </h2>
            <p style={{ fontSize: 22, fontStyle: 'italic', color: 'var(--mid)', lineHeight: 1.7, marginBottom: 28 }}>
              {persona.descriptor}
            </p>
            <p style={{ fontSize: 18, fontStyle: 'italic', color: 'var(--muted)', lineHeight: 1.9, marginBottom: 56, paddingLeft: 22, borderLeft: '2px solid rgba(192,64,42,.2)' }}>
              {persona.insight}
            </p>

            <Divider label="Three watches chosen for them" />

            {results.map((w, i) => (
              <WatchCard key={w.id} watch={w} rank={i} />
            ))}

            <div style={{ marginTop: 44, padding: 32, border: '1px solid var(--rule)', background: 'var(--surface)', textAlign: 'center' }}>
              <p style={{ fontSize: 18, fontStyle: 'italic', color: 'var(--muted)', marginBottom: 24, lineHeight: 1.7 }}>
                Want a second opinion from <strong style={{ color: 'var(--mid)', fontStyle: 'normal' }}>a real watch enthusiast</strong>?<br />
                We&apos;ll reply personally within 24 hours.
              </p>
              <OracleButton onClick={() => go('email')}>Get a personal recommendation →</OracleButton>
            </div>

            <div style={{ marginTop: 60, paddingTop: 36, borderTop: '1px solid var(--rule)', textAlign: 'center' }}>
              <p style={{ fontSize: 16, fontStyle: 'italic', color: 'var(--muted)', marginBottom: 28, lineHeight: 1.7 }}>
                The perfect gift is the one that proves you were paying attention.
              </p>
              <GhostButton onClick={restart}>← Start again</GhostButton>
            </div>
          </div>
        )}

      </div>

      {/* Global inline styles that can't easily live in Tailwind */}
      <style>{`
        .eyebrow {
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: .45em;
          color: var(--rust);
          text-transform: uppercase;
        }
        .oracle-input {
          display: block;
          width: 100%;
          padding: 15px 20px;
          background: var(--surface);
          border: 1px solid var(--rule);
          color: var(--ink);
          font-family: var(--font-display);
          font-size: 18px;
          outline: none;
          transition: border-color .22s;
          -webkit-appearance: none;
        }
        .oracle-input:focus { border-color: var(--rust); }
        .oracle-input::placeholder { color: var(--muted); font-style: italic; }
      `}</style>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Clock() {
  return (
    <div style={{ width: 52, height: 52, border: '1px solid rgba(192,64,42,.38)', borderRadius: '50%', margin: '0 auto 52px', position: 'relative' }}>
      <div style={{ position: 'absolute', left: '50%', bottom: '50%', transformOrigin: '50% 100%', background: 'var(--rust)', borderRadius: 1, width: 1.5, height: 13, marginLeft: -0.75, animation: 'rot 12s linear infinite' }} />
      <div style={{ position: 'absolute', left: '50%', bottom: '50%', transformOrigin: '50% 100%', background: 'var(--rust)', borderRadius: 1, width: 1, height: 18, marginLeft: -0.5, animation: 'rot 3s linear infinite', opacity: 0.5 }} />
      <div style={{ position: 'absolute', width: 3, height: 3, background: 'var(--rust)', borderRadius: '50%', left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }} />
    </div>
  )
}

function ThinkingRing() {
  return (
    <div style={{ width: 70, height: 70, border: '1px solid var(--rule)', borderTopColor: 'var(--rust)', borderRadius: '50%', animation: 'spin 2s linear infinite', marginBottom: 56, position: 'relative', flexShrink: 0 }}>
      <div style={{ position: 'absolute', inset: 7, border: '1px solid transparent', borderRightColor: 'rgba(192,64,42,.22)', borderRadius: '50%', animation: 'spinr 3.2s linear infinite' }} />
    </div>
  )
}

function OracleButton({ onClick, children, disabled }: { onClick: () => void; children: React.ReactNode; disabled?: boolean }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 12,
        padding: '16px 48px',
        border: '1px solid var(--rust)',
        color: hovered ? 'var(--ink)' : 'var(--rust)',
        background: hovered ? 'var(--rust)' : 'transparent',
        fontFamily: 'var(--font-mono)',
        fontSize: 11, letterSpacing: '.3em', textTransform: 'uppercase',
        cursor: disabled ? 'default' : 'pointer',
        transition: 'color .38s, background .38s',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  )
}

function GhostButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-block', padding: '13px 32px',
        border: '1px solid var(--rule)',
        color: hovered ? 'var(--mid)' : 'var(--muted)',
        borderColor: hovered ? 'var(--muted)' : 'var(--rule)',
        background: 'transparent',
        fontFamily: 'var(--font-mono)',
        fontSize: 10, letterSpacing: '.22em', textTransform: 'uppercase',
        cursor: 'pointer', transition: 'border-color .25s, color .25s',
      }}
    >
      {children}
    </button>
  )
}

function OptButton({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  const [sel, setSel] = useState(false)
  const [hovered, setHovered] = useState(false)

  function handleClick() {
    setSel(true)
    onClick()
  }

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 20,
        width: '100%', padding: '22px 26px',
        border: `1px solid ${sel || hovered ? 'rgba(192,64,42,.4)' : 'var(--rule)'}`,
        background: sel || hovered ? 'var(--surface)' : 'var(--surface)',
        color: 'var(--ink)',
        fontFamily: 'var(--font-display)',
        textAlign: 'left', cursor: 'pointer',
        position: 'relative', overflow: 'hidden',
        transition: 'border-color .22s, background .22s',
      }}
    >
      {/* Left gold accent bar */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 2,
        background: 'var(--rust)',
        transform: sel || hovered ? 'scaleY(1)' : 'scaleY(0)',
        transformOrigin: 'bottom',
        transition: 'transform .26s cubic-bezier(.16,1,.3,1)',
      }} />
      <span style={{ fontSize: 26, width: 36, textAlign: 'center', flexShrink: 0, opacity: 0.9 }}>{icon}</span>
      <span style={{ fontSize: 22, fontWeight: 400, lineHeight: 1.2 }}>{label}</span>
    </button>
  )
}

function ForkCard({ icon, title, desc, onClick }: { icon: string; title: string; desc: string; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '32px 28px',
        border: `1px solid ${hovered ? 'rgba(192,64,42,.38)' : 'var(--rule)'}`,
        background: hovered ? 'var(--surface)' : 'var(--surface)',
        cursor: 'pointer', position: 'relative', overflow: 'hidden',
        transition: 'border-color .25s, background .25s',
      }}
    >
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: 'var(--rust)', transform: hovered ? 'scaleY(1)' : 'scaleY(0)', transformOrigin: 'bottom', transition: 'transform .3s cubic-bezier(.16,1,.3,1)' }} />
      <span style={{ fontSize: 28, display: 'block', marginBottom: 18 }}>{icon}</span>
      <span style={{ display: 'block', fontSize: 22, fontWeight: 400, marginBottom: 10 }}>{title}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', lineHeight: 1.65, letterSpacing: '.02em' }}>{desc}</span>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 26 }}>
      <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.32em', color: 'var(--rust)', textTransform: 'uppercase', marginBottom: 10 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function Divider({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 28 }}>
      <div style={{ flex: 1, height: 1, background: 'var(--rule)' }} />
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.3em', color: 'var(--muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'var(--rule)' }} />
    </div>
  )
}

function WatchCard({ watch, rank }: { watch: Watch; rank: number }) {
  const [hovered, setHovered] = useState(false)
  const labels = ['★  Perfect Match', 'Also consider', 'Third option']
  const isTop = rank === 0

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: 30,
        border: `1px solid ${isTop ? 'rgba(192,64,42,.45)' : hovered ? 'rgba(192,64,42,.2)' : 'var(--rule)'}`,
        background: hovered ? 'var(--surface)' : 'var(--surface)',
        marginBottom: 12, position: 'relative', overflow: 'hidden',
        transition: 'border-color .22s, background .22s',
        animation: `rise .5s cubic-bezier(.16,1,.3,1) ${rank * 0.08}s both`,
      }}
    >
      {/* Top gold line for perfect match */}
      {isTop && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, var(--rust), transparent)' }} />}

      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.22em', color: 'var(--rust)', textTransform: 'uppercase', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
        {labels[rank]}
        <div style={{ flex: 1, height: 1, background: 'var(--rule)' }} />
      </div>
      <div style={{ fontSize: 28, fontWeight: 500, marginBottom: 4, lineHeight: 1.2 }}>{watch.name}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '.22em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 18 }}>{watch.brand}</div>
      <div style={{ fontSize: 17, fontStyle: 'italic', color: 'var(--mid)', lineHeight: 1.82, marginBottom: 16 }}>{watch.pitch}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--rust2)', letterSpacing: '.07em' }}>{watch.price}</div>
    </div>
  )
}
