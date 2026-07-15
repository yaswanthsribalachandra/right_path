import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UploadCloud, FileText, Loader2, X, AlertTriangle } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import { extractResumeText, fileToBase64 } from '../lib/resumeParser';
import { uploadResumeAnalysis, uploadResumeFile } from '../lib/api';

const STAGES = [
  'Reading document...',
  'Extracting structured fields...',
  'Matching skills against knowledge base...',
  'Computing ATS score...',
  'Finalizing analysis...',
];

export default function UploadResumePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { show } = useToast();
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [stageIdx, setStageIdx] = useState(0);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || !files.length) return;
    const f = files[0];
    const ext = f.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'docx', 'txt'].includes(ext || '')) {
      setError('Unsupported format. Please upload a PDF, DOCX, or TXT file.');
      return;
    }
    if (f.size > 8 * 1024 * 1024) {
      setError('File too large. Maximum size is 8MB.');
      return;
    }
    setError('');
    setFile(f);
  }, []);

  async function processResume() {
    if (!file || !user) return;
    setProcessing(true);
    setError('');
    try {
      setStageIdx(0);
      const rawText = await extractResumeText(file);
      if (!rawText || rawText.trim().length < 30) {
        throw new Error('Could not extract meaningful text from this file. Try a different resume file.');
      }
      setStageIdx(1);
      await new Promise((r) => setTimeout(r, 400));
      setStageIdx(2);

      let fileUrl: string | undefined;
      try {
        const base64 = await fileToBase64(file);
        const uploaded = await uploadResumeFile({ fileName: file.name, fileBase64: base64, contentType: file.type || 'application/octet-stream', user_id: user.id });
        fileUrl = uploaded.url;
      } catch (err) {
        console.warn('File storage upload failed, continuing with text-only analysis.', err);
      }

      await new Promise((r) => setTimeout(r, 400));
      setStageIdx(3);
      const resume = await uploadResumeAnalysis({ user_id: user.id, file_name: file.name, file_url: fileUrl, raw_text: rawText });
      setStageIdx(4);
      await new Promise((r) => setTimeout(r, 300));

      show('Resume analyzed successfully!', 'success');
      navigate(`/resume?id=${resume.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to process resume.';
      setError(message);
      show(message, 'error');
    } finally {
      setProcessing(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl">
        <p className="font-mono text-xs uppercase tracking-widest text-faint mb-2">Resume Module</p>
        <h1 className="font-display text-3xl text-text mb-2">Upload your resume</h1>
        <p className="text-muted mb-8">
          We'll extract your contact info, education, experience, projects, and skills — then score it against ATS best
          practices and our career knowledge base.
        </p>

        {!processing ? (
          <>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFiles(e.dataTransfer.files); }}
              onClick={() => inputRef.current?.click()}
              className={`glass rounded-3xl border-2 border-dashed p-12 text-center cursor-pointer transition-colors ${dragActive ? 'bg-white/5' : ''}`}
              style={{ borderColor: dragActive ? 'var(--color-emerald)' : 'var(--color-border)' }}
            >
              <input ref={inputRef} type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
              <UploadCloud className="h-10 w-10 mx-auto mb-4" style={{ color: 'var(--color-emerald)' }} />
              <p className="text-text font-medium mb-1">Drag & drop your resume here</p>
              <p className="text-sm text-muted">or click to browse — PDF, DOCX, or TXT (max 8MB)</p>
            </div>

            {file && (
              <div className="mt-4 glass rounded-xl p-4 flex items-center gap-3">
                <FileText className="h-5 w-5 shrink-0" style={{ color: 'var(--color-emerald)' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text truncate">{file.name}</p>
                  <p className="text-xs text-faint">{(file.size / 1024).toFixed(0)} KB</p>
                </div>
                <button onClick={() => setFile(null)} className="text-faint hover:text-text"><X className="h-4 w-4" /></button>
              </div>
            )}

            {error && (
              <div className="mt-4 flex items-start gap-2.5 text-sm rounded-xl px-4 py-3" style={{ background: 'rgba(255,111,143,0.1)', color: 'var(--color-rose)', border: '1px solid rgba(255,111,143,0.25)' }}>
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" /> {error}
              </div>
            )}

            <button
              onClick={processResume}
              disabled={!file}
              className="mt-6 w-full flex items-center justify-center gap-2 text-ink font-semibold py-3.5 rounded-xl transition-transform hover:scale-[1.01] disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(90deg, var(--color-emerald), var(--color-amber))' }}
            >
              Analyze Resume
            </button>
          </>
        ) : (
          <div className="glass rounded-3xl p-10 text-center">
            <Loader2 className="h-10 w-10 mx-auto mb-6 animate-spin" style={{ color: 'var(--color-emerald)' }} />
            <div className="space-y-2.5 max-w-xs mx-auto">
              {STAGES.map((s, i) => (
                <motion.p
                  key={s}
                  initial={{ opacity: 0.3 }}
                  animate={{ opacity: i <= stageIdx ? 1 : 0.3 }}
                  className="text-sm"
                  style={{ color: i <= stageIdx ? 'var(--color-text)' : 'var(--color-faint)' }}
                >
                  {i < stageIdx ? '✓ ' : i === stageIdx ? '→ ' : '  '}{s}
                </motion.p>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
