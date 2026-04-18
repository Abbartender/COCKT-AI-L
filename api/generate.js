export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prompt, system } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt requerido' });

  const token = req.headers['x-session-token'];
  if (!token) return res.status(401).json({ error: 'No autorizado' });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

  try {
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${token}` },
    });
    const userData = await userRes.json();
    if (!userRes.ok || !userData.email) return res.status(401).json({ error: 'Sesión inválida' });

    const activeRes = await fetch(`${SUPABASE_URL}/rest/v1/usuarios?email=eq.${encodeURIComponent(userData.email)}&select=activo`, {
      headers: { 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}` },
    });
    const activeData = await activeRes.json();
    if (!activeData || activeData.length === 0 || !activeData[0].activo) {
      return res.status(403).json({ error: 'Acceso suspendido' });
    }
  } catch (e) {
    return res.status(401).json({ error: 'Error verificando sesión' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1200,
        system: system || '',
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message || 'Error de API' });

    const text = data.content?.map(b => b.text || '').join('') || '';
    return res.status(200).json({ text });

  } catch (error) {
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
