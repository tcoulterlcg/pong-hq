import { cookies } from 'next/headers'
import { getMatches, canDeleteMatches } from '../../lib/pingpong.mjs'
import RemoveMatchButton from '../../components/RemoveMatchButton'
import PageHead from '../../components/PageHead'
import { dayKey } from '../../lib/period.mjs'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'All Matches' }

const fmtTime = (iso) => new Date(iso).toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' })
const fmtDay = (iso) => new Date(iso).toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'America/New_York' })

export default async function Matches() {
  const ck = await cookies()
  const authed = ck.get('auth')?.value === '1'
  const ruId = ck.get('ru')?.value
  const canDelete = authed && !!ruId && canDeleteMatches(ruId)
  const matches = await getMatches(100000) // every match ever
  const days = []
  for (const m of matches) {
    const k = dayKey(m.at)
    if (days[days.length - 1]?.key !== k) days.push({ key: k, label: fmtDay(m.at), matches: [] })
    days[days.length - 1].matches.push(m)
  }

  return (
    <div className="wrap narrow">
      <PageHead title="All" accent="Matches" sub={`${matches.length} ${matches.length === 1 ? 'match' : 'matches'} · Newest first · Eastern time`} />

      {matches.length === 0 && <div className="card"><div className="pad"><p className="empty">No matches yet.</p></div></div>}
      {days.map((d) => (
        <div className="card section" key={d.key}>
          <div className="card-head">
            <span className="card-title">{d.label}</span>
            <span className="head-meta">{d.matches.length} {d.matches.length === 1 ? 'match' : 'matches'}</span>
          </div>
          <div className="pad tight">
            {d.matches.map((m) => (
              <div className="item" key={m.id}>
                <span className="item-main">
                  <span><b>{m.winnerName}</b> def. {m.loserName}</span>
                  <span className="muted when">{fmtTime(m.at)}</span>
                </span>
                <span className="item-end">
                  <span className="num delta">{m.delta == null ? '' : `+${m.delta}`}</span>
                  {canDelete && <RemoveMatchButton id={m.id} label={`${m.winnerName} def. ${m.loserName}${m.delta == null ? '' : ` (+${m.delta})`}`} />}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
