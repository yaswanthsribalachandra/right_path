import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { user_id } = req.query;
      if (!user_id) return res.status(400).json({ error: 'user_id required' });
      const { data: saved, error } = await supabase.from('saved_careers').select('*').eq('user_id', user_id).order('created_at', { ascending: false });
      if (error) throw error;
      if (!saved.length) return res.status(200).json([]);
      const ids = saved.map((s) => s.career_path_id);
      const { data: paths, error: pErr } = await supabase.from('career_paths').select('*').in('id', ids);
      if (pErr) throw pErr;
      const merged = saved.map((s) => ({ ...s, careerPath: paths.find((p) => p.id === s.career_path_id) }));
      return res.status(200).json(merged);
    }

    if (req.method === 'POST') {
      const { user_id, career_path_id } = req.body;
      if (!user_id || !career_path_id) return res.status(400).json({ error: 'user_id and career_path_id required' });
      const { data: existing } = await supabase.from('saved_careers').select('*').eq('user_id', user_id).eq('career_path_id', career_path_id).maybeSingle();
      if (existing) return res.status(200).json(existing);
      const { data, error } = await supabase.from('saved_careers').insert({ user_id, career_path_id }).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'id required' });
      const { error } = await supabase.from('saved_careers').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
