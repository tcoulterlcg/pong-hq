'use client'
// Top 15 board with sortable headers. Sorting only reorders the ROWS — the
// rank chip always shows each player's real ladder position, so the standings
// never change. Third click on a header clears the sort (back to ladder order).
// Each row stays a link to that player's history page.
import { useMemo, useState } from 'react'
import Link from 'next/link'

const medal = (r) => (r === 1 ? 'gold' : r === 2 ? 'silver' : r === 3 ? 'bronze' : '')
const medalEmoji = (r) => (r === 1 ? '🥇' : r === 2 ? '🥈' : r === 3 ? '🥉' : '')
const fmtStreak = (s) => (s === 0 ? '—' : s > 0 ? `W${s}` : `L${-s}`)
const NUMERIC = new Set(['rating', 'wins', 'games', 'winPct', 'streak'])

export default function RankingsBoard({ rows }) {
  const [sort, setSort] = useState(null) // {key, dir} — null = ladder order

  const sorted = useMemo(() => {
    if (!sort) return rows
    const dir = sort.dir === 'asc' ? 1 : -1
    const val = (p) => {
      switch (sort.key) {
        case 'rank': return p.rank
        case 'name': return p.name.toLowerCase()
        case 'rating': return p.rating
        case 'wins': return p.wins
        case 'games': return p.games
        case 'winPct': return p.winPct ?? -1
        case 'streak': return p.streak
        default: return 0
      }
    }
    return [...rows].sort((a, b) => {
      const va = val(a), vb = val(b)
      if (va < vb) return -1 * dir
      if (va > vb) return 1 * dir
      return a.rank - b.rank // stable fallback: ladder order
    })
  }, [rows, sort])

  const click = (key) => setSort((cur) => {
    const first = NUMERIC.has(key) ? 'desc' : 'asc' // leaderboards read best-first
    if (!cur || cur.key !== key) return { key, dir: first }
    if (cur.dir === first) return { key, dir: first === 'asc' ? 'desc' : 'asc' }
    return null // third click clears
  })

  const H = ({ k, label, cls }) => {
    const active = sort?.key === k
    const arrow = active ? (sort.dir === 'asc' ? ' ▲' : ' ▼') : ''
    return (
      <span className={cls} onClick={() => click(k)} style={{ cursor: 'pointer', userSelect: 'none' }}
        title="Sort the view — the rankings themselves don't change; click a third time to restore ladder order">
        {label}<span style={{ color: 'var(--accent-hi, #6ea3d8)' }}>{arrow}</span>
      </span>
    )
  }

  return (
    <>
      <div className="board-row hdr">
        <H k="rank" label="Rank" />
        <H k="name" label="Player" />
        <H k="rating" label="Rating" cls="r" />
        <H k="wins" label="W–L" cls="r" />
        <H k="games" label="GP" cls="r" />
        <H k="winPct" label="Win %" cls="r" />
        <H k="streak" label="Streak" cls="r" />
        <span className="r">Move</span>
      </div>
      {sorted.map((p) => (
        <Link className="board-row board-link" key={p.id} href={`/player/${p.id}`}>
          <span><span className={`rank-chip ${medal(p.rank)}`}>{p.rank}</span></span>
          <span className="pname">{medalEmoji(p.rank)} {p.name} <span className={`practice-tag ${p.practice.toLowerCase()}`}>{p.practice}</span></span>
          <span className="r rating num">{p.rating}</span>
          <span className="r num"><span style={{ color: 'var(--green)' }}>{p.wins}</span>–<span style={{ color: 'var(--red)' }}>{p.losses}</span></span>
          <span className="r num">{p.games}</span>
          <span className="r num">{p.winPct == null ? '—' : `${p.winPct}%`}</span>
          <span className="r num" style={{ color: p.streak > 0 ? 'var(--green)' : p.streak < 0 ? 'var(--red)' : 'var(--mut2)' }}>{fmtStreak(p.streak)}</span>
          <span className={`r mv ${p.move}`}>{p.move === 'same' ? '—' : p.move === 'up' ? '▲' : '▼'}</span>
        </Link>
      ))}
    </>
  )
}
