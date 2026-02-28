"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import styles from "@/styles/login.module.css"

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    setLoading(true)
    setError(null)

    try {
      const formData = new FormData(e.target)
      const idsap = formData.get("idsap")
      const password = formData.get("password")

      const { data, error } = await supabase.auth.signInWithPassword({
        email: `${idsap}@yazaki.com`,
        password,
      })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      // Login exitoso
      // Esperamos un tick para que la sesión se estabilice
      setTimeout(() => {
        router.replace("/dashboard")
      }, 100)

    } catch (err) {
      setError("Error inesperado")
      setLoading(false)
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
            <label>ID SAP</label>
            <input
              name="idsap"
              type="text"
              placeholder="Ej. 10699992"
              required
              maxLength="8"
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Contraseña</label>
            <input
              name="password"
              type="password"
              placeholder="••••••••"
              required
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