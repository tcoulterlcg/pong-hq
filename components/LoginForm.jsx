'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from '../app/auth-actions'
import { EDITOR_PROFILES } from '../lib/users.mjs'

export default function LoginForm() {
  const router = useRouter()
  const [profile, setProfile] = useState(EDITOR_PROFILES[0].id)
  const [passcode, setPasscode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setError('')
    const res = await signIn(profile, passcode)
    if (res.ok) { router.replace('/'); router.refresh() }
    else { setError(res.error || 'Sign-in failed.'); setBusy(false) }
  }

  return (
    <div className="login-wrap">
      <form className="card login-card" onSubmit={submit}>
        <div className="card-head"><span className="card-title">🏓 Table Tennis HQ — Editor Sign-in</span></div>
        <div className="pad">
          <p className="muted" style={{ fontSize: 12.5, marginTop: 0 }}>Viewing the ladder needs no sign-in. Recording matches is limited to the three editors.</p>
          <label className="card-title" style={{ display: 'block', margin: '12px 0 6px' }}>Profile</label>
          <select className="field" style={{ width: '100%' }} value={profile} onChange={(e) => setProfile(e.target.value)}>
            {EDITOR_PROFILES.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <label className="card-title" style={{ display: 'block', margin: '14px 0 6px' }}>Passcode</label>
          <input className="field" style={{ width: '100%' }} type="password" value={passcode} autoFocus
            onChange={(e) => setPasscode(e.target.value)} placeholder="Same passcode as Reconciliation HQ" />
          {error && <p style={{ color: 'var(--red)', fontSize: 12.5 }}>{error}</p>}
          <button className="btn primary" style={{ width: '100%', marginTop: 16 }} disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        </div>
      </form>
    </div>
  )
}
