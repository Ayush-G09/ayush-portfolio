// How the whiteboard's parts connect. Plain SVG, themed with the site's CSS variables.
export const Box = ({ x, y, w, h, title, lines = [], dashed = false, tone = '' }) => {
  const left = Number(x)
  const top = Number(y)
  return (
    <g>
      <rect className={`dg-box ${tone}`} x={left} y={top} width={Number(w)} height={Number(h)} rx="10" strokeDasharray={dashed ? '5 4' : undefined} />
      <text className="dg-title" x={left + 14} y={top + 24}>{title}</text>
      {lines.map((l, i) => <text key={l} className="dg-sub" x={left + 14} y={top + 44 + i * 16}>{l}</text>)}
    </g>
  )
}

export const Arrow = ({ d, both = false, dashed = false }) => (
  <path className="dg-arrow" d={d} markerEnd="url(#dg-head)" markerStart={both ? 'url(#dg-head-start)' : undefined} strokeDasharray={dashed ? '5 4' : undefined} />
)

export const Label = ({ x, y, lines, anchor = 'middle' }) => (
  <text className="dg-label" x={x} y={y} textAnchor={anchor}>
    {lines.map((l, i) => <tspan key={l} x={x} dy={i === 0 ? 0 : 14}>{l}</tspan>)}
  </text>
)

export default function Diagram() {
  return (
    <figure className="diagram">
      <div className="diagram-scroll">
        <svg viewBox="0 0 980 560" role="img" aria-labelledby="dg-title dg-desc" xmlns="http://www.w3.org/2000/svg">
          <title id="dg-title">Whiteboard architecture</title>
          <desc id="dg-desc">
            The browser (React canvas editor, Yjs document, presence and a WebSocket client) talks to a NestJS server over a WebSocket and REST.
            The server keeps each board in memory, batches its edits into Postgres, and can relay edits between several servers through Redis.
          </desc>
          <defs>
            <marker id="dg-head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" className="dg-tip" /></marker>
            <marker id="dg-head-start" viewBox="0 0 10 10" refX="2" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M10 0L0 5L10 10z" className="dg-tip" /></marker>
          </defs>

          {/* zones */}
          <rect className="dg-zone" x="16" y="16" width="304" height="528" rx="14" />
          <text className="dg-zone-title" x="32" y="42">Browser · app served by Vercel</text>
          <rect className="dg-zone" x="372" y="16" width="592" height="528" rx="14" />
          <text className="dg-zone-title" x="388" y="42">Server · Render</text>
          <rect className="dg-zone optional" x="688" y="318" width="264" height="214" rx="12" strokeDasharray="6 5" />
          <text className="dg-zone-title" x="702" y="340">Optional: 2+ API servers</text>

          {/* browser column */}
          <Box x="36" y="60" w="264" h="72" title="Canvas editor" lines={['tools · selection · rotate · align', 'draws shapes, cursors, reactions']} />
          <Box x="36" y="150" w="264" h="72" title="Board document (Yjs)" lines={['each shape = a map of fields', 'per-user undo · edits merge']} tone="accent" />
          <Box x="36" y="240" w="264" h="72" title="Presence" lines={['cursor · selection', 'viewport (follow) · reactions']} />
          <Box x="36" y="330" w="264" h="72" title="Sync client" lines={['WebSocket, auto-reconnect', 'keeps offline edits']} />
          <Box x="36" y="420" w="264" h="72" title="HTTP client" lines={['create a board', 'list, save, load versions']} />
          <Arrow d="M168 132 V150" />
          <Arrow d="M168 222 V240" both />
          <Arrow d="M168 312 V330" both />

          {/* server column */}
          <Box x="392" y="150" w="264" h="72" title="Persister" lines={['batches edits ~150 ms', 'retries · compacts the log']} />
          <Box x="392" y="240" w="264" h="72" title="Room (one per board)" lines={['live Y.Doc + presence', 'relays edits · drops viewer writes']} tone="accent" />
          <Box x="392" y="330" w="264" h="72" title="Gateway  /ws" lines={['checks room id and edit key', 'tells the client: edit or view-only']} />
          <Box x="392" y="420" w="264" h="72" title="REST  /api" lines={['POST /rooms · GET, POST /versions', 'saving needs the edit key']} />
          <text className="dg-sub" x="392" y="516">Room manager: loads, unloads idle boards, saves versions</text>
          <Arrow d="M524 330 V312" both />
          <Arrow d="M524 240 V222" />

          {/* client <-> server */}
          <Arrow d="M300 366 H392" both />
          <Label x="346" y="318" lines={['WebSocket', 'binary Yjs', '+ presence']} />
          <Arrow d="M300 456 H392" both />
          <Label x="346" y="444" lines={['HTTPS']} />

          {/* persistence */}
          <Box x="708" y="110" w="228" h="128" title="PostgreSQL" lines={['board_updates  (edit log)', 'board_snapshots  (compacted)', 'board_versions  (history)']} tone="store" />
          <Arrow d="M656 186 H708" />
          <Label x="682" y="176" lines={['writes']} />
          <Arrow d="M708 214 H684 V276 H656" dashed />
          <Label x="690" y="262" lines={['loads']} anchor="start" />

          {/* multi-server */}
          <Box x="708" y="358" w="228" h="72" title="Redis pub/sub" lines={['one channel per board', 'edits + presence, no stored data']} tone="store" />
          <Arrow d="M656 292 H676 V394 H708" both />
          <Label x="682" y="308" lines={['fan-out']} anchor="start" />
          <Box x="708" y="448" w="228" h="72" title="Other API servers" lines={['same code, own memory', 'also read and write Postgres']} dashed />
          <Arrow d="M822 430 V448" both />
        </svg>
      </div>
      <figcaption className="muted">
        Solid arrows are the live path of an edit; the dashed one is a board being loaded. Postgres is the source of truth. Redis only carries messages,
        so losing it can never lose a board.
      </figcaption>
    </figure>
  )
}
