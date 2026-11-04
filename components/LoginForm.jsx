'use client'
// Sign in by tapping your name. No password: this is an office ladder, and
// being signed in only lets you record games and post to the board.
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from '../app/auth-actions'
import LcgLogo from './LcgLogo'

export default function LoginForm({ profiles }) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [chosen, setChosen] = useState('')
  const [pending, start] = useTransition()
  const roster = [...profiles].sort((a, b) => a.name.localeCompare(b.name))

  const pick = (id) => {
    setChosen(id); setError('')
    start(async () => {
      const res = await signIn(id)
      if (res.ok) { router.replace('/'); router.refresh() }
      else { setError(res.error || 'Sign-in failed. Try again.'); setChosen('') }
    })
  }

  return (
    <div className="login-wrap">
      <div className="card login-card">
        <div className="login-head">
          <LcgLogo height={30} />
          <span className="brand-chip">Ping Pong</span>
        </div>
        <div className="pad">
          <h1 className="login-title">Who's playing?</h1>
          <p className="login-sub">Tap your name to sign in. You'll be able to record games and post to the board. Anyone can view the rankings without signing in.</p>
          <div className="login-grid">
            {roster.map((p) => (
              <button key={p.id} type="button" className={`rp-chip${chosen === p.id ? ' win' : ''}`} disabled={pending} onClick={() => pick(p.id)}>
                <span className="nm">{p.name}</span>
                {chosen === p.id && pending && <span className="rt">Signing in…</span>}
              </button>
            ))}
          </div>
          {error && <p className="form-error">{error}</p>}
          <Link href="/" className="login-back">Back to rankings</Link>
        </div>
      </div>
    </div>
  )
}
