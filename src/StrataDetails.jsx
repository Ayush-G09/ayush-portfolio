import { useRef, useState } from 'react'
import { Arrow, Box, Label } from './Diagram'

const FEATURES = [
  ['Hybrid retrieval, not just vector search', 'BM25 keyword search and cosine-similarity vector search, fused with Reciprocal Rank Fusion so two differently-scaled ranking signals can combine at all — implemented from scratch, not wired to a vector-search SaaS.'],
  ['An evaluation harness built into the engine itself', 'Faithfulness, answer relevancy, context precision and context recall — four LLM-judged quality metrics implemented from first principles (claim decomposition + LLM-judge, reverse-question-generation + embedding similarity, rank-weighted average precision) and scored against a 6-case golden set with distractor documents.'],
  ['Citations that are checked, not trusted', 'Every `[n]` in a generated answer is validated against the sources actually given to the model. A hallucinated citation is caught and reported, never silently accepted.'],
  ['Runs for free', 'A free Gemini API key, or a fully local Ollama model with nothing leaving the machine — the same free-first pattern as Redline, and both are what actually generated the answers on this page.'],
  ['A live, on-demand comparison', 'The "Run sample evaluation" button calls the real connected model to score hybrid retrieval against a naive keyword-overlap baseline, live, in the browser — not a canned number.'],
  ['Mutation-tested where it matters', 'The chunking, retrieval, and all four evaluation metrics were run against Stryker — deliberately broken versions of the trust-critical logic, to check the tests actually catch what they claim to.'],
]

const FLOWS = [
  {
    id: 'core', label: 'Chunking, embeddings, retrieval',
    steps: [
      ['Two chunking strategies', 'A fixed-size sliding window, and a structural chunker that merges consecutive paragraphs up to a size limit — splitting a single oversized paragraph on its own rather than ever producing one unsearchable giant chunk.'],
      ['Hybrid retrieval', 'BM25 keyword search and a cosine-similarity vector index are combined by Reciprocal Rank Fusion: each item’s score is the sum of 1/(k + rank) across whichever lists it appears in, which is what lets two differently-scaled ranking signals combine at all.'],
      ['A gap found by testing it', 'The BM25 formula was originally verified only by relative ranking (“does doc A outrank doc B?”) — which a broken, NaN-poisoned score could still coincidentally satisfy by insertion-order luck. Fixed by pinning exact numeric values against an independently-written reference calculation of the same formula.'],
    ],
  },
  {
    id: 'generation', label: 'Grounded generation',
    steps: [
      ['One small interface, three providers', 'Gemini (free), Ollama (fully local), and a fake deterministic client for tests — the reviewer/generator code is written and tested once against the fake before any real model is involved.'],
      ['Numbered sources, checked citations', 'Each retrieved chunk is shown to the model numbered; every `[n]` in its answer is then checked against that exact list. A citation to a source that was never given — confusion or invention, either way — is caught, not trusted.'],
      ['An end-to-end proof, fully offline', 'A `FakeLlmClient` and a deterministic hashing embedder make the whole chunk → embed → retrieve → prompt → parse pipeline runnable, and testable, with no network and no API key at all.'],
    ],
  },
  {
    id: 'eval', label: 'The evaluation harness',
    steps: [
      ['Four metrics, from first principles', 'Faithfulness and context recall decompose text into claims and check each against context via an LLM judge; answer relevancy reverse-generates questions from the answer and compares them to the real one by embedding similarity; context precision is mean average precision over the ranked, LLM-judged relevance of each retrieved chunk.'],
      ['A golden set with real distractors', '6 questions across 2 small corpora, each with documents that are topically related but not the answer — a retriever that can’t tell "remote work" from "vacation" fails visibly, not just in aggregate.'],
      ['A baseline that has to actually lose', 'A naive keyword-overlap-count retriever — no IDF, no semantic signal — sets the number hybrid retrieval has to beat, the same "baseline first" discipline as Redline’s scored golden set.'],
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
            role="tab" id={`stab-${f.id}`} aria-selected={active === f.id} aria-controls="sflow-panel" tabIndex={active === f.id ? 0 : -1}
            className={active === f.id ? 'on' : ''} onClick={() => setActive(f.id)} onKeyDown={(e) => move(e, i)}
          >{f.label}</button>
        ))}
      </div>
      <ol className="steps" role="tabpanel" id="sflow-panel" aria-labelledby={`stab-${flow.id}`}>
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

