// RoleGate.js
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/router';

const RoleGate = ({ allowedRoles, children }) => {
  const { user, role } = useAuth(); // ✅ Usa loading del contexto, no crea uno propio
  const router = useRouter();
  const [loading, setLoading] = useState(true);


  // ✅ Mientras el contexto verifica la sesión, espera
  if (loading) {
    return (
      <div className="access-container">
        <h2>Validando permisos...</h2>
        <p>Espera un momento.</p>
      </div>
    );
  }

  // ✅ ADMIN siempre pasa, o cualquier rol en la lista
  if (role === 'ADMIN' || allowedRoles.includes(role)) {
    return <>{children}</>;
  }

  return (
    <div className="access-container">
      <h2>No tienes acceso a esta sección</h2>
      <p>
        Tu rol actual <strong>({role})</strong> no tiene permisos para ver este
        contenido.
      </p>
      <button onClick={() => router.back()} className="admingate-back-btn">
        Volver
      </button>
    </div>
  );
};

export default RoleGate;