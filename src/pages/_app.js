// pages/_app.js
import { AuthProvider } from '@/context/AuthContext';
import Sidebar from '@/components/sidebar';
import Head from 'next/head';
import { useRouter } from 'next/router';

import '@/styles/globals.css';
import '@/styles/admingate.css';
import AdminGate from '@/components/AdminGate';

export default function App({ Component, pageProps }) {
  const router = useRouter();
  
  // No mostramos Sidebar ni AdminGate en el login
  const isLoginPage = router.pathname.startsWith("/login");

  return (
    <AuthProvider>
      <Head>
        <title>StaplaGo App</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </Head>

      {isLoginPage ? (
        <Component {...pageProps} />
      ) : (
        /* CONTENEDOR PRINCIPAL FLEX */
        <div style={{ display: "flex", minHeight: "100vh", width: "100%" }}>
          
          {/* 1. Barra Lateral (Ancho fijo) */}
          <aside style={{ width: "260px", flexShrink: 0 }}>
            <Sidebar />
          </aside>

          {/* 2. Área de Contenido (Flexible) */}
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
      )}
    </AuthProvider>
  );
}