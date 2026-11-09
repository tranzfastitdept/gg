import { supabase } from './supabase.js'

// Hard-coded AI writer details (no .env, on purpose - this site is for us two only).
const AI_URL = 'https://api.orcarouter.ai/v1/chat/completions'
const AI_KEY = 'sk-orca-CeD4cGUVOs3gXUk4GofzK6tkHkWfo3dbwQEPWHg5aUO'
const AI_MODEL = 'deepseek/deepseek-v4-flash-free'

export const WHO = { him: 'Gelo', her: 'Precious' }

// Moments that need notes ready before they are shown.
const MOMENTS = ['yes', 'itsADate', 'afterDate']
const POOL_TARGET = 10 // how many fresh notes we keep per moment
const POOL_LOW = 4 // refill in the background below this
const CAHCE_KEY = 'love-note-pool-v2'
const USED_KEY = 'love-note-used-v2'
const MAX_USED = 60

const FALLBACK = {
  yes: `yay, precious said yes!\nyou just made my whole week.\n\ni cannot stop smiling at my screen\nright now.`,
  itsADate: `IT'S A DATE!\nthis is officially us now,\nlocked in, no take-backs.\n\ni already cleaned my camera roll\nfor our photos.`,
  afterDate: `thank you for today, precious.\nevery second with you felt\nlike a little adventure\ni never want to end.`,
}

const MOOD = {
  yes: `she (Precious) just said yes to a date with him (Gelo). Write the happy first reaction.`,
  itsADate: `their date is now locked in and saved in the calendar. Celebrate that she said yes and it is official.`,
  afterDate: `their date already happened and they just saved a photo memory of it. Be warm, grateful and nostalgic.`,
}

const RULES = `You write short love notes from Gelo to his girlfriend Precious.
Rules:
- 4 to 7 short lines, every line under 42 characters.
- lowercase, soft, playful, sincere, a little kilig. never cringe, never formal.
- she may be called "precious" or "love", at most once. never use her name as a label.
- at most one emoji line at the end, or none.
- no greeting like "hey", no signature, no quotes around the note.
- plain text only, no markdown, no lists, no numbering, no titles.
- every note must have a different idea and a different first line.`

/* ------------------------------------------------------------------ */
/* local cache: a pool of ready-to-show notes, per moment             */
/* ------------------------------------------------------------------ */

function emptyPool() {
  return { yes: [], itsADate: [], afterDate: [] }
}

function readPool() {
  try {
    const raw = JSON.parse(localStorage.getItem(CAHCE_KEY) || 'null')
    if (!raw || typeof raw !== 'object') return emptyPool()
    const pool = emptyPool()
    for (const m of MOMENTS) {
      const list = raw[m]
      if (Array.isArray(list)) pool[m] = list.filter((t) => typeof t === 'string' && t.trim())
    }
    return pool
  } catch {
    return emptyPool()
  }
}

function writePool(pool) {
  try {
    localStorage.setItem(CAHCE_KEY, JSON.stringify(pool))
  } catch {
    /* storage full - the database keeps them too */
  }
}

// every note we have ever shown, so the model never writes the same idea twice
function usedFromBrowser() {
  try {
    const raw = JSON.parse(localStorage.getItem(USED_KEY) || '[]')
    return Array.isArray(raw) ? raw.slice(-MAX_USED) : []
  } catch {
    return []
  }
}

function markUsed(text) {
  try {
    const list = [...usedFromBrowser(), text].slice(-MAX_USED)
    localStorage.setItem(USED_KEY, JSON.stringify(list))
  } catch {
    /* ignore */
  }
}

export async function recentNotes() {
  const local = usedFromBrowser()
  try {
    const { data } = await supabase
      .from('love_notes')
      .select('body')
      .order('created_at', { ascending: false })
      .limit(MAX_USED)
    const remote = (data || []).map((r) => r.body)
    return [...new Set([...local, ...remote])].slice(-MAX_USED)
  } catch {
    return local
  }
}

async function storeNote(moment, body) {
  try {
    await supabase.from('love_notes').insert([{ moment, body }])
  } catch {
    /* saving is a bonus, never a blocker */
  }
}

