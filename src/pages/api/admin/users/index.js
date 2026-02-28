import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function handler(req, res) {
  // --- CREAR USUARIO (POST) ---
  if (req.method === 'POST') {
    const { idsap, user_name, rol_name, password } = req.body;
    const email = `${idsap}@yazaki.com`;

    try {
      // 1. Crear en Auth (Service Role permite saltar confirmación de email)
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: password || 'Yazaki2026*',
        email_confirm: true,
        user_metadata: { user_name, rol_name }
      });

      if (authError) throw authError;

      // 2. Insertar en tu tabla pública 'users'
      const { error: dbError } = await supabaseAdmin
        .from('users')
        .insert([{ 
          id: authUser.user.id, 
          idsap, 
          user_name, 
          email, 
          rol_name 
        }]);

      if (dbError) throw dbError;

      return res.status(201).json({ success: true });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  res.setHeader('Allow', ['POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}