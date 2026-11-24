import React, { useState, useEffect, createContext, useContext } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Standalone global trigger so any non-React or helper code can also trigger toasts cleanly
type ToastListener = (toast: ToastMessage) => void;
const listeners = new Set<ToastListener>();

export const notify = (message: string, type: ToastType = 'info') => {
  const toast: ToastMessage = {
    id: `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    message,
    type,
  };
  listeners.forEach((listener) => listener(toast));
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleNewToast: ToastListener = (toast) => {
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 4500);
    };

    listeners.add(handleNewToast);
    return () => {
      listeners.delete(handleNewToast);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const showToast = (message: string, type: ToastType = 'info') => {
    notify(message, type);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Render Zone */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl shadow-2xl border text-sm backdrop-blur-md transition-all animate-in slide-in-from-top duration-300 ${
                isSuccess
                  ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-100 shadow-emerald-950/50'
                  : isError
                  ? 'bg-rose-950/90 border-rose-500/50 text-rose-100 shadow-rose-950/50'
                  : 'bg-slate-900/90 border-amber-500/50 text-slate-100 shadow-amber-950/30'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                {isError && <AlertCircle className="w-5 h-5 text-rose-400" />}
                {!isSuccess && !isError && <Info className="w-5 h-5 text-amber-400" />}
              </div>
              <div className="flex-1 font-medium leading-snug">{toast.message}</div>
              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
                aria-label="Fèmen notifikasyon"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      showToast: (message: string, type: ToastType = 'info') => notify(message, type),
    };
  }
  return context;
};
