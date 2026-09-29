import Terminal from './Terminal.jsx'
import ProjectModal from './ProjectModal.jsx'
import WhiteboardDetails from './WhiteboardDetails.jsx'
import DepthDetails from './DepthDetails.jsx'
import RedlineDetails from './RedlineDetails.jsx'
import BulwarkDetails from './BulwarkDetails.jsx'
import TickrateDetails from './TickrateDetails.jsx'
import { Clip } from './Media.jsx'
import Background from './Background.jsx'
import CommandPalette from './CommandPalette.jsx'
import Typing from './Typing.jsx'
import Constellation from './Constellation.jsx'
import ContactForm from './ContactForm.jsx'
import { RESUME_URL, EMAIL, LINKEDIN } from './config.js'
import { useState } from 'react'
import { Spotlight, Tilt, Timeline, Konami, Cursor, ProgressBar, useActiveSection, useReveal } from './effects.jsx'

const SECTIONS = ['hero', 'about', 'skills', 'experience', 'projects', 'contact']
const REVEAL = 'section.block h2, #about .lead, #about .profile, .constellation, .skills > div, .cards > *, .contact-info, .cform'

const skills = [
  { title: 'Frontend', tone: 'cobalt', items: ['React.js', 'Next.js', 'Vue.js', 'React Native', 'Angular', 'Redux / Zustand', 'TypeScript'],
    icon: <><rect x="3" y="4" width="18" height="16" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /></> },
  { title: 'Backend', tone: 'moss', items: ['Node.js', 'REST API Design', 'GraphQL', 'Express', 'SQL', 'MongoDB'],
    icon: <><rect x="3" y="4" width="18" height="6" rx="1.5" /><rect x="3" y="14" width="18" height="6" rx="1.5" /></> },
  { title: 'Testing & DevOps', items: ['Jest', 'CI/CD', 'Azure DevOps', 'Git', 'Vercel', 'Docker / Kubernetes'],
    icon: <><path d="M12 3l7 3v6c0 4-3 7-7 8-4-1-7-4-7-8V6l7-3z" /><path d="M9 12l2 2 4-4" /></> },
  { title: 'AI & Web3', items: ['OpenAI', 'LangChain', 'Pinecone', 'Web3.js', 'Solidity'],
    icon: <><rect x="7" y="7" width="10" height="10" rx="1.5" /><line x1="12" y1="2" x2="12" y2="7" /><line x1="12" y1="17" x2="12" y2="22" /><line x1="2" y1="12" x2="7" y2="12" /><line x1="17" y1="12" x2="22" y2="12" /></> },
]

const jobs = [
  { date: 'Sep 2025 —', now: true, role: 'Senior Consultant, Product Development — GenxAI', text: 'Owns end-to-end feature delivery: REST APIs and backend services in Node.js/TypeScript, paired with the React and Vue.js UI on top, plus client-side state with Redux/Zustand.' },
  { date: 'Apr 2025 — Sep 2025', role: 'SDE — AI Mantra', text: 'Built full-stack features across React Native and React.js on a modular Node.js backend, cutting development time by 40% and improving load speed by 25%.' },
  { date: 'Sep 2024 — Apr 2025', role: 'Freelance Full-Stack Developer', text: 'Shipped web and mobile apps with React.js, Vue.js and React Native on Node.js, reaching 50% code reuse; built a real-time AI-support chat app end to end.' },
  { date: 'Jan 2023 — Sep 2024', role: 'Full Stack Engineer — Quantive', text: 'Delivered 3+ cross-platform products with React.js, Angular and Flutter, cutting time-to-market by 45%; authored 35+ Jest test cases.' },
  { date: 'Sep 2022 — Jan 2023', role: 'Software Developer Intern — IBM', text: 'Built a multi-signature crypto wallet (React.js, TypeScript, Solidity) and a Web3.js integration framework supporting 1,000+ daily transactions with zero breaches.' },
]

