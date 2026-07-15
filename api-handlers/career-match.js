import supabase from './db-client.js';
import { matchCareerPaths } from '../api/lib/careerEngine.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { user_id, resume_id } = req.body;
    if (!user_id) return res.status(400).json({ error: 'user_id required' });

    let skillNames = [];
    if (resume_id) {
      const { data: resume, error: rErr } = await supabase.from('resumes').select('*').eq('id', resume_id).single();
      if (rErr) throw rErr;
      skillNames = (resume.parsed_data?.matchedSkills || [])
        .map((s) => {
          if (!s) return '';
          if (typeof s === 'string') return s;
          if (typeof s === 'object' && s.name) return s.name;
          return '';
        })
        .filter(Boolean);
    } else {
      const { data: latest } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      skillNames = (latest?.parsed_data?.matchedSkills || [])
        .map((s) => {
          if (!s) return '';
          if (typeof s === 'string') return s;
          if (typeof s === 'object' && s.name) return s.name;
          return '';
        })
        .filter(Boolean);
    }

    const { data: careerPaths, error } = await supabase.from('career_paths').select('*');
    if (error) throw error;

    const matches = matchCareerPaths(skillNames, careerPaths || []);

    await supabase.from('activity_logs').insert({ user_id, action: 'career_match_computed', meta: { top_match: matches[0]?.careerPath?.title } });

    return res.status(200).json({ userSkills: skillNames, matches, sources: careerPaths.map((c) => ({ id: c.id, title: c.title })) });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
