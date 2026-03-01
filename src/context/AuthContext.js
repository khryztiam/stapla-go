'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (sessionUser) => {
    if (!sessionUser) return null

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', sessionUser.email)
      .single()

    if (error) {
      console.warn('Perfil no encontrado:', error.message)
      return null
    }

    setProfile(data)
    return data
  }

  useEffect(() => {
    let isMounted = true

    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!isMounted) return

      if (session) {
        setUser(session.user)
        await fetchProfile(session.user)
      }

      setLoading(false)
    }

    initAuth()

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange(async (_event, session) => {

        if (!isMounted) return

        if (session) {
          setUser(session.user)
          await fetchProfile(session.user)
        } else {
          setUser(null)
          setProfile(null)
        }

        setLoading(false)
      })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

const logout = async () => {
  try {
    await supabase.auth.signOut(); //
    setUser(null); //
    setProfile(null); //
    // No pongas el window.location aquí para que el Context sea reutilizable
  } catch (error) {
    console.error("Error en signOut:", error);
  }
};

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      role: profile?.rol_name?.toUpperCase() || null,
      loading,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)