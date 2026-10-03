import { useRef, useState } from 'react'

const FEATURES = [
  ['A real autodiff engine, not a wrapper', 'Every tensor op — matmul, add (with bias broadcasting), ReLU, softmax — wires up its own backward pass and parent tensors as it runs; `backward()` is nothing more than a topological sort followed by each node running its own local gradient rule in reverse order.'],
  ['Checked against finite differences', 'The decisive test for any autodiff engine: a full 2-layer MLP\'s analytic gradients from `backward()` are compared against independently-computed finite-difference gradients, matching to 4 decimal places on every parameter.'],
  ['Trained on real MNIST, not a toy set', 'A real, balanced 6,000-image subset of actual handwritten digits, trained via real mini-batch SGD — 94.3% test accuracy, reached in 18 epochs and about 15 seconds, in plain hand-written JavaScript.'],
  ['Proven against two different "didn\'t learn" baselines', 'The trained network is compared against a majority-class baseline (10.0%, guess the most common digit) AND the identical untrained architecture with random weights (7.8%) — isolating the win to training itself, not the network shape.'],
  ['MNIST-style input normalization', 'Real MNIST images are size-normalized: each digit scaled to fill a consistent region and centered in the frame. The live demo replicates that — finding your drawing\'s bounding box and re-centering/scaling it — rather than naively downsampling whatever you happened to draw.'],
  ['Inference entirely in your browser', 'The trained weights ship as a small JSON file; classification runs client-side through the exact same `@cortex/tensor` / `@cortex/nn` code the training script used — nothing is sent to a server.'],
]

const FLOWS = [
  {
    id: 'autodiff', label: 'The autodiff engine',
    steps: [
      ['A Tensor with a memory', 'Every op that builds a new tensor from existing ones records its parent tensors and a `_backward` closure — the entire mechanism by which gradients flow is just chaining a handful of small, individually-obvious local derivatives.'],
      ['A real bug this caught', 'In `add()`\'s bias-broadcast path, the backward closure referenced an `out` variable via a `var` hoisting trick that was never actually assigned — every bias gradient would have silently been `undefined` at runtime. Caught before it ever ran, by the finite-difference check.'],
      ['Fused softmax + cross-entropy', 'Computed together because the combined gradient is `(softmax(logits) - one_hot(label)) / batchSize` — simpler and far more numerically stable than differentiating through a standalone softmax into a standalone log-loss.'],
    ],
  },
  {
    id: 'training', label: 'Training on real MNIST',
    steps: [
      ['A real, saved, reproducible dataset', 'A balanced 6,000-train/1,500-test MNIST subset, quantized to bytes and base64-encoded into a single JSON file — so "the exact data a run trained on" is a saved, inspectable artifact, not silently redrawn differently each time.'],
      ['Plain mini-batch SGD', 'No momentum, no Adam — `param -= lr * grad`, deliberately the simplest possible optimizer, because the point is proving the from-scratch autodiff + training loop works end to end, not chasing convergence speed.'],
      ['The actual, unscripted result', '94.3% test accuracy after 18 epochs (14.6s) — against a 10.0% majority-class baseline and 7.8% for the same untrained architecture.'],
    ],
  },
  {
    id: 'demo', label: 'The live demo',
    steps: [
      ['Draw, or try a real test digit', 'A canvas for freehand drawing, plus 30 bundled, labeled, real MNIST test images (never seen during training) so a visitor can see confident correct classification without needing to draw well.'],
      ['A real bug found by using it', 'Clicking a sample digit originally rendered it onto the canvas and re-downsampled it through the same blur pipeline as freehand drawing — lossy enough to flip some correct predictions. Fixed by classifying bundled samples from their original pixels directly.'],
      ['Centered, not just downsampled', 'The drawing is cropped to its own bounding box and re-centered/scaled before being fed to the network — the fix for a plain vertical bar (an unambiguous "1") that was misclassified as "5" purely because it didn\'t fill the canvas the way training images do.'],
    ],
  },
]

function FlowTabs() {
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
            role="tab" id={`ctab-${f.id}`} aria-selected={active === f.id} aria-controls="cflow-panel" tabIndex={active === f.id ? 0 : -1}
            className={active === f.id ? 'on' : ''} onClick={() => setActive(f.id)} onKeyDown={(e) => move(e, i)}
          >{f.label}</button>
        ))}
      </div>
      <ol className="steps" role="tabpanel" id="cflow-panel" aria-labelledby={`ctab-${flow.id}`}>
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

