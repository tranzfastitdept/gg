import { useEffect, useState, useCallback } from 'react'
import { supabase } from './lib/supabase.js'
import { takeNote, hydrateHistory } from './lib/loveNotes.js'
import { celebrate, sprinkle } from './lib/celebrate.js'
import { installClickSounds, playYay, playPop, playSwoon } from './lib/sfx.js'
import LoveBurst from './components/LoveBurst.jsx'
import DatePickerModal from './components/DatePickerModal.jsx'
import successGif from './assets/medias/success-date-scheduled.gif'
import dancingBear from './assets/medias/dancing-bear.gif'
import flyingKiss from './assets/medias/flying-kiss.gif'

const ACTIVITIES = [
  'DINNER DATE',
  'MOVIE NIGHT',
  'COFFEE & WALK',
  'PICNIC',
  'MINI GOLF',
  'SURPRISE ME',
]

// Fallback lines if the pool is ever empty for a moment.
const FALLBACK_NOTES = {
  ask: `will you go out with me, precious?
it would make every day feel like a celebration.`,
  yes: `yay, you said yes, precious!\nyou just made my whole week.\ni cannot stop smiling at my screen right now.`,
  itsADate: `IT'S A DATE, PRECIOUS!\nthis is officially us now,\nlocked in, no take-backs.`,
  afterDate: `thank you for today, precious.\nevery second with you felt like\na little adventure i never want to end.`,
  memory: `this photo is my new favourite thing,\nbecause you are in it, precious.`,
}

const STEPS = ['start', 'ask', 'yay', 'pick-date', 'activity', 'its-a-date', 'note']

export default function App() {
  return <ValentineFlow />
}

