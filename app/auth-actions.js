'use server'
// Sign-in: any player on the ladder + the shared passcode. Submit rights are
// checked separately when recording (view-only players sign in but can't
// record). Same cookie names as the recon site, so on localhost signing in
// on either app covers both.
import { cookies } from 'next/headers'
import { getPlayers } from '../lib/pingpong.mjs'

export async function signIn(playerId, passcode) {
  if (!passcode || passcode !== (process.env.PONG_PASSCODE || 'lcg-recon')) return { ok: false, error: 'Incorrect passcode.' }
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
