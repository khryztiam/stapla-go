"use client"

import { usePathname } from "next/navigation"
import Sidebar from "@/components/sidebar"
import { AuthProvider } from "@/context/AuthContext"

export default function RootLayout({ children }) {
  const pathname = usePathname()

  const isLoginPage = pathname?.startsWith("/login")

  return (
    <html lang="es">
      <body>
        <AuthProvider>
          {isLoginPage ? (
            children
          ) : (
            <div style={{ display: "flex", minHeight: "100vh" }}>
              <Sidebar />
              <main style={{ flex: 1 }}>
                {children}
              </main>
            </div>
          )}
        </AuthProvider>
      </body>
    </html>
  )
}