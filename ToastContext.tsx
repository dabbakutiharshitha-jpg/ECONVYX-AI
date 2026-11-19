// Toast Notification Context

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  durationMs?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type, title, message, durationMs = 4000 }: Omit<Toast, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      setToasts((prev) => [...prev, { id, type, title, message, durationMs }]);

      if (durationMs > 0) {
        setTimeout(() => {
          removeToast(id);
        }, durationMs);
      }
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2.5 max-w-md w-full pointer-events-none">
        {toasts.map((toast) => {
          let Icon = Info;
          let borderColor = 'border-blue-200';
          let bgColor = 'bg-white';
          let iconColor = 'text-blue-500';

          if (toast.type === 'success') {
            Icon = CheckCircle2;
            borderColor = 'border-emerald-200';
            iconColor = 'text-emerald-500';
          } else if (toast.type === 'error') {
            Icon = AlertCircle;
            borderColor = 'border-rose-200';
            iconColor = 'text-rose-500';
          } else if (toast.type === 'warning') {
            Icon = AlertTriangle;
            borderColor = 'border-amber-200';
            iconColor = 'text-amber-500';
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start p-3.5 rounded-lg border shadow-elevated transition-all duration-200 ${bgColor} ${borderColor}`}
            >
              <Icon className={`w-5 h-5 mr-3 shrink-0 mt-0.5 ${iconColor}`} />
              <div className="flex-1 mr-2">
                <div className="text-sm font-semibold text-brand-primary-navy">{toast.title}</div>
                {toast.message && <div className="text-xs text-slate-600 mt-0.5">{toast.message}</div>}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-600 p-1"
                aria-label="Close notification"
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
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
