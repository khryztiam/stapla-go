// pages/_app.js
import { AuthProvider, useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import Head from 'next/head';
import { useRouter } from 'next/router';
import '@/styles/globals.css';
import '@/styles/admingate.css';
import '@/styles/card.css'; 
import AdminGate, { roleRoutes } from '@/components/AdminGate';

function AppContent({ Component, pageProps }) {
  const router = useRouter();
  const { user, role, loading } = useAuth();

  const isLoginPage = router.pathname.startsWith("/login");
  const isRoot = router.pathname === "/";
  const isPublicRoute = isLoginPage || isRoot;

  if (loading) return null;

  if (!isPublicRoute && !user) {
    router.replace('/');
    return null;
  }

  if (user && role && isPublicRoute) {
    const targetRoute = roleRoutes[role]?.[0] || '/dashboard';
    router.replace(targetRoute);
    return null;
  }

  if (isPublicRoute) {
    return <Component {...pageProps} />;
  }

  return (
  <div className="app-layout">
    <aside className="app-sidebar">
      <Sidebar />
    </aside>
    <main className="app-main">
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