const projects = [
  {
    url: 'github.com/Ayush-G09/tickrate', name: 'Tickrate', featured: true, Details: TickrateDetails,
    text: 'A multiplayer arena shooter built to prove out real authoritative-server netcode: client-side prediction, server reconciliation, snapshot interpolation, and lag-compensated hit detection — each phase proven by a decisive test, including a real forked server process replaying its own recorded input history bit-identically, and the same shot missing without lag compensation and hitting with it at the exact same simulated latency. A live debug panel lets you drag latency and packet-loss sliders into your own connection mid-game. Not deployed publicly; clone it and run it in about two minutes. 84 tests.',
    tags: ['TypeScript', 'WebSockets', 'Node.js', 'Canvas', 'Vite'],
    media: {
      poster: '/media/tickrate-action.png', alt: 'Tickrate: a player in the arena with the crosshair, health bar, and HUD showing tick sync at zero simulated latency',
      shots: [
        { src: '/media/tickrate-debug-panel.png', alt: 'Tickrate: the live netcode debug panel with simulated latency and packet loss dragged up, showing the predicted tick running ahead of the server-confirmed tick with 16 unacknowledged inputs in flight' },
        { src: '/media/tickrate-action.png', alt: 'Tickrate: a player in the arena with the crosshair, health bar, and HUD showing tick sync at zero simulated latency' },
      ],
    },
    links: [
      { label: 'Source', href: 'https://github.com/Ayush-G09/tickrate' },
    ],
  },
  {
    url: 'github.com/Ayush-G09/bulwark', name: 'Bulwark', featured: true, Details: BulwarkDetails,
    text: 'A rate limiter and job queue proven correct under real distributed load: atomic Redis scripts, real separate processes racing for a shared bucket, real Docker containers, a real crash recovered. A live dashboard shows every instance’s activity, relayed over Redis, on whichever one you open. Not deployed publicly; clone it and run it in about two minutes. 98 tests.',
    tags: ['TypeScript', 'Redis', 'Docker', 'Node.js', 'WebSockets'],
    media: {
      video: '/media/bulwark-demo.webm', poster: '/media/bulwark-dashboard.jpg', alt: 'Screen recording of the Bulwark live dashboard: rate-limit checks and a job being claimed and completed, all from a different instance than the one serving the page',
      shots: [
        { src: '/media/bulwark-dashboard.jpg', alt: 'Bulwark dashboard: a rate-limit policy being throttled, with allowed and refused requests, and a completed job, all from another instance' },
        { src: '/media/bulwark-dashboard-2.jpg', alt: 'Bulwark dashboard with more live activity accumulated: multiple jobs and rate-limit checks from another instance' },
      ],
    },
    links: [
      { label: 'Source', href: 'https://github.com/Ayush-G09/bulwark' },
    ],
  },
  {
    url: 'github.com/Ayush-G09/redline', name: 'Redline', featured: true, Details: RedlineDetails,
    text: 'An AI code reviewer for GitHub pull requests that measures its own quality: a 34-case scored test set, streamed line-accurate comments, and a live dashboard that learns from dismissals. Runs for free — a free Gemini key, or a fully local model with no key at all. Not deployed publicly; clone it and run it in about two minutes. 265 tests.',
    tags: ['TypeScript', 'Node.js', 'GitHub Actions', 'WebSockets', 'Gemini', 'Ollama'],
    media: {
      video: '/media/redline-demo.webm', poster: '/media/redline-dashboard.jpg', alt: 'Screen recording of the Redline live dashboard: comments streaming in for two pull requests, then one being dismissed',
      shots: [
        { src: '/media/redline-dashboard.jpg', alt: 'Redline dashboard: two pull requests being reviewed live, with streamed comments' },
        { src: '/media/redline-dashboard-2.jpg', alt: 'Redline dashboard after dismissing a comment, shown greyed out and marked dismissed' },
      ],
    },
    links: [
      { label: 'Source', href: 'https://github.com/Ayush-G09/redline' },
    ],
  },
  {
    url: 'depth-web-pearl.vercel.app', name: 'Depth', featured: true, Details: DepthDetails,
    media: {
      video: '/media/depth-demo.webm', poster: '/media/depth-terrain.jpg', alt: 'Screen recording of Depth: orbiting the live 3D order book, rewinding, and switching to 3D candles',
      shots: [
        { src: '/media/depth-terrain.jpg', alt: 'Depth: the live BTC order book as 3D terrain with whale walls as glowing spheres' },
        { src: '/media/depth-candles.jpg', alt: 'Depth: 3D trade candles with whale wall levels drawn across them' },
      ],
    },
    text: 'A live 3D view of a crypto order book. Real Binance data is turned into terrain you can orbit, with whale walls as glowing spheres, a 10-minute replay, 3D trade candles and price or whale alerts. The hard part is correctness: the book is rebuilt from a snapshot plus a stream of updates, resyncs on any gap, and only shows price ranges it can vouch for. 160+ tests, including a real-data check against Binance.',
    tags: ['React', 'TypeScript', 'Three.js', 'WebSockets', 'Node.js', 'Vite'],
    links: [
      { label: 'Live demo', href: 'https://depth-web-pearl.vercel.app' },
      { label: 'Source', href: 'https://github.com/Ayush-G09/depth' },
    ],
  },
  {
    url: 'whiteboard-api-two.vercel.app', name: 'Whiteboard', featured: true, Details: WhiteboardDetails,
    media: {
      video: '/media/whiteboard-demo.webm', poster: '/media/whiteboard-board.jpg', alt: 'Screen recording of Whiteboard: two people drawing on the same board at once',
      shots: [{ src: '/media/whiteboard-board.jpg', alt: 'Whiteboard: shapes drawn by two people, with a collaborator’s live cursor' }],
    },
    text: 'A multiplayer whiteboard. Draw together in real time with live cursors, follow mode and reactions; share view-only links the server actually enforces; scrub back through saved versions; export PNG or SVG. Edits merge conflict-free with Yjs on a NestJS WebSocket server, saved to Postgres, and it is built to run on several servers using Redis. 200+ tests, including two real Chrome windows driven end to end.',
    tags: ['React', 'TypeScript', 'Canvas 2D', 'Yjs', 'NestJS', 'WebSockets', 'PostgreSQL', 'Redis'],
    links: [
      { label: 'Live demo', href: 'https://whiteboard-api-two.vercel.app' },
      { label: 'Source', href: 'https://github.com/Ayush-G09/whiteboard' },
    ],
  },
]

