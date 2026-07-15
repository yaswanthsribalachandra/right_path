import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { user_id, roadmap_id } = req.query;
      if (!user_id) return res.status(400).json({ error: 'user_id required' });
      let query = supabase.from('learning_progress').select('*').eq('user_id', user_id).order('created_at', { ascending: true });
      if (roadmap_id) query = query.eq('roadmap_id', roadmap_id);
      const { data, error } = await query;
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const { user_id, roadmap_id, item_title, item_type } = req.body;
      if (!user_id || !item_title) return res.status(400).json({ error: 'user_id and item_title required' });
      const { data, error } = await supabase
        .from('learning_progress')
        .insert({ user_id, roadmap_id, item_title, item_type, status: 'pending' })
        .select()
        .single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      const { id, status } = req.body;
      if (!id) return res.status(400).json({ error: 'id required' });
      const update = { status };
      if (status === 'completed') update.completed_at = new Date().toISOString();
      const { data, error } = await supabase.from('learning_progress').update(update).eq('id', id).select().single();
      if (error) throw error;

      if (status === 'completed' && data.roadmap_id) {
        const { data: allItems } = await supabase.from('learning_progress').select('*').eq('roadmap_id', data.roadmap_id);
        const total = allItems.length || 1;
        const done = allItems.filter((i) => i.status === 'completed').length;
        const progress = Math.round((done / total) * 100);
        await supabase.from('roadmaps').update({ progress }).eq('id', data.roadmap_id);
      }

      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'id required' });
      const { error } = await supabase.from('learning_progress').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
