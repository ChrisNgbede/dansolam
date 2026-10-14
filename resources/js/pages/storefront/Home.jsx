import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight, Star, Heart, Eye, Check, Truck, MessageCircle, ChevronLeft, ChevronRight, Leaf
} from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useWishlistStore } from '../../store/wishlistStore';
import { getCurrencySymbol } from '../../utils/currency';
import QuickViewModal from '../../components/storefront/QuickViewModal';
import SEO from '../../components/seo/SEO';
import FlashSaleSpotlightSection from '../../components/storefront/FlashSaleSpotlightSection';
import HeroSliderSection from '../../components/storefront/HeroSliderSection';
import FacelessAvatar from '../../components/ui/FacelessAvatar';
import { responsiveImageProps } from '../../utils/responsiveImage';
import SocialProductTile from '../../components/storefront/SocialProductTile';
import { useCardQuickView, useQuickView } from '../../components/storefront/QuickViewProvider';

const CARD_SIZES = '(min-width: 1280px) 300px, (min-width: 640px) 33vw, 50vw';

export function ProductCard({ product, onQuickView }) {
  // Clicking anywhere on the card (not a button or link) opens Quick View.
  const { openQuickView } = useQuickView();
  const openQuick = onQuickView || openQuickView;
  const cardQuickView = useCardQuickView(product, { onOpen: openQuick });
  const currencySymbol = getCurrencySymbol();
  const addItemToCart = useCartStore(state => state.addItem);
  const toggleWishlist = useWishlistStore(state => state.toggleItem);
  const wishlistItems = useWishlistStore(state => state.items);
  const [isAdded, setIsAdded] = React.useState(false);

  const DEFAULT_CARD_FALLBACK = '/images/placeholder-product.svg';
  const rawPrice = product?.sale_price || product?.price || 0;
  const numPrice = typeof rawPrice === 'number' ? rawPrice : parseFloat(rawPrice);
  const originalPrice = product?.sale_price ? (typeof product?.price === 'number' ? product?.price : parseFloat(product?.price)) : null;

  const rawImage = product?.images?.[0]?.image_url || product?.image_url || product?.image;
  const secondaryImage = product?.images?.[1]?.image_url;

  const image = (rawImage && typeof rawImage === 'string' && rawImage.trim().length > 3)
    ? (rawImage.startsWith('http') || rawImage.startsWith('/') ? rawImage.trim() : `/${rawImage.trim()}`)
    : DEFAULT_CARD_FALLBACK;

  const isWishlisted = wishlistItems.some(item => item?.id === product?.id);

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Trigger floating ball to cart header
    if (e.currentTarget) {
      const rect = e.currentTarget.getBoundingClientRect();
      window.dispatchEvent(new CustomEvent('animate-to-cart', {
        detail: {
          startX: rect.left + rect.width / 2,
          startY: rect.top + rect.height / 2,
          imageUrl: image
        }
      }));
    }

    addItemToCart(product, product?.variants?.[0] || null, 1, true);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1800);
  };

  return (
    <div
      {...cardQuickView}
      className="bg-white dark:bg-[#1F1729] rounded-[24px] border border-[#EADBEE] dark:border-white/8 shadow-xs hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EC268F] focus-visible:ring-offset-2"
    >
      {/* Product Image Section */}
      <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-[#100A16] group/img w-full">
        <Link to={`/product/${product?.slug || product?.id}`} className="block w-full h-full relative overflow-hidden">
          <img
            {...responsiveImageProps(image, CARD_SIZES)}
            alt={product?.name || 'Product'}
            loading="lazy"
            decoding="async"
            width={600}
            height={600}
            onError={(e) => {
              const img = e.currentTarget;
              // Retry without the small variant first, then fall back to the placeholder.
              if (img.hasAttribute('srcset')) { img.removeAttribute('srcset'); return; }
              img.onerror = null;
              img.src = DEFAULT_CARD_FALLBACK;
            }}
            className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500 ease-out"
          />
          {secondaryImage && (
            <img
              {...responsiveImageProps(secondaryImage, CARD_SIZES)}
              alt=""
              loading="lazy"
              decoding="async"
              width={600}
              height={600}
              className="w-full h-full object-cover absolute inset-0 opacity-0 group-hover/img:opacity-100 transition-opacity duration-500"
            />
          )}
        </Link>

        {/* Badges Container */}
        <div className="absolute top-3.5 left-3.5 flex flex-col gap-1 pointer-events-none z-10">
          {product?.badge && (
            <span className="px-2.5 py-1 bg-[#17101F]/90 text-[#E5C158] text-[10px] font-bold tracking-[0.12em]  rounded-full shadow-xs backdrop-blur-md border border-white/10">
              {product.badge}
            </span>
          )}
          {originalPrice && (
            <span className="px-2.5 py-0.5 bg-[#C9166F] text-white text-[9px] font-extrabold  tracking-wider rounded-full shadow-xs">
              Sale -{Math.round(((originalPrice - numPrice) / originalPrice) * 100)}%
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(product); }}
          className={`absolute top-3 right-3 w-8.5 h-8.5 rounded-full flex items-center justify-center transition-all duration-300 shadow-md hover:scale-110 cursor-pointer z-30 ${isWishlisted
            ? 'bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800'
            : 'bg-white/90 dark:bg-[#17101F]/80 backdrop-blur-md border border-gray-200 dark:border-white/15'
            }`}
          title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
        >
          <Heart
            className={`w-4 h-4 transition-colors ${isWishlisted
              ? 'fill-red-500 text-red-500 stroke-red-500'
              : 'text-[#181120] dark:text-[#F3EFF6] stroke-[#181120] dark:stroke-[#F3EFF6]'
              }`}
            strokeWidth={2}
          />
        </button>

        {/* Quick View Button on Hover */}
        {(
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); openQuick(product); }}
            className="absolute bottom-3 left-3 px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-[#17101F]/90 backdrop-blur-md text-[#181120] dark:text-white text-[10px] font-bold shadow-md opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center gap-1 cursor-pointer"
          >
            <Eye className="w-3 h-3" />
            <span>Quick view</span>
          </button>
        )}
      </div>

      {/* Product Details Header & Meta */}
      <div className="p-5 flex flex-col gap-3 flex-1 justify-between">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold tracking-[0.18em]  text-[#5C5566] dark:text-[#9C90A9] truncate">
            {product?.category?.name || product?.category || product?.cat || 'Dansolam'}
          </span>

          <Link to={`/product/${product?.slug || product?.id}`} className="block">
            <h4 className="text-base font-bold text-[#221B2B] dark:text-[#F3EFF6] tracking-[-0.01em] group-hover:text-[#C9166F] dark:group-hover:text-[#EC268F] transition-colors leading-[1.35] line-clamp-1">
              {product?.name || 'Beauty Product'}
            </h4>
          </Link>

          {/* Maximum 2-liner short description below product name */}
          <p className="text-[11px] sm:text-xs text-[#5C5566] dark:text-[#C9BED4] line-clamp-2 leading-relaxed font-medium mt-0.5">
            {product?.short_description
              || (product?.description ? product.description.replace(/<[^>]*>?/gm, '').trim() : '')
              || product?.blurb || ''}
          </p>
        </div>

        {/* Pricing & Add Trigger */}
        <div className="flex items-center justify-between pt-2 border-t border-[#EADBEE]/60 dark:border-white/8 mt-auto">
          <div className="flex items-baseline gap-2">
            <span className="text-[17px] font-extrabold text-[#221B2B] dark:text-[#F3EFF6]">
              {currencySymbol}{numPrice.toLocaleString(undefined, { minimumFractionDigits: 0 })}
            </span>
            {(originalPrice || product?.was) && (
              <span className="text-xs text-[#5C5566] dark:text-[#9C90A9] line-through font-medium">
                {currencySymbol}{(originalPrice || product?.was).toLocaleString(undefined, { minimumFractionDigits: 0 })}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleQuickAdd}
            className={`w-9.5 h-9.5 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md ${isAdded
              ? 'bg-emerald-600 text-white'
              : 'bg-[#C9166F] hover:bg-[#EC268F] text-white hover:scale-105 active:scale-95'
              }`}
            title="Add to bag"
          >
            {isAdded ? <Check className="w-4 h-4" /> : <span className="text-lg leading-none font-light mb-0.5">+</span>}
          </button>
        </div>
      </div>
    </div>
  );
}