export default function CortexDetails() {
  return (
    <>
      <section>
        <h3>What it is</h3>
        <p className="lead-p">
          A neural network built entirely from scratch — matrix math, backpropagation, gradient descent — with no
          PyTorch, no TensorFlow, nothing that computes a gradient except this repo's own code. It trains a real
          classifier on real MNIST handwritten digits, then lets you draw your own digit and watch it classify live,
          in your browser. <strong>Live</strong>: draw a digit above, or try one of the bundled real test digits.
        </p>
      </section>

      <section>
        <h3>Try it</h3>
        <p className="fine">The live demo above runs the trained network directly in your browser — nothing is sent to a server, and no signup or key is needed.</p>
        <pre className="code-block"><code>{`git clone https://github.com/Ayush-G09/cortex.git
cd cortex && npm install

npm test                           # 15 tests: autodiff gradient checks, training loop proofs

npm run prepare-data -w apps/train # draws a real, balanced MNIST subset
npm run train -w apps/train        # real backprop training — ~94% test accuracy in ~15s

npm run dev -w apps/web            # the live draw-and-classify demo, :5176`}</code></pre>
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
        <h3>How it was built</h3>
        <FlowTabs />
      </section>

      <section>
        <h3>Decisions worth explaining</h3>
        <ul className="decisions">
          <li><strong>Proven against finite differences, not just "it trains."</strong> An autodiff engine that merely produces a falling loss curve could still have a subtly wrong gradient somewhere that happens not to break convergence. Checking `backward()`'s output against independently-computed finite-difference gradients, to 4 decimal places, across a full matmul → ReLU → matmul → softmax-cross-entropy chain, is the standard that actually rules that out.</li>
          <li><strong>Two baselines, not one.</strong> Majority-class guessing (10.0%) proves the task isn't trivial; the identical untrained architecture (7.8%) proves the win came from training, not from the network shape alone — the same "the baseline has to actually lose" discipline as every other project in this portfolio.</li>
          <li><strong>MNIST-style normalization in the demo, not just the training pipeline.</strong> Training data is centered and size-normalized by convention; a naive browser demo that just downsamples whatever you drew silently breaks that assumption the instant a digit doesn't fill the canvas — found directly by testing, not assumed.</li>
          <li><strong>Sample digits classified from their original pixels.</strong> Routing a "known good" bundled test digit through the same lossy canvas round-trip as freehand drawing defeats the point of a known-good demo; classifying it from its saved pixel array instead keeps the "try a real digit" feature honest.</li>
        </ul>
      </section>

      <section>
        <h3>Bugs testing caught</h3>
        <ul className="decisions">
          <li><strong>A silently-undefined bias gradient.</strong> `Tensor.add()`'s bias-broadcast backward closure referenced an `out` variable assigned via a `var` hoisting trick that was never actually assigned — every bias gradient would have been `undefined` at runtime. Caught before it ever ran, while writing the finite-difference check, not after a confusing training failure.</li>
          <li><strong>A lossy sample-digit pipeline.</strong> Clicking a bundled "real test digit" rendered it onto the drawing canvas and reclassified it through the same blur-and-downsample path as freehand drawing — lossy enough to flip a correct 7 into a wrong "8" at 87% confidence. Found by comparing the live app's prediction against a from-scratch reimplementation of the forward pass run directly on the sample's raw pixels in the console.</li>
          <li><strong>Missing input normalization.</strong> A plain vertical bar — the clearest possible "1" — classified as "5" at 65% confidence, because the canvas was downsampled directly with no bounding-box crop/center/scale step, unlike every image MNIST was actually trained on. Fixed, and re-verified: the identical shape now classifies correctly at 97.3%.</li>
        </ul>
      </section>

      <section>
        <h3>Proof it works</h3>
        <div className="stat-row">
          <div><span className="big">15</span><span className="mono">automated tests, 2 packages</span></div>
          <div><span className="big">4 d.p.</span><span className="mono">analytic vs. finite-difference gradient match</span></div>
          <div><span className="big">94.3%</span><span className="mono">real MNIST test accuracy</span></div>
          <div><span className="big">10.0% / 7.8%</span><span className="mono">majority-baseline / untrained-net accuracy</span></div>
        </div>
        <p className="fine">
          Those numbers are from an actual training run — <code>npm run train -w apps/train</code> — on a real,
          saved, balanced 6,000-image MNIST subset: 18 epochs, 14.6 seconds, plain mini-batch SGD, no GPU, no
          framework.
        </p>
      </section>

      <section>
        <h3>Stack</h3>
        <dl className="stack">
          <div><dt className="mono">Tensor / autodiff</dt><dd>TypeScript, framework-free — matmul, add (bias broadcasting), ReLU, softmax, fused softmax-cross-entropy, each with a hand-written backward pass</dd></div>
          <div><dt className="mono">Network / training</dt><dd>`Linear` + `MLP` + plain mini-batch `SGD`, He-initialized weights, seeded RNG for reproducible runs</dd></div>
          <div><dt className="mono">Data</dt><dd>Real MNIST via the `mnist` npm package, quantized and base64-encoded into a saved, reproducible dataset file</dd></div>
          <div><dt className="mono">Demo</dt><dd>Vite + vanilla TypeScript, canvas drawing with MNIST-style bounding-box centering, inference entirely client-side</dd></div>
          <div><dt className="mono">Quality</dt><dd>Vitest (15 tests): op correctness, hand-derived gradient checks, a full finite-difference gradient check, and decisive train-vs-baseline proofs</dd></div>
          <div><dt className="mono">Hosting</dt><dd>Vercel — static build, pre-trained weights shipped as a JSON asset, no backend at all</dd></div>
        </dl>
      </section>

      <section>
        <h3>Honest limits</h3>
        <p className="fine">
          The autodiff engine is 2D-matrix-only (no arbitrary tensor ranks, no convolutions) — enough for a plain
          MLP, not a CNN. Training runs on a 6,000-image subset rather than the full 60,000-image MNIST set, traded
          for a faster, more iterable training loop; accuracy would likely climb further on the full set. The
          optimizer is plain SGD with no momentum or adaptive learning rate, which is why training needs a fairly
          high learning rate (0.5) and a hand-picked epoch count rather than converging on its own schedule.
        </p>
      </section>
    </>
  )
}
