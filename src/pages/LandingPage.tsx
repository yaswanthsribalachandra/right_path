import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, Sparkles, FileSearch, Target, Map as MapIcon, Mic, MessageSquareText,
  TrendingUp, Building2, GraduationCap, ShieldCheck, ChevronDown, Check, Star, Menu, X,
} from 'lucide-react';
import Logo from '../components/ui/Logo';

const FEATURES = [
  { icon: FileSearch, title: 'ATS Resume Scoring', desc: 'Upload any PDF or DOCX resume and get an instant ATS compatibility score with a category-by-category breakdown.' },
  { icon: Target, title: 'Skill Gap Analysis', desc: 'Our retrieval engine compares your extracted skills against real role requirements to surface exactly what to learn next.' },
  { icon: MapIcon, title: 'Personalized Roadmaps', desc: 'Generate a phased learning roadmap with courses, certifications, and projects tailored to your target career.' },
  { icon: Mic, title: 'Mock Interviews', desc: 'Practice with role-specific interview questions and get automated scoring plus actionable feedback.' },
  { icon: MessageSquareText, title: 'AI Career Chat', desc: 'Ask anything — salary, roadmaps, companies, courses — and get answers grounded in our live knowledge base with citations.' },
  { icon: TrendingUp, title: 'Salary Insights', desc: 'Explore real compensation bands by role, seniority, and location sourced from our salary intelligence dataset.' },
  { icon: Building2, title: 'Company Suggestions', desc: 'Discover companies actively hiring for your target role, with typical pay and open role types.' },
  { icon: GraduationCap, title: 'Courses & Certifications', desc: 'Curated learning resources mapped directly to the skills you are missing — no generic filler content.' },
];

const STATS = [
  { value: '18', label: 'Structured Data Domains' },
  { value: '12+', label: 'AI-Powered Modules' },
  { value: '100%', label: 'Cited, No Hallucination' },
  { value: '24/7', label: 'Always-On Career Coach' },
];

const PRICING = [
  {
    name: 'Explorer',
    price: '$0',
    period: 'forever',
    desc: 'Get started with core resume and career tools.',
    features: ['1 resume analysis / month', 'ATS score & breakdown', 'Career path matching', 'Community learning resources'],
    cta: 'Start Free',
    highlighted: false,
  },
  {
    name: 'Accelerator',
    price: '$19',
    period: 'per month',
    desc: 'For students actively preparing for their next role.',
    features: ['Unlimited resume analyses', 'Full roadmap generator', 'Unlimited AI career chat', 'Mock interviews with scoring', 'Salary & company insights'],
    cta: 'Start Accelerator',
    highlighted: true,
  },
  {
    name: 'Institution',
    price: 'Custom',
    period: 'contact us',
    desc: 'For universities and bootcamps supporting cohorts of students.',
    features: ['Everything in Accelerator', 'Admin analytics dashboard', 'Bulk student onboarding', 'Mentor role & review tools', 'Dedicated success manager'],
    cta: 'Talk to Sales',
    highlighted: false,
  },
];

const TESTIMONIALS = [
  { name: 'Amara Okafor', role: 'CS Senior, Data Science Track', quote: 'The skill gap analysis showed me exactly which 4 skills were blocking me from Data Analyst roles. I closed the gap in 6 weeks using the generated roadmap.', rating: 5 },
  { name: 'Diego Fernandez', role: 'Bootcamp Graduate', quote: 'The mock interview scoring felt like a real technical screen. I walked into my actual interviews far more confident.', rating: 5 },
  { name: 'Priya Nair', role: 'Career Switcher, Product Management', quote: 'The AI chat cites its sources every time — it never felt like it was making things up. That trust is rare in AI tools.', rating: 5 },
  { name: 'Jordan Lee', role: 'Recent Graduate', quote: 'Salary insights + company suggestions in one place saved me hours of scattered research across five different sites.', rating: 4 },
];

const FAQS = [
  { q: 'How does the AI avoid hallucinating career advice?', a: 'Every recommendation is generated through a retrieval-augmented pipeline: we embed your query, retrieve the most relevant records from our structured knowledge base (career paths, courses, salaries, companies), re-rank them, and only surface facts that exist in those retrieved records. Every response includes a "sources" citation.' },
  { q: 'What resume formats are supported?', a: 'You can upload PDF, DOCX, or plain text resumes. Parsing happens instantly in your browser and extracts contact details, education, experience, projects, and skills.' },
  { q: 'Is my resume data private?', a: 'Yes. Your resume and analysis are stored securely and tied to your authenticated account only. We never share individual data with third parties.' },
  { q: 'Can mentors and admins see student progress?', a: 'Role-based access controls mean mentors can support learners while admins get aggregate platform analytics — individual data stays protected by access policy.' },
  { q: 'Do I need to pay to generate a roadmap?', a: 'The Explorer plan includes career matching and a limited resume analysis. Full roadmap generation, unlimited mock interviews, and AI chat are part of Accelerator.' },
];

