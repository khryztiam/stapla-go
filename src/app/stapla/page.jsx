"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext"; // 1. Importamos el hook
import styles from "./stapla.module.css";

export default function StaplaPage() {
  const { profile, loading: authLoading } = useAuth(); // 2. Extraemos el perfil real
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [staplaId, setStaplaId] = useState("Stapla 1");

  // 3. Efecto para cargar solicitudes (Realtime)
  useEffect(() => {
    if (!profile) return;

    const fetchSolicitudes = async () => {
      const { data } = await supabase
        .from("solicitudes")
        .select("*")
        .neq('estado', 'cerrado')
        .order("created_at", { ascending: false })
        .limit(6);
      setSolicitudes(data || []);
    };

    fetchSolicitudes();

    const channel = supabase
      .channel("realtime-solicitudes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "solicitudes" },
        fetchSolicitudes,
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [profile]);

  const crearSolicitud = async (e) => {
    e.preventDefault();
    if (!profile) return alert("Sesión no válida");

    setLoading(true);
    const formData = new FormData(e.target);

    const nuevaSol = {
      area: formData.get("linea"),
      tipo_soporte: formData.get("tipo"),
      idsap_solicitante: profile.idsap, // <--- Usamos el perfil real
      nombre_solicitante: profile.user_name, // <--- Usamos el perfil real
      stapla_id: staplaId, // <--- Guardamos el ID de la Stapla
      estado: "pendiente",
    };

    const { error } = await supabase.from("solicitudes").insert([nuevaSol]);

    if (!error) {
      setIsModalOpen(false);
    } else {
      alert("Error al enviar: " + error.message);
    }
    setLoading(false);
  };

  if (authLoading)
    return <div className={styles.loading}>Cargando perfil...</div>;


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

      {/* Grid de Cards */}
      <div className={styles.cardsGrid}>
        {solicitudes.map((sol) => (
          <div key={sol.id} className={`${styles.card} ${styles[sol.estado]}`}>
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

            {/* Lógica para mostrar quién atiende */}
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
        ))}
      </div>

      {/* Modal de Solicitud */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2>Nueva Solicitud de Apoyo</h2>
            <form onSubmit={crearSolicitud}>
              <div className={styles.inputGroup}>
                <label>Línea de Producción:</label>
                <select name="linea" required className={styles.select}>
                  <option value="">-- Seleccionar --</option>
                  <option value="Linea 34">Linea 34</option>
                  <option value="Linea 35">Linea 35</option>
                  <option value="Linea 36">Linea 36</option>
                </select>
              </div>

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
                <label>Tipo de Soporte:</label>
                <select name="tipo" required className={styles.select}>
                  <option value="Llave">Llave</option>
                  <option value="Cambio de Modelo">Cambio de Modelo</option>
                  <option value="Falla Técnica">Falla Técnica</option>
                  <option value="Auditoría">Auditoría</option>
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
                  disabled={loading || !profile} // Bloqueado si no hay perfil
                >
                  {loading ? "Enviando..." : "CONFIRMAR SOLICITUD"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
