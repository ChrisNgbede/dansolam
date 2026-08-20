import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

const listeners = new Set();
let nextToastId = 1;
let lastToastTime = 0;
let lastToastMessage = '';

const publish = (type, message, options = {}) => {
  const text = String(message || (type === 'error' ? 'Something went wrong.' : 'Action completed.'));
  const now = Date.now();
  if (text === lastToastMessage && now - lastToastTime < 1500) {
    return nextToastId; // Discard rapid duplicate
  }
  lastToastMessage = text;
  lastToastTime = now;

  const item = {
    id: nextToastId++,
    type,
    message: text,
    duration: options.duration ?? 4000,
  };
  listeners.forEach((listener) => listener(item));
  return item.id;
};

export const toast = {
  success: (message, options) => publish('success', message, options),
  error: (message, options) => publish('error', message, options),
  info: (message, options) => publish('info', message, options),
};

const ToastContext = createContext(toast);

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);

  const dismiss = useCallback((id) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  useEffect(() => {
    const listener = (item) => {
      setItems((current) => {
        // Prevent duplicate IDs or duplicate messages active at same time
        const filtered = current.filter((existing) => existing.message !== item.message);
        return [...filtered.slice(-2), item];
      });
      if (item.duration > 0) {
        window.setTimeout(() => dismiss(item.id), item.duration);
      }
    };
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, [dismiss]);

  const value = useMemo(() => toast, []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-5 right-4 md:right-6 z-[200] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2 pointer-events-none" aria-live="polite" aria-atomic="false">
        {items.map((item) => {
          const Icon = item.type === 'success' ? CheckCircle2 : item.type === 'error' ? AlertCircle : Info;
          const colors = item.type === 'success'
            ? 'border-emerald-200 bg-emerald-50/95 text-emerald-800'
            : item.type === 'error'
              ? 'border-rose-200 bg-rose-50/95 text-rose-800'
              : 'border-amber-200 bg-amber-50/95 text-amber-900';
          return (
            <div
              key={item.id}
              role={item.type === 'error' ? 'alert' : 'status'}
              className={`pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-xl backdrop-blur-xl animate-scale-up ${colors}`}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0" />
              <p className="min-w-0 flex-1 text-xs font-semibold leading-relaxed">{item.message}</p>
              <button type="button" onClick={() => dismiss(item.id)} className="-mr-1 rounded-full p-1 opacity-60 transition-opacity hover:opacity-100" aria-label="Dismiss notification">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
