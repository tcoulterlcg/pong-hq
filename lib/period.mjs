// Day / week / month windows in Eastern time, used by the rankings and the
// player match log. Pure functions, safe on the server and in the browser.

const TZ = 'America/New_York'

// Calendar parts of a moment as seen in Eastern time.
function easternParts(date) {
  const f = new Intl.DateTimeFormat('en-US', { timeZone: TZ, year: 'numeric', month: 'numeric', day: 'numeric', weekday: 'short' })
  const parts = Object.fromEntries(f.formatToParts(date).map((p) => [p.type, p.value]))
  const dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday)
  return { y: +parts.year, m: +parts.month, d: +parts.day, dow }
}

// Day key (YYYY-MM-DD, Eastern) for grouping.
export const dayKey = (iso) => {
  const { y, m, d } = easternParts(new Date(iso))
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

// Calendar-day arithmetic on plain y/m/d (no time zones involved).
const addDays = ({ y, m, d }, n) => {
  const t = new Date(Date.UTC(y, m - 1, d + n))
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() }
}
const keyOf = ({ y, m, d }) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export const PERIODS = [
  { id: 'day', label: 'Daily' },
  { id: 'week', label: 'Weekly' },
  { id: 'month', label: 'Monthly' },
  { id: 'all', label: 'All time' },
]

// The window `offset` steps back from now (0 = current). Returns the first and
// last Eastern day keys (inclusive) and a label, or null bounds for all time.
export function periodWindow(kind, offset = 0, now = new Date()) {
  const today = easternParts(now)
  if (kind === 'day') {
    const day = addDays(today, -offset)
    const label = offset === 0 ? 'Today' : offset === 1 ? 'Yesterday' : `${MONTHS[day.m - 1]} ${day.d}`
    return { from: keyOf(day), to: keyOf(day), label }
  }
  if (kind === 'week') {
    // Weeks run Monday to Sunday.
    const monday = addDays(today, -((today.dow + 6) % 7) - offset * 7)
    const sunday = addDays(monday, 6)
    const label = offset === 0 ? 'This week' : offset === 1 ? 'Last week'
      : `${MONTHS[monday.m - 1]} ${monday.d} – ${monday.m === sunday.m ? '' : MONTHS[sunday.m - 1] + ' '}${sunday.d}`
    return { from: keyOf(monday), to: keyOf(sunday), label }
  }
  if (kind === 'month') {
    let y = today.y, m = today.m - offset
    while (m < 1) { m += 12; y -= 1 }
    const last = new Date(Date.UTC(y, m, 0)).getUTCDate()
    const label = offset === 0 ? 'This month' : `${MONTHS_LONG[m - 1]}${y === today.y ? '' : ' ' + y}`
    return { from: keyOf({ y, m, d: 1 }), to: keyOf({ y, m, d: last }), label }
  }
  return { from: null, to: null, label: 'All time' }
}

export const inWindow = (iso, win) => {
  if (!win.from) return true
  const k = dayKey(iso)
  return k >= win.from && k <= win.to
}
