import Link from 'next/link'
import { cookies } from 'next/headers'
import { getStandings, getMatches, getMessages, canDeleteMatches, MATCH_ADMIN, PRACTICE_ORDER, READ_ONLY } from '../lib/pingpong.mjs'
import { computeAllBadgeStats, topBadges } from '../lib/badges.mjs'
import RecordPanel from '../components/RecordPanel'
import RemoveMatchButton from '../components/RemoveMatchButton'
import MessageBoardSection from '../components/MessageBoardSection'
import RankingsBoard from '../components/RankingsBoard'
import SignOutButton from '../components/SignOutButton'
import PageHead from '../components/PageHead'

export const dynamic = 'force-dynamic' // always reflect the shared ledger

const medal = (r) => (r === 1 ? 'gold' : r === 2 ? 'silver' : r === 3 ? 'bronze' : '')
const fmtStreak = (s) => (s > 0 ? `W${s}` : `L${-s}`)
const fmtWhen = (iso) => new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' })

export default async function Home() {
  const ck = await cookies()
  const authed = ck.get('auth')?.value === '1'
  const ruId = ck.get('ru')?.value
  const standings = await getStandings()
  const allMatches = await getMatches(100000) // whole ledger: powers the period views and trophies
  const recent = allMatches.slice(0, 10)
  const badgeStats = computeAllBadgeStats(standings, allMatches)
  const me = standings.find((p) => p.id === ruId) || null
  const canRecord = authed && !!me?.can_submit && !READ_ONLY
  const canDelete = authed && !!me && canDeleteMatches(me.id)
  const messages = await getMessages()
  const boardMe = authed && me ? { id: me.id, name: me.name } : null

  const practiceStats = [...new Set(standings.map((p) => p.practice))]
    .sort((a, b) => (PRACTICE_ORDER.indexOf(a) + 1 || 99) - (PRACTICE_ORDER.indexOf(b) + 1 || 99))
    .map((grp) => {
      const ps = standings.filter((p) => p.practice === grp)
      return {
        grp, n: ps.length,
        wins: ps.reduce((s, p) => s + p.wins, 0),
        losses: ps.reduce((s, p) => s + p.losses, 0),
        avg: Math.round(ps.reduce((s, p) => s + p.rating, 0) / ps.length),
      }
    })

  // Headline numbers, all replayed from the ledger
  const biggestSwing = [...allMatches].sort((a, b) => (b.delta || 0) - (a.delta || 0))[0] || null
  const longestStreak = [...standings].sort((a, b) => Math.abs(b.streak) - Math.abs(a.streak))[0]
  const mostGames = [...standings].sort((a, b) => b.games - a.games)[0]
  const hasStreak = longestStreak && longestStreak.streak !== 0
  const hasGames = mostGames && mostGames.games > 0

  const Track = () => (
    <div className="tick-track">
      <span className="tick-tag">🏓 LCG Ping Pong</span>
      {standings.map((p) => (
        <span className="tick-item" key={p.id}>
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
        <PageHead title="Office" accent="Rankings" sub="LCG Advisors · Elo ratings, everyone starts at 1500">
          {authed && me ? (
            <>
              <span className="signed-in">Signed in as <b>{me.name}</b>{!me.can_submit && ' (view only)'}</span>
              <SignOutButton />
            </>
          ) : (
            <Link href="/login" className="btn">Sign in</Link>
          )}
        </PageHead>

        <div className="stat-tiles">
          <div className="stat-tile">
            <div className="lbl">Biggest Rating Swing</div>
            <div className="val">{biggestSwing ? `${biggestSwing.winnerName} def. ${biggestSwing.loserName}` : '—'}</div>
            <div className="sub">{biggestSwing ? `+${biggestSwing.delta} · ${fmtWhen(biggestSwing.at)}` : 'No matches yet'}</div>
          </div>
          <div className="stat-tile">
            <div className="lbl">Longest Active Streak</div>
            <div className="val" style={{ color: !hasStreak ? undefined : longestStreak.streak > 0 ? 'var(--green)' : 'var(--red)' }}>
              {hasStreak ? `${longestStreak.name} · ${fmtStreak(longestStreak.streak)}` : '—'}
            </div>
            <div className="sub">{hasStreak ? (longestStreak.streak > 0 ? 'Wins in a row' : 'Losses in a row') : 'No matches yet'}</div>
          </div>
          <div className="stat-tile">
            <div className="lbl">Most Games Played</div>
            <div className="val">{hasGames ? `${mostGames.name} · ${mostGames.games}` : '—'}</div>
            <div className="sub">{hasGames ? 'All-time games' : 'No matches yet'}</div>
          </div>
        </div>

        <div className="grid">
          <div className="card">
            <RankingsBoard
              players={standings.map((p) => ({
                id: p.id, name: p.name, rank: p.rank, rating: p.rating, wins: p.wins, losses: p.losses,
                winPct: p.winPct, streak: p.streak, move: p.move, games: p.games, practice: p.practice,
                badges: topBadges(badgeStats.get(p.id), 3),
              }))}
              matchLog={allMatches.map((m) => ({ w: m.winnerId, l: m.loserId, at: m.at, d: m.delta }))}
            />
          </div>

          <div className="side">
            {canRecord && (
              <div className="card">
                <div className="card-head"><span className="card-title">Record a Match</span></div>
                <div className="pad">
                  <RecordPanel players={standings.map((p) => ({ id: p.id, name: p.name, rating: p.rating }))} byName={me.name} canUndo={canDelete && recent.length > 0} lastId={recent[0]?.id || null} />
                </div>
              </div>
            )}
            <div className="card">
              <div className="card-head"><span className="card-title">Practice Breakdown</span></div>
              <div className="pad tight">
                {practiceStats.map((g) => (
                  <div className="item" key={g.grp}>
                    <span className="item-main">
                      <span className={`practice-tag ${g.grp.toLowerCase()}`}>{g.grp}</span>
                      <span className="muted">{g.n} {g.n === 1 ? 'player' : 'players'}</span>
                    </span>
                    <span className="num">
                      <span className="w">{g.wins}</span>–<span className="l">{g.losses}</span>
                      <span className="muted"> · Avg </span><b>{g.avg}</b>
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <div className="card-head">
                <span className="card-title">Recent Matches</span>
                {allMatches.length > 0 && <Link href="/matches" className="head-link">View all</Link>}
              </div>
              <div className="pad tight">
                {recent.length === 0 && <p className="empty">No matches yet. Record the first one to start the ladder.</p>}
                {recent.map((m) => (
                  <div className="item" key={m.id}>
                    <span className="item-main">
                      <span><b>{m.winnerName}</b> def. {m.loserName}</span>
                      <span className="muted when">{fmtWhen(m.at)}</span>
                    </span>
                    <span className="item-end">
                      <span className="num delta">{m.delta == null ? '' : `+${m.delta}`}</span>
                      {canDelete && <RemoveMatchButton id={m.id} label={`${m.winnerName} def. ${m.loserName}${m.delta == null ? '' : ` (+${m.delta})`}`} />}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 22 }}>
          <MessageBoardSection me={boardMe} players={standings.map((p) => ({ id: p.id, name: p.name }))} messages={messages} matchAdmin={MATCH_ADMIN} />
        </div>
      </div>
    </>
  )
}
