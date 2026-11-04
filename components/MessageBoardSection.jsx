import Link from 'next/link'
import { PostForm, DeleteMessage } from './SmackBoard'

const fmtWhen = (iso) => new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' })

// The interactive Message Board feed. Server component — renders the client
// PostForm + the post list. Used on the home page and the standalone /board.
export default function MessageBoardSection({ me, players, messages, matchAdmin }) {
  return (
    <div className="card" id="board">
      <div className="card-head">
        <span className="card-title">Message Board</span>
        {messages?.length > 0 && <span className="head-meta">{messages.length} {messages.length === 1 ? 'post' : 'posts'}</span>}
      </div>
      <div className="pad">
        {me
          ? <PostForm players={players.filter((x) => x.id !== me.id)} meName={me.name} />
          : (
            <div className="signin-prompt">
              <span>Sign in to post to the board.</span>
              <Link href="/login" className="btn">Sign in</Link>
            </div>
          )}

        {messages == null && <p className="empty">The board isn't available right now. Try again in a minute.</p>}
        {messages != null && (
          <div style={{ marginTop: me ? 16 : 10 }}>
            {messages.length === 0 && <p className="empty">No posts yet.</p>}
            {messages.map((m) => (
              <div className="smack-item" key={m.id}>
                <div className="smack-head">
                  <b>{m.author}</b>
                  {m.target && <span className="smack-target">to {m.target}</span>}
                  <span className="muted" style={{ fontSize: 11 }}>{fmtWhen(m.at)}</span>
                  {me && (me.id === m.authorId || me.id === matchAdmin) && <span style={{ marginLeft: 'auto' }}><DeleteMessage id={m.id} /></span>}
                </div>
                <div className="smack-body">{m.body}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
