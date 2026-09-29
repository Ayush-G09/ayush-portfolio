import { useRef, useState } from 'react'
import { Arrow, Box, Label } from './Diagram'

const FEATURES = [
  ['Deterministic core, proven by replay', 'One pure step function — movement, dash, hitscan, rockets, knockback, respawns — with no wall-clock read and no randomness. Replaying the same seeded input sequence twice produces a byte-identical world, asserted directly.'],
  ['A real server proving itself against its own core', 'The authoritative server is a thin loop around the same step function. A script forks a real OS process, drives it over real WebSockets with irregular timing, then replays the server’s own recorded per-tick input history through the pure core and asserts the two are bit-identical.'],
  ['Prediction that genuinely reconciles', 'The client predicts its own input instantly, then on every server snapshot throws that prediction away and rebuilds from the authoritative state plus only the inputs the server hasn’t acknowledged yet — proven to diverge under latency and converge back to the exact server state once it stops.'],
  ['Lag compensation, shown working — not just described', 'The server keeps a short position history and can rewind hit detection to what the shooter actually saw. The proof is a before/after: the identical shot, at the identical simulated latency, misses without it and hits with it.'],
  ['A live debug panel that makes the thesis interactive', 'Drag sliders to inject real latency and packet loss into your own connection mid-game, and watch the predicted-tick vs. server-tick gap grow live — the whole point of client prediction, made visible instead of asserted.'],
  ['Mutation-tested where it matters', 'The collision math, the simulation step, and the server’s lag-compensation branch were all run against Stryker — deliberately broken versions of the trust-critical logic, to check the tests actually catch what they claim to.'],
]

