// Generates the 15 player portraits: funny fake-vintage sports-card SVGs —
// ping pong players with paddles, headbands, 70s-80s studio-photo energy.
// Cartoon characters, deliberately NOT likenesses of the real people.
// Output: public/players/<id>.svg (the page prefers <id>.png if you ever
// drop real AI-generated images in; these SVGs are the default art).
// Run: node scripts/gen-portraits.mjs
import fs from 'node:fs'
import path from 'node:path'

const OUT = path.join(process.cwd(), 'public', 'players')
fs.mkdirSync(OUT, { recursive: true })

const SKIN = { fair: '#f2c79c', tan: '#dfa878', med: '#c58a5a', deep: '#8a5a3b', dark: '#6b4226' }
const HAIRC = { black: '#1d1d24', brown: '#5b3a21', dkbrown: '#3c2715', blond: '#d9a441', red: '#b4501e', gray: '#9aa1a8' }
const BG = {
  navy: ['#16375c', '#0b1f33'], teal: ['#1d5c5a', '#0e2f2e'], maroon: ['#6e2434', '#3a1019'],
  mustard: ['#a67c1f', '#5c430e'], forest: ['#2e5c33', '#142b17'], burgundy: ['#5c1f4a', '#2e0e24'],
}

const darken = (hex, f = 0.72) => {
  const n = parseInt(hex.slice(1), 16)
  const c = (v) => Math.round(v * f).toString(16).padStart(2, '0')
  return `#${c((n >> 16) & 255)}${c((n >> 8) & 255)}${c(n & 255)}`
}

/* ---------- part painters (480x640 canvas; head centered ~x=240,y=250) ---------- */

const rays = (c) => {
  let s = ''
  for (let i = 0; i < 12; i++) {
    const a0 = (i * 30 - 6) * Math.PI / 180, a1 = (i * 30 + 6) * Math.PI / 180
    const x0 = 240 + Math.cos(a0) * 700, y0 = 300 + Math.sin(a0) * 700
    const x1 = 240 + Math.cos(a1) * 700, y1 = 300 + Math.sin(a1) * 700
    s += `<path d="M240 300 L${x0.toFixed(0)} ${y0.toFixed(0)} L${x1.toFixed(0)} ${y1.toFixed(0)} Z" fill="${c}" opacity=".14"/>`
  }
  return s
}

const halftone = () => {
  let s = '<g opacity=".08" fill="#ffffff">'
  for (let y = 20; y < 640; y += 34)
    for (let x = 10 + ((y / 34) % 2) * 17; x < 480; x += 34) s += `<circle cx="${x}" cy="${y}" r="2.4"/>`
  return s + '</g>'
}

function background(bgKey, style) {
  const [a, b] = BG[bgKey]
  return `<defs>
    <radialGradient id="spot" cx="50%" cy="38%" r="75%"><stop offset="0%" stop-color="${a}"/><stop offset="100%" stop-color="${b}"/></radialGradient>
  </defs>
  <rect width="480" height="640" fill="url(#spot)"/>
  ${style === 'rays' ? rays('#ffffff') : ''}${style === 'dots' ? halftone() : ''}
  <rect width="480" height="640" fill="none" stroke="#e8d9a0" stroke-opacity=".35" stroke-width="10"/>
  <rect x="14" y="14" width="452" height="612" fill="none" stroke="#e8d9a0" stroke-opacity=".25" stroke-width="2"/>`
}

