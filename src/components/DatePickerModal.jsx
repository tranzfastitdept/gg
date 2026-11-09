import { useCallback, useEffect, useMemo, useState } from 'react'

const WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

const pad = (n) => String(n).padStart(2, '0')

function toISO(y, m, d) {
  return `${y}-${pad(m + 1)}-${pad(d)}`
}

function todayISO() {
  const d = new Date()
  return toISO(d.getFullYear(), d.getMonth(), d.getDate())
}

function prettyLong(iso) {
  if (!iso) return ''
  const d = new Date(`${iso}T00:00:00`)
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

// Quick-pick days so she does not have to hunt through the calendar.
function buildShortcuts() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const iso = (d) => toISO(d.getFullYear(), d.getMonth(), d.getDate())

  const saturday = new Date(today)
  saturday.setDate(today.getDate() + ((6 - today.getDay() + 7) % 7 || 7))

  const friday = new Date(today)
  friday.setDate(today.getDate() + ((5 - today.getDay() + 7) % 7 || 7))

  const valentine = new Date(today.getFullYear(), 1, 14)
  if (valentine < today) valentine.setFullYear(valentine.getFullYear() + 1)

  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)

  return [
    { label: 'tonight', value: iso(today) },
    { label: 'this saturday', value: iso(saturday) },
    { label: 'next friday', value: iso(friday) },
    { label: 'valentine’s day', value: iso(valentine) },
    { label: 'end of month', value: iso(monthEnd) },
  ]
}

export default function DatePickerModal({
  open,
  value,
  onConfirm,
  onClose,
  suggest = 'SURPRISE ME',
}) {
  const min = todayISO()
  const [draft, setDraft] = useState(value || '')
  const [cursor, setCursor] = useState(() => {
    const base = value ? new Date(`${value}T00:00:00`) : new Date()
    return { year: base.getFullYear(), month: base.getMonth() }
  })

  // escape to close + keep the page behind from scrolling
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  const shortcuts = useMemo(() => buildShortcuts(), [])

  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  })

  const cells = useMemo(() => {
    const firstDay = new Date(cursor.year, cursor.month, 1).getDay()
    const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate()
    const out = []
    for (let i = 0; i < firstDay; i += 1) out.push(null)
    for (let d = 1; d <= daysInMonth; d += 1) out.push(d)
    return out
  }, [cursor])

  const shift = useCallback((delta) => {
    setCursor((c) => {
      const next = new Date(c.year, c.month + delta, 1)
      return { year: next.getFullYear(), month: next.getMonth() }
    })
  }, [])

  if (!open) return null

  const canGoBack = toISO(cursor.year, cursor.month, 1) > min
  const pickedKey = draft
  const daysAway = draft
    ? Math.round(
        (new Date(`${draft}T00:00:00`) - new Date(`${min}T00:00:00`)) / 86400000,
      )
    : null

  return (
    <div className="dp-overlay" onClick={onClose}>
      <div
        className="dp-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dp-title"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="dp-tape dp-tape-l" aria-hidden="true" />
        <span className="dp-tape dp-tape-r" aria-hidden="true" />

        <button type="button" className="dp-close" aria-label="Close" onClick={onClose}>
          ✕
        </button>

        <div className="dp-head">
          <span className="dp-small">♥ a tiny invitation ♥</span>
          <h2 id="dp-title" className="dp-title">
            WHEN SHALL WE MEET?
          </h2>
          <p className="dp-sub">pick a day, and i’ll start counting the sleeps.</p>
        </div>

        <div className="dp-shortcuts">
          {shortcuts.map((s) => (
            <button
              key={s.label}
              type="button"
              className={`dp-chip${draft === s.value ? ' on' : ''}`}
              onClick={() => {
                setDraft(s.value)
                const d = new Date(`${s.value}T00:00:00`)
                setCursor({ year: d.getFullYear(), month: d.getMonth() })
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="dp-cal">
          <div className="dp-cal-head">
            <button
              type="button"
              className="dp-nav"
              aria-label="Previous month"
              disabled={!canGoBack}
              onClick={() => shift(-1)}
            >
              ‹
            </button>

            <div className="dp-ribbon">
              <span>{monthLabel}</span>
            </div>

            <button type="button" className="dp-nav" aria-label="Next month" onClick={() => shift(1)}>
              ›
            </button>
          </div>

          <div className="dp-week">
            {WEEK.map((w, i) => (
              <span key={`${w}-${i}`}>{w}</span>
            ))}
          </div>

          <div className="dp-grid">
            {cells.map((d, i) => {
              if (!d) return <span key={`pad-${i}`} className="dp-pad" aria-hidden="true" />
              const key = toISO(cursor.year, cursor.month, d)
              const disabled = key < min
              const isToday = key === min
              const isPicked = key === pickedKey
              return (
                <button
                  key={key}
                  type="button"
                  className={`dp-day${isPicked ? ' picked' : ''}${isToday ? ' today' : ''}`}
                  disabled={disabled}
                  aria-pressed={isPicked}
                  onClick={() => setDraft(key)}
                >
                  <span className="dp-day-num">{d}</span>
                  {isPicked && <span className="dp-day-heart" aria-hidden="true">♥</span>}
                </button>
              )
            })}
          </div>
        </div>

        <div className={`dp-summary${draft ? ' filled' : ''}`}>
          {draft ? (
            <>
              <span className="dp-sum-date">{prettyLong(draft)}</span>
              <span className="dp-sum-tag">
                {daysAway === 0
                  ? 'today! ♥'
                  : daysAway === 1
                    ? 'tomorrow! ♥'
                    : `${daysAway} sleeps to go`}
                {' · '}
                {suggest}
              </span>
            </>
          ) : (
            <span className="dp-sum-empty">tap a day above… any day is a good day with you.</span>
          )}
        </div>

        <div className="dp-actions">
          <button type="button" className="pixel-btn ghost dp-btn" onClick={onClose}>
            NOT YET
          </button>
          <button
            type="button"
            className="pixel-btn dp-btn"
            disabled={!draft}
            onClick={() => onConfirm(draft)}
          >
            YES, THIS DAY ♥
          </button>
        </div>
      </div>
    </div>
  )
}
