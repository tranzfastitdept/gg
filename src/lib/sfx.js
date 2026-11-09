// Tiny sound maker - no audio files, just the browser's own synth.
// Every sound is built from a couple of oscillator notes, so it is a few
// hundred bytes and works offline on a phone.

let ctx = null

function audio() {
  if (ctx) return ctx
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return null
  ctx = new AC()
  return ctx
}

function tone(freq, start, length, gain = 0.09, type = 'triangle') {
  const a = audio()
  if (!a) return
  const t0 = a.currentTime + start
  const osc = a.createOscillator()
  const amp = a.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  amp.gain.setValueAtTime(0, t0)
  amp.gain.linearRampToValueAtTime(gain, t0 + 0.012)
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + length)
  osc.connect(amp)
  amp.connect(a.destination)
  osc.start(t0)
  osc.stop(t0 + length + 0.02)
}

// A phone will not play sound before a real tap, so we wake the audio here.
export function unlockSound() {
  const a = audio()
  if (a && a.state === 'suspended') a.resume().catch(() => {})
}

export function playClick() {
  tone(660, 0, 0.075, 0.07, 'square')
  tone(880, 0.045, 0.075, 0.05, 'square')
}

export function playPop() {
  tone(520, 0, 0.1, 0.08)
  tone(740, 0.06, 0.12, 0.06)
}

export function playYay() {
  ;[523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.085, 0.24, 0.085))
}

export function playSwoon() {
  ;[784, 988, 1174, 988, 1318].forEach((f, i) => tone(f, i * 0.07, 0.3, 0.07, 'sine'))
}

// One listener for the whole app: any tap on a button gets a little tick.
export function installClickSounds() {
  const onDown = (event) => {
    unlockSound()
    const el = event.target?.closest?.('button, [role="button"], label, a')
    if (el && !el.disabled) playClick()
  }
  window.addEventListener('pointerdown', onDown, { passive: true })
  return () => window.removeEventListener('pointerdown', onDown)
}
