import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function handler(req, res) {
  const { id } = req.query;

  // --- ACTUALIZAR (PUT) ---
  if (req.method === 'PUT') {
    const { user_name, rol_name, password } = req.body;
    try {
      if (password && password.trim() !== "") {
        await supabaseAdmin.auth.admin.updateUserById(id, { password });
      }
      const { error } = await supabaseAdmin
        .from('users')
        .update({ user_name, rol_name })
        .eq('id', id);
      if (error) throw error;
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  // --- BORRAR (DELETE) ---
  if (req.method === 'DELETE') {
    try {
      // Borrar de Auth (esto borra en cascada si tienes bien las FK, 
      // si no, borra primero de la tabla users y luego de auth)
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
      if (authError) throw authError;

      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  res.setHeader('Allow', ['PUT', 'DELETE']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}