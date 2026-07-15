import supabase from './db-client.js';
import { generateRoadmap } from '../api/lib/careerEngine.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { user_id, id } = req.query;
      if (id) {
        const { data, error } = await supabase.from('roadmaps').select('*').eq('id', id).single();
        if (error) throw error;
        return res.status(200).json(data);
      }
      if (!user_id) return res.status(400).json({ error: 'user_id required' });
      const { data, error } = await supabase.from('roadmaps').select('*').eq('user_id', user_id).order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const { user_id, career_path_id } = req.body;
      if (!user_id || !career_path_id) return res.status(400).json({ error: 'user_id and career_path_id required' });

      const [{ data: careerPath, error: cErr }, { data: latestResume }, { data: courses, error: courseErr }, { data: certifications, error: certErr }, { data: projects, error: projErr }] = await Promise.all([
        supabase.from('career_paths').select('*').eq('id', career_path_id).single(),
        supabase.from('resumes').select('*').eq('user_id', user_id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('courses').select('*'),
        supabase.from('certifications').select('*'),
        supabase.from('projects').select('*'),
      ]);
      if (cErr) throw cErr;
      if (courseErr) throw courseErr;
      if (certErr) throw certErr;
      if (projErr) throw projErr;

      const skillNames = (latestResume?.parsed_data?.matchedSkills || [])
        .map((s) => {
          if (!s) return '';
          if (typeof s === 'string') return s;
          if (typeof s === 'object' && s.name) return s.name;
          return '';
        })
        .filter(Boolean);
      const roadmapData = generateRoadmap(careerPath, skillNames, courses || [], certifications || [], projects || []);

      const { data, error } = await supabase
        .from('roadmaps')
        .insert({ user_id, career_path_id, title: roadmapData.title, phases: roadmapData.phases, progress: 0 })
        .select()
        .single();
      if (error) throw error;

      await supabase.from('notifications').insert({
        user_id,
        title: 'Roadmap Generated',
        message: `Your personalized roadmap for ${careerPath.title} is ready with ${roadmapData.phases.length} phases.`,
        type: 'success',
      });
      await supabase.from('activity_logs').insert({ user_id, action: 'roadmap_generated', meta: { career_path_id, roadmap_id: data.id } });

      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      const { id, progress } = req.body;
      if (!id) return res.status(400).json({ error: 'id required' });
      const { data, error } = await supabase.from('roadmaps').update({ progress }).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'id required' });
      const { error } = await supabase.from('roadmaps').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
