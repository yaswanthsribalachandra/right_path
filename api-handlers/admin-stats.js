import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const [profiles, resumes, roadmaps, mockInterviews, feedback, logs, chats] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact' }),
      supabase.from('resumes').select('*', { count: 'exact' }),
      supabase.from('roadmaps').select('*', { count: 'exact' }),
      supabase.from('mock_interviews').select('*', { count: 'exact' }),
      supabase.from('feedback').select('*').order('created_at', { ascending: false }).limit(10),
      supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(20),
      supabase.from('chat_history').select('*', { count: 'exact' }),
    ]);

    const avgAts = resumes.data && resumes.data.length ? Math.round(resumes.data.reduce((s, r) => s + (Number(r.ats_score) || 0), 0) / resumes.data.length) : 0;
    const avgFeedbackRating = feedback.data && feedback.data.length ? Math.round((feedback.data.reduce((s, f) => s + (Number(f.rating) || 0), 0) / feedback.data.length) * 10) / 10 : 0;

    return res.status(200).json({
      totalUsers: profiles.count || 0,
      totalResumes: resumes.count || 0,
      totalRoadmaps: roadmaps.count || 0,
      totalMockInterviews: mockInterviews.count || 0,
      totalChatMessages: chats.count || 0,
      avgAtsScore: avgAts,
      avgFeedbackRating,
      recentFeedback: feedback.data || [],
      recentActivity: logs.data || [],
      recentUsers: (profiles.data || []).slice(-10).reverse(),
    });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
