'use client'
// Record a match by tapping: pick the winner, then the loser, then Record.
// Same server actions as before (recordMatch / removeMatch).
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { recordMatch, removeMatch } from '../app/pong-actions'

const expectedDelta = (w, l) =>
  w?.rating != null && l?.rating != null
    ? Math.round(32 * (1 - 1 / (1 + Math.pow(10, (l.rating - w.rating) / 400))))
    : null

export default function RecordPanel({ players, byName, canUndo, lastId }) {
  const [winner, setWinner] = useState('')
  const [loser, setLoser] = useState('')
  const [slot, setSlot] = useState('win')
  const [ok, setOk] = useState('')
  const [err, setErr] = useState('')
  const [pending, start] = useTransition()
  const router = useRouter()
  const roster = [...players].sort((a, b) => a.name.localeCompare(b.name))
  const W = players.find((p) => p.id === winner)
  const L = players.find((p) => p.id === loser)
  const delta = expectedDelta(W, L)

  const pick = (id) => {
    setOk(''); setErr('')
    if (slot === 'win') {
      setWinner(id)
      if (loser === id) setLoser('')
      setSlot('lose')
    } else {
      setLoser(id)
      if (winner === id) { setWinner(''); setSlot('win') }
    }
  }

  const submit = () => start(async () => {
    setOk(''); setErr('')
    const res = await recordMatch(winner, loser, byName)
    if (!res.ok) { setErr(res.error); return }
    setOk(`✓ Recorded: ${W?.name} def. ${L?.name} (+${res.delta})`)
    router.refresh()
  })

  const undo = () => start(async () => {
    setOk(''); setErr('')
    const res = await removeMatch(lastId)
    if (!res.ok) { setErr(res.error); return }
    setOk('✓ Last match reverted')
    router.refresh()
  })

  const hint = !W ? 'Tap the winner' : !L ? 'Now tap who lost' : delta != null ? `${W.name} gains about ${delta}` : 'Ready to record'

  return (
    <div id="record">
      <div className="rp-slots">
        <button type="button" className={`rp-slot${slot === 'win' ? ' on' : ''}`} onClick={() => setSlot('win')} disabled={pending}>
          <span className="k w">Winner</span>
          <span className="n">{W?.name || 'Pick'}</span>
          <span className="d" style={{ color: 'var(--green)' }}>{W && L && delta != null ? `+${delta}` : ''}</span>
        </button>
        <span className="rp-def">def.</span>
        <button type="button" className={`rp-slot${slot === 'lose' ? ' on' : ''}`} onClick={() => setSlot('lose')} disabled={pending}>
          <span className="k l">Loser</span>
          <span className="n">{L?.name || 'Pick'}</span>
          <span className="d" style={{ color: 'var(--red)' }}>{W && L && delta != null ? `−${delta}` : ''}</span>
        </button>
      </div>
      <p className="rp-hint">{hint}</p>
      <div className="rp-grid">
        {roster.map((p) => (
          <button
            type="button"
            key={p.id}
            disabled={pending}
            className={`rp-chip${p.id === winner ? ' win' : p.id === loser ? ' lose' : ''}`}
            aria-pressed={p.id === winner || p.id === loser}
            onClick={() => pick(p.id)}
          >
            <span className="nm">{p.name}</span>
            {p.rating != null && <span className="rt num">{p.rating}</span>}
          </button>
        ))}
      </div>
      <div className="rp-actions">
        {canUndo && <button type="button" className="btn" disabled={pending} onClick={undo}>Undo last</button>}
        <button type="button" className="btn" disabled={pending} title="Reload standings" aria-label="Reload standings" onClick={() => start(async () => router.refresh())}>⟳</button>
        <button type="button" className="btn primary" disabled={pending || !winner || !loser} onClick={submit}>
          {pending ? 'Recording…' : W && L ? `Record ${W.name} win` : 'Record'}
        </button>
      </div>
      {ok && <p style={{ color: 'var(--green)', fontSize: 13, fontWeight: 700, margin: '10px 0 0' }}>{ok}</p>}
      {err && <p style={{ color: 'var(--red)', fontSize: 13, margin: '10px 0 0' }}>{err}</p>}
      <p className="muted" style={{ fontSize: 11.5, margin: '10px 0 0' }}>Picks stay put for rematches. Matches recorded here show up on Reconciliation HQ instantly (and vice versa).</p>
    </div>
  )
}
