import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';

/**
 * Live validation for a form whose values live in component state.
 *
 * Errors show once a field has been left (or after a submit attempt), then update
 * on every keystroke. A field turns green as soon as it holds a valid value.
 * Errors returned by the server (Laravel's 422 `errors`) show on the matching
 * field until that field is edited.
 *
 *   const v = useLiveValidation({ email, password }, { email: [required(), email()] });
 *   <input {...v.bind('email')} className={`... ${v.stateClass('email')}`} />
 *   <FieldMessage {...v.message('email')} />
 *   onSubmit: if (!v.validateAll()) return;
 */

export const FIELD_ERROR_CLASS = 'border-red-400! dark:border-red-400/80! focus:border-red-500! bg-red-50/40! dark:bg-red-500/5!';
export const FIELD_VALID_CLASS = 'border-emerald-400! dark:border-emerald-400/70!';

const hasValue = (value) => value !== undefined && value !== null && String(value).trim() !== '';

export function useLiveValidation(values, rules, { fieldMap = {} } = {}) {
  const formId = useId();
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState({});
  const previous = useRef(values);

  const errors = useMemo(() => {
    const out = {};
    for (const [name, fieldRules] of Object.entries(rules)) {
      for (const rule of fieldRules.filter(Boolean)) {
        const message = rule(values[name], values);
        if (message) {
          out[name] = message;
          break;
        }
      }
    }
    return out;
    // Rules are declared inline, so values are what changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(values)]);

  // A server error belongs to the value it was about: drop it once that value changes.
  useEffect(() => {
    const changed = Object.keys(values).filter((k) => values[k] !== previous.current[k]);
    previous.current = values;
    if (changed.length && Object.keys(serverErrors).some((k) => changed.includes(k))) {
      setServerErrors((current) => {
        const next = { ...current };
        changed.forEach((k) => delete next[k]);
        return next;
      });
    }
  }, [values, serverErrors]);

  const idFor = (name) => `${formId}-${name}`;

  const error = useCallback(
    (name) => serverErrors[name] || ((touched[name] || submitted) ? errors[name] : null) || null,
    [serverErrors, touched, submitted, errors]
  );

  const isValid = useCallback(
    (name) => !errors[name] && !serverErrors[name] && hasValue(values[name]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [errors, serverErrors, JSON.stringify(values)]
  );

  const stateClass = (name) => (error(name) ? FIELD_ERROR_CLASS : isValid(name) ? FIELD_VALID_CLASS : '');

  const bind = (name) => ({
    id: idFor(name),
    name,
    'data-field': name,
    'aria-invalid': error(name) ? true : undefined,
    'aria-describedby': `${idFor(name)}-message`,
    onBlur: () => setTouched((t) => (t[name] ? t : { ...t, [name]: true })),
  });

  const message = (name, hint) => ({ id: `${idFor(name)}-message`, error: error(name), hint });

  /** Show every error; focus the first invalid field. Returns true when the form is valid. */
  const validateAll = () => {
    setSubmitted(true);
    const firstInvalid = Object.keys(rules).find((name) => errors[name]) || Object.keys(serverErrors)[0];
    if (firstInvalid) {
      requestAnimationFrame(() => {
        const el = document.getElementById(idFor(firstInvalid));
        el?.focus({ preventScroll: true });
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      return false;
    }
    return true;
  };

  /** Show errors from a Laravel 422 response on their fields. Returns true if any matched. */
  const applyServerErrors = (serverErrorBag) => {
    if (!serverErrorBag || typeof serverErrorBag !== 'object') return false;
    const mapped = {};
    for (const [key, messages] of Object.entries(serverErrorBag)) {
      const field = fieldMap[key] || key;
      if (field in rules || field in values) mapped[field] = Array.isArray(messages) ? messages[0] : String(messages);
    }
    setServerErrors(mapped);
    return Object.keys(mapped).length > 0;
  };

  const reset = () => {
    setTouched({});
    setSubmitted(false);
    setServerErrors({});
  };

  const formValid = Object.keys(errors).length === 0;

  return { bind, message, stateClass, error, isValid, validateAll, applyServerErrors, reset, formValid, idFor };
}
