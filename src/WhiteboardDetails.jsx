import { useRef, useState } from 'react'
import Diagram from './Diagram'

const FEATURES = [
  ['Drawing tools', 'Rectangle, ellipse, line, arrow, pen, text and sticky notes. Rotate, resize, align, distribute, layer order, multi-select, and a hand tool for panning.'],
  ['Real-time, conflict-free', 'Edits merge automatically with a CRDT (Yjs), even when two people change the same shape at once. Undo only ever reverts your own changes.'],
  ['Live presence', 'See who is on the board, where their cursor is and what they have selected. Cursors glide instead of jumping.'],
  ['Follow mode', 'Click a person’s avatar and your view tracks theirs. Your own scroll stops it, and it survives a short network blip.'],
  ['Reactions', 'Press 1–5 and an emoji floats up from your pointer on everyone’s screen.'],
  ['Safe sharing', 'An edit link and a view-only link. The server enforces it: a viewer’s writes are dropped, not just hidden in the UI.'],
  ['Version history', 'Automatic snapshots. Scrub back, preview read-only, and restore as one undoable step.'],
  ['Export', 'PNG (up to 3x, optional transparent background) or SVG, for the whole board or just a selection.'],
  ['Works offline', 'Keep drawing when the connection drops. Edits merge when it comes back.'],
]

const FLOWS = [
  {
    id: 'stroke', label: 'A stroke, end to end',
    steps: [
      ['Browser', 'You drag the pen. The editor updates the local Yjs document immediately, so drawing feels instant.'],
      ['Browser', 'The change is a tiny binary update. The sync client sends it over the WebSocket.'],
      ['Server', 'The board’s room applies it, forwards it to everyone else connected to that board, and hands it to the persister.'],
      ['Postgres', 'The persister batches edits for about 150 ms into one row of the edit log. If a write fails it retries with backoff; nothing is dropped.'],
      ['Redis', 'With several servers, the edit is also published on that board’s Redis channel so people on other servers see it. Only the server that received the edit saves it, so nothing is written twice.'],
      ['Other browsers', 'Each applies the update to its own copy and redraws. Remote cursors ease toward their newest position.'],
    ],
  },
  {
    id: 'join', label: 'Joining a board',
    steps: [
      ['Browser', 'You open a link. With no board in the address, the app asks the API to create one and receives the board id and an edit key.'],
      ['Browser', 'It opens a WebSocket carrying the board id and, if you have it, the key.'],
      ['Server', 'The gateway checks the key (an HMAC only the server can produce) and sends one byte back: you can edit, or you are view-only.'],
      ['Server', 'If the board is not in memory, the server first subscribes to its Redis channel, and only then loads the latest snapshot plus the edit log from Postgres. Subscribing first means an edit made in between cannot be missed.'],
      ['Both', 'Client and server swap whatever each is missing (the Yjs sync handshake), then the list of who is online.'],
      ['Server', 'It also asks the other servers for edits they hold in memory but have not saved yet, so a late-loading server is never behind.'],
    ],
  },
  {
    id: 'safe', label: 'View-only, enforced',
    steps: [
      ['Server', 'Edit key = HMAC-SHA256(secret, "edit:" + board id). Knowing a board’s id lets you watch it; changing it needs a key only the server can mint, and a key for one board is useless on another.'],
      ['Server', 'A view-only connection may ask for the board, but every write it sends is dropped: never applied, never saved, never relayed.'],
      ['Browser', 'The client also hides its tools, but the server does not trust that. A test bypasses the interface and writes straight into the shared document; the editor never sees it and the database never stores it.'],
      ['Server', 'Saving a version needs the key too. Viewers can still see presence and send reactions.'],
    ],
  },
  {
    id: 'store', label: 'Saving & history',
    steps: [
      ['Postgres', 'Each board is an append-only log of edits plus a periodic snapshot. Loading reads the snapshot and replays only what came after it.'],
      ['Server', 'Compaction folds the log into a new snapshot using only what is stored (never one server’s memory), under a per-board advisory lock. It stays correct even with several servers writing.'],
      ['Server', 'A board nobody has open for 60 seconds is saved and unloaded from memory, then reloaded on demand.'],
      ['Postgres', 'Versions are whole-board snapshots saved when a board has changed and the interval has passed, and again when it is unloaded. The newest 50 are kept.'],
      ['Browser', 'Restoring rewrites the live board to match the chosen version in one transaction, so it can be undone and collaborators see it happen.'],
    ],
  },
  {
    id: 'offline', label: 'When the connection drops',
    steps: [
      ['Browser', 'Drawing carries on against the local document, and the status changes to “Offline, edits will sync when you reconnect”.'],
      ['Browser', 'The sync client reconnects with exponential backoff and clears other people’s stale cursors until it is back.'],
      ['Both', 'On reconnect they exchange what each side is missing, and the offline edits merge cleanly with whatever happened meanwhile.'],
      ['Server', 'The same path covers a server restart or a free-tier server waking from sleep.'],
    ],
  },
]

