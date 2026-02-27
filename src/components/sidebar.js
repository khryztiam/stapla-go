"use client";
import { useAuth } from '@/context/AuthContext';
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Sidebar.module.css";

export default function Sidebar() {
  const { profile, signOut } = useAuth();
  const pathname = usePathname();

  const menuItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: "📊",
      roles: ["admin", "stapla", "calidad"],
    },
    {
      name: "Pedir Soporte",
      path: "/stapla",
      icon: "🔑",
      roles: ["stapla", "admin"],
    },
    {
      name: "Atender Avisos",
      path: "/calidad",
      icon: "🛠️",
      roles: ["calidad", "admin"],
    },
    { 
      name: "Gestión Usuarios", 
      path: "/admin", 
      icon: "👥", 
      roles: ["admin"] 
    },
  ];

  // Obtenemos el rol o ponemos uno por defecto
  const userRole = profile?.rol_name || 'guest';

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error al salir:", error);
    }
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoText}>
        <span className={styles.stapla}>Stapla</span>
        <span className={styles.go}>Go</span>
      </div>

      <nav className={styles.nav}>
        {menuItems
          // 💡 FILTRO MÁGICO: Solo mostramos items si el rol del usuario está en la lista de roles del item
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
        {/* Información del usuario logueado */}
        <div className={styles.userBadge}>
          <p className={styles.userName}>{profile?.user_name}</p>
          <p className={styles.userRole}>{userRole.toUpperCase()}</p>
        </div>
        
        <button onClick={handleLogout} className={styles.logoutBtn}>
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}