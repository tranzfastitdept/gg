// loveNotes.js — thin re-export layer over the local note pool.
// Kept so existing imports keep working; the OrcaRouter AI writer is gone.
// Notes come from notesPool.js, and notesHistory.js skips ones already shown.

export { NOTES, WHO } from './notesPool.js'
export {
  markNoteShown,
  hydrateHistory,
  pickFromPool,
  unseenCount,
  poolSize,
} from './notesHistory.js'

import { pickFromPool, markNoteShown, hydrateHistory } from './notesHistory.js'

// Pick a fresh note for this moment, skipping any already shown.
// When the moment's pool is exhausted it starts a fresh cycle.
export function takeNote(moment) {
  const { text } = pickFromPool(moment)
  if (text) markNoteShown(text)
  return text || null
}

// Kept for compatibility: pool-only mode needs no priming.
export async function primeNotes() {
  await hydrateHistory()
}

// Kept for compatibility: just take the next unseen note.
export async function writeLoveNote(moment) {
  return takeNote(moment)
}

export async function recentNotes() {
  return []
}
