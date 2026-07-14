// Office ping-pong ladder — CLOUD ledger (Supabase), shared by the live
// Ping Pong Stats site and the local Reconciliation HQ site. The match log is
// the source of truth: ratings/records/streaks replay chronologically (flat
// 1500 start, Elo K=32), so removing any match recomputes exactly and both
// sites always agree — they read the same tables.
//
// Tables (RLS on; anon may SELECT players/matches; all writes go through the
// server with the service-role key):
//   pong_players  (id, name, seed, can_submit)
//   pong_matches  (id, winner_id, loser_id, winner_name, loser_name, played_at, recorded_by)
//   pong_removals (player_id, requested_by, approvals text[], requested_at)
//   pong_messages (id, author_id, author_name, target_id, target_name, body, created_at)
import { createClient } from '@supabase/supabase-js'

const K = 32
const BASE = 1500

// Ladder admins (player ids): may add players and run the triple-approval
// player deletion. Submitting a match is broader — any player whose
// can_submit flag is true (everyone except Caleb & Dillon). Deleting matches
// from the log is narrower: Trevor only.
export const EDITORS = ['trevor', 'shay', 'mark']
export const isEditor = (playerId) => EDITORS.includes(playerId)
export const MATCH_ADMIN = 'trevor'
export const canDeleteMatches = (playerId) => playerId === MATCH_ADMIN

let _sb = null
function sb() {
  if (!_sb) {
    _sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  }
  return _sb
}

const slug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

async function load() {
  const [p, m, r] = await Promise.all([
    sb().from('pong_players').select('*').order('seed'),
    sb().from('pong_matches').select('*').order('played_at', { ascending: false }),
    sb().from('pong_removals').select('*'),
  ])
  if (p.error || m.error || r.error) throw new Error((p.error || m.error || r.error).message)
  return { players: p.data, matches: m.data, pendingRemovals: r.data }
}

export async function getPlayers() {
  const { data, error } = await sb().from('pong_players').select('*').order('seed')
  if (error) throw new Error(error.message)
  return data
}
export const canSubmit = (players, playerId) => players.some((p) => p.id === playerId && p.can_submit)

// Replay the ledger chronologically; matches with removed players are skipped.
function replay(players, matchesNewestFirst, { excludeId = null } = {}) {
  const stats = new Map(players.map((p) => [p.id, { rating: BASE, wins: 0, losses: 0, streak: 0 }]))
  const deltas = new Map()
  for (const m of [...matchesNewestFirst].reverse()) {
    if (m.id === excludeId) continue
    const w = stats.get(m.winner_id), l = stats.get(m.loser_id)
    if (!w || !l) continue
    const expected = 1 / (1 + 10 ** ((l.rating - w.rating) / 400))
    const delta = Math.max(1, Math.round(K * (1 - expected)))
    deltas.set(m.id, delta)
    w.rating += delta; l.rating -= delta
    w.wins += 1; l.losses += 1
    w.streak = w.streak > 0 ? w.streak + 1 : 1
    l.streak = l.streak < 0 ? l.streak - 1 : -1
  }
  return { stats, deltas }
}

const rankOrder = (players, stats) =>
  [...players].sort((a, b) => (stats.get(b.id).rating - stats.get(a.id).rating) || (a.seed - b.seed))

export async function getStandings() {
  const d = await load()
  const { stats } = replay(d.players, d.matches)
  const ordered = rankOrder(d.players, stats)
  let prevRankById = null
  if (d.matches.length > 0) {
    const prev = replay(d.players, d.matches, { excludeId: d.matches[0].id })
    prevRankById = new Map(rankOrder(d.players, prev.stats).map((p, i) => [p.id, i + 1]))
  }
  return ordered.map((p, i) => {
    const s = stats.get(p.id)
    const rank = i + 1
    const prev = prevRankById?.get(p.id)
    const games = s.wins + s.losses
    return {
      ...p, ...s, rank, games,
      move: prev == null || prev === rank ? 'same' : rank < prev ? 'up' : 'down',
      winPct: games ? Math.round((s.wins / games) * 100) : null,
    }
  })
}

export async function getMatches(limit = 25) {
  const d = await load()
  const { deltas } = replay(d.players, d.matches)
  return d.matches.slice(0, limit).map((m) => ({
    id: m.id, winnerId: m.winner_id, loserId: m.loser_id,
    winnerName: m.winner_name, loserName: m.loser_name,
    at: m.played_at, by: m.recorded_by,
    delta: deltas.get(m.id) ?? null,
  }))
}

export async function recordMatch(winnerId, loserId, by) {
  const players = await getPlayers()
  const w = players.find((p) => p.id === winnerId)
  const l = players.find((p) => p.id === loserId)
  if (!w || !l || w.id === l.id) return { ok: false, error: 'Pick two different players.' }
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
  const { error } = await sb().from('pong_matches').insert({
    id, winner_id: winnerId, loser_id: loserId,
    winner_name: w.name, loser_name: l.name, recorded_by: by,
  })
  if (error) return { ok: false, error: error.message }
  const d = await load()
  const { deltas } = replay(d.players, d.matches)
  return { ok: true, delta: deltas.get(id) ?? null }
}

