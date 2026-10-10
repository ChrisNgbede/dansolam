/**
 * Field rules for live form validation. Each rule takes (value, allValues) and
 * returns an error message, or null when the value passes. Rules other than
 * `required` let empty values through, so optional fields stay optional.
 */

const isEmpty = (value) => value === undefined || value === null || String(value).trim() === '';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const required = (message = 'This field is required.') => (value) =>
  isEmpty(value) ? message : null;

export const email = (message = 'Enter a valid email address, like name@example.com.') => (value) =>
  isEmpty(value) || EMAIL_RE.test(String(value).trim()) ? null : message;

export const minLength = (min, message) => (value) =>
  isEmpty(value) || String(value).trim().length >= min ? null : message || `Use at least ${min} characters.`;

export const maxLength = (max, message) => (value) =>
  isEmpty(value) || String(value).length <= max ? null : message || `Keep this under ${max} characters.`;

export const matches = (field, message = 'This does not match.') => (value, values) =>
  isEmpty(value) || value === values[field] ? null : message;

export const digits = (count, message) => (value) =>
  isEmpty(value) || new RegExp(`^\\d{${count}}$`).test(String(value).trim()) ? null : message || `Enter the ${count}-digit code.`;

// Allows +, spaces, brackets and dashes; needs 7 to 15 digits in total.
export const phone = (message = 'Enter a valid phone number, including the area or country code.') => (value) => {
  if (isEmpty(value)) return null;
  const text = String(value).trim();
  const count = text.replace(/\D/g, '').length;
  return /^\+?[\d\s()\-.]+$/.test(text) && count >= 7 && count <= 15 ? null : message;
};

export const fullName = (message = 'Enter your first and last name.') => (value) =>
  isEmpty(value) || String(value).trim().split(/\s+/).length >= 2 ? null : message;

export const numberBetween = (min, max, message) => (value) => {
  if (isEmpty(value)) return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= min && n <= max ? null : message || `Enter a number from ${min} to ${max}.`;
};

export const notInPast = (message = 'Choose today or a later date.') => (value) => {
  if (isEmpty(value)) return null;
  const today = new Date();
  const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return String(value) >= iso ? null : message;
};

/** Password strength from 0 (empty) to 4 (strong), with the checks behind it. */
export function passwordStrength(value = '') {
  const checks = [
    { key: 'length', label: 'At least 8 characters', met: value.length >= 8 },
    { key: 'case', label: 'Upper and lower case letters', met: /[a-z]/.test(value) && /[A-Z]/.test(value) },
    { key: 'number', label: 'A number', met: /\d/.test(value) },
    { key: 'symbol', label: 'A symbol, like ! or #', met: /[^A-Za-z0-9]/.test(value) },
  ];
  const score = value ? Math.max(1, checks.filter((c) => c.met).length) : 0;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  return { score, label: labels[score], checks };
}

export const url = (message = 'Enter a full link starting with https://') => (value) => {
  if (isEmpty(value)) return null;
  try {
    const parsed = new URL(String(value).trim());
    return ['http:', 'https:'].includes(parsed.protocol) ? null : message;
  } catch {
    return message;
  }
};
