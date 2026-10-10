// Stored uploads have a 480px sibling ("<name>-480.webp", see App\Services\ImageOptimizer).
const STORED_WEBP = /\/storage\/.+(?<!-480)\.webp$/i;

/**
 * Props for an <img> that lets the browser pick the small variant for card-sized slots.
 * Falls back to the original if the small file is missing.
 *
 * @param {string} url   original image URL
 * @param {string} sizes CSS sizes hint for the slot the image fills
 */
export function responsiveImageProps(url, sizes = '(min-width: 1024px) 25vw, 50vw') {
  if (!url || !STORED_WEBP.test(url)) return { src: url };
  const small = url.replace(/\.webp$/i, '-480.webp');
  return {
    src: url,
    srcSet: `${small} 480w, ${url} 1600w`,
    sizes,
    onError: (e) => {
      if (e.currentTarget.hasAttribute('srcset')) e.currentTarget.removeAttribute('srcset');
    },
  };
}
