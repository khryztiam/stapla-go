"use client";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import styles from "@/styles/dashboard.module.css";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Download, Clock, Ticket, Calendar, Zap } from "lucide-react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export default function DashboardPage() {
  const { loading: authLoading } = useAuth();
  const [cards, setCards] = useState({
    hoy: 0,
    mes: 0,
    promedioTotal: 0,
    promedioSoporte: 0,
  });
  const [charts, setCharts] = useState({
    porArea: [],
    ultimos7Dias: [],
    tiempos7Dias: [],
    porMes: [],
  });
  const [loading, setLoading] = useState(true);

// Usamos useCallback para que la función sea estable entre renders
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true); // Forzamos el estado de carga al iniciar
      const ahora = new Date();
      const inicioAño = new Date(ahora.getFullYear(), 0, 1).toISOString();

      const { data, error } = await supabase
        .from("solicitudes")
        .select("*")
        .gte("created_at", inicioAño);

      if (error) throw error;
      if (!data) return; // Seguridad si no hay respuesta

      const hoyStr = ahora.toISOString().split("T")[0];
      const mesActual = ahora.getMonth();

      // --- FILTROS SEGUROS ---
      const solicitudesHoy = data.filter((s) => s.created_at?.startsWith(hoyStr)) || [];
      const solicitudesMes = data.filter((s) => new Date(s.created_at).getMonth() === mesActual) || [];

      // --- CÁLCULO DE TIEMPOS ---
      let totalMinutosCiclo = 0;
      let totalMinutosSoporte = 0;
      let contFinalizados = 0;

      data.forEach((s) => {
        if (s.fecha_fin_soporte && s.created_at) {
          const inicio = new Date(s.created_at);
          const fin = new Date(s.fecha_fin_soporte);
          totalMinutosCiclo += (fin - inicio) / (1000 * 60);

          if (s.fecha_inicio_soporte) {
            const startSoporte = new Date(s.fecha_inicio_soporte);
            totalMinutosSoporte += (fin - startSoporte) / (1000 * 60);
          }
          contFinalizados++;
        }
      });

      // --- PROCESAMIENTO DE GRÁFICOS ---
      const areasMap = {};
      solicitudesHoy.forEach((s) => {
        if(s.area) areasMap[s.area] = (areasMap[s.area] || 0) + 1;
      });
      
      const areaData = Object.keys(areasMap).map((k) => ({
        name: k, total: areasMap[k],
      }));

      const ultimos7 = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dStr = d.toISOString().split("T")[0];
        const enDia = data.filter((s) => s.created_at?.startsWith(dStr));

        ultimos7.push({
          name: d.toLocaleDateString("es-ES", { weekday: "short", day: "numeric" }),
          total: enDia.length,
          tiempo: enDia.length > 0 ? 12 : 0, 
        });
      }

      const mesesNombres = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const añoActual = ahora.getFullYear();

      const solicitudesPorMes = mesesNombres.map((nombre, index) => {
        const conteo = data.filter(s => {
          const fecha = new Date(s.created_at);
          return fecha.getMonth() === index && fecha.getFullYear() === añoActual;
        }).length;
        return { name: nombre, total: conteo };
      });

      // ACTUALIZACIÓN ÚNICA DE ESTADOS
      setCards({
        hoy: solicitudesHoy.length,
        mes: solicitudesMes.length,
        promedioTotal: contFinalizados > 0 ? Math.round(totalMinutosCiclo / contFinalizados) : 0,
        promedioSoporte: contFinalizados > 0 ? Math.round(totalMinutosSoporte / contFinalizados) : 0,
      });

      setCharts({
        porArea: areaData,
        ultimos7Dias: ultimos7,
        tiempos7Dias: ultimos7,
        porMes: solicitudesPorMes,
      });

    } catch (err) {
      console.error("Error en Dashboard:", err);
    } finally {
      setLoading(false); // Siempre liberamos el estado de carga
    }
  }, []);

useEffect(() => {
    // Si la autenticación ya cargó, pedimos los datos
    if (!authLoading) {
      fetchDashboardData();
    }
  }, [authLoading, fetchDashboardData]);

  const exportToExcel = async () => {
    const { data } = await supabase
      .from("solicitudes")
      .select("*")
      .order("created_at", { ascending: false });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Solicitudes");
    worksheet.columns = [
      { header: "ID SAP Solicitante", key: "idsap_solicitante", width: 20 },
      { header: "Nombre", key: "nombre_solicitante", width: 25 },
      { header: "Área", key: "area", width: 15 },
      { header: "Tipo Soporte", key: "tipo_soporte", width: 20 },
      { header: "Estado", key: "estado", width: 15 },
      { header: "Fecha Creación", key: "created_at", width: 25 },
    ];
    worksheet.addRows(data);
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(
      new Blob([buffer]),
      `Reporte_Solicitudes_${new Date().toLocaleDateString()}.xlsx`,
    );
  };

if (authLoading || loading) {
    return <div className={styles.loadingContainer}>
             <div className={styles.spinner}></div>
             <p>Cargando Dashboard...</p>
           </div>;
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.dashboardContainer}>
        {/* SECCIÓN IZQUIERDA: GRÁFICOS (3/4 del ancho) */}
        <div className={styles.chartsColumn}>
          {/* Fila 1: Áreas y 7 Días */}
          <div className={styles.chartsGridTop}>
            <div className={styles.chartContainer}>
              <h3>Solicitudes por Área (Hoy)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={charts.porArea}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total" fill="#0052cc" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Fila 2: Tendencias y Tiempos */}
          <div className={styles.chartsGridMiddle}>
            <div className={styles.chartContainer}>
              <h3>Total Solicitudes (Últimos 7 días)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={charts.ultimos7Dias}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total" fill="#0e7490" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className={styles.chartContainer}>
              <h3>T. Promedio (Últimos 7 días)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={charts.tiempos7Dias}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="tiempo"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    dot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Fila 3: Gráfico Anual Completo */}
          <div className={styles.chartContainer}>
            <h3>Solicitudes Totales por Mes ({new Date().getFullYear()})</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={charts.porMes}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="name"
                  fontSize={11}
                  tick={{ fill: "#64748b" }}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tickLine={false}
                  minTickGap={5} // Esto ayuda a que no se amontonen
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="#1e293b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SECCIÓN DERECHA: CARDS DE MÉTRICAS */}
        <aside className={styles.metricsSidebar}>
          <div className={styles.metricCard}>
            <p>Total Solicitudes del Día</p>
            <h2>{cards.hoy}</h2>
          </div>
          <div className={styles.metricCard}>
            <p>Total Acumulado del Mes</p>
            <h2>{cards.mes}</h2>
          </div>
          <div className={styles.metricCard}>
            <p>Tiempo Promedio (Ciclo)</p>
            <h2>
              {cards.promedioTotal} <span>minutos</span>
            </h2>
          </div>
          <div className={styles.metricCard}>
            <p>T. Promedio Soporte</p>
            <h2>
              {cards.promedioSoporte} <span>minutos</span>
            </h2>
          </div>

          {/* Botón de Exportar al final de las cards */}
          <button onClick={exportToExcel} className={styles.downloadBtn}>
            <Download size={18} /> Exportar Excel
          </button>
        </aside>
      </div>
    </div>
  );
}
