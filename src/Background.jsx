import { useEffect, useRef } from 'react'

const PALETTES = [
  ['76,111,231', '127,160,111', '199,146,234'],
  ['255,95,162', '255,190,60', '60,220,255'], // Konami party palette
]

// Fixed, full-window backdrop: slow aurora blobs plus a particle network that
// drifts, links nearby dots and scatters away from the cursor. It dims as you
// scroll past the hero so body text stays readable.
export default function Background() {
  const canvas = useRef(null)

  useEffect(() => {
    const cv = canvas.current
    const ctx = cv.getContext('2d')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let w = 0, h = 0, raf, parts = []
    const mouse = { x: -999, y: -999 }

    const init = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = window.innerWidth; h = window.innerHeight
      cv.width = w * dpr; cv.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const n = Math.min(110, Math.round((w * h) / 14000))
      parts = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.4 + 0.8, c: Math.floor(Math.random() * 3),
      }))
    }

    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      const pal = PALETTES[document.documentElement.dataset.party ? 1 : 0]
      for (const p of parts) {
        const dx = p.x - mouse.x, dy = p.y - mouse.y
        const d = Math.sqrt(dx * dx + dy * dy)
        if (d < 120 && d > 0) { const f = (120 - d) * 0.0025; p.vx += (dx / d) * f; p.vy += (dy / d) * f }
        p.vx *= 0.99; p.vy *= 0.99
        // keep a minimum drift so nothing freezes
        if (Math.abs(p.vx) + Math.abs(p.vy) < 0.12) { p.vx += (Math.random() - 0.5) * 0.02; p.vy += (Math.random() - 0.5) * 0.02 }
        p.x += p.vx; p.y += p.vy
        if (p.x < -10) p.x = w + 10; else if (p.x > w + 10) p.x = -10
        if (p.y < -10) p.y = h + 10; else if (p.y > h + 10) p.y = -10
      }
      for (let i = 0; i < parts.length; i++) {
        const a = parts[i]
        for (let j = i + 1; j < parts.length; j++) {
          const b = parts[j]
          const dx = a.x - b.x, dy = a.y - b.y
          const d2 = dx * dx + dy * dy
          if (d2 < 130 * 130) {
            ctx.strokeStyle = `rgba(${pal[a.c]},${(1 - Math.sqrt(d2) / 130) * 0.28})`
            ctx.lineWidth = 1
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke()
          }
        }
        ctx.fillStyle = `rgba(${pal[a.c]},0.75)`
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill()
      }
      if (!reduced) raf = requestAnimationFrame(draw)
    }

    const fade = () => {
      const t = Math.min(window.scrollY / (window.innerHeight * 1.1), 1)
      cv.style.opacity = String(1 - t * 0.65)
    }
    const move = (e) => { mouse.x = e.clientX; mouse.y = e.clientY }
    const leave = () => { mouse.x = mouse.y = -999 }
    const resize = () => { init(); if (reduced) draw() }

    init(); fade()
    if (reduced) draw(); else raf = requestAnimationFrame(draw)
    window.addEventListener('mousemove', move)
    document.addEventListener('mouseleave', leave)
    window.addEventListener('scroll', fade, { passive: true })
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', move)
      document.removeEventListener('mouseleave', leave)
      window.removeEventListener('scroll', fade)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <div className="bg" aria-hidden="true">
      <div className="aurora a1" />
      <div className="aurora a2" />
      <div className="aurora a3" />
      <canvas ref={canvas} />
    </div>
  )
}
