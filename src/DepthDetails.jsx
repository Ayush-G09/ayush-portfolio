import { useRef, useState } from 'react'
import { Arrow, Box, Label } from './Diagram'

const FEATURES = [
  ['3D order-book terrain', 'Price runs left to right, time runs toward you, and height is how much is resting there. Green ridges are buyers, red are sellers, and the yellow line is the middle price.'],
  ['Whale walls', 'Unusually large resting orders appear as glowing spheres on the terrain, with a ranked list showing the dollar size and how long each has stood.'],
  ['10-minute replay', 'Rewind, scrub and play back what the book looked like. Anything the browser never received stays marked as unknown instead of being invented.'],
  ['3D trade candles', 'Real trade candles standing in 3D, thicker where more traded, with the live price and whale levels drawn across them.'],
  ['Alerts', 'Alert on a price level or on a new whale wall. A toast, a sound and, if you allow it, a system notification. Kept in your browser only.'],
  ['Five markets', 'BTC, ETH, SOL, BNB and XRP against USDT, from Binance’s public data. No accounts or keys.'],
]

const FLOWS = [
  {
    id: 'sync', label: 'Building a correct book',
    steps: [
      ['Server', 'It opens Binance’s depth stream and buffers the incremental updates before doing anything else.'],
      ['Binance', 'It then asks for one full snapshot (5,000 levels each side). That request is expensive for the exchange’s rate limit, so every snapshot goes through one shared gate that spaces requests out and obeys Retry-After.'],
      ['Server', 'It drops updates the snapshot already includes, and requires the first one it applies to bridge the snapshot exactly. Any gap in the sequence, or a book that ends up crossed, throws the book away and starts again.'],
      ['Server', 'It records which price range the snapshot covered. Prices outside that range are unknown, not empty, so only updates inside it are applied.'],
      ['Server', 'The view shows a window inside that range, and a second snapshot is fetched in the background and swapped in before the price drifts near the edge.'],
    ],
  },
  {
    id: 'frame', label: 'From update to pixels',
    steps: [
      ['Server', 'About ten times a second, the book is bucketed into evenly spaced price bars (width chosen as 1, 2 or 5 times a power of ten) and sent as one small frame. Identical frames are skipped, with a heartbeat once a second.'],
      ['Browser', 'Frames go into a timeline: 240 half-second steps, lined up by absolute price so a wall stays in the same column while the market moves under it.'],
      ['Browser', 'Each cell is marked known or unknown from what the frame said the server could vouch for. Gaps from reconnects stay as gaps.'],
      ['Browser', 'The 3D mesh’s vertices are updated in place about ten times a second. Height uses a log curve so a giant wall doesn’t flatten everything else.'],
      ['Browser', 'Whale walls are found from the newest row: local peaks that are both large in dollars and unusual for this book. Alerts read from the same result.'],
    ],
  },
  {
    id: 'scale', label: 'Many viewers, one exchange',
    steps: [
      ['Server', 'There is one feed per market, however many people watch it. A market nobody is watching is stopped after 30 seconds.'],
      ['Server', 'A viewer who can’t keep up has frames dropped rather than queued, so one slow connection never slows the others or grows memory.'],
      ['Server', 'New connections are checked before they open: known market, allowed website origin, a cap on total clients, and a tiny maximum message size.'],
      ['Server', 'Candles are cached for 10 seconds per market and interval, so any number of viewers cost the exchange one request.'],
    ],
  },
  {
    id: 'down', label: 'When something breaks',
    steps: [
      ['Server', 'If the exchange stream drops or goes silent, a watchdog restarts it with exponential backoff and jitter. During that time the frames say “syncing” and carry no data.'],
      ['Browser', 'The page shows “Syncing” or “Offline, reconnecting” and reconnects by itself. Old rows in the timeline are kept and marked as a gap.'],
      ['Server', 'If the exchange rate-limits or blocks the server, the retry waits as long as it asked before trying again.'],
      ['Both', 'The same path covers the free host waking from sleep: the page reconnects and goes live on its own.'],
    ],
  },
]

