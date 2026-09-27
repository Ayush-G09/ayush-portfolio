import { useRef, useState } from 'react'
import { Arrow, Box, Label } from './Diagram'

const FEATURES = [
  ['Scored, not guessed', 'A 34-case golden set with 27 planted, verified problems and 7 clean changes measures precision, recall and F1 for any reviewer, from a pattern-matching baseline up to a real model.'],
  ['Streaming, line-accurate comments', 'The model streams JSON as it writes; each comment is checked against the real diff before it can reach anyone, so a made-up line is dropped, not posted.'],
  ['Runs for free', 'A free Gemini key, or a fully local Ollama model with no key at all and nothing leaving the machine. Both are measured, not assumed.'],
  ['GitHub Action, no server needed', 'Drop one workflow file in a repo and it reviews every pull request with the run’s own token. Forked PRs are skipped with an explanation, never silently.'],
  ['Live dashboard that learns', 'Comments stream onto a page as they’re written. Dismissing one teaches the reviewer not to repeat that kind of comment on this project; accepting can undo a bad dismissal.'],
  ['Command line and pre-push hook', '`npm run review` reviews your branch, staged changes, or a piped diff, and can fail your push on a high-severity comment.'],
]

const FLOWS = [
  {
    id: 'diff', label: 'Turning a diff into safe comments',
    steps: [
      ['Parser', 'A unified diff becomes files, hunks and exact old/new line numbers, verified by a property test: 300 random edits, diffed by an independent library, parsed, then reapplied — the result must match the real file exactly, line for line.'],
      ['Prompt', 'Every line of the new file is shown with its number, so the model can only cite lines that exist. Lock files, generated output and pure deletions are skipped and reported, not silently ignored.'],
      ['Streaming parser', 'Complete `{...}` objects are pulled out of the model’s text as it arrives, ignoring prose, code fences and formatting around them — identical result wherever the text happens to be cut.'],
      ['Placement check', 'Every comment is checked against the diff: kind, message, and a line the diff actually contains. A comment on a made-up place is dropped and counted, never shown to anyone.'],
    ],
  },
  {
    id: 'measure', label: 'Proving it is actually better',
    steps: [
      ['Golden set', '34 small, real-looking pull requests: 27 planted problems across six kinds (bug, security, error-handling, performance, tests, maintainability), 7 clean changes, and traps — an `eval` mentioned only in a comment, a fixture password — that should NOT be flagged.'],
      ['Scoring', 'Comments are matched to planted problems one-to-one by file, kind and overlapping lines, so spamming one line cannot score twice and a wrong-line comment gets no credit.'],
      ['Baseline first', 'A pattern-matching reviewer with no understanding of code sets the number to beat: 86% precision, 44% recall, 59% F1. Anything smarter has to actually be smarter.'],
      ['Real runs, real numbers', 'A free hosted model scored 100% precision on every sampled request. A 3B local model, chosen to fit a 4 GB GPU, scored 37% F1 — noisier than the baseline, a false alarm on every clean case. Both numbers are in the repo, not just claimed.'],
    ],
  },
  {
    id: 'ship', label: 'Getting it onto a pull request',
    steps: [
      ['GitHub Action', 'Runs with the workflow’s own token: no GitHub App, no private key, no server. A push cancels the run still reviewing the old commit.'],
      ['Self-hosted server (optional)', 'A webhook, a queue (one job per pull request, newest commit wins), and the live dashboard, for teams that want a GitHub App and a standing server instead.'],
      ['Posting', 'One GitHub review with inline comments on the exact lines. If GitHub refuses to place a comment, it is listed in the summary instead of silently lost. A model outage is posted as "incomplete", never as a quiet "nothing found".'],
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
            role="tab" id={`rtab-${f.id}`} aria-selected={active === f.id} aria-controls="rflow-panel" tabIndex={active === f.id ? 0 : -1}
            className={active === f.id ? 'on' : ''} onClick={() => setActive(f.id)} onKeyDown={(e) => move(e, i)}
          >{f.label}</button>
        ))}
      </div>
      <ol className="steps" role="tabpanel" id="rflow-panel" aria-labelledby={`rtab-${flow.id}`}>
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

