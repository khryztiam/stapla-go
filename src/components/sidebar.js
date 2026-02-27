"use client";
import { useAuth } from '@/context/AuthContext';
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Sidebar.module.css";

export default function Sidebar() {
  // 1. Cambiamos 'signOut' por 'logout' para que coincida con el Contexto
  const { profile, logout, loading } = useAuth();
  const pathname = usePathname();

  // 2. Normalizamos los roles a MAYÚSCULAS para que coincidan con la DB
  const menuItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: "📊",
      roles: ["ADMIN", "STAPLA", "CALIDAD"],
    },
    {
      name: "Pedir Soporte",
      path: "/stapla",
      icon: "🔑",
      roles: ["STAPLA", "ADMIN"],
    },
    {
      name: "Atender Avisos",
      path: "/calidad",
      icon: "🛠️",
      roles: ["CALIDAD", "ADMIN"],
    },
    { 
      name: "Gestión Usuarios", 
      path: "/admin", 
      icon: "👥", 
      roles: ["ADMIN"] 
    },
  ];

  // 3. Obtenemos el rol real y lo pasamos a mayúsculas para comparar bien
  const userRole = profile?.rol_name?.toUpperCase() || 'GUEST';

  const handleLogout = async () => {
  try {
    await logout();
    window.location.href = "/login";
  } catch (error) {
    console.error("Error al salir:", error);
  }
};

  // 5. Si está cargando el perfil, mejor no mostrar el menú incompleto
  if (loading) return <div className={styles.sidebar}>Cargando...</div>;

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoText}>
        <span className={styles.stapla}>Stapla</span>
        <span className={styles.go}>Go</span>
      </div>

      <nav className={styles.nav}>
        {menuItems
          .filter((item) => item.roles.includes(userRole))
          .map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`${styles.navLink} ${isActive ? styles.active : ""}`}
              >
                <span className={styles.icon}>{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
      </nav>

      <div className={styles.footer}>
        <div className={styles.userBadge}>
          <p className={styles.userName}>{profile?.user_name || "Usuario"}</p>
          <p className={styles.userRole}>{userRole}</p>
        </div>
        
        <button onClick={handleLogout} className={styles.logoutBtn}>
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}