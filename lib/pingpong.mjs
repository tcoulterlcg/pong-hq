// Office table-tennis ladder: lifetime stats that fuel the ticker rankings.
//
// The MATCH LOG is the source of truth. Ratings, records, and streaks are
// derived by replaying every match chronologically (everyone starts flat at
// 1500, Elo K=32), so deleting any match — not just the latest — recomputes
// history exactly. Standings ties break on seed order (the July 2026 Top 15),
// which is why the ladder shows the familiar order until matches separate it.
//
// Deleting a player's lifetime record requires approval from ALL THREE
// editors (triple approval) via the pendingRemovals workflow below.
//
// Data lives in data/pingpong.json (gitignored; auto-seeds if missing).
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const FILE = process.env.PINGPONG_DATA || resolve(root, '../lcg-recon/data/pingpong.json')
const K = 32
const BASE = 1500 // everyone starts even

// Only these signed-in profiles may edit the ladder. Everyone can view.
export const EDITORS = ['tcoulter', 'sshustari', 'mhimmelman']
export const isEditor = (userId) => EDITORS.includes(userId)

const SEED = ['Mark', 'Shay', 'Pablo', 'Elijah', 'Dave', 'Sarah', 'Trevor', 'JZ', 'Brent', 'Jack', 'Dillon', 'Chase', 'Ally', 'Cedric', 'Caleb']
const slug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

function seedData() {
  return {
    players: SEED.map((name, i) => ({ id: slug(name), name, seed: i + 1 })),
    matches: [], // newest first: { id, winnerId, loserId, winnerName, loserName, at, by }
    pendingRemovals: [], // { playerId, requestedBy, approvals: [editorIds], at }
  }
}

function load() {
  if (!existsSync(FILE)) return seedData()
  try {
    const d = JSON.parse(readFileSync(FILE, 'utf8'))
    // Migrate any pre-ledger data: strip stored ratings/records (now derived).
    d.players = (d.players || []).map((p) => ({ id: p.id, name: p.name, seed: p.seed }))
    d.matches = (d.matches || []).map(({ id, winnerId, loserId, winnerName, loserName, at, by }) => ({ id, winnerId, loserId, winnerName, loserName, at, by }))
    d.pendingRemovals = d.pendingRemovals || []
    return d
  } catch { return seedData() }
}
function save(d) {
  mkdirSync(resolve(root, 'data'), { recursive: true })
  writeFileSync(FILE, JSON.stringify(d, null, 2))
}

// Replay the ledger chronologically. Returns per-player derived stats and the
// rating delta each match produced. Matches involving removed players are
// skipped (their effects vanish with the player's record).
function replay(players, matchesNewestFirst, { excludeId = null } = {}) {
  const stats = new Map(players.map((p) => [p.id, { rating: BASE, wins: 0, losses: 0, streak: 0 }]))
  const deltas = new Map()
  for (const m of [...matchesNewestFirst].reverse()) {
    if (m.id === excludeId) continue
    const w = stats.get(m.winnerId), l = stats.get(m.loserId)
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

// Standings with rank, lifetime stats, and ▲/▼ movement vs. the ladder as it
// stood before the most recent match.
export function getStandings() {
  const d = load()
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

export function getMatches(limit = 25) {
  const d = load()
  const { deltas } = replay(d.players, d.matches)
  return d.matches.slice(0, limit).map((m) => ({ ...m, delta: deltas.get(m.id) ?? null }))
}

export function recordMatch(winnerId, loserId, by) {
  const d = load()
  const w = d.players.find((p) => p.id === winnerId)
  const l = d.players.find((p) => p.id === loserId)
  if (!w || !l || w.id === l.id) return { ok: false, error: 'Pick two different players.' }

  d.matches.unshift({
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    winnerId, loserId, winnerName: w.name, loserName: l.name,
    at: new Date().toISOString(), by,
  })
  save(d)
  const { deltas } = replay(d.players, d.matches)
  return { ok: true, delta: deltas.get(d.matches[0].id) }
}

// Remove any match from the log — all ratings/records recompute without it.
export function removeMatch(id) {
  const d = load()
  const i = d.matches.findIndex((m) => m.id === id)
  if (i === -1) return { ok: false, error: 'Match not found.' }
  const [m] = d.matches.splice(i, 1)
  save(d)
  return { ok: true, removed: `${m.winnerName} def. ${m.loserName}` }
}

export function addPlayer(name) {
  const clean = (name || '').trim()
  if (!clean) return { ok: false, error: 'Enter a name.' }
  const d = load()
  const id = slug(clean)
  if (!id || d.players.some((p) => p.id === id)) return { ok: false, error: 'That player already exists.' }
  d.players.push({ id, name: clean, seed: Math.max(0, ...d.players.map((p) => p.seed)) + 1 })
  save(d)
  return { ok: true }
}

// --- Player removal: triple approval (all three editors must sign off) ---

export function getPendingRemovals() {
  const d = load()
  return d.pendingRemovals.map((r) => ({
    ...r,
    playerName: d.players.find((p) => p.id === r.playerId)?.name || r.playerId,
    awaiting: EDITORS.filter((e) => !r.approvals.includes(e)),
  }))
}

export function requestRemoval(playerId, actorId) {
  if (!isEditor(actorId)) return { ok: false, error: 'Editors only.' }
  const d = load()
  const p = d.players.find((x) => x.id === playerId)
  if (!p) return { ok: false, error: 'Player not found.' }
  if (d.pendingRemovals.some((r) => r.playerId === playerId)) return { ok: false, error: 'Removal already pending for this player.' }
  d.pendingRemovals.push({ playerId, requestedBy: actorId, approvals: [actorId], at: new Date().toISOString() })
  save(d)
  return { ok: true }
}

export function approveRemoval(playerId, actorId) {
  if (!isEditor(actorId)) return { ok: false, error: 'Editors only.' }
  const d = load()
  const r = d.pendingRemovals.find((x) => x.playerId === playerId)
  if (!r) return { ok: false, error: 'No pending removal for this player.' }
  if (!r.approvals.includes(actorId)) r.approvals.push(actorId)

  const complete = EDITORS.every((e) => r.approvals.includes(e))
  if (complete) {
    // All three approved — delete the lifetime record. Their matches stay in
    // the log for context but no longer count in anyone's replayed stats.
    d.players = d.players.filter((p) => p.id !== playerId)
    d.pendingRemovals = d.pendingRemovals.filter((x) => x.playerId !== playerId)
  }
  save(d)
  return { ok: true, deleted: complete, approvals: r.approvals.length }
}

export function cancelRemoval(playerId, actorId) {
  if (!isEditor(actorId)) return { ok: false, error: 'Editors only.' }
  const d = load()
  const before = d.pendingRemovals.length
  d.pendingRemovals = d.pendingRemovals.filter((x) => x.playerId !== playerId)
  if (d.pendingRemovals.length === before) return { ok: false, error: 'No pending removal for this player.' }
  save(d)
  return { ok: true }
}
