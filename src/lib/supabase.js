import { createClient } from '@supabase/supabase-js'

// Hard-coded Supabase project details (the publishable key is safe in frontend code).
const SUPABASE_URL = 'https://isfryydofrznfkbgnzqx.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_Ji1ZQL-qzQ1-wGYr5PdoUQ_kuHLsMMn'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
})

export const supabaseConfigured = true

// Kept for callers that want a friendly offline message.
export function dbNotice() {
  return ''
}
