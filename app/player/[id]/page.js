import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPlayerDetail } from '../../../lib/pingpong.mjs'
import LcgLogo from '../../../components/LcgLogo'
import { rosterFor } from '../../../lib/roster.mjs'

export const dynamic = 'force-dynamic'

const fmtWhen = (iso) => new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' })
const fmtStreak = (s) => (s === 0 ? '—' : s > 0 ? `W${s}` : `L${-s}`)
const medal = (r) => (r === 1 ? 'gold' : r === 2 ? 'silver' : r === 3 ? 'bronze' : '')

export async function generateMetadata({ params }) {
  const { id } = await params
  const p = await getPlayerDetail(id)
  return { title: p ? `${p.name} — Ping Pong Stats` : 'Player — Ping Pong Stats' }
}

// Build an SVG polyline of the rating series.
function RatingChart({ series }) {
  if (series.length < 2) return <p className="muted" style={{ fontSize: 13, margin: 0 }}>No rated games yet — sitting at the 1500 start.</p>
  const W = 640, H = 180, padX = 34, padY = 20
  const ratings = series.map((s) => s.rating)
  const min = Math.min(...ratings, 1500) - 12
  const max = Math.max(...ratings, 1500) + 12
  const X = (i) => padX + (i / (series.length - 1)) * (W - padX * 2)
  const Y = (r) => padY + (1 - (r - min) / (max - min)) * (H - padY * 2)
  const pts = series.map((s, i) => `${X(i).toFixed(1)},${Y(s.rating).toFixed(1)}`).join(' ')
  const baseY = Y(1500)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      <line x1={padX} y1={baseY} x2={W - padX} y2={baseY} stroke="var(--line)" strokeDasharray="4 4" />
      <text x={padX} y={baseY - 5} fill="var(--mut2)" fontSize="11">1500</text>
      <polyline points={pts} fill="none" stroke="var(--accent-hi, #6ea3d8)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {series.map((s, i) => <circle key={i} cx={X(i)} cy={Y(s.rating)} r="3.5" fill="var(--card)" stroke="var(--accent-hi, #6ea3d8)" strokeWidth="2" />)}
    </svg>
  )
}

export default async function PlayerPage({ params }) {
  const { id } = await params
  const p = await getPlayerDetail(id)
  if (!p) notFound()
  const meta = rosterFor(id)

  return (
    <div className="wrap" style={{ maxWidth: 940 }}>
      <div className="head">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
            <LcgLogo height={30} />
            <span className="brand-chip">Ping Pong Stats</span>
          </div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span className={`rank-chip ${medal(p.rank)}`} style={{ minWidth: 40, height: 40, fontSize: 18 }}>{p.rank}</span>
            {meta.fullName || p.name}
            <span className={`practice-tag ${p.practice.toLowerCase()}`}>{p.practice}</span>
          </h1>
          <div className="sub">{meta.title || 'LCG Advisors'} · Rank {p.rank} of {p.total}</div>
        </div>
        <div className="sub"><Link href="/">← Rankings board</Link></div>
      </div>

      <div className="stat-tiles">
        <div className="stat-tile"><div className="lbl">Rating</div><div className="val rating" style={{ fontSize: 22 }}>{p.rating}</div></div>
        <div className="stat-tile"><div className="lbl">Record</div><div className="val"><span style={{ color: 'var(--green)' }}>{p.wins}</span>–<span style={{ color: 'var(--red)' }}>{p.losses}</span> <span className="muted" style={{ fontSize: 12 }}>{p.winPct == null ? '' : `· ${p.winPct}%`}</span></div></div>
        <div className="stat-tile"><div className="lbl">Streak · Games</div><div className="val" style={{ color: p.streak > 0 ? 'var(--green)' : p.streak < 0 ? 'var(--red)' : undefined }}>{fmtStreak(p.streak)} <span className="muted" style={{ fontSize: 12 }}>· {p.games} GP</span></div></div>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <div className="card-head"><span className="card-title">Rating History</span></div>
        <div className="pad"><RatingChart series={p.series} /></div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="card">
          <div className="card-head"><span className="card-title">Head to Head</span></div>
          <div className="pad" style={{ paddingTop: 8 }}>
            {p.h2h.length === 0 && <p className="muted" style={{ fontSize: 13 }}>No opponents faced yet.</p>}
            {p.h2h.map((h) => (
              <div className="item" key={h.oppId}>
                <Link href={`/player/${h.oppId}`} className="pname" style={{ color: 'var(--text2)' }}>{h.oppName}</Link>
                <span className="num" style={{ fontWeight: 700 }}>
                  <span style={{ color: 'var(--green)' }}>{h.w}</span>–<span style={{ color: 'var(--red)' }}>{h.l}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-head"><span className="card-title">Match Log</span><span className="muted" style={{ fontSize: 11 }}>{p.history.length} games</span></div>
          <div className="pad" style={{ paddingTop: 8 }}>
            {p.history.length === 0 && <p className="muted" style={{ fontSize: 13 }}>No games played yet.</p>}
            {p.history.map((m, i) => (
              <div className="item" key={i}>
                <span>
                  <span className="mlog-res" style={{ background: m.won ? 'var(--green)' : 'var(--red)' }}>{m.won ? 'W' : 'L'}</span>
                  {' '}vs <Link href={`/player/${m.oppId}`} style={{ color: 'var(--text2)', fontWeight: 600 }}>{m.oppName}</Link>
                  <span className="muted" style={{ fontSize: 11 }}> · {fmtWhen(m.at)}</span>
                </span>
                <span className="num" style={{ color: m.won ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>{m.won ? `+${m.delta}` : m.delta}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
