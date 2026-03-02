import { useState } from "react"
import { useAuth } from "@/context/AuthContext"  // ✅ Usa el contexto
import styles from "@/styles/login.module.css"

export default function LoginPage() {
  const { login } = useAuth()
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.target)
    const idsap = formData.get("idsap")?.trim()       // ✅ trim defensivo
    const password = formData.get("password")
    const email = `${idsap}@yazaki.com`.toLowerCase() // ✅ lowercase

    try {
      await login(email, password)
      // ✅ Sin redirect — AdminGate detecta la sesión y redirige según el rol
    } catch (err) {
      setError(err.message || "Error inesperado")
      setLoading(false) // ✅ Solo en error, igual que el segundo
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.loginCard}>
        <div className={styles.logo}>
          Stapla<span>Go.</span>
        </div>
        <p className={styles.subtitle}>Sistema de Gestión de Llaves</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            {/* ✅ label asociado al input con htmlFor */}
            <label htmlFor="idsap">ID SAP</label>
            <input
              id="idsap"
              name="idsap"
              type="text"
              placeholder="Ej. 10699992"
              required
              maxLength="8"
              autoComplete="username"  // ✅
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              autoComplete="current-password"  // ✅
            />
          </div>

          {error && <p className={styles.errorMsg}>{error}</p>}

          <button type="submit" className={styles.loginBtn} disabled={loading}>
            {loading ? "ACCEDIENDO..." : "ENTRAR"}
          </button>
        </form>
      </div>
    </div>
  )
}