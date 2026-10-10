import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

const listeners = new Set();
let nextToastId = 1;
let lastToastTime = 0;
let lastToastMessage = '';
// An automatic toast (from a successful admin API call) is replaced when the page
// raises its own, more specific message moments later — so only one is shown.
let lastAuto = { id: null, at: 0 };
const AUTO_REPLACE_WINDOW = 2000;

const DEFAULT_TITLES = { success: 'Done', error: 'Something went wrong', info: 'Heads up' };

const publish = (type, message, options = {}) => {
  const text = String(message || (type === 'error' ? 'Something went wrong.' : 'Action completed.'));
  const now = Date.now();
  if (text === lastToastMessage && now - lastToastTime < 1500) {
    return nextToastId; // Discard rapid duplicate
  }

  // Replace the generic auto toast with the page's own wording.
  if (!options.auto && type === 'success' && lastAuto.id && now - lastAuto.at < AUTO_REPLACE_WINDOW) {
    const replacement = { id: lastAuto.id, type, message: text, title: options.title, replace: true };
    lastToastMessage = text;
    lastToastTime = now;
    listeners.forEach((listener) => listener(replacement));
    return lastAuto.id;
  }

  lastToastMessage = text;
  lastToastTime = now;

  const item = {
    id: nextToastId++,
    type,
    message: text,
    title: options.title || DEFAULT_TITLES[type],
    // Errors stay long enough to be read and acted on.
    duration: options.duration ?? (type === 'error' ? 7000 : 4500),
  };
  if (options.auto) lastAuto = { id: item.id, at: now };
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
      if (item.replace) {
        setItems((current) => current.map((existing) => (existing.id === item.id ? { ...existing, ...item } : existing)));
        return;
      }
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
      <div className="fixed top-5 right-4 md:right-6 z-[200] flex w-[min(28rem,calc(100vw-2rem))] flex-col gap-2.5 pointer-events-none" aria-live="polite" aria-atomic="false">
        {items.map((item) => {
          const Icon = item.type === 'success' ? CheckCircle2 : item.type === 'error' ? AlertCircle : Info;
          const colors = item.type === 'success'
            ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
            : item.type === 'error'
              ? 'border-rose-300 bg-rose-50 text-rose-900'
              : 'border-amber-300 bg-amber-50 text-amber-900';
          const iconColor = item.type === 'success' ? 'text-emerald-600' : item.type === 'error' ? 'text-rose-600' : 'text-amber-600';
          return (
            <div
              key={item.id}
              role={item.type === 'error' ? 'alert' : 'status'}
              className={`pointer-events-auto flex items-start gap-3.5 rounded-2xl border-2 px-5 py-4 shadow-2xl animate-scale-up ${colors}`}
            >
              <Icon className={`mt-0.5 h-6 w-6 shrink-0 ${iconColor}`} />
              <div className="min-w-0 flex-1">
                {item.title && <p className="text-sm font-extrabold leading-tight">{item.title}</p>}
                <p className="min-w-0 text-[13px] font-medium leading-snug mt-0.5">{item.message}</p>
              </div>
              <button type="button" onClick={() => dismiss(item.id)} className="-mr-1 rounded-full p-1.5 opacity-60 transition-opacity hover:opacity-100 cursor-pointer" aria-label="Dismiss notification">
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
