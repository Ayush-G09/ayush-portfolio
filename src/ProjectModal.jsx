import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Gallery } from './Media.jsx'

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'

/**
 * A dialog that behaves like one: Escape and the backdrop close it, Tab stays inside it, the page behind
 * cannot scroll or be focused, and focus returns to whatever opened it.
 */
export default function ProjectModal({ project, onClose }) {
  const dialog = useRef(null)
  const closeBtn = useRef(null)

  useEffect(() => {
    const opener = document.activeElement
    const root = document.getElementById('root')
    const html = document.documentElement
    const prevOverflow = html.style.overflow
    html.style.overflow = 'hidden'
    if (root) root.inert = true // nothing behind the dialog can take focus or be read by a screen reader
    closeBtn.current?.focus()

    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return }
      if (e.key !== 'Tab' || !dialog.current) return
      const items = [...dialog.current.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null)
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      html.style.overflow = prevOverflow
      if (root) root.inert = false
      if (opener instanceof HTMLElement) opener.focus()
    }
  }, [onClose])

  const Details = project.Details
  return createPortal(
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" ref={dialog}>
        <header className="modal-head">
          <div>
            <h2 id="modal-title">{project.name}</h2>
            <p className="mono muted">{project.url}</p>
          </div>
          <div className="modal-actions">
            {project.links?.map((l) => (
              <a key={l.label} className="btn small ghost" href={l.href} target="_blank" rel="noopener noreferrer">{l.label} <span aria-hidden="true">↗</span></a>
            ))}
            <button ref={closeBtn} className="modal-close" onClick={onClose} aria-label="Close details">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </div>
        </header>
        <div className="modal-body"><Gallery media={project.media} /><Details /></div>
      </div>
    </div>,
    document.body,
  )
}
