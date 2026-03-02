import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/Card';
import styles from '@/styles/calidad.module.css';

export default function CalidadPage() {
  const { profile } = useAuth();
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bannerVisible, setBannerVisible] = useState(true);

  const profileRef = useRef(profile);
  const userInteractedRef = useRef(false);

  useEffect(() => { profileRef.current = profile; }, [profile]);

  // ─── VOZ Y NOTIFICACIONES ────────────────────────────────

  const playVoiceNotification = useCallback((solicitud) => {
    if (!userInteractedRef.current || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const mensaje = `Atención. Nueva solicitud de ${solicitud.tipo_soporte} para ${solicitud.stapla_id} en ${solicitud.area}.`;
    const speech = new SpeechSynthesisUtterance(mensaje);
    speech.lang = "es-MX";
    speech.rate = 0.9;
    const voices = window.speechSynthesis.getVoices();
    speech.voice =
      voices.find(v => v.name.includes("Dalia") && v.name.includes("Online")) ||
      voices.find(v => v.lang === "es-MX") ||
      voices.find(v => v.lang.includes("es"));
    window.speechSynthesis.speak(speech);
  }, []);

  const enviarNotificacion = useCallback((solicitud) => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") {
      new Notification("⚠️ NUEVO AVISO - StaplaGo", {
        body: `${solicitud.area}: ${solicitud.tipo_soporte} en ${solicitud.stapla_id || 'Estación'}`,
        icon: "/logo-icon.png",
        tag: "nuevo-aviso"
      });
    }
    playVoiceNotification(solicitud);
  }, [playVoiceNotification]);

  const activarAudio = useCallback(() => {
    userInteractedRef.current = true;
    setBannerVisible(false);
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    const confirmMsg = new SpeechSynthesisUtterance("Sistema de avisos activado");
    confirmMsg.lang = "es-MX";
    window.speechSynthesis.speak(confirmMsg);
  }, []);

  // ─── CARGA Y REALTIME ────────────────────────────────────

  useEffect(() => {
    if (!profile) return;

    if ("speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }

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
  }, [profile, enviarNotificacion]);

  // ─── ACCIONES ────────────────────────────────────────────

  const atenderSolicitud = useCallback(async (solicitudId) => {
    const currentProfile = profileRef.current;
    if (!currentProfile) return;

    const { error } = await supabase
      .from('solicitudes')
      .update({
        estado: 'en_proceso',
        idsap_calidad: currentProfile.idsap,
        nombre_calidad: currentProfile.user_name,
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

  if (!profile) return <div className={styles.container}>Cargando usuario...</div>;

  // ─── FILTROS ─────────────────────────────────────────────

  const pendientes = solicitudes.filter(s => s.estado === 'pendiente');
  const misAtenciones = solicitudes.filter(
    s => s.estado === 'en_proceso' && s.idsap_calidad === profile.idsap
  );
  const otrosTecnicos = solicitudes.filter(
    s => s.estado === 'en_proceso' && s.idsap_calidad && s.idsap_calidad !== profile.idsap
  );

  // ─── RENDER ──────────────────────────────────────────────

  return (
    <div className={styles.container}>
      {bannerVisible && (
        <div className="audio-banner" onClick={activarAudio}>
          📢 Haz clic aquí para activar las alertas de voz
        </div>
      )}

      <header className={styles.header}>
        <h1>Atención de Avisos - Calidad</h1>
        <div className={styles.userInfo}>
          <p><strong>Usuario:</strong> {profile.user_name}</p>
          <p><small>SAP: {profile.idsap}</small></p>
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
                profile={profile}
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
                profile={profile}
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
                profile={profile}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}