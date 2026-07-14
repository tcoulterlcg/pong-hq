'use server'
// Ladder mutations against the shared cloud ledger. Any signed-in player with
// submit rights can record a match (everyone except the view-only players);
// deleting matches from the log is Trevor only.
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import * as PP from '../lib/pingpong.mjs'

async function actor() {
  const ck = await cookies()
  if (ck.get('auth')?.value !== '1') return null
  const id = ck.get('ru')?.value
  const players = await PP.getPlayers()
  return players.find((x) => x.id === id) || null
}

export async function recordMatch(winnerId, loserId) {
  const p = await actor()
  if (!p || !p.can_submit) return { ok: false, error: 'Sign in with your player profile to record games.' }
  const res = await PP.recordMatch(winnerId, loserId, p.name)
  if (res.ok) revalidatePath('/')
  return res
}

export async function removeMatch(id) {
  const p = await actor()
  if (!p || !PP.canDeleteMatches(p.id)) return { ok: false, error: 'Only Trevor can remove matches.' }
  const res = await PP.removeMatch(id)
  if (res.ok) revalidatePath('/')
  return res
}

// Smack talk: any signed-in player may post (view-only players included);
// delete = your own posts, or any post if you're the match admin.
export async function postMessage(body, targetId) {
  const p = await actor()
  if (!p) return { ok: false, error: 'Sign in to talk smack.' }
  const res = await PP.postMessage(p.id, p.name, body, targetId || null)
  if (res.ok) revalidatePath('/smack')
  return res
}

export async function deleteMessage(id) {
  const p = await actor()
  if (!p) return { ok: false, error: 'Sign in first.' }
  const res = await PP.removeMessage(id, p.id)
  if (res.ok) revalidatePath('/smack')
  return res
}