const FLOWS = [
  {
    id: 'sim', label: 'Phase 1 — deterministic core',
    steps: [
      ['One pure function', '`stepWorld(world, inputs, arena, dtMs)` — movement/friction, dash, wall and player collision, rifle hitscan with wall-blocking line of sight, rocket flight and splash, knockback, death and respawn. No I/O, no clock, no randomness.'],
      ['Proof, not assumption', 'A seeded pseudo-random input sequence replayed twice through the same starting world must produce a `JSON.stringify`-identical result, events included — asserted directly, alongside per-mechanic unit tests and mutation testing on the collision/damage logic.'],
      ['A gap I found by testing it', 'The rocket weapon existed in Phase 1 but was never reachable — no input field selected it. Mutation testing on the untouched branch caught the dead code; wiring in a `weapon` field on `PlayerInput` closed it.'],
    ],
  },
  {
    id: 'server', label: 'Phase 2 — authoritative server',
    steps: [
      ['A Room, not a framework', 'A thin, wall-clock-free wrapper around `stepWorld`: buffers the latest input per player, calls the pure core once per tick. The server never trusts a client-claimed player id for input — it assigns one on connect.'],
      ['The real proof', 'A script forks an actual server process, connects two real WebSocket clients sending input at an irregular cadence, then takes the server’s own recorded `appliedInputs` history (broadcast alongside every snapshot precisely so nothing has to be guessed from timing) and replays it through the pure core directly.'],
      ['A bug in the proof script itself', 'The first version assumed the client observed tick 0 — but the server starts ticking before any socket connects, so the earliest broadcasts were silently missed. Fixed by anchoring the replay to the first *captured* broadcast’s world, not tick 0.'],
    ],
  },
  {
    id: 'predict', label: 'Phase 3 — prediction & reconciliation',
    steps: [
      ['Predict now, reconcile later', 'The client applies its own input to a local copy of the world the instant it happens. On every server snapshot it discards that prediction outright and rebuilds: `world = serverWorld`, then replays only the inputs the server hasn’t acknowledged yet.'],
      ['A deterministic network harness', 'A simulated link with fixed latency and seeded packet loss connects a real `Room` to a real `PredictedClient`, ticked by hand — no real waiting, same discipline as every other proof in this project.'],
      ['Divergence, then convergence', 'The harness asserts the client’s world genuinely diverges from the server’s mid-flight (so the test isn’t vacuous), then converges to bit-identical state once input stops — at 200ms/10% loss, at 500ms/30% loss, and at zero latency as a sanity check.'],
    ],
  },
  {
    id: 'lagcomp', label: 'Phase 4 — lag compensation',
    steps: [
      ['Rewinding hit detection', 'A fire input can carry the tick the shooter last saw confirmed by the server. The server keeps a short position-history ring buffer and, for that shot only, resolves the hitscan against the historical snapshot instead of live positions — then suppresses the live path so it is judged exactly once.'],
      ['The decisive test', 'A target runs across the shooter’s aim line. The identical shot, at the identical simulated latency, is asserted to MISS without `rewindToTick` and HIT with it — the actual mechanism demonstrated, not a unit test of the plumbing that could pass for the wrong reason.'],
      ['Two bugs the test itself had', 'First draft moved the target along the aim line instead of across it, so every position was still a hit — proved nothing. Second draft recorded the rewind tick one tick too early, before the position it needed was actually in history. Both were caught by the assertion failing, not by inspection.'],
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
      <div className="tabs" role="tablist" aria-label="How it was built">
        {FLOWS.map((f, i) => (
          <button
            key={f.id} ref={(el) => { refs.current[f.id] = el }}
            role="tab" id={`ttab-${f.id}`} aria-selected={active === f.id} aria-controls="tflow-panel" tabIndex={active === f.id ? 0 : -1}
            className={active === f.id ? 'on' : ''} onClick={() => setActive(f.id)} onKeyDown={(e) => move(e, i)}
          >{f.label}</button>
        ))}
      </div>
      <ol className="steps" role="tabpanel" id="tflow-panel" aria-labelledby={`ttab-${flow.id}`}>
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

function TickrateDiagram() {
  return (
    <figure className="diagram">
      <div className="diagram-scroll">
        <svg viewBox="0 0 980 380" role="img" aria-labelledby="td-title td-desc" xmlns="http://www.w3.org/2000/svg">
          <title id="td-title">Tickrate architecture</title>
          <desc id="td-desc">
            Two clients each predict their own player locally against the same deterministic simulation core the server
            uses. Clients send only input, never position, to the authoritative server, which broadcasts state and each
            tick's applied inputs back; clients reconcile against that, and a fire input can ask the server to rewind
            hit detection to a past tick for lag compensation.
          </desc>
          <defs>
            <marker id="tg-head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" className="dg-tip" /></marker>
          </defs>

          <rect className="dg-zone" x="16" y="16" width="264" height="348" rx="14" />
          <text className="dg-zone-title" x="32" y="42">Client A</text>
          <rect className="dg-zone" x="700" y="16" width="264" height="348" rx="14" />
          <text className="dg-zone-title" x="716" y="42">Client B</text>
          <rect className="dg-zone optional" x="358" y="16" width="264" height="348" rx="14" strokeDasharray="6 5" />
          <text className="dg-zone-title" x="374" y="42">Server (authoritative)</text>

          <Box x="36" y="70" w="224" h="62" title="PredictedClient" lines={['applies input instantly']} tone="accent" />
          <Box x="36" y="148" w="224" h="62" title="SnapshotInterpolator" lines={['smooths remote players']} />
          <Box x="36" y="226" w="224" h="66" title="Canvas renderer" lines={['+ live latency/loss sliders']} dashed />

          <Box x="378" y="70" w="224" h="62" title="Room" lines={['ticks stepWorld()']} tone="store" />
          <Box x="378" y="148" w="224" h="66" title="Position history" lines={['for lag-comp rewind']} tone="store" />
          <Box x="378" y="230" w="224" h="60" title="@tickrate/sim" lines={['same pure core, everywhere']} tone="accent" />

          <Box x="720" y="70" w="224" h="62" title="PredictedClient" lines={['applies input instantly']} tone="accent" />
          <Box x="720" y="148" w="224" h="62" title="SnapshotInterpolator" lines={['smooths remote players']} />
          <Box x="720" y="226" w="224" h="66" title="Canvas renderer" lines={['+ live latency/loss sliders']} dashed />

          <Arrow d="M260 92 H378" />
          <Label x="319" y="82" lines={['input only']} />
          <Arrow d="M378 110 H260" dashed />
          <Label x="319" y="124" lines={['state +', 'applied inputs']} />

          <Arrow d="M720 92 H602" />
          <Arrow d="M602 110 H720" dashed />
        </svg>
      </div>
      <figcaption className="muted">
        Solid arrows are input, sent by the client and never a position — that is what makes the server authoritative
        by construction. Dashed arrows are the server's broadcast back: full state, plus exactly which input it applied
        to each player that tick, which is what a client's reconciliation and a verification script both build on.
      </figcaption>
    </figure>
  )
}

export default function TickrateDetails() {
  return (
    <>
      <section>
        <h3>What it is</h3>
        <p className="lead-p">
          A real-time multiplayer arena shooter built to prove out authoritative-server netcode — client-side
          prediction, server reconciliation, snapshot interpolation, lag-compensated hit detection — the same
          architecture real shooters use, with every phase proven against its own decisive test rather than assumed
          to work because the code looks right. <strong>Not deployed publicly</strong>: it needs a persistent WebSocket
          server, so it runs locally in about two minutes (see below).
        </p>
      </section>

      <section>
        <h3>Try it (2 minutes, no deploy)</h3>
        <pre className="code-block"><code>{`git clone https://github.com/Ayush-G09/tickrate.git
cd tickrate && npm install

npm test                      # 84 tests: sim core, server, prediction, interpolation, lag comp

npm run dev -w apps/server &  # the authoritative WebSocket server, :8787
npm run dev -w apps/client    # the game client, :5173 — open it in two tabs to play

# apps/server/scripts/verify-server.mts forks a REAL server process and proves it
# bit-identical to the pure sim core, over real WebSockets with irregular timing:
npm run verify:server -w apps/server`}</code></pre>
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
        <TickrateDiagram />
      </section>

      <section>
        <h3>How it was built</h3>
        <Flows />
      </section>

      <section>
        <h3>Decisions worth explaining</h3>
        <ul className="decisions">
          <li><strong>One simulation function, used everywhere.</strong> The client's prediction, the server's authority, and every proof script all call the exact same `stepWorld`. There is no second copy of the movement or hit-detection logic to drift out of sync with the first.</li>
          <li><strong>Clients send input, never position.</strong> The server is authoritative by construction, not by policy — there is nothing a client can send that directly moves anyone.</li>
          <li><strong>Reconciliation rebuilds, it doesn't patch.</strong> On every snapshot the client throws its prediction away and starts over from the server's word, replaying only its own unacknowledged inputs. It never tries to diff against the old prediction or guess how many times the server internally repeated an input.</li>
          <li><strong>Lag compensation lives outside the deterministic core, on purpose.</strong> A rewound hit depends on server-only history a client replaying `stepWorld` alone could never reproduce — it is a stated, deliberate exception to "the same function everywhere," not an oversight.</li>
        </ul>
      </section>

      <section>
        <h3>Bugs testing caught</h3>
        <ul className="decisions">
          <li><strong>The rocket weapon was unreachable.</strong> It existed in the simulation from Phase 1 but no input field ever selected it — mutation testing flagged the branch as never covered, which is how dead code was found instead of assumed absent.</li>
          <li><strong>A verification script's own bug, not the server's.</strong> The first version of the real-process proof assumed the client observed the server's tick 0, but the server starts ticking before any socket connects — so early broadcasts were missed and tick counts mismatched. Fixed by anchoring the replay to the first captured broadcast instead of an assumed starting point.</li>
          <li><strong>A convergence test that could never actually converge.</strong> The first network-harness scenario just stopped sending input once the player "stopped moving" — but the server holds the last input it received forever until told otherwise, so the world never reached a fixed point. Fixed by having the client keep sending its (now idle) input every tick, exactly like a real client would.</li>
          <li><strong>A lag-compensation test that proved nothing.</strong> The target moved along the shooter's aim line instead of across it, so every position was still a hit either way. Fixed by moving the target across the line — which is also what caught the second bug, an off-by-one in which tick got recorded as "what the shooter saw."</li>
        </ul>
      </section>

      <section>
        <h3>Proof it works</h3>
        <div className="stat-row">
          <div><span className="big">84</span><span className="mono">automated tests, 7 files</span></div>
          <div><span className="big">100%</span><span className="mono">determinism: replayed input sequence, bit-identical world</span></div>
          <div><span className="big">4/4</span><span className="mono">real server process, real WebSockets, bit-identical to the core</span></div>
          <div><span className="big">miss → hit</span><span className="mono">same shot, same latency, lag comp off vs. on</span></div>
        </div>
        <p className="fine">
          Every number comes from a script or test actually included in the repo — the determinism replay in
          <code> step.test.ts</code>, the real forked-process proof in <code>verify-server.mts</code>, the network-simulated
          convergence harness in <code>convergence.test.ts</code>, the decisive before/after in <code>lagCompensation.test.ts</code>
          — not a claim about what the design should achieve.
        </p>
      </section>

      <section>
        <h3>Stack</h3>
        <dl className="stack">
          <div><dt className="mono">Core</dt><dd>TypeScript, framework-free deterministic simulation (`@tickrate/sim`)</dd></div>
          <div><dt className="mono">Server</dt><dd>Node.js, `ws`, an authoritative tick loop with position history for lag compensation</dd></div>
          <div><dt className="mono">Client</dt><dd>Plain Canvas 2D (no React — a game loop fights a render-on-state-change model), client-side prediction + snapshot interpolation, Vite</dd></div>
          <div><dt className="mono">Quality</dt><dd>Vitest (84 tests), a deterministic latency/packet-loss network harness, mutation testing (Stryker) on the sim core and the server's lag-comp path, a real forked-process end-to-end verification script</dd></div>
        </dl>
      </section>

      <section>
        <h3>Honest limits</h3>
        <p className="fine">
          Not deployed: it needs a persistent WebSocket server, which rules out the platforms the rest of this
          portfolio's backends already avoid for the same reason — run it locally instead. Gameplay is deliberately
          thin (deathmatch, a rifle and a rocket, knockback) so effort went into proving the netcode rather than
          building game modes — King of the Hill, capture-the-flag, destructible cover, and timed pickups were
          planned and are not built. There is a death flash on a kill, not a full cinematic killcam replay. Lag
          compensation trusts a client's claimed rewind tick up to a fixed maximum window, with no check against that
          client's actually measured round-trip time — a real anti-cheat layer would add one. Mutation testing on the
          simulation core and the server's lag-comp path lands at 56–85% depending on the file, not 100%; the
          remaining survivors are boundary cases and one field-omission that happens to be behaviourally harmless
          under JavaScript's falsy-value semantics, judged not worth chasing further.
        </p>
      </section>
    </>
  )
}