const SECTION_CLASS = 'px-4 sm:px-8 lg:px-12 py-16 sm:py-20 max-w-7xl mx-auto w-full text-left';
const EYEBROW_CLASS = 'inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white dark:bg-[#1E1528] text-[#5D3E85] dark:text-[#E5C158] text-[10px] sm:text-[11px] font-extrabold tracking-widest border border-[#EADBEE] dark:border-white/10 shadow-xs self-start';
const H2_CLASS = 'text-3xl sm:text-[42px] font-extrabold text-[#221B2B] dark:text-[#F3EFF6] tracking-[-0.035em] leading-[1.1]';
const OUTLINE_BTN_CLASS = 'inline-flex items-center gap-2 px-6 py-3 rounded-full border border-black/15 dark:border-white/20 text-[#221B2B] dark:text-[#F3EFF6] hover:bg-black/5 dark:hover:bg-white/10 font-semibold text-sm transition-all w-fit btn-spring';
const PRODUCT_PLACEHOLDER = '/images/placeholder-product.svg';

const stripHtml = (html) => (html ? String(html).replace(/<[^>]*>?/gm, '').trim() : '');

function SectionHeader({ eyebrow, title, subtitle, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-9">
      <div className="flex flex-col gap-2.5">
        {eyebrow && <span className={EYEBROW_CLASS}>{eyebrow}</span>}
        <h2 className={H2_CLASS}>{title}</h2>
        {subtitle && <p className="text-sm text-[#5C5566] dark:text-[#C9BED4] leading-relaxed max-w-xl">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  );
}

function ArticleCover({ src, alt, className = '' }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return <div className={`w-full h-full bg-gradient-to-br from-[#5D3E85] to-[#EC268F] ${className}`} aria-hidden="true" />;
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      width={800}
      height={600}
      onError={() => setFailed(true)}
      className={`w-full h-full object-cover ${className}`}
    />
  );
}