const DECISIONS = [
  ['A CRDT instead of locks or a central referee', 'Concurrent edits always converge, and offline editing comes for free.'],
  ['Each shape is a map of fields', 'One person moving a shape while another recolours it both win. A single blob per shape would make one overwrite the other.'],
  ['Stacking order is a number per shape', 'Ties break by id, so two people reordering at once still agree on the result.'],
  ['Undo tracks only my own edits', 'Yjs tags each change with its origin, so Ctrl+Z never removes a teammate’s work.'],
  ['The server decides who may write', 'The UI only hides tools. Permissions are checked where they cannot be skipped.'],
  ['Redis carries messages, never data', 'Postgres is the source of truth, so losing Redis cannot lose a board. With one server, Redis is not needed at all.'],
  ['Canvas 2D with my own geometry', 'Hit-testing, rotation, resizing a rotated shape in its own frame, and follow-mode cameras are plain, unit-tested maths.'],
]

const BUGS = [
  ['A file download came back as JSON', 'Version snapshots were sent as a framework-serialised object, but only under one dev runtime, so every unit test passed. Found in the browser, fixed by sending raw bytes, with a regression test.'],
  ['Tests were quietly using my real database', 'With database variables exported, “in-memory” tests shared the real one and interfered with each other. I made the test helper hermetic.'],
  ['The first reaction was sometimes swallowed', 'A rate limiter’s clock started at zero. Found by a unit test with a fake clock.'],
]

const STACK = [
  ['Frontend', 'React 18, TypeScript, Vite, Canvas 2D, Yjs'],
  ['Backend', 'NestJS, WebSockets (ws), Yjs and y-protocols, node-postgres, ioredis'],
  ['Data', 'PostgreSQL (edit log, snapshots, versions), Redis pub/sub'],
  ['Quality', 'Vitest, Playwright driving real Chrome, a load-test script, GitHub Actions workflow'],
  ['Hosting', 'Vercel (web), Render (API and Postgres), Docker Compose for local infrastructure'],
]

function Flows() {
  const [active, setActive] = useState(FLOWS[0].id)
  const refs = useRef({})
  const flow = FLOWS.find((f) => f.id === active)
  const move = (e, i) => {
    const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!d) return
    e.preventDefault()
    const next = FLOWS[(i + d + FLOWS.length) % FLOWS.length]
    setActive(next.id)
    refs.current[next.id]?.focus()
  }
  return (
    <div className="flows">
      <div className="tabs" role="tablist" aria-label="How it works">
        {FLOWS.map((f, i) => (
          <button
            key={f.id} ref={(el) => { refs.current[f.id] = el }}
            role="tab" id={`tab-${f.id}`} aria-selected={active === f.id} aria-controls="flow-panel" tabIndex={active === f.id ? 0 : -1}
            className={active === f.id ? 'on' : ''} onClick={() => setActive(f.id)} onKeyDown={(e) => move(e, i)}
          >{f.label}</button>
        ))}
      </div>
      <ol className="steps" role="tabpanel" id="flow-panel" aria-labelledby={`tab-${flow.id}`}>
        {flow.steps.map(([who, text], i) => (
          <li key={i}>
            <span className="who mono">{who}</span>
            <p>{text}</p>
          </li>
        ))}
      </ol>
    </div>
  )
}

export default function WhiteboardDetails() {
  return (
    <>
      <section>
        <h3>What it is</h3>
        <p className="lead-p">
          A real-time collaborative drawing board in the spirit of Figma and Excalidraw. Open a link, draw, and everyone on the
          board sees it instantly, with live cursors and no merge conflicts. I built it in four weekly milestones: a canvas editor,
          then multiplayer, then durable storage and multi-server scaling, then sharing, history and export.
        </p>
      </section>

      <section>
        <h3>What you can do</h3>
        <div className="feature-grid">
          {FEATURES.map(([t, d]) => (
            <div key={t} className="feature"><strong>{t}</strong><p>{d}</p></div>
          ))}
        </div>
      </section>

      <section>
        <h3>How it fits together</h3>
        <Diagram />
      </section>

      <section>
        <h3>How it flows</h3>
        <Flows />
      </section>

      <section>
        <h3>Decisions worth explaining</h3>
        <ul className="decisions">
          {DECISIONS.map(([t, d]) => (<li key={t}><strong>{t}.</strong> {d}</li>))}
        </ul>
      </section>

      <section>
        <h3>Bugs that testing caught</h3>
        <ul className="decisions">
          {BUGS.map(([t, d]) => (<li key={t}><strong>{t}.</strong> {d}</li>))}
        </ul>
      </section>

      <section>
        <h3>Proof it works</h3>
        <div className="stat-row">
          <div><span className="big">206</span><span className="mono">automated tests</span></div>
          <div><span className="big">13</span><span className="mono">run against real Postgres + Redis</span></div>
          <div><span className="big">11</span><span className="mono">drive two real Chrome windows</span></div>
          <div><span className="big">4 ms</span><span className="mono">median update, 13 ms at p95*</span></div>
        </div>
        <p className="fine">
          *A session of 10 editors and 5 viewers on one machine. A heavier run with 40 editors and 10 viewers (269 edits per second)
          kept every client identical, with a 90 ms median; there the load generator itself was the bottleneck, so treat that as an upper bound.
        </p>
      </section>

      <section>
        <h3>Stack</h3>
        <dl className="stack">
          {STACK.map(([k, v]) => (<div key={k}><dt className="mono">{k}</dt><dd>{v}</dd></div>))}
        </dl>
      </section>

      <section>
        <h3>Honest limits</h3>
        <p className="fine">
          History is a snapshot every few minutes, not a replay of every stroke. There are no accounts: having the edit link is the
          permission. Resizing a group that contains rotated shapes is approximate. On the free host the server sleeps after 15 idle minutes,
          so the first visit can take about a minute to wake it.
        </p>
      </section>
    </>
  )
}
