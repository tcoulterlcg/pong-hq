import fs from 'node:fs'
import path from 'node:path'
import Link from 'next/link'
import { getStandings } from '../../lib/pingpong.mjs'
import { rosterFor } from '../../lib/roster.mjs'
import { getMatches } from '../../lib/pingpong.mjs'
import { computeAllBadgeStats, topBadges } from '../../lib/badges.mjs'
import PageHead from '../../components/PageHead'
import Badges from '../../components/Badges'

export const dynamic = 'force-dynamic' // stat strips ride the live ledger

export const metadata = { title: 'Players' }

const medal = (r) => (r === 1 ? 'gold' : r === 2 ? 'silver' : r === 3 ? 'bronze' : '')

export default async function Players() {
  const [standings, matches] = await Promise.all([getStandings(), getMatches(100000)])
  const badgeStats = computeAllBadgeStats(standings, matches)
  const pub = path.join(process.cwd(), 'public', 'players')
  const cards = standings.map((p) => {
    // real photos (png) win over the generated cartoon portraits (svg)
    const img = ['png', 'jpg', 'svg'].map((ext) => `${p.id}.${ext}`).find((f) => fs.existsSync(path.join(pub, f)))
    const meta = rosterFor(p.id)
    return { ...p, fullName: meta.fullName || p.name, title: meta.title, img: img ? `/players/${img}` : null, badges: topBadges(badgeStats.get(p.id), 6) }
  })

  return (
    <div className="wrap">
      <PageHead title="The" accent="Players" sub="In ladder order. Tap a player for their stats." />

      <div className="players-grid">
        {cards.map((p) => (
          <Link className="player-card" key={p.id} href={`/player/${p.id}`}>
            <div className="player-photo">
              {p.img
                ? <img src={p.img} alt={`${p.fullName} — ping pong portrait`} />
                : <span className="player-photo-fallback">🏓</span>}
              <span className={`practice-tag ${p.practice.toLowerCase()} player-practice`}>{p.practice}</span>
            </div>
            <div className="player-meta">
              <div className="player-name">{p.fullName}</div>
              <div className="player-title">{p.title || 'LCG Advisors'}</div>
            </div>
            <div className="player-stats num">
              <span className={`rank-chip ${medal(p.rank)}`}>{p.rank}</span>
              <span className="rating" style={{ fontSize: 15 }}>{p.rating}</span>
              <span style={{ marginLeft: 'auto' }}><span className="w">{p.wins}</span>–<span className="l">{p.losses}</span></span>
            </div>
            {p.badges.length > 0 && <div className="player-badges"><Badges items={p.badges} /></div>}
          </Link>
        ))}
      </div>
    </div>
  )
}
