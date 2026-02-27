'use client'
import { useState } from 'react'
import { login } from '@/app/actions/auth'
import { useRouter } from 'next/navigation'
import styles from './login.module.css'

export default function LoginPage() {
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

 const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError(null);

  const formData = new FormData(e.target);
  const result = await login(formData);

  if (result.success) {
  // Le damos un momento a las cookies para que se asienten
  setTimeout(() => {
    window.location.href = '/stapla';
  }, 500);
} else {
  setError(result.error);
  setLoading(false);
  }
};

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
            {loading ? 'ACCEDIENDO...' : 'ENTRAR'}
          </button>
        </form>
      </div>
    </div>
  )
}