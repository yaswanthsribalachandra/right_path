import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface ToastItem {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContextValue {
  show: (message: string, type?: ToastItem['type']) => void;
}

const ToastContext = createContext<ToastContextValue>({ show: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const show = useCallback((message: string, type: ToastItem['type'] = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 w-[min(360px,90vw)]">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40 }}
              className="glass-strong rounded-xl p-3.5 flex items-start gap-3 shadow-2xl"
            >
              {t.type === 'success' && <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" style={{ color: 'var(--color-emerald)' }} />}
              {t.type === 'error' && <XCircle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: 'var(--color-rose)' }} />}
              {t.type === 'info' && <Info className="h-5 w-5 shrink-0 mt-0.5" style={{ color: 'var(--color-amber)' }} />}
              <p className="text-sm text-text flex-1">{t.message}</p>
              <button onClick={() => setToasts((ts) => ts.filter((x) => x.id !== t.id))} className="text-faint hover:text-text">
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
