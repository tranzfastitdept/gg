import { useCallback, useEffect, useState } from 'react'
import { supabase, supabaseConfigured } from './supabase'

const LOCAL_KEY = 'date-app:memories:v1'

function readLocal() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeLocal(map) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(map))
  } catch {
    // ignore
  }
}

// Memories (photos) per date. Photos live in Supabase Storage bucket
// "memories" when configured; locally they are kept as small data URLs.
export function useMemories() {
  const [memories, setMemories] = useState(readLocal)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!supabaseConfigured) return
    let cancelled = false
    ;(async () => {
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .order('created_at', { ascending: true })
      if (cancelled) return
      if (error) {
        setNotice(`Could not load shared photos yet: ${error.message}`)
      } else if (data) {
        const map = {}
        for (const m of data) {
          if (!map[m.date_id]) map[m.date_id] = []
          map[m.date_id].push({
            id: m.id,
            url: m.photo_url,
            caption: m.caption || '',
            created_at: m.created_at,
          })
        }
        setMemories(map)
        writeLocal(map)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const addMemory = useCallback(
    async (dateRow, file) => {
      const caption = ''

      if (supabaseConfigured) {
        // 1) upload the photo to the "memories" bucket
        const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
        const path = `${dateRow.id}/${Date.now().toString(36)}-${Math.random()
          .toString(36)
          .slice(2, 8)}.${ext}`
        const { error: upErr } = await supabase.storage
          .from('memories')
          .upload(path, file, { upsert: false, contentType: file.type })
        if (upErr) {
          throw new Error(
            `Photo upload failed. Check the "memories" bucket exists: ${upErr.message}`,
          )
        }
        // 2) insert the row pointing at it
        const { data: row, error: insErr } = await supabase
          .from('memories')
          .insert({ date_id: dateRow.id, photo_url: path, caption })
          .select()
          .single()
        if (insErr) throw new Error(insErr.message)
        const item = {
          id: row.id,
          url: row.photo_url,
          caption: row.caption || '',
          created_at: row.created_at,
        }
        setMemories((prev) => {
          const next = { ...prev, [dateRow.id]: [...(prev[dateRow.id] || []), item] }
          writeLocal(next)
          return next
        })
        return item
      }

      // Offline mode: shrink the photo, keep it as a data URL in this browser.
      const url = await shrinkToDataUrl(file)
      const item = {
        id: `local-${Date.now().toString(36)}`,
        url,
        caption,
        created_at: new Date().toISOString(),
      }
      setMemories((prev) => {
        const next = { ...prev, [dateRow.id]: [...(prev[dateRow.id] || []), item] }
        writeLocal(next)
        return next
      })
      return item
    },
    [],
  )

  return { memories, addMemory, notice }
}

function shrinkToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read that photo.'))
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const max = 900
        const scale = Math.min(1, max / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      img.onerror = () => reject(new Error('That file is not a photo.'))
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

// Turn a stored path (or a ready URL) into a displayable URL.
export function memoryUrl(url) {
  if (!url) return ''
  if (url.startsWith('data:') || url.startsWith('http')) return url
  if (supabaseConfigured) {
    const { data } = supabase.storage.from('memories').getPublicUrl(url)
    return data?.publicUrl || url
  }
  return url
}
