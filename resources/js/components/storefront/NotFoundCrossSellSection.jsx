import React from 'react';
import { useCardQuickView } from './QuickViewProvider';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MessageCircle, ArrowRight, Plus } from 'lucide-react';
import { getCurrencySymbol } from '../../utils/currency';
import { useCartStore } from '../../store/cartStore';

/** Cross-sell tile: clicking the card opens Quick View. */
function CrossSellCard({ product, className, children }) {
  const cardQuickView = useCardQuickView(product);
  return <div {...cardQuickView} className={className}>{children}</div>;
}

export default function NotFoundCrossSellSection() {
  const currencySymbol = getCurrencySymbol();
  const addItem = useCartStore((state) => state.addItem);

  // Fetch settings for WhatsApp contact
  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: () => fetch('/api/settings').then(res => res.json())
  });

  // Fetch featured / bestseller products for cross selling
  const { data: productsRes } = useQuery({
    queryKey: ['cross-sell-bestsellers'],
    queryFn: () => fetch('/api/products?featured=1&limit=4').then(res => res.json())
  });

  const settings = settingsData?.data?.settings || {};
  const whatsappNumber = settings.whatsapp_number || '2348033105473';

  const apiProducts = productsRes?.data?.data || [];
  const crossSellList = apiProducts.slice(0, 4);

  const handleQuickAdd = (e, product) => {
    e.preventDefault();
    e.stopPropagation();

    addItem(product, 1);

    if (typeof window !== 'undefined') {
      const rect = e.currentTarget.getBoundingClientRect();
      window.dispatchEvent(
        new CustomEvent('animate-to-cart', {
          detail: {
            startX: rect.left + rect.width / 2,
            startY: rect.top + rect.height / 2,
            startEl: e.currentTarget,
            action: 'add'
          }
        })
      );
    }
  };

  const whatsappMessage = encodeURIComponent(
    `Hello Dansolam Beauty Home, I'm browsing your online store and need personalized recommendations for my skin routine.`
  );

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-[#F3EBF7] to-[#EFE5F5] dark:from-[#1E1528] dark:via-[#261738] dark:to-[#2B183E] pt-16 pb-20 px-4 sm:px-6 md:px-12 text-left">
      {/* Background Soft Ambient Light Blooms */}
      <div className="absolute top-1/3 -left-32 w-80 h-80 bg-[#5D3E85]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -right-32 w-96 h-96 bg-[#EC268F]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto flex flex-col gap-14 relative z-10">

        {/* 1. WARM "NOT FOUND WHAT YOU'RE LOOKING FOR" HERO CTA BANNER */}
        <div className="relative rounded-[32px] sm:rounded-[40px] overflow-hidden bg-gradient-to-r from-[#5D3E85] via-[#4A2B68] to-[#3E2460] border border-[#EADBEE]/30 dark:border-white/15 p-8 sm:p-12 md:p-14 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(#E5C158_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

          <div className="flex flex-col gap-3.5 max-w-2xl text-left">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold  tracking-widest text-[#E5C158] bg-[#E5C158]/10 border border-[#E5C158]/30 px-3.5 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
                Let's Chat
              </span>
            </div>

            <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Haven't found what you're looking for?
            </h3>

            <p className="text-xs sm:text-sm text-[#C9BED4] font-medium leading-relaxed max-w-xl">
              Chat with our team and we'll help you find the right product for your skin.
            </p>
          </div>

          {/* CTA Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full lg:w-auto shrink-0">
            <a
              href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-extrabold tracking-wider rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 btn-spring cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Chat Us</span>
            </a>

            <Link
              to="/shop"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 text-xs font-extrabold tracking-wider rounded-full shadow-md transition-all hover:scale-105 active:scale-95 btn-spring"
            >
              <span>Explore Catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* 2. CROSS-SELLING SECTION (RECOMMENDED BESTSELLERS) */}
        {crossSellList.length > 0 && (
        <div className="flex flex-col gap-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex flex-col gap-2">
              <span className="inline-flex items-center px-3.5 py-1 rounded-full bg-white dark:bg-[#1E1528] text-[#5D3E85] dark:text-[#EC268F] text-[10px] sm:text-[11px] font-extrabold tracking-widest  border border-[#EADBEE] dark:border-white/10 shadow-xs self-start">
                Recommended For You
              </span>
              <h4 className="text-2xl sm:text-3xl font-extrabold text-[#221B2B] dark:text-[#F3EFF6] tracking-tight">
                Popular Products
              </h4>
            </div>

            <Link
              to="/shop"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#EC268F] hover:text-[#C9166F] transition-colors group"
            >
              <span>View full catalogue</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* 4-Column Product Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {crossSellList.map((product) => {
              const rawImg = product.images?.[0]?.image_url || product.image_url || product.featured_image || product.image || (product.images && product.images[0]?.url);
              const imgUrl = (rawImg && typeof rawImg === 'string' && rawImg.trim().length > 3)
                ? (rawImg.startsWith('http') || rawImg.startsWith('/') ? rawImg.trim() : `/${rawImg.trim()}`)
                : '/images/placeholder-product.svg';
              const badgeText = product.badge || (product.is_featured ? 'FEATURED' : null);
              const categoryName = product.category?.name || product.category_name || 'SKINCARE';
              const price = product.price || 0;
              const originalPrice = product.compare_at_price || product.was || null;

              return (
                <CrossSellCard
                  key={product.id || product.slug}
                  product={product}
                  className="bg-white dark:bg-[#1F1729] border border-[#EADBEE] dark:border-white/10 rounded-[24px] sm:rounded-[28px] overflow-hidden flex flex-col group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 relative text-left"
                >
                  {/* Image Container */}
                  <Link
                    to={product.slug ? `/products/${product.slug}` : '/shop'}
                    className="aspect-square w-full bg-gray-100 dark:bg-white/5 relative overflow-hidden block"
                  >
                    <img
                      src={imgUrl}
                      alt={product.name}
                      loading="lazy"
                      width="400"
                      height="400"
                      decoding="async"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/images/placeholder-product.svg';
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Badge Pill */}
                    {badgeText && (
                      <span className="absolute top-3 left-3 bg-[#17101F]/80 backdrop-blur-md border border-white/15 text-[8px] sm:text-[9px] font-extrabold  tracking-wider text-white px-2.5 py-1 rounded-full">
                        {badgeText}
                      </span>
                    )}
                  </Link>

                  {/* Card Details */}
                  <div className="p-4 sm:p-5 flex flex-col justify-between flex-1 gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] sm:text-[10px] font-extrabold tracking-wider  text-gray-400 dark:text-[#9B8EA9]">
                        {categoryName}
                      </span>
                      <Link
                        to={product.slug ? `/products/${product.slug}` : '/shop'}
                        className="text-xs sm:text-sm font-bold text-[#221B2B] dark:text-[#F3EFF6] group-hover:text-[#EC268F] transition-colors line-clamp-1 leading-snug"
                      >
                        {product.name}
                      </Link>

                      {/* Maximum 2-liner short description below product name */}
                      <p className="text-[10px] sm:text-[11px] text-gray-500 dark:text-[#C9BED4] line-clamp-2 leading-relaxed font-medium mt-0.5">
                        {product.short_description
                          || (product.description ? product.description.replace(/<[^>]*>?/gm, '').trim() : '')}
                      </p>
                    </div>

                    {/* Price & Quick Add Button */}
                    <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-white/8">
                      <div className="flex flex-col">
                        <span className="text-xs sm:text-sm font-extrabold text-[#221B2B] dark:text-[#F3EFF6]">
                          {currencySymbol}{Number(price).toLocaleString()}
                        </span>
                        {originalPrice && Number(originalPrice) > Number(price) && (
                          <span className="text-[10px] text-gray-400 line-through">
                            {currencySymbol}{Number(originalPrice).toLocaleString()}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleQuickAdd(e, product)}
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#EC268F] hover:bg-[#C9166F] text-white flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all cursor-pointer btn-spring"
                        title="Add to Bag"
                        aria-label={`Add ${product.name} to bag`}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </CrossSellCard>
              );
            })}
          </div>
        </div>
        )}

      </div>
    </section>
  );
}
