'use client'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { removeMatch } from '../app/pong-actions'

// Trevor-only: remove a match from the ledger. Prompts for confirmation
// first, then recomputes the whole ladder from the remaining matches.
export default function RemoveMatchButton({ id, label }) {
  const [pending, start] = useTransition()
  const router = useRouter()
  const click = () => {
    if (!confirm(`Remove this match?\n\n${label}\n\nRatings will recompute from the remaining games.`)) return
    start(async () => {
      const res = await removeMatch(id)
      if (!res.ok) { alert(res.error); return }
      router.refresh()
    })
  }
  return (
    <button
      className="btn remove-x" disabled={pending} title="Remove match"
      style={{ padding: '2px 9px', fontSize: 12, lineHeight: '18px' }}
      onClick={click}
    >{pending ? '…' : '✕'}</button>
  )
}
