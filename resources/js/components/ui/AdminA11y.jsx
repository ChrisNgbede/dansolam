import { useEffect } from 'react';

/**
 * Accessible names across the admin without editing every screen:
 *  - form fields with no label get one from the visible label beside them (or the
 *    placeholder), so screen readers announce what each field is for;
 *  - icon-only buttons and links get a name from their tooltip or their icon.
 * Existing names are never changed. Runs on admin pages and admin modals.
 */

const FIELDS = 'input:not([type="hidden"]):not([type="submit"]):not([type="button"]), select, textarea';
const CONTROLS = 'button, a[href], [role="button"]';

const ICON_NAMES = {
  pencil: 'Edit', 'square-pen': 'Edit', 'pen-line': 'Edit', edit: 'Edit', 'file-pen-line': 'Edit',
  trash: 'Delete', 'trash-2': 'Delete', x: 'Close', 'circle-x': 'Close',
  eye: 'View', 'external-link': 'Open in new tab', download: 'Download', upload: 'Upload',
  copy: 'Duplicate', plus: 'Add', minus: 'Remove', 'chevron-left': 'Previous', 'chevron-right': 'Next',
  'chevron-down': 'Expand', 'chevron-up': 'Collapse', 'refresh-cw': 'Refresh', 'rotate-cw': 'Refresh',
  'message-circle': 'Message on WhatsApp', mail: 'Email', printer: 'Print', search: 'Search',
  star: 'Toggle featured', zap: 'Toggle flash sale', barcode: 'Print barcode', 'scan-barcode': 'Print barcode',
  'more-vertical': 'More actions', 'ellipsis-vertical': 'More actions', send: 'Send', check: 'Confirm',
  'toggle-left': 'Turn on', 'toggle-right': 'Turn off', 'grip-vertical': 'Drag to reorder', link: 'Copy link',
};

const text = (el) => (el?.textContent || '').replace(/\s+/g, ' ').trim();

function hasName(el) {
  if (el.getAttribute('aria-label')?.trim() || el.getAttribute('aria-labelledby') || el.getAttribute('title')?.trim()) return true;
  if (el.labels && el.labels.length && [...el.labels].some((l) => text(l))) return true;
  return false;
}

function labelFor(field) {
  // A label element just before the field, or just before its wrapper.
  const candidates = [field.previousElementSibling, field.parentElement?.previousElementSibling, field.parentElement?.parentElement?.firstElementChild];
  for (const c of candidates) {
    if (c && c !== field && /^(LABEL|SPAN|P)$/.test(c.tagName) && text(c) && text(c).length <= 80) return text(c).replace(/\s*\*$/, '');
  }
  const wrapLabel = field.closest('div')?.querySelector(':scope > label');
  if (wrapLabel && text(wrapLabel)) return text(wrapLabel).replace(/\s*\*$/, '');
  if (field.placeholder) return field.placeholder;
  if (field.type === 'checkbox' && field.closest('th')) return 'Select all rows';
  if (field.type === 'checkbox' && field.closest('tr')) return 'Select row';
  if (field.type === 'file') return 'Choose file to upload';
  return null;
}

function nameControl(el) {
  if (hasName(el) || text(el)) return;
  const svg = el.querySelector('svg[class*="lucide-"]');
  // An icon can carry several names (lucide-trash2 lucide-trash-2); use the first we know.
  const icon = svg && [...svg.classList].map((c) => (c.startsWith('lucide-') ? c.slice(7) : null)).find((c) => c && ICON_NAMES[c]);
  const name = el.dataset.tooltip || (icon && ICON_NAMES[icon]) || (el.querySelector('img[alt]')?.alt) || null;
  if (name) el.setAttribute('aria-label', name);
}

function nameField(el) {
  if (hasName(el) || el.closest('label')) return;
  const name = labelFor(el);
  if (name) el.setAttribute('aria-label', name);
}

function scan(root) {
  root.querySelectorAll?.(FIELDS).forEach(nameField);
  root.querySelectorAll?.(CONTROLS).forEach(nameControl);
}

export default function AdminA11y() {
  useEffect(() => {
    let frame = 0;
    const run = () => { frame = 0; scan(document.body); };
    run();
    const observer = new MutationObserver(() => { if (!frame) frame = requestAnimationFrame(run); });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => { observer.disconnect(); if (frame) cancelAnimationFrame(frame); };
  }, []);
  return null;
}
