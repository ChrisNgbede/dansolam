import { useEffect, useState } from 'react';

/**
 * Simple loading feedback for anything the user sets off, across admin and storefront:
 *
 *  - a thin progress bar along the top while a request or page that followed a click,
 *    key press, form submit or navigation is still loading;
 *  - the button that started it is marked busy (small spinner, no double clicks).
 *
 * Only requests that start shortly after a user action count, so background polling
 * (notifications, POS refresh, chat) never flashes the bar. Buttons that already show
 * their own spinner keep it and get no second one.
 */

const USER_WINDOW_MS = 1500; // a request this soon after an action belongs to it
const BUTTON_WINDOW_MS = 600; // ...and to the button pressed just before it
const SHOW_DELAY_MS = 150; // quick responses never flash the bar

const listeners = new Set();
let pending = 0;
let routeLoads = 0;
let lastAction = 0;
let lastButton = null;
let lastButtonAt = 0;

const notify = () => listeners.forEach((fn) => fn(pending + routeLoads));

const isOwnSpinner = (button) => !!button.querySelector('.animate-spin, .page-spinner');

/** Wraps one user-started request: counts it and marks its button busy until it settles. */
function track() {
  const now = Date.now();
  if (now - lastAction > USER_WINDOW_MS) return () => {};

  pending += 1;
  notify();

  const button = lastButton && now - lastButtonAt <= BUTTON_WINDOW_MS && lastButton.isConnected ? lastButton : null;
  if (button) {
    button.__busyCount = (button.__busyCount || 0) + 1;
    if (!isOwnSpinner(button)) {
      button.setAttribute('data-busy', button.textContent.trim() ? 'text' : 'icon');
      button.setAttribute('aria-busy', 'true');
    }
  }

  let done = false;
  return () => {
    if (done) return;
    done = true;
    pending = Math.max(0, pending - 1);
    notify();
    if (button && --button.__busyCount <= 0) {
      button.removeAttribute('data-busy');
      button.removeAttribute('aria-busy');
    }
  };
}

let installed = false;
function install() {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  const markAction = (event) => {
    lastAction = Date.now();
    const target = event?.target instanceof Element ? event.target : null;
    const button = event?.type === 'submit'
      ? event.submitter || event.target.querySelector?.('[type="submit"]')
      : target?.closest('button, [role="button"], input[type="submit"]');
    if (button && !button.disabled) {
      lastButton = button;
      lastButtonAt = lastAction;
    }
  };
  window.addEventListener('pointerdown', markAction, true);
  window.addEventListener('submit', markAction, true);
  window.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') markAction(e); }, true);
  window.addEventListener('input', () => { lastAction = Date.now(); }, true); // search-as-you-type
  window.addEventListener('popstate', () => { lastAction = Date.now(); });

  // Navigations started in code (redirects after a save) count as user actions too.
  for (const method of ['pushState', 'replaceState']) {
    const original = history[method];
    history[method] = function (...args) {
      lastAction = Date.now();
      return original.apply(this, args);
    };
  }

  const originalFetch = window.fetch.bind(window);
  window.fetch = (...args) => {
    const finish = track();
    return originalFetch(...args).finally(finish);
  };

  // axios and other XHR users.
  const originalSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function (...args) {
    const finish = track();
    this.addEventListener('loadend', finish, { once: true });
    return originalSend.apply(this, args);
  };
}

/** Lazily loaded pages call this while their code is downloading. */
export function useRouteLoading() {
  useEffect(() => {
    routeLoads += 1;
    notify();
    return () => {
      routeLoads = Math.max(0, routeLoads - 1);
      notify();
    };
  }, []);
}

export default function ActivityIndicator() {
  const [active, setActive] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    install();
    const onChange = (count) => setActive(count > 0);
    listeners.add(onChange);
    onChange(pending + routeLoads);
    return () => listeners.delete(onChange);
  }, []);

  // Delay showing (no flash on fast responses); fade out briefly when done.
  useEffect(() => {
    if (active) {
      const t = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setVisible(false), 250);
    return () => clearTimeout(t);
  }, [active]);

  if (!visible) return null;

  return (
    <div
      className={`activity-bar ${active ? 'is-active' : 'is-done'}`}
      role="progressbar"
      aria-label="Loading"
      aria-busy={active}
    >
      <span />
    </div>
  );
}
