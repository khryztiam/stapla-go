import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';

const roleRoutes = {
  ADMIN: ['/admin/admin', '/calidad', '/stapla', '/dashboard'],
  STAPLA: ['/stapla', '/dashboard'],
  CALIDAD: ['/calidad', '/dashboard'],
};

export default function AdminGate({ children }) {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  // 1. Definimos rutas abiertas
  const openRoutes = ['/', '/login'];
  const isOpenRoute = openRoutes.includes(router.pathname);

  // 2. Calculamos el acceso derivado (SIN useState)
  // Si no hay usuario y no es ruta abierta -> denegado (mientras redirige)
  // Si hay usuario y la ruta no está en sus permitidas -> denegado
  const allowedRoutes = roleRoutes[role] || [];
  const isAccessDenied = user && !isOpenRoute && !allowedRoutes.includes(router.pathname);

  useEffect(() => {
    if (loading) return;

    // Redirección si no está logueado y trata de entrar a una ruta privada
    if (!user && !isOpenRoute) {
      router.replace('/');
      return;
    }

    // Redirección si ya está logueado pero intenta ir al login o raíz
    if (user && isOpenRoute) {
      const targetRoute = roleRoutes[role]?.[0] || '/dashboard';
      router.replace(targetRoute);
    }
  }, [user, role, loading, router.pathname, isOpenRoute]);

  if (loading) return null;

  // 3. Si el acceso es denegado, mostramos el modal directamente
  if (isAccessDenied) {
    return (
      <div className="admingate-modal-container">
        <div className='admingate-modal-content'>
          <h2>🚫 Acceso Denegado</h2>
          <p>El usuario <strong>{user?.email}</strong> con rol <strong>{role}</strong> no tiene permisos aquí.</p>
          <button 
            onClick={() => router.push(roleRoutes[role]?.[0] || '/')} 
            className="admingate-back-btn"
          >
            Volver a mi área
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}