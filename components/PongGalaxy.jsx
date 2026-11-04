'use client'

import { useEffect, useRef } from 'react'

/* Animated galaxy background (Command Center style): drifting navy nebula
   clouds, three layers of twinkling stars, regular meteors, and ping pong
   ball meteors on the same diagonal that bounce once off an invisible table.
   Pauses when the tab is hidden; still frame for reduced motion. */

const LAYERS = [
  { speed: 0.006, size: 0.6 },
  { speed: 0.014, size: 1.0 },
  { speed: 0.03, size: 1.5 },
]

const BALL_COLORS = [
  { core: '255, 255, 255', glow: '214, 228, 255' },
  { core: '255, 176, 92', glow: '255, 150, 60' },
]

export default function PongGalaxy() {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let w = 0
    let h = 0
    let builtW = 0
    let dpr = 1
    let stars = []
    let clouds = []
    const shots = []
    const balls = []
    let raf = 0
    let last = performance.now()
    let t = 0
    let nextBall = 1500 + Math.random() * 2000

    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      canvas.style.width = w + 'px'
      canvas.style.height = h + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    function build() {
      size()
      builtW = w
      const count = Math.round(Math.min(220, (w * h) / 6500))
      stars = Array.from({ length: count }, () => {
        const layer = Math.random() < 0.72 ? 0 : Math.random() < 0.85 ? 1 : 2
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          r: (Math.random() * 0.5 + 0.3) * LAYERS[layer].size,
          a: Math.random() * 0.45 + 0.2,
          tw: Math.random() * 1.6 + 0.4,
          ph: Math.random() * Math.PI * 2,
          layer,
        }
      })
      const m = Math.max(w, h)
      clouds = [
        { x: w * 0.18, y: h * 0.22, r: m * 0.55, color: '38, 62, 128', dx: 0.6, dy: 0.4, ph: 0 },
        { x: w * 0.85, y: h * 0.15, r: m * 0.45, color: '70, 108, 196', dx: 0.5, dy: 0.7, ph: 1.7 },
        { x: w * 0.7, y: h * 0.85, r: m * 0.6, color: '22, 34, 70', dx: 0.4, dy: 0.5, ph: 3.1 },
        { x: w * 0.3, y: h * 0.9, r: m * 0.4, color: '46, 74, 150', dx: 0.7, dy: 0.3, ph: 4.4 },
      ]
    }

    function drawClouds() {
      ctx.globalCompositeOperation = 'lighter'
      for (const c of clouds) {
        const x = c.x + Math.sin(t * 0.003 * c.dx + c.ph) * w * 0.06
        const y = c.y + Math.cos(t * 0.0024 * c.dy + c.ph) * h * 0.06
        const pulse = (0.07 + Math.sin(t * 0.0004 + c.ph) * 0.02) * 0.22
        const g = ctx.createRadialGradient(x, y, 0, x, y, c.r)
        g.addColorStop(0, `rgba(${c.color}, ${pulse})`)
        g.addColorStop(0.45, `rgba(${c.color}, ${pulse * 0.35})`)
        g.addColorStop(1, `rgba(${c.color}, 0)`)
        ctx.fillStyle = g
        ctx.fillRect(0, 0, w, h)
      }
      ctx.globalCompositeOperation = 'source-over'
    }

    function drawStars(dt) {
      for (const s of stars) {
        const L = LAYERS[s.layer]
        if (!still) {
          s.x -= L.speed * dt
          s.y += L.speed * dt * 0.25
          if (s.x < -4) s.x = w + 4
          if (s.y > h + 4) s.y = -4
        }
        const tw = still ? 1 : 0.65 + 0.35 * Math.sin(t * 0.001 * s.tw + s.ph)
        const color = `rgba(255, 255, 255, ${s.a * tw})`
        if (s.r > 1.05) {
          const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 2.5)
          g.addColorStop(0, color)
          g.addColorStop(1, 'rgba(255, 255, 255, 0)')
          ctx.fillStyle = g
          ctx.beginPath()
          ctx.arc(s.x, s.y, s.r * 2.5, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Regular meteors, same as Command Center: thin white streaks, top-right to bottom-left.
    function drawShots(dt) {
      if (Math.random() < 0.0004 * dt && shots.length < 2) {
        const fromTop = Math.random() < 0.5
        shots.push({
          x: fromTop ? Math.random() * w : w + 20,
          y: fromTop ? -20 : Math.random() * h * 0.5,
          vx: -(0.6 + Math.random() * 0.5),
          vy: 0.25 + Math.random() * 0.25,
          life: 0,
          max: 900 + Math.random() * 600,
        })
      }
      for (let i = shots.length - 1; i >= 0; i--) {
        const s = shots[i]
        s.life += dt
        s.x += s.vx * dt
        s.y += s.vy * dt
        const k = 1 - s.life / s.max
        if (k <= 0) { shots.splice(i, 1); continue }
        const tail = 120
        const g = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * tail, s.y - s.vy * tail)
        g.addColorStop(0, `rgba(255, 255, 255, ${0.6 * k})`)
        g.addColorStop(1, 'rgba(200, 205, 215, 0)')
        ctx.strokeStyle = g
        ctx.lineWidth = 1.1
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(s.x, s.y)
        ctx.lineTo(s.x - s.vx * tail, s.y - s.vy * tail)
        ctx.stroke()
      }
    }

    // Pong meteors: same diagonal as the regular ones, a touch slower, one bounce.
    function launchBall() {
      const fromTop = Math.random() < 0.5
      const r = 3.2 + Math.random() * 2.2
      balls.push({
        x: fromTop ? w * (0.3 + Math.random() * 0.7) : w + 20,
        y: fromTop ? -20 : Math.random() * h * 0.45,
        vx: -(0.4 + Math.random() * 0.3),
        vy: 0.17 + Math.random() * 0.17,
        g: 0.00006,
        floor: h * (0.72 + Math.random() * 0.2),
        bounced: false,
        r,
        spin: Math.random() * Math.PI * 2,
        color: BALL_COLORS[Math.random() < 0.7 ? 0 : 1],
        trail: [],
        life: 0,
      })
    }

    function drawBalls(dt) {
      nextBall -= dt
      if (nextBall <= 0 && balls.length < 3) {
        launchBall()
        nextBall = 3500 + Math.random() * 5000
      }
      for (let i = balls.length - 1; i >= 0; i--) {
        const b = balls[i]
        b.life += dt
        b.vy += b.g * dt
        b.x += b.vx * dt
        b.y += b.vy * dt
        b.spin += dt * 0.02
        if (!b.bounced && b.y > b.floor && b.vy > 0) {
          b.y = b.floor
          b.vy = -b.vy * 0.62
          b.bounced = true
        }
        b.trail.push({ x: b.x, y: b.y })
        if (b.trail.length > 26) b.trail.shift()
        if (b.x < -60 || b.x > w + 60 || b.y > h + 60) {
          balls.splice(i, 1)
          continue
        }
        const fade = Math.min(1, b.life / 250)
        for (let j = 1; j < b.trail.length; j++) {
          const p0 = b.trail[j - 1]
          const p1 = b.trail[j]
          const k = j / b.trail.length
          ctx.strokeStyle = `rgba(${b.color.glow}, ${0.5 * k * k * fade})`
          ctx.lineWidth = b.r * 1.6 * k
          ctx.lineCap = 'round'
          ctx.beginPath()
          ctx.moveTo(p0.x, p0.y)
          ctx.lineTo(p1.x, p1.y)
          ctx.stroke()
        }
        const glow = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r * 4.5)
        glow.addColorStop(0, `rgba(${b.color.glow}, ${0.55 * fade})`)
        glow.addColorStop(1, `rgba(${b.color.glow}, 0)`)
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(b.x, b.y, b.r * 4.5, 0, Math.PI * 2)
        ctx.fill()
        const ball = ctx.createRadialGradient(b.x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.1, b.x, b.y, b.r)
        ball.addColorStop(0, `rgba(255, 255, 255, ${fade})`)
        ball.addColorStop(1, `rgba(${b.color.core}, ${fade})`)
        ctx.fillStyle = ball
        ctx.beginPath()
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = `rgba(0, 0, 0, ${0.18 * fade})`
        ctx.lineWidth = 0.7
        ctx.beginPath()
        ctx.ellipse(b.x, b.y, b.r * 0.92, b.r * 0.3, b.spin, 0, Math.PI * 2)
        ctx.stroke()
      }
    }

    function frame(now) {
      const dt = Math.min(64, now - last)
      last = now
      t += dt
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, w, h)
      drawClouds()
      drawStars(dt)
      if (!still) drawShots(dt)
      if (!still) drawBalls(dt)
      if (!still) raf = requestAnimationFrame(frame)
    }

    function onResize() {
      if (window.innerWidth !== builtW) build()
      else size()
      if (still) frame(performance.now())
    }
    function onVisibility() {
      if (still) return
      cancelAnimationFrame(raf)
      if (!document.hidden) {
        last = performance.now()
        raf = requestAnimationFrame(frame)
      }
    }

    build()
    raf = requestAnimationFrame(frame)
    window.addEventListener('resize', onResize)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return <canvas ref={ref} className="galaxy" aria-hidden="true" />
}
