import { useEffect } from 'react';

/**
 * Applies one modal standard to every dialog in the app without each screen
 * having to opt in:
 *   - the panel keeps a gap from the top and bottom of the screen;
 *   - content taller than that scrolls inside the panel, not the page;
 *   - a chevron appears while there is more to scroll to;
 *   - panels holding a long form get extra width so fields aren't cramped.
 *
 * Modals are plain markup spread across many screens, so this watches the DOM
 * instead of wrapping each one.
 */

const OVERLAY = 'div[class*="fixed"][class*="inset-0"][class*="justify-center"]';
const FIELD = 'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]), select, textarea';

function scrollableArea(panel) {
  // Prefer a region the screen already scrolls; otherwise the panel itself.
  const inner = [...panel.querySelectorAll('*')].find((el) => {
    const style = getComputedStyle(el);
    return /(auto|scroll)/.test(style.overflowY) && el.scrollHeight > el.clientHeight + 4;
  });
  return inner || panel;
}

function enhance(panel) {
  if (!(panel instanceof HTMLElement)) return;
  panel.dataset.modalPanel = '';

  const area = scrollableArea(panel);
  area.dataset.modalScroll = '';

  // Long forms need room; short confirmations stay compact.
  const fields = panel.querySelectorAll(FIELD).length;
  if (fields >= 4) panel.dataset.modalWide = '';

  if (panel.querySelector('[data-modal-more]')) return;

  const more = document.createElement('div');
  more.setAttribute('data-modal-more', '');
  more.setAttribute('aria-hidden', 'true');
  more.innerHTML = '<span data-modal-more-dot><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></span>';
  more.addEventListener('click', () => area.scrollBy({ top: area.clientHeight * 0.8, behavior: 'smooth' }));
  panel.appendChild(more);

  const sync = () => {
    const remaining = area.scrollHeight - area.clientHeight - area.scrollTop;
    panel.toggleAttribute('data-modal-has-more', remaining > 24);
  };
  area.addEventListener('scroll', sync, { passive: true });
  const observer = new ResizeObserver(sync);
  observer.observe(area);
  sync();
}

export default function ModalStandard() {
  useEffect(() => {
    const scan = () => {
      document.querySelectorAll(OVERLAY).forEach((overlay) => {
        // Admin only — storefront dialogs keep their own sizing.
        if (overlay.closest('.luxury-storefront') || document.querySelector('.storefront-shell')) return;
        // The panel is the overlay's first element child that isn't the backdrop.
        const panel = [...overlay.children].find((child) => child instanceof HTMLElement && child.offsetHeight > 0);
        if (panel) enhance(panel);
      });
    };

    // With the panel scrolling internally, the page behind it shouldn't move.
    const lockBackground = () => {
      const open = document.querySelector('[data-modal-panel]');
      document.body.style.overflow = open ? 'hidden' : '';
    };

    const run = () => { scan(); lockBackground(); };
    run();
    const observer = new MutationObserver(() => window.requestAnimationFrame(run));
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      document.body.style.overflow = '';
    };
  }, []);

  return null;
}
