import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import styles from "@/styles/dashboard.module.css";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { Download } from "lucide-react"; // ✅ Solo lo que se usa
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

export default function DashboardPage() {
  const { loading: authLoading } = useAuth();
  const [cards, setCards] = useState({
    hoy: 0, mes: 0, promedioTotal: 0, promedioSoporte: 0,
  });
  const [charts, setCharts] = useState({
    porArea: [], ultimos7Dias: [], tiempos7Dias: [], porMes: [],
  });
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false); // ✅ Estado para el export

  // ✅ Helper para manejar timezone correctamente
const toLocalDateStr = (date) => {
  return date.toLocaleDateString('es-MX', {
    timeZone: 'America/El_Salvador', // ✅ Cambia a tu timezone
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).split('/').reverse().join('-'); // Convierte dd/mm/yyyy → yyyy-mm-dd
};

const toLocalDate = (isoString) => {
  return new Date(new Date(isoString).toLocaleString('en-US', {
    timeZone: 'America/El_Salvador' // ✅ Convierte UTC → local
  }));
};

const procesarDatos = useCallback((data) => {
  const ahora = new Date();
  const hoyStr = toLocalDateStr(ahora); // ✅ Fecha local, no UTC
  const mesActual = toLocalDate(ahora.toISOString()).getMonth();
  const añoActual = ahora.getFullYear();

  // ✅ Comparación contra fecha local del registro
  const solicitudesHoy = data.filter(s => 
    s.created_at && toLocalDateStr(new Date(s.created_at)) === hoyStr
  );

  const solicitudesMes = data.filter(s => 
    s.created_at && toLocalDate(s.created_at).getMonth() === mesActual
  );

  // Tiempos — también con fechas locales
  let totalMinutosCiclo = 0;
  let totalMinutosSoporte = 0;
  let contFinalizados = 0;

  data.forEach(s => {
    if (s.fecha_fin_soporte && s.created_at) {
      const inicio = toLocalDate(s.created_at);
      const fin = toLocalDate(s.fecha_fin_soporte);
      totalMinutosCiclo += (fin - inicio) / (1000 * 60);
      if (s.fecha_inicio_soporte) {
        totalMinutosSoporte += (fin - toLocalDate(s.fecha_inicio_soporte)) / (1000 * 60);
      }
      contFinalizados++;
    }
  });

  // Áreas de hoy
  const areasMap = {};
  solicitudesHoy.forEach(s => {
    if (s.area) areasMap[s.area] = (areasMap[s.area] || 0) + 1;
  });

  // ✅ Últimos 7 días con fecha local
  const ultimos7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dStr = toLocalDateStr(d); // ✅ Fecha local

    const enDia = data.filter(s => 
      s.created_at && toLocalDateStr(new Date(s.created_at)) === dStr
    );

    let minsDia = 0;
    let countDia = 0;
    enDia.forEach(s => {
      if (s.fecha_fin_soporte && s.fecha_inicio_soporte) {
        minsDia += (toLocalDate(s.fecha_fin_soporte) - toLocalDate(s.fecha_inicio_soporte)) / (1000 * 60);
        countDia++;
      }
    });

    ultimos7.push({
      name: d.toLocaleDateString("es-ES", { 
        weekday: "short", 
        day: "numeric",
        timeZone: 'America/El_salvador' // ✅
      }),
      total: enDia.length,
      tiempo: countDia > 0 ? Math.round(minsDia / countDia) : 0,
    });
  }

  // ✅ Por mes con fecha local
  const solicitudesPorMes = MESES.map((nombre, index) => ({
    name: nombre,
    total: data.filter(s => {
      if (!s.created_at) return false;
      const fecha = toLocalDate(s.created_at);
      return fecha.getMonth() === index && fecha.getFullYear() === añoActual;
    }).length
  }));

  setCards({
    hoy: solicitudesHoy.length,
    mes: solicitudesMes.length,
    promedioTotal: contFinalizados > 0 ? Math.round(totalMinutosCiclo / contFinalizados) : 0,
    promedioSoporte: contFinalizados > 0 ? Math.round(totalMinutosSoporte / contFinalizados) : 0,
  });

  setCharts({
    porArea: Object.keys(areasMap).map(k => ({ name: k, total: areasMap[k] })),
    ultimos7Dias: ultimos7,
    tiempos7Dias: ultimos7,
    porMes: solicitudesPorMes,
  });
}, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const inicioAño = new Date(new Date().getFullYear(), 0, 1).toISOString();

      const { data, error } = await supabase
        .from("solicitudes")
        .select("*")
        .gte("created_at", inicioAño);

      if (error) throw error;
      if (data) procesarDatos(data);

    } catch (err) {
      console.error("Error en Dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, [procesarDatos]);

  useEffect(() => {
    if (authLoading) return;
    fetchDashboardData();

    // ✅ Realtime para actualizar métricas automáticamente
    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'solicitudes' },
        () => {
          fetchDashboardData(); // Re-fetch al haber cualquier cambio
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [authLoading, fetchDashboardData]);

  // ✅ Export con manejo de error y loading
  const exportToExcel = async () => {
    setExportLoading(true);
    try {
      const { data, error } = await supabase
        .from("solicitudes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5000); // ✅ Límite de seguridad

      if (error) throw error;

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Solicitudes");
      worksheet.columns = [
        { header: "ID SAP Solicitante", key: "idsap_solicitante", width: 20 },
        { header: "Nombre", key: "nombre_solicitante", width: 25 },
        { header: "Área", key: "area", width: 15 },
        { header: "Tipo Soporte", key: "tipo_soporte", width: 20 },
        { header: "Estado", key: "estado", width: 15 },
        { header: "Fecha Creación", key: "created_at", width: 25 },
        { header: "Fecha Inicio Soporte", key: "fecha_inicio_soporte", width: 25 }, // ✅
        { header: "Fecha Fin Soporte", key: "fecha_fin_soporte", width: 25 },       // ✅
        { header: "Atendido Por", key: "nombre_calidad", width: 25 },               // ✅
      ];
      worksheet.addRows(data);

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(
        new Blob([buffer]),
        `Reporte_Solicitudes_${new Date().toLocaleDateString('es-MX')}.xlsx`
      );
    } catch (err) {
      console.error("Error al exportar:", err);
      alert("Error al exportar: " + err.message);
    } finally {
      setExportLoading(false);
    }
  };

  // ✅ Un solo estado de loading para evitar flash
  if (authLoading || loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Cargando Dashboard...</p>
      </div>
    );
  }

return (
  <div className={styles.wrapper}>

    {/* ─── CARDS MÉTRICAS ARRIBA ─── */}
    <div className={styles.metricsRow}>
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
        <h2>{cards.promedioTotal} <span>min</span></h2>
      </div>
      <div className={styles.metricCard}>
        <p>T. Promedio Soporte</p>
        <h2>{cards.promedioSoporte} <span>min</span></h2>
      </div>
    </div>

    {/* ─── BOTÓN EXPORT ─── */}
    <div className={styles.exportRow}>
      <button
        onClick={exportToExcel}
        className={styles.downloadBtn}
        disabled={exportLoading}
      >
        <Download size={18} />
        {exportLoading ? "Exportando..." : "Exportar Excel"}
      </button>
    </div>

    {/* ─── GRÁFICOS ─── */}
    <div className={styles.chartsColumn}>

      {/* Áreas hoy */}
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

      {/* Últimos 7 días + Tiempo promedio */}
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
          <h3>T. Promedio Soporte (Últimos 7 días)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={charts.tiempos7Dias}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis unit=" min" />
              <Tooltip formatter={(val) => [`${val} min`, 'Promedio']} />
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

      {/* Anual */}
      <div className={styles.chartContainer}>
        <h3>Solicitudes Totales por Mes ({new Date().getFullYear()})</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={charts.porMes}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" fontSize={11} tick={{ fill: "#64748b" }}
              axisLine={{ stroke: "#e2e8f0" }} tickLine={false} minTickGap={5} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="total" fill="#1e293b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  </div>
);
}