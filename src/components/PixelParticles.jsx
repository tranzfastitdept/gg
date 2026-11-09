import { useEffect, useMemo, useRef, useState } from 'react'
import petalsGif from '../assets/medias/falling-petals-overlay-transparent-bg.gif'

// Floating pixel hearts + sparkles, drawn on canvas.
export default function PixelParticles() {
  const canvasRef = useRef(null)
  const [petals, setPetals] = useState(true)

  // seeded so layout is stable between renders
  const cloudDots = useMemo(() => {
    const out = []
    let seed = 7
    const rnd = () => {
      seed = (seed * 16807) % 2147483647
      return seed / 2147483647
    }
    for (let i = 0; i < 40; i++) {
      out.push({ x: rnd(), y: rnd(), s: 2 + rnd() * 4, tw: rnd() * Math.PI * 2 })
    }
    return out
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    let w = 0
    let h = 0

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    // heart shape as pixel blocks (5x5 grid, 1 = filled)
    const HEART = [
      [1, 0, 1, 0, 1],
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
      [0, 1, 1, 1, 0],
      [0, 0, 1, 0, 0],
    ]
    const drawHeart = (x, y, s, color) => {
      ctx.fillStyle = color
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          if (HEART[r][c]) ctx.fillRect(x + c * s, y + r * s, s, s)
        }
      }
    }

    let t0 = performance.now()
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const t = reduced ? 0 : (performance.now() - t0) / 1000
      ctx.clearRect(0, 0, w, h)

      // drifting pixel hearts
      for (let i = 0; i < 10; i++) {
        const speed = 0.25 + (i % 4) * 0.11
        const x = ((i * 0.137 + t * speed * 0.02) % 1.1) * w - w * 0.05
        const y = ((i * 0.23 + t * speed * 0.045) % 1.1) * h - h * 0.05
        const sway = Math.sin(t * 0.8 + i * 1.7) * 10
        const s = 3 + (i % 3) * 2
        const alpha = 0.35 + 0.3 * (0.5 + 0.5 * Math.sin(t * 1.4 + i))
        ctx.globalAlpha = alpha
        drawHeart(x + sway, y, s, i % 2 ? '#ffffff' : '#e0215a')
      }
      ctx.globalAlpha = 1

      // white sparkles
      for (let i = 0; i < 14; i++) {
        const c = cloudDots[i]
        const a = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(t * 2 + c.tw))
        ctx.globalAlpha = a
        const s = c.s
        const x = c.x * w
        const y = c.y * h
        ctx.fillStyle = '#ffffff'
        // plus-shaped sparkle
        ctx.fillRect(x, y - s * 2, s, s * 4)
        ctx.fillRect(x - s * 2, y, s * 4, s)
      }
      ctx.globalAlpha = 1
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [cloudDots])

  return (
    <>
      <canvas ref={canvasRef} className="pixel-particles" aria-hidden="true" />
      {petals && (
        <img
          src={petalsGif}
          alt=""
          aria-hidden="true"
          className="petals-overlay"
          onError={() => setPetals(false)}
        />
      )}
    </>
  )
}
