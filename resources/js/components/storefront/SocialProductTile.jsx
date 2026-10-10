import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Eye, Plus, Check, Star } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useWishlistStore } from '../../store/wishlistStore';
import { formatProductName } from '../../utils/productDisplay';
import { responsiveImageProps } from '../../utils/responsiveImage';
import { useCardQuickView, useQuickView } from './QuickViewProvider';

const PLACEHOLDER = '/images/placeholder-product.svg';

/**
 * Product tile for the homepage "Viewed on Instagram" row: product on a light
 * tint, caption on a white card below, add-to-bag as the primary action.
 */
export default function SocialProductTile({ product, onQuickView }) {
  const addItem = useCartStore((s) => s.addItem);
  const currencySymbol = useCartStore((s) => s.currencySymbol) || '£';
  // Tiles always show pence so a row of prices lines up (£82.00 beside £55.99).
  const formatPrice = (value) => currencySymbol + Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const toggleWishlist = useWishlistStore((s) => s.toggleItem);
  const isWishlisted = useWishlistStore((s) => s.items.some((item) => item?.id === product?.id));
  const [added, setAdded] = useState(false);
  const { openQuickView } = useQuickView();
  const openQuick = onQuickView || openQuickView;
  const cardQuickView = useCardQuickView(product, { onOpen: openQuick });

  const { name, subline, size, badge } = formatProductName(product?.name);
  const image = product?.images?.[0]?.image_url || product?.image_url || PLACEHOLDER;
  const price = parseFloat(product?.sale_price || product?.price || 0);
  const originalPrice = product?.sale_price ? parseFloat(product?.price) : null;
  const rating = parseFloat(product?.average_rating ?? product?.reviews_avg_rating ?? 0);
  const reviewCount = parseInt(product?.reviews_count ?? 0, 10);
  const productUrl = `/product/${product?.slug || product?.id}`;
  const altText = [name, size].filter(Boolean).join(', ');

  const handleAdd = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    window.dispatchEvent(new CustomEvent('animate-to-cart', {
      detail: { startX: rect.left + rect.width / 2, startY: rect.top + rect.height / 2, imageUrl: image },
    }));
    addItem(product, product?.variants?.[0] || null, 1, true);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  return (
    <article
      {...cardQuickView}
      className="group relative flex flex-col h-full rounded-[22px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EC268F] focus-visible:ring-offset-2 bg-white dark:bg-[#1F1729] border border-[#EADBEE] dark:border-white/10 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden text-left">
      {/* Image: one consistent treatment — product contained on a light tint */}
      <div className="relative aspect-square bg-[#F8EEF6] dark:bg-[#2A2035]">
        <Link to={productUrl} tabIndex={-1} aria-hidden="true" className="absolute inset-0 p-[12%]">
          <img
            {...responsiveImageProps(image, '(min-width: 1536px) 16vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw')}
            alt={altText}
            loading="lazy"
            decoding="async"
            width={400}
            height={400}
            onError={(e) => {
              const img = e.currentTarget;
              if (img.hasAttribute('srcset')) { img.removeAttribute('srcset'); return; }
              img.onerror = null;
              img.src = PLACEHOLDER;
            }}
            className="w-full h-full object-contain rounded-xl mix-blend-multiply dark:mix-blend-normal transition-transform duration-500 ease-out group-hover:scale-105"
          />
        </Link>

        {badge && (
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[#5D3E85] text-white text-[11px] font-bold tracking-wide shadow-sm">
            {badge}
          </span>
        )}

        <button
          type="button"
          onClick={() => toggleWishlist(product)}
          aria-label={isWishlisted ? `Remove ${name} from wishlist` : `Save ${name} to wishlist`}
          aria-pressed={isWishlisted}
          className="absolute top-2 right-2 w-11 h-11 grid place-items-center rounded-full bg-white/95 dark:bg-[#17101F]/90 shadow-sm text-[#5D3E85] dark:text-[#F3EFF6] hover:text-[#C9166F] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EC268F] cursor-pointer"
        >
          <Heart className={`w-[18px] h-[18px] ${isWishlisted ? 'fill-[#C9166F] text-[#C9166F]' : ''}`} />
        </button>

        {(
          <button
            type="button"
            onClick={() => openQuick(product)}
            aria-label={`Quick view ${name}`}
            className="absolute bottom-2 right-2 h-11 px-3.5 inline-flex items-center gap-1.5 rounded-full bg-white/95 dark:bg-[#17101F]/90 shadow-sm text-[13px] font-semibold text-[#221B2B] dark:text-[#F3EFF6] opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 focus-visible:opacity-100 focus-visible:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EC268F] transition-all duration-300 cursor-pointer"
          >
            <Eye className="w-4 h-4" aria-hidden="true" />
            <span>Quick view</span>
          </button>
        )}
      </div>

      {/* Caption */}
      <div className="flex flex-col gap-1 p-4 flex-1">
        <Link
          to={productUrl}
          className="text-[15px] leading-snug font-semibold text-[#4A2B68] dark:text-[#F3EFF6] hover:text-[#C9166F] dark:hover:text-[#F9B8DA] transition-colors focus-visible:outline-none focus-visible:underline"
        >
          {name}
        </Link>
        {subline && <p className="text-[12px] leading-snug text-[#5C5566] dark:text-[#C9BED4]">{subline}</p>}
        {size && <p className="text-[12px] text-[#6B6274] dark:text-[#B3A7BF]">{size}</p>}

        {rating > 0 && (
          <div className="flex items-center gap-1 mt-0.5" aria-label={`Rated ${rating.toFixed(1)} out of 5`}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} aria-hidden="true" className={`w-3.5 h-3.5 ${i <= Math.round(rating) ? 'fill-[#E5A93D] text-[#E5A93D]' : 'text-[#D8CFDC]'}`} />
            ))}
            {reviewCount > 0 && <span className="text-[12px] text-[#6B6274] dark:text-[#B3A7BF] ml-0.5">({reviewCount})</span>}
          </div>
        )}

        <div className="mt-auto pt-3 flex flex-col gap-2.5">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-base font-bold text-[#221B2B] dark:text-white">{formatPrice(price)}</span>
            {originalPrice && originalPrice > price && (
              <span className="text-[12px] text-[#6B6274] dark:text-[#B3A7BF] line-through">{formatPrice(originalPrice)}</span>
            )}
          </div>
          <button
            type="button"
            onClick={handleAdd}
            aria-label={added ? `${name} added to bag` : `Add ${name} to bag`}
            className={`h-11 w-full inline-flex items-center justify-center gap-1.5 rounded-full text-[13px] font-bold text-white whitespace-nowrap shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#EC268F] cursor-pointer ${added ? 'bg-emerald-700' : 'bg-[#C9166F] hover:bg-[#221B2B]'}`}
          >
            {added ? <Check className="w-4 h-4" aria-hidden="true" /> : <Plus className="w-4 h-4" aria-hidden="true" />}
            <span>{added ? 'Added' : 'Add to bag'}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
