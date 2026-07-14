'use server'
// Same cookie names + passcode as the recon site: on localhost the two apps
// share cookies, so signing in on either one signs you into both.
import { cookies } from 'next/headers'
import { EDITOR_PROFILES } from '../lib/users.mjs'

export async function signIn(profileId, passcode) {
  if (!passcode || passcode !== (process.env.PONG_PASSCODE || 'lcg-recon')) return { ok: false, error: 'Incorrect passcode.' }
  const user = EDITOR_PROFILES.find((u) => u.id === profileId)
  if (!user) return { ok: false, error: 'Select your profile.' }
  const ck = await cookies()
  const opts = { path: '/', maxAge: 60 * 60 * 12, sameSite: 'lax' }
  ck.set('auth', '1', { ...opts, httpOnly: true })
  ck.set('ru', user.id, opts)
  return { ok: true }
}
export async function signOut() {
  const ck = await cookies()
  ck.delete('auth'); ck.delete('ru')
  return { ok: true }
}
