import { useEffect, useRef, useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Send, Loader2, BookMarked, Bot, User as UserIcon } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import Loader from '../components/ui/Loader';
import { useAuth } from '../contexts/AuthContext';
import { getChatHistory, sendChatMessage } from '../lib/api';
import type { ChatMessage } from '../lib/types';

const SUGGESTIONS = [
  'What career path fits my current skills best?',
  'What is the salary range for a Data Scientist?',
  'Give me a roadmap to become a Frontend Developer.',
  'What companies are hiring Product Managers?',
  'What certifications should I get for cloud engineering?',
  'Give me practice interview questions for backend roles.',
];

function renderMessageContent(text: string) {
  if (!text || typeof text !== 'string') return null;
  const lines = text.split('\n');
  return lines.map((line, idx) => {
    // Check if line is a bullet point
    const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('*');
    let cleanLine = line;
    if (isBullet) {
      cleanLine = line.replace(/^[•\-*]\s*/, '');
    }
    
    // Parse bold text (**bold**)
    const parts = cleanLine.split('**');
    const renderedLine = parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i} className="font-semibold text-white">{part}</strong>;
      }
      // Parse inline code (`code`)
      const codeParts = part.split('`');
      return codeParts.map((cPart, j) => {
        if (j % 2 === 1) {
          return <code key={j} className="bg-white/10 px-1 py-0.5 rounded font-mono text-xs">{cPart}</code>;
        }
        return cPart;
      });
    });

    if (isBullet) {
      return (
        <div key={idx} className="flex gap-2 ml-2 my-0.5">
          <span className="text-emerald-400 select-none">•</span>
          <span className="flex-1">{renderedLine}</span>
        </div>
      );
    }

    return (
      <p key={idx} className={line.trim() === '' ? 'h-2' : 'my-0.5'}>
        {renderedLine}
      </p>
    );
  });
}

export default function ChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    getChatHistory(user.id).then(setMessages).finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  async function handleSend(text?: string) {
    const content = (text ?? input).trim();
    if (!content || !user) return;
    setInput('');
    setSending(true);
    const optimisticUser: ChatMessage = { id: `temp-${Date.now()}`, user_id: user.id, role: 'user', message: content, sources: [], created_at: new Date().toISOString() };
    setMessages((m) => [...m, optimisticUser]);
    try {
      const assistantMsg = await sendChatMessage({ user_id: user.id, message: content });
      setMessages((m) => [...m, assistantMsg]);
    } catch {
      setMessages((m) => [...m, { id: `err-${Date.now()}`, user_id: user.id, role: 'assistant', message: 'Sorry, I ran into an error retrieving that information. Please try again.', sources: [], created_at: new Date().toISOString() }]);
    } finally {
      setSending(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    handleSend();
  }

  if (loading) return <DashboardLayout><Loader label="Loading chat history..." /></DashboardLayout>;

  return (
    <DashboardLayout>
      <p className="font-mono text-xs uppercase tracking-widest text-faint mb-2">AI Career Coach</p>
      <h1 className="font-display text-3xl text-text mb-6">Personalized AI Chat</h1>

      <div className="glass-strong rounded-2xl flex flex-col h-[calc(100vh-260px)] min-h-[500px]">
        <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar px-5 sm:px-7 py-6 space-y-5">
          {!messages.length && (
            <div className="text-center py-8">
              <Sparkles className="h-8 w-8 mx-auto mb-4" style={{ color: 'var(--color-emerald)' }} />
              <h2 className="font-display text-xl text-text mb-2">Ask me anything about your career</h2>
              <p className="text-sm text-muted max-w-md mx-auto mb-6">
                I retrieve real answers from our career knowledge base and always cite my sources — no guessing.
              </p>
              <div className="grid sm:grid-cols-2 gap-2.5 max-w-lg mx-auto">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => handleSend(s)} className="text-left text-xs glass rounded-xl px-4 py-3 hover:bg-white/5 transition-colors text-muted">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'assistant' && (
                <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--color-surface-3)' }}>
                  <Bot className="h-4 w-4" style={{ color: 'var(--color-emerald)' }} />
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${m.role === 'user' ? 'text-ink' : 'glass text-text'}`} style={m.role === 'user' ? { background: 'var(--color-emerald)' } : {}}>
                <div className="text-sm leading-relaxed space-y-1">
                  {renderMessageContent(m.message)}
                </div>
                {m.sources && m.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t flex flex-wrap gap-1.5" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                    <span className="text-[10px] font-mono uppercase text-faint flex items-center gap-1 w-full mb-1"><BookMarked className="h-3 w-3" /> Sources</span>
                    {m.sources.map((s, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--color-muted)' }}>{s.title} · {s.relevance}%</span>
                    ))}
                  </div>
                )}
              </div>
              {m.role === 'user' && (
                <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--color-surface-3)' }}>
                  <UserIcon className="h-4 w-4 text-muted" />
                </div>
              )}
            </motion.div>
          ))}

          {sending && (
            <div className="flex gap-3 justify-start">
              <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--color-surface-3)' }}>
                <Bot className="h-4 w-4" style={{ color: 'var(--color-emerald)' }} />
              </div>
              <div className="glass rounded-2xl px-4 py-3 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted" /> <span className="text-sm text-muted">Retrieving from knowledge base...</span>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-4 border-t flex items-center gap-3" style={{ borderColor: 'var(--color-border)' }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about roadmaps, salaries, companies, skills..."
            className="flex-1 bg-white/5 border rounded-full px-5 py-3 text-sm text-text outline-none focus:border-emerald transition-colors"
            style={{ borderColor: 'var(--color-border)' }}
          />
          <button type="submit" disabled={sending || !input.trim()} className="h-11 w-11 rounded-full flex items-center justify-center shrink-0 disabled:opacity-40" style={{ background: 'var(--color-emerald)' }}>
            <Send className="h-4.5 w-4.5 text-ink" />
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}
