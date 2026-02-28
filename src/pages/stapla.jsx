"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import styles from "@/styles/stapla.module.css";

export default function StaplaPage() {
  const { profile, loading: authLoading, role } = useAuth();
  const router = useRouter();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [staplaId, setStaplaId] = useState("Stapla 1");

  // 🔐 PROTECCIÓN DE RUTA
  useEffect(() => {
    if (authLoading) return; // todavía validando

    const isAuthorized =
      profile && (role === "STAPLA" || role === "ADMIN");

    if (!isAuthorized) {
      if (role === "CALIDAD") {
        router.replace("/calidad");
      } else {
        router.replace("/login");
      }
    }
  }, [authLoading, profile, role, router]);

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

      if (!error) {
        setSolicitudes(data || []);
      }
    };

    fetchSolicitudes();

    const channel = supabase
      .channel("stapla-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "solicitudes" },
        fetchSolicitudes
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  const crearSolicitud = async (e) => {
    e.preventDefault();

    if (!profile) {
      alert("Sesión expirada, por favor reingresa.");
      router.replace("/login");
      return;
    }

    setLoading(true);
    const formData = new FormData(e.target);

    const nuevaSol = {
      area: formData.get("linea"),
      tipo_soporte: formData.get("tipo"),
      idsap_solicitante: profile.idsap,
      nombre_solicitante: profile.user_name,
      stapla_id: staplaId,
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

  // ⏳ Estado de carga inicial
  if (authLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Validando credenciales...</p>
      </div>
    );
  }

  // 🚫 Si no hay perfil, no renderizamos nada
  if (!profile) return null;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Panel Stapla - ¡Hola, {profile.user_name}!</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className={styles.btnSolicitar}
        >
          + NUEVA SOLICITUD
        </button>
      </header>

      <div className={styles.cardsGrid}>
        {solicitudes.length === 0 ? (
          <p className={styles.noData}>No hay solicitudes activas.</p>
        ) : (
          solicitudes.map((sol) => (
            <div key={sol.id} className={`${styles.card} ${styles[sol.estado]}`}>
              <div className={styles.cardHeader}>
                <span className={styles.badge}>
                  {sol.estado.toUpperCase()}
                </span>
                <small>
                  {new Date(sol.created_at).toLocaleTimeString()}
                </small>
              </div>

              <h3>{sol.tipo_soporte}</h3>
              <p><strong>Línea:</strong> {sol.area}</p>
              <p><strong>Solicitante:</strong> {sol.nombre_solicitante}</p>

              {sol.nombre_calidad && (
                <div className={styles.atendidoPor}>
                  <span>🚀</span>
                  <div>
                    <strong>Soporte asignado:</strong><br />
                    {sol.nombre_calidad}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          {/* Tu modal aquí */}
        </div>
      )}
    </div>
  );
}