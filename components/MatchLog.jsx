'use client'
// A player's games, newest first, filtered by Daily / Weekly / Monthly / All
// time. Shows 15 at a time with a button to load more.
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { PERIODS, periodWindow, inWindow } from '../lib/period.mjs'

const PAGE = 15
const fmtWhen = (iso) => new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' })
const signed = (n) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0')

export default function MatchLog({ history }) {
  const [kind, setKind] = useState('all')
  const [shown, setShown] = useState(PAGE)
  const win = useMemo(() => periodWindow(kind, 0), [kind])
  const games = useMemo(() => history.filter((m) => inWindow(m.at, win)), [history, win])
  const wins = games.filter((m) => m.won).length
  const net = games.reduce((s, m) => s + m.delta, 0)

  return (
    <div className="card">
      <div className="card-head">
        <span className="card-title">Match Log</span>
        <div className="ptab-set small" role="tablist" aria-label="Time period">
          {PERIODS.map((p) => (
            <button key={p.id} type="button" role="tab" aria-selected={kind === p.id}
              className={`ptab${kind === p.id ? ' on' : ''}`} onClick={() => { setKind(p.id); setShown(PAGE) }}>{p.label}</button>
          ))}
        </div>
      </div>
      <div className="board-strip">
        <b>{win.label}</b>
        <span className="num">
          {games.length === 0 ? 'No games' : <>
            <span className="w">{wins}</span>–<span className="l">{games.length - wins}</span>
            {' · '}{games.length} {games.length === 1 ? 'game' : 'games'}
            {' · '}<span style={{ color: net > 0 ? 'var(--green)' : net < 0 ? 'var(--red)' : undefined }}>{signed(net)}</span>
          </>}
        </span>
      </div>
      <div className="pad tight">
        {games.length === 0 && <p className="empty">No games in this period.</p>}
        {games.slice(0, shown).map((m, i) => (
          <div className="item" key={`${m.at}-${i}`}>
            <span className="item-main">
              <span>
                <span className={`mlog-res ${m.won ? 'win' : 'loss'}`}>{m.won ? 'W' : 'L'}</span>
                {' '}vs <Link href={`/player/${m.oppId}`} className="opp">{m.oppName}</Link>
              </span>
              <span className="muted when">{fmtWhen(m.at)}</span>
            </span>
            <span className="num delta" style={{ color: m.won ? 'var(--green)' : 'var(--red)' }}>{signed(m.delta)}</span>
          </div>
        ))}
        {games.length > shown && (
          <button type="button" className="btn more" onClick={() => setShown((n) => n + PAGE * 2)}>
            Show more ({games.length - shown} left)
          </button>
        )}
      </div>
    </div>
  )
}
