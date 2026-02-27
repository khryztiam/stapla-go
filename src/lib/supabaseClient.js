import { createBrowserClient } from '@supabase/ssr'

// No pongas esto dentro de ninguna función o useEffect
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);