function torso(jc, skin, jersey) {
  const jd = darken(jc)
  let stripes = ''
  if (jersey === 'track')
    stripes = `<path d="M118 640 C126 520 156 462 196 440 L204 466 C170 496 150 556 146 640 Z" fill="#f5efdd"/>
               <path d="M362 640 C354 520 324 462 284 440 L276 466 C310 496 330 556 334 640 Z" fill="#f5efdd"/>`
  if (jersey === 'tank')
    stripes = `<path d="M150 640 L150 520 Q240 545 330 520 L330 640 Z" fill="none" stroke="${jd}" stroke-width="5" opacity=".6"/>`
  return `
  <path d="M96 640 C100 512 150 444 240 444 C330 444 380 512 384 640 Z" fill="${jc}"/>
  <path d="M96 640 C100 512 150 444 240 444 C246 444 240 452 240 452 C164 470 122 540 118 640 Z" fill="${jd}" opacity=".55"/>
  ${stripes}
  <path d="M208 442 L272 442 L268 470 Q240 486 212 470 Z" fill="${skin}"/>
  <rect x="214" y="404" width="52" height="52" rx="16" fill="${skin}"/>
  <text x="240" y="600" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="30" font-weight="900" fill="#f5efdd" opacity=".85" letter-spacing="4">LCG</text>`
}

function head(skin) {
  const sh = darken(skin, 0.82)
  return `
  <ellipse cx="162" cy="258" rx="15" ry="20" fill="${skin}"/>
  <ellipse cx="318" cy="258" rx="15" ry="20" fill="${skin}"/>
  <ellipse cx="240" cy="252" rx="82" ry="94" fill="${skin}"/>
  <path d="M158 252 a82 94 0 0 0 82 94 a82 94 0 0 1 -82 -94" fill="${sh}" opacity=".28"/>
  <ellipse cx="205" cy="290" rx="12" ry="8" fill="#e2574a" opacity=".22"/>
  <ellipse cx="275" cy="290" rx="12" ry="8" fill="#e2574a" opacity=".22"/>`
}

function nose(skin) {
  return `<path d="M240 252 q10 22 0 30 q-7 6 -14 1" fill="none" stroke="${darken(skin, 0.6)}" stroke-width="5" stroke-linecap="round"/>`
}

function eyes(kind) {
  const E = (x) => `<ellipse cx="${x}" cy="246" rx="12" ry="14" fill="#fff"/><circle cx="${x + 2}" cy="248" r="6.5" fill="#241d18"/><circle cx="${x + 4.4}" cy="245.4" r="2.2" fill="#fff"/>`
  switch (kind) {
    case 'intense':
      return `${E(206)}${E(274)}
      <path d="M186 232 L228 224" stroke="#241d18" stroke-width="9" stroke-linecap="round"/>
      <path d="M294 232 L252 224" stroke="#241d18" stroke-width="9" stroke-linecap="round"/>
      <rect x="192" y="238" width="30" height="7" fill="#241d18" opacity=".9" transform="rotate(-8 207 241)"/>
      <rect x="258" y="238" width="30" height="7" fill="#241d18" opacity=".9" transform="rotate(8 273 241)"/>`
    case 'wide':
      return `<ellipse cx="206" cy="246" rx="14" ry="17" fill="#fff"/><circle cx="206" cy="249" r="7" fill="#241d18"/><circle cx="208.6" cy="246" r="2.4" fill="#fff"/>
      <ellipse cx="274" cy="246" rx="14" ry="17" fill="#fff"/><circle cx="274" cy="249" r="7" fill="#241d18"/><circle cx="276.6" cy="246" r="2.4" fill="#fff"/>
      <path d="M188 222 q18 -12 36 -4" fill="none" stroke="#241d18" stroke-width="8" stroke-linecap="round"/>
      <path d="M292 222 q-18 -12 -36 -4" fill="none" stroke="#241d18" stroke-width="8" stroke-linecap="round"/>`
    case 'zen':
      return `<path d="M192 246 q14 12 28 0" fill="none" stroke="#241d18" stroke-width="7" stroke-linecap="round"/>
      <path d="M260 246 q14 12 28 0" fill="none" stroke="#241d18" stroke-width="7" stroke-linecap="round"/>
      <path d="M190 226 q16 -8 32 -3" fill="none" stroke="#241d18" stroke-width="6" stroke-linecap="round"/>
      <path d="M290 226 q-16 -8 -32 -3" fill="none" stroke="#241d18" stroke-width="6" stroke-linecap="round"/>`
    case 'wink':
      return `${E(206)}
      <path d="M260 248 q14 10 28 0" fill="none" stroke="#241d18" stroke-width="7" stroke-linecap="round"/>
      <path d="M188 226 q18 -10 34 -4" fill="none" stroke="#241d18" stroke-width="7" stroke-linecap="round"/>
      <path d="M292 224 q-16 -10 -32 -2" fill="none" stroke="#241d18" stroke-width="7" stroke-linecap="round"/>`
    default:
      return E(206) + E(274)
  }
}

