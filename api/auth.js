export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action, email, password } = req.body;
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: 'Configuración de servidor incompleta' });
  }

  // LOGIN
  if (action === 'login') {
    if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' });

    try {
      // 1. Autenticar con Supabase Auth
      const authRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ email, password }),
      });

      const authData = await authRes.json();

      if (!authRes.ok || !authData.access_token) {
        return res.status(401).json({ error: 'Email o contraseña incorrectos' });
      }

      // 2. Verificar que el usuario está activo en la tabla usuarios
      const userRes = await fetch(`${SUPABASE_URL}/rest/v1/usuarios?email=eq.${encodeURIComponent(email)}&select=activo,nombre`, {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
      });

      const userData = await userRes.json();

      if (!userData || userData.length === 0) {
        return res.status(403).json({ error: 'Usuario no encontrado en el sistema' });
      }

      if (!userData[0].activo) {
        return res.status(403).json({ error: 'Tu acceso está suspendido. Contactá al administrador.' });
      }

      return res.status(200).json({
        token: authData.access_token,
        nombre: userData[0].nombre || email,
      });

    } catch (err) {
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // RESET PASSWORD
  if (action === 'reset') {
    if (!email) return res.status(400).json({ error: 'Email requerido' });

    try {
      await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ email }),
      });

      return res.status(200).json({ ok: true });
    } catch (err) {
      return res.status(500).json({ error: 'Error al enviar el email' });
    }
  }

  // VERIFY TOKEN
  if (action === 'verify') {
    const token = req.body.token;
    if (!token) return res.status(401).json({ error: 'Token requerido' });

    try {
      const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token}`,
        },
      });

      const userData = await userRes.json();
      if (!userRes.ok || !userData.email) return res.status(401).json({ error: 'Sesión inválida' });

      // Verificar activo
      const activeRes = await fetch(`${SUPABASE_URL}/rest/v1/usuarios?email=eq.${encodeURIComponent(userData.email)}&select=activo,nombre`, {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
      });

      const activeData = await activeRes.json();
      if (!activeData || activeData.length === 0 || !activeData[0].activo) {
        return res.status(403).json({ error: 'Acceso suspendido' });
      }

      return res.status(200).json({ ok: true, nombre: activeData[0].nombre });
    } catch (err) {
      return res.status(500).json({ error: 'Error al verificar sesión' });
    }
  }

  return res.status(400).json({ error: 'Acción no reconocida' });
}
