import React from 'react';
import { AlertCircle, Check } from 'lucide-react';
import { passwordStrength } from '../../utils/validators';

/** The line under a field: its live error, or a quiet hint. */
export function FieldMessage({ id, error, hint, className = '' }) {
  if (!error && !hint) return <span id={id} className="sr-only" aria-live="polite" />;

  return (
    <span
      id={id}
      aria-live="polite"
      className={`flex items-start gap-1.5 px-1 text-[11px] leading-snug ${error ? 'text-red-600 dark:text-red-400 font-semibold field-message-in' : 'text-gray-400 dark:text-[#9C90A9]'} ${className}`}
    >
      {error && <AlertCircle className="w-3.5 h-3.5 mt-px shrink-0" aria-hidden="true" />}
      <span>{error || hint}</span>
    </span>
  );
}

/** Strength bar and checklist for a new password. Guidance only: 6 characters is the minimum. */
export function PasswordStrength({ value }) {
  if (!value) return null;
  const { score, label, checks } = passwordStrength(value);
  const colours = ['bg-gray-200', 'bg-red-400', 'bg-amber-400', 'bg-lime-500', 'bg-emerald-500'];
  const text = ['', 'text-red-600 dark:text-red-400', 'text-amber-600 dark:text-amber-400', 'text-lime-700 dark:text-lime-400', 'text-emerald-600 dark:text-emerald-400'];

  return (
    <div className="flex flex-col gap-2 px-1 field-message-in" aria-live="polite">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1" aria-hidden="true">
          {[1, 2, 3, 4].map((i) => (
            <span key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i <= score ? colours[score] : 'bg-gray-200 dark:bg-white/10'}`} />
          ))}
        </div>
        <span className={`text-[11px] font-bold ${text[score]}`}>Password strength: {label}</span>
      </div>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1">
        {checks.map((c) => (
          <li key={c.key} className={`flex items-center gap-1.5 text-[11px] ${c.met ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-gray-400 dark:text-[#9C90A9]'}`}>
            {c.met ? <Check className="w-3 h-3 shrink-0" aria-hidden="true" /> : <span className="w-3 h-3 shrink-0 flex items-center justify-center" aria-hidden="true"><span className="w-1 h-1 rounded-full bg-current" /></span>}
            {c.label}
            <span className="sr-only">{c.met ? '(done)' : '(not yet)'}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default FieldMessage;
