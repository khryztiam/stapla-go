'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // CAMBIO 1: Función para cerrar sesión y limpiar todo (útil para destrabar la app)
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    window.location.href = '/login';
  };

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;

        if (session) {
          setUser(session.user);
          const { data, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (profileError) console.error("Error al traer perfil:", profileError.message);
          setProfile(data);
        }
      } catch (err) {
        console.error("Error crítico de auth:", err.message);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        setUser(session.user);
        const { data } = await supabase.from('users').select('*').eq('id', session.user.id).single();
        setProfile(data);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  // CAMBIO 2: Mejoramos el retorno para evitar la pantalla en blanco
  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {/* Si está cargando, mostramos un aviso simple en lugar de nada. 
         Si ya terminó de cargar, renderizamos los hijos.
      */}
      {loading ? (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          fontFamily: 'sans-serif' 
        }}>
          <h3>Estableciendo conexión segura...</h3>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);