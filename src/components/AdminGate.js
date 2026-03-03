// AdminGate.js
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';

export const roleRoutes = {
  ADMIN: ['/admin/admin', '/calidad', '/stapla', '/dashboard','/test'],
  STAPLA: ['/stapla', '/dashboard'],
  CALIDAD: ['/calidad', '/dashboard'],
};

const openRoutes = ['/', '/login']; // ✅ Fuera del componente, no se recrea en cada render

export default function AdminGate({ children }) {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  const isOpenRoute = openRoutes.includes(router.pathname);
  const allowedRoutes = roleRoutes[role] || [];
  const isAccessDenied = user && !isOpenRoute && !allowedRoutes.includes(router.pathname);

  useEffect(() => {
    if (loading) return;

    if (!user && !isOpenRoute) {
      router.replace('/');
      return;
    }

    if (user && isOpenRoute) {
      const targetRoute = roleRoutes[role]?.[0] || '/dashboard';
      router.replace(targetRoute);
    }
  }, [user, role, loading, router.pathname]); // ✅ isOpenRoute es derivada, no necesita ir

  if (loading) return null;

  // ✅ Guard explícito: sin sesión en ruta privada, no renderiza nada mientras redirige
  if (!user && !isOpenRoute) return null;

  if (isAccessDenied) {
    return (
      <div className="admingate-modal-container">
        <div className="admingate-modal-content">
          <h2>🚫 Acceso Denegado</h2>
          <p>
            El usuario <strong>{user?.email}</strong> con rol{' '}
            <strong>{role}</strong> no tiene permisos aquí.
          </p>
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