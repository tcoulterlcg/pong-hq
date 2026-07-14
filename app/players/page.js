import fs from 'node:fs'
import path from 'node:path'
import Link from 'next/link'
import { getStandings } from '../../lib/pingpong.mjs'
import { rosterFor } from '../../lib/roster.mjs'
import LcgLogo from '../../components/LcgLogo'

export const dynamic = 'force-dynamic' // stat strips ride the live ledger

export const metadata = { title: 'Players — Office Ping Pong Stats' }

const medal = (r) => (r === 1 ? 'gold' : r === 2 ? 'silver' : r === 3 ? 'bronze' : '')

export default async function Players() {
  const standings = await getStandings()
  const pub = path.join(process.cwd(), 'public', 'players')
  const cards = standings.map((p) => {
    // real photos (png) win over the generated cartoon portraits (svg)
    const img = ['png', 'svg'].map((ext) => `${p.id}.${ext}`).find((f) => fs.existsSync(path.join(pub, f)))
    const meta = rosterFor(p.id)
    return { ...p, fullName: meta.fullName || p.name, title: meta.title, img: img ? `/players/${img}` : null }
  })

  return (
    <div className="wrap">
      <div className="head">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
            <LcgLogo height={30} />
            <span className="brand-chip">Ping Pong Stats</span>
          </div>
          <h1>The <span className="accent">Players</span></h1>
          <div className="sub">LCG Advisors office roster · card order follows the live rankings</div>
        </div>
        <div className="sub" style={{ display: 'flex', gap: 16 }}>
          <Link href="/">← Rankings board</Link>
          <Link href="/board">Message Board →</Link>
        </div>
      </div>

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
              <span style={{ marginLeft: 'auto' }}><span style={{ color: 'var(--green)' }}>{p.wins}</span>–<span style={{ color: 'var(--red)' }}>{p.losses}</span></span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
