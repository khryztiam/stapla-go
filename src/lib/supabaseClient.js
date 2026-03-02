// lib/supabaseClient.js — único archivo, borra los otros dos
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      storage: {
        // ✅ Manejo explícito de localStorage para Pages Router
        getItem: (key) => (typeof window !== "undefined" ? localStorage.getItem(key) : null),
        setItem: (key, value) => (typeof window !== "undefined" ? localStorage.setItem(key, value) : null),
        removeItem: (key) => (typeof window !== "undefined" ? localStorage.removeItem(key) : null),
      },
    }
  }
)