const DECISIONS = [
  ['Correctness before graphics', 'A pretty 3D book that’s wrong is worse than a plain one. The order-book logic is a separate package with no network or UI, so it can be tested against a simulator that knows the true book.'],
  ['Unknown is not empty', 'A snapshot only vouches for the price range it contains. Outside it the book is unknown, and the display says so instead of drawing a flat floor.'],
  ['The server sends a window, not the whole book', 'A few hundred bars per frame, not tens of thousands of levels, keeps the stream cheap for everyone.'],
  ['Replay lives in the browser', 'The browser already receives every frame, so a 10-minute buffer needs no extra server work or storage. The trade-off is that it resets on refresh.'],
  ['Alerts live in the browser too', 'No accounts, no database. The trade-off is they only fire while the page is open, and the page says so.'],
  ['The exchange sits behind an interface', 'The server never talks to Binance directly, so tests plug in a fake one that can drop messages, fail, or rate-limit on command.'],
]

const BUGS = [
  ['A “passing” book that was actually wrong', 'A real-data check that builds the book two ways and compares them failed against the live exchange even though every simulated test passed. It exposed three flaws: the book’s reach was measured from the live book, the window drifted toward the edge of what was known, and pruning could drop levels the snapshot had covered. All fixed; the check now passes for BTC, ETH and SOL.'],
  ['The window was wider than the data', 'Rounding the bar width up made the window slightly larger than the snapshot’s range. A test caught it, and the width now rounds down.'],
  ['Far-away whale walls flattened the candles', 'Including every wall in the price scale squashed the candles into a line. Only levels near the candles now stretch the scale.'],
]

const STACK = [
  ['Frontend', 'React 18, TypeScript, Vite, Three.js via React Three Fiber and drei'],
  ['Backend', 'Node.js, TypeScript, ws (WebSockets), plain HTTP'],
  ['Shared core', 'A framework-free package: order book, sync, price bucketing, timeline, whale detection, alerts, candles'],
  ['Quality', 'Vitest (164 tests), a market simulator with randomised property tests, real-data verification script, GitHub Actions workflow'],
  ['Hosting', 'Vercel (web) and Render (server, Frankfurt because Binance blocks some regions)'],
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
            role="tab" id={`dtab-${f.id}`} aria-selected={active === f.id} aria-controls="dflow-panel" tabIndex={active === f.id ? 0 : -1}
            className={active === f.id ? 'on' : ''} onClick={() => setActive(f.id)} onKeyDown={(e) => move(e, i)}
          >{f.label}</button>
        ))}
      </div>
      <ol className="steps" role="tabpanel" id="dflow-panel" aria-labelledby={`dtab-${flow.id}`}>
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

