import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import styles from "@/styles/admin.module.css";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [selectedRole, setSelectedRole] = useState("stapla");
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. CARGAR USUARIOS (Lectura segura con RLS)
  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });
    setUsers(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 2. CREAR USUARIO (Vía API)
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();

      if (result.success) {
        alert("¡Usuario creado con éxito!");
        e.target.reset();
        fetchUsers();
      } else throw new Error(result.error);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. ACTUALIZAR USUARIO (Vía API)
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.target);
    const payload = { ...Object.fromEntries(formData), id: editingUser.id };

    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();

      if (result.success) {
        alert("Usuario actualizado");
        setEditingUser(null);
        fetchUsers();
      } else throw new Error(result.error);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. BORRAR USUARIO (Vía API)
  const handleDeleteUser = async (id) => {
    if (!confirm("¿Seguro que quieres borrar a este usuario?")) return;
    
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) fetchUsers();
      else throw new Error(result.error);
    } catch (err) {
      alert("Error al borrar: " + err.message);
    }
  };

  return (
    <div className={styles.adminContainer}>
      <h1 className={styles.title}>Gestión de Personal</h1>

      {/* FORMULARIO DE REGISTRO */}
      <section className={styles.formCard}>
        <h2 className={styles.formTitle}>Registrar Nuevo Usuario</h2>
        <form onSubmit={handleCreateUser} className={styles.formGrid}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>ID SAP</label>
            <input name="idsap" className={styles.input} placeholder="8 dígitos" required pattern="\d{8}" />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Nombre Completo</label>
            <input name="user_name" className={styles.input} placeholder="Nombre Apellido" required />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Rol en Planta</label>
            <select 
              name="rol_name" 
              className={styles.input} 
              value={selectedRole} 
              onChange={(e) => setSelectedRole(e.target.value)}
              required
            >
              <option value="stapla">Stapla (Solicitante)</option>
              <option value="calidad">Calidad (Soporte)</option>
              <option value="sub_admin">Sub Administrador</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          {(selectedRole === "admin" || selectedRole === "sub_admin") && (
            <div className={styles.inputGroup}>
              <label className={styles.label}>Contraseña Manual</label>
              <input name="password" type="password" className={styles.input} placeholder="Clave de acceso" required />
            </div>
          )}
          <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
            {isSubmitting ? "Procesando..." : "Crear Usuario"}
          </button>
        </form>
      </section>

      {/* TABLA DE USUARIOS */}
      <div className={styles.tableWrapper}>
        <table className={styles.userTable}>
          <thead>
            <tr>
              <th>ID SAP</th>
              <th>Nombre</th>
              <th>Rol</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="4">Cargando personal...</td></tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td>{user.idsap}</td>
                  <td>{user.user_name}</td>
                  <td><span className={`${styles.badge} ${styles["role_" + user.rol_name]}`}>{user.rol_name}</span></td>
                  <td>
                    <button onClick={() => setEditingUser(user)} className={styles.editBtn}>✏️</button>
                    <button onClick={() => handleDeleteUser(user.id)} className={styles.deleteBtn}>🗑️</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL DE EDICIÓN */}
      {editingUser && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Editar: {editingUser.user_name}</h3>
            <form onSubmit={handleUpdateUser}>
              <div className={styles.inputGroup}>
                <label>Nombre Completo</label>
                <input name="user_name" defaultValue={editingUser.user_name} className={styles.input} required />
              </div>
              <div className={styles.inputGroup}>
                <label>Rol</label>
                <select name="rol_name" defaultValue={editingUser.rol_name} className={styles.input}>
                  <option value="stapla">Stapla</option>
                  <option value="calidad">Calidad</option>
                  <option value="sub_admin">Sub Admin</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className={styles.inputGroup}>
                <label>Nueva Contraseña (opcional)</label>
                <input name="password" type="password" className={styles.input} placeholder="****" />
              </div>
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setEditingUser(null)} className={styles.cancelBtn}>Cancelar</button>
                <button type="submit" className={styles.saveBtn} disabled={isSubmitting}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}