import { useEffect, useRef } from 'react'

const GROUPS = [
  { name: 'Frontend', color: '#4C6FE7', items: ['React.js', 'Next.js', 'Vue.js', 'React Native', 'Angular', 'Redux / Zustand', 'TypeScript'] },
  { name: 'Backend', color: '#7FA06F', items: ['Node.js', 'REST API', 'GraphQL', 'Express', 'SQL', 'MongoDB'] },
  { name: 'Testing & DevOps', color: '#D9A45B', items: ['Jest', 'CI/CD', 'Azure DevOps', 'Git', 'Vercel', 'Docker / K8s'] },
  { name: 'AI & Web3', color: '#C792EA', items: ['OpenAI', 'LangChain', 'Pinecone', 'Web3.js', 'Solidity'] },
]

// Skills that genuinely go together, linked across groups.
const CROSS = [
  ['React.js', 'TypeScript'], ['Node.js', 'TypeScript'], ['React.js', 'Node.js'], ['Vue.js', 'Node.js'],
  ['Express', 'Node.js'], ['Jest', 'React.js'], ['Web3.js', 'Solidity'], ['Web3.js', 'React.js'],
  ['LangChain', 'OpenAI'], ['LangChain', 'Pinecone'], ['OpenAI', 'Node.js'], ['MongoDB', 'Node.js'],
  ['Docker / K8s', 'Node.js'], ['CI/CD', 'Git'], ['Vercel', 'Next.js'], ['GraphQL', 'React.js'],
]

