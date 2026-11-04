// Trophies earned from the match ledger. Every number is replayed from the
// matches, so clearing or restoring matches updates trophies automatically.
import { dayKey } from './period.mjs'

export const TROPHY_GROUPS = [
  {
    id: 'streak', label: 'Win streak', icon: '🔥', stat: 'bestWinStreak',
    tiers: [
      { name: 'On a Roll', need: 3, note: '3 wins in a row' },
      { name: 'Red-Hot Paddle', need: 5, note: '5 wins in a row' },
      { name: 'Unstoppable', need: 10, note: '10 wins in a row' },
      { name: 'Table Deity', need: 15, note: '15 wins in a row' },
    ],
  },
  {
    id: 'rate', label: 'Win rate', icon: '🎯', stat: 'qualifiedPct',
    tiers: [
      { name: 'Sharpshooter', need: 60, note: '60%+ over 15 games' },
      { name: 'Spin Doctor', need: 70, note: '70%+ over 15 games' },
      { name: 'Untouchable', need: 80, note: '80%+ over 15 games' },
    ],
  },
  {
    id: 'wins', label: 'Games won', icon: '🏆', stat: 'wins',
    tiers: [
      { name: 'Point Poacher', need: 10, note: '10 wins' },
      { name: 'Smash Collector', need: 25, note: '25 wins' },
      { name: 'Table Boss', need: 50, note: '50 wins' },
      { name: 'Centurion of Spin', need: 100, note: '100 wins' },
    ],
  },
  {
    id: 'month', label: 'Monthly wins', icon: '🗓️', stat: 'bestMonthWins',
    tiers: [
      { name: 'Century Club', need: 100, note: '100 wins in a month' },
      { name: 'Double Century', need: 200, note: '200 wins in a month' },
      { name: 'Monthly Menace', need: 300, note: '300 wins in a month' },
    ],
  },
  {
    id: 'week', label: 'Weekly wins', icon: '📅', stat: 'bestWeekWins',
    tiers: [
      { name: 'Hot Hand', need: 25, note: '25 wins in a week' },
      { name: 'Weekend Wrecker', need: 50, note: '50 wins in a week' },
      { name: 'Weekly Warlord', need: 75, note: '75 wins in a week' },
    ],
  },
  {
    id: 'games', label: 'Games played', icon: '🏓', stat: 'games',
    tiers: [
      { name: 'First Serve', need: 10, note: '10 games' },
      { name: 'Rally Rat', need: 25, note: '25 games' },
      { name: 'Table Veteran', need: 50, note: '50 games' },
      { name: 'Century Paddler', need: 100, note: '100 games' },
    ],
  },
  {
    id: 'cold', label: 'Cold streak', icon: '🧊', stat: 'worstLossStreak',
    tiers: [
      { name: 'Ice-Cold Paddle', need: 5, note: '5 losses in a row', icon: '🧊' },
      { name: 'Free Points Foundation', need: 10, note: '10 losses in a row', icon: '🥶' },
    ],
  },
]

export const TROPHY_COUNT = TROPHY_GROUPS.reduce((n, g) => n + g.tiers.length, 0)

// Monday of the Eastern-time week a match fell in.
function weekKey(iso) {
  const [y, m, d] = dayKey(iso).split('-').map(Number)
  const t = new Date(Date.UTC(y, m - 1, d))
  t.setUTCDate(t.getUTCDate() - ((t.getUTCDay() + 6) % 7))
  return t.toISOString().slice(0, 10)
}

// matches: newest first, each { winnerId, loserId, at }
export function computeAllBadgeStats(players, matches) {
  const s = new Map(players.map((p) => [p.id, {
    games: 0, wins: 0, run: 0, bestWinStreak: 0, worstLossStreak: 0, weeks: new Map(), months: new Map(),
  }]))
  for (const m of [...matches].reverse()) {
    const w = s.get(m.winnerId), l = s.get(m.loserId)
    if (!w || !l) continue
    w.games += 1; l.games += 1; w.wins += 1
    w.run = w.run > 0 ? w.run + 1 : 1
    l.run = l.run < 0 ? l.run - 1 : -1
    w.bestWinStreak = Math.max(w.bestWinStreak, w.run)
    l.worstLossStreak = Math.max(l.worstLossStreak, -l.run)
    const wk = weekKey(m.at), mo = dayKey(m.at).slice(0, 7)
    w.weeks.set(wk, (w.weeks.get(wk) || 0) + 1)
    w.months.set(mo, (w.months.get(mo) || 0) + 1)
  }
  for (const v of s.values()) {
    v.qualifiedPct = v.games >= 15 ? Math.round((v.wins / v.games) * 100) : 0
    v.bestWeekWins = Math.max(0, ...v.weeks.values())
    v.bestMonthWins = Math.max(0, ...v.months.values())
    delete v.weeks; delete v.months
  }
  return s
}

// Every trophy for one player, earned or not, grouped for the trophy case.
export function trophyCase(stats) {
  return TROPHY_GROUPS.map((g) => ({
    id: g.id, label: g.label,
    tiers: g.tiers.map((t) => ({ ...t, icon: t.icon || g.icon, earned: (stats?.[g.stat] || 0) >= t.need })),
  }))
}

// The player's best trophy in each group, most impressive groups first.
export function topBadges(stats, limit = 3) {
  const out = []
  for (const g of TROPHY_GROUPS) {
    const earned = g.tiers.filter((t) => (stats?.[g.stat] || 0) >= t.need)
    if (!earned.length) continue
    const best = earned[earned.length - 1]
    out.push({ icon: best.icon || g.icon, name: best.name, note: best.note, cold: g.id === 'cold' })
  }
  return out.slice(0, limit)
}

export const earnedCount = (stats) =>
  TROPHY_GROUPS.reduce((n, g) => n + g.tiers.filter((t) => (stats?.[g.stat] || 0) >= t.need).length, 0)