function mouth(kind) {
  switch (kind) {
    case 'grin':
      return `<path d="M198 306 q42 40 84 0 q-10 34 -42 34 q-32 0 -42 -34" fill="#3d201a"/>
      <path d="M204 310 q36 22 72 0 l-3 9 q-33 17 -66 0 Z" fill="#fff"/>`
    case 'grit':
      return `<rect x="202" y="304" width="76" height="22" rx="8" fill="#3d201a"/>
      <rect x="206" y="308" width="68" height="14" rx="5" fill="#fff"/>
      <path d="M223 308 v14 M240 308 v14 M257 308 v14" stroke="#c8b9a6" stroke-width="2.4"/>`
    case 'shout':
      return `<ellipse cx="240" cy="318" rx="30" ry="24" fill="#3d201a"/>
      <path d="M214 310 q26 -12 52 0 l-4 8 q-22 -9 -44 0 Z" fill="#fff"/>
      <ellipse cx="240" cy="330" rx="14" ry="8" fill="#c4453a"/>`
    case 'smirk':
      return `<path d="M204 312 q28 22 72 -6" fill="none" stroke="#3d201a" stroke-width="8" stroke-linecap="round"/>
      <path d="M272 302 l10 -3" stroke="#3d201a" stroke-width="7" stroke-linecap="round"/>`
    default:
      return `<path d="M208 310 q32 22 64 0" fill="none" stroke="#3d201a" stroke-width="8" stroke-linecap="round"/>`
  }
}

function facialHair(kind, c) {
  switch (kind) {
    case 'stache':
      return `<path d="M196 296 q22 -16 44 -2 q22 -14 44 2 q-8 18 -44 12 q-36 6 -44 -12" fill="${c}"/>`
    case 'handlebar':
      return `<path d="M192 298 q24 -20 48 -4 q24 -16 48 4 q4 14 -14 12 q6 10 -8 12 q-4 -12 -26 -12 q-22 0 -26 12 q-14 -2 -8 -12 q-18 2 -14 -12" fill="${c}"/>`
    case 'beard':
      return `<path d="M160 262 q-6 74 32 96 q22 14 48 14 q26 0 48 -14 q38 -22 32 -96 q6 66 -22 100 q-24 30 -58 30 q-34 0 -58 -30 q-28 -34 -22 -100" fill="${c}"/>
      <path d="M170 286 q8 56 34 72 q18 12 36 12 q18 0 36 -12 q26 -16 34 -72 q2 64 -32 88 q-18 13 -38 13 q-20 0 -38 -13 q-34 -24 -32 -88" fill="${c}"/>
      <path d="M196 296 q22 -14 44 -2 q22 -12 44 2 q-8 16 -44 11 q-36 5 -44 -11" fill="${c}"/>`
    case 'goatee':
      return `<path d="M214 330 q26 20 52 0 q0 28 -26 28 q-26 0 -26 -28" fill="${c}"/>
      <path d="M200 296 q18 -12 40 -3 q22 -9 40 3 q-6 14 -40 10 q-34 4 -40 -10" fill="${c}"/>`
    default:
      return ''
  }
}

