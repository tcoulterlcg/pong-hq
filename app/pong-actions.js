'use server'
// Ladder mutations — same editor gate as the recon site (viewing is public,
// writing is not). Data lives in the SHARED ledger file, so anything recorded
// here appears on the recon site instantly, and vice versa.
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import * as PP from '../lib/pingpong.mjs'

async function editor() {
  const ck = await cookies()
  if (ck.get('auth')?.value !== '1') return null
  const id = ck.get('ru')?.value
  return PP.isEditor(id) ? id : null
}
const DENIED = { ok: false, error: 'Sign in as Trevor, Shay, or Mark to edit the ladder.' }

export async function recordMatch(winnerId, loserId, byName) {
  const u = await editor()
  if (!u) return DENIED
  const res = PP.recordMatch(winnerId, loserId, byName)
  if (res.ok) revalidatePath('/')
  return res
}
export async function removeMatch(id) {
  if (!(await editor())) return DENIED
  const res = PP.removeMatch(id)
  if (res.ok) revalidatePath('/')
  return res
}
