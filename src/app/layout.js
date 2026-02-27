'use client'; // Asegúrate de que tenga esto arriba
import { usePathname } from 'next/navigation';
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import "./styles/globals.css";
import Sidebar from "@/components/sidebar"; // Importamos tu nuevo menú

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }) {
  const pathname = usePathname();
  
  // DECLARACIÓN de la variable que te falta
  const isLoginPage = pathname === '/login';
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
<AuthProvider>
          <div style={{ display: 'flex', minHeight: '100vh' }}>
            {/* SOLO mostramos el Sidebar si NO es la página de login */}
            {!isLoginPage && <Sidebar />}
            
            <main style={{ flex: 1, backgroundColor: '#f4f7f6' }}>
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}