// src/components/RoleGate.js
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext'; // Tu contexto de autenticación
import { useRouter } from 'next/router';

const RoleGate = ({ allowedRoles, children }) => {
  const { user, role } = useAuth();  // Obtener usuario y rol
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && role) {
      setLoading(false);
    }
  }, [user, role]);

  if (loading) {
    return (
      <div className="access-container">
        <h2>Validando permisos...</h2>
        <p>Espera un momento.</p>
      </div>
    );
  }

  if (role === 'ADMIN' || allowedRoles.includes(role)) {
    return children;
  }


  return (
    <div className="access-container">
      <h2>No tienes acceso a esta sección</h2>
      <p>Tu rol actual <strong>({role})</strong> no tiene permisos para ver este contenido.</p>
      <button onClick={() => router.back()} className="admingate-back-btn">Volver</button>
    </div>
  );
};

export default RoleGate;
