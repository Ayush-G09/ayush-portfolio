import { useState } from 'react'
import { EMAIL, CONTACT_ENDPOINT } from './config.js'

const EMPTY = { name: '', email: '', message: '', website: '' } // `website` is a hidden spam trap

const validate = (f) => {
  const e = {}
  if (f.name.trim().length < 2) e.name = 'Please enter your name.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) e.email = 'Please enter a valid email.'
  if (f.message.trim().length < 10) e.message = 'Message is too short.'
  return e
}

const mailto = (f) =>
  `mailto:${EMAIL}?subject=${encodeURIComponent('Hello from ' + f.name)}&body=${encodeURIComponent(`${f.message}\n\n— ${f.name} (${f.email})`)}`

export default function ContactForm() {
  const [f, setF] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle') // idle | sending | sent | error | offline
  const set = (k) => (e) => {
    setF({ ...f, [k]: e.target.value })
    if (errors[k]) setErrors({ ...errors, [k]: undefined })
  }

  const submit = async (e) => {
    e.preventDefault()
    const found = validate(f)
    setErrors(found)
    if (Object.keys(found).length) return
    setStatus('sending')
    try {
      const res = await fetch(CONTACT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(f),
      })
      const body = await res.json().catch(() => ({}))
      if (res.status === 400 && body.errors) { setErrors(body.errors); return setStatus('idle') }
      if (!res.ok) return setStatus(res.status === 404 ? 'offline' : 'error')
      setStatus('sent'); setF(EMPTY)
    } catch {
      setStatus('offline') // API not reachable
    }
  }

  return (
    <form className="win cform" onSubmit={submit} noValidate>
      <div className="dots"><i className="r" /><i className="y" /><i className="g" /><span className="mono">contact.sh</span></div>
      <div className="body cbody">
        <div className="tl-out">$ ./send-message --to ayush</div>

        <label>
          <span className="prompt">&gt; name:</span>
          <input value={f.name} onChange={set('name')} autoComplete="name" maxLength={100} aria-invalid={!!errors.name} aria-describedby={errors.name ? 'e-name' : undefined} />
        </label>
        {errors.name && <div className="ferr" id="e-name" role="alert">{errors.name}</div>}

        <label>
          <span className="prompt">&gt; email:</span>
          <input type="email" value={f.email} onChange={set('email')} autoComplete="email" maxLength={200} aria-invalid={!!errors.email} aria-describedby={errors.email ? 'e-email' : undefined} />
        </label>
        {errors.email && <div className="ferr" id="e-email" role="alert">{errors.email}</div>}

        <label className="msg">
          <span className="prompt">&gt; message:</span>
          <textarea rows={4} value={f.message} onChange={set('message')} maxLength={4000} aria-invalid={!!errors.message} aria-describedby={errors.message ? 'e-message' : undefined} />
        </label>
        {errors.message && <div className="ferr" id="e-message" role="alert">{errors.message}</div>}

        {/* spam trap: hidden from people and screen readers, bots tend to fill it */}
        <div className="hp" aria-hidden="true">
          <label>Website<input tabIndex={-1} autoComplete="off" value={f.website} onChange={set('website')} /></label>
        </div>

        <div className="cactions">
          <button className="btn" type="submit" disabled={status === 'sending'}>{status === 'sending' ? 'sending…' : 'Send ↵'}</button>
          <span className={`cstatus ${status}`} role="status">
            {status === 'sent' && '✓ Message sent. I’ll get back to you soon.'}
            {status === 'error' && `✗ Couldn’t send. Please try again or email ${EMAIL}.`}
            {status === 'offline' && <>Couldn’t reach the server. <a href={mailto(f)}>Send by email instead</a>.</>}
          </span>
        </div>
      </div>
    </form>
  )
}
