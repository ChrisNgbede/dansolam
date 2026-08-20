import { useEffect } from 'react';

/**
 * Reveals page sections as they scroll into view.
 *
 * Runs once per route: every direct section of the page gets the `.reveal`
 * class and is unobserved as soon as it has appeared, so scrolling stays cheap.
 * Honours prefers-reduced-motion by leaving the content visible and untouched.
 *
 * @param {string} routeKey re-runs the scan whenever the route changes
 */
export default function useScrollReveal(routeKey) {
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || !('IntersectionObserver' in window)) return undefined;

    const targets = document.querySelectorAll(
      'main section, main [data-reveal], main .reveal-group > *'
    );
    if (!targets.length) return undefined;

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

    targets.forEach((el) => {
      // Anything already on screen at mount stays visible — no first-paint flicker.
      if (el.getBoundingClientRect().top < window.innerHeight) {
        el.classList.add('reveal', 'is-visible');
      } else {
        el.classList.add('reveal');
        observer.observe(el);
      }
    });

    return () => observer.disconnect();
  }, [routeKey]);
}
