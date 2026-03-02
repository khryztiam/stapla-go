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
        getItem: (key) => (typeof window !== "undefined" ? localStorage.getItem(key) : null),
        setItem: (key, value) => (typeof window !== "undefined" ? localStorage.setItem(key, value) : null),
        removeItem: (key) => (typeof window !== "undefined" ? localStorage.removeItem(key) : null),
      },
    },
    // Esto es lo que tenías en Pallet Go y ayuda a la estabilidad
    global: {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    }
  }
)