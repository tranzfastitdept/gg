// Phone house rules: no pinch-zoom, no double-tap zoom, no text selection,
// no long-press copy menu. Also keeps the keyboard from scrolling the page.

export function lockThePhone() {
  // pinch zoom (Safari ignores user-scalable=no, so we block the gesture)
  const block = (e) => {
    if (e.ctrlKey) return
    e.preventDefault()
  }
  document.addEventListener('gesturestart', block, { passive: false })
  document.addEventListener('gesturechange', block, { passive: false })
  document.addEventListener('gestureend', block, { passive: false })

  let lastTouch = 0
  document.addEventListener(
    'touchend',
    (e) => {
      const now = Date.now()
      if (now - lastTouch <= 320) e.preventDefault() // double tap zoom
      lastTouch = now
    },
    { passive: false },
  )

  document.addEventListener('touchmove', (e) => {
    if (e.touches.length > 1) e.preventDefault()
  }, { passive: false })

  document.addEventListener('selectstart', (e) => e.preventDefault())
  document.addEventListener('copy', (e) => e.preventDefault())
  document.addEventListener('cut', (e) => e.preventDefault())
  document.addEventListener('contextmenu', (e) => e.preventDefault())
}

// Registers the installer, so the site can be added to the phone's home screen
// and opened fullscreen with no browser bars.
export function installPWA() {
  if (!('serviceWorker' in navigator)) return
  navigator.serviceWorker.register('/sw.js').catch(() => {})
}
