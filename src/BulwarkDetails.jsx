import { useRef, useState } from 'react'
import { Arrow, Box, Label } from './Diagram'

const FEATURES = [
  ['Correct under real concurrency', 'A token bucket and a sliding window, each checked against an independent reference model over hundreds of randomised trials — and proven under actual concurrent load, not just single-threaded code.'],
  ['Genuinely distributed', 'The same limiter and a job queue, shared over Redis by many real, separate processes. A Lua script makes each check-and-spend atomic, and claiming a job is one atomic move — no lock of its own to get wrong.'],
  ['Survives a crash', 'A worker that dies mid-job, with no cleanup, is recovered automatically: its jobs go back to the queue once a visibility timeout passes, retried with backoff, or dead-lettered past their attempt limit.'],
  ['Runs as a real service', 'An HTTP API, containerised, running as several independent instances behind nothing but a shared Redis — proven against three real Docker containers, not simulated.'],
  ['A dashboard that is honest about scope', 'Every instance publishes what it does over Redis pub/sub; every instance relays it to its own connected browsers. Open the dashboard on one instance and watch traffic sent to a completely different one appear live.'],
  ['Verified, not just tested', 'Deliberately broken versions of the trust-critical logic — the refill math, the retry/backoff path, the connection scoping — were run against the suite at every phase, to prove the tests actually catch what they claim to.'],
]

const FLOWS = [
  {
    id: 'core', label: 'Getting the algorithms right, alone',
    steps: [
      ['Token bucket', 'Tokens refill continuously from elapsed time, computed lazily — no background timer to drift. A request is all-or-nothing, and a clock that jumps backward can never refund tokens. Checked against a naive reference model over 50 randomised trials.'],
      ['Sliding window', 'The exact version keeps every timestamp; the O(1)-per-key approximation blends the previous window’s count into the current one so two bursts either side of a boundary cannot both get through. A direct test proves the blend actually decays mid-window, not just at the edges — the one mutation that survived the first pass.'],
      ['Job queue', 'Priority, delay, exponential backoff with a cap, a dead-letter list. A delayed or retrying job holds no concurrency slot while it waits — it is timed by the same injectable clock everything else uses, so the whole suite runs with no real waiting.'],
    ],
  },
  {
    id: 'distributed', label: 'Making it correct across processes',
    steps: [
      ['The actual race', 'Two processes both read "2 tokens left", both decide to allow a request that costs 2, both spend: over-admitted by however many raced. A Lua script (EVAL) is Redis’s unit of atomicity — the read-decide-write happens as one step, across every client.'],
      ['Claiming a job', 'A single atomic LMOVE moves a job from the ready list to a processing list. Redis’s own primitive is the mutual-exclusion guarantee; no lock was built on top of it, because none was needed.'],
      ['The real proof', 'Six real processes, forked with child_process, raced for a bucket of known capacity: admitted exactly that many, never more. Eight real worker processes drained 300 jobs: each claimed exactly once. A process was SIGKILL’d mid-job for all 20 of its jobs: every one was recovered.'],
    ],
  },
  {
    id: 'service', label: 'From library to running service',
    steps: [
      ['One HTTP API, three containers', 'POST /limit and POST /jobs, backed by the distributed primitives, running as three independent Docker containers sharing one Redis — correctness lives in Redis, not in any one process’s memory.'],
      ['A real bug, found by timing a request', 'Claiming a job blocks its Redis connection until one arrives. Sharing that connection with the HTTP-facing rate-limit checks meant a request could land behind an active block for up to two seconds. Found by profiling, not by reading the code; fixed by giving every worker its own dedicated connection.'],
      ['The dashboard', 'Every instance publishes what it does to a Redis channel scoped to the deployment; every instance relays what it hears to its own connected browsers. The channel name itself was once a hardcoded constant — which would let two unrelated deployments sharing a Redis leak into each other’s dashboards — now scoped the same way the queue keys already are.'],
    ],
  },
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
            role="tab" id={`btab-${f.id}`} aria-selected={active === f.id} aria-controls="bflow-panel" tabIndex={active === f.id ? 0 : -1}
            className={active === f.id ? 'on' : ''} onClick={() => setActive(f.id)} onKeyDown={(e) => move(e, i)}
          >{f.label}</button>
        ))}
      </div>
      <ol className="steps" role="tabpanel" id="bflow-panel" aria-labelledby={`btab-${flow.id}`}>
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

