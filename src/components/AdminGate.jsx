import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';

export const roleRoutes = {
  ADMIN: ['/admin/admin', '/calidad', '/stapla', '/dashboard'],
  STAPLA: ['/stapla', '/dashboard'],
  CALIDAD: ['/calidad', '/dashboard'],
};

export default function AdminGate({ children }) {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  const allowedRoutes = roleRoutes[role] || [];
  const isAccessDenied = user && !allowedRoutes.includes(router.pathname);

  if (loading) return null;

  // Guard defensivo: _app ya redirige invitados en rutas privadas.
  if (!user) return null;

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