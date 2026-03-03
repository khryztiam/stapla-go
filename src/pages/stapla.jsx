import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/Card";
import styles from "@/styles/stapla.module.css";

export default function StaplaPage() {
  const { userName, role, idsap } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [solicitudes, setSolicitudes] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [staplaId, setStaplaId] = useState("Stapla 1");
  const [formData, setFormData] = useState({ linea: "", tipo: "Llave" });

  const userNameRef = useRef(userName);
const idsapRef = useRef(idsap);
  const formDataRef = useRef(formData);
  const staplaIdRef = useRef(staplaId);
  const submittingRef = useRef(false);

  useEffect(() => { userNameRef.current = userName; }, [userName]);
  useEffect(() => { idsapRef.current = idsap; }, [idsap]);
  useEffect(() => { formDataRef.current = formData; }, [formData]);
  useEffect(() => { staplaIdRef.current = staplaId; }, [staplaId]);


  const fetchSolicitudes = useCallback(async () => {
    const { data, error } = await supabase
      .from("solicitudes")
      .select("*")
      .neq("estado", "cerrado")
      .order("created_at", { ascending: false })
      .limit(6);
    if (!error) setSolicitudes(data || []);
  }, []);

  useEffect(() => {
    if (!userName) return;
    fetchSolicitudes();

    const channel = supabase
      .channel("stapla-realtime")
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "solicitudes" },
        (payload) => {
          const nueva = payload.new;
          if (nueva.estado !== "cerrado") {
            setSolicitudes(prev => {
              const existe = prev.some(s => s.id === nueva.id);
              if (existe) return prev;
              return [nueva, ...prev].slice(0, 6);
            });
          }
        }
      )
      .on("postgres_changes",
        { event: "UPDATE", schema: "public", table: "solicitudes" },
        (payload) => {
          const actualizada = payload.new;
          if (actualizada.estado === "cerrado") {
            setSolicitudes(prev => prev.filter(s => s.id !== actualizada.id));
          } else {
            setSolicitudes(prev =>
              prev.map(s => s.id === actualizada.id ? actualizada : s)
            );
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [userName, fetchSolicitudes]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const crearSolicitud = useCallback(async (e) => {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);

    const currentUserName = userNameRef.current; // ✅ ref correcto
    const currentFormData = formDataRef.current;
    const currentStaplaId = staplaIdRef.current;
    const currentIdsap = idsapRef.current

    try {
      const { data, error } = await supabase
        .from("solicitudes")
        .insert([{
          area: currentFormData.linea,
          tipo_soporte: currentFormData.tipo,
          idsap_solicitante: currentIdsap,
          nombre_solicitante: currentUserName,
          stapla_id: currentStaplaId,
          estado: "pendiente",
        }])
        .select();

      if (error) throw error;

      if (data) {
        setSolicitudes(prev => {
          const existe = prev.some(s => s.id === data[0].id);
          if (existe) return prev;
          return [data[0], ...prev].slice(0, 6);
        });
      }

      setIsModalOpen(false);
      setStaplaId("Stapla 1");
      setFormData({ linea: "", tipo: "Llave" });

    } catch (err) {
      console.error("Error:", err);
      alert("Error al enviar: " + (err.message || "Error de conexión"));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, []);

  if (!userName) return <div className={styles.container}>Cargando...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Panel Stapla - ¡Hola, {userName}!</h1>
        <button
          onClick={() => {
            setStaplaId("Stapla 1");
            setIsModalOpen(true);
          }}
          className={styles.btnSolicitar}
        >
          + NUEVA SOLICITUD
        </button>
      </header>

      <div className={styles.cardsGrid}>
        {solicitudes.length === 0 ? (
          <p className={styles.noData}>No hay solicitudes activas.</p>
        ) : (
          // ✅ order={sol} directo — Card maneja sus propios campos
          solicitudes.map(sol => (
            <Card
              key={sol.id}
              order={sol}
              variant="stapla"
            />
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Nueva Solicitud de Apoyo</h2>
            <form onSubmit={crearSolicitud}>
              <div className={styles.inputGroup}>
                <label>Selecciona tu Estación:</label>
                <select
                  value={staplaId}
                  onChange={(e) => setStaplaId(e.target.value)}
                  className={styles.select}
                  required
                >
                  <option value="Stapla 1">Stapla 1</option>
                  <option value="Stapla 2">Stapla 2</option>
                  <option value="Stapla 3">Stapla 3</option>
                </select>
              </div>

              <div className={styles.inputGroup}>
                <label>Línea de Producción:</label>
                <select
                  name="linea"
                  value={formData.linea}
                  onChange={handleChange}
                  required
                  className={styles.select}
                >
                  <option value="">-- Seleccionar --</option>
                  <option value="Linea 34">Línea 34</option>
                  <option value="Linea 35">Línea 35</option>
                  <option value="Linea 36">Línea 36</option>
                  <option value="Linea 37">Línea 37</option>
                </select>
              </div>

              <div className={styles.inputGroup}>
                <label>Tipo de Soporte:</label>
                <select
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleChange}
                  required
                  className={styles.select}
                >
                  <option value="Llave">Llave</option>
                  <option value="Revision">Revisión</option>
                  <option value="Auditoria">Auditoría</option>
                </select>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-danger"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-success"
                  disabled={submitting}
                >
                  {submitting ? "ENVIANDO..." : "CONFIRMAR SOLICITUD"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}