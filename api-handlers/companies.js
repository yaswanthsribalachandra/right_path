import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { category, search } = req.query;
      let query = supabase.from('companies').select('*').order('name', { ascending: true });
      if (category) query = query.eq('career_category', category);
      const { data, error } = await query;
      if (error) throw error;
      let result = data;
      if (search) result = data.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
      return res.status(200).json(result);
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
