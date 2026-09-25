// Vercel serverless function → POST /api/contact
// Same behaviour as server/index.js (used for local dev), minus the local-file fallback.
import nodemailer from 'nodemailer'

const clean = (v, max) => String(v ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max)
const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const emailOk = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s)

// Best-effort rate limit. Serverless instances are short-lived, so this only slows bursts;
// the honeypot and validation do most of the spam filtering.
const hits = new Map()
const limited = (ip) => {
  const now = Date.now()
  const recent = (hits.get(ip) || []).filter((t) => now - t < 3600_000)
  if (recent.length >= 5) return true
  recent.push(now); hits.set(ip, recent)
  return false
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' })

  const { name, email, message, website } = req.body || {}
  if (website) return res.status(200).json({ ok: true }) // honeypot

  const data = { name: clean(name, 100), email: clean(email, 200), message: clean(message, 4000) }
  const errors = {}
  if (data.name.length < 2) errors.name = 'Please enter your name.'
  if (!emailOk(data.email)) errors.email = 'Please enter a valid email.'
  if (data.message.length < 10) errors.message = 'Message is too short.'
  if (Object.keys(errors).length) return res.status(400).json({ ok: false, errors })

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown'
  if (limited(ip)) return res.status(429).json({ ok: false, error: 'Too many messages. Try again later.' })

  const { SMTP_HOST, SMTP_PORT = 465, SMTP_USER, SMTP_PASS, CONTACT_TO = 'ayushgokhle@gmail.com' } = process.env
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.error('[contact] SMTP env vars are missing')
    return res.status(500).json({ ok: false, error: 'Contact form is not configured.' })
  }

  try {
    const transport = nodemailer.createTransport({
      host: SMTP_HOST, port: Number(SMTP_PORT), secure: Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
    await transport.sendMail({
      from: `"Portfolio contact" <${SMTP_USER}>`,
      to: CONTACT_TO,
      replyTo: `"${data.name.replace(/"/g, '')}" <${data.email}>`,
      subject: `Portfolio message from ${data.name}`,
      text: `${data.message}\n\n— ${data.name} <${data.email}>`,
      html: `<p>${esc(data.message).replace(/\n/g, '<br>')}</p><hr><p><b>${esc(data.name)}</b> &lt;${esc(data.email)}&gt;</p>`,
    })
    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('[contact] failed to deliver:', err.message)
    return res.status(500).json({ ok: false, error: 'Could not send your message right now.' })
  }
}