const Dots = ({ colored }) => (
  <div className="dots">
    {colored ? <><i className="r" /><i className="y" /><i className="g" /></> : <><i /><i /><i /></>}
  </div>
)

const Title = ({ children }) => (
  <h2><span className="accent">&lt;</span>{children}<span className="accent">/&gt;</span></h2>
)

export default function App() {
  const [openProject, setOpenProject] = useState(null)
  const [menu, setMenu] = useState(false)
  const active = useActiveSection(SECTIONS)
  useReveal(REVEAL)
  const nav = (id) => ({ href: `#${id}`, onClick: () => setMenu(false), 'aria-current': active === id ? 'true' : undefined, className: active === id ? 'active' : undefined })
  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <Background />
      <Spotlight />
      {openProject && <ProjectModal project={openProject} onClose={() => setOpenProject(null)} />}
      <Cursor />
      <Konami />
      <ProgressBar />
      <CommandPalette />
      <header>
        <a href="#hero" className="brand"><i />Ayush Gokhle</a>
        <button className="burger" aria-label="Menu" aria-expanded={menu} aria-controls="site-nav" onClick={() => setMenu((m) => !m)}>
          <span /><span /><span />
        </button>
        <nav id="site-nav" className={menu ? 'open' : ''} aria-label="Primary">
          <a {...nav('about')}>About</a>
          <a {...nav('skills')}>Skills</a>
          <a {...nav('experience')}>Experience</a>
          <a {...nav('projects')}>Projects</a>
          <button className="kbd mono" onClick={() => { setMenu(false); window.dispatchEvent(new Event('open-palette')) }} aria-label="Ctrl K, open command palette">Ctrl K</button>
          <a href={RESUME_URL} download className="resume" onClick={() => setMenu(false)}>Résumé</a>
          <a {...nav('contact')} className={`cta ${active === 'contact' ? 'active' : ''}`}>Contact</a>
        </nav>
      </header>

      <main id="main">
      <section id="hero">
        <div className="hero-inner hero-anim">
          <div className="hero-copy">
            <Typing />
            <p>Full-stack engineer in Indore. Three years shipping React and Vue.js frontends on Node.js and TypeScript backends — API design through the pixels people touch.</p>
            <div className="row" style={{ marginTop: 40 }}>
              <a className="btn" href={`mailto:${EMAIL}`}>Email me</a>
              <a className="btn ghost" href={RESUME_URL} download>Download CV</a>
              <a className="btn ghost" href="#projects">See projects</a>
            </div>
            <div className="row mono" style={{ gap: 10, marginTop: 56 }}>
              <span className="pill">React · Vue.js</span>
              <span className="pill">Node.js · TypeScript</span>
              <span className="pill">Currently: NestJS, Kubernetes</span>
            </div>
          </div>

          <div className="hero-visual">
            <div className="glow" />
            <Terminal />
            <div className="win code float-anim">
              <Dots colored />
              <div className="body">
                <div><span style={{ color: '#C792EA' }}>function</span> <span style={{ color: '#82AAFF' }}>Profile</span>() {'{'}</div>
                <div style={{ paddingLeft: 16 }}><span style={{ color: '#C792EA' }}>return</span> (</div>
                <div style={{ paddingLeft: 32 }}><span className="accent">&lt;Card</span> <span style={{ color: '#82AAFF' }}>title</span>=<span style={{ color: '#8FB08A' }}>"Ayush"</span><span className="accent">&gt;</span></div>
                <div style={{ paddingLeft: 16 }}>);</div>
                <div>{'}'}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="block alt">
        <div className="wrap two">
          <div>
            <Title>About</Title>
            <p className="lead">Own end-to-end feature delivery across the stack: REST APIs and services in Node.js and TypeScript, then the React and Vue.js UI that sits on top. Comfortable with relational and NoSQL data, state management, automated testing, and CI/CD — and currently going deeper on NestJS, Docker and Kubernetes, and distributed system design.</p>
          </div>
          <div className="profile">
            <div className="dots center"><i /><i /><i /><span className="mono">profile.json</span></div>
            <div className="fields">
              <div><small className="mono">Location</small><span>Indore, Madhya Pradesh</span></div>
              <div><small className="mono">Role</small><span>Senior Consultant, Product Development — GenxAI</span></div>
              <div><small className="mono">Education</small><span>B.Tech, Computer Science — Shri Vaishnav Vidhyapeeth Vishwavidyalaya</span></div>
            </div>
          </div>
        </div>
      </section>

      <section id="skills" className="block">
        <div className="wrap">
          <Title>Skills</Title>
          <Constellation />
          <div className="skills">
            {skills.map((s) => {
              const color = s.tone ? `var(--${s.tone})` : 'var(--text-dim)'
              return (
                <div key={s.title}>
                  <div className="skill-head mono" style={{ color }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{s.icon}</svg>
                    {s.title}
                  </div>
                  <div className="chips">
                    {s.items.map((i) => <span key={i} className={`chip ${s.tone || ''}`}>{i}</span>)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section id="experience" className="block alt">
        <div className="wrap">
          <Title>Experience</Title>
          <Timeline>
            {jobs.map((j) => (
              <div key={j.role} className={`job ${j.now ? 'now' : ''}`}>
                <div className="date mono">
                  <span>{j.date}</span>
                  {j.now && <span className="now-tag"><i className="pulse-dot" />Present</span>}
                </div>
                <h3>{j.role}</h3>
                <p>{j.text}</p>
              </div>
            ))}
          </Timeline>
        </div>
      </section>

      <section id="projects" className="block">
        <div className="wrap">
          <Title>Projects</Title>
          <div className="cards">
            {projects.map((p) => (
              <Tilt
                key={p.name}
                className={`card ${p.featured ? 'wide' : ''} ${p.Details ? 'clickable' : ''}`}
                onClick={p.Details ? (e) => { if (!e.target.closest('a, button')) setOpenProject(p) } : undefined}
              >
                <div className="dots"><i className="r" /><i className="y" /><i className="g" /><span className="mono">{p.url}</span></div>
                {p.media && <Clip video={p.media.video} poster={p.media.poster} alt={p.media.alt} />}
                <div className="in">
                  <h3>{p.name}</h3>
                  <p>{p.text}</p>
                  <div className="chips mono">{p.tags.map((t) => <span key={t} className="pill">{t}</span>)}</div>
                  {(p.links || p.Details) && (
                    <div className="card-links">
                      {p.Details && <button className="btn small" onClick={() => setOpenProject(p)} aria-haspopup="dialog">How it’s built <span aria-hidden="true">→</span></button>}
                      {p.links?.map((l) => (
                        <a key={l.label} className="btn small ghost" href={l.href} target="_blank" rel="noopener noreferrer">{l.label} <span aria-hidden="true">↗</span></a>
                      ))}
                    </div>
                  )}
                </div>
              </Tilt>
            ))}
          </div>
        </div>
      </section>

      </main>

      <footer id="contact">
        <div className="wrap two contact-grid">
          <div className="contact-info">
            <h2>Let's build something.<span className="blink accent">_</span></h2>
            <p>Indore, Madhya Pradesh</p>
            <div className="row">
              <a className="btn" href={`mailto:${EMAIL}`}>{EMAIL}</a>
              <a className="btn ghost" href={LINKEDIN}>LinkedIn</a>
              <a className="btn ghost" href={RESUME_URL} download>Download CV</a>
            </div>
            <p className="phone mono">+91 9977424526</p>
          </div>
          <ContactForm />
        </div>
      </footer>
    </>
  )
}
