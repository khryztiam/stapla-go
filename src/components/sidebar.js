// ✅ Sin "use client" — Pages Router
// ✅ Sin usePathname — usamos useRouter de next/router
import { useAuth } from '@/context/AuthContext';
import Link from "next/link";
import { useRouter } from "next/router"; // ✅ Pages Router
import styles from "@/styles/Sidebar.module.css";

export default function Sidebar() {
  const { profile, logout, loading } = useAuth();
  const router = useRouter();
  const pathname = router.pathname; // ✅ Equivalente a usePathname en Pages Router

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
      path: "/admin/admin", 
      icon: "👥", 
      roles: ["ADMIN"] 
    },
  ];

  const userRole = profile?.rol_name?.toUpperCase() || 'GUEST';

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/login"); // ✅ Usa router de Pages Router, no window.location
    } catch (error) {
      router.replace("/login");
    }
  };

  if (loading) return <div className={styles.sidebar}>Cargando...</div>;

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoText}>
        <span className={styles.stapla}>Stapla</span>
        <span className={styles.go}>Go.</span>
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