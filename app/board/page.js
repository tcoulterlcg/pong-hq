import Link from 'next/link'
import { cookies } from 'next/headers'
import { getMessages, getPlayers, MATCH_ADMIN } from '../../lib/pingpong.mjs'
import MessageBoardSection from '../../components/MessageBoardSection'
import LcgLogo from '../../components/LcgLogo'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Message Board — Office Ping Pong Stats' }

export default async function BoardPage() {
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
          <h1>Message <span className="accent">Board</span></h1>
          <div className="sub">post to the group or @ a player</div>
        </div>
        <div className="sub" style={{ display: 'flex', gap: 16 }}>
          <Link href="/">← Rankings board</Link>
          <Link href="/players">Players →</Link>
        </div>
      </div>

      <MessageBoardSection
        me={me ? { id: me.id, name: me.name } : null}
        players={players.map((p) => ({ id: p.id, name: p.name }))}
        messages={messages}
        matchAdmin={MATCH_ADMIN}
      />
    </div>
  )
}