function RedlineDiagram() {
  return (
    <figure className="diagram">
      <div className="diagram-scroll">
        <svg viewBox="0 0 980 400" role="img" aria-labelledby="rd-title rd-desc" xmlns="http://www.w3.org/2000/svg">
          <title id="rd-title">Redline architecture</title>
          <desc id="rd-desc">
            A GitHub Action (or a self-hosted server) gets a pull request's diff, sends it in pieces to a language model, checks every
            comment against the real diff, then posts one GitHub review. The same core is shared by a command line tool, an evaluation
            harness that scores reviewer quality, and a live dashboard that streams comments and learns from accept and dismiss.
          </desc>
          <defs>
            <marker id="dg-head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" className="dg-tip" /></marker>
            <marker id="dg-head-start" viewBox="0 0 10 10" refX="2" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M10 0L0 5L10 10z" className="dg-tip" /></marker>
          </defs>

          <rect className="dg-zone" x="16" y="16" width="280" height="368" rx="14" />
          <text className="dg-zone-title" x="32" y="42">GitHub</text>
          <rect className="dg-zone" x="332" y="16" width="304" height="368" rx="14" />
          <text className="dg-zone-title" x="348" y="42">Redline (Action or server)</text>
          <rect className="dg-zone" x="672" y="16" width="292" height="368" rx="14" />
          <text className="dg-zone-title" x="688" y="42">Shared core</text>

          <Box x="36" y="70" w="240" h="72" title="Pull request" lines={['opened, pushed to,', 'or made ready for review']} />
          <Box x="36" y="160" w="240" h="72" title="Webhook / Action run" lines={['gives the diff and', 'a token to post with']} />
          <Box x="36" y="250" w="240" h="72" title="One posted review" lines={['inline comments on', 'real lines of the diff']} />
          <Arrow d="M156 142 V160" />
          <Arrow d="M156 232 V250" both />

          <Box x="352" y="70" w="264" h="72" title="Diff parser" lines={['files, hunks, exact', 'old/new line numbers']} tone="accent" />
          <Box x="352" y="160" w="264" h="72" title="Reviewer" lines={['prompts the model,', 'streams and checks answers']} />
          <Box x="352" y="250" w="264" h="72" title="Formatter" lines={['one review, or a', 'summary if inline fails']} />
          <Arrow d="M484 142 V160" />
          <Arrow d="M484 232 V250" />
          <Arrow d="M300 106 H352" both />
          <Arrow d="M300 286 H352" both />

          <Box x="692" y="70" w="252" h="72" title="Model client" lines={['Gemini · Ollama · Claude', 'one small interface']} tone="accent" />
          <Box x="692" y="160" w="252" h="72" title="Eval harness" lines={['34 cases, scores', 'precision / recall / F1']} />
          <Box x="692" y="250" w="252" h="72" title="Live dashboard" lines={['streams comments,', 'learns from dismissals']} />
          <Arrow d="M616 106 H692" both />
          <Arrow d="M818 232 V250" dashed />
          <text className="dg-sub" x="692" y="344">Also used by: the command line reviewer and pre-push hook</text>
        </svg>
      </div>
      <figcaption className="muted">
        Solid arrows are the live path of one review; the dashed one is the dashboard reading from the same core. The command line tool
        and the evaluation harness reuse every box in the right-hand column.
      </figcaption>
    </figure>
  )
}

