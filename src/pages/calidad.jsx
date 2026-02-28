'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import styles from '@/styles/calidad.module.css';

export default function CalidadPage() {
  const { profile } = useAuth();
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(false);

  // 1. Lógica de Notificación
  const enviarNotificacion = useCallback((solicitud) => {
    if (!("Notification" in window)) return;
    
    if (Notification.permission === "granted") {
      new Notification("⚠️ NUEVO AVISO - StaplaGo", {
        body: `${solicitud.area}: ${solicitud.tipo_soporte} en ${solicitud.stapla_id || 'Estación'}`,
        icon: "/logo-icon.png", // Asegúrate de tener un icono en public/
        tag: "nuevo-aviso"
      });
      // Opcional: Sonido
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(() => {}); 
    }
  }, []);

  // 2. FUNCIÓN PARA ACTIVAR PERMISOS (Se activará al hacer clic)
  const activarNotificaciones = () => {
    if ("Notification" in window) {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          alert("¡Excelente! Notificaciones activadas.");
        } else {
          alert("Permiso denegado. Revisa el candado en la barra de direcciones.");
        }
      });
    }
  };

  const fetchSolicitudes = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('solicitudes')
      .select('*')
      .neq('estado', 'cerrado')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error cargando solicitudes:', error);
    } else {
      setSolicitudes(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // 2. Pedir permiso al técnico apenas entre
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    fetchSolicitudes();

    const channel = supabase
      .channel('calidad-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'solicitudes' },
        (payload) => {
          // Si es un INSERT, lanzamos la notificación
          if (payload.eventType === 'INSERT') {
            enviarNotificacion(payload.new);
          }
          fetchSolicitudes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSolicitudes, enviarNotificacion]);

  const actualizarEstado = async (id, nuevoEstado) => {
    if (!profile) return;
    const updates = { 
      estado: nuevoEstado,
      idsap_calidad: profile.idsap, 
      nombre_calidad: profile.user_name 
    };

    if (nuevoEstado === 'en_proceso') updates.fecha_inicio_soporte = new Date().toISOString();
    if (nuevoEstado === 'cerrado') updates.fecha_fin_soporte = new Date().toISOString();

    const { error } = await supabase.from('solicitudes').update(updates).eq('id', id);
    if (error) alert("Error: " + error.message);
  };

  // --- RENDERS Y FILTROS (Se mantienen igual a tu código) ---
  if (!profile) return <div className={styles.container}>Cargando usuario...</div>;

  const pendientes = solicitudes.filter(s => s.estado === 'pendiente');
  const misAtenciones = solicitudes.filter(s => s.estado === 'en_proceso' && s.idsap_calidad === profile.idsap);
  const otrosTecnicos = solicitudes.filter(s => s.estado === 'en_proceso' && s.idsap_calidad && s.idsap_calidad !== profile.idsap);

  const renderItem = (sol, esMio = false) => (
    <div key={sol.id} className={`${styles.item} ${styles[sol.estado]}`}>
      <div className={styles.info}>
        <span className={styles.time}>{sol.created_at ? new Date(sol.created_at).toLocaleTimeString() : '--'}</span>
        <h3>{sol.area} - {sol.tipo_soporte}</h3>
        <p>Solicitado por: <strong>{sol.nombre_solicitante}</strong></p>
        <p><small>Ubicación: {sol.stapla_id || 'N/A'}</small></p>
        {sol.nombre_calidad && !esMio && <p className={styles.atendidoPor}>👤 Atendiendo: {sol.nombre_calidad}</p>}
      </div>
      <div className={styles.actions}>
        {sol.estado === 'pendiente' && <button onClick={() => actualizarEstado(sol.id, 'en_proceso')} className={styles.btnAtender}>ATENDER</button>}
        {esMio && <button onClick={() => actualizarEstado(sol.id, 'cerrado')} className={styles.btnFinalizar}>FINALIZAR</button>}
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      <header className={styles.header} onClick={activarNotificaciones} style={{cursor: 'pointer'}}>
        <h1>Atención de Avisos - Calidad</h1>
        <div className={styles.userInfo}>
          <p><strong>Usuario:</strong> {profile.user_name}</p>
          <p><small>SAP: {profile.idsap}</small></p>
        </div>
      </header>
      {loading && <p className={styles.loadingAvisos}>Actualizando lista...</p>}
      
      {/* Listas de Atenciones, Pendientes y Otros... (Igual a tu código) */}
      {misAtenciones.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>🛠️ MIS ATENCIONES ACTUALES</h2>
          <div className={styles.listContainer}>{misAtenciones.map(sol => renderItem(sol, true))}</div>
        </section>
      )}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>🔥 AVISOS PENDIENTES</h2>
        <div className={styles.listContainer}>
          {pendientes.length === 0 ? <p className={styles.empty}>✅ No hay avisos nuevos.</p> : pendientes.map(sol => renderItem(sol))}
        </div>
      </section>
      {otrosTecnicos.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>👥 SIENDO ATENDIDOS POR OTROS</h2>
          <div className={styles.listContainer} style={{ opacity: 0.7 }}>{otrosTecnicos.map(sol => renderItem(sol))}</div>
        </section>
      )}
    </div>
  );
}