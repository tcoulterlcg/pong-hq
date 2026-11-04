import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPlayerDetail, getStandings, getMatches } from '../../../lib/pingpong.mjs'
import { computeAllBadgeStats, trophyCase, earnedCount } from '../../../lib/badges.mjs'
import { rosterFor } from '../../../lib/roster.mjs'
import PageHead from '../../../components/PageHead'
import TrophyCase from '../../../components/TrophyCase'
import MatchLog from '../../../components/MatchLog'

export const dynamic = 'force-dynamic'

const fmtStreak = (s) => (s === 0 ? '—' : s > 0 ? `W${s}` : `L${-s}`)
const medal = (r) => (r === 1 ? 'gold' : r === 2 ? 'silver' : r === 3 ? 'bronze' : '')

export async function generateMetadata({ params }) {
  const { id } = await params
  const p = await getPlayerDetail(id)
  return { title: p ? rosterFor(id).fullName || p.name : 'Player' }
}

// Rating over time: a line with a soft fill, the 1500 start as a dashed guide,
// and labels for the peak and the current rating. Dots only when there are few games.
function RatingChart({ series }) {
  if (series.length < 2) return <p className="empty">No games yet. Everyone starts at 1500.</p>
  const W = 720, H = 220, padL = 44, padR = 18, padY = 22
  const ratings = series.map((s) => s.rating)
  const lo = Math.min(...ratings, 1500), hi = Math.max(...ratings, 1500)
  const span = Math.max(40, hi - lo)
  const min = lo - span * 0.08, max = hi + span * 0.12
  const X = (i) => padL + (i / (series.length - 1)) * (W - padL - padR)
  const Y = (r) => padY + (1 - (r - min) / (max - min)) * (H - padY * 2)
  const pts = series.map((s, i) => `${X(i).toFixed(1)},${Y(s.rating).toFixed(1)}`)
  const area = `M${X(0)},${H - padY} L${pts.join(' L')} L${X(series.length - 1)},${H - padY} Z`
  const peakI = ratings.indexOf(hi)
  const last = series.length - 1
  const ticks = [lo, Math.round((lo + hi) / 2), hi].filter((v, i, a) => a.indexOf(v) === i)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="rating-chart" role="img" aria-label={`Rating went from 1500 to ${ratings[last]}, peaking at ${hi}`}>
      <defs>
        <linearGradient id="rc-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgb(111,157,255)" stopOpacity="0.32" />
          <stop offset="1" stopColor="rgb(111,157,255)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={padL} x2={W - padR} y1={Y(t)} y2={Y(t)} className="rc-grid" />
          <text x={padL - 8} y={Y(t) + 4} className="rc-axis" textAnchor="end">{t}</text>
        </g>
      ))}
      <line x1={padL} x2={W - padR} y1={Y(1500)} y2={Y(1500)} className="rc-base" />
      <path d={area} fill="url(#rc-fill)" />
      <polyline points={pts.join(' ')} className="rc-line" />
      {series.length <= 30 && series.map((s, i) => <circle key={i} cx={X(i)} cy={Y(s.rating)} r="3" className="rc-dot" />)}
      {peakI !== last && hi > 1500 && (
        <g>
          <circle cx={X(peakI)} cy={Y(hi)} r="4.5" className="rc-peak" />
          <text x={X(peakI)} y={Y(hi) - 10} className="rc-label" textAnchor="middle">Peak {hi}</text>
        </g>
      )}
      <circle cx={X(last)} cy={Y(ratings[last])} r="5" className="rc-now" />
    </svg>
  )
}

export default async function PlayerPage({ params }) {
  const { id } = await params
  const p = await getPlayerDetail(id)
  if (!p) notFound()
  const meta = rosterFor(id)
  const [standings, matches] = await Promise.all([getStandings(), getMatches(100000)])
  const stats = computeAllBadgeStats(standings, matches).get(id)
  const peak = Math.max(...p.series.map((s) => s.rating))

  return (
    <div className="wrap narrow">
      <PageHead
        title={
          <span className="player-heading">
            <span className={`rank-chip big ${p.games > 0 ? medal(p.rank) : ''}`}>{p.rank}</span>
            {meta.fullName || p.name}
            <span className={`practice-tag ${p.practice.toLowerCase()}`}>{p.practice}</span>
          </span>
        }
        sub={`${meta.title || 'LCG Advisors'} · Rank ${p.rank} of ${p.total}`}
      >
        <Link href="/players" className="btn ghost">All players</Link>
      </PageHead>

      <div className="stat-tiles four">
        <div className="stat-tile"><div className="lbl">Rating</div><div className="val">{p.rating}</div><div className="sub">{p.games ? `Peak ${peak}` : 'Starting rating'}</div></div>
        <div className="stat-tile"><div className="lbl">Record</div><div className="val num"><span className="w">{p.wins}</span>–<span className="l">{p.losses}</span></div><div className="sub">{p.winPct == null ? 'No games yet' : `${p.winPct}% wins`}</div></div>
        <div className="stat-tile"><div className="lbl">Streak</div><div className="val" style={{ color: p.streak > 0 ? 'var(--green)' : p.streak < 0 ? 'var(--red)' : undefined }}>{fmtStreak(p.streak)}</div><div className="sub">{p.streak > 0 ? 'Wins in a row' : p.streak < 0 ? 'Losses in a row' : 'No active streak'}</div></div>
        <div className="stat-tile"><div className="lbl">Games</div><div className="val">{p.games}</div><div className="sub">All time</div></div>
      </div>

      <div className="card section">
        <div className="card-head"><span className="card-title">Rating History</span></div>
        <div className="pad"><RatingChart series={p.series} /></div>
      </div>

      <div className="section">
        <TrophyCase groups={trophyCase(stats)} earned={earnedCount(stats)} />
      </div>

      <div className="grid even">
        <div className="card">
          <div className="card-head"><span className="card-title">Head to Head</span></div>
          <div className="pad tight">
            {p.h2h.length === 0 && <p className="empty">No opponents yet.</p>}
            {p.h2h.map((h) => (
              <div className="item" key={h.oppId}>
                <Link href={`/player/${h.oppId}`} className="opp">{h.oppName}</Link>
                <span className="num"><span className="w">{h.w}</span>–<span className="l">{h.l}</span></span>
              </div>
            ))}
          </div>
        </div>
        <MatchLog history={p.history} />
      </div>
    </div>
  )
}
