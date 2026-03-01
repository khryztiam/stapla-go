import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const { user, loading, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // 1. Esperamos a que AuthProvider determine si hay sesión
    if (loading) return;

    // 2. Si no hay usuario, mandamos al login de inmediato
    if (!user) {
      router.replace('/login');
    } 
    // 3. Si hay usuario, lo mandamos a su panel correspondiente según su rol
    else {
      if (role === 'ADMIN') {
        router.replace('/dashboard');
      } else if (role === 'STAPLA') {
        router.replace('/stapla');
      } else if (role === 'CALIDAD') {
        router.replace('/calidad');
      } else {
        // Por si acaso un rol no está definido
        router.replace('/login');
      }
    }
  }, [user, loading, role, router]);

  // Retornamos null para que la pantalla esté limpia mientras ocurre la redirección
  return null;
}