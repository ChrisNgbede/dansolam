import { useEffect } from 'react';

/**
 * Shows a skeleton shimmer in the space of every image until it has loaded,
 * across admin and storefront, instead of an empty box or a placeholder graphic.
 *
 * Images whose source fails, or that fall back to the product placeholder, keep
 * a calm static skeleton rather than a broken-image icon.
 */

const PLACEHOLDER = /placeholder-product\.svg/;

function state(img) {
  if (img.dataset.noSkeleton !== undefined) return null;
  const src = img.currentSrc || img.src || '';
  if (!src || PLACEHOLDER.test(src)) return 'empty';
  if (img.complete) return img.naturalWidth > 0 ? null : 'empty';
  return 'loading';
}

function apply(img) {
  const next = state(img);
  if (next) img.setAttribute('data-skeleton', next);
  else img.removeAttribute('data-skeleton');
}

export default function ImageSkeletons() {
  useEffect(() => {
    const scan = (root = document) => root.querySelectorAll?.('img').forEach(apply);

    // load/error don't bubble, but they can be captured at the document.
    const onSettle = (event) => {
      if (event.target instanceof HTMLImageElement) apply(event.target);
    };
    document.addEventListener('load', onSettle, true);
    document.addEventListener('error', onSettle, true);

    scan();
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'attributes' && m.target instanceof HTMLImageElement) {
          apply(m.target);
          continue;
        }
        m.addedNodes.forEach((node) => {
          if (node instanceof HTMLImageElement) apply(node);
          else if (node.querySelectorAll) scan(node);
        });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'srcset'] });

    return () => {
      observer.disconnect();
      document.removeEventListener('load', onSettle, true);
      document.removeEventListener('error', onSettle, true);
    };
  }, []);

  return null;
}
