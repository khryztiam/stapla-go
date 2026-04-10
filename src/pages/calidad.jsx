import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/Card';
import styles from '@/styles/calidad.module.css';

export default function CalidadPage() {
  const { userName, role, idsap } = useAuth();
  const [solicitudes, setSolicitudes]      = useState([]);
  const [loading, setLoading]               = useState(true);
  const [userInteracted, setUserInteracted] = useState(false);

  const audioRef    = useRef(null);
  const userNameRef = useRef(userName);
  const roleRef     = useRef(role);
  const idsapRef    = useRef(idsap);

  useEffect(() => { userNameRef.current = userName; }, [userName]);
  useEffect(() => { roleRef.current = role; },        [role]);
  useEffect(() => { idsapRef.current = idsap; },      [idsap]);

  // Desbloqueo de audio — useEffect separado para no re-suscribir el canal
  useEffect(() => {
    const unlock = () => {
      setUserInteracted(true);
      if (audioRef.current) audioRef.current.load();
    };
    document.addEventListener('click',      unlock, { once: true });
    document.addEventListener('touchstart', unlock, { once: true });
    document.addEventListener('keydown',    unlock, { once: true });
    return () => {
      document.removeEventListener('click',      unlock);
      document.removeEventListener('touchstart', unlock);
      document.removeEventListener('keydown',    unlock);
    };
  }, []);

  // Precarga de voces — useEffect separado
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
  }, []);

  // Permisos de notificación al montar
  useEffect(() => {
    if (!("Notification" in window)) return;
    if (Notification.permission === 'default') Notification.requestPermission();
  }, []);

  // ─── NOTIFICACIONES ──────────────────────────────────────

  const enviarNotificacion = useCallback((solicitud) => {
    // 1. MP3 — funciona aunque la ventana esté minimizada o en otra pestaña
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }

    // 2. Push de escritorio — prioridad cuando no hay foco
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('⚠️ NUEVO AVISO - StaplaGo', {
        body: `${solicitud.area}: ${solicitud.tipo_soporte} en ${solicitud.stapla_id || 'Estación'}`,
        icon: '/logo-icon.png',
        tag: `aviso-${solicitud.id}`,
        requireInteraction: true,
        renotify: true,
      });
    }

    // 3. Voz — solo si la pestaña tiene foco
    if (!("speechSynthesis" in window) || document.hidden) return;
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(
      `Atención. Nueva solicitud de ${solicitud.tipo_soporte} para ${solicitud.stapla_id} en ${solicitud.area}.`
    );
    speech.lang = 'es-MX';
    speech.rate = 0.9;
    const voices = window.speechSynthesis.getVoices();
    speech.voice =
      voices.find(v => v.name.includes('Dalia') && v.name.includes('Online')) ||
      voices.find(v => v.lang === 'es-MX') ||
      voices.find(v => v.lang.startsWith('es')) ||
      null;
    window.speechSynthesis.speak(speech);
  }, []);

  // ─── CARGA Y REALTIME ────────────────────────────────────

  useEffect(() => {
    if (!userName) return;

    const loadInitialData = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('solicitudes')
        .select('*')
        .neq('estado', 'cerrado')
        .order('created_at', { ascending: true });

      if (!error) setSolicitudes(data || []);
      setLoading(false);
    };

    loadInitialData();

    const channel = supabase
      .channel('calidad-realtime')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'solicitudes' },
        (payload) => {
          const nueva = payload.new;
          if (nueva.estado !== 'cerrado') {
            setSolicitudes(prev => {
              const existe = prev.some(s => s.id === nueva.id);
              if (existe) return prev;
              return [...prev, nueva];
            });
            enviarNotificacion(nueva);
          }
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'solicitudes' },
        (payload) => {
          const actualizada = payload.new;
          if (actualizada.estado === 'cerrado') {
            setSolicitudes(prev => prev.filter(s => s.id !== actualizada.id));
          } else {
            setSolicitudes(prev =>
              prev.map(s => s.id === actualizada.id ? actualizada : s)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, [userName, enviarNotificacion]);

  // ─── ACCIONES ────────────────────────────────────────────

  const atenderSolicitud = useCallback(async (solicitudId) => {
    const currentUserName = userNameRef.current; // ✅
    const currentIdsap = idsapRef.current;       // ✅
    if (!currentUserName) return;

    const { error } = await supabase
      .from('solicitudes')
      .update({
        estado: 'en_proceso',
        idsap_calidad: currentIdsap,
        nombre_calidad: currentUserName,
        fecha_inicio_soporte: new Date().toISOString()
      })
      .eq('id', solicitudId);

    if (error) alert("Error al atender: " + error.message);
  }, []);

  const finalizarSolicitud = useCallback(async (solicitudId) => {
    const { error } = await supabase
      .from('solicitudes')
      .update({
        estado: 'cerrado',
        fecha_fin_soporte: new Date().toISOString()
      })
      .eq('id', solicitudId);

    if (error) alert("Error al finalizar: " + error.message);
  }, []);

  if (!userName) return <div className={styles.container}>Cargando usuario...</div>;

  // ─── FILTROS ─────────────────────────────────────────────

  const pendientes = solicitudes.filter(s => s.estado === 'pendiente');
  const misAtenciones = solicitudes.filter(
    s => s.estado === 'en_proceso' && s.idsap_calidad === idsap
  );
  const otrosTecnicos = solicitudes.filter(
    s => s.estado === 'en_proceso' && s.idsap_calidad && s.idsap_calidad !== idsap
  );

  // ─── RENDER ──────────────────────────────────────────────

  return (
    <div className={styles.container}>
      {/* Audio oculto — se reproduce aunque la ventana esté minimizada */}
      <audio ref={audioRef} preload="auto" style={{ display: 'none' }}>
        <source src="/nuevo_aviso.mp3" type="audio/mpeg" />
      </audio>

      {!userInteracted && (
        <div className="audio-banner">
          👆 Haz clic en cualquier lugar para activar las notificaciones de audio
        </div>
      )}

      <header className={styles.header}>
        <h1>Atención de Avisos - Calidad</h1>
        <div className={styles.userInfo}>
          <p><strong>Usuario:</strong> {userName}</p>
          <p><small>SAP: {idsap}</small></p>
        </div>
      </header>

      {loading && <p className={styles.loading}>Cargando solicitudes...</p>}

      {misAtenciones.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>🛠️ MIS ATENCIONES ACTUALES</h2>
          <div className={styles.cardsGrid}>
            {misAtenciones.map(sol => (
              <Card
                key={sol.id}
                order={sol}
                variant="calidad"
                onAtender={atenderSolicitud}
                onFinalizar={finalizarSolicitud}
                profile={{ userName, idsap, role }}
              />
            ))}
          </div>
        </section>
      )}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>🔥 AVISOS PENDIENTES</h2>
        <div className={styles.cardsGrid}>
          {pendientes.length === 0 ? (
            <p className={styles.empty}>✅ No hay avisos nuevos.</p>
          ) : (
            pendientes.map(sol => (
              <Card
                key={sol.id}
                order={sol}
                variant="calidad"
                onAtender={atenderSolicitud}
                profile={{ userName, idsap, role }}
              />
            ))
          )}
        </div>
      </section>

      {otrosTecnicos.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>👥 SIENDO ATENDIDOS POR OTROS</h2>
          <div className={styles.cardsGrid}>
            {otrosTecnicos.map(sol => (
              <Card
                key={sol.id}
                order={sol}
                variant="calidad"
                profile={{ userName, idsap, role }}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}