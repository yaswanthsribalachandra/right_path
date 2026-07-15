import supabase from './db-client.js';
import { buildIndex, ragRetrieve, detectIntent } from '../api/lib/careerEngine.js';

async function fetchKnowledgeBase() {
  const [careerPaths, courses, certifications, companies, salaryBands, projects, interviewQuestions] = await Promise.all([
    supabase.from('career_paths').select('*'),
    supabase.from('courses').select('*'),
    supabase.from('certifications').select('*'),
    supabase.from('companies').select('*'),
    supabase.from('salary_bands').select('*'),
    supabase.from('projects').select('*'),
    supabase.from('interview_questions').select('*'),
  ]);
  return {
    careerPaths: careerPaths.data || [],
    courses: courses.data || [],
    certifications: certifications.data || [],
    companies: companies.data || [],
    salaryBands: salaryBands.data || [],
    projects: projects.data || [],
    interviewQuestions: interviewQuestions.data || [],
  };
}

function generateReply(intent, message, kb, userSkills) {
  let corpus = [];
  let label = '';

  if (intent === 'salary') {
    corpus = kb.salaryBands.map((r) => ({ ...r, __type: 'salary_bands', __text: `${r.role_title} ${r.career_category} ${r.location} ${r.experience_level} salary compensation pay` }));
    label = 'salary';
  } else if (intent === 'interview') {
    corpus = kb.interviewQuestions.map((r) => ({ ...r, __type: 'interview_questions', __text: `${r.role} ${r.category} ${r.question} interview` }));
    label = 'interview';
  } else if (intent === 'roadmap' || intent === 'skill_gap') {
    corpus = kb.careerPaths.map((r) => ({ ...r, __type: 'career_paths', __text: `${r.title} ${r.description} ${r.category} ${(r.required_skills||[]).join(' ')} roadmap skills` }));
    label = 'career_paths';
  } else if (intent === 'company') {
    corpus = kb.companies.map((r) => ({ ...r, __type: 'companies', __text: `${r.name} ${r.industry} ${(r.roles||[]).join(' ')} ${r.description} hiring company` }));
    label = 'companies';
  } else if (intent === 'course') {
    corpus = [
      ...kb.courses.map((r) => ({ ...r, __type: 'courses', __text: `${r.title} ${r.provider} ${(r.skill_tags||[]).join(' ')} course` })),
      ...kb.certifications.map((r) => ({ ...r, __type: 'certifications', __text: `${r.title} ${r.provider} ${(r.skill_tags||[]).join(' ')} certification` })),
    ];
    label = 'courses';
  } else if (intent === 'project') {
    corpus = kb.projects.map((r) => ({ ...r, __type: 'projects', __text: `${r.title} ${r.description} ${(r.skills||[]).join(' ')} project` }));
    label = 'projects';
  } else {
    corpus = kb.careerPaths.map((r) => ({ ...r, __type: 'career_paths', __text: `${r.title} ${r.description} ${r.category} ${(r.required_skills||[]).join(' ')} career` }));
    label = 'career_paths';
  }

  const retrieved = ragRetrieve(message, corpus, 4);

  if (!retrieved.length) {
    return {
      reply: "I couldn't find specific matches in our knowledge base for that. Try asking about a specific role (e.g. 'Data Scientist'), a skill, a company, or say 'roadmap for frontend developer'.",
      sources: [],
    };
  }

  let reply = '';
  if (label === 'salary') {
    const top = retrieved.map((r) => r.doc);
    reply = `Based on our salary intelligence data:\n\n` + top.map((r) => `• **${r.role_title}** (${r.experience_level}, ${r.location}): ${r.currency} ${Number(r.min_salary).toLocaleString()} - ${Number(r.max_salary).toLocaleString()}`).join('\n');
  } else if (label === 'interview') {
    const top = retrieved.map((r) => r.doc);
    reply = `Here are relevant interview questions for you to practice:\n\n` + top.map((r, i) => `${i + 1}. **${r.question}** (${r.category}, ${r.difficulty})\n   Tip: ${r.answer_guidance}`).join('\n\n');
  } else if (label === 'career_paths') {
    const top = retrieved.map((r) => r.doc);
    reply = top.map((r) => {
      const missing = userSkills && userSkills.length ? (r.required_skills || []).filter((s) => !userSkills.map((u)=>u.toLowerCase()).includes(String(s).toLowerCase())) : (r.required_skills || []);
      return `**${r.title}** (${r.category})\n${r.description}\nSalary range: $${Number(r.avg_salary_min).toLocaleString()} - $${Number(r.avg_salary_max).toLocaleString()}\n${missing.length ? `Skills to build: ${missing.slice(0,5).join(', ')}` : 'You already cover the core required skills!'}`;
    }).join('\n\n---\n\n');
  } else if (label === 'companies') {
    const top = retrieved.map((r) => r.doc);
    reply = `Companies actively hiring in this space:\n\n` + top.map((r) => `• **${r.name}** (${r.industry}) — roles: ${(r.roles||[]).join(', ')}. Avg salary ~$${Number(r.avg_salary).toLocaleString()}.`).join('\n');
  } else if (label === 'courses') {
    const top = retrieved.map((r) => r.doc);
    reply = `Recommended learning resources:\n\n` + top.map((r) => `• **${r.title}** — ${r.provider}${r.level ? ` (${r.level})` : ''}${r.rating ? ` ⭐ ${r.rating}` : ''}`).join('\n');
  } else if (label === 'projects') {
    const top = retrieved.map((r) => r.doc);
    reply = `Project ideas to strengthen your portfolio:\n\n` + top.map((r) => `• **${r.title}** (${r.difficulty}) — ${r.description}`).join('\n');
  }

  const sources = retrieved.map((r) => ({ type: r.doc.__type, title: r.doc.title || r.doc.name || r.doc.role_title || r.doc.question, relevance: Math.round(Math.min(1, r.score) * 100) }));
  return { reply, sources };
}

