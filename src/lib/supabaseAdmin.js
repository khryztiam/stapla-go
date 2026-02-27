import { createClient } from '@supabase/supabase-js'

// Esta instancia usa la SERVICE_ROLE_KEY para saltarse el RLS y administrar Auth
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Guarda esto en tu .env.local
)