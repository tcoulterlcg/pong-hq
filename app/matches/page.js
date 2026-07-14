import Link from 'next/link'
import { cookies } from 'next/headers'
import { getMatches, canDeleteMatches } from '../../lib/pingpong.mjs'
import RemoveMatchButton from '../../components/RemoveMatchButton'
import LcgLogo from '../../components/LcgLogo'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'All Matches — Office Ping Pong Stats' }

const fmtWhen = (iso) => new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' })

export default async function Matches() {
  const ck = await cookies()
  const authed = ck.get('auth')?.value === '1'
  const ruId = ck.get('ru')?.value
  const canDelete = authed && !!ruId && canDeleteMatches(ruId)
  const matches = await getMatches(100000) // every match ever

  return (
    <div className="wrap" style={{ maxWidth: 760 }}>
      <div className="head">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
            <LcgLogo height={30} />
            <span className="brand-chip">Ping Pong Stats</span>
          </div>
          <h1>All <span className="accent">Matches</span></h1>
          <div className="sub">every game ever recorded · newest first · Eastern time</div>
        </div>
        <div className="sub"><Link href="/">← Rankings board</Link></div>
      </div>

      <div className="card">
        <div className="card-head">
          <span className="card-title">Match History</span>
          <span className="muted" style={{ fontSize: 11 }}>{matches.length} total</span>
        </div>
        <div className="pad" style={{ paddingTop: 6 }}>
          {matches.length === 0 && <p className="muted" style={{ fontSize: 13 }}>No matches recorded yet.</p>}
          {matches.map((m) => (
            <div className="item" key={m.id}>
              <span><b>{m.winnerName}</b> def. {m.loserName} <span className="muted" style={{ fontSize: 11 }}>· {fmtWhen(m.at)} · by {m.by}</span></span>
              <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                <span className="num" style={{ color: 'var(--green)', fontWeight: 700 }}>{m.delta == null ? '' : `+${m.delta}`}</span>
                {canDelete && <RemoveMatchButton id={m.id} label={`${m.winnerName} def. ${m.loserName}${m.delta == null ? '' : ` (+${m.delta})`}`} />}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
