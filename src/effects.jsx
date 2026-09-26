import { useEffect, useRef, useState } from 'react'

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Soft cobalt glow that follows the cursor.
export function Spotlight() {
  useEffect(() => {
    if (reduced()) return
    const root = document.documentElement
    const move = (e) => {
      root.style.setProperty('--mx', e.clientX + 'px')
      root.style.setProperty('--my', e.clientY + 'px')
    }
    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [])
  return <div className="spotlight" aria-hidden="true" />
}

// 3D tilt + moving sheen toward the cursor.
export function Tilt({ className = '', children, ...rest }) {
  const ref = useRef(null)
  const move = (e) => {
    if (reduced() || !window.matchMedia('(hover: hover)').matches) return
    const el = ref.current
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width
    const y = (e.clientY - r.top) / r.height
    el.style.transform = `perspective(900px) rotateX(${(0.5 - y) * 10}deg) rotateY(${(x - 0.5) * 12}deg) translateZ(0)`
    el.style.setProperty('--sx', x * 100 + '%')
    el.style.setProperty('--sy', y * 100 + '%')
  }
  const leave = () => { ref.current.style.transform = '' }
  return (
    <div ref={ref} className={`tilt ${className}`} onMouseMove={move} onMouseLeave={leave} {...rest}>
      {children}
    </div>
  )
}

// Timeline whose line draws as you scroll and whose entries reveal in turn.
export function Timeline({ children }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    const items = [...el.querySelectorAll('.job')]
    const last = items[items.length - 1]
    // the line runs from the first dot to the last dot
    const lineEnd = () => last.offsetTop + 9
    const setEnd = () => el.style.setProperty('--h', lineEnd() - 9 + 'px')
    setEnd()
    if (reduced()) { items.forEach((i) => i.classList.add('seen')); el.style.setProperty('--p', lineEnd() - 9 + 'px'); return }
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && e.target.classList.add('seen')), { threshold: 0.35 })
    items.forEach((i) => io.observe(i))
    const onScroll = () => {
      const r = el.getBoundingClientRect()
      const px = window.innerHeight * 0.6 - r.top - 9
      el.style.setProperty('--p', Math.max(0, Math.min(lineEnd() - 9, px)) + 'px')
    }
    const onResize = () => { setEnd(); onScroll() }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    return () => { io.disconnect(); window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onResize) }
  }, [])
  return <div className="timeline" ref={ref}>{children}</div>
}

const fine = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches

// Konami code (↑↑↓↓←→←→BA) flips the whole background into a party palette.
export function Konami() {
  const [on, setOn] = useState(false)
  const [toast, setToast] = useState('')
  const first = useRef(true)
  useEffect(() => {
    const seq = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']
    let i = 0
    const key = (e) => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key
      i = k === seq[i] ? i + 1 : k === seq[0] ? 1 : 0
      if (i === seq.length) {
        i = 0
        setOn((v) => !v)
      }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [])
  useEffect(() => {
    if (on) document.documentElement.dataset.party = '1'
    else delete document.documentElement.dataset.party
    if (first.current) { first.current = false; return }
    setToast(on ? 'Konami code accepted — party mode on' : 'Party mode off')
    const t = setTimeout(() => setToast(''), 2600)
    return () => clearTimeout(t)
  }, [on])
  return toast ? <div className="toast mono" role="status">{toast}</div> : null
}

// Ring + dot that follow the mouse, grow over interactive things, and buttons that lean toward the cursor.
export function Cursor() {
  const ring = useRef(null)
  const dot = useRef(null)
  useEffect(() => {
    if (!fine() || reduced()) return
    document.documentElement.classList.add('custom-cursor')
    let x = -100, y = -100, rx = -100, ry = -100, raf
    const magnets = () => [...document.querySelectorAll('.btn, nav a.cta')]
    const move = (e) => {
      x = e.clientX; y = e.clientY
      dot.current.style.transform = `translate(${x}px,${y}px)`
      const hot = e.target.closest?.('a, button, input, textarea, [role=button], .tilt, canvas')
      ring.current.classList.toggle('hot', !!hot)
      ring.current.classList.toggle('text', !!e.target.closest?.('input, textarea'))
      magnets().forEach((b) => {
        const r = b.getBoundingClientRect()
        const dx = x - (r.left + r.width / 2), dy = y - (r.top + r.height / 2)
        const near = Math.hypot(dx, dy) < Math.max(r.width, r.height) * 0.9 + 30
        b.style.transform = near ? `translate(${dx * 0.22}px,${dy * 0.28}px)` : ''
      })
    }
    const loop = () => {
      rx += (x - rx) * 0.18; ry += (y - ry) * 0.18
      ring.current.style.transform = `translate(${rx}px,${ry}px)`
      raf = requestAnimationFrame(loop)
    }
    const leave = () => { ring.current.style.opacity = 0; dot.current.style.opacity = 0 }
    const enter = () => { ring.current.style.opacity = ''; dot.current.style.opacity = '' }
    window.addEventListener('mousemove', move)
    document.addEventListener('mouseleave', leave)
    document.addEventListener('mouseenter', enter)
    raf = requestAnimationFrame(loop)
    return () => {
      document.documentElement.classList.remove('custom-cursor')
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', move)
      document.removeEventListener('mouseleave', leave)
      document.removeEventListener('mouseenter', enter)
      magnets().forEach((b) => { b.style.transform = '' })
    }
  }, [])
  return (
    <>
      <div className="cur-ring" ref={ring} aria-hidden="true" />
      <div className="cur-dot" ref={dot} aria-hidden="true" />
    </>
  )
}

// Thin bar across the top showing how far down the page you are.
export function ProgressBar() {
  const ref = useRef(null)
  useEffect(() => {
    const on = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      ref.current.style.transform = `scaleX(${max > 0 ? Math.min(window.scrollY / max, 1) : 0})`
    }
    on()
    window.addEventListener('scroll', on, { passive: true })
    window.addEventListener('resize', on)
    return () => { window.removeEventListener('scroll', on); window.removeEventListener('resize', on) }
  }, [])
  return <div className="progress" ref={ref} aria-hidden="true" />
}

// Which section is currently in the middle band of the screen.
export function useActiveSection(ids) {
  const [active, setActive] = useState(ids[0])
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setActive(e.target.id)), { rootMargin: '-45% 0px -50% 0px' })
    ids.forEach((id) => { const el = document.getElementById(id); if (el) io.observe(el) })
    return () => io.disconnect()
  }, [])
  return active
}

// Fade + slide headings and cards in as they scroll into view.
export function useReveal(selector) {
  useEffect(() => {
    if (reduced()) return
    const els = [...document.querySelectorAll(selector)]
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) }
    }), { threshold: 0.15, rootMargin: '0px 0px -6% 0px' })
    els.forEach((el, i) => {
      el.classList.add('reveal')
      el.style.transitionDelay = (i % 3) * 90 + 'ms'
      io.observe(el)
    })
    return () => io.disconnect()
  }, [])
}
