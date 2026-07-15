import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { user_id } = req.query;
      if (!user_id) return res.status(400).json({ error: 'user_id required' });
      const { data, error } = await supabase.from('profiles').select('*').eq('user_id', user_id).maybeSingle();
      if (error) throw error;
      return res.status(200).json(data || null);
    }

    if (req.method === 'POST') {
      const { user_id, email, full_name } = req.body;
      if (!user_id) return res.status(400).json({ error: 'user_id required' });
      const { data: existing } = await supabase.from('profiles').select('*').eq('user_id', user_id).maybeSingle();
      if (existing) return res.status(200).json(existing);
      const { data, error } = await supabase
        .from('profiles')
        .insert({ user_id, email, full_name: full_name || (email ? email.split('@')[0] : 'New Member'), role: 'student', interests: [] })
        .select()
        .single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      const { user_id, ...rest } = req.body;
      if (!user_id) return res.status(400).json({ error: 'user_id required' });
      const { data, error } = await supabase.from('profiles').update(rest).eq('user_id', user_id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
