
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState('');
  const [role, setRole] = useState('');
  const [idsap, setIdsap] = useState('');
  const [loading, setLoading] = useState(true);

  // ✅ Función login centralizada (tomada del segundo)
  const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    // onAuthStateChange se encarga del resto automáticamente
  }

  useEffect(() => {
  const getSession = async (fromEvent = false) => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);

    if (session?.user) {
      const { data, error } = await supabase
        .from('users')
        .select('user_name, rol_name, idsap')
        .eq('email', session.user.email)
        .single();

      if (data) {
        setUserName(data.user_name);
        setRole(data.rol_name);
        setIdsap(data.idsap);
      } else if (!fromEvent) {
        console.error('Error al obtener datos del usuario:', error);
      }
    }

    if (!fromEvent) {
      setLoading(false);
    }
  };

  getSession(); // carga inicial

  const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
    setUser(session?.user || null);
    if (session?.user) {
      getSession(true); // evita conflicto con loading
    } else {
      setUserName('');
      setRole('');
    }
  });

  return () => {
    if (listener && typeof listener.unsubscribe === 'function') {
      listener.unsubscribe();
    }
  };
}, []);


    // Función de logout
    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setUserName('');
        setRole('');
        setIdsap('');
    };


  return (
    <AuthContext.Provider value={{
      user,
      userName,
      role: role?.toUpperCase(), // ✅ Asegura mayúsculas para consistencia
      loading,
      idsap,
      login,   // ✅ Ahora expuesto
      logout
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)