export default function Home() {
  const currencySymbol = getCurrencySymbol();
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [activeTipIndex, setActiveTipIndex] = useState(0);
  const [isTipsHovered, setIsTipsHovered] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  const { data: productsRes } = useQuery({
    queryKey: ['products-home'],
    queryFn: () => fetch('/api/products?limit=8').then(res => res.json())
  });

  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: () => fetch('/api/settings').then(res => res.json())
  });

  const { data: bannersRes, isLoading: isBannersLoading } = useQuery({
    queryKey: ['banners'],
    queryFn: () => fetch('/api/banners').then(res => res.json())
  });

  const { data: blogRes } = useQuery({
    queryKey: ['blog-articles-home'],
    queryFn: () => fetch('/api/blog?limit=10').then(res => res.json())
  });

  const { data: faqsRes } = useQuery({
    queryKey: ['faqs-home'],
    queryFn: () => fetch('/api/faqs?limit=5').then(res => res.json())
  });

  const { data: featuredProductsRes, isLoading: featuredLoading } = useQuery({
    queryKey: ['featured-products-home'],
    queryFn: () => fetch('/api/products?is_featured=true&limit=20').then(res => res.json())
  });

  const { data: flashSaleRes, isPending: isFlashSalePending } = useQuery({
    queryKey: ['products-flash-sale-home'],
    queryFn: () => fetch('/api/products?is_flash_sale=true&limit=6').then(res => res.json())
  });

  const { data: reviewsRes } = useQuery({
    queryKey: ['reviews-home'],
    queryFn: () => fetch('/api/reviews?limit=20').then(res => res.json())
  });

  const settings = settingsData?.data?.settings || {};
  const banners = bannersRes?.data || [];
  const apiProducts = productsRes?.data?.data || [];
  const rawFeatured = featuredProductsRes?.data?.data || [];
  const flashSaleProducts = flashSaleRes?.data?.data || [];
  const apiReviews = reviewsRes?.data?.data || [];
  const faqs = faqsRes?.data || [];

  const featuredList = (rawFeatured.length > 0 ? rawFeatured : apiProducts).slice(0, 20);

  // Featured catalogue carousel
  const catalogueScrollRef = useRef(null);
  const [isCatalogueHovered, setIsCatalogueHovered] = useState(false);

  useEffect(() => {
    if (isCatalogueHovered || featuredList.length <= 4) return;
    const interval = setInterval(() => {
      const el = catalogueScrollRef.current;
      if (!el) return;
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 15) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: 300, behavior: 'smooth' });
      }
    }, 3800);
    return () => clearInterval(interval);
  }, [isCatalogueHovered, featuredList.length]);

  const scrollCatalogue = (dir) => catalogueScrollRef.current?.scrollBy({ left: dir * 300, behavior: 'smooth' });

  // Reviews carousel
  const reviewsScrollRef = useRef(null);
  const [isReviewsHovered, setIsReviewsHovered] = useState(false);
  const scrollReviews = (dir) => reviewsScrollRef.current?.scrollBy({ left: dir * 360, behavior: 'smooth' });

  // Articles (blog) — real data only
  const articles = useMemo(() => {
    const raw = Array.isArray(blogRes?.data) ? blogRes.data : (blogRes?.data?.data || []);
    return raw.slice(0, 10).map((item, idx) => {
      const text = stripHtml(item.content);
      const excerpt = item.excerpt || item.meta_description || (text ? text.slice(0, 130) + (text.length > 130 ? '...' : '') : '');
      const wordCount = text ? text.split(/\s+/).length : 0;
      return {
        id: item.id || `article-${idx}`,
        title: item.title,
        slug: item.slug,
        categoryName: item.category?.name || item.tags?.[0]?.name || null,
        read_time: wordCount > 0 ? `${Math.max(1, Math.round(wordCount / 200))} min read` : null,
        cover: item.cover_image_url || item.image_url || item.image_path || null,
        excerpt,
        published_at: item.published_at,
      };
    });
  }, [blogRes]);

  useEffect(() => {
    if (articles.length <= 1 || isTipsHovered) return;
    const interval = setInterval(() => {
      setActiveTipIndex((prev) => (prev + 1) % articles.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [articles.length, isTipsHovered]);

  const visibleWindowStart = useMemo(() => {
    if (articles.length <= 4) return 0;
    return Math.min(Math.max(0, activeTipIndex - 1), articles.length - 4);
  }, [activeTipIndex, articles.length]);

  const visibleTips = articles.slice(visibleWindowStart, visibleWindowStart + 4);
  const activeTip = articles[activeTipIndex] || articles[0];

  // Reviews — real data only
  const reviewsList = apiReviews
    .filter(r => r && (r.comment || r.image_url))
    .map((r, idx) => ({
      id: r.id || idx,
      name: r.customer_name || 'Verified Customer',
      productName: r.product?.name || 'Dansolam',
      rating: r.rating || 5,
      avatar: r.avatar_url || null,
      text: r.comment || '',
      image: r.image_url || null,
    }));

  useEffect(() => {
    if (isReviewsHovered || reviewsList.length <= 2) return;
    const interval = setInterval(() => {
      const el = reviewsScrollRef.current;
      if (!el) return;
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 15) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: 360, behavior: 'smooth' });
      }
    }, 3200);
    return () => clearInterval(interval);
  }, [isReviewsHovered, reviewsList.length]);

  // Shop by concern — admin-managed cards with live product counts
  const { data: concernRes } = useQuery({
    queryKey: ['shop-concerns'],
    queryFn: () => fetch('/api/shop-concerns').then(res => res.json()),
    staleTime: 5 * 60_000,
  });
  const concernSection = concernRes?.data;

  // Social strip: live Instagram posts when connected (Admin → Settings → Instagram token),
  // otherwise a random selection of distinct products that open in Quick View.
  const { data: instagramRes } = useQuery({
    queryKey: ['instagram-feed'],
    queryFn: () => fetch('/api/instagram-feed').then(res => res.json()),
    staleTime: 10 * 60_000,
  });
  const instagramPosts = instagramRes?.source === 'instagram' ? (instagramRes.data || []).slice(0, 6) : [];
  const instagramUrl = instagramRes?.profile_url || settings.instagram_url || '';
  const instagramHandle = (instagramUrl.match(/instagram\.com\/([^/?#]+)/i)?.[1]) || 'dansolambeautyhome';

  const productPool = useMemo(() => {
    const byId = new Map();
    [...apiProducts, ...rawFeatured, ...flashSaleProducts].forEach((p) => {
      const image = p?.images?.[0]?.image_url || p?.image_url || p?.image;
      if (p?.id && image && !byId.has(p.id)) byId.set(p.id, { product: p, image });
    });
    return [...byId.values()];
  }, [apiProducts, rawFeatured, flashSaleProducts]);

  // Shuffle once per visit, and only re-pick when the set of products changes.
  const poolKey = productPool.map((item) => item.product.id).join(',');
  const randomProducts = useMemo(() => {
    const list = [...productPool];
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list.slice(0, 6);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poolKey]);

  // Alternating page bands, counted over the sections that actually render.
  let bandIndex = 0;
  const band = () => `home-band${bandIndex++ % 2 ? ' home-band--tint' : ''}`;

  const displayFaqs = faqs.map(f => ({ q: f.question, a: f.answer })).filter(f => f.q);
  const whatsappNumber = (settings.whatsapp_number || '').replace(/[^0-9]/g, '');

  return (
    <div className="min-h-screen bg-white dark:bg-[#17101F] text-[#221B2B] dark:text-[#F3EFF6] font-sans antialiased selection:bg-[#EC268F] selection:text-white relative overflow-hidden text-left transition-colors duration-300">
      <SEO
        title="Dansolam | 100% Organic Skincare"
        description="Organic body creams, oils, scrubs, soaps and kids cream by Dansolam."
      />

      <HeroSliderSection
        banners={banners}
        settings={settings}
        isLoading={isBannersLoading}
        currencySymbol={currencySymbol}
      />

      <FlashSaleSpotlightSection
        settings={settings}
        flashSaleProducts={flashSaleProducts}
      />

      {/* Everything below waits for the flash-sale block above it, so it never gets pushed down (CLS). */}
      {!isFlashSalePending && (
      <>
      {/* FEATURED PRODUCTS */}
      {(featuredLoading || featuredList.length > 0) && (
        <section className={`${SECTION_CLASS} ${band()}`}>
          <SectionHeader
            eyebrow={<><Leaf className="w-3.5 h-3.5 text-[#EC268F]" /><span>Best Sellers & Featured</span></>}
            title="Our Top Picks"
          >
            <Link to="/shop" className={OUTLINE_BTN_CLASS}>
              <span>View all in shop</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </SectionHeader>

          {featuredLoading && featuredList.length === 0 ? (
            <div className="flex gap-5 sm:gap-6 overflow-hidden pb-4 pt-1 px-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="w-[260px] sm:w-[280px] lg:w-[290px] shrink-0 rounded-[24px] border border-[#EADBEE] dark:border-white/8 bg-white dark:bg-[#1F1729] overflow-hidden animate-pulse">
                  <div className="aspect-square bg-gray-100 dark:bg-white/5" />
                  <div className="p-5 flex flex-col gap-2">
                    <div className="h-3 w-1/3 rounded bg-gray-100 dark:bg-white/5" />
                    <div className="h-4 w-2/3 rounded bg-gray-100 dark:bg-white/5" />
                    <div className="h-4 w-1/4 rounded bg-gray-100 dark:bg-white/5 mt-3" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              onMouseEnter={() => setIsCatalogueHovered(true)}
              onMouseLeave={() => setIsCatalogueHovered(false)}
              className="relative group/catalogue w-full"
            >
              <button
                type="button"
                onClick={() => scrollCatalogue(-1)}
                className="absolute -left-2 sm:-left-5 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white/95 dark:bg-[#1F1729]/95 text-[#221B2B] dark:text-white shadow-2xl border border-[#EADBEE] dark:border-white/15 flex items-center justify-center cursor-pointer transition-all duration-300 opacity-0 -translate-x-3 group-hover/catalogue:opacity-100 group-hover/catalogue:translate-x-0 hover:bg-[#5D3E85] hover:text-white hover:scale-110 active:scale-95"
                aria-label="Previous products"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => scrollCatalogue(1)}
                className="absolute -right-2 sm:-right-5 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white/95 dark:bg-[#1F1729]/95 text-[#221B2B] dark:text-white shadow-2xl border border-[#EADBEE] dark:border-white/15 flex items-center justify-center cursor-pointer transition-all duration-300 opacity-0 translate-x-3 group-hover/catalogue:opacity-100 group-hover/catalogue:translate-x-0 hover:bg-[#5D3E85] hover:text-white hover:scale-110 active:scale-95"
                aria-label="Next products"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              <div
                ref={catalogueScrollRef}
                className="flex gap-5 sm:gap-6 overflow-x-auto scroll-smooth pb-4 pt-2 px-1 snap-x snap-mandatory"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {featuredList.map((p) => (
                  <div key={p.id} className="w-[260px] sm:w-[280px] lg:w-[290px] shrink-0 snap-start">
                    <ProductCard product={p} onQuickView={setQuickViewProduct} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* SKINCARE TIPS (spotlight of blog articles) */}
      {articles.length > 0 && activeTip && (
        <section
          className={`${SECTION_CLASS} ${band()}`}
          onMouseEnter={() => setIsTipsHovered(true)}
          onMouseLeave={() => setIsTipsHovered(false)}
        >
          <div className="bg-[#FAF7FC] dark:bg-[#1F1729] border border-[#EADBEE] dark:border-white/8 rounded-[32px] p-8 sm:p-14 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#EC268F]/5 dark:bg-[#EC268F]/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3" />

            <div className="lg:col-span-6 flex flex-col gap-6 relative z-10 text-left">
              <div className="flex items-center justify-between gap-4">
                <span className={EYEBROW_CLASS}>
                  <Leaf className="w-3 h-3 text-[#EC268F]" />
                  <span>Skincare Tips</span>
                </span>

                {articles.length > 4 && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[#5C5566] dark:text-[#9C90A9]">
                      {activeTipIndex + 1} of {articles.length}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setActiveTipIndex((prev) => (prev === 0 ? articles.length - 1 : prev - 1))}
                        className="w-7 h-7 rounded-full bg-white dark:bg-white/10 border border-[#EADBEE] dark:border-white/10 flex items-center justify-center text-xs text-[#221B2B] dark:text-[#F3EFF6] hover:bg-[#5D3E85] hover:text-white dark:hover:bg-[#EC268F] transition-all cursor-pointer shadow-xs active:scale-95"
                        aria-label="Previous tip"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTipIndex((prev) => (prev + 1) % articles.length)}
                        className="w-7 h-7 rounded-full bg-white dark:bg-white/10 border border-[#EADBEE] dark:border-white/10 flex items-center justify-center text-xs text-[#221B2B] dark:text-[#F3EFF6] hover:bg-[#5D3E85] hover:text-white dark:hover:bg-[#EC268F] transition-all cursor-pointer shadow-xs active:scale-95"
                        aria-label="Next tip"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <h2 className={H2_CLASS}>Care tips for healthy, glowing skin</h2>

              <div className="flex flex-col gap-2.5">
                {visibleTips.map((tip, idx) => {
                  const globalIndex = visibleWindowStart + idx;
                  const isActive = activeTipIndex === globalIndex;
                  return (
                    <div
                      key={tip.id}
                      onClick={() => setActiveTipIndex(globalIndex)}
                      className={`flex items-center justify-between p-4 sm:p-4.5 rounded-2xl cursor-pointer transition-all duration-300 group ${isActive
                        ? 'bg-[#C9166F] text-white shadow-xl scale-[1.01]'
                        : 'bg-white dark:bg-white/4 border border-[#EADBEE] dark:border-white/10 text-[#221B2B] dark:text-[#F3EFF6] hover:border-[#C9166F]/50 hover:bg-white/80'
                        }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0 pr-2">
                        <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-[11px] font-black shrink-0 transition-colors ${isActive
                          ? 'bg-white/20 text-white border border-white/30'
                          : 'bg-[#5D3E85]/10 dark:bg-white/10 text-[#5D3E85] dark:text-[#EC268F]'
                          }`}>
                          {String(globalIndex + 1).padStart(2, '0')}
                        </span>
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="text-[14px] sm:text-[15px] font-bold leading-snug truncate">{tip.title}</span>
                          {(tip.categoryName || tip.read_time) && (
                            <div className="flex items-center gap-2">
                              {tip.categoryName && (
                                <span className={`text-[10px] font-extrabold  tracking-wider ${isActive ? 'text-white/85' : 'text-[#5D3E85] dark:text-[#E5C158]'}`}>
                                  {tip.categoryName}
                                </span>
                              )}
                              {tip.categoryName && tip.read_time && (
                                <span className={`text-[10px] ${isActive ? 'text-white/60' : 'text-gray-300'}`}>•</span>
                              )}
                              {tip.read_time && (
                                <span className={`text-[10px] ${isActive ? 'text-white/80' : 'text-[#5C5566] dark:text-[#9C90A9]'}`}>{tip.read_time}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className={`shrink-0 text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${isActive
                        ? 'bg-white text-[#C9166F] shadow-sm'
                        : 'bg-gray-100 dark:bg-white/10 text-[#221B2B] dark:text-[#F3EFF6] group-hover:bg-[#C9166F] group-hover:text-white'
                        }`}>
                        <span>Read</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 flex items-center justify-between gap-4 flex-wrap">
                <Link
                  to="/blog"
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-[#5D3E85] hover:bg-[#EC268F] text-white text-xs font-extrabold shadow-md hover:shadow-lg transition-all btn-spring group"
                >
                  <span>View all tips</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
                {articles.length > 1 && (
                  <div className="flex items-center gap-1.5">
                    {articles.map((_, dotIdx) => (
                      <button
                        key={dotIdx}
                        type="button"
                        onClick={() => setActiveTipIndex(dotIdx)}
                        aria-label={`Go to tip ${dotIdx + 1}`}
                        className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${dotIdx === activeTipIndex
                          ? 'w-6 bg-[#C9166F]'
                          : 'w-2 bg-[#5D3E85]/20 dark:bg-white/20 hover:bg-[#5D3E85]/40'
                          }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-6 h-[440px] sm:h-[540px] rounded-[28px] overflow-hidden bg-gray-100 dark:bg-white/5 border border-[#EADBEE] dark:border-white/10 relative group/visual shadow-lg">
              <ArticleCover
                key={`tip-img-${activeTip.id}`}
                src={activeTip.cover}
                alt={activeTip.title}
                className="transition-all duration-700 ease-out group-hover/visual:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

              {activeTip.categoryName && (
                <div className="absolute top-4 left-4 z-10">
                  <span className="px-3.5 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white text-[10px] font-extrabold  tracking-wider shadow-sm">
                    {activeTip.categoryName}
                  </span>
                </div>
              )}

              <div className="absolute bottom-4 left-4 right-4 z-10 bg-white/95 dark:bg-[#1E1528]/95 backdrop-blur-xl rounded-2xl p-5 border border-white/20 dark:border-white/10 shadow-xl flex flex-col gap-2.5 text-left">
                {activeTip.read_time && (
                  <span className="text-[10px] font-bold text-gray-500 dark:text-[#9C90A9]">{activeTip.read_time}</span>
                )}
                <h3 className="font-extrabold text-base sm:text-lg text-[#221B2B] dark:text-[#F3EFF6] leading-snug line-clamp-2">
                  {activeTip.title}
                </h3>
                {activeTip.excerpt && (
                  <p className="text-xs text-gray-600 dark:text-[#C9BED4] line-clamp-2 leading-relaxed">{activeTip.excerpt}</p>
                )}
                <Link
                  to={activeTip.slug ? `/blog/${activeTip.slug}` : '/blog'}
                  className="text-xs font-bold text-[#C9166F] hover:text-[#EC268F] inline-flex items-center gap-1.5 group/link pt-1"
                >
                  <span>Read article</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CUSTOMER REVIEWS */}
      {reviewsList.length > 0 && (
        <section
          className={`${SECTION_CLASS} ${band()} relative group/reviews`}
          onMouseEnter={() => setIsReviewsHovered(true)}
          onMouseLeave={() => setIsReviewsHovered(false)}
        >
          <SectionHeader eyebrow="Customer Reviews" title="What customers say">
            <Link
              to="/reviews"
              className="px-5 py-2.5 rounded-full border border-[#5D3E85]/25 dark:border-white/20 text-[#5D3E85] dark:text-[#EC268F] hover:bg-[#5D3E85] hover:text-white dark:hover:bg-[#EC268F] dark:hover:text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 btn-spring"
            >
              <span>All Reviews</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            {reviewsList.length > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => scrollReviews(-1)}
                  className="w-10 h-10 rounded-full bg-white dark:bg-[#1F1729] border border-[#EADBEE] dark:border-white/12 flex items-center justify-center text-[#221B2B] dark:text-[#F3EFF6] hover:bg-[#5D3E85] hover:text-white dark:hover:bg-[#EC268F] transition-all shadow-xs cursor-pointer active:scale-95"
                  aria-label="Previous reviews"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollReviews(1)}
                  className="w-10 h-10 rounded-full bg-white dark:bg-[#1F1729] border border-[#EADBEE] dark:border-white/12 flex items-center justify-center text-[#221B2B] dark:text-[#F3EFF6] hover:bg-[#5D3E85] hover:text-white dark:hover:bg-[#EC268F] transition-all shadow-xs cursor-pointer active:scale-95"
                  aria-label="Next reviews"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </SectionHeader>

          <div
            ref={reviewsScrollRef}
            className="flex gap-6 overflow-x-auto scrollbar-none scroll-smooth pb-4 pt-2 px-1 snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {reviewsList.map((r) => (
              <div
                key={r.id}
                className="min-w-[300px] sm:min-w-[360px] md:min-w-[390px] max-w-[420px] shrink-0 bg-white dark:bg-[#1F1729] border border-[#EADBEE] dark:border-white/10 rounded-[24px] p-7 md:p-8 flex flex-col justify-between gap-5 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 snap-start select-none"
              >
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, Math.max(1, r.rating)) }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#E5C158] text-[#E5C158]" />
                  ))}
                </div>

                {r.text && (
                  <p className="text-sm sm:text-base leading-[1.7] text-[#5C5566] dark:text-[#E4DDEA] font-medium line-clamp-4">
"{r.text}"
                  </p>
                )}

                {r.image && (
                  <a href={r.image} target="_blank" rel="noopener noreferrer" className="block w-20 h-20 rounded-xl overflow-hidden border border-[#EADBEE] dark:border-white/10 bg-gray-100 dark:bg-white/5">
                    <img
                      src={r.image}
                      alt={`Review from ${r.name}`}
                      loading="lazy"
                      decoding="async"
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </a>
                )}

                <div className="flex items-center gap-3.5 pt-5 border-t border-[#EADBEE] dark:border-white/10 mt-auto">
                  <FacelessAvatar src={r.avatar} name={r.name} className="w-10 h-10" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-[#221B2B] dark:text-[#F3EFF6] truncate">{r.name}</span>
                    <span className="text-xs text-[#5C5566] dark:text-[#9C90A9] truncate">{r.productName}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SHOP BY CONCERN — cards, filters and live counts managed in Admin → Collections → Shop by concern */}
      {concernSection?.show && concernSection.items?.length > 0 && (
        <section className={`${SECTION_CLASS} ${band()}`}>
          <SectionHeader eyebrow={concernSection.eyebrow} title={concernSection.title}>
            <Link to="/shop" className={OUTLINE_BTN_CLASS}>
              <span>Browse everything</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </SectionHeader>

          <div className="reveal-group grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 items-stretch">
            {concernSection.items.map((c) => {
              const shots = (c.preview_images || []).slice(0, 3);
              return (
                <Link
                  key={c.slug}
                  to={c.link}
                  aria-label={`${c.name}: shop ${c.count} ${c.count === 1 ? 'product' : 'products'}`}
                  className="group flex flex-col h-full rounded-[28px] overflow-hidden bg-[#2A1740] shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#EC268F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FBFAF8] dark:focus-visible:ring-offset-[#17101F]"
                >
                  {/* Image area: up to three product shots, same tint/padding/shadow on every card */}
                  <div className="relative aspect-[5/4] bg-[#F8EEF6] overflow-hidden">
                    <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-white/0 via-transparent to-[#5D3E85]/15" />
                    {c.image ? (
                      <img
                        {...responsiveImageProps(c.image, '(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw')}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        width={480}
                        height={384}
                        className="absolute inset-0 w-full h-full object-contain p-[5%] rounded-[22px] mix-blend-multiply drop-shadow-[0_10px_16px_rgba(42,23,64,0.18)] transition-transform duration-500 ease-out group-hover:scale-[1.06]"
                      />
                    ) : (
                      <div className="absolute inset-0 grid place-items-center">
                        {shots.map((src, i) => (
                          <div
                            key={src}
                            className={`concern-shot concern-shot--${i} absolute w-[42%] aspect-square rounded-2xl overflow-hidden bg-white ring-1 ring-black/5 shadow-[0_14px_28px_rgba(42,23,64,0.22)]`}
                          >
                            <img
                              {...responsiveImageProps(src, '200px')}
                              alt=""
                              loading="lazy"
                              decoding="async"
                              width={260}
                              height={260}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Text on solid plum for reliable contrast */}
                  <div className="flex flex-col gap-2 p-5 sm:p-6 flex-1">
                    <h3 className="font-serif font-bold text-xl leading-tight text-white">{c.name}</h3>
                    {c.blurb && <p className="text-[14px] leading-relaxed text-white/85">{c.blurb}</p>}
                    <span className="mt-auto pt-2 inline-flex items-center gap-1.5 text-[14px] font-bold text-[#F9B8DA] group-hover:text-white transition-colors">
                      Shop {c.count} {c.count === 1 ? 'product' : 'products'}
                      <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* BLOG & ARTICLES */}
      {articles.length > 0 && (
        <section className={`${SECTION_CLASS} ${band()}`}>
          <SectionHeader eyebrow="Blog & Articles" title="From the journal">
            <Link to="/blog" className={OUTLINE_BTN_CLASS}>
              <span>All articles</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </SectionHeader>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {articles.slice(0, 3).map((a) => (
              <Link
                key={a.id}
                to={a.slug ? `/blog/${a.slug}` : '/blog'}
                className="bg-white dark:bg-[#1F1729] border border-[#EADBEE] dark:border-white/8 rounded-[24px] overflow-hidden flex flex-col group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="aspect-[3/2] overflow-hidden bg-gray-100 dark:bg-white/5">
                  <ArticleCover src={a.cover} alt={a.title} className="group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-6 flex flex-col gap-2.5">
                  {(a.categoryName || a.read_time) && (
                    <span className="text-[10px] font-bold tracking-wider text-[#5D3E85] dark:text-[#EC268F]">
                      {[a.categoryName, a.read_time].filter(Boolean).join(' · ')}
                    </span>
                  )}
                  <h3 className="text-base font-bold text-[#221B2B] dark:text-[#F3EFF6] group-hover:text-[#C9166F] dark:group-hover:text-[#EC268F] transition-colors leading-snug">
                    {a.title}
                  </h3>
                  {a.excerpt && (
                    <p className="text-xs sm:text-[13px] text-[#5C5566] dark:text-[#C9BED4] leading-relaxed line-clamp-3">{a.excerpt}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* SOCIAL STRIP — Instagram posts when connected, otherwise random products */}
      {(instagramPosts.length > 0 || randomProducts.length > 0) && (
        <section className={`${SECTION_CLASS} ${band()}`}>
          <SectionHeader
            eyebrow={
              instagramUrl ? (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#C9166F] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:underline"
                >
                  @{instagramHandle}
                </a>
              ) : `@${instagramHandle}`
            }
            title="Viewed on Instagram"
          >
            <Link to="/shop" className={OUTLINE_BTN_CLASS}>
              <span>View all products</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </SectionHeader>

          <div className="reveal-group grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 gap-4 sm:gap-5 items-stretch">
            {instagramPosts.length > 0
              ? instagramPosts.map((post) => (
                <a
                  key={post.id}
                  href={post.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="aspect-square rounded-2xl overflow-hidden bg-white dark:bg-[#1E1528] border border-[#EADBEE] dark:border-white/8 group relative shadow-2xs hover:shadow-2xl hover:-translate-y-1 hover:border-[#5D3E85]/50 dark:hover:border-[#EC268F]/50 transition-all duration-300 block w-full text-left cursor-pointer"
                >
                  <img
                    src={post.media_type === 'VIDEO' ? (post.thumbnail_url || post.media_url) : post.media_url}
                    alt={post.caption ? post.caption.slice(0, 90) : 'Instagram post'}
                    loading="lazy"
                    decoding="async"
                    width={300}
                    height={300}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#2A1740]/90 via-[#5D3E85]/20 to-transparent group-hover:from-black/90 group-hover:via-[#260B3E]/60 transition-all duration-500 flex flex-col justify-end p-3 text-left opacity-0 group-hover:opacity-100">
                    {post.caption && <span className="text-[11px] font-semibold text-white leading-snug line-clamp-3">{post.caption}</span>}
                    <span className="text-[10px] text-pink-200 font-extrabold tracking-wider mt-1">View on Instagram &rarr;</span>
                  </div>
                </a>
              ))
              : randomProducts.map(({ product }, idx) => (
                // 6 on wide desktop, 4 on laptop (hide 5th/6th), 3 on tablet, 2 on mobile.
                <div key={product.id} className={idx >= 4 ? 'lg:hidden 2xl:block' : ''}>
                  <SocialProductTile product={product} onQuickView={setQuickViewProduct} />
                </div>
              ))}
          </div>
        </section>
      )}

      {/* FAQ */}
      {displayFaqs.length > 0 && (
        <section className={`${SECTION_CLASS} ${band()}`}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
            <div className="lg:col-span-5 flex flex-col gap-4">
              <span className={EYEBROW_CLASS}>Before you order</span>
              <h2 className={H2_CLASS}>Common questions</h2>
              {whatsappNumber && (
                <>
                  <p className="text-sm text-[#5C5566] dark:text-[#C9BED4] leading-relaxed">
                    Anything not covered here? Send us a message on WhatsApp.
                  </p>
                  <a
                    href={`https://wa.me/${whatsappNumber}?text=Hello%20Dansolam,%20I%20have%20a%20question%20before%20placing%20an%20order.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all w-fit mt-2 btn-spring"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Chat with us</span>
                  </a>
                </>
              )}
            </div>

            <div className="lg:col-span-7 flex flex-col gap-3">
              {displayFaqs.map((f, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-[#1F1729] border border-[#EADBEE] dark:border-white/8 rounded-2xl p-6 flex flex-col gap-2.5 transition-all shadow-2xs"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    aria-expanded={openFaq === idx}
                    className="flex items-center justify-between gap-4 text-left cursor-pointer w-full"
                  >
                    <span className="text-[15px] font-bold text-[#221B2B] dark:text-[#F3EFF6]">{f.q}</span>
                    <span className="text-[#5D3E85] dark:text-[#E5C158] font-bold text-lg">{openFaq === idx ? '−' : '+'}</span>
                  </button>
                  {openFaq === idx && (
                    <p className="text-sm leading-relaxed text-[#5C5566] dark:text-[#C9BED4] pt-2 border-t border-[#EADBEE] dark:border-white/10 animate-fade-in font-medium">
                      {f.a}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* TRUST BADGES */}
      <section className={`${SECTION_CLASS} ${band()}`}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-[#1F1729] border border-[#EADBEE] dark:border-white/8 rounded-2xl p-6 flex flex-col gap-2 hover:-translate-y-1 transition-transform duration-300">
            <Leaf className="w-5 h-5 text-[#5D3E85] dark:text-[#E5C158]" />
            <span className="text-[15px] font-bold text-[#221B2B] dark:text-[#F3EFF6]">100% organic</span>
            <span className="text-xs text-[#5C5566] dark:text-[#9C90A9]">Natural creams, oils, scrubs and soaps</span>
          </div>
          <div className="bg-white dark:bg-[#1F1729] border border-[#EADBEE] dark:border-white/8 rounded-2xl p-6 flex flex-col gap-2 hover:-translate-y-1 transition-transform duration-300">
            <Truck className="w-5 h-5 text-[#5D3E85] dark:text-[#E5C158]" />
            <span className="text-[15px] font-bold text-[#221B2B] dark:text-[#F3EFF6]">Delivery</span>
            <span className="text-xs text-[#5C5566] dark:text-[#9C90A9]">Your order, tracked to your door</span>
          </div>
          <div className="bg-white dark:bg-[#1F1729] border border-[#EADBEE] dark:border-white/8 rounded-2xl p-6 flex flex-col gap-2 hover:-translate-y-1 transition-transform duration-300">
            <MessageCircle className="w-5 h-5 text-[#5D3E85] dark:text-[#E5C158]" />
            <span className="text-[15px] font-bold text-[#221B2B] dark:text-[#F3EFF6]">WhatsApp support</span>
            <span className="text-xs text-[#5C5566] dark:text-[#9C90A9]">Questions about products or orders</span>
          </div>
        </div>
      </section>
      </>
      )}

      {quickViewProduct && (
        <QuickViewModal
          isOpen={!!quickViewProduct}
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
        />
      )}
    </div>
  );
}
