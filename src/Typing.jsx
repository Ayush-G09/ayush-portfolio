import { useEffect, useState } from 'react'

const PHRASES = [
  'Builds the interface, and the engine behind it.',
  'Ships React on the front and Node.js behind it.',
  'Turns rough ideas into full-stack products.',
]

// Types a phrase, holds, deletes it, then moves to the next. The full first
// phrase is exposed to screen readers and used when motion is reduced.
export default function Typing() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const [text, setText] = useState(reduced ? PHRASES[0] : '')

  useEffect(() => {
    if (reduced) return
    let p = 0, n = 0, dir = 1, t
    const step = () => {
      const phrase = PHRASES[p]
      n += dir
      setText(phrase.slice(0, n))
      let delay = dir === 1 ? 55 : 22
      if (dir === 1 && n === phrase.length) { dir = -1; delay = 2600 }
      else if (dir === -1 && n === 0) { dir = 1; p = (p + 1) % PHRASES.length; delay = 400 }
      t = setTimeout(step, delay)
    }
    t = setTimeout(step, 500)
    return () => clearTimeout(t)
  }, [reduced])

  return (
    <h1 aria-label={PHRASES[0]} className="typing">
      <span aria-hidden="true">{text}</span>
      <span aria-hidden="true" className="caret blink" />
    </h1>
  )
}