function BulwarkDiagram() {
  return (
    <figure className="diagram">
      <div className="diagram-scroll">
        <svg viewBox="0 0 980 400" role="img" aria-labelledby="bd-title bd-desc" xmlns="http://www.w3.org/2000/svg">
          <title id="bd-title">Bulwark architecture</title>
          <desc id="bd-desc">
            Several independent HTTP server instances, each with an embedded job worker, share one Redis for both the rate-limit
            and job-queue state and for a pub/sub channel that relays live activity to every instance's dashboard, so opening
            the dashboard on any one instance shows what all of them are doing.
          </desc>
          <defs>
            <marker id="dg-head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" className="dg-tip" /></marker>
            <marker id="dg-head-start" viewBox="0 0 10 10" refX="2" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M10 0L0 5L10 10z" className="dg-tip" /></marker>
          </defs>

          <rect className="dg-zone" x="16" y="16" width="284" height="368" rx="14" />
          <text className="dg-zone-title" x="32" y="42">Instance A</text>
          <rect className="dg-zone" x="332" y="16" width="284" height="368" rx="14" />
          <text className="dg-zone-title" x="348" y="42">Instance B</text>
          <rect className="dg-zone optional" x="648" y="16" width="316" height="368" rx="14" strokeDasharray="6 5" />
          <text className="dg-zone-title" x="664" y="42">Shared Redis</text>

          <Box x="36" y="70" w="244" h="66" title="HTTP API" lines={['POST /limit', 'POST /jobs']} tone="accent" />
          <Box x="36" y="152" w="244" h="66" title="Embedded worker" lines={['claims jobs, runs them']} />
          <Box x="36" y="234" w="244" h="66" title="Dashboard" lines={['streams live activity']} />
          <Box x="36" y="316" w="244" h="60" title="Browser" lines={['open on any instance']} dashed />
          <Arrow d="M158 234 V252" both />

          <Box x="352" y="70" w="244" h="66" title="HTTP API" lines={['POST /limit', 'POST /jobs']} tone="accent" />
          <Box x="352" y="152" w="244" h="66" title="Embedded worker" lines={['claims jobs, runs them']} />
          <Box x="352" y="234" w="244" h="66" title="Dashboard" lines={['streams live activity']} />

          <Box x="668" y="70" w="276" h="80" title="Limiter + queue state" lines={['token buckets · sliding windows', 'ready / processing / dead']} tone="store" />
          <Box x="668" y="184" w="276" h="66" title="Pub/sub channel" lines={['scoped per deployment']} tone="store" />
          <text className="dg-sub" x="668" y="284">Every instance reads and writes the same</text>
          <text className="dg-sub" x="668" y="300">state; none keeps its own copy.</text>

          <Arrow d="M280 103 H352" dashed />
          <Arrow d="M280 185 H352" dashed />
          <Arrow d="M596 103 H668" both />
          <Arrow d="M596 185 H668" both />
          <Arrow d="M280 267 H352" both />
          <Arrow d="M596 267 H668" both />
        </svg>
      </div>
      <figcaption className="muted">
        Solid double-headed arrows are live traffic; the dashed ones show the two instances never talk to each other directly,
        only through the state and the channel they both share.
      </figcaption>
    </figure>
  )
}

