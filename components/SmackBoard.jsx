'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { postMessage, deleteMessage } from '../app/pong-actions'

const fmtWhen = (iso) => new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

export function PostForm({ players, meName }) {
  const [body, setBody] = useState('')
  const [target, setTarget] = useState('')
  const [err, setErr] = useState('')
  const [pending, start] = useTransition()
  const router = useRouter()

  const submit = (e) => {
    e.preventDefault()
    start(async () => {
      setErr('')
      const res = await postMessage(body, target || null)
      if (!res.ok) { setErr(res.error); return }
      setBody('')
      router.refresh()
    })
  }

  return (
    <form onSubmit={submit} className="card">
      <div className="card-head">
        <span className="card-title">Talk Your Smack</span>
        <span className="muted" style={{ fontSize: 11 }}>posting as {meName}</span>
      </div>
      <div className="pad">
        <textarea
          className="field" rows={3} maxLength={280} disabled={pending}
          style={{ width: '100%', resize: 'vertical', boxSizing: 'border-box' }}
          placeholder="Loser buys the paddles…"
          value={body} onChange={(e) => { setBody(e.target.value); setErr('') }}
        />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10, flexWrap: 'wrap' }}>
          <select className="field" value={target} disabled={pending} onChange={(e) => setTarget(e.target.value)}>
            <option value="">@ the whole group</option>
            {players.map((p) => <option key={p.id} value={p.id}>@ {p.name}</option>)}
          </select>
          <button className="btn primary" disabled={pending || !body.trim()}>{pending ? 'Posting…' : 'Post'}</button>
          <span className="muted num" style={{ fontSize: 11, marginLeft: 'auto' }}>{280 - body.length}</span>
        </div>
        {err && <p style={{ color: 'var(--red)', fontSize: 12.5, margin: '8px 0 0' }}>{err}</p>}
      </div>
    </form>
  )
}

export function DeleteMessage({ id }) {
  const [pending, start] = useTransition()
  const router = useRouter()
  return (
    <button
      className="btn" disabled={pending} title="Delete message"
      style={{ padding: '2px 9px', fontSize: 12, lineHeight: '18px' }}
      onClick={() => { if (confirm('Delete this message?')) start(async () => { await deleteMessage(id); router.refresh() }) }}
    >✕</button>
  )
}