function hair(kind, c) {
  const d = darken(c, 0.8)
  switch (kind) {
    case 'afro':
      return `<circle cx="168" cy="182" r="46" fill="${c}"/><circle cx="240" cy="152" r="56" fill="${c}"/><circle cx="312" cy="182" r="46" fill="${c}"/>
      <circle cx="196" cy="148" r="42" fill="${c}"/><circle cx="284" cy="148" r="42" fill="${c}"/>
      <path d="M158 236 q0 -80 82 -80 q82 0 82 80 l0 -10 q-16 -28 -82 -28 q-66 0 -82 28 Z" fill="${d}" opacity=".5"/>`
    case 'buzz':
      return `<path d="M158 240 q-4 -86 82 -86 q86 0 82 86 q-6 -56 -82 -56 q-76 0 -82 56" fill="${c}"/>`
    case 'sidepart':
      return `<path d="M158 244 q-8 -96 86 -92 q78 4 78 84 q-2 -34 -30 -46 q6 16 -4 26 q-22 -40 -78 -34 q-44 6 -52 62" fill="${c}"/>`
    case 'curly':
      return `<circle cx="184" cy="176" r="30" fill="${c}"/><circle cx="226" cy="158" r="32" fill="${c}"/><circle cx="270" cy="160" r="30" fill="${c}"/><circle cx="306" cy="184" r="26" fill="${c}"/>
      <path d="M160 232 q6 -52 80 -56 q72 -4 80 56 q-20 -34 -80 -34 q-60 0 -80 34" fill="${c}"/>`
    case 'mullet':
      return `<path d="M158 240 q-8 -90 82 -90 q90 0 82 90 q-6 -54 -82 -54 q-76 0 -82 54" fill="${c}"/>
      <path d="M150 250 q-14 60 8 108 q10 -18 20 -20 q-12 -44 -4 -84 Z" fill="${c}"/>
      <path d="M330 250 q14 60 -8 108 q-10 -18 -20 -20 q12 -44 4 -84 Z" fill="${c}"/>`
    case 'bald':
      return `<path d="M196 172 q44 -22 88 0 q-16 -12 -30 -14 q30 -4 44 8 q-40 -30 -88 -8 q-8 4 -14 14" fill="${c}" opacity=".35"/>`
    case 'ponytail':
      return `<path d="M158 244 q-10 -98 82 -96 q92 2 82 96 q-4 -60 -82 -62 q-78 -2 -82 62" fill="${c}"/>
      <path d="M316 200 q46 10 40 74 q-4 52 -34 78 q14 -44 8 -84 q-4 -34 -22 -50 Z" fill="${c}"/>
      <circle cx="330" cy="212" r="13" fill="${d}"/>`
    case 'bob':
      return `<path d="M156 250 q-12 -104 84 -104 q96 0 84 104 q0 46 -26 62 q8 -34 2 -64 q-14 -40 -60 -40 q-46 0 -60 40 q-6 30 2 64 q-26 -16 -26 -62" fill="${c}"/>`
    case 'twists':
      return `<g fill="${c}"><circle cx="176" cy="196" r="17"/><circle cx="196" cy="168" r="17"/><circle cx="224" cy="152" r="17"/><circle cx="256" cy="152" r="17"/><circle cx="284" cy="168" r="17"/><circle cx="304" cy="196" r="17"/>
      <path d="M162 232 q10 -60 78 -62 q68 2 78 62 q-24 -36 -78 -36 q-54 0 -78 36" /></g>`
    case 'flattop':
      return `<path d="M166 232 q-4 -20 4 -66 l140 0 q8 46 4 66 q-8 -44 -74 -44 q-66 0 -74 44" fill="${c}"/>`
    case 'shag':
      return `<path d="M156 248 q-14 -100 84 -100 q98 0 84 100 q-4 -42 -22 -56 q4 20 -6 32 q-8 -30 -32 -38 q6 14 0 24 q-16 -26 -48 -24 q-32 2 -44 26 q-6 -10 -2 -22 q-18 10 -14 58" fill="${c}"/>`
    default:
      return ''
  }
}

function headband(c, stripe) {
  return `<path d="M156 214 q84 -30 168 0 l0 30 q-84 -26 -168 0 Z" fill="${c}"/>
  ${stripe ? `<path d="M156 226 q84 -27 168 0 l0 8 q-84 -26 -168 0 Z" fill="${stripe}"/>` : ''}
  <path d="M156 214 q84 -30 168 0 l0 8 q-84 -28 -168 0 Z" fill="#fff" opacity=".22"/>`
}

