import { useEffect, useRef, useState } from 'react'

const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/**
 * A short looping screen recording. It only plays while it is on screen, and not at all for people who ask
 * for reduced motion (they get the still image, and can press play in the details window).
 */
export function Clip({ video, poster, alt, controls = false }) {
  const ref = useRef(null)
  const [still] = useState(reduced)

  useEffect(() => {
    const v = ref.current
    if (!v || still || controls) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) v.play().catch(() => {}); else v.pause() }, { threshold: 0.35 })
    io.observe(v)
    return () => io.disconnect()
  }, [still, controls])

  return (
    <video
      ref={ref} className="clip" poster={poster} muted loop playsInline preload={controls ? 'metadata' : 'none'}
      controls={controls || still} aria-label={alt}
    >
      <source src={video} type="video/webm" />
    </video>
  )
}

/** The recording plus screenshots, for the top of the details window. */
export function Gallery({ media }) {
  if (!media) return null
  return (
    <section className="gallery">
      <Clip video={media.video} poster={media.poster} alt={media.alt} controls />
      <div className="shots">
        {media.shots.map((s) => (
          <a key={s.src} href={s.src} target="_blank" rel="noopener noreferrer" aria-label={`${s.alt} (opens full size)`}>
            <img src={s.src} alt={s.alt} loading="lazy" width="1280" height="720" />
          </a>
        ))}
      </div>
    </section>
  )
}
