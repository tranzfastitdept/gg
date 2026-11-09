import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase, supabaseConfigured } from './supabase'

const LOCAL_KEY = 'date-app:v1'

function loadLocal() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveLocal(rows) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(rows))
  } catch {
    // storage full or blocked - ignore quietly
  }
}

function uid() {
  if (crypto?.randomUUID) return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

// Keeps dates in Supabase when it is configured, and in this browser's
// localStorage otherwise, so the app works before setup and is shared
// after setup.
export function useDates() {
  const [dates, setDates] = useState(loadLocal)
  const [loading, setLoading] = useState(supabaseConfigured)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!supabaseConfigured) return
    let cancelled = false
    ;(async () => {
      const { data, error } = await supabase
        .from('dates')
        .select('*')
        .order('date', { ascending: true })
      if (cancelled) return
      if (error) {
        setNotice(
          'Could not load shared dates yet. Make sure the table was created by running the SQL file. Showing dates saved in this browser for now.',
        )
        setDates(loadLocal())
      } else if (data) {
        setDates(data)
        saveLocal(data)
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const persist = useCallback((next) => {
    setDates(next)
    saveLocal(next)
  }, [])

  const addDate = useCallback(
    async (input) => {
      const row = {
        id: uid(),
        date: input.date,
        activity: input.activity,
        note: input.note || '',
        status: input.status || 'scheduled',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      persist([...dates, row])
      if (supabaseConfigured) {
        const { error } = await supabase.from('dates').insert({
          date: row.date,
          activity: row.activity,
          note: row.note,
          status: row.status,
        })
        if (error) {
          setNotice(`Saved in this browser only: ${error.message}`)
        } else {
          setNotice('Saved. You and your partner share this date now.')
        }
      }
      return row
    },
    [dates, persist],
  )

  const updateDate = useCallback(
    async (id, patch) => {
      const next = dates.map((d) =>
        d.id === id ? { ...d, updated_at: new Date().toISOString(), ...patch } : d,
      )
      persist(next)
      if (supabaseConfigured) {
        const { error } = await supabase
          .from('dates')
          .update(patch)
          .eq('id', id)
        if (error) setNotice(`Could not update shared date: ${error.message}`)
      }
    },
    [dates, persist],
  )

  const upcoming = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const t = today.getTime()
    return dates
      .filter((d) => new Date(d.date + 'T00:00:00').getTime() >= t)
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [dates])

  const past = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const t = today.getTime()
    return dates
      .filter((d) => new Date(d.date + 'T00:00:00').getTime() < t)
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [dates])

  return {
    dates,
    upcoming,
    past,
    loading,
    notice,
    configured: supabaseConfigured,
    addDate,
    updateDate,
  }
}