function glasses(kind) {
  if (kind === 'aviator')
    return `<path d="M186 236 h48 l-6 34 q-20 12 -36 0 Z" fill="#2c3a4d" opacity=".85" stroke="#e8d9a0" stroke-width="4"/>
    <path d="M246 236 h48 l-6 34 q-20 12 -36 0 Z" fill="#2c3a4d" opacity=".85" stroke="#e8d9a0" stroke-width="4"/>
    <path d="M234 240 h12" stroke="#e8d9a0" stroke-width="4"/>
    <path d="M192 242 l10 14" stroke="#fff" stroke-width="4" opacity=".5"/><path d="M252 242 l10 14" stroke="#fff" stroke-width="4" opacity=".5"/>`
  if (kind === 'goggles')
    return `<rect x="182" y="228" width="116" height="40" rx="20" fill="#0e1622" opacity=".55" stroke="#f0f3f7" stroke-width="6"/>
    <path d="M156 240 l26 0 M298 240 l26 0" stroke="#f0f3f7" stroke-width="8"/>
    <path d="M192 238 l16 18" stroke="#fff" stroke-width="5" opacity=".5"/>`
  if (kind === 'round')
    return `<circle cx="208" cy="248" r="24" fill="none" stroke="#caa74e" stroke-width="5"/>
    <circle cx="272" cy="248" r="24" fill="none" stroke="#caa74e" stroke-width="5"/>
    <path d="M232 246 h16" stroke="#caa74e" stroke-width="5"/>`
  return ''
}

function paddle(x, y, rot, skin) {
  return `<g transform="translate(${x} ${y}) rotate(${rot})">
    <rect x="-9" y="52" width="18" height="66" rx="9" fill="#c99a5b"/>
    <rect x="-9" y="52" width="9" height="66" rx="7" fill="#a87c42"/>
    <ellipse cx="0" cy="0" rx="56" ry="62" fill="#c0392b"/>
    <ellipse cx="0" cy="0" rx="56" ry="62" fill="none" stroke="#8e2a20" stroke-width="7"/>
    <ellipse cx="-16" cy="-16" rx="22" ry="26" fill="#fff" opacity=".18"/>
    <ellipse cx="0" cy="118" rx="16" ry="14" fill="${skin}"/>
    <path d="M-14 112 q14 -10 28 0" fill="none" stroke="${darken(skin, 0.7)}" stroke-width="4"/>
  </g>`
}

function arm(pose, jc, skin) {
  const jd = darken(jc)
  if (pose === 'raise')
    return `<path d="M330 500 q64 -30 60 -160" fill="none" stroke="${jc}" stroke-width="52" stroke-linecap="round"/>
    <path d="M330 500 q64 -30 60 -160" fill="none" stroke="${jd}" stroke-width="52" stroke-linecap="round" opacity=".25"/>
    <circle cx="391" cy="336" r="24" fill="${skin}"/>
    <rect x="366" y="352" width="50" height="18" rx="9" fill="#f5efdd"/>
    ${paddle(392, 216, 8, skin)}`
  if (pose === 'shoulder')
    return `<path d="M322 512 q40 -50 24 -170" fill="none" stroke="${jc}" stroke-width="50" stroke-linecap="round"/>
    <circle cx="346" cy="340" r="23" fill="${skin}"/>
    <rect x="322" y="356" width="48" height="17" rx="8" fill="#f5efdd"/>
    ${paddle(342, 226, -24, skin)}`
  if (pose === 'chest')
    return `<path d="M150 520 q-24 -60 30 -84" fill="none" stroke="${jc}" stroke-width="50" stroke-linecap="round"/>
    <path d="M330 520 q40 -44 -20 -80" fill="none" stroke="${jc}" stroke-width="50" stroke-linecap="round"/>
    ${paddle(210, 470, -78, skin)}
    <circle cx="304" cy="446" r="23" fill="${skin}"/>`
  if (pose === 'towel')
    return `<path d="M148 640 q-16 -120 34 -168 q26 40 8 92 q-8 42 -12 76 Z" fill="#f5efdd"/>
    <path d="M162 486 q14 40 4 84" fill="none" stroke="#d8cfae" stroke-width="6"/>
    <path d="M330 512 q46 -36 34 -132" fill="none" stroke="${jc}" stroke-width="50" stroke-linecap="round"/>
    <circle cx="362" cy="368" r="23" fill="${skin}"/>
    ${paddle(360, 248, 14, skin)}`
  return ''
}

