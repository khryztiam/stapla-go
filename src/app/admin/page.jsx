"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { createNewUser, deleteUser, updateUser } from "@/app/actions/users";
import styles from "./admin.module.css";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [selectedRole, setSelectedRole] = useState("stapla");
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);

  // Cargar usuarios al iniciar
  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });
      setUsers(data || []);
      setLoading(false);
    };
    fetchUsers();
  }, []);

  // Función para abrir el modal con los datos del usuario seleccionado
  const handleEdit = (user) => {
    setEditingUser(user);
  };

  // Función para cerrar el modal y limpiar el estado
  const closeModal = () => {
    setEditingUser(null);
  };

  return (
    <div className={styles.adminContainer}>
      <h1 className={styles.title}>Gestión de Personal</h1>

      {/* --- FORMULARIO DE REGISTRO --- */}
      <section className={styles.formCard}>
        <h2 className={styles.formTitle}>Registrar Nuevo Usuario</h2>
        <form
          action={async (formData) => {
            const res = await createNewUser(formData);
            if (res.success) alert("¡Usuario creado con éxito!");
            else alert("Error: " + res.error);
          }}
          className={styles.formGrid}
        >
          <div className={styles.inputGroup}>
            <label className={styles.label}>ID SAP</label>
            <input
              name="idsap"
              className={styles.input}
              placeholder="8 dígitos"
              required
              pattern="\d{8}"
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Nombre Completo</label>
            <input
              name="user_name"
              className={styles.input}
              placeholder="Nombre Apellido"
              required
            />
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

          {/* PASSWORD DINÁMICO: Solo para Admins */}
          {(selectedRole === "admin" || selectedRole === "sub_admin") && (
            <div className={styles.inputGroup}>
              <label className={styles.label}>Contraseña Manual</label>
              <input
                name="password"
                type="password"
                className={styles.input}
                placeholder="Clave de acceso"
                required
              />
            </div>
          )}

          <button type="submit" className={styles.submitBtn}>
            Crear Usuario
          </button>
        </form>
      </section>

      {/* --- TABLA DE RESULTADOS --- */}
      <div className={styles.tableWrapper}>
        <table className={styles.userTable}>
          <thead>
            <tr>
              <th>ID SAP</th>
              <th>Nombre</th>
              <th>Correo Corporativo</th>
              <th>Rol</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4">Cargando personal...</td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td style={{ fontWeight: "bold" }}>{user.idsap}</td>
                  <td>{user.user_name}</td>
                  <td style={{ color: "#666" }}>{user.email}</td>
                  <td>
                    <span
                      className={`${styles.badge} ${styles["role_" + user.rol_name]}`}
                    >
                      {user.rol_name}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleEdit(user)}
                      className={styles.editBtn}
                      title="Editar usuario"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={async () => {
                        if (
                          confirm("¿Seguro que quieres borrar a este usuario?")
                        ) {
                          await deleteUser(user.id);
                        }
                      }}
                      className={styles.deleteBtn}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {editingUser && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Editar: {editingUser.user_name}</h3>

            <form
              action={async (formData) => {
                const res = await updateUser(editingUser.id, formData);
                if (res.success) {
                  alert("Usuario actualizado");
                  closeModal(); // <--- Aquí cerramos el modal
                  window.location.reload(); // Recarga rápida para ver cambios
                } else {
                  alert("Error: " + res.error);
                }
              }}
            >
              <div className={styles.inputGroup}>
                <label>Nombre Completo</label>
                <input
                  name="user_name"
                  defaultValue={editingUser.user_name}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Rol</label>
                <select
                  name="rol_name"
                  defaultValue={editingUser.rol_name}
                  className={styles.input}
                >
                  <option value="stapla">Stapla</option>
                  <option value="calidad">Calidad</option>
                  <option value="sub_admin">Sub Admin</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* SOLO MOSTRAR PASSWORD SI ES ADMIN O SUB_ADMIN */}
              {(editingUser.rol_name === "admin" ||
                editingUser.rol_name === "sub_admin") && (
                <div className={styles.inputGroup}>
                  <label>
                    Nueva Contraseña (dejar en blanco para no cambiar)
                  </label>
                  <input
                    name="password"
                    type="password"
                    className={styles.input}
                    placeholder="****"
                  />
                </div>
              )}

              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={closeModal}
                  className={styles.cancelBtn}
                >
                  Cancelar
                </button>
                <button type="submit" className={styles.saveBtn}>
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
