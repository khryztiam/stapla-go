'use server'
import { createClient } from '@/lib/supabaseServer' // <--- Usamos el nuevo cliente

export async function login(formData) {
  const idsap = formData.get('idsap')
  const password = formData.get('password')
  const email = `${idsap}@yazaki.com`

  const supabase = await createClient() // <--- Esperamos al cliente de servidor

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { success: false, error: "Credenciales inválidas" }
  }

  return { success: true }
}