export default function BulwarkDetails() {
  return (
    <>
      <section>
        <h3>What it is</h3>
        <p className="lead-p">
          A rate limiter and job queue built to actually hold up under concurrent, distributed load — proven, not assumed.
          Every claim in this project has a real check behind it: a property test against an independent model, real separate
          OS processes racing for a shared resource, real Docker containers, a real crash. <strong>Not deployed publicly</strong>:
          it runs as three containers on your own machine in about two minutes (see below).
        </p>
      </section>

      <section>
        <h3>Try it (2 minutes, no deploy)</h3>
        <pre className="code-block"><code>{`git clone https://github.com/Ayush-G09/bulwark.git
cd bulwark && npm install

npm run infra:up          # a real Redis on :6390
npm test                  # 98 tests: in-process, real-Redis, real-HTTP, real-dashboard
npm run verify:distributed    # forks real separate processes to prove cross-process correctness

npm run docker:up         # builds the image, starts Redis + 3 independent server containers
npm run verify:multi-instance # hits all 3 real containers over HTTP
# open http://localhost:3301 (or :3302, :3303) — the live dashboard
npm run docker:down`}</code></pre>
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
        <BulwarkDiagram />
      </section>

      <section>
        <h3>How it flows</h3>
        <Flows />
      </section>

      <section>
        <h3>Decisions worth explaining</h3>
        <ul className="decisions">
          <li><strong>Prove it against an independent model, not just examples.</strong> Every algorithm here is checked against a second, differently-written implementation of the same idea (a naive simulation, the exact sliding-window log) over hundreds of randomised trials — the same discipline as Depth’s order book.</li>
          <li><strong>Redis is the only thing instances share.</strong> No instance keeps state of its own beyond what is in flight for the current request. That is what makes "run three of these" a true statement instead of a diagram.</li>
          <li><strong>A worker’s own connection, always.</strong> Claiming a job blocks a Redis connection until one arrives. Every embedded worker gets a dedicated one, so a wait can never hold up an unrelated request — found by timing an actual HTTP call and narrowing it down step by step, not by inspection.</li>
          <li><strong>Scope shared state deliberately, every time.</strong> The queue’s key prefix and the dashboard’s pub/sub channel are both derived from one configured value, not hardcoded — the one recurring bug class across every phase was forgetting to scope something two unrelated things would otherwise share.</li>
        </ul>
      </section>

      <section>
        <h3>Bugs testing caught</h3>
        <ul className="decisions">
          <li><strong>A millisecond check that occasionally took six seconds.</strong> One Redis connection was shared between a blocking job-claim call and the HTTP-facing rate-limit check; the second was queued behind however long the first blocked for. Caught by timing a real request and bisecting the call path until it pointed at the shared connection.</li>
          <li><strong>Two unrelated test files, sharing one real Redis, saw each other’s dashboard events.</strong> The pub/sub channel was a fixed name. Fixed by scoping it per deployment; the fix was then proven with a deterministic test that starts two differently-scoped servers directly, since the original failure depended on test-runner parallel timing and was not reliably reproducible on demand.</li>
          <li><strong>A test asserted an empty bucket reads exactly 0.</strong> With continuous refill, a fraction of a token can trickle back in during the few milliseconds between requests — the honest reading is a tiny positive remainder, not zero. Not a limiter bug; a test that had not accounted for the same continuous-time reality the token bucket was deliberately built around.</li>
        </ul>
      </section>

      <section>
        <h3>Proof it works</h3>
        <div className="stat-row">
          <div><span className="big">98</span><span className="mono">automated tests</span></div>
          <div><span className="big">50/50</span><span className="mono">admitted exactly, 6 real racing processes</span></div>
          <div><span className="big">300/300</span><span className="mono">jobs claimed exactly once, 8 real workers</span></div>
          <div><span className="big">20/20</span><span className="mono">crashed jobs recovered, none lost</span></div>
        </div>
        <p className="fine">
          Every number here comes from a script actually running against real separate processes or real Docker containers,
          included in the repo (<code>verify-distributed.mts</code>, <code>verify-multi-instance.mts</code>) — not a claim about
          what the design should achieve.
        </p>
      </section>

      <section>
        <h3>Stack</h3>
        <dl className="stack">
          <div><dt className="mono">Core</dt><dd>TypeScript, framework-free (token bucket, sliding window, job queue)</dd></div>
          <div><dt className="mono">Distributed</dt><dd>ioredis, Lua scripts (EVAL) for atomic check-and-spend, LMOVE for atomic job claims</dd></div>
          <div><dt className="mono">Service</dt><dd>Node.js HTTP server, WebSocket dashboard, Docker</dd></div>
          <div><dt className="mono">Quality</dt><dd>Vitest (98 tests), property tests against independent reference models, mutation testing, real multi-process and multi-container verification scripts</dd></div>
        </dl>
      </section>

      <section>
        <h3>Honest limits</h3>
        <p className="fine">
          Not deployed: it runs where you run it. Verified at tens to hundreds of concurrent requests, not load-tested at
          production scale — Redis itself would likely be the bottleneck first, but that has not been measured. The HTTP API
          has no authentication, which is fine for a local demo and not for a public one. If two reap cycles on different
          instances race for the exact same overdue job, a dead-letter/retry counter can be off by one in that instant —
          no job is ever lost or run twice, only a stat can be briefly imprecise.
        </p>
      </section>
    </>
  )
}