function StrataDiagram() {
  return (
    <figure className="diagram">
      <div className="diagram-scroll">
        <svg viewBox="0 0 980 360" role="img" aria-labelledby="st-title st-desc" xmlns="http://www.w3.org/2000/svg">
          <title id="st-title">Strata architecture</title>
          <desc id="st-desc">
            Documents are chunked and embedded into a hybrid index (BM25 + vector search, fused by RRF). A query
            retrieves ranked chunks, which are shown to an LLM to generate a checked, cited answer. The same
            retrieved chunks and generated answer feed the evaluation harness, which scores faithfulness, answer
            relevancy, context precision and context recall using the same LLM as judge.
          </desc>
          <defs>
            <marker id="dg-head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" className="dg-tip" /></marker>
          </defs>

          <rect className="dg-zone" x="16" y="16" width="284" height="328" rx="14" />
          <text className="dg-zone-title" x="32" y="42">Indexing</text>
          <rect className="dg-zone" x="332" y="16" width="284" height="328" rx="14" />
          <text className="dg-zone-title" x="348" y="42">Query</text>
          <rect className="dg-zone optional" x="648" y="16" width="316" height="328" rx="14" strokeDasharray="6 5" />
          <text className="dg-zone-title" x="664" y="42">Evaluation harness</text>

          <Box x="36" y="70" w="244" h="66" title="Chunker" lines={['fixed or structural']} tone="accent" />
          <Box x="36" y="152" w="244" h="66" title="Embedder" lines={['Gemini / hashing (offline)']} />
          <Box x="36" y="234" w="244" h="66" title="Hybrid index" lines={['BM25 + vector store']} tone="store" />
          <Arrow d="M158 136 V152" />
          <Arrow d="M158 218 V234" />

          <Box x="352" y="70" w="244" h="66" title="Hybrid retriever" lines={['BM25 + vector, fused by RRF']} tone="accent" />
          <Box x="352" y="152" w="244" h="66" title="Prompt + LLM" lines={['numbered sources, cited answer']} />
          <Box x="352" y="234" w="244" h="66" title="Citation check" lines={['every [n] validated']} tone="store" />
          <Arrow d="M474 136 V152" />
          <Arrow d="M474 218 V234" />
          <Arrow d="M300 103 H352" both />
          <Label x="326" y="90" lines={['query']} />

          <Box x="668" y="70" w="276" h="66" title="Faithfulness + recall" lines={['claims vs. context, LLM-judged']} />
          <Box x="668" y="152" w="276" h="66" title="Answer relevancy" lines={['reverse questions, embedding sim.']} />
          <Box x="668" y="234" w="276" h="66" title="Context precision" lines={['mean average precision, ranked']} />
          <Arrow d="M616 267 H668" dashed />
          <Label x="642" y="256" lines={['scores']} />
        </svg>
      </div>
      <figcaption className="muted">
        Solid arrows are the live query path; the dashed arrow is the evaluation harness reading the same retrieved
        chunks and generated answer the query path just produced — nothing about evaluation is a separate simulation.
      </figcaption>
    </figure>
  )
}

