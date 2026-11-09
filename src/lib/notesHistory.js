// notesHistory.js — tracks which notes have already been shown,
// so the app never shows the same note twice until the pool runs out.
//
// Storage: localStorage (instant, works offline) + Supabase `love_notes`
// table when it exists (shared between both of you). All writes are
// best-effort — a database error never blocks the app.

import { supabase } from './supabase.js'
import { NOTES } from './notesPool.js'

const KEY = 'love-note-shown-v1'
const MAX_SEEN = 400 // keep a generous recent history

function readLocal() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]')
    return Array.isArray(raw) ? raw.filter((t) => typeof t === 'string') : []
  } catch {
    return []
  }
}

function writeLocal(seen) {
  try {
    localStorage.setItem(KEY, JSON.stringify(seen.slice(-MAX_SEEN)))
  } catch {
    /* storage full or blocked — the remote table still tracks */
  }
}

// Mark one note as shown (local + remote, best effort).
export function markNoteShown(body) {
  if (!body) return
  const seen = [...readLocal(), body].slice(-MAX_SEEN)
  writeLocal(seen)
  // Best-effort remote log — never await, never throw.
  try {
    const p = supabase.from('love_notes').insert([{ moment: 'pool', body }])
    if (p && typeof p.catch === 'function') p.catch(() => {})
    else if (p && typeof p.then === 'function') p.then(() => {}, () => {})
  } catch {
    /* table may not exist yet — local history still works */
  }
}

// One-time hydrate: pull remote history into local storage so both of you
// share the same "already shown" set. Safe to call on every start.
export async function hydrateHistory() {
  try {
    const { data, error } = await supabase
      .from('love_notes')
      .select('body')
      .order('created_at', { ascending: false })
      .limit(MAX_SEEN)
    if (error || !data) return
    const merged = [...new Set([...readLocal(), ...data.map((r) => r.body)])].slice(-MAX_SEEN)
    writeLocal(merged)
  } catch {
    /* offline or table missing — local history is enough */
  }
}

function momentNotes(moment) {
  return NOTES[moment] || NOTES.ask || []
}

function normalized(text) {
  return text.trim().toLowerCase()
}

// Pick a random note from `moment` that has NOT been shown yet.
// When every note in that moment has been seen, start a fresh cycle:
// clear ONLY that moment's seen entries (other moments stay tracked)
// and pick randomly again. Returns { text, reset } so the caller can
// refresh the pool if it wants to.
export function pickFromPool(moment) {
  const list = momentNotes(moment)
  if (!list.length) return { text: '', reset: false }

  const seen = readLocal()
  const unseen = list.filter((n) => !seen.some((s) => normalized(s) === normalized(n)))

  if (unseen.length) {
    const text = unseen[Math.floor(Math.random() * unseen.length)]
    return { text, reset: false }
  }

  // Pool exhausted for this moment — clear just these entries and repick.
  const drop = new Set(list.map(normalized))
  const kept = seen.filter((s) => !drop.has(normalized(s)))
  writeLocal(kept)
  const text = list[Math.floor(Math.random() * list.length)]
  return { text, reset: true }
}

// How many notes in this moment have never been shown (0 = cycle complete).
export function unseenCount(moment) {
  const list = momentNotes(moment)
  if (!list.length) return 0
  const seen = readLocal()
  return list.filter((n) => !seen.some((s) => normalized(s) === normalized(n))).length
}

// For debugging / future UI: total notes in the pool per moment.
export function poolSize() {
  const out = {}
  for (const k of Object.keys(NOTES)) out[k] = NOTES[k].length
  return out
}
