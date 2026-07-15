import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { category, skill } = req.query;
      let query = supabase.from('projects').select('*').order('id', { ascending: true });
      if (category) query = query.eq('career_category', category);
      const { data, error } = await query;
      if (error) throw error;
      let result = data;
      if (skill) {
        result = data.filter((p) => (p.skills || []).some((s) => String(s).toLowerCase().includes(skill.toLowerCase())));
      }
      return res.status(200).json(result);
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