export default function StrataDetails() {
  return (
    <>
      <section>
        <h3>What it is</h3>
        <p className="lead-p">
          A RAG (retrieval-augmented generation) engine with an evaluation harness built directly into it — every
          piece (chunking, hybrid retrieval, grounded generation, four LLM-judged quality metrics) implemented from
          scratch rather than assembled from an existing framework. <strong>Live</strong>: try it below, or clone it
          and run it in about two minutes.
        </p>
      </section>

      <section>
        <h3>Try it</h3>
        <p className="fine">The live demo above lets you add a document, ask a question, and run a real evaluation against the connected model — no signup, no key needed on your end.</p>
        <pre className="code-block"><code>{`git clone https://github.com/Ayush-G09/strata.git
cd strata && npm install

npm test                       # 126 tests: chunking, retrieval, generation, all 4 eval metrics

npm run dev -w apps/server &   # the API, :8890 (needs GEMINI_API_KEY or a local Ollama)
npm run dev -w apps/web        # the UI, :5174

npm run eval -w apps/server    # runs the golden set for real, hybrid vs. naive, prints real numbers`}</code></pre>
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
        <StrataDiagram />
      </section>

      <section>
        <h3>How it was built</h3>
        <Flows />
      </section>

      <section>
        <h3>Decisions worth explaining</h3>
        <ul className="decisions">
          <li><strong>Built from first principles, not assembled from a framework.</strong> Chunking, hybrid retrieval, grounded generation and all four evaluation metrics are each a small, independently-designed module — no vector-search SaaS, no evaluation library, so every piece is something to actually reason about and test, not a black box wired together.</li>
          <li><strong>The evaluation harness is not a separate simulation.</strong> It scores the exact retrieved chunks and generated answer the query path just produced, via the same `StrataIndex.query`, with only the retrieval strategy swappable for the naive-baseline comparison.</li>
          <li><strong>A baseline that has to actually lose.</strong> Naive keyword-overlap-count has no IDF weighting and no semantic signal — real numbers from a real run (below) show it losing on 3 of 4 metrics, and honestly not on the 4th.</li>
          <li><strong>Citations are checked against reality, not assumed.</strong> The same "a claim must point at something real" discipline as Redline’s line-verified review comments, applied here to RAG citations instead of diff lines.</li>
        </ul>
      </section>

      <section>
        <h3>Bugs testing caught</h3>
        <ul className="decisions">
          <li><strong>BM25 scores that were silently NaN.</strong> A broken term-frequency accumulation produced NaN scores for every document, but a relative-ranking test still passed by insertion-order coincidence. Caught by pinning exact numeric values against an independently-written reference calculation of the same formula.</li>
          <li><strong>Several `.sort()` calls that could be no-ops.</strong> Test corpora happened to have the correct answer already first by insertion order, so a broken or disabled sort was indistinguishable from a working one. Fixed with cases where the correct answer is deliberately the last-inserted item.</li>
          <li><strong>A harness comparison that couldn’t actually fail.</strong> The retrieval-mode switch could be mutated to always pick one mode and an early test still passed, because a "greater than or equal" assertion is satisfied by plain equality, and the shared golden set’s clean documents happened to make both modes retrieve identically. Built a real adversarial case (exploiting BM25’s term-frequency reward vs. naive’s frequency-blind counting) that forces a genuine difference.</li>
        </ul>
      </section>

      <section>
        <h3>Proof it works</h3>
        <div className="stat-row">
          <div><span className="big">126</span><span className="mono">automated tests, 3 packages</span></div>
          <div><span className="big">91–98%</span><span className="mono">mutation score across core / rag / eval</span></div>
          <div><span className="big">100%</span><span className="mono">faithfulness, real hybrid run vs. 77.8% naive</span></div>
          <div><span className="big">91.7%</span><span className="mono">context precision, real hybrid run vs. 63.9% naive</span></div>
        </div>
        <p className="fine">
          Those numbers are from an actual run of <code>npm run eval</code> against a real local model (Ollama,
          qwen2.5-coder:3b) — hybrid retrieval won 3 of 4 metrics; naive keyword-overlap actually edged ahead on
          context recall (83.3% vs. 75.0%), stated here rather than hidden, because a suspiciously perfect sweep
          would be less credible than this.
        </p>
      </section>

      <section>
        <h3>Stack</h3>
        <dl className="stack">
          <div><dt className="mono">Core</dt><dd>TypeScript, framework-free (chunking, BM25, vector store, Reciprocal Rank Fusion)</dd></div>
          <div><dt className="mono">Generation</dt><dd>Gemini (free) and Ollama (local) behind one interface; citation-checked prompting</dd></div>
          <div><dt className="mono">Evaluation</dt><dd>Faithfulness, answer relevancy, context precision, context recall — implemented from scratch, scored against a 6-case golden set</dd></div>
          <div><dt className="mono">Server / UI</dt><dd>Node.js HTTP API; a plain Canvas-free HTML/TS UI with file upload, live citation highlighting, and an on-demand evaluation run</dd></div>
          <div><dt className="mono">Quality</dt><dd>Vitest (126 tests), mutation testing (Stryker) at 91–98% across all three packages, a real end-to-end run against a live local model</dd></div>
          <div><dt className="mono">Hosting</dt><dd>Vercel (UI) and Render (API) — deployed and live, not just runnable locally</dd></div>
        </dl>
      </section>

      <section>
        <h3>Honest limits</h3>
        <p className="fine">
          The in-memory document index resets on server restart or redeploy — there is no persistence layer yet.
          The free Gemini tier’s rate limit (15 requests/minute) means the "run sample evaluation" button, which
          makes many judged LLM calls per run, can itself hit that limit under heavy use; it is not backed by a paid
          plan. The hashing embedder used for fully-offline tests is bag-of-words, not semantically aware — real
          semantic matching depends on whichever real embedding model is configured. Mutation testing lands at
          91–98%, not 100%; the remaining survivors are confirmed-equivalent mutants or narrow prompt-string edge
          cases, the same standard applied throughout this portfolio.
        </p>
      </section>
    </>
  )
}
