
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // ✅ Función login centralizada (tomada del segundo)
  const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    // onAuthStateChange se encarga del resto automáticamente
  }

  // ✅ Ahora recibe el session directamente (no hace segunda llamada a Supabase)
  // ✅ Busca por id en vez de email
  // ✅ fromEvent controla si debe tocar loading
  const fetchProfile = async (sessionUser, fromEvent = false) => {
    if (!sessionUser) return null

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', sessionUser.id)   // ✅ Busca por UUID, no por email
      .single()

    if (error) {
      if (!fromEvent) console.warn('Perfil no encontrado:', error.message)
      return null
    }

    setProfile(data)
    return data
  }

  useEffect(() => {
    let isMounted = true  // ✅ Previene memory leaks (mantenido del primero)

   // ✅ Seguro por si onAuthStateChange tarda en disparar INITIAL_SESSION
  const safetyTimeout = setTimeout(() => {
    if (isMounted) setLoading(false)
  }, 3000)

  const { data: { subscription } } =
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return

      clearTimeout(safetyTimeout) // ✅ Cancelar si llegó a tiempo

      if (session?.user) {
        setUser(session.user)
        await fetchProfile(session.user, true)
      } else {
        setUser(null)
        setProfile(null)
      }

      setLoading(false)
    })

  return () => {
    isMounted = false
    clearTimeout(safetyTimeout)
    if (subscription && typeof subscription.unsubscribe === 'function') {
      subscription.unsubscribe()
    }
  }
}, [])

  const logout = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
    } catch (error) {
      console.error('Error en signOut:', error)
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      role: profile?.rol_name?.toUpperCase() || null,
      loading,
      login,   // ✅ Ahora expuesto
      logout
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)