function todayISO() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function prettyDate(iso) {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function ValentineFlow() {
  const [step, setStep] = useState('start')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [noCount, setNoCount] = useState(0)
  const [date, setDate] = useState('')
  const [activity, setActivity] = useState('')
  const [note, setNote] = useState('')
  const [saved, setSaved] = useState(null)
  const [view, setView] = useState('flow') // flow | dates | date-detail
  const [selected, setSelected] = useState(null)

  const [dates, setDates] = useState([])
  const [datesReady, setDatesReady] = useState(false)
  const [memories, setMemories] = useState({})
  const [dbMsg, setDbMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [notes, setNotes] = useState({})

  // Show a fresh note from the local pool, skipping any already shown.
  // The pool lives in notesPool.js (60+ notes); notesHistory.js tracks
  // what has been seen so nothing repeats until the pool is exhausted.
  const compose = useCallback((moment) => {
    const ready = takeNote(moment)
    if (ready) {
      setNotes((n) => ({ ...n, [moment]: ready }))
      return
    }
    setNotes((n) => ({ ...n, [moment]: FALLBACK_NOTES[moment] || FALLBACK_NOTES.yes }))
  }, [])

  // On open: hydrate the shown-history from Supabase (best-effort) and
  // turn on the little tap sounds.
  useEffect(() => {
    hydrateHistory()
    return installClickSounds()
  }, [])

  const backToDates = () => {
    setSelected(null)
    setView('dates')
  }

  // load dates + memories once from Supabase
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const { data, error } = await supabase
          .from('dates')
          .select('*')
          .order('date', { ascending: true })
        if (error) throw error
        if (!alive) return
        setDates(data || [])

        const { data: mems, error: memErr } = await supabase
          .from('memories')
          .select('*')
          .order('created_at', { ascending: true })
        if (memErr) throw memErr
        if (!alive) return
        const map = {}
        for (const m of mems || []) {
          ;(map[m.date_id] ||= []).push(m)
        }
        setMemories(map)
      } catch (e) {
        if (alive) {
          setDbMsg(
            `Could not reach the shared dates (${e.message}). Run the SQL file in Supabase, then refresh.`,
          )
        }
      } finally {
        if (alive) setDatesReady(true)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  const deleteDate = async (row) => {
    setBusy(true)
    // photos first, so the bucket does not keep orphans
    const photos = (memories[row.id] || []).map((m) => m.photo_url).filter(Boolean)
    try {
      if (photos.length) {
        await supabase.storage.from('memories').remove(photos)
      }
    } catch {
      /* a missing file should not block the date from going away */
    }
    try {
      const { error: memErr } = await supabase.from('memories').delete().eq('date_id', row.id)
      if (memErr) throw memErr
      const { error } = await supabase.from('dates').delete().eq('id', row.id)
      if (error) throw error
      setDbMsg('Date deleted.')
    } catch (e) {
      setDbMsg(`Could not delete that date: ${e.message}`)
      setBusy(false)
      return false
    }
    const nextDates = dates.filter((d) => d.id !== row.id)
    const nextMems = { ...memories }
    delete nextMems[row.id]
    setDates(nextDates)
    setMemories(nextMems)
    persistLocal(nextDates, nextMems)
    if (selected?.id === row.id) {
      setSelected(null)
      setView('dates')
    }
    setBusy(false)
    playPop()
    return true
  }

  const persistLocal = (nextDates, nextMems) => {
    try {
      localStorage.setItem('valentine-dates', JSON.stringify(nextDates))
      localStorage.setItem('valentine-memories', JSON.stringify(nextMems))
    } catch {
      /* storage full - ignore */
    }
  }

  const saveDate = async () => {
    if (!date) return
    setBusy(true)
    const payload = { date, activity: activity || 'SURPRISE ME', note, status: 'scheduled' }
    const row = { id: `local-${Date.now()}`, created_at: new Date().toISOString(), ...payload }
    try {
      const { data, error } = await supabase
        .from('dates')
        .insert([payload])
        .select()
        .single()
      if (error) throw error
      row.id = data.id
      row.created_at = data.created_at
      const next = [...dates, row]
      setDates(next)
      setSaved(row)
      setStep('its-a-date')
      compose('itsADate')
      celebrate()
      playYay()
    } catch (e) {
      setDbMsg(`Could not save the date: ${e.message} (it is still kept in this browser)`)
      const next = [...dates, row]
      setDates(next)
      persistLocal(next, memories)
      setSaved(row)
    } finally {
      setBusy(false)
    }
  }

  const uploadMemory = async (dateRow, file) => {
    if (!file) return
    setBusy(true)
    try {
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `${dateRow.id}/${Date.now()}-${Math.floor(Math.random() * 1e6)}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('memories')
        .upload(path, file, { upsert: false })
      if (upErr) throw upErr
      const publicUrl = supabase.storage.from('memories').getPublicUrl(path).data.publicUrl
      const { data: mem, error: insErr } = await supabase
        .from('memories')
        .insert([{ date_id: dateRow.id, photo_url: publicUrl, storage_path: path, caption: '' }])
        .select()
        .single()
      if (insErr) throw insErr
      setMemories((m) => ({ ...m, [dateRow.id]: [...(m[dateRow.id] || []), mem] }))
      sprinkle()
      playPop()
      compose('memory')
    } catch (e) {
      setDbMsg(`Photo could not be added: ${e.message}`)
    } finally {
      setBusy(false)
    }
  }

  const noTexts = [
    'No',
    'are you sure?',
    'really sure?',
    'think again!',
    'last chance!',
    'surely not?',
    'you might regret this!',
    'give it another thought!',
    'are you absolutely certain?',
    'this could be a mistake!',
    'have a heart!',
    "don't be so cold!",
    'change of heart?',
    "wouldn't you reconsider?",
    'is that your final answer?',
    "you're breaking my heart ;(",
  ]

  const dodging = () => setNoCount((c) => Math.min(c + 1, 40))

  return (
    <div className="stage">
      <button
        type="button"
        className={`top-link${pickerOpen ? ' is-hidden' : ''}`}
        onClick={() => setView(view === 'dates' ? 'flow' : 'dates')}
        hidden={step === 'start'}
      >
        {view === 'dates' ? '‹ back' : '♥ our dates'}
      </button>

      {view === 'dates' && (
        <DatesView
          dates={dates}
          ready={datesReady}
          memories={memories}
          busy={busy}
          onDelete={deleteDate}
          onPick={(d) => {
            setSelected(d)
            setView('date-detail')
            compose('afterDate')
            playSwoon()
          }}
        />
      )}

      {view === 'flow' && (
        <div className="screen" key={step}>
          {step === 'start' && (
            <>
              <div className="gif-card start-gif">
                <span className="gif-corner bl">✦</span>
                <span className="gif-corner br">✦</span>
                <img src={dancingBear} alt="A little bear waiting for you" />
              </div>
              <h1 className="pixel-title start-title">
                A QUESTION <span className="accent">WAITS…</span>
              </h1>
              <p className="pixel-sub start-sub">
                someone made this for you, precious.
                <br />
                press start when you're ready.
              </p>
              <button
                type="button"
                className="pixel-btn start-btn"
                onClick={() => {
                  setStep('ask')
                  compose('ask')
                  playYay()
                  sprinkle()
                }}
              >
                START ♥
              </button>
              <p className="start-hint">tap start - i'll take it from there</p>
            </>
          )}

          {step === 'ask' && (
            <>
              <div className="gif-card">
                <span className="gif-corner bl">✦</span>
                <span className="gif-corner br">✦</span>
                <img src={dancingBear} alt="A little bear hoping you say yes" />
              </div>
              <h1 className="pixel-title">WILL YOU GO OUT WITH ME?</h1>
              <p className="pixel-sub">choose wisely... (the bear believes in you)</p>
              <div className="btn-row">
                <button
                  type="button"
                  className="pixel-btn"
                  onClick={() => {
                    setStep('yay')
                    compose('yes')
                    celebrate()
                    playYay()
                  }}
                >
                  YES ♥
                </button>
                <button
                  type="button"
                  className={`pixel-btn ghost no-btn`}
                  onClick={dodging}
                  onMouseEnter={dodging}
                  onFocus={dodging}
                  style={{
                    '--run-x': `${(noCount % 5) - 2}0%`,
                    '--run-y': `${(noCount % 3) - 1}5%`,
                  }}
                >
                  {noTexts[Math.min(noCount, noTexts.length - 1)]}
                </button>
              </div>
            </>
          )}

          {step === 'yay' && (
            <>
              <div className="gif-card">
                <span className="gif-corner bl">✦</span>
                <span className="gif-corner br">✦</span>
                <img src={flyingKiss} alt="A bear sending you a flying kiss" />
              </div>
              <h1 className="pixel-title">YAY!</h1>
              <p className="pixel-sub">i'm so glad you said yes, precious.</p>
              <LoveNote text={notes.yes} from="gelo" />
              <button type="button" className="pixel-btn" onClick={() => setStep('pick-date')}>
                PRESS TO CONTINUE →
              </button>
            </>
          )}

          {step === 'pick-date' && (
            <>
              <div className="gif-card">
                <span className="gif-corner bl">✦</span>
                <span className="gif-corner br">✦</span>
                <img src={dancingBear} alt="A bear thinking about the perfect day" />
              </div>
              <h1 className="pixel-title">PICK A DATE</h1>
              <p className="pixel-sub">choose the day for our cute little plan.</p>

              <button
                type="button"
                className={`date-ticket${date ? ' filled' : ''}`}
                onClick={() => setPickerOpen(true)}
              >
                <span className="ticket-icon" aria-hidden="true">❤</span>
                <span className="ticket-text">
                  <span className="ticket-label">{date ? 'our day' : 'no day picked yet'}</span>
                  <span className="ticket-value">
                    {date ? prettyDate(date) : 'tap to open the calendar'}
                  </span>
                </span>
                <span className="ticket-cta">{date ? 'CHANGE' : 'OPEN'}</span>
              </button>

              <div className="btn-row">
                <button
                  type="button"
                  className="pixel-btn mint"
                  disabled={!date || busy}
                  onClick={() => setStep('activity')}
                >
                  CONTINUE →
                </button>
              </div>

              {pickerOpen && (
                <DatePickerModal
                  open
                  value={date}
                  suggest={activity || 'SURPRISE ME'}
                  onClose={() => setPickerOpen(false)}
                  onConfirm={(next) => {
                    setDate(next)
                    setPickerOpen(false)
                    sprinkle()
                    playPop()
                  }}
                />
              )}
            </>
          )}

          {step === 'activity' && (
            <>
              <div className="gif-card">
                <span className="gif-corner bl">✦</span>
                <span className="gif-corner br">✦</span>
                <img src={flyingKiss} alt="A bear excited about ideas" />
              </div>
              <h1 className="pixel-title">WHAT WOULD YOU LIKE TO DO?</h1>
              <p className="pixel-sub">pick one, or let fate decide.</p>
              <div className="choice-grid">
                {ACTIVITIES.map((a) => (
                  <button
                    key={a}
                    type="button"
                    className={`choice ${activity === a ? 'selected' : ''}`}
                    onClick={() => setActivity(a)}
                  >
                    {a}
                  </button>
                ))}
              </div>
              <label className="field-label" htmlFor="note">tiny note for the day (optional)</label>
              <input
                id="note"
                className="pixel-input"
                placeholder="e.g. bring your jacket, it might rain"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <div className="btn-row">
                <button
                  type="button"
                  className="pixel-btn"
                  disabled={!activity || busy}
                  onClick={saveDate}
                >
                  {busy ? 'SAVING…' : 'LOCK IT IN 🔒'}
                </button>
                <button
                  type="button"
                  className="pixel-btn ghost"
                  disabled={busy}
                  onClick={() => setStep('pick-date')}
                >
                  ← BACK
                </button>
              </div>
            </>
          )}

          {step === 'its-a-date' && (
            <>
              <div className="gif-card">
                <span className="gif-corner bl">✦</span>
                <span className="gif-corner br">✦</span>
                <img src={successGif} alt="Two bears celebrating your date" />
              </div>
              <h1 className="pixel-title">IT'S A DATE, PRECIOUS!</h1>
              <div className="info-card">
                <div className="row"><span>DATE:</span><b>{prettyDate(saved?.date)}</b></div>
                <div className="row"><span>ACTIVITY:</span><b>{saved?.activity}</b></div>
                {saved?.note && <div className="row"><span>NOTE:</span><b>{saved.note}</b></div>}
              </div>
              <LoveNote text={notes.itsADate} from="gelo" />
              <div className="btn-row">
                <button type="button" className="pixel-btn" onClick={() => setView('dates')}>
                  SEE OUR DATES →
                </button>
                <button
                  type="button"
                  className="pixel-btn ghost"
                  onClick={() => window.location.reload()}
                >
                  REPLAY
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {step === 'its-a-date' && <LoveBurst trigger />}

      {view === 'date-detail' && selected && (
        <DateDetail
          dateRow={selected}
          memories={memories}
          busy={busy}
          note={notes.afterDate}
          onUpload={uploadMemory}
          onBack={backToDates}
        />
      )}

      <div className="progress-dots" aria-hidden="true">
        {STEPS.map((s) => (
          <span key={s} className={s === step ? 'on' : ''} />
        ))}
      </div>

      {dbMsg && <div className="notice-banner">{dbMsg}</div>}
      {busy && <div className="toast">saving…</div>}
      {step === 'start' && view === 'flow' && (
        <p className="made-by">made with gelo, for precious</p>
      )}
    </div>
  )
}

// A retro OS-style love-note window with typewriter text.
function LoveNote({ text }) {
  const content = text || ''
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const [shown, setShown] = useState(0)
  useEffect(() => {
    if (reduced || !content) return undefined
    const id = setInterval(() => {
      setShown((s) => {
        if (s >= content.length) {
          clearInterval(id)
          return s
        }
        return s + 1
      })
    }, 22)
    return () => clearInterval(id)
  }, [content, reduced])

  // keep the line breaks, drop any stray trailing backslashes
  // keep the line breaks, drop any stray trailing backslashes,
  // and never let a gap grow past one blank line
  const pretty = (reduced ? content : content.slice(0, shown))
    .split(/\r?\n/)
    .map((line) => line.replace(/\\+$/, ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '')

  return (
    <div className="note-window">
      <div className="note-titlebar">
        <span>✦ love_note.txt</span>
        <button
          type="button"
          className="note-close"
          aria-label="Show the whole note"
          onClick={() => setShown(content.length)}
        >
          ✕
        </button>
      </div>
      {content ? (
        <div className="note-body">
          {pretty}
          {!reduced && shown < content.length && <span className="note-caret">▼</span>}
          {shown >= content.length && <div className="note-heart">♥</div>}
        </div>
      ) : (
        <div className="note-body note-writing">
          writing something sweet for you… <span className="note-dots" />
        </div>
      )}
    </div>
  )
}

function DatesView({ dates, ready, memories, busy, onPick, onDelete }) {
  const [confirming, setConfirming] = useState(null)
  const today = todayISO()
  const upcoming = dates.filter((d) => d.date >= today).sort((a, b) => a.date.localeCompare(b.date))
  const past = dates.filter((d) => d.date < today).sort((a, b) => b.date.localeCompare(a.date))

  if (!ready) return <p className="pixel-sub">loading our dates…</p>

  const card = (d) => {
    const count = (memories[d.id] || []).length
    const isPast = d.date < today
    const days = Math.round((new Date(d.date + 'T00:00:00') - new Date(today + 'T00:00:00')) / 86400000)
    return (
      <div key={d.id} className="dc-wrap">
        <button
          type="button"
          className={`date-card${isPast ? ' past-card' : ''}`}
          onClick={() => onPick(d)}
        >
        <div className="dc-top">
          <span className="dc-date">{prettyDate(d.date)}</span>
          <span className="dc-badge">{isPast ? '♥ MEMORY' : '☆ UPCOMING'}</span>
        </div>
        <div className="dc-activity">{d.activity}</div>
        {d.note && <div className="dc-note">{d.note}</div>}
        {!isPast && days >= 0 && (
          <div className="countdown">
            {days === 0 ? 'TODAY! ♥' : days === 1 ? 'TOMORROW! ♥' : `${days} SLEEPS TO GO`}
          </div>
        )}
        <div className="dc-count">
          {count ? `${count} photo${count > 1 ? 's' : ''} saved` : 'tap to add a memory photo'}
        </div>
        </button>
        <button
          type="button"
          className="dc-del"
          disabled={busy}
          aria-label={`Delete the date on ${prettyDate(d.date)}`}
          onClick={() => setConfirming(d)}
        >
          ✕ delete
        </button>
      </div>
    )
  }

  return (
    <div className="dates-panel screen">
      <h1 className="pixel-title" style={{ fontSize: 'clamp(20px,5vw,32px)' }}>OUR DATES</h1>
      <p className="pixel-sub">every plan, and every memory, in one place.</p>

      <h2>UPCOMING</h2>
      {upcoming.length ? upcoming.map(card) : <p className="empty-hint">nothing planned yet — go plan one!</p>}

      <h2>PAST DATES · MEMORIES</h2>
      {past.length ? past.map(card) : <p className="empty-hint">past dates will appear here with your photos.</p>}

      {confirming && (
        <div className="confirm-veil" onClick={() => !busy && setConfirming(null)}>
          <div className="confirm-card" onClick={(e) => e.stopPropagation()}>
            <span className="confirm-heart">♡</span>
            <p className="confirm-title">DELETE THIS DATE?</p>
            <p className="confirm-body">
              {prettyDate(confirming.date)} · {confirming.activity}
              <br />
              Its photos and memories will be gone too. This cannot be undone.
            </p>
            <div className="btn-row">
              <button
                type="button"
                className="pixel-btn wine"
                disabled={busy}
                onClick={async () => {
                  const ok = await onDelete(confirming)
                  setConfirming(null)
                  return ok
                }}
              >
                {busy ? 'DELETING…' : 'YES, DELETE'}
              </button>
              <button
                type="button"
                className="pixel-btn ghost"
                disabled={busy}
                onClick={() => setConfirming(null)}
              >
                KEEP IT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DateDetail({ dateRow, memories, busy, onUpload, onBack, note }) {
  const list = memories[dateRow.id] || []
  return (
    <div className="memories-wrap screen">
      <h1 className="pixel-title" style={{ fontSize: 'clamp(18px,4.5vw,28px)' }}>
        {prettyDate(dateRow.date)}
      </h1>
      <p className="pixel-sub">{dateRow.activity}</p>

      <label className="pixel-btn mint" style={{ display: 'inline-block', cursor: busy ? 'wait' : 'pointer' }}>
        {busy ? 'ADDING…' : '+ ADD MEMORY PHOTO'}
        <input
          type="file"
          accept="image/*"
          hidden
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onUpload(dateRow, f)
            e.target.value = ''
          }}
        />
      </label>

      {list.length ? (
        <div className="memory-grid" style={{ marginTop: 16 }}>
          {list.map((m) => (
            <figure key={m.id} className="memory-photo">
              <img src={m.photo_url} alt="Date memory" loading="lazy" />
              <figcaption>{m.caption || new Date(m.created_at).toLocaleDateString()}</figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <p className="empty-hint" style={{ marginTop: 14 }}>
          no photos yet — after the date, add your favorite one here.
        </p>
      )}

      {list.length > 0 && (
        <div className="after-note">
          <span className="after-note-label">a fresh note from gelo</span>
          <p>{note || 'writing something sweet for you…'}</p>
        </div>
      )}

      <div className="btn-row" style={{ marginTop: 16 }}>
        <button type="button" className="pixel-btn ghost" onClick={onBack}>
          ← ALL DATES
        </button>
      </div>
    </div>
  )
}


