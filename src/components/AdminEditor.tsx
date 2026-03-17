'use client'

// src/components/AdminEditor.tsx
// The full watch database editor. Talks to /api/watches via fetch.
// All state is local — saves hit Notion immediately on "Save".

import { useState, useEffect } from 'react'
import type { Watch } from '@/lib/types'
import { TAG_GROUPS, BUDGET_LABELS } from '@/lib/types'

interface Props { initialWatches: Watch[] }

const BUDGET_TIERS = Object.keys(BUDGET_LABELS) as (keyof typeof BUDGET_LABELS)[]

export function AdminEditor({ initialWatches }: Props) {
  const [watches,     setWatches]     = useState<Watch[]>(initialWatches)
  const [activeId,    setActiveId]    = useState<string | null>(null)
  const [search,      setSearch]      = useState('')
  const [tierFilter,  setTierFilter]  = useState('all')
  const [toast,       setToast]       = useState<{ msg: string; err?: boolean } | null>(null)
  const [saving,      setSaving]      = useState(false)
  const [confirmId,   setConfirmId]   = useState<string | null>(null)

  // Editor form state
  const [fName,   setFName]   = useState('')
  const [fBrand,  setFBrand]  = useState('')
  const [fPrice,  setFPrice]  = useState('')
  const [fPitch,  setFPitch]  = useState('')
  const [fBudget, setFBudget] = useState('budget_mid')
  const [fTags,   setFTags]   = useState<string[]>([])

  // ── Populate editor when a watch is selected ──────────────────────────────
  useEffect(() => {
    const w = watches.find(w => w.id === activeId)
    if (!w) return
    setFName(w.name)
    setFBrand(w.brand)
    setFPrice(w.price)
    setFPitch(w.pitch)
    setFBudget(w.tags.find(t => t.startsWith('budget_')) ?? 'budget_mid')
    setFTags(w.tags.filter(t => !t.startsWith('budget_')))
  }, [activeId, watches])

  // ── Filtered list ─────────────────────────────────────────────────────────
  const visible = watches.filter(w => {
    const tierOk   = tierFilter === 'all' || w.tags.includes(tierFilter)
    const searchOk = !search || w.name.toLowerCase().includes(search.toLowerCase()) || w.brand.toLowerCase().includes(search.toLowerCase())
    return tierOk && searchOk
  })

  // ── Toast ─────────────────────────────────────────────────────────────────
  function showToast(msg: string, err = false) {
    setToast({ msg, err })
    setTimeout(() => setToast(null), 2400)
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!fName.trim() || !fBrand.trim() || !fPrice.trim() || !fPitch.trim()) {
      showToast('Name, brand, price and pitch are all required.', true)
      return
    }
    setSaving(true)
    const payload = {
      name:  fName.trim(),
      brand: fBrand.trim(),
      price: fPrice.trim(),
      pitch: fPitch.trim(),
      tags:  [fBudget, ...fTags],
    }

    try {
      if (activeId && !activeId.startsWith('new-')) {
        // Update existing
        const res = await fetch(`/api/watches/${activeId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error()
        const updated: Watch = await res.json()
        setWatches(prev => prev.map(w => w.id === activeId ? updated : w))
        showToast('Saved.')
      } else {
        // Create new
        const res = await fetch('/api/watches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error()
        const created: Watch = await res.json()
        setWatches(prev => [...prev, created])
        setActiveId(created.id)
        showToast('Watch created.')
      }
    } catch {
      showToast('Save failed. Check your connection.', true)
    } finally {
      setSaving(false)
    }
  }

  // ── New watch ─────────────────────────────────────────────────────────────
  function handleNew() {
    const tempId = `new-${Date.now()}`
    const blank: Watch = { id: tempId, name: 'New Watch', brand: 'BRAND', price: '£0', tags: ['budget_mid','level_1','general','mono','med_wrist','case_39_42','honest'], pitch: 'Write the pitch here.' }
    setWatches(prev => [...prev, blank])
    setActiveId(tempId)
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!confirmId) return
    const isTemp = confirmId.startsWith('new-')

    if (!isTemp) {
      try {
        const res = await fetch(`/api/watches/${confirmId}`, { method: 'DELETE' })
        if (!res.ok) throw new Error()
      } catch {
        showToast('Delete failed.', true)
        setConfirmId(null)
        return
      }
    }

    setWatches(prev => prev.filter(w => w.id !== confirmId))
    if (activeId === confirmId) setActiveId(null)
    setConfirmId(null)
    showToast('Watch removed.')
  }

  // ── Logout ────────────────────────────────────────────────────────────────
  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    window.location.reload()
  }

  const activeWatch = watches.find(w => w.id === activeId)

  // ── Tier badge colour ────────────────────────────────────────────────────
  function tierColor(tier: string) {
    const map: Record<string, string> = {
      budget_entry:    '#7AAD7A',
      budget_mid:      '#ADAD7A',
      budget_upper:    'var(--gold)',
      budget_luxury:   '#D4907A',
      budget_personal: '#D47A7A',
    }
    return map[tier] ?? 'var(--muted)'
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative', zIndex: 1 }}>

      {/* ── SIDEBAR ─────────────────────────────────────────────────────────── */}
      <aside style={{ width: 300, flexShrink: 0, background: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-dm-mono), monospace', fontSize: 9, letterSpacing: '.4em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 4 }}>Watch Oracle</div>
            <div style={{ fontSize: 15, color: 'var(--sub)' }}>Database Editor</div>
          </div>
          <button onClick={handleNew} style={{ fontFamily: 'var(--font-dm-mono), monospace', fontSize: 9, letterSpacing: '.2em', textTransform: 'uppercase', padding: '8px 14px', border: '1px solid var(--border)', color: 'var(--muted)', background: 'transparent', cursor: 'pointer' }}>+ Add</button>
        </div>

        {/* Search */}
        <div style={{ padding: '12px 24px 0' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search watches..."
            style={{ width: '100%', padding: '9px 14px', background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'var(--font-dm-mono), monospace', fontSize: 11, outline: 'none' }}
          />
        </div>

        {/* Tier filters */}
        <div style={{ padding: '10px 24px', display: 'flex', gap: 6, flexWrap: 'wrap', borderBottom: '1px solid var(--border)' }}>
          {['all', ...BUDGET_TIERS].map(t => (
            <button
              key={t}
              onClick={() => setTierFilter(t)}
              style={{
                fontFamily: 'var(--font-dm-mono), monospace', fontSize: 8, letterSpacing: '.15em', textTransform: 'uppercase',
                padding: '3px 8px', border: '1px solid var(--border)',
                background: 'transparent',
                color: tierFilter === t ? 'var(--gold)' : 'var(--muted)',
                borderColor: tierFilter === t ? 'var(--gold)' : 'var(--border)',
                cursor: 'pointer',
              }}
            >
              {t === 'all' ? 'All' : t.replace('budget_', '')}
            </button>
          ))}
        </div>

        {/* Watch list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {visible.length === 0 && (
            <p style={{ padding: '32px 24px', textAlign: 'center', fontStyle: 'italic', color: 'var(--muted)', fontSize: 15 }}>No watches match.</p>
          )}
          {visible.map(w => {
            const bt = w.tags.find(t => t.startsWith('budget_')) ?? ''
            return (
              <div
                key={w.id}
                onClick={() => setActiveId(w.id)}
                style={{
                  padding: '13px 24px', borderBottom: '1px solid var(--border)',
                  cursor: 'pointer', background: activeId === w.id ? 'var(--hover)' : 'transparent',
                  borderLeft: activeId === w.id ? '2px solid var(--gold)' : '2px solid transparent',
                  transition: 'background .18s',
                }}
              >
                <div style={{ fontFamily: 'var(--font-dm-mono), monospace', fontSize: 9, letterSpacing: '.2em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 3 }}>{w.brand}</div>
                <div style={{ fontSize: 16, fontWeight: 400, marginBottom: 4 }}>{w.name}</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-dm-mono), monospace', fontSize: 10, color: 'var(--gold-lt)' }}>{w.price}</span>
                  <span style={{ fontFamily: 'var(--font-dm-mono), monospace', fontSize: 8, letterSpacing: '.1em', textTransform: 'uppercase', color: tierColor(bt), border: `1px solid ${tierColor(bt)}44`, padding: '1px 5px' }}>{bt.replace('budget_','')}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-dm-mono), monospace', fontSize: 9, letterSpacing: '.2em', color: 'var(--muted)', textTransform: 'uppercase' }}>
            {visible.length} of {watches.length} watches
          </span>
          <button onClick={handleLogout} style={{ fontFamily: 'var(--font-dm-mono), monospace', fontSize: 8, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}>Log out</button>
        </div>
      </aside>

      {/* ── MAIN PANEL ──────────────────────────────────────────────────────── */}
      <main style={{ flex: 1, padding: '48px 52px 100px', maxWidth: 760 }}>

        {!activeWatch && (
          <div style={{ paddingTop: 120, textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-dm-mono), monospace', fontSize: 9, letterSpacing: '.4em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 20 }}>Database Editor</div>
            <h2 style={{ fontSize: 'clamp(28px,4vw,42px)', fontWeight: 400, marginBottom: 16 }}>
              Select a watch<br />to <em style={{ fontStyle: 'italic', color: 'var(--gold-lt)' }}>edit it.</em>
            </h2>
            <p style={{ fontSize: 18, fontStyle: 'italic', color: 'var(--muted)', lineHeight: 1.7 }}>Or add a new one with the button above.</p>
          </div>
        )}

        {activeWatch && (
          <div key={activeId}>
            {/* Editor header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 40, gap: 20 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-dm-mono), monospace', fontSize: 10, letterSpacing: '.35em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 8 }}>{fBrand || activeWatch.brand}</div>
                <div style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 400, lineHeight: 1.1 }}>{fName || activeWatch.name}</div>
              </div>
              <div style={{ display: 'flex', gap: 10, flexShrink: 0, paddingTop: 4 }}>
                <ActionButton onClick={handleSave} disabled={saving} gold>
                  {saving ? 'Saving…' : 'Save →'}
                </ActionButton>
                <ActionButton onClick={() => setConfirmId(activeId!)} danger>✕</ActionButton>
              </div>
            </div>

            {/* Core fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
              <EditorField label="Watch name">
                <input className="oracle-input" value={fName} onChange={e => setFName(e.target.value)} placeholder="e.g. Black Bay 58" />
              </EditorField>
              <EditorField label="Brand">
                <input className="oracle-input" value={fBrand} onChange={e => setFBrand(e.target.value)} placeholder="e.g. TUDOR" />
              </EditorField>
              <EditorField label="Price display">
                <input className="oracle-input" value={fPrice} onChange={e => setFPrice(e.target.value)} placeholder="e.g. £1,200" />
              </EditorField>
              <EditorField label="Budget tier">
                <select className="oracle-input" value={fBudget} onChange={e => setFBudget(e.target.value)} style={{ fontFamily: 'var(--font-dm-mono), monospace', fontSize: 12, cursor: 'pointer' }}>
                  {BUDGET_TIERS.map(t => (
                    <option key={t} value={t} style={{ background: 'var(--surface)' }}>{BUDGET_LABELS[t]}</option>
                  ))}
                </select>
              </EditorField>
            </div>

            <EditorField label="The pitch — why this watch for this person">
              <textarea className="oracle-input" rows={4} value={fPitch} onChange={e => setFPitch(e.target.value)} style={{ resize: 'vertical', lineHeight: 1.7 }} />
            </EditorField>

            {/* Tags */}
            <div style={{ marginTop: 32 }}>
              <div style={{ fontFamily: 'var(--font-dm-mono), monospace', fontSize: 9, letterSpacing: '.32em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 8 }}>Tags</div>
              <p style={{ fontSize: 14, fontStyle: 'italic', color: 'var(--muted)', marginBottom: 20, lineHeight: 1.6 }}>
                Tags are how the engine matches watches to quiz answers. Budget tier is managed by the dropdown above.
              </p>
              {Object.entries(TAG_GROUPS).map(([group, groupTags]) => (
                <div key={group} style={{ marginBottom: 18 }}>
                  <div style={{ fontFamily: 'var(--font-dm-mono), monospace', fontSize: 8, letterSpacing: '.25em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8 }}>{group}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                    {groupTags.map(tag => {
                      const active = fTags.includes(tag)
                      return (
                        <button
                          key={tag}
                          onClick={() => setFTags(prev => active ? prev.filter(t => t !== tag) : [...prev, tag])}
                          style={{
                            fontFamily: 'var(--font-dm-mono), monospace', fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase',
                            padding: '5px 10px', cursor: 'pointer',
                            border: `1px solid ${active ? 'var(--gold)' : 'var(--border)'}`,
                            color: active ? 'var(--gold)' : 'var(--muted)',
                            background: active ? 'rgba(184,151,106,.1)' : 'transparent',
                            transition: 'all .18s',
                          }}
                        >
                          {tag}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ── TOAST ─────────────────────────────────────────────────────────────── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 32, right: 32, zIndex: 100,
          padding: '14px 24px', border: `1px solid ${toast.err ? '#8B3A2A' : 'var(--gold)'}`,
          background: 'var(--surface)',
          fontFamily: 'var(--font-dm-mono), monospace', fontSize: 10, letterSpacing: '.15em',
          color: toast.err ? '#E87060' : 'var(--gold)', textTransform: 'uppercase',
          animation: 'rise .3s cubic-bezier(.16,1,.3,1) both',
        }}>
          {toast.msg}
        </div>
      )}

      {/* ── DELETE CONFIRM ──────────────────────────────────────────────────── */}
      {confirmId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(13,11,9,.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ padding: 48, background: 'var(--surface)', border: '1px solid var(--border)', maxWidth: 420, width: '90%', animation: 'rise .3s cubic-bezier(.16,1,.3,1) both' }}>
            <h3 style={{ fontSize: 26, fontWeight: 400, marginBottom: 12 }}>
              Remove <em style={{ fontStyle: 'italic', color: 'var(--gold-lt)' }}>{watches.find(w => w.id === confirmId)?.name}</em>?
            </h3>
            <p style={{ fontSize: 16, fontStyle: 'italic', color: 'var(--muted)', marginBottom: 32, lineHeight: 1.7 }}>
              This archives the watch in Notion. You can restore it from Notion if needed.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <ActionButton onClick={handleDelete} danger>Remove it</ActionButton>
              <ActionButton onClick={() => setConfirmId(null)}>Cancel</ActionButton>
            </div>
          </div>
        </div>
      )}

      {/* Shared input style */}
      <style>{`
        .oracle-input {
          display: block; width: 100%; padding: 12px 16px;
          background: var(--hover); border: 1px solid var(--border);
          color: var(--text); font-family: var(--font-garamond), serif;
          font-size: 17px; outline: none; transition: border-color .2s;
        }
        .oracle-input:focus { border-color: var(--gold); }
        .oracle-input::placeholder { color: var(--muted); font-style: italic; }
      `}</style>
    </div>
  )
}

function EditorField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <label style={{ display: 'block', fontFamily: 'var(--font-dm-mono), monospace', fontSize: 9, letterSpacing: '.32em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 8 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function ActionButton({ onClick, children, disabled, gold, danger }: { onClick: () => void; children: React.ReactNode; disabled?: boolean; gold?: boolean; danger?: boolean }) {
  const [hovered, setHovered] = useState(false)

  const borderColor = danger ? 'rgba(139,58,42,.5)' : gold ? 'var(--gold)' : 'var(--border)'
  const color       = danger ? (hovered ? '#E87060' : 'rgba(180,90,70,.8)') : gold ? (hovered ? 'var(--deep)' : 'var(--gold)') : 'var(--muted)'
  const bg          = gold && hovered ? 'var(--gold)' : danger && hovered ? 'rgba(139,58,42,.12)' : 'transparent'

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '11px 22px', border: `1px solid ${borderColor}`,
        color, background: bg,
        fontFamily: 'var(--font-dm-mono), monospace',
        fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'color .25s, background .25s, border-color .25s',
      }}
    >
      {children}
    </button>
  )
}

// useHover inline state
function useState2<T>(init: T) { return useState(init) }
void useState2
