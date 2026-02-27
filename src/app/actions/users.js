'use server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { revalidatePath } from 'next/cache'

// --- CREAR USUARIO ---
export async function createNewUser(formData) {
  const idsap = formData.get('idsap')
  const user_name = formData.get('user_name')
  const rol_name = formData.get('rol_name')
  const manualPassword = formData.get('password')
  
  const email = `${idsap}@yazaki.com`

  const isPrivileged = rol_name === 'admin' || rol_name === 'sub_admin';
  const password = isPrivileged ? manualPassword : 'Yazaki2026*';

  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { user_name, idsap, rol_name }
  })

  if (authError) return { success: false, error: authError.message }

  const { error: dbError } = await supabaseAdmin
    .from('users')
    .insert([{ 
      id: authUser.user.id, 
      idsap, 
      user_name, 
      email, 
      rol_name 
    }])

  if (dbError) return { success: false, error: dbError.message }

  revalidatePath('/admin/users')
  return { success: true }
}

// --- BORRAR USUARIO ---
export async function deleteUser(userId) {
  // Borramos en Auth (esto debería eliminar en cascada en la tabla users por la FK)
  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (authError) return { success: false, error: authError.message };

  // Reforzamos borrando en la tabla pública por si acaso
  await supabaseAdmin.from('users').delete().eq('id', userId);
  
  revalidatePath('/admin/users');
  return { success: true };
}

// --- ACTUALIZAR USUARIO (MODAL) ---
export async function updateUser(userId, formData) {
  const user_name = formData.get('user_name')
  const rol_name = formData.get('rol_name')
  const newPassword = formData.get('password') // Viene del modal

  // 1. Actualizar datos básicos en la tabla pública
  const { error: dbError } = await supabaseAdmin
    .from('users')
    .update({ user_name, rol_name })
    .eq('id', userId)

  if (dbError) return { success: false, error: dbError.message }

  // 2. Si se escribió una contraseña nueva y el rol permite password manual
  if (newPassword && (rol_name === 'admin' || rol_name === 'sub_admin')) {
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    )
    if (authError) return { success: false, error: "Datos guardados, pero la clave falló: " + authError.message }
  }

  revalidatePath('/admin/users')
  return { success: true }
}