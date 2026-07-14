'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from '../app/auth-actions'
import LcgLogo from './LcgLogo'

export default function LoginForm({ profiles }) {
  const router = useRouter()
  const [profile, setProfile] = useState(profiles[0]?.id || '')
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
        <div className="card-head" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8, display: 'flex' }}>
          <LcgLogo height={26} />
          <span className="card-title">🏓 Table Tennis HQ — Player Sign-in</span>
        </div>
        <div className="pad">
          <p className="muted" style={{ fontSize: 12.5, marginTop: 0 }}>Viewing the ladder needs no sign-in. Sign in with your name to record your games.</p>
          <label className="card-title" style={{ display: 'block', margin: '12px 0 6px' }}>Your name</label>
          <select className="field" style={{ width: '100%' }} value={profile} onChange={(e) => setProfile(e.target.value)}>
            {profiles.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <label className="card-title" style={{ display: 'block', margin: '14px 0 6px' }}>Passcode</label>
          <input className="field" style={{ width: '100%' }} type="password" value={passcode} autoFocus
            onChange={(e) => setPasscode(e.target.value)} placeholder="Office passcode" />
          {error && <p style={{ color: 'var(--red)', fontSize: 12.5 }}>{error}</p>}
          <button className="btn primary" style={{ width: '100%', marginTop: 16 }} disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        </div>
      </form>
    </div>
  )
}
