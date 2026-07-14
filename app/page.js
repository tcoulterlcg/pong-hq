import Link from 'next/link'
import { cookies } from 'next/headers'
import { getStandings, getMatches, canDeleteMatches } from '../lib/pingpong.mjs'
import RecordPanel from '../components/RecordPanel'
import LcgLogo from '../components/LcgLogo'

export const dynamic = 'force-dynamic' // always reflect the shared ledger

const medal = (r) => (r === 1 ? 'gold' : r === 2 ? 'silver' : r === 3 ? 'bronze' : '')
const medalEmoji = (r) => (r === 1 ? '🥇' : r === 2 ? '🥈' : r === 3 ? '🥉' : '')
const fmtStreak = (s) => (s === 0 ? '—' : s > 0 ? `W${s}` : `L${-s}`)
const fmtWhen = (iso) => new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

export default async function Board() {
  const ck = await cookies()
  const authed = ck.get('auth')?.value === '1'
  const ruId = ck.get('ru')?.value
  const standings = await getStandings()
  const matches = await getMatches(12)
  const me = standings.find((p) => p.id === ruId) || null
  const canRecord = authed && !!me?.can_submit
  const canDelete = authed && !!me && canDeleteMatches(me.id)

  // Panels — all derived from the ledger
  const biggestUpset = [...matches].sort((a, b) => (b.delta || 0) - (a.delta || 0))[0] || null
  const longestStreak = [...standings].sort((a, b) => Math.abs(b.streak) - Math.abs(a.streak))[0]
  const mostGames = [...standings].sort((a, b) => b.games - a.games)[0]

  const Track = () => (
    <div className="tick-track">
      <span className="tick-tag">🏓 OFFICE PING PONG · TOP {standings.length}</span>
      {standings.map((p) => (
        <span className="tick-item" key={p.rank}>
          <span className={`tick-rank ${medal(p.rank)}`}>{p.rank}</span>
          <b>{p.name}</b>
          <span className="num" style={{ color: 'var(--mut)' }}>{p.rating}</span>
          {p.move !== 'same' && <span className={`tick-move ${p.move}`}>{p.move === 'up' ? '▲' : '▼'}</span>}
        </span>
      ))}
    </div>
  )

  return (
    <>
      <div className="ticker"><div className="ticker-viewport"><Track /><Track /></div></div>
      <div className="wrap">
        <div className="head">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
              <LcgLogo height={30} />
              <span className="brand-chip">Ping Pong Stats</span>
            </div>
            <h1>Office <span className="accent">Rankings</span></h1>
            <div className="sub">LCG Advisors · Elo K=32, everyone starts 1500 · live from the match ledger (shared with Reconciliation HQ)</div>
          </div>
          <div className="sub" style={{ display: 'flex', gap: 16 }}>
            <Link href="/players">Players →</Link>
            {authed && me
              ? <span>Signed in: <b style={{ color: 'var(--text2)' }}>{me.name}</b>{!me.can_submit && ' (view-only)'}</span>
              : <Link href="/login">Player sign-in →</Link>}
          </div>
        </div>

        <div className="stat-tiles">
          <div className="stat-tile">
            <div className="lbl">Biggest Rating Swing</div>
            <div className="val">{biggestUpset ? `${biggestUpset.winnerName} def. ${biggestUpset.loserName}` : '—'}</div>
            <div className="sub">{biggestUpset ? `+${biggestUpset.delta} rating · ${fmtWhen(biggestUpset.at)}` : 'no matches recorded'}</div>
          </div>
          <div className="stat-tile">
            <div className="lbl">Longest Active Streak</div>
            <div className="val" style={{ color: longestStreak?.streak > 0 ? 'var(--green)' : longestStreak?.streak < 0 ? 'var(--red)' : undefined }}>
              {longestStreak && longestStreak.streak !== 0 ? `${longestStreak.name} · ${fmtStreak(longestStreak.streak)}` : '—'}
            </div>
            <div className="sub">wins or losses in a row</div>
          </div>
          <div className="stat-tile">
            <div className="lbl">Most Games Played</div>
            <div className="val">{mostGames && mostGames.games > 0 ? `${mostGames.name} · ${mostGames.games}` : '—'}</div>
            <div className="sub">lifetime matches on the ledger</div>
          </div>
        </div>

        <div className="grid">
          <div className="card">
            <div className="card-head">
              <span className="card-title">Top 15 Rankings</span>
              <span className="muted" style={{ fontSize: 11 }}>{standings.reduce((s, p) => s + p.wins, 0)} matches played</span>
            </div>
            <div className="board-row hdr">
              <span>Rank</span><span>Player</span><span className="r">Rating</span>
              <span className="r">W–L</span><span className="r">Win %</span><span className="r">Streak</span><span className="r">Move</span>
            </div>
            {standings.map((p) => (
              <div className="board-row" key={p.id}>
                <span><span className={`rank-chip ${medal(p.rank)}`}>{p.rank}</span></span>
                <span className="pname">{medalEmoji(p.rank)} {p.name}</span>
                <span className="r rating num">{p.rating}</span>
                <span className="r num"><span style={{ color: 'var(--green)' }}>{p.wins}</span>–<span style={{ color: 'var(--red)' }}>{p.losses}</span></span>
                <span className="r num">{p.winPct == null ? '—' : `${p.winPct}%`}</span>
                <span className="r num" style={{ color: p.streak > 0 ? 'var(--green)' : p.streak < 0 ? 'var(--red)' : 'var(--mut2)' }}>{fmtStreak(p.streak)}</span>
                <span className={`r mv ${p.move}`}>{p.move === 'same' ? '—' : p.move === 'up' ? '▲' : '▼'}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {canRecord && (
              <div className="card">
                <div className="card-head"><span className="card-title">Record Match</span><span className="muted" style={{ fontSize: 11 }}>signed-in players</span></div>
                <div className="pad">
                  <RecordPanel players={standings.map((p) => ({ id: p.id, name: p.name }))} byName={me.name} canUndo={canDelete && matches.length > 0} lastId={matches[0]?.id || null} />
                </div>
              </div>
            )}
            <div className="card">
              <div className="card-head"><span className="card-title">Recent Matches</span><span className="muted" style={{ fontSize: 11 }}>{matches.length} shown</span></div>
              <div className="pad" style={{ paddingTop: 6 }}>
                {matches.length === 0 && <p className="muted" style={{ fontSize: 13 }}>No matches yet — the ladder sits at its seeded order.</p>}
                {matches.map((m) => (
                  <div className="item" key={m.id}>
                    <span><b>{m.winnerName}</b> def. {m.loserName} <span className="muted" style={{ fontSize: 11 }}>· {fmtWhen(m.at)} · by {m.by}</span></span>
                    <span className="num" style={{ color: 'var(--green)', fontWeight: 700 }}>{m.delta == null ? '' : `+${m.delta}`}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  )
}