/* ------------------------------------------------------------------ */
/* the AI writer                                                      */
/* ------------------------------------------------------------------ */

function tidy(raw) {
  return raw
    .replace(/^```[a-z]*\s*/i, '')
    .replace(/```$/i, '')
    .replace(/^(note|love note)\s*[:-]\s*/i, '')
    .replace(/["“”]/g, '')
    .split(/\r?\n/)
    .map((l) => l.replace(/\\+$/, '').replace(/\s*---\s*$/, '').trimEnd())
    .join('\n')
    .trim()
}

async function ask(messages, maxTokens = 240) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 30000)
  try {
    const res = await fetch(AI_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${AI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages,
        max_tokens: maxTokens,
        temperature: 1.05,
      }),
      signal: controller.signal,
    })
    if (!res.ok) throw new Error(`writer replied ${res.status}`)
    const json = await res.json()
    return tidy(json?.choices?.[0]?.message?.content || '')
  } finally {
    clearTimeout(timer)
  }
}

// One call, many notes: separated by a line of three dashes.
async function askBatch(moment, count, avoid) {
  const avoidText = avoid.length ? avoid.slice(-25).join('\n---\n') : '(none yet)'
  const raw = await ask([
    { role: 'system', content: RULES },
    {
      role: 'user',
      content: `Moment: ${MOOD[moment] || MOOD.yes}

Write exactly ${count} different notes. Put a line with only --- between them.
Do not repeat any idea from the notes already used:
${avoidText}`,
    },
  ], 200 * count)
  if (!raw) return []
  return raw
    .split(/\r?\n---+\r?\n|\r?\n(?=---)/)
    .map((t) => t.replace(/-{3,}/g, '').trim())
    .filter((t) => t.length > 25)
    .slice(0, count)
}

let priming = false

// Fill the pool in the background, so a note is already ready when it is needed.
export async function primeNotes(mode = 'topup') {
  if (priming) return
  priming = true
  try {
    const pool = readPool()
    const avoid = await recentNotes()

    for (const moment of MOMENTS) {
      const have = pool[moment].length
      const want = mode === 'fresh' ? POOL_TARGET : POOL_LOW
      if (have >= want) continue
      const missing = Math.max(POOL_TARGET - have, POOL_LOW)
      try {
        const fresh = await askBatch(moment, Math.min(missing, 10), [...avoid, ...pool[moment]])
        if (fresh.length) {
          const clean = fresh.filter((t) => !avoid.includes(t) && !pool[moment].includes(t))
          pool[moment] = [...pool[moment], ...clean].slice(0, POOL_TARGET)
          writePool(pool)
          for (const body of clean) storeNote(moment, body)
        }
      } catch {
        if (!pool[moment].length) pool[moment] = [FALLBACK[moment] || FALLBACK.yes]
      }
      writePool(pool)
      avoid.push(...pool[moment])
    }
  } finally {
    priming = false
  }
}

// Hand out one ready note (and quietly refill the pool behind our back).
export function takeNote(moment) {
  const pool = readPool()
  const list = pool[moment] || []
  if (!list.length) return null
  const text = list[Math.floor(Math.random() * list.length)]
  pool[moment] = list.filter((t) => t !== text)
  writePool(pool)
  markUsed(text)
  if (pool[moment].length < POOL_LOW) setTimeout(() => primeNotes(), 400)
  return text
}

// Last-resort single note (only when the pool is empty and the writer is slow).
export async function writeLoveNote(moment, avoid = []) {
  const avoidText = avoid.length ? avoid.slice(-20).join('\n---\n') : '(none yet)'
  try {
    const text = await ask([
      { role: 'system', content: RULES },
      {
        role: 'user',
        content: `Moment: ${MOOD[moment] || MOOD.yes}

Notes already used (do not repeat):
${avoidText}`,
      },
    ])
    if (!text) throw new Error('empty note')
    markUsed(text)
    storeNote(moment, text)
    return text
  } catch {
    return FALLBACK[moment] || FALLBACK.yes
  }
}
