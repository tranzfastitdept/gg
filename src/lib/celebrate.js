import confetti from 'canvas-confetti'

const PINKS = ['#ff8fb0', '#f06292', '#d81b60', '#ffffff', '#ffcbdb', '#9c1b47']

const reduced = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Hearts and pink confetti from the middle of the screen.
export function celebrate() {
  if (reduced()) return
  confetti({
    particleCount: 130,
    spread: 100,
    startVelocity: 42,
    origin: { x: 0.5, y: 0.55 },
    colors: PINKS,
    scalar: 1.1,
    ticks: 220,
    zIndex: 60,
  })
  setTimeout(() => {
    confetti({
      particleCount: 70,
      spread: 140,
      startVelocity: 34,
      origin: { x: 0.15, y: 0.75 },
      colors: PINKS,
      ticks: 200,
      zIndex: 60,
    })
    confetti({
      particleCount: 70,
      spread: 140,
      startVelocity: 34,
      origin: { x: 0.85, y: 0.75 },
      colors: PINKS,
      ticks: 200,
      zIndex: 60,
    })
  }, 320)
}

// A softer sprinkle, for saving a date or adding a photo.
export function sprinkle() {
  if (reduced()) return
  confetti({
    particleCount: 45,
    spread: 75,
    startVelocity: 28,
    origin: { x: 0.5, y: 0.7 },
    colors: PINKS,
    scalar: 0.9,
    ticks: 180,
    zIndex: 60,
  })
}

// A little burst right where the finger tapped.
export function tapBurst(x, y) {
  if (reduced()) return
  confetti({
    particleCount: 26,
    spread: 60,
    startVelocity: 22,
    origin: { x: x / window.innerWidth, y: y / window.innerHeight },
    colors: PINKS,
    scalar: 0.7,
    ticks: 120,
    zIndex: 60,
  })
}
