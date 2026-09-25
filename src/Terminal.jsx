import { useEffect, useRef, useState } from 'react'

const jump = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

const COMMANDS = {
  help: () => ['Available commands:', '  whoami    who is this', '  skills    tech stack', '  projects  things I built', '  contact   get in touch', '  goto <section>  about|skills|experience|projects|contact', '  clear     clear screen'],
  whoami: () => ['Ayush Gokhle — full-stack engineer, Indore.', 'React / Vue.js on Node.js + TypeScript. 3 years in.'],
  skills: () => ['frontend  React, Next.js, Vue.js, React Native, Angular', 'backend   Node.js, Express, GraphQL, SQL, MongoDB', 'devops    Jest, CI/CD, Docker, Kubernetes', 'ai/web3   OpenAI, LangChain, Pinecone, Solidity'],
  projects: () => ['AskQ       AI-powered PDF Q&A platform', 'LIP Token  GameFi app with on-chain NFT minting', '-> scrolling to projects...'],
  contact: () => ['email     ayushgokhle@gmail.com', 'linkedin  /in/ayush-gokhle-343521224', 'phone     +91 9977424526'],
  sudo: (args) => (args.join(' ') === 'hire ayush' ? ['[sudo] permission granted.', 'Excellent decision. Opening your mail client...'] : ['nice try. usage: sudo hire ayush']),
}

export default function Terminal() {
  const [lines, setLines] = useState([
    { t: 'out', s: 'Welcome. Type "help" to see what I can do.' },
  ])
  const [value, setValue] = useState('')
  const [history, setHistory] = useState([])
  const [hIdx, setHIdx] = useState(-1)
  const body = useRef(null)
  const input = useRef(null)

  useEffect(() => {
    if (body.current) body.current.scrollTop = body.current.scrollHeight
  }, [lines])

  const run = (raw) => {
    const [cmd, ...args] = raw.trim().split(/\s+/)
    const echo = { t: 'in', s: raw }
    if (!cmd) return setLines((l) => [...l, echo])
    if (cmd === 'clear') return setLines([])
    if (cmd === 'goto') {
      const ok = ['about', 'skills', 'experience', 'projects', 'contact'].includes(args[0])
      if (ok) jump(args[0])
      return setLines((l) => [...l, echo, { t: 'out', s: ok ? `-> ${args[0]}` : 'usage: goto about|skills|experience|projects|contact' }])
    }
    const fn = COMMANDS[cmd]
    if (!fn) return setLines((l) => [...l, echo, { t: 'err', s: `command not found: ${cmd}. Try "help".` }])
    const out = fn(args).map((s) => ({ t: 'out', s }))
    setLines((l) => [...l, echo, ...out])
    if (cmd === 'projects') setTimeout(() => jump('projects'), 500)
    if (cmd === 'sudo' && args.join(' ') === 'hire ayush') setTimeout(() => { window.location.href = 'mailto:ayushgokhle@gmail.com?subject=Let%27s%20work%20together' }, 900)
  }

  const onKey = (e) => {
    if (e.key === 'Enter') {
      run(value)
      if (value.trim()) setHistory((h) => [value, ...h])
      setHIdx(-1)
      setValue('')
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const n = Math.min(hIdx + 1, history.length - 1)
      if (history[n] !== undefined) { setHIdx(n); setValue(history[n]) }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const n = hIdx - 1
      setHIdx(n)
      setValue(n < 0 ? '' : history[n])
    }
  }

  return (
    <div className="win term" onClick={(e) => { if (!e.target.closest('.term-chips')) input.current?.focus() }}>
      <div className="dots"><i /><i /><i /><span className="mono">ayush@portfolio ~ </span></div>
      <div className="body term-body" ref={body}>
        {lines.map((l, i) => (
          <div key={i} className={`tl-${l.t}`}>{l.t === 'in' ? <><span className="prompt">$</span> {l.s}</> : l.s}</div>
        ))}
        <div className="term-input">
          <span className="prompt">$</span>
          <input
            ref={input}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKey}
            spellCheck={false}
            autoComplete="off"
            aria-label="Terminal command input"
            placeholder="type help"
          />
        </div>
      </div>
      <div className="term-chips mono">
        {['help', 'skills', 'projects', 'contact'].map((c) => (
          <button key={c} type="button" onClick={() => run(c)}>{c}</button>
        ))}
      </div>
    </div>
  )
}