export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen mesh-bg text-text overflow-x-hidden">
      {/* Nav */}
      <header className="fixed top-0 inset-x-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-[68px] flex items-center justify-between">
          <Logo />
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted">
            <a href="#features" className="hover:text-text transition-colors">Features</a>
            <a href="#pricing" className="hover:text-text transition-colors">Pricing</a>
            <a href="#testimonials" className="hover:text-text transition-colors">Testimonials</a>
            <a href="#faq" className="hover:text-text transition-colors">FAQ</a>
          </nav>
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className="text-sm text-muted hover:text-text px-4 py-2 transition-colors">Sign In</Link>
            <Link
              to="/signup"
              className="text-sm font-semibold text-ink px-4 py-2 rounded-full flex items-center gap-1.5 transition-transform hover:scale-105"
              style={{ background: 'var(--color-emerald)' }}
            >
              Get Started <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <button className="md:hidden text-text" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        {mobileOpen && (
          <div className="md:hidden glass-strong px-5 py-4 flex flex-col gap-3">
            <a href="#features" onClick={() => setMobileOpen(false)} className="text-muted text-sm">Features</a>
            <a href="#pricing" onClick={() => setMobileOpen(false)} className="text-muted text-sm">Pricing</a>
            <a href="#testimonials" onClick={() => setMobileOpen(false)} className="text-muted text-sm">Testimonials</a>
            <a href="#faq" onClick={() => setMobileOpen(false)} className="text-muted text-sm">FAQ</a>
            <Link to="/login" className="text-sm text-text">Sign In</Link>
            <Link to="/signup" className="text-sm font-semibold text-ink px-4 py-2 rounded-full text-center" style={{ background: 'var(--color-emerald)' }}>Get Started</Link>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative pt-40 pb-28 px-5 sm:px-8 grid-overlay">
        <div className="absolute top-24 left-[8%] h-64 w-64 rounded-full blur-3xl animate-float-slow" style={{ background: 'rgba(52,216,168,0.15)' }} />
        <div className="absolute top-40 right-[10%] h-72 w-72 rounded-full blur-3xl animate-float-slow" style={{ background: 'rgba(245,181,85,0.1)', animationDelay: '2s' }} />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs font-mono text-emerald-soft mb-8"
            style={{ color: 'var(--color-emerald-soft)' }}
          >
            <Sparkles className="h-3.5 w-3.5" /> RAG-Powered Career Intelligence
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-[2.6rem] sm:text-6xl lg:text-7xl leading-[1.05] tracking-tight"
          >
            Your entire career team,
            <br />
            <span className="text-gradient">condensed into one AI.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-lg text-muted max-w-2xl mx-auto"
          >
            Upload your resume once. Get ATS scoring, skill gap analysis, a personalized roadmap,
            mock interviews, salary insight, and a career counselor that cites its sources —
            every single time.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 text-ink font-semibold px-7 py-3.5 rounded-full transition-transform hover:scale-105"
              style={{ background: 'linear-gradient(90deg, var(--color-emerald), var(--color-amber))' }}
            >
              Analyze My Resume Free <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#features" className="inline-flex items-center gap-2 text-text font-medium px-7 py-3.5 rounded-full glass hover:bg-white/5 transition-colors">
              See How It Works
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto"
          >
            {STATS.map((s) => (
              <div key={s.label} className="glass rounded-2xl py-6 px-3">
                <p className="font-display text-3xl text-gradient">{s.value}</p>
                <p className="text-xs text-muted mt-1">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-5 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-16">
            <p className="font-mono text-xs uppercase tracking-[0.2em] mb-3" style={{ color: 'var(--color-amber)' }}>Full Platform</p>
            <h2 className="font-display text-3xl sm:text-4xl">Everything a career coach, recruiter, and mentor would tell you — automated.</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: (i % 4) * 0.06 }}
                className="glass rounded-2xl p-6 hover:-translate-y-1 transition-transform"
              >
                <div className="h-11 w-11 rounded-xl flex items-center justify-center mb-4" style={{ background: 'var(--color-surface-3)' }}>
                  <f.icon className="h-5 w-5" style={{ color: 'var(--color-emerald)' }} />
                </div>
                <h3 className="font-semibold text-text mb-2">{f.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-5 sm:px-8" style={{ background: 'var(--color-surface)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-16">
            <p className="font-mono text-xs uppercase tracking-[0.2em] mb-3" style={{ color: 'var(--color-amber)' }}>Pipeline</p>
            <h2 className="font-display text-3xl sm:text-4xl">A real RAG pipeline, not a black box.</h2>
            <p className="text-muted mt-3">Retrieval, re-ranking, and cited generation — every answer traces back to real data.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { step: '01', title: 'Parse & Embed', desc: 'Your resume is parsed and its skills embedded into vector space.' },
              { step: '02', title: 'Retrieve', desc: 'Relevant career paths, courses, and roles are retrieved by similarity.' },
              { step: '03', title: 'Re-rank', desc: 'A cross-encoder pass boosts the most contextually precise matches.' },
              { step: '04', title: 'Cited Output', desc: 'Structured JSON responses are generated with source citations.' },
            ].map((s) => (
              <div key={s.step} className="glass rounded-2xl p-6 relative overflow-hidden">
                <span className="font-display text-4xl text-faint opacity-40">{s.step}</span>
                <h4 className="font-semibold text-text mt-3">{s.title}</h4>
                <p className="text-sm text-muted mt-1">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-5 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-16">
            <p className="font-mono text-xs uppercase tracking-[0.2em] mb-3" style={{ color: 'var(--color-amber)' }}>Trusted By Learners</p>
            <h2 className="font-display text-3xl sm:text-4xl">Students land roles faster with a plan, not just a chatbot.</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="glass rounded-2xl p-7">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4" fill={i < t.rating ? 'var(--color-amber)' : 'none'} style={{ color: 'var(--color-amber)' }} />
                  ))}
                </div>
                <p className="text-text leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center font-display" style={{ background: 'var(--color-surface-3)', color: 'var(--color-emerald)' }}>
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text">{t.name}</p>
                    <p className="text-xs text-faint">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-5 sm:px-8" style={{ background: 'var(--color-surface)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-16">
            <p className="font-mono text-xs uppercase tracking-[0.2em] mb-3" style={{ color: 'var(--color-amber)' }}>Pricing</p>
            <h2 className="font-display text-3xl sm:text-4xl">Simple plans for every stage of the journey.</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {PRICING.map((p) => (
              <div
                key={p.name}
                className={`rounded-2xl p-7 flex flex-col ${p.highlighted ? 'relative' : 'glass'}`}
                style={p.highlighted ? { background: 'linear-gradient(160deg, var(--color-surface-3), var(--color-surface-2))', border: '1px solid var(--color-emerald)' } : {}}
              >
                {p.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-mono uppercase tracking-wider px-3 py-1 rounded-full text-ink" style={{ background: 'var(--color-emerald)' }}>
                    Most Popular
                  </span>
                )}
                <h3 className="font-display text-xl text-text">{p.name}</h3>
                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="font-display text-4xl text-text">{p.price}</span>
                  <span className="text-sm text-faint">/ {p.period}</span>
                </div>
                <p className="text-sm text-muted mt-3">{p.desc}</p>
                <ul className="mt-6 space-y-2.5 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-muted">
                      <Check className="h-4 w-4 mt-0.5 shrink-0" style={{ color: 'var(--color-emerald)' }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/signup"
                  className={`mt-7 text-center rounded-full py-2.5 text-sm font-semibold transition-transform hover:scale-105 ${p.highlighted ? 'text-ink' : 'glass text-text'}`}
                  style={p.highlighted ? { background: 'var(--color-emerald)' } : {}}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-5 sm:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <p className="font-mono text-xs uppercase tracking-[0.2em] mb-3" style={{ color: 'var(--color-amber)' }}>FAQ</p>
            <h2 className="font-display text-3xl sm:text-4xl">Questions, answered.</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((f, i) => (
              <div key={f.q} className="glass rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4.5 text-left"
                >
                  <span className="font-medium text-text pr-4">{f.q}</span>
                  <ChevronDown className={`h-4 w-4 text-muted shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && <p className="px-6 pb-5 text-sm text-muted leading-relaxed">{f.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-5 sm:px-8">
        <div className="max-w-4xl mx-auto glass-strong rounded-3xl p-12 text-center relative overflow-hidden">
          <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full blur-3xl" style={{ background: 'rgba(52,216,168,0.2)' }} />
          <ShieldCheck className="h-9 w-9 mx-auto mb-5" style={{ color: 'var(--color-emerald)' }} />
          <h2 className="font-display text-3xl sm:text-4xl mb-4">Stop guessing your next career move.</h2>
          <p className="text-muted max-w-lg mx-auto mb-8">
            Join thousands of students using cited, retrieval-grounded AI to plan real career outcomes.
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 text-ink font-semibold px-8 py-3.5 rounded-full transition-transform hover:scale-105"
            style={{ background: 'linear-gradient(90deg, var(--color-emerald), var(--color-amber))' }}
          >
            Get Started Free <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t px-5 sm:px-8 py-10" style={{ borderColor: 'var(--color-border)' }}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo />
          <p className="text-xs text-faint">© {new Date().getFullYear()} Pathwright Career Intelligence. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
