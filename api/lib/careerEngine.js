// ============================================================================
// AI Career Intelligence Engine
// ----------------------------------------------------------------------------
// This module implements the platform's Retrieval-Augmented Generation (RAG)
// pipeline in pure deterministic JavaScript so it runs inside Vercel
// serverless functions without an external LLM key:
//
//   Document Loader -> Cleaning -> Chunking -> Embedding -> Vector Index
//        -> Retriever -> Cross-Encoder Re-rank -> Prompt Template
//        -> Generation -> JSON Response (with citations)
//
// "Documents" are rows pulled live from Postgres (career_paths, courses,
// certifications, projects, companies, salary_bands, interview_questions).
// Each document is embedded into a bag-of-words TF weighted vector
// (a lightweight stand-in for sentence-transformer / Gemini embeddings),
// stored in an in-memory vector index built per-request, then retrieved via
// cosine similarity + a keyword-overlap cross-encoder re-ranking pass.
// Generation never hallucinates: every fact surfaced to the user is read
// directly out of a retrieved database record, and every response carries a
// `sources` array citing which records were used.
// ============================================================================

const STOPWORDS = new Set([
  'the','a','an','and','or','of','to','in','on','for','with','is','are','was',
  'were','be','been','being','this','that','these','those','it','as','at',
  'by','from','into','than','then','so','but','if','not','no','can','will',
  'would','should','could','have','has','had','do','does','did','i','you',
  'he','she','they','we','my','your','our','their','me','him','her','them',
]);

