'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Función para obtener los datos extendidos del usuario (nombre y rol)
  const fetchProfile = async (sessionUser) => {
    try {
      if (!sessionUser) return;

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('idsap', sessionUser.user_metadata.idsap)
        .single();

      if (data) {
        setProfile(data);
      } else {
        console.warn("No se encontró perfil en la tabla 'users' para el ID SAP proporcionado.");
      }
    } catch (err) {
      console.error("Error al obtener perfil:", err.message);
    } finally {
      // Importante: Apagamos el loading aquí para que la app cargue
      setLoading(false);
    }
  };

  useEffect(() => {
    // 1. Verificación inicial de sesión al cargar la página
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        await fetchProfile(session.user);
      } else {
        setLoading(false); // Si no hay sesión, dejamos de cargar para mostrar el Login
      }
    };

    initializeAuth();

    // 2. Suscripción a cambios de estado (Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        setUser(session.user);
        await fetchProfile(session.user);
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      role: profile?.rol_name?.toUpperCase() || null, // Acceso rápido al rol
      loading, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);