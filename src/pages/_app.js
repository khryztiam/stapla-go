// pages/_app.js
import { AuthProvider, useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/sidebar';
import Head from 'next/head';
import { useRouter } from 'next/router';
import '@/styles/globals.css';
import '@/styles/admingate.css';
import '@/styles/card.css'; 
import AdminGate, { roleRoutes } from '@/components/AdminGate';

function AppContent({ Component, pageProps }) {
  const router = useRouter();
  const { user, role, loading } = useAuth()

  const isLoginPage = router.pathname.startsWith("/login");
  const isRoot = router.pathname === "/";

  if (loading) return null;

  // ✅ Redirección cuando ya hay sesión y está en ruta pública
  if (user && role && (isLoginPage || isRoot)) {
    const targetRoute = roleRoutes[role]?.[0] || '/dashboard'
    router.replace(targetRoute)
    return null
  }

  if (!user || isLoginPage || isRoot) {
    return <Component {...pageProps} />;
  }

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
export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Head>
        <title>StaplaGo App</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </Head>
      <AppContent Component={Component} pageProps={pageProps} />
    </AuthProvider>
  );
}