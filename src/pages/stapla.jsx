"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import styles from "@/styles/stapla.module.css";

export default function StaplaPage() {
  const { profile } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [staplaId, setStaplaId] = useState("Stapla 1");

  // 📡 CARGA DE DATOS + REALTIME
  useEffect(() => {
    if (!profile) return;

    const fetchSolicitudes = async () => {
      const { data, error } = await supabase
        .from("solicitudes")
        .select("*")
        .neq("estado", "cerrado")
        .order("created_at", { ascending: false })
        .limit(6);

      if (!error) setSolicitudes(data || []);
    };

    fetchSolicitudes();

    const channel = supabase
      .channel("stapla-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "solicitudes" },
        fetchSolicitudes,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  const crearSolicitud = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Verificación de seguridad: ¿Sigue habiendo usuario?
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        alert("Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.");
        window.location.href = "/";
        return;
      }

      const formData = new FormData(e.target);
      const nuevaSol = {
        area: formData.get("linea"),
        tipo_soporte: formData.get("tipo"),
        idsap_solicitante: profile?.idsap,
        nombre_solicitante: profile?.user_name,
        stapla_id: staplaId,
        estado: "pendiente",
      };

      // 2. Intento de inserción
      const { error } = await supabase.from("solicitudes").insert([nuevaSol]);

      if (error) {
        throw error; // Mandamos el error al bloque catch
      }

      // 3. Éxito
      setIsModalOpen(false);
      e.target.reset();
    } catch (err) {
      console.error("Error completo:", err);
      alert(
        "Error al enviar solicitud: " + (err.message || "Error de conexión"),
      );
    } finally {
      // 4. PASE LO QUE PASE, liberamos el botón
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Panel Stapla - ¡Hola, {profile?.user_name}!</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className={styles.btnSolicitar}
        >
          + NUEVA SOLICITUD
        </button>
      </header>

      {/* Grid de Solicitudes (Cards) */}
      <div className={styles.cardsGrid}>
        {solicitudes.length === 0 ? (
          <p className={styles.noData}>No hay solicitudes activas.</p>
        ) : (
          solicitudes.map((sol) => (
            <div
              key={sol.id}
              className={`${styles.card} ${styles[sol.estado]}`}
            >
              <div className={styles.cardHeader}>
                <span className={styles.badge}>{sol.estado.toUpperCase()}</span>
                <small>{new Date(sol.created_at).toLocaleTimeString()}</small>
              </div>
              <h3>{sol.tipo_soporte}</h3>
              <p>
                <strong>Línea:</strong> {sol.area}
              </p>
              <p>
                <strong>Solicitante:</strong> {sol.nombre_solicitante}
              </p>

              {sol.nombre_calidad && (
                <div className={styles.atendidoPor}>
                  <span>🚀</span>
                  <div>
                    <strong>Soporte asignado:</strong>
                    <br />
                    {sol.nombre_calidad}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* 🟢 MODAL RECUPERADO Y FUNCIONAL */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2>Nueva Solicitud de Apoyo</h2>

            <form onSubmit={crearSolicitud}>
              <div className={styles.selectorContainer}>
                <label>Selecciona tu Estación:</label>
                <select
                  value={staplaId}
                  onChange={(e) => setStaplaId(e.target.value)}
                >
                  <option value="Stapla 1">Stapla 1</option>
                  <option value="Stapla 2">Stapla 2</option>
                  <option value="Stapla 3">Stapla 3</option>
                </select>
              </div>

              <div className={styles.inputGroup}>
                <label>Línea de Producción:</label>
                <select name="linea" required className={styles.select}>
                  <option value="">-- Seleccionar --</option>
                  <option value="Linea 34">Línea 34</option>
                  <option value="Linea 35">Línea 35</option>
                  <option value="Linea 36">Línea 36</option>
                  <option value="Linea 37">Línea 37</option>
                </select>
              </div>

              <div className={styles.inputGroup}>
                <label>Tipo de Soporte:</label>
                <select name="tipo" required className={styles.select}>
                  <option value="Llave">Llave</option>
                  <option value="Revision">Revisión</option>
                  <option value="Auditoria">Auditoría</option>
                </select>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={styles.btnCancel}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={styles.btnConfirm}
                  disabled={loading}
                >
                  {loading ? (
                    <span className={styles.spinnerBtn}>Enviando...</span>
                  ) : (
                    "CONFIRMAR SOLICITUD"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
