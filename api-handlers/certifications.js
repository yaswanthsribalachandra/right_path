import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { skill } = req.query;
      const { data, error } = await supabase.from('certifications').select('*').order('id', { ascending: true });
      if (error) throw error;
      let result = data;
      if (skill) {
        result = data.filter((c) => (c.skill_tags || []).some((s) => String(s).toLowerCase().includes(skill.toLowerCase())));
      }
      return res.status(200).json(result);
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