function DepthDiagram() {
  return (
    <figure className="diagram">
      <div className="diagram-scroll">
        <svg viewBox="0 0 980 440" role="img" aria-labelledby="dd-title dd-desc" xmlns="http://www.w3.org/2000/svg">
          <title id="dd-title">Depth architecture</title>
          <desc id="dd-desc">
            Binance sends a live update stream and full snapshots to the Depth server, which keeps one verified order book per market and sends compact
            frames to the browser over a WebSocket. The browser keeps a timeline for the 3D terrain, replay, whale detection and alerts. Candles come from Binance through a cached endpoint.
          </desc>
          <defs>
            <marker id="dg-head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" className="dg-tip" /></marker>
            <marker id="dg-head-start" viewBox="0 0 10 10" refX="2" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M10 0L0 5L10 10z" className="dg-tip" /></marker>
          </defs>

          <rect className="dg-zone" x="16" y="16" width="304" height="408" rx="14" />
          <text className="dg-zone-title" x="32" y="42">Browser · Vercel</text>
          <rect className="dg-zone" x="356" y="16" width="304" height="408" rx="14" />
          <text className="dg-zone-title" x="372" y="42">Server · Render</text>
          <rect className="dg-zone optional" x="700" y="16" width="264" height="408" rx="14" strokeDasharray="6 5" />
          <text className="dg-zone-title" x="716" y="42">Binance public data</text>

          <Box x="36" y="60" w="264" h="72" title="Stream client" lines={['WebSocket, auto-reconnect', 'one connection per market']} />
          <Box x="36" y="150" w="264" h="72" title="Timeline + replay" lines={['240 steps live, 10 min kept', 'known / unknown cells']} />
          <Box x="36" y="240" w="264" h="72" title="Whale detector + alerts" lines={['big and unusual resting orders', 'price and wall alerts']} />
          <Box x="36" y="330" w="264" h="72" title="3D scene (Three.js)" lines={['terrain, whales, candles', 'updated in place, ~10 Hz']} tone="accent" />
          <Arrow d="M168 132 V150" />
          <Arrow d="M168 222 V240" />
          <Arrow d="M168 312 V330" />

          <Box x="376" y="60" w="264" h="72" title="Hub" lines={['one feed per market', 'drops frames for slow clients']} />
          <Box x="376" y="150" w="264" h="72" title="Depth feed" lines={['watchdog, backoff + jitter', 'window inside known range']} />
          <Box x="376" y="240" w="264" h="72" title="Synced book" lines={['snapshot + updates, verified', 'gap or crossed book = resync']} tone="accent" />
          <Box x="376" y="330" w="264" h="72" title="Rate gate + candle cache" lines={['snapshots spaced, 429 aware', 'candles cached 10 s']} />
          <Arrow d="M508 132 V150" />
          <Arrow d="M508 222 V240" />
          <Arrow d="M300 96 H376" both />
          <Label x="338" y="82" lines={['frames']} />

          <Box x="720" y="150" w="224" h="72" title="Depth stream" lines={['incremental updates', 'every 100 ms']} tone="store" />
          <Box x="720" y="240" w="224" h="72" title="Snapshot (REST)" lines={['full book, 5,000 levels', 'rate-limit weight 250']} tone="store" />
          <Box x="720" y="330" w="224" h="72" title="Klines (REST)" lines={['trade candles', '1m · 5m · 15m']} tone="store" />
          <Arrow d="M720 186 H640" />
          <Arrow d="M720 276 H640" dashed />
          <Arrow d="M720 366 H640" dashed />
        </svg>
      </div>
      <figcaption className="muted">
        Solid arrows are the live path of the order book; dashed ones are requests made on demand. The server’s verified book is the only thing that
        ever reaches the screen.
      </figcaption>
    </figure>
  )
}

export default function DepthDetails() {
  return (
    <>
      <section>
        <h3>What it is</h3>
        <p className="lead-p">
          A live 3D view of a crypto order book: the buy and sell orders resting on the exchange, drawn as terrain you can orbit. The
          hard part isn’t the graphics, it’s keeping the book provably correct from a stream of updates, so that is what I built and
          tested first. Then came the 3D view, whale walls, replay, candles and alerts.
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
        <DepthDiagram />
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
          <div><span className="big">164</span><span className="mono">automated tests</span></div>
          <div><span className="big">3</span><span className="mono">real markets verified against Binance</span></div>
          <div><span className="big">0</span><span className="mono">resyncs in my live test session</span></div>
          <div><span className="big">~10 Hz</span><span className="mono">frames to every viewer</span></div>
        </div>
        <p className="fine">
          The real-data check records Binance’s live stream, builds the book from two snapshots taken at different times, and requires both
          to be identical inside the range both covered. It passed for BTC, ETH and SOL.
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
          A “whale” here is a large resting level, which may be several orders added together, not one identified trader. Replay and alerts
          live in your browser, so replay resets on refresh and alerts only fire while the page is open. Candles are Binance’s spot trades; the
          order book is spot too. On the free host the server sleeps after 15 idle minutes, so the first visit can take about a minute to wake it.
        </p>
      </section>
    </>
  )
}
