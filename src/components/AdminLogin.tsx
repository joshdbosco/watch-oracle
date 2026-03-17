'use client'

// src/components/AdminLogin.tsx
import { useState } from 'react'

export function AdminLogin() {
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      // Reload the page — the server component will now see the session cookie
      window.location.reload()
    } else {
      setError('Incorrect password.')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ fontFamily: 'var(--font-dm-mono), monospace', fontSize: 9, letterSpacing: '.45em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 24, textAlign: 'center' }}>
          Watch Oracle
        </div>
        <h1 style={{ fontSize: 36, fontWeight: 400, lineHeight: 1.1, marginBottom: 40, textAlign: 'center' }}>
          Admin <em style={{ fontStyle: 'italic', color: 'var(--gold-lt)' }}>access</em>
        </h1>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontFamily: 'var(--font-dm-mono), monospace', fontSize: 9, letterSpacing: '.32em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 10 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoFocus
              style={{
                display: 'block', width: '100%', padding: '15px 20px',
                background: 'var(--surface)', border: `1px solid ${error ? '#b04030' : 'var(--border)'}`,
                color: 'var(--text)', fontFamily: 'var(--font-garamond), serif',
                fontSize: 18, outline: 'none',
              }}
            />
            {error && <p style={{ fontFamily: 'var(--font-dm-mono), monospace', fontSize: 10, color: '#b04030', marginTop: 7 }}>{error}</p>}
          </div>
          <button
            type="submit"
            disabled={loading || !password}
            style={{
              width: '100%', padding: '16px 0',
              border: '1px solid var(--gold)',
              background: 'transparent', color: 'var(--gold)',
              fontFamily: 'var(--font-dm-mono), monospace',
              fontSize: 11, letterSpacing: '.3em', textTransform: 'uppercase',
              cursor: loading ? 'default' : 'pointer',
              opacity: loading || !password ? 0.5 : 1,
              transition: 'opacity .2s',
            }}
          >
            {loading ? 'Checking…' : 'Enter →'}
          </button>
        </form>
      </div>
    </div>
  )
}
