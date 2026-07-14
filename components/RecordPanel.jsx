'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { recordMatch, removeMatch } from '../app/pong-actions'

export default function RecordPanel({ players, byName, canUndo, lastId }) {
  const [winner, setWinner] = useState('')
  const [loser, setLoser] = useState('')
  const [ok, setOk] = useState('')
  const [err, setErr] = useState('')
  const [pending, start] = useTransition()
  const router = useRouter()

  const submit = () => start(async () => {
    setOk(''); setErr('')
    const w = players.find((p) => p.id === winner)?.name
    const l = players.find((p) => p.id === loser)?.name
    const res = await recordMatch(winner, loser, byName)
    if (!res.ok) { setErr(res.error); return }
    setOk(`✓ Recorded: ${w} def. ${l} (+${res.delta}) — both sites updated`)
    router.refresh()
  })

  const undo = () => start(async () => {
    setOk(''); setErr('')
    const res = await removeMatch(lastId)
    if (!res.ok) { setErr(res.error); return }
    setOk('✓ Last match reverted')
    router.refresh()
  })

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <select className="field" value={winner} disabled={pending} onChange={(e) => { setWinner(e.target.value); setOk(''); setErr('') }}>
          <option value="">Winner…</option>
          {players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <span className="muted" style={{ fontSize: 12 }}>def.</span>
        <select className="field" value={loser} disabled={pending} onChange={(e) => { setLoser(e.target.value); setOk(''); setErr('') }}>
          <option value="">Loser…</option>
          {players.filter((p) => p.id !== winner).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <button className="btn primary" disabled={pending || !winner || !loser} onClick={submit}>{pending ? 'Recording…' : 'Record'}</button>
        <button className="btn" disabled={pending} title="Reload standings" onClick={() => start(async () => router.refresh())}>⟳</button>
        {canUndo && <button className="btn" disabled={pending} onClick={undo}>Undo last</button>}
      </div>
      {ok && <p style={{ color: 'var(--green)', fontSize: 12.5, fontWeight: 700, margin: '8px 0 0' }}>{ok}</p>}
      {err && <p style={{ color: 'var(--red)', fontSize: 12.5, margin: '8px 0 0' }}>{err}</p>}
      <p className="muted" style={{ fontSize: 11, margin: '10px 0 0' }}>Selections stay put for rematches. Matches recorded here appear on Reconciliation HQ instantly (and vice versa).</p>
    </div>
  )
}
