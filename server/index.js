import 'dotenv/config'
import express from 'express'
import nodemailer from 'nodemailer'
import { appendFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const {
  PORT = 3001,
  CONTACT_TO = 'ayushgokhle@gmail.com',
  SMTP_HOST, SMTP_PORT = 465, SMTP_USER, SMTP_PASS,
  ALLOWED_ORIGIN, // e.g. https://yoursite.com — leave empty in dev
} = process.env

const here = path.dirname(fileURLToPath(import.meta.url))
const smtpReady = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS)
const transport = smtpReady
  ? nodemailer.createTransport({ host: SMTP_HOST, port: Number(SMTP_PORT), secure: Number(SMTP_PORT) === 465, auth: { user: SMTP_USER, pass: SMTP_PASS } })
  : null

const app = express()
app.disable('x-powered-by')
app.set('trust proxy', 1)
app.use(express.json({ limit: '10kb' }))

// CORS only when the site is hosted on a different origin than this API.
app.use((req, res, next) => {
  if (ALLOWED_ORIGIN) {
    res.set('Access-Control-Allow-Origin', ALLOWED_ORIGIN)
    res.set('Access-Control-Allow-Headers', 'Content-Type')
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
    if (req.method === 'OPTIONS') return res.sendStatus(204)
  }
  next()
})

// Simple in-memory rate limit: 5 messages per IP per hour.
const hits = new Map()
const limited = (ip) => {
  const now = Date.now()
  const recent = (hits.get(ip) || []).filter((t) => now - t < 3600_000)
  if (recent.length >= 5) return true
  recent.push(now); hits.set(ip, recent)
  return false
}

const clean = (v, max) => String(v ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max)
const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const emailOk = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s)

app.post('/api/contact', async (req, res) => {
  const { name, email, message, website } = req.body || {}

  // Honeypot: real visitors never fill this hidden field. Pretend success to bots.
  if (website) return res.json({ ok: true })

  const data = { name: clean(name, 100), email: clean(email, 200), message: clean(message, 4000) }
  const errors = {}
  if (data.name.length < 2) errors.name = 'Please enter your name.'
  if (!emailOk(data.email)) errors.email = 'Please enter a valid email.'
  if (data.message.length < 10) errors.message = 'Message is too short.'
  if (Object.keys(errors).length) return res.status(400).json({ ok: false, errors })

  if (limited(req.ip)) return res.status(429).json({ ok: false, error: 'Too many messages. Try again later.' })

  const record = { at: new Date().toISOString(), ip: req.ip, ...data }
  try {
    if (transport) {
      await transport.sendMail({
        from: `"Portfolio contact" <${SMTP_USER}>`,
        to: CONTACT_TO,
        replyTo: `"${data.name.replace(/"/g, '')}" <${data.email}>`,
        subject: `Portfolio message from ${data.name}`,
        text: `${data.message}\n\n— ${data.name} <${data.email}>`,
        html: `<p>${esc(data.message).replace(/\n/g, '<br>')}</p><hr><p><b>${esc(data.name)}</b> &lt;${esc(data.email)}&gt;</p>`,
      })
    } else {
      // No SMTP configured yet: keep the message on disk so nothing is lost in development.
      await appendFile(path.join(here, 'messages.jsonl'), JSON.stringify(record) + '\n')
      console.log('[contact] SMTP not configured — saved to server/messages.jsonl')
    }
    res.json({ ok: true })
  } catch (err) {
    console.error('[contact] failed to deliver:', err.message)
    res.status(500).json({ ok: false, error: 'Could not send your message right now.' })
  }
})

app.get('/api/health', (_req, res) => res.json({ ok: true, smtp: smtpReady }))

app.listen(PORT, () => console.log(`Contact API on http://localhost:${PORT} (${smtpReady ? 'SMTP on' : 'SMTP off — saving to file'})`))
