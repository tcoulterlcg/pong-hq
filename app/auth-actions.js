'use server'
// Sign-in: just pick your name — no passcode (this is a fun office ladder, not
// sensitive data). Submit rights are still checked when recording (view-only
// players sign in but can't record).
import { cookies } from 'next/headers'
import { getPlayers } from '../lib/pingpong.mjs'

export async function signIn(playerId) {
  const players = await getPlayers()
  const p = players.find((x) => x.id === playerId)
  if (!p) return { ok: false, error: 'Select your name.' }
  const ck = await cookies()
  const opts = { path: '/', maxAge: 60 * 60 * 12, sameSite: 'lax' }
  ck.set('auth', '1', { ...opts, httpOnly: true })
  ck.set('ru', p.id, opts)
  return { ok: true }
}
export async function signOut() {
  const ck = await cookies()
  ck.delete('auth'); ck.delete('ru')
  return { ok: true }
}