export function tokenize(text = '') {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9+.#\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

// ---- Embedding: TF weighted bag-of-words vector -----------------------
export function embed(text) {
  const tokens = tokenize(text);
  const vec = {};
  for (const t of tokens) vec[t] = (vec[t] || 0) + 1;
  const norm = Math.sqrt(Object.values(vec).reduce((s, v) => s + v * v, 0)) || 1;
  for (const k of Object.keys(vec)) vec[k] = vec[k] / norm;
  return vec;
}

export function cosineSimilarity(vecA, vecB) {
  let dot = 0;
  const keys = Object.keys(vecA).length < Object.keys(vecB).length ? vecA : vecB;
  for (const k of Object.keys(keys)) {
    if (vecA[k] && vecB[k]) dot += vecA[k] * vecB[k];
  }
  return dot;
}

// Cross-encoder style re-rank: boosts docs with exact substring/keyword hits
// on top of the vector cosine similarity score.
function crossEncoderScore(query, doc, baseScore) {
  const q = String(query).toLowerCase();
  const text = String(doc.__text || '').toLowerCase();
  let boost = 0;
  const qTokens = new Set(tokenize(query));
  const dTokens = new Set(tokenize(doc.__text || ''));
  let overlap = 0;
  for (const t of qTokens) if (dTokens.has(t)) overlap++;
  boost += overlap * 0.08;
  if (text.includes(q) && q.length > 2) boost += 0.25;
  return baseScore + boost;
}

// Generic retriever over an array of {__text, ...fields} documents.
export function ragRetrieve(query, documents, topK = 5) {
  const qVec = embed(query);
  const scored = documents.map((doc) => {
    const dVec = doc.__vec || embed(doc.__text || '');
    const base = cosineSimilarity(qVec, dVec);
    const score = crossEncoderScore(query, doc, base);
    return { doc, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK).filter((s) => s.score > 0);
}

export function buildIndex(rows, textFn) {
  return rows.map((row) => {
    const text = textFn(row);
    return { ...row, __text: text, __vec: embed(text) };
  });
}

// ---- Skill extraction from raw resume text -----------------------------
export function extractSkillsFromText(text, skillCatalog) {
  const lower = ` ${String(text).toLowerCase()} `;
  const found = [];
  for (const skill of skillCatalog) {
    const name = skill.name.toLowerCase();
    const pattern = new RegExp(`[^a-z0-9+]${escapeRegex(name)}[^a-z0-9+]`, 'i');
    if (pattern.test(lower) || lower.includes(` ${name} `)) {
      found.push(skill);
    }
  }
  // de-dupe by name
  const seen = new Set();
  return found.filter((s) => {
    const k = s.name.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ---- Resume parsing helpers (structured field extraction) --------------
export function parseResumeText(rawText) {
  const text = rawText || '';
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = text.match(/(\+?\d{1,3}[\s-]?)?\(?\d{3,4}\)?[\s-]?\d{3,4}[\s-]?\d{3,4}/);
  const githubMatch = text.match(/(https?:\/\/)?(www\.)?github\.com\/[A-Za-z0-9_-]+/i);
  const linkedinMatch = text.match(/(https?:\/\/)?(www\.)?linkedin\.com\/in\/[A-Za-z0-9_-]+/i);
  const portfolioMatch = text.match(/(https?:\/\/)?[A-Za-z0-9-]+\.(dev|me|io|com)\/?[A-Za-z0-9/_-]*/i);

  // Name heuristic: first non-empty line that isn't an email/phone/section header and is short
  let name = '';
  for (const line of lines.slice(0, 6)) {
    if (/@|\d{4,}|http/i.test(line)) continue;
    if (line.length > 2 && line.length < 60 && !/^(resume|curriculum vitae|cv)$/i.test(line)) {
      name = line;
      break;
    }
  }

  const sectionHeaders = {
    education: /^(education|academic background)/i,
    experience: /^(experience|work experience|employment|professional experience)/i,
    projects: /^(projects|personal projects|academic projects)/i,
    skills: /^(skills|technical skills|core competencies)/i,
    achievements: /^(achievements|awards|honou?rs)/i,
    certifications: /^(certifications?|licenses)/i,
    summary: /^(summary|objective|profile|about)/i,
  };

  const sections = {};
  let current = 'header';
  sections[current] = [];
  for (const line of lines) {
    let matchedHeader = null;
    for (const [key, regex] of Object.entries(sectionHeaders)) {
      if (regex.test(line)) { matchedHeader = key; break; }
    }
    if (matchedHeader) {
      current = matchedHeader;
      sections[current] = sections[current] || [];
      continue;
    }
    sections[current] = sections[current] || [];
    sections[current].push(line);
  }

  return {
    name: name || 'Unknown Candidate',
    email: emailMatch ? emailMatch[0] : null,
    phone: phoneMatch ? phoneMatch[0].trim() : null,
    github: githubMatch ? (githubMatch[0].startsWith('http') ? githubMatch[0] : `https://${githubMatch[0]}`) : null,
    linkedin: linkedinMatch ? (linkedinMatch[0].startsWith('http') ? linkedinMatch[0] : `https://${linkedinMatch[0]}`) : null,
    portfolio: portfolioMatch && !/linkedin|github/i.test(portfolioMatch[0]) ? portfolioMatch[0] : null,
    summary: (sections.summary || []).join(' ').slice(0, 600),
    education: sections.education || [],
    experience: sections.experience || [],
    projects: sections.projects || [],
    achievements: sections.achievements || [],
    certificationsRaw: sections.certifications || [],
    skillsRaw: sections.skills || [],
    wordCount: text.split(/\s+/).filter(Boolean).length,
    lineCount: lines.length,
  };
}

// ---- ATS Score Computation ----------------------------------------------
export function computeATSScore(rawText, parsed, matchedSkills = [], targetRole = null) {
  const breakdown = [];
  let score = 0;

  const hasEmail = !!parsed.email;
  const hasPhone = !!parsed.phone;
  const hasLinks = !!(parsed.github || parsed.linkedin || parsed.portfolio);
  const contactScore = (hasEmail ? 8 : 0) + (hasPhone ? 6 : 0) + (hasLinks ? 6 : 0);
  breakdown.push({
    category: 'Contact Information',
    score: contactScore,
    max: 20,
    detail: hasEmail && hasPhone ? 'Email and phone detected.' : 'Missing contact details reduce recruiter reach.',
  });
  score += contactScore;

  const sectionsPresent = ['education', 'experience', 'projects', 'skillsRaw'].filter(
    (k) => Array.isArray(parsed[k]) && parsed[k].length > 0
  ).length;
  const structureScore = Math.round((sectionsPresent / 4) * 20);
  breakdown.push({
    category: 'Resume Structure',
    score: structureScore,
    max: 20,
    detail: `${sectionsPresent}/4 key sections detected (Education, Experience, Projects, Skills).`,
  });
  score += structureScore;

  const skillCount = matchedSkills.length;
  const skillScore = Math.min(20, skillCount * 2);
  breakdown.push({
    category: 'Skill Keyword Density',
    score: skillScore,
    max: 20,
    detail: `${skillCount} recognized technical/professional skill keywords found.`,
  });
  score += skillScore;

  const actionVerbs = ['built','developed','designed','led','managed','created','implemented','optimized','launched','improved','automated','architected','deployed','analyzed','mentored','delivered'];
  const lower = rawText.toLowerCase();
  const verbHits = actionVerbs.filter((v) => lower.includes(v)).length;
  const quantifiers = (rawText.match(/\d+%|\$\d+|\d+x|\d+\+/g) || []).length;
  const impactScore = Math.min(20, verbHits * 2 + quantifiers * 2);
  breakdown.push({
    category: 'Impact & Action Verbs',
    score: impactScore,
    max: 20,
    detail: `${verbHits} strong action verbs and ${quantifiers} quantified achievements detected.`,
  });
  score += impactScore;

  const wc = parsed.wordCount || 0;
  let lengthScore;
  if (wc >= 300 && wc <= 900) lengthScore = 20;
  else if (wc > 900 && wc <= 1200) lengthScore = 14;
  else if (wc < 300 && wc >= 150) lengthScore = 12;
  else lengthScore = 6;
  breakdown.push({
    category: 'Length & Readability',
    score: lengthScore,
    max: 20,
    detail: `${wc} words. Ideal ATS-friendly resumes run 300-900 words across 1-2 pages.`,
  });
  score += lengthScore;

  return { total: Math.min(100, Math.round(score)), breakdown };
}

// ---- Career Path Matching ------------------------------------------------
export function matchCareerPaths(userSkillNames, careerPaths) {
  const userSet = new Set(userSkillNames.map((s) => s.toLowerCase()));
  const results = careerPaths.map((path) => {
    const required = (path.required_skills || []).map((s) => String(s).toLowerCase());
    const nice = (path.nice_to_have_skills || []).map((s) => String(s).toLowerCase());
    const matchedRequired = required.filter((s) => userSet.has(s));
    const matchedNice = nice.filter((s) => userSet.has(s));
    const missingRequired = required.filter((s) => !userSet.has(s));

    const requiredCoverage = required.length ? matchedRequired.length / required.length : 0;
    const niceCoverage = nice.length ? matchedNice.length / nice.length : 0;
    const matchScore = Math.round((requiredCoverage * 0.75 + niceCoverage * 0.25) * 100);

    return {
      careerPath: path,
      matchScore,
      matchedRequiredSkills: matchedRequired,
      matchedNiceToHaveSkills: matchedNice,
      missingRequiredSkills: missingRequired,
      requiredCoverage: Math.round(requiredCoverage * 100),
    };
  });
  results.sort((a, b) => b.matchScore - a.matchScore);
  return results;
}

// ---- Roadmap Generator ---------------------------------------------------
export function generateRoadmap(careerPath, userSkillNames, courses, certifications, projects) {
  const userSet = new Set(userSkillNames.map((s) => s.toLowerCase()));
  const required = (careerPath.required_skills || []);
  const niceToHave = (careerPath.nice_to_have_skills || []);
  const gapSkills = required.filter((s) => !userSet.has(String(s).toLowerCase()));
  const stretchSkills = niceToHave.filter((s) => !userSet.has(String(s).toLowerCase()));

  const half = Math.ceil(gapSkills.length / 2) || 0;
  const foundationSkills = gapSkills.slice(0, half);
  const intermediateSkills = gapSkills.slice(half);

  function coursesFor(skillList) {
    if (!skillList.length) return [];
    const lowerSkills = skillList.map((s) => String(s).toLowerCase());
    return courses
      .filter((c) => (c.skill_tags || []).some((tag) => lowerSkills.includes(String(tag).toLowerCase())))
      .slice(0, 4);
  }
  function certsFor(skillList) {
    if (!skillList.length) return [];
    const lowerSkills = skillList.map((s) => String(s).toLowerCase());
    return certifications
      .filter((c) => (c.skill_tags || []).some((tag) => lowerSkills.includes(String(tag).toLowerCase())))
      .slice(0, 3);
  }
  function projectsFor(skillList) {
    if (!skillList.length) return projects.filter((p) => p.career_category === careerPath.category).slice(0, 2);
    const lowerSkills = skillList.map((s) => String(s).toLowerCase());
    return projects
      .filter((p) => (p.skills || []).some((tag) => lowerSkills.includes(String(tag).toLowerCase())))
      .slice(0, 3);
  }

  const phases = [
    {
      phase: 1,
      title: 'Foundation',
      duration: '4-6 weeks',
      skills: foundationSkills,
      courses: coursesFor(foundationSkills),
      certifications: [],
      projects: projectsFor(foundationSkills).slice(0, 1),
    },
    {
      phase: 2,
      title: 'Core Competency Building',
      duration: '6-8 weeks',
      skills: intermediateSkills,
      courses: coursesFor(intermediateSkills),
      certifications: certsFor(foundationSkills.concat(intermediateSkills)).slice(0, 1),
      projects: projectsFor(intermediateSkills),
    },
    {
      phase: 3,
      title: 'Advanced Specialization',
      duration: '4-6 weeks',
      skills: stretchSkills.slice(0, 4),
      courses: coursesFor(stretchSkills),
      certifications: certsFor(stretchSkills),
      projects: projectsFor(stretchSkills),
    },
    {
      phase: 4,
      title: 'Job-Ready Portfolio & Applications',
      duration: '3-4 weeks',
      skills: ['Resume Tailoring', 'Mock Interviews', 'Portfolio Polish', 'Networking'],
      courses: [],
      certifications: [],
      projects: projects.filter((p) => p.career_category === careerPath.category).slice(0, 2),
    },
  ];

  return {
    careerPathId: careerPath.id,
    title: `${careerPath.title} Career Roadmap`,
    totalGapSkills: gapSkills.length,
    phases,
  };
}

// ---- Salary Insights ------------------------------------------------------
export function computeSalaryInsight(roleTitleOrCategory, salaryBands, location = null) {
  const query = String(roleTitleOrCategory).toLowerCase();
  let candidates = salaryBands.filter(
    (b) => b.role_title?.toLowerCase().includes(query) || b.career_category?.toLowerCase().includes(query)
  );
  if (location) {
    const locFiltered = candidates.filter((b) => b.location?.toLowerCase().includes(location.toLowerCase()));
    if (locFiltered.length) candidates = locFiltered;
  }
  if (!candidates.length) return null;

  const byLevel = {};
  for (const c of candidates) {
    byLevel[c.experience_level] = byLevel[c.experience_level] || [];
    byLevel[c.experience_level].push(c);
  }
  const levels = Object.entries(byLevel).map(([level, rows]) => {
    const min = Math.min(...rows.map((r) => Number(r.min_salary)));
    const max = Math.max(...rows.map((r) => Number(r.max_salary)));
    return { level, min, max, currency: rows[0].currency, sampleSize: rows.length };
  });
  const overallMin = Math.min(...candidates.map((c) => Number(c.min_salary)));
  const overallMax = Math.max(...candidates.map((c) => Number(c.max_salary)));

  return {
    query: roleTitleOrCategory,
    overallRange: { min: overallMin, max: overallMax, currency: candidates[0].currency },
    byExperienceLevel: levels.sort((a, b) => {
      const order = ['Entry', 'Mid', 'Senior', 'Lead', 'Staff', 'Principal'];
      return order.indexOf(a.level) - order.indexOf(b.level);
    }),
    sources: candidates.map((c) => ({ role: c.role_title, location: c.location, level: c.experience_level })),
  };
}

// ---- Chat: intent detection + structured RAG generation -------------------
export function detectIntent(message) {
  const m = message.toLowerCase();
  if (/salary|pay|compensation|earn|worth/.test(m)) return 'salary';
  if (/interview|question|behavioral|technical round/.test(m)) return 'interview';
  if (/roadmap|learn|study plan|how do i become|path to become/.test(m)) return 'roadmap';
  if (/skill gap|missing skill|what skills/.test(m)) return 'skill_gap';
  if (/company|hire|hiring|companies/.test(m)) return 'company';
  if (/course|certification|certificate/.test(m)) return 'course';
  if (/resume|cv|ats/.test(m)) return 'resume';
  if (/project/.test(m)) return 'project';
  return 'career_general';
}

export function buildCitedAnswer(intent, retrieved) {
  const sources = retrieved.map((r) => ({
    type: r.doc.__type,
    title: r.doc.title || r.doc.name || r.doc.role_title || r.doc.question,
    relevance: Math.round(Math.min(1, r.score) * 100),
  }));
  return sources;
}
