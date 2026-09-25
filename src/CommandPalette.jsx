import { useEffect, useMemo, useRef, useState } from 'react'
import { EMAIL, LINKEDIN, RESUME_URL } from './config.js'

const go = (id) => () => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
const open = (url) => () => window.open(url, '_blank', 'noopener')

const ITEMS = [
  { group: 'Go to', label: 'Home', run: go('hero') },
  { group: 'Go to', label: 'About', run: go('about') },
  { group: 'Go to', label: 'Skills', run: go('skills') },
  { group: 'Go to', label: 'Experience', run: go('experience') },
  { group: 'Go to', label: 'Projects', run: go('projects') },
  { group: 'Go to', label: 'Contact', run: go('contact') },
  { group: 'Actions', label: 'Download résumé', hint: 'PDF', run: () => { const a = document.createElement('a'); a.href = RESUME_URL; a.download = ''; a.click() } },
  { group: 'Actions', label: 'Copy email address', hint: EMAIL, run: () => navigator.clipboard?.writeText(EMAIL) },
  { group: 'Actions', label: 'Send an email', run: () => { window.location.href = `mailto:${EMAIL}` } },
  { group: 'Links', label: 'LinkedIn', run: open(LINKEDIN) },
]

export default function CommandPalette() {
  const [shown, setShown] = useState(false)
  const [q, setQ] = useState('')
  const [idx, setIdx] = useState(0)
  const input = useRef(null)

  useEffect(() => {
    const key = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setShown((s) => !s) }
      else if (e.key === 'Escape') setShown(false)
    }
    const openEv = () => setShown(true)
    window.addEventListener('keydown', key)
    window.addEventListener('open-palette', openEv)
    return () => { window.removeEventListener('keydown', key); window.removeEventListener('open-palette', openEv) }
  }, [])

  useEffect(() => {
    if (shown) { setQ(''); setIdx(0); setTimeout(() => input.current?.focus(), 0) }
  }, [shown])

  const results = useMemo(() => {
    const s = q.trim().toLowerCase()
    return s ? ITEMS.filter((i) => i.label.toLowerCase().includes(s) || i.group.toLowerCase().includes(s)) : ITEMS
  }, [q])

  const choose = (item) => { if (!item) return; setShown(false); setTimeout(item.run, 60) }

  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setIdx((i) => Math.min(i + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter') choose(results[idx])
  }

  if (!shown) return null
  let lastGroup = ''
  return (
    <div className="pal-backdrop" onMouseDown={() => setShown(false)}>
      <div className="pal" role="dialog" aria-modal="true" aria-label="Command palette" onMouseDown={(e) => e.stopPropagation()}>
        <input
          ref={input}
          className="pal-input mono"
          placeholder="Type a command or search…"
          value={q}
          onChange={(e) => { setQ(e.target.value); setIdx(0) }}
          onKeyDown={onKey}
          aria-label="Search commands"
        />
        <div className="pal-list">
          {results.length === 0 && <div className="pal-empty">No matches</div>}
          {results.map((r, i) => {
            const head = r.group !== lastGroup ? <div className="pal-group mono">{r.group}</div> : null
            lastGroup = r.group
            return (
              <div key={r.label}>
                {head}
                <button className={`pal-item ${i === idx ? 'on' : ''}`} onMouseEnter={() => setIdx(i)} onClick={() => choose(r)}>
                  <span>{r.label}</span>
                  {r.hint && <span className="pal-hint mono">{r.hint}</span>}
                </button>
              </div>
            )
          })}
        </div>
        <div className="pal-foot mono"><span>↑↓ navigate</span><span>↵ select</span><span>esc close</span></div>
      </div>
    </div>
  )
}
