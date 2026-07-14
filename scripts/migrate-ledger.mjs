// One-time migration: local data/pingpong.json ledger -> Supabase tables.
// Caleb & Dillon get can_submit=false (user rule). Idempotent (upserts).
//   node scripts/migrate-ledger.mjs
import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
let t = readFileSync(resolve(root, '.env.local'), 'utf8').replace(/^﻿/, '')
const env = {}
for (const l of t.split(/\r?\n/)) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim() }
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

const SEED = ['Mark', 'Shay', 'Pablo', 'Elijah', 'Dave', 'Sarah', 'Trevor', 'JZ', 'Brent', 'Jack', 'Dillon', 'Chase', 'Ally', 'Cedric', 'Caleb']
const slugify = (n) => n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const NO_SUBMIT = ['caleb', 'dillon']

const file = resolve(root, '../lcg-recon/data/pingpong.json')
const local = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null

const players = (local?.players?.length ? local.players : SEED.map((name, i) => ({ id: slugify(name), name, seed: i + 1 })))
  .map((p) => ({ id: p.id, name: p.name, seed: p.seed, can_submit: !NO_SUBMIT.includes(p.id) }))

const matches = (local?.matches || []).map((m) => ({
  id: m.id, winner_id: m.winnerId, loser_id: m.loserId,
  winner_name: m.winnerName, loser_name: m.loserName,
  played_at: m.at, recorded_by: m.by,
}))

const { error: pe } = await sb.from('pong_players').upsert(players)
if (pe) throw new Error('players: ' + pe.message)
if (matches.length) {
  const { error: me } = await sb.from('pong_matches').upsert(matches)
  if (me) throw new Error('matches: ' + me.message)
}
console.log(`Migrated ${players.length} players (${players.filter((p) => !p.can_submit).map((p) => p.name).join(', ')} = view-only) and ${matches.length} matches.`)
