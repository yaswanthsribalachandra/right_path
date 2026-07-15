import supabase from './db-client.js';
import { tokenize } from '../api/lib/careerEngine.js';

function scoreAnswer(answer, guidance) {
  if (!answer || !answer.trim()) return { score: 0, feedback: 'No answer provided. Try to always attempt an answer, even a brief one.' };
  const answerTokens = new Set(tokenize(answer));
  const guidanceTokens = tokenize(guidance || '');
  let overlap = 0;
  for (const t of guidanceTokens) if (answerTokens.has(t)) overlap++;
  const coverage = guidanceTokens.length ? overlap / new Set(guidanceTokens).size : 0.5;
  const lengthScore = Math.min(1, answer.split(/\s+/).filter(Boolean).length / 60);
  const raw = coverage * 0.7 + lengthScore * 0.3;
  const score = Math.round(Math.min(10, raw * 10));

  let feedback;
  if (score >= 8) feedback = 'Excellent answer — well structured and covers the key points interviewers look for.';
  else if (score >= 6) feedback = 'Good answer. Consider adding a specific example (STAR method) and more technical depth.';
  else if (score >= 4) feedback = 'Adequate but underdeveloped. Expand with concrete details, metrics, and outcomes.';
  else feedback = 'Needs significant improvement — review the guidance points and structure your answer clearly.';

  return { score, feedback };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { user_id } = req.query;
      if (!user_id) return res.status(400).json({ error: 'user_id required' });
      const { data, error } = await supabase.from('mock_interviews').select('*').eq('user_id', user_id).order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const { action } = req.body;

      if (action === 'start') {
        const { role, count = 6 } = req.body;
        let query = supabase.from('interview_questions').select('*');
        if (role) query = query.ilike('role', `%${role}%`);
        const { data, error } = await query;
        if (error) throw error;
        const pool = data && data.length ? data : (await supabase.from('interview_questions').select('*')).data;
        const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, count);
        return res.status(200).json({ questions: shuffled });
      }

      if (action === 'submit') {
        const { user_id, role, questions, answers } = req.body;
        if (!user_id || !questions || !answers) return res.status(400).json({ error: 'user_id, questions, answers required' });

        const results = questions.map((q, idx) => {
          const answer = answers[idx] || '';
          const { score, feedback } = scoreAnswer(answer, q.answer_guidance);
          return { question: q.question, answer, score, feedback, category: q.category };
        });
        const avgScore = results.length ? Math.round((results.reduce((s, r) => s + r.score, 0) / results.length) * 10) / 10 : 0;

        const strengths = results.filter((r) => r.score >= 7).map((r) => r.category).filter(Boolean);
        const improvements = results.filter((r) => r.score < 6).map((r) => r.category).filter(Boolean);

        const feedbackSummary = {
          overallScore: avgScore,
          strengths: [...new Set(strengths)],
          improvementAreas: [...new Set(improvements)],
          detailed: results,
        };

        const { data, error } = await supabase
          .from('mock_interviews')
          .insert({ user_id, role, questions, answers, score: avgScore, feedback: feedbackSummary })
          .select()
          .single();
        if (error) throw error;

        await supabase.from('notifications').insert({
          user_id,
          title: 'Mock Interview Completed',
          message: `You scored ${avgScore}/10 on your ${role || 'general'} mock interview.`,
          type: avgScore >= 7 ? 'success' : 'info',
        });
        await supabase.from('activity_logs').insert({ user_id, action: 'mock_interview_completed', meta: { score: avgScore, role } });

        return res.status(201).json(data);
      }

      return res.status(400).json({ error: 'Invalid action' });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