const sweat = () => `<g fill="#7fd4f2"><path d="M148 214 q8 12 0 20 q-8 -8 0 -20"/><path d="M132 246 q8 12 0 20 q-8 -8 0 -20"/><path d="M340 200 q8 12 0 20 q-8 -8 0 -20"/></g>`
const chain = () => `<path d="M204 452 q36 34 72 0 l-4 10 q-32 30 -64 0 Z" fill="#e8c14a"/><circle cx="240" cy="486" r="9" fill="#e8c14a"/>`
const ball = () => `<circle cx="108" cy="150" r="17" fill="#fff7e0" stroke="#d8cfae" stroke-width="2"/><path d="M84 128 q-14 -10 -22 -26 M76 158 q-18 0 -30 -8" stroke="#fff7e0" stroke-width="5" stroke-linecap="round" opacity=".6"/>`
const wrist = (c) => `<rect x="366" y="384" width="52" height="20" rx="10" fill="${c}"/>`

/* ---------- the fifteen ---------- */

const PLAYERS = {
  trevor: { bg: 'navy', bgStyle: 'rays', skin: 'fair', hair: ['sidepart', 'brown'], band: ['#c0392b'], eyes: 'intense', mouth: 'grit', jersey: ['track', '#2f568c'], pose: 'raise', extra: '' },
  shay: { bg: 'teal', bgStyle: 'dots', skin: 'med', hair: ['curly', 'black'], fh: ['goatee', 'black'], band: ['#e5b13a'], eyes: 'wide', mouth: 'grin', jersey: ['polo', '#8c2f3f'], pose: 'shoulder', extra: 'chain' },
  mark: { bg: 'maroon', bgStyle: 'rays', skin: 'fair', hair: ['sidepart', 'gray'], fh: ['handlebar', 'gray'], band: ['#f0f3f7'], eyes: 'zen', mouth: 'smirk', glasses: 'round', jersey: ['track', '#3d5a48'], pose: 'chest', extra: '' },
  pablo: { bg: 'mustard', bgStyle: 'dots', skin: 'tan', hair: ['flattop', 'black'], fh: ['goatee', 'black'], band: ['#16375c'], eyes: 'zen', mouth: 'smile', jersey: ['polo', '#25436e'], pose: 'shoulder', extra: '' },
  dave: { bg: 'forest', bgStyle: 'rays', skin: 'fair', hair: ['bald', 'brown'], fh: ['beard', 'dkbrown'], band: ['#c0392b'], eyes: 'wide', mouth: 'shout', jersey: ['tank', '#37424f'], pose: 'raise', extra: 'sweat' },
  sarah: { bg: 'burgundy', bgStyle: 'rays', skin: 'fair', hair: ['ponytail', 'blond'], band: ['#e26fa0'], eyes: 'wink', mouth: 'grin', jersey: ['track', '#3a2f5c'], pose: 'chest', extra: '' },
  jz: { bg: 'navy', bgStyle: 'dots', skin: 'med', hair: ['flattop', 'black'], band: ['#f0f3f7'], eyes: 'smile', mouth: 'smirk', glasses: 'aviator', jersey: ['polo', '#1f4f46'], pose: 'shoulder', extra: 'chain' },
  brent: { bg: 'teal', bgStyle: 'rays', skin: 'fair', hair: ['curly', 'red'], fh: ['beard', 'red'], band: ['#2e5c33'], eyes: 'wide', mouth: 'shout', jersey: ['tank', '#6e2434'], pose: 'raise', extra: '' },
  jack: { bg: 'mustard', bgStyle: 'rays', skin: 'fair', hair: ['shag', 'blond'], band: ['#16375c'], eyes: 'smile', mouth: 'grin', jersey: ['track', '#2f568c'], pose: 'towel', extra: '' },
  dillon: { bg: 'forest', bgStyle: 'dots', skin: 'tan', hair: ['buzz', 'dkbrown'], band: ['#e5b13a'], eyes: 'intense', mouth: 'grit', glasses: 'goggles', jersey: ['polo', '#37424f'], pose: 'chest', extra: '' },
  chase: { bg: 'maroon', bgStyle: 'dots', skin: 'fair', hair: ['curly', 'brown'], band: ['#f0f3f7'], eyes: 'wide', mouth: 'grin', jersey: ['track', '#1f4f46'], pose: 'raise', extra: 'ball' },
  ally: { bg: 'burgundy', bgStyle: 'dots', skin: 'tan', hair: ['bob', 'dkbrown'], band: ['#e5b13a'], eyes: 'intense', mouth: 'grit', jersey: ['polo', '#25436e'], pose: 'shoulder', extra: '' },
  cedric: { bg: 'navy', bgStyle: 'rays', skin: 'deep', hair: ['afro', 'black'], band: ['#c0392b', '#f0f3f7'], eyes: 'wide', mouth: 'grin', jersey: ['track', '#8c6d1f'], pose: 'raise', extra: 'chain' },
  caleb: { bg: 'teal', bgStyle: 'dots', skin: 'fair', hair: ['mullet', 'blond'], band: ['#c0392b'], eyes: 'wide', mouth: 'shout', jersey: ['tank', '#2f568c'], pose: 'towel', extra: 'wrist' },
  elijah: { bg: 'mustard', bgStyle: 'dots', skin: 'dark', hair: ['twists', 'black'], band: ['#f0f3f7'], eyes: 'zen', mouth: 'smirk', jersey: ['polo', '#6e2434'], pose: 'chest', extra: '' },
  'rowan-williams': { bg: 'burgundy', bgStyle: 'rays', skin: 'tan', hair: ['shag', 'brown'], fh: ['stache', 'brown'], band: ['#2fbf71'], eyes: 'intense', mouth: 'smirk', glasses: 'round', jersey: ['polo', '#1f4f46'], pose: 'shoulder', extra: 'wrist' },
  avery: { bg: 'teal', bgStyle: 'rays', skin: 'med', hair: ['buzz', 'black'], fh: ['goatee', 'black'], band: ['#e5b13a'], eyes: 'wide', mouth: 'grin', jersey: ['track', '#6e2434'], pose: 'raise', extra: 'ball' },
}

