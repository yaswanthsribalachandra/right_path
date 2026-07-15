import supabase from './db-client.js';
import { computeSalaryInsight } from '../api/lib/careerEngine.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { query, location } = req.query;
      if (!query) return res.status(400).json({ error: 'query required' });
      const { data: bands, error } = await supabase.from('salary_bands').select('*');
      if (error) throw error;
      const insight = computeSalaryInsight(query, bands || [], location);
      if (!insight) return res.status(200).json({ query, overallRange: null, byExperienceLevel: [], sources: [] });
      return res.status(200).json(insight);
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
