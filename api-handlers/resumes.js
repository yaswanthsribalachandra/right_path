import supabase from './db-client.js';
import { parseResumeText, extractSkillsFromText, computeATSScore } from '../api/lib/careerEngine.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { user_id, id } = req.query;
      if (id) {
        const { data, error } = await supabase.from('resumes').select('*').eq('id', id).single();
        if (error) throw error;
        return res.status(200).json(data);
      }
      if (!user_id) return res.status(400).json({ error: 'user_id required' });
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const { user_id, file_name, file_url, raw_text } = req.body;
      if (!user_id || !raw_text) return res.status(400).json({ error: 'user_id and raw_text required' });

      const { data: skillCatalog, error: skillErr } = await supabase.from('skills').select('*');
      if (skillErr) throw skillErr;

      const parsed = parseResumeText(raw_text);
      const matchedSkills = extractSkillsFromText(raw_text, skillCatalog || []);
      const atsResult = computeATSScore(raw_text, parsed, matchedSkills);

      const parsedData = {
        ...parsed,
        matchedSkills: matchedSkills.map((s) => ({ name: s.name, category: s.category })),
      };

      const { data, error } = await supabase
        .from('resumes')
        .insert({
          user_id,
          file_name,
          file_url,
          raw_text,
          parsed_data: parsedData,
          ats_score: atsResult.total,
          ats_breakdown: atsResult.breakdown,
        })
        .select()
        .single();
      if (error) throw error;

      await supabase.from('activity_logs').insert({ user_id, action: 'resume_uploaded', meta: { resume_id: data.id, ats_score: atsResult.total } });
      await supabase.from('notifications').insert({
        user_id,
        title: 'Resume Analyzed',
        message: `Your resume scored ${atsResult.total}/100 on our ATS scan. View the full breakdown now.`,
        type: 'success',
      });

      return res.status(201).json(data);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'id required' });
      const { error } = await supabase.from('resumes').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
