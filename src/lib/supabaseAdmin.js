import { createClient } from '@supabase/supabase-js'

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY, // Clave privada
  {
    auth: {
      autoRefreshToken: false, // El admin no necesita refrescar token
      persistSession: false,   // 🚨 VITAL: No guarda sesión en localStorage
      detectSessionInUrl: false
    }
  }
)