'use server'
// Sign-in: any player on the ladder with submit rights (everyone except the
// view-only players) + the shared passcode. Same cookie names as the recon
// site, so on localhost signing in on either app covers both.
import { cookies } from 'next/headers'
import { getPlayers } from '../lib/pingpong.mjs'

export async function signIn(playerId, passcode) {
  if (!passcode || passcode !== (process.env.PONG_PASSCODE || 'lcg-recon')) return { ok: false, error: 'Incorrect passcode.' }
  const players = await getPlayers()
  const p = players.find((x) => x.id === playerId)
  if (!p) return { ok: false, error: 'Select your name.' }
  if (!p.can_submit) return { ok: false, error: 'This player is view-only.' }
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
