import { cookies } from 'next/headers'
import { getMessages, getPlayers, MATCH_ADMIN } from '../../lib/pingpong.mjs'
import MessageBoardSection from '../../components/MessageBoardSection'
import PageHead from '../../components/PageHead'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Message Board' }

export default async function BoardPage() {
  const ck = await cookies()
  const authed = ck.get('auth')?.value === '1'
  const ruId = ck.get('ru')?.value
  const players = await getPlayers()
  const me = authed ? players.find((p) => p.id === ruId) || null : null
  const messages = await getMessages()

  return (
    <div className="wrap narrow">
      <PageHead title="Message" accent="Board" sub="Post to everyone or call out a player." />

      <MessageBoardSection
        me={me ? { id: me.id, name: me.name } : null}
        players={players.map((p) => ({ id: p.id, name: p.name }))}
        messages={messages}
        matchAdmin={MATCH_ADMIN}
      />
    </div>
  )
}