export default function RedlineDetails() {
  return (
    <>
      <section>
        <h3>What it is</h3>
        <p className="lead-p">
          An AI code reviewer for GitHub pull requests that measures its own quality instead of asking you to trust it. It
          streams comments as it writes them, only ever comments on lines that are really in the diff, and runs for free
          &mdash; a free Gemini key, or a local model with no key at all. <strong>Not deployed publicly</strong>: try it by
          cloning the repo (a minute, see below) or reading the code.
        </p>
      </section>

      <section>
        <h3>Try it (2 minutes, no deploy)</h3>
        <pre className="code-block"><code>{`git clone https://github.com/Ayush-G09/redline.git
cd redline && npm install

# free hosted model — get a key at https://aistudio.google.com/apikey, then:
echo "GEMINI_API_KEY=..." > .env
npm run review              # reviews this branch against main
npm run eval -- --detail    # score the reviewer against 34 known cases

# or fully local, no key at all:
# install Ollama, then: ollama pull qwen2.5-coder:3b
REDLINE_PROVIDER=ollama npm run review

npm start                   # the GitHub App server + the live dashboard shown above`}</code></pre>
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
        <RedlineDiagram />
      </section>

      <section>
        <h3>How it flows</h3>
        <Flows />
      </section>

      <section>
        <h3>Decisions worth explaining</h3>
        <ul className="decisions">
          <li><strong>Correctness first, model second.</strong> The diff parser and the scoring logic were built and tested against a simulator before any model was involved, the same way I built Depth’s order book. A pretty reviewer that cites the wrong line is worse than a plain one.</li>
          <li><strong>A dismissal can only make the reviewer quieter, never louder.</strong> Dismissing teaches "don’t say this again"; it never adds a comment. A bad dismissal costs a missed comment, not a wrong one.</li>
          <li><strong>Free by default, honestly measured.</strong> GitHub Models existed when I first planned this and was retired days later, mid-build. Rather than assume a provider would still be free, the client layer supports three, and the README’s numbers come from real runs I watched fail and retried, not from documentation.</li>
          <li><strong>The Action needs no server.</strong> It posts using the workflow run’s own permissions, so there is nothing to host, and a fork’s pull request — which GitHub gives no write access — is skipped with an explanation instead of failing confusingly.</li>
        </ul>
      </section>

      <section>
        <h3>Bugs testing (and actually running it) caught</h3>
        <ul className="decisions">
          <li><strong>Google retired the free model API I’d planned around, mid-project.</strong> A documented "free tier" turned out to be retired the week I read about it. Caught by actually trying to call it, not by reading docs — the whole provider layer was rebuilt around Gemini and a local Ollama model instead.</li>
          <li><strong>A free-tier model hung with no error for up to 90 seconds.</strong> The client’s timeout was cut to 45s and the default model switched once real runs showed which one was reliable.</li>
          <li><strong>A late dashboard viewer saw the pull request’s key twice instead of its title.</strong> Titles were only ever sent as a live event, never stored; a viewer connecting after a review had already run never saw one. Caught by actually loading the page, fixed by having the dashboard remember titles for its snapshot.</li>
        </ul>
      </section>

      <section>
        <h3>Proof it works</h3>
        <div className="stat-row">
          <div><span className="big">265</span><span className="mono">automated tests</span></div>
          <div><span className="big">34</span><span className="mono">scored golden-set cases</span></div>
          <div><span className="big">100%</span><span className="mono">precision, free hosted model, sampled runs</span></div>
          <div><span className="big">37%</span><span className="mono">F1, free local model (no key)</span></div>
        </div>
        <p className="fine">
          The baseline (pattern rules, no model) scores 86% precision / 44% recall / 59% F1 — the number any real model has
          to beat. Every number here is from a run against the same 34-case set in the repo, not a claim.
        </p>
      </section>

      <section>
        <h3>Stack</h3>
        <dl className="stack">
          <div><dt className="mono">Core</dt><dd>TypeScript, framework-free (diff parsing, scoring, feedback learning)</dd></div>
          <div><dt className="mono">Models</dt><dd>Gemini (free), Ollama (local, no key), Anthropic — one small streaming interface</dd></div>
          <div><dt className="mono">Server</dt><dd>Node.js, ws (WebSocket), a GitHub App webhook and REST API</dd></div>
          <div><dt className="mono">Dashboard</dt><dd>Plain HTML/CSS/JS over WebSocket — no build step</dd></div>
          <div><dt className="mono">Quality</dt><dd>Vitest (265 tests), a 34-case scored evaluation harness, mutation testing on the trust-critical logic</dd></div>
        </dl>
      </section>

      <section>
        <h3>Honest limits</h3>
        <p className="fine">
          Not deployed: it runs where you run it (your machine, or a GitHub Action in your own repo). A "dismissal" only
          suppresses a pattern for the project that dismissed it, and needs two dismissals before it takes effect. A local
          3B model is measurably not good enough yet to trust unattended — the README says so plainly, with the number.
        </p>
      </section>
    </>
  )
}