async function callGemini(prompt, apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1500,
      }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errText}`);
  }

  const result = await response.json();
  const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty response from Gemini API");
  return text;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-gemini-key');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { user_id } = req.query;
      if (!user_id) return res.status(400).json({ error: 'user_id required' });
      const { data, error } = await supabase.from('chat_history').select('*').eq('user_id', user_id).order('created_at', { ascending: true });
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const { user_id, message } = req.body;
      if (!user_id || !message) return res.status(400).json({ error: 'user_id and message required' });

      await supabase.from('chat_history').insert({ user_id, role: 'user', message, sources: [] });

      const { data: latestResume } = await supabase.from('resumes').select('*').eq('user_id', user_id).order('created_at', { ascending: false }).limit(1).maybeSingle();
      const userSkills = (latestResume?.parsed_data?.matchedSkills || [])
        .map((s) => {
          if (!s) return '';
          if (typeof s === 'string') return s;
          if (typeof s === 'object' && s.name) return s.name;
          return '';
        })
        .filter(Boolean);

      const kb = await fetchKnowledgeBase();
      const intent = detectIntent(message);
      
      let reply = '';
      let sources = [];

      const geminiApiKey = req.headers['x-gemini-key'] || process.env.GEMINI_API_KEY;
      if (geminiApiKey) {
        try {
          const defaultRes = generateReply(intent, message, kb, userSkills);
          sources = defaultRes.sources;

          const resumeContext = latestResume 
            ? `Candidate Name: ${latestResume.parsed_data?.name || 'Unknown'}\nProfile Summary:\n${latestResume.raw_text?.slice(0, 3000) || 'None'}` 
            : 'No resume uploaded yet.';

          let corpus = [];
          if (intent === 'salary') {
            corpus = kb.salaryBands.map((r) => ({ ...r, __type: 'salary_bands', __text: `${r.role_title} ${r.career_category} ${r.location} ${r.experience_level} salary compensation pay` }));
          } else if (intent === 'interview') {
            corpus = kb.interviewQuestions.map((r) => ({ ...r, __type: 'interview_questions', __text: `${r.role} ${r.category} ${r.question} interview` }));
          } else if (intent === 'roadmap' || intent === 'skill_gap') {
            corpus = kb.careerPaths.map((r) => ({ ...r, __type: 'career_paths', __text: `${r.title} ${r.description} ${r.category} ${(r.required_skills||[]).join(' ')} roadmap skills` }));
          } else if (intent === 'company') {
            corpus = kb.companies.map((r) => ({ ...r, __type: 'companies', __text: `${r.name} ${r.industry} ${(r.roles||[]).join(' ')} ${r.description} hiring company` }));
          } else if (intent === 'course') {
            corpus = [
              ...kb.courses.map((r) => ({ ...r, __type: 'courses', __text: `${r.title} ${r.provider} ${(r.skill_tags||[]).join(' ')} course` })),
              ...kb.certifications.map((r) => ({ ...r, __type: 'certifications', __text: `${r.title} ${r.provider} ${(r.skill_tags||[]).join(' ')} certification` })),
            ];
          } else if (intent === 'project') {
            corpus = kb.projects.map((r) => ({ ...r, __type: 'projects', __text: `${r.title} ${r.description} ${(r.skills||[]).join(' ')} project` }));
          } else {
            corpus = kb.careerPaths.map((r) => ({ ...r, __type: 'career_paths', __text: `${r.title} ${r.description} ${r.category} ${(r.required_skills||[]).join(' ')} career` }));
          }

          const retrieved = ragRetrieve(message, corpus, 5);
          const kbContext = retrieved.map((r, i) => {
            const doc = { ...r.doc };
            delete doc.__text;
            delete doc.__vec;
            return `[Source ${i+1}]: ${JSON.stringify(doc)}`;
          }).join('\n\n');

          const prompt = `You are a helpful, professional, and empathetic AI Career Coach. 
You answer the user's questions grounded in the context provided below. 

Use clean and professional Markdown formatting in your response (e.g., bullet points, bolding, numbered lists, section headers).

Here is the context:
=== USER RESUME / PROFILE CONTEXT ===
${resumeContext}
=== END USER CONTEXT ===

=== KNOWLEDGE BASE CONTEXT ===
${kbContext || 'No matching database records found.'}
=== END KNOWLEDGE BASE CONTEXT ===

User's Question: "${message}"

Answer the user's question directly. Base your recommendations, roadmaps, company details, salaries, or courses on the provided context if possible. If the context doesn't contain the answer, you can use your general knowledge, but prioritize the provided database records and state them. Be concise, actionable, and encouraging. Do not mention "based on the context provided" or refer to the JSON format of the sources directly. Make it natural.`;

          reply = await callGemini(prompt, geminiApiKey);
        } catch (geminiErr) {
          console.error("Gemini RAG failed, falling back to deterministic response:", geminiErr);
          const defaultRes = generateReply(intent, message, kb, userSkills);
          reply = defaultRes.reply;
          sources = defaultRes.sources;
        }
      } else {
        const defaultRes = generateReply(intent, message, kb, userSkills);
        reply = defaultRes.reply;
        sources = defaultRes.sources;
      }

      const { data: saved, error } = await supabase
        .from('chat_history')
        .insert({ user_id, role: 'assistant', message: reply, sources })
        .select()
        .single();
      if (error) throw error;

      return res.status(201).json(saved);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
