'use client'
// Bottom tab bar for phones (hidden on wider screens by theme.css).
// The centre button jumps to the Record Match card when you're signed in,
// and to player sign-in when you're not.
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const Icon = ({ d }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
)

const ICONS = {
  ladder: 'M4 20V11M10 20V5M16 20v-6M20 20H3',
  matches: 'M12 4a8 8 0 1 0 0 16a8 8 0 1 0 0-16M12 8v4l3 2',
  board: 'M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z',
  players: 'M9 4.5a3.5 3.5 0 1 0 0 7a3.5 3.5 0 1 0 0-7M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4-6',
}

export default function MobileNav() {
  const path = usePathname() || '/'
  const router = useRouter()
  if (path.startsWith('/login')) return null

  const on = (href) => (href === '/' ? path === '/' : path.startsWith(href)) ? 'on' : undefined

  const record = () => {
    const el = document.getElementById('record')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    if (path === '/') router.push('/login') // no Record card means you're not signed in
    else router.push('/#record')
  }

  return (
    <nav className="mnav" aria-label="Sections">
      <Link href="/" className={on('/')} aria-current={on('/') ? 'page' : undefined}><Icon d={ICONS.ladder} />Ladder</Link>
      <Link href="/matches" className={on('/matches')} aria-current={on('/matches') ? 'page' : undefined}><Icon d={ICONS.matches} />Matches</Link>
      <button type="button" className="fab" aria-label="Record a match" onClick={record}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
      </button>
      <Link href="/board" className={on('/board')} aria-current={on('/board') ? 'page' : undefined}><Icon d={ICONS.board} />Board</Link>
      <Link href="/players" className={on('/player')} aria-current={on('/player') ? 'page' : undefined}><Icon d={ICONS.players} />Players</Link>
    </nav>
  )
}
