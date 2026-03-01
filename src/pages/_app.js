// pages/_app.js
import { AuthProvider, useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/sidebar';
import Head from 'next/head';
import { useRouter } from 'next/router';
import '@/styles/globals.css';
import '@/styles/admingate.css';
import AdminGate from '@/components/AdminGate';

function AppContent({ Component, pageProps }) {
  const router = useRouter();
  const { user, loading } = useAuth(); // <--- Aquí obtenemos el estado real

  // Definimos qué rutas son públicas
  const isLoginPage = router.pathname.startsWith("/login");
  const isRoot = router.pathname === "/";

  // 1. Mientras carga la sesión de Supabase, no mostramos nada para evitar el "GUEST"
  if (loading) return null;

  // 2. Si no hay usuario, o es la página de login/raíz, renderizamos LIMPIO (sin Sidebar)
  if (!user || isLoginPage || isRoot) {
    return <Component {...pageProps} />;
  }

  // 3. Si hay usuario y es una ruta interna, mostramos el Layout completo
  return (
    <div style={{ display: "flex", minHeight: "100vh", width: "100%" }}>
      <aside style={{ width: "260px", flexShrink: 0 }}>
        <Sidebar />
      </aside>

      <main style={{ 
        flexGrow: 1, 
        width: "calc(100% - 260px)", 
        backgroundColor: "#f4f7f9",
        overflowX: "hidden" 
      }}>
        <AdminGate>
          <Component {...pageProps} />
        </AdminGate>
      </main>
    </div>
  );
}

export default function App(props) {
  return (
    <AuthProvider>
      <Head>
        <title>StaplaGo App</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </Head>
      <AppContent {...props} />
    </AuthProvider>
  );
}