export async function removeMatch(id) {
  const { data, error } = await sb().from('pong_matches').delete().eq('id', id).select()
  if (error) return { ok: false, error: error.message }
  if (!data.length) return { ok: false, error: 'Match not found.' }
  return { ok: true, removed: `${data[0].winner_name} def. ${data[0].loser_name}` }
}

export async function addPlayer(name) {
  const clean = (name || '').trim()
  if (!clean) return { ok: false, error: 'Enter a name.' }
  const id = slug(clean)
  if (!id) return { ok: false, error: 'Enter a name.' }
  const players = await getPlayers()
  if (players.some((p) => p.id === id)) return { ok: false, error: 'That player already exists.' }
  const seed = Math.max(0, ...players.map((p) => p.seed)) + 1
  const { error } = await sb().from('pong_players').insert({ id, name: clean, seed, can_submit: true })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

// --- Player removal: triple approval (all three editors) ---
export async function getPendingRemovals() {
  const d = await load()
  return d.pendingRemovals.map((r) => ({
    playerId: r.player_id, requestedBy: r.requested_by, approvals: r.approvals, at: r.requested_at,
    playerName: d.players.find((p) => p.id === r.player_id)?.name || r.player_id,
    awaiting: EDITORS.filter((e) => !r.approvals.includes(e)),
  }))
}

export async function requestRemoval(playerId, actorId) {
  if (!isEditor(actorId)) return { ok: false, error: 'Editors only.' }
  const players = await getPlayers()
  if (!players.some((p) => p.id === playerId)) return { ok: false, error: 'Player not found.' }
  const { error } = await sb().from('pong_removals').insert({ player_id: playerId, requested_by: actorId, approvals: [actorId] })
  if (error) return { ok: false, error: error.message.includes('duplicate') ? 'Removal already pending for this player.' : error.message }
  return { ok: true }
}

export async function approveRemoval(playerId, actorId) {
  if (!isEditor(actorId)) return { ok: false, error: 'Editors only.' }
  const { data: r, error } = await sb().from('pong_removals').select('*').eq('player_id', playerId).single()
  if (error || !r) return { ok: false, error: 'No pending removal for this player.' }
  const approvals = r.approvals.includes(actorId) ? r.approvals : [...r.approvals, actorId]
  const complete = EDITORS.every((e) => approvals.includes(e))
  if (complete) {
    await sb().from('pong_players').delete().eq('id', playerId)
    await sb().from('pong_removals').delete().eq('player_id', playerId)
  } else {
    await sb().from('pong_removals').update({ approvals }).eq('player_id', playerId)
  }
  return { ok: true, deleted: complete, approvals: approvals.length }
}

export async function cancelRemoval(playerId, actorId) {
  if (!isEditor(actorId)) return { ok: false, error: 'Editors only.' }
  const { data, error } = await sb().from('pong_removals').delete().eq('player_id', playerId).select()
  if (error) return { ok: false, error: error.message }
  if (!data.length) return { ok: false, error: 'No pending removal for this player.' }
  return { ok: true }
}

/* ---------- smack talk board ---------- */

export async function getMessages(limit = 60) {
  const { data, error } = await sb().from('pong_messages').select('*').order('created_at', { ascending: false }).limit(limit)
  if (error) {
    if (/pong_messages/.test(error.message)) return null // table not created yet
    throw new Error(error.message)
  }
  return data.map((m) => ({ id: m.id, authorId: m.author_id, author: m.author_name, targetId: m.target_id, target: m.target_name, body: m.body, at: m.created_at }))
}

export async function postMessage(authorId, authorName, body, targetId = null) {
  const text = (body || '').trim()
  if (!text) return { ok: false, error: 'Say something first.' }
  if (text.length > 280) return { ok: false, error: 'Keep it under 280 characters.' }
  let targetName = null
  if (targetId) {
    const players = await getPlayers()
    const t = players.find((p) => p.id === targetId)
    if (!t) return { ok: false, error: 'Unknown target player.' }
    targetName = t.name
  }
  const { error } = await sb().from('pong_messages').insert({ author_id: authorId, author_name: authorName, target_id: targetId || null, target_name: targetName, body: text })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

// Authors may delete their own posts; the match admin (Trevor) may delete any.
export async function removeMessage(id, byId) {
  const { data, error } = await sb().from('pong_messages').select('author_id').eq('id', id).single()
  if (error || !data) return { ok: false, error: 'Message not found.' }
  if (data.author_id !== byId && byId !== MATCH_ADMIN) return { ok: false, error: 'You can only delete your own messages.' }
  const del = await sb().from('pong_messages').delete().eq('id', id)
  if (del.error) return { ok: false, error: del.error.message }
  return { ok: true }
}
