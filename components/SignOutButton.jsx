'use client'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from '../app/auth-actions'

export default function SignOutButton() {
  const [pending, start] = useTransition()
  const router = useRouter()
  return (
    <button type="button" className="btn ghost" disabled={pending}
      onClick={() => start(async () => { await signOut(); router.refresh() })}>
      {pending ? 'Signing out…' : 'Sign out'}
    </button>
  )
}
