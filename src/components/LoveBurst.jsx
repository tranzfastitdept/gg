import { useEffect, useRef } from 'react'
import flyingKiss from '../assets/medias/flying-kiss.gif'

// Little hearts burst from the click point, then the flying-kiss bear
// zooms across once. Pure DOM + CSS animations, safe on mobile.
export default function LoveBurst({ trigger }) {
  const layerRef = useRef(null)
  const kissed = useRef(false)

  useEffect(() => {
    if (!trigger) return
    const layer = layerRef.current
    if (!layer) return

    const burst = (x, y) => {
      for (let i = 0; i < 14; i++) {
        const h = document.createElement('span')
        h.className = 'burst-heart'
        h.textContent = i % 3 === 0 ? '✦' : '♥'
        const ang = (Math.PI * 2 * i) / 14 + Math.random() * 0.4
        const dist = 70 + Math.random() * 140
        h.style.left = `${x}px`
        h.style.top = `${y}px`
        h.style.setProperty('--dx', `${Math.cos(ang) * dist}px`)
        h.style.setProperty('--dy', `${Math.sin(ang) * dist - 60}px`)
        h.style.setProperty('--rot', `${(Math.random() - 0.5) * 120}deg`)
        h.style.fontSize = `${12 + Math.random() * 20}px`
        layer.appendChild(h)
        setTimeout(() => h.remove(), 1300)
      }
    }

    const onPointer = (e) => burst(e.clientX, e.clientY)
    window.addEventListener('pointerdown', onPointer)

    if (!kissed.current) {
      kissed.current = true
      const kiss = document.createElement('img')
      kiss.src = flyingKiss
      kiss.alt = ''
      kiss.className = 'flying-kiss'
      layer.appendChild(kiss)
      setTimeout(() => kiss.remove(), 2400)
    }

    return () => window.removeEventListener('pointerdown', onPointer)
  }, [trigger])

  return <div ref={layerRef} className="burst-layer" aria-hidden="true" />
}