export default function Constellation() {
  const canvas = useRef(null)

  useEffect(() => {
    const cv = canvas.current
    const ctx = cv.getContext('2d')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let w = 0, h = 0, raf, hover = -1
    const mouse = { x: -999, y: -999 }

    const nodes = []
    GROUPS.forEach((g, gi) => g.items.forEach((label) => nodes.push({ label, gi, color: g.color, x: 0, y: 0, vx: 0, vy: 0, r: 5 })))
    const idx = Object.fromEntries(nodes.map((n, i) => [n.label, i]))
    const links = []
    GROUPS.forEach((g, gi) => {
      const ids = nodes.map((n, i) => (n.gi === gi ? i : -1)).filter((i) => i >= 0)
      ids.forEach((a, k) => { if (k > 0) links.push([ids[k - 1], a]) })
    })
    CROSS.forEach(([a, b]) => links.push([idx[a], idx[b]]))
    const nbrs = nodes.map(() => new Set())
    links.forEach(([a, b]) => { nbrs[a].add(b); nbrs[b].add(a) })

    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const r = cv.getBoundingClientRect()
      w = r.width; h = r.height
      cv.width = w * dpr; cv.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    const place = () => {
      // start each group in its own quadrant so the layout reads as clusters
      const cx = [0.25, 0.75, 0.25, 0.75], cy = [0.3, 0.3, 0.72, 0.72]
      nodes.forEach((n) => {
        n.x = w * cx[n.gi] + (Math.random() - 0.5) * w * 0.28
        n.y = h * cy[n.gi] + (Math.random() - 0.5) * h * 0.3
        n.vx = (Math.random() - 0.5) * 0.3
        n.vy = (Math.random() - 0.5) * 0.3
      })
    }

    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      // physics: drift, keep in bounds, soft repel between nodes, spring on links, mouse repel
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i]
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j]
          const dx = a.x - b.x, dy = a.y - b.y
          const d2 = dx * dx + dy * dy || 1
          if (d2 < 90 * 90) {
            const d = Math.sqrt(d2), f = (90 - d) * 0.0025
            a.vx += (dx / d) * f; a.vy += (dy / d) * f
            b.vx -= (dx / d) * f; b.vy -= (dy / d) * f
          }
        }
      }
      links.forEach(([i, j]) => {
        const a = nodes[i], b = nodes[j]
        const dx = b.x - a.x, dy = b.y - a.y
        const d = Math.sqrt(dx * dx + dy * dy) || 1
        const f = (d - (w < 560 ? 80 : 130)) * 0.0004
        a.vx += (dx / d) * f; a.vy += (dy / d) * f
        b.vx -= (dx / d) * f; b.vy -= (dy / d) * f
      })
      hover = -1
      let best = 26
      nodes.forEach((n, i) => {
        const dx = n.x - mouse.x, dy = n.y - mouse.y
        const d = Math.sqrt(dx * dx + dy * dy)
        if (d < 110 && d > 0) { const f = (110 - d) * 0.0022; n.vx += (dx / d) * f; n.vy += (dy / d) * f }
        if (d < best) { best = d; hover = i }
        n.vx *= 0.96; n.vy *= 0.96
        n.x += n.vx; n.y += n.vy
        const m = 40
        if (n.x < m) n.vx += 0.05; if (n.x > w - m) n.vx -= 0.05
        if (n.y < 22) n.vy += 0.05; if (n.y > h - 22) n.vy -= 0.05
      })

      const lit = hover >= 0 ? nbrs[hover] : null
      links.forEach(([i, j]) => {
        const a = nodes[i], b = nodes[j]
        const on = hover >= 0 && (i === hover || j === hover)
        ctx.strokeStyle = on ? a.color : 'rgba(154,166,184,0.16)'
        ctx.globalAlpha = hover >= 0 && !on ? 0.5 : 1
        ctx.lineWidth = on ? 1.6 : 1
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke()
      })
      ctx.globalAlpha = 1
      ctx.font = (w < 560 ? 10 : 12) + 'px "IBM Plex Mono", monospace'
      ctx.textBaseline = 'middle'
      nodes.forEach((n, i) => {
        const on = i === hover || (lit && lit.has(i))
        const dim = hover >= 0 && !on
        ctx.globalAlpha = dim ? 0.3 : 1
        if (on) { ctx.shadowColor = n.color; ctx.shadowBlur = 16 }
        ctx.fillStyle = n.color
        ctx.beginPath(); ctx.arc(n.x, n.y, i === hover ? 7 : n.r, 0, Math.PI * 2); ctx.fill()
        ctx.shadowBlur = 0
        ctx.fillStyle = on ? '#ECEAE2' : '#9AA6B8'
        ctx.fillText(n.label, n.x + (w < 560 ? 9 : 12), n.y)
      })
      ctx.globalAlpha = 1
      cv.style.cursor = hover >= 0 ? 'pointer' : 'default'
      if (!reduced) raf = requestAnimationFrame(draw)
    }

    const move = (e) => { const r = cv.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top }
    const touch = (e) => { const t = e.touches[0]; if (t) move(t) }
    const leave = () => { mouse.x = mouse.y = -999 }
    const resize = () => { size(); place(); if (reduced) { for (let k = 0; k < 250; k++) draw() } }
    size(); place()
    if (reduced) { for (let k = 0; k < 250; k++) draw() } else raf = requestAnimationFrame(draw)
    cv.addEventListener('mousemove', move)
    cv.addEventListener('mouseleave', leave)
    cv.addEventListener('touchstart', touch, { passive: true })
    cv.addEventListener('touchmove', touch, { passive: true })
    cv.addEventListener('touchend', leave)
    window.addEventListener('resize', resize)
    return () => { cancelAnimationFrame(raf); cv.removeEventListener('mousemove', move); cv.removeEventListener('mouseleave', leave); cv.removeEventListener('touchstart', touch); cv.removeEventListener('touchmove', touch); cv.removeEventListener('touchend', leave); window.removeEventListener('resize', resize) }
  }, [])

  return (
    <div className="constellation">
      <canvas ref={canvas} role="img" aria-label="Interactive map of skills grouped by frontend, backend, testing and DevOps, and AI and Web3. The same skills are listed below." />
      <div className="legend mono">
        {GROUPS.map((g) => <span key={g.name}><i style={{ background: g.color }} />{g.name}</span>)}
      </div>
    </div>
  )
}
