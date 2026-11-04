'use client'
// Rankings card: Daily / Weekly / Monthly / All time, with arrows to step back
// through earlier days, weeks and months. All time ranks by Elo rating; the
// shorter views rank by rating gained in that window, then wins.
// Clicking a column header re-sorts the rows without changing anyone's rank.
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { PERIODS, periodWindow, inWindow } from '../lib/period.mjs'
import Badges from './Badges'

const medal = (r) => (r === 1 ? 'gold' : r === 2 ? 'silver' : r === 3 ? 'bronze' : '')
const fmtStreak = (s) => (s === 0 ? '—' : s > 0 ? `W${s}` : `L${-s}`)
const signed = (n) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0')
const DESC_FIRST = new Set(['score', 'wins', 'games', 'winPct', 'streak'])

const EMPTY = {
  day: 'No games yet today.',
  week: 'No games yet this week.',
  month: 'No games yet this month.',
}

export default function RankingsBoard({ players, matchLog }) {
  const [kind, setKind] = useState('all')
  const [offset, setOffset] = useState(0)
  const [sort, setSort] = useState(null)

  const win = useMemo(() => periodWindow(kind, offset), [kind, offset])
  const isAll = kind === 'all'

  const { rows, count } = useMemo(() => {
    if (isAll) {
      return {
        count: matchLog.length,
        rows: players.map((p) => ({ ...p, score: p.rating, place: p.rank })),
      }
    }
    const tally = new Map()
    let count = 0
    for (const m of matchLog) {
      if (!inWindow(m.at, win)) continue
      count += 1
      const w = tally.get(m.w) || { wins: 0, losses: 0, net: 0 }
      const l = tally.get(m.l) || { wins: 0, losses: 0, net: 0 }
      w.wins += 1; w.net += m.d || 0
      l.losses += 1; l.net -= m.d || 0
      tally.set(m.w, w); tally.set(m.l, l)
    }
    const rows = players
      .filter((p) => tally.has(p.id))
      .map((p) => {
        const t = tally.get(p.id)
        const games = t.wins + t.losses
        return { ...p, wins: t.wins, losses: t.losses, games, winPct: Math.round((t.wins / games) * 100), score: t.net, streak: 0 }
      })
      .sort((a, b) => b.score - a.score || b.wins - a.wins || a.rank - b.rank)
      .map((p, i) => ({ ...p, place: i + 1 }))
    return { rows, count }
  }, [isAll, players, matchLog, win])

  const sorted = useMemo(() => {
    if (!sort) return rows
    const dir = sort.dir === 'asc' ? 1 : -1
    const val = (p) => (sort.key === 'name' ? p.name.toLowerCase() : sort.key === 'place' ? p.place : p[sort.key] ?? -1)
    return [...rows].sort((a, b) => {
      const va = val(a), vb = val(b)
      return va < vb ? -dir : va > vb ? dir : a.place - b.place
    })
  }, [rows, sort])

  const click = (key) => setSort((cur) => {
    const first = DESC_FIRST.has(key) ? 'desc' : 'asc'
    if (!cur || cur.key !== key) return { key, dir: first }
    if (cur.dir === first) return { key, dir: first === 'asc' ? 'desc' : 'asc' }
    return null
  })

  const choose = (id) => { setKind(id); setOffset(0); setSort(null) }

  const H = ({ k, label, cls }) => {
    const active = sort?.key === k
    return (
      <button type="button" className={`hcell${cls ? ' ' + cls : ''}${active ? ' on' : ''}`} onClick={() => click(k)}
        aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
        {label}{active && <span className="harrow">{sort.dir === 'asc' ? '▲' : '▼'}</span>}
      </button>
    )
  }

  return (
    <>
      <div className="card-head">
        <span className="card-title">Rankings</span>
        <div className="ptabs" role="tablist" aria-label="Time period">
          <div className="ptab-set">
            {PERIODS.map((p) => (
              <button key={p.id} type="button" role="tab" aria-selected={kind === p.id}
                className={`ptab${kind === p.id ? ' on' : ''}`} onClick={() => choose(p.id)}>{p.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="board-strip">
        <span className="pnav">
          {!isAll && (
            <button type="button" className="pnav-btn" aria-label="Earlier" onClick={() => setOffset((o) => o + 1)}>‹</button>
          )}
          <b>{win.label}</b>
          {!isAll && (
            <button type="button" className="pnav-btn" aria-label="Later" disabled={offset === 0} onClick={() => setOffset((o) => Math.max(0, o - 1))}>›</button>
          )}
        </span>
        <span>{count} {count === 1 ? 'match' : 'matches'}{isAll ? ` · ${players.length} players` : ''}</span>
      </div>

      <div className={`board-row hdr${isAll ? '' : ' period'}`}>
        <H k="place" label="Rank" />
        <H k="name" label="Player" />
        <H k="score" label={isAll ? 'Rating' : 'Net'} cls="r" />
        <H k="wins" label="W–L" cls="r" />
        <H k="games" label="GP" cls="r" />
        <H k="winPct" label="Win %" cls="r" />
        {isAll && <H k="streak" label="Streak" cls="r" />}
      </div>

      {sorted.length === 0 && <p className="board-empty">{EMPTY[kind]}</p>}

      {sorted.map((p) => (
        <Link className={`board-row board-link${isAll ? '' : ' period'}`} key={p.id} href={`/player/${p.id}`}>
          <span className="rank-cell">
            <span className={`rank-chip ${medal(p.place)}`}>{p.place}</span>
            {isAll && p.move !== 'same' && <span className={`mv ${p.move}`} aria-label={p.move === 'up' ? 'Moved up' : 'Moved down'}>{p.move === 'up' ? '▲' : '▼'}</span>}
          </span>
          <span className="pname">
            <span className="pn">{p.name}</span>
            <span className={`practice-tag ${p.practice.toLowerCase()}`}>{p.practice}</span>
            <Badges items={p.badges} />
          </span>
          <span className="r rating num" style={isAll ? undefined : { color: p.score > 0 ? 'var(--green)' : p.score < 0 ? 'var(--red)' : undefined }}>
            {isAll ? p.score : signed(p.score)}
          </span>
          <span className="r num"><span className="w">{p.wins}</span>–<span className="l">{p.losses}</span></span>
          <span className="r num">{p.games}</span>
          <span className="r num">{p.winPct == null ? '—' : `${p.winPct}%`}</span>
          {isAll && (
            <span className="r num" style={{ color: p.streak > 0 ? 'var(--green)' : p.streak < 0 ? 'var(--red)' : 'var(--mut2)' }}>{fmtStreak(p.streak)}</span>
          )}
        </Link>
      ))}
    </>
  )
}