for (const [id, p] of Object.entries(PLAYERS)) {
  const skin = SKIN[p.skin]
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 640">
${background(p.bg, p.bgStyle)}
${torso(p.jersey[1], skin, p.jersey[0])}
${p.pose === 'chest' || p.pose === 'towel' ? arm(p.pose, p.jersey[1], skin) : ''}
${head(skin)}
${nose(skin)}
${eyes(p.eyes)}
${mouth(p.mouth)}
${p.fh ? facialHair(p.fh[0], HAIRC[p.fh[1]]) : ''}
${hair(p.hair[0], HAIRC[p.hair[1]])}
${headband(p.band[0], p.band[1])}
${p.glasses ? glasses(p.glasses) : ''}
${p.pose === 'raise' || p.pose === 'shoulder' ? arm(p.pose, p.jersey[1], skin) : ''}
${p.extra === 'sweat' ? sweat() : ''}${p.extra === 'chain' ? chain() : ''}${p.extra === 'ball' ? ball() : ''}${p.extra === 'wrist' ? wrist(p.band[0]) : ''}
</svg>`
  fs.writeFileSync(path.join(OUT, `${id}.svg`), svg)
  console.log(`wrote ${id}.svg`)
}
console.log('done —', Object.keys(PLAYERS).length, 'portraits')
