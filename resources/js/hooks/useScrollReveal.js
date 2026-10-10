import { useEffect } from 'react';

const TARGETS = 'main section, main [data-reveal], main .reveal-group > *';

/**
 * Reveals page sections as they scroll into view.
 *
 * Scans on every route change and keeps watching <main> for content that
 * renders later (e.g. sections that wait on an API call). Each element is
 * unobserved as soon as it has appeared, so scrolling stays cheap.
 * Honours prefers-reduced-motion by leaving the content visible and untouched.
 *
 * @param {string} routeKey re-runs the scan whenever the route changes
 */
export default function useScrollReveal(routeKey) {
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || !('IntersectionObserver' in window)) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -5% 0px' }
    );

    const scan = () => {
      document.querySelectorAll(TARGETS).forEach((el) => {
        if (el.dataset.revealed) return;
        el.dataset.revealed = '1';
        // Anything already on screen is left alone — no first-paint flicker.
        if (el.getBoundingClientRect().top >= window.innerHeight) {
          el.classList.add('reveal');
          observer.observe(el);
        }
      });
    };

    scan();

    // Batch DOM changes into one scan per frame.
    let frame = 0;
    const main = document.querySelector('main');
    const mutations = main
      ? new MutationObserver(() => {
          if (frame) return;
          frame = requestAnimationFrame(() => {
            frame = 0;
            scan();
          });
        })
      : null;
    mutations?.observe(main, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutations?.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [routeKey]);
}
