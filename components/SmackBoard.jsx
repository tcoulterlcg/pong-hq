'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { postMessage, deleteMessage } from '../app/pong-actions'

// Inline post box for the Message Board (no card wrapper — the section wraps it).
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
      setBody(''); setTarget('')
      router.refresh()
    })
  }

  return (
    <form onSubmit={submit}>
      <textarea
        className="field" rows={2} maxLength={280} disabled={pending}
        style={{ width: '100%', resize: 'vertical', boxSizing: 'border-box' }}
        placeholder={`Post to the board as ${meName}…`}
        value={body} onChange={(e) => { setBody(e.target.value); setErr('') }}
      />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
        <select className="field" value={target} disabled={pending} onChange={(e) => setTarget(e.target.value)}>
          <option value="">To everyone</option>
          {[...players].sort((a, b) => a.name.localeCompare(b.name)).map((p) => <option key={p.id} value={p.id}>@ {p.name}</option>)}
        </select>
        <button className="btn primary" disabled={pending || !body.trim()}>{pending ? 'Posting…' : 'Post'}</button>
        <span className="muted num" style={{ fontSize: 11, marginLeft: 'auto' }}>{280 - body.length}</span>
      </div>
      {err && <p style={{ color: 'var(--red)', fontSize: 12.5, margin: '8px 0 0' }}>{err}</p>}
    </form>
  )
}

export function DeleteMessage({ id }) {
  const [pending, start] = useTransition()
  const router = useRouter()
  return (
    <button
      className="btn remove-x" disabled={pending} title="Delete post"
      style={{ padding: '2px 9px', fontSize: 12, lineHeight: '18px' }}
      onClick={() => { if (confirm('Delete this post?')) start(async () => { await deleteMessage(id); router.refresh() }) }}
    >✕</button>
  )
}
