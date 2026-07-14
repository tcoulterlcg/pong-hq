import Link from 'next/link'
import { cookies } from 'next/headers'
import { getMessages, getPlayers, MATCH_ADMIN } from '../../lib/pingpong.mjs'
import { PostForm, DeleteMessage } from '../../components/SmackBoard'
import LcgLogo from '../../components/LcgLogo'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Smack Talk — Office Ping Pong Stats' }

const fmtWhen = (iso) => new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' })

export default async function Smack() {
  const ck = await cookies()
  const authed = ck.get('auth')?.value === '1'
  const ruId = ck.get('ru')?.value
  const players = await getPlayers()
  const me = authed ? players.find((p) => p.id === ruId) || null : null
  const messages = await getMessages()

  return (
    <div className="wrap" style={{ maxWidth: 760 }}>
      <div className="head">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
            <LcgLogo height={30} />
            <span className="brand-chip">Ping Pong Stats</span>
          </div>
          <h1>Smack <span className="accent">Talk</span></h1>
          <div className="sub">say it to the group or @ somebody · winners talk, losers listen</div>
        </div>
        <div className="sub" style={{ display: 'flex', gap: 16 }}>
          <Link href="/">← Rankings board</Link>
          <Link href="/players">Players →</Link>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {me
          ? <PostForm players={players.filter((p) => p.id !== me.id).map((p) => ({ id: p.id, name: p.name }))} meName={me.name} />
          : <div className="card pad"><Link href="/login">Sign in →</Link> <span className="muted">to join the trash talk. Reading is free.</span></div>}

        {messages == null && (
          <div className="card pad muted" style={{ fontSize: 13 }}>
            The board is still being wired up (database table pending) — check back shortly.
          </div>
        )}
        {messages != null && <div className="card">
          <div className="card-head">
            <span className="card-title">The Board</span>
            <span className="muted" style={{ fontSize: 11 }}>{messages.length} messages</span>
          </div>
          <div className="pad" style={{ paddingTop: 6 }}>
            {messages.length === 0 && <p className="muted" style={{ fontSize: 13 }}>Dead silence. Somebody say something.</p>}
            {messages.map((m) => (
              <div className="smack-item" key={m.id}>
                <div className="smack-head">
                  <b>{m.author}</b>
                  {m.target && <span className="smack-target">→ {m.target}</span>}
                  <span className="muted" style={{ fontSize: 11 }}>{fmtWhen(m.at)}</span>
                  {me && (me.id === m.authorId || me.id === MATCH_ADMIN) && <span style={{ marginLeft: 'auto' }}><DeleteMessage id={m.id} /></span>}
                </div>
                <div className="smack-body">{m.body}</div>
              </div>
            ))}
          </div>
        </div>}
      </div>
    </div>
  )
}
