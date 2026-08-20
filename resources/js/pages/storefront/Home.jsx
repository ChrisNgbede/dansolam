import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight, Star, Heart, ShoppingBag, Eye, Check, ShieldCheck, Truck, RefreshCw, MessageCircle, X, ChevronLeft, ChevronRight, Sparkles
} from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useWishlistStore } from '../../store/wishlistStore';
import { getCurrencySymbol } from '../../utils/currency';
import QuickViewModal from '../../components/storefront/QuickViewModal';
import SEO from '../../components/seo/SEO';
import FlashSaleSpotlightSection from '../../components/storefront/FlashSaleSpotlightSection';
import HeroSliderSection from '../../components/storefront/HeroSliderSection';
import FacelessAvatar from '../../components/ui/FacelessAvatar';

export function ProductCard({ product, onQuickView }) {
  const currencySymbol = getCurrencySymbol();
  const addItemToCart = useCartStore(state => state.addItem);
  const toggleWishlist = useWishlistStore(state => state.toggleItem);
  const wishlistItems = useWishlistStore(state => state.items);
  const [isAdded, setIsAdded] = React.useState(false);

  const DEFAULT_CARD_FALLBACK = 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=600';
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
    <div className="bg-white dark:bg-[#1F1729] rounded-[24px] border border-[#EADBEE] dark:border-white/8 shadow-xs hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group relative overflow-hidden text-left">
      {/* Product Image Section */}
      <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-[#100A16] group/img w-full">
        <Link to={`/product/${product?.slug || product?.id}`} className="block w-full h-full relative overflow-hidden">
          <img
            src={image}
            alt={product?.name || 'Product'}
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = DEFAULT_CARD_FALLBACK; }}
            className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500 ease-out"
          />
          {secondaryImage && (
            <img
              src={secondaryImage}
              alt=""
              className="w-full h-full object-cover absolute inset-0 opacity-0 group-hover/img:opacity-100 transition-opacity duration-500"
            />
          )}
        </Link>

        {/* Badges Container */}
        <div className="absolute top-3.5 left-3.5 flex flex-col gap-1 pointer-events-none z-10">
          <span className="px-2.5 py-1 bg-[#17101F]/90 text-[#E5C158] text-[10px] font-bold tracking-[0.12em]  rounded-full shadow-xs backdrop-blur-md border border-white/10">
            {product?.badge || 'Popular'}
          </span>
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
        {onQuickView && (
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onQuickView(product); }}
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
            {product?.category?.name || product?.category || product?.cat || 'SHOP Care'}
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
              || (product?.blurb || 'Gentle organic formulation enriched with cold-pressed herbal botanicals.')}
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

export default function Home() {
  const pageRef = useRef(null);
  const currencySymbol = getCurrencySymbol();
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [activeTipIndex, setActiveTipIndex] = useState(0);
  const [isTipsHovered, setIsTipsHovered] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  // Fetch Dynamic Products from Backend
  const { data: productsRes } = useQuery({
    queryKey: ['products-home'],
    queryFn: () => fetch('/api/products?limit=8').then(res => res.json())
  });

  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: () => fetch('/api/settings').then(res => res.json())
  });

  const { data: bannersRes } = useQuery({
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

  // Fetch Featured Dynamic Products (up to 20 products configured by Admin)
  const { data: featuredProductsRes } = useQuery({
    queryKey: ['featured-products-home'],
    queryFn: () => fetch('/api/products?is_featured=true&limit=20').then(res => res.json())
  });

  // Fetch Flash Sale Products
  const { data: flashSaleRes } = useQuery({
    queryKey: ['products-flash-sale-home'],
    queryFn: () => fetch('/api/products?is_flash_sale=true&limit=6').then(res => res.json())
  });

  // Fetch Reviews for Testimonials Marquee
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
  const articles = blogRes?.data?.data || [];
  const faqs = faqsRes?.data || [];

  const defaultCatalogue = [
    { id: 'p1', name: 'Luminous Brightening Serum', price: 45000, was: 56000, cat: 'SERUMS', badge: 'NEW', image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=600', slug: 'luminous-brightening-serum' },
    { id: 'p2', name: 'Shea Restorative Body Cream', price: 38000, was: 48000, cat: 'BODY', badge: 'BESTSELLER', image: 'https://images.unsplash.com/photo-1608248597263-00079e96047a?q=80&w=600', slug: 'shea-restorative-body-cream' },
    { id: 'p3', name: 'Daily Mineral Sunscreen SPF50', price: 32000, was: 40000, cat: 'SUN CARE', badge: 'LOW STOCK', image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=600', slug: 'daily-mineral-sunscreen-spf50' },
    { id: 'p4', name: 'Damask Rose Hydration Mist', price: 28000, was: 35000, cat: 'MASKS', badge: 'NEW', image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=600', slug: 'damask-rose-hydration-mist' }
  ];

  const featuredList = (rawFeatured.length > 0 ? rawFeatured : (apiProducts.length > 0 ? apiProducts : defaultCatalogue)).slice(0, 20);

  // Auto-swipe featured catalogue carousel
  const catalogueScrollRef = useRef(null);
  const [isCatalogueHovered, setIsCatalogueHovered] = useState(false);

  useEffect(() => {
    if (isCatalogueHovered || featuredList.length <= 4) return;
    const interval = setInterval(() => {
      if (catalogueScrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = catalogueScrollRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 15) {
          catalogueScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          catalogueScrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
        }
      }
    }, 3800);
    return () => clearInterval(interval);
  }, [isCatalogueHovered, featuredList.length]);

  const scrollCatalogueLeft = () => {
    if (catalogueScrollRef.current) {
      catalogueScrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollCatalogueRight = () => {
    if (catalogueScrollRef.current) {
      catalogueScrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  // Auto-swipe reviews marquee
  const reviewsScrollRef = useRef(null);
  const [isReviewsHovered, setIsReviewsHovered] = useState(false);

  const scrollReviewsLeft = () => {
    if (reviewsScrollRef.current) {
      reviewsScrollRef.current.scrollBy({ left: -360, behavior: 'smooth' });
    }
  };

  const scrollReviewsRight = () => {
    if (reviewsScrollRef.current) {
      reviewsScrollRef.current.scrollBy({ left: 360, behavior: 'smooth' });
    }
  };

  const defaultTips = [
    {
      id: 'tip-1',
      title: 'The 5-Day Glow Routine for Hyperpigmentation',
      category: { name: 'Routine Guides' },
      read_time: '3 min read',
      cover_image_url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=800',
      slug: 'the-5-day-glow-routine-for-hyperpigmentation',
      excerpt: 'Wash with Whitening Polish Soap, mist rose hydration toner, and apply brightening serum for rapid cellular clarity.'
    },
    {
      id: 'tip-2',
      title: 'Why Hydroquinone-Free Skincare is the Safest Choice',
      category: { name: 'Editorial' },
      read_time: '4 min read',
      cover_image_url: 'https://images.unsplash.com/photo-1512290900672-1f5be4df1d3a?q=80&w=800',
      slug: 'why-hydroquinone-free-skincare-is-the-safest-choice',
      excerpt: 'How pure cold-pressed plant extracts and natural vitamin C repair melanin without skin thinning or rebound pigmentation.'
    },
    {
      id: 'tip-3',
      title: 'Preserving Botanical Potency: Product Storage & Care',
      category: { name: 'Sanctuary Tips' },
      read_time: '2 min read',
      cover_image_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=800',
      slug: 'preserving-botanical-potency-product-storage-care',
      excerpt: 'Optimal temperature and airtight storage techniques to keep cold-pressed oils and organic creams active for 12+ months.'
    },
    {
      id: 'tip-4',
      title: 'The Art of Facial Steaming & Hydro-Glow Exfoliation',
      category: { name: 'Sanctuary Tips' },
      read_time: '5 min read',
      cover_image_url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800',
      slug: 'the-art-of-facial-steaming-hydro-glow-exfoliation',
      excerpt: 'Step-by-step esthetician steaming protocol to open pores, lift deep-seated debris, and maximize serum absorption.'
    },
    {
      id: 'tip-5',
      title: 'Sun Protection for Melanin-Rich Skin: Why Mineral SPF Matters',
      category: { name: 'Routine Guides' },
      read_time: '3 min read',
      cover_image_url: 'https://images.unsplash.com/photo-1608248597263-00079e96047a?q=80&w=800',
      slug: 'sun-protection-for-melanin-rich-skin-why-mineral-spf-matters',
      excerpt: 'Shielding skin against UVA/UVB damage to prevent hyperpigmentation recurrence without white cast or pore clogging.'
    }
  ];

  const tipsList = useMemo(() => {
    const raw = Array.isArray(blogRes?.data) ? blogRes.data : (blogRes?.data?.data || []);
    if (raw.length > 0) {
      return raw.slice(0, 10).map((item, idx) => {
        let cleanExcerpt = item.meta_description || '';
        if (!cleanExcerpt && item.content) {
          const text = item.content.replace(/<[^>]*>?/gm, '').trim();
          cleanExcerpt = text.slice(0, 130) + (text.length > 130 ? '...' : '');
        }
        const wordCount = item.content ? item.content.replace(/<[^>]*>?/gm, '').trim().split(/\s+/).length : 200;
        const readTime = `${Math.max(1, Math.round(wordCount / 200))} min read`;

        return {
          id: item.id || `tip-${idx}`,
          title: item.title,
          slug: item.slug,
          category: item.category || { name: 'Routine Guides' },
          read_time: readTime,
          cover_image_url: item.cover_image_url || item.image_path || defaultTips[idx % defaultTips.length].cover_image_url,
          excerpt: cleanExcerpt || defaultTips[idx % defaultTips.length].excerpt
        };
      });
    }
    return defaultTips.slice(0, 10);
  }, [blogRes]);

  // Auto-scroll through tips every 4.5s (pausing on hover)
  useEffect(() => {
    if (tipsList.length <= 1 || isTipsHovered) return;
    const interval = setInterval(() => {
      setActiveTipIndex((prev) => (prev + 1) % tipsList.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [tipsList.length, isTipsHovered]);

  // Window of max 4 tips visible at a time
  const visibleWindowStart = useMemo(() => {
    if (tipsList.length <= 4) return 0;
    const maxStart = tipsList.length - 4;
    return Math.min(Math.max(0, activeTipIndex - 1), maxStart);
  }, [activeTipIndex, tipsList.length]);

  const visibleTips = tipsList.slice(visibleWindowStart, visibleWindowStart + 4);
  const activeTip = tipsList[activeTipIndex] || tipsList[0] || defaultTips[0];
  const activeTipImage = activeTip?.cover_image_url || activeTip?.image_path || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800';

  const testimonials = [
    {
      name: 'Mila R.',
      handle: 'Verified VIP Buyer · SHOP Member',
      rating: 5,
      avatar: null,
      text: 'The facial treatment at Dansolam left my skin glowing for weeks. The salon atmosphere is unparalleled.'
    },
    {
      name: 'Elena C.',
      handle: 'Verified VIP Buyer · Glow Routine',
      rating: 5,
      avatar: null,
      text: 'High quality products and a consultation that genuinely changed my daily routine.'
    },
    {
      name: 'Sophie L.',
      handle: 'Verified VIP Buyer · Spot Remedy',
      rating: 5,
      avatar: null,
      text: 'Expert care from start to finish. The glow serum was worth every naira.'
    },
    {
      name: 'Amara K.',
      handle: 'Verified VIP Buyer · Herbal Polish',
      rating: 5,
      avatar: null,
      text: 'Visible difference in 5 days! The brightening soap cleared my dark spots effortlessly.'
    },
    {
      name: 'Zainab T.',
      handle: 'Verified VIP Buyer · Organic Care',
      rating: 5,
      avatar: null,
      text: 'Gentle on skin, zero harsh bleaching chemicals. I recommend Dansolam to all my friends.'
    }
  ];

  const allReviewsList = apiReviews.length > 0
    ? apiReviews.map((r, idx) => ({
      id: r.id || idx,
      name: r.customer_name || 'Verified Client',
      handle: r.product?.name ? `Verified Buyer · ${r.product.name}` : 'Verified Client · SHOP Member',
      rating: r.rating || 5,
      avatar: r.avatar_url || null,
      text: r.comment || 'Exceptional skincare formulas and results.',
    }))
    : testimonials;

  useEffect(() => {
    if (isReviewsHovered || allReviewsList.length <= 2) return;
    const interval = setInterval(() => {
      if (reviewsScrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = reviewsScrollRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 15) {
          reviewsScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          reviewsScrollRef.current.scrollBy({ left: 360, behavior: 'smooth' });
        }
      }
    }, 3200);
    return () => clearInterval(interval);
  }, [isReviewsHovered, allReviewsList.length]);

  const defaultConcerns = [
    {
      name: 'Brightening & Glow',
      count: '12 products',
      blurb: 'Target dullness, restore luminosity, and fade uneven pigmentation naturally.',
      image: '/images/concerns/brightening_glow.jpg',
      link: '/shop?category=brightening'
    },
    {
      name: 'Sunburn & Dark Spots',
      count: '9 products',
      blurb: 'Botanical oils and restorative creams formulated to clear hyperpigmentation.',
      image: '/images/concerns/sunburn_spots.jpg',
      link: '/shop?category=spots'
    },
    {
      name: 'Dryness & Hydration',
      count: '8 products',
      blurb: 'Intense cold-pressed plant butters and almond oils for 24-hour hydration.',
      image: '/images/concerns/dryness_hydration.jpg',
      link: '/shop?category=hydration'
    },
    {
      name: 'Sensitive & Kids',
      count: '6 products',
      blurb: 'Gentle, zero-harsh chemical soaps designed for fragile skin and whole families.',
      image: '/images/concerns/sensitive_kids.jpg',
      link: '/shop?category=sensitive'
    }
  ];

  // Dynamic Shop by Concern settings
  const dynamicConcernEyebrow = settings.shop_by_concern_eyebrow || 'Shop by concern';
  const dynamicConcernTitle = settings.shop_by_concern_title || 'Start where your skin is';
  const dynamicConcernShow = settings.shop_by_concern_show !== 'false' && settings.shop_by_concern_show !== false;

  let dynamicConcerns = [];
  try {
    if (typeof settings.shop_by_concern_items === 'string') {
      dynamicConcerns = JSON.parse(settings.shop_by_concern_items);
    } else if (Array.isArray(settings.shop_by_concern_items)) {
      dynamicConcerns = settings.shop_by_concern_items;
    }
  } catch (e) {
    dynamicConcerns = [];
  }

  if (!dynamicConcerns || dynamicConcerns.length === 0) {
    dynamicConcerns = defaultConcerns;
  }

  // Dynamically resolve real product images for the "From the studio" section
  const studioProductPhotos = useMemo(() => {
    const productPool = [...apiProducts, ...rawFeatured, ...flashSaleProducts];
    const imageList = [];

    productPool.forEach(p => {
      if (p.images && Array.isArray(p.images) && p.images.length > 0) {
        p.images.forEach(img => {
          const url = typeof img === 'string' ? img : img.image_url;
          if (url && !imageList.some(item => item.url === url)) {
            imageList.push({
              url,
              name: p.name,
              slug: p.slug
            });
          }
        });
      } else if (p.thumbnail || p.image || p.image_url) {
        const url = p.thumbnail || p.image || p.image_url;
        if (url && !imageList.some(item => item.url === url)) {
          imageList.push({
            url,
            name: p.name,
            slug: p.slug
          });
        }
      }
    });

    const defaultBackdrops = [
      { url: '/storage/products/21.png', name: 'Glowing Moisturizing Cream', slug: 'glowing-moisturizing-500g-fast-selling' },
      { url: '/storage/products/14.png', name: 'Whitening Polish Soap', slug: 'whitening-polish-soap-750ml' },
      { url: '/storage/products/24.png', name: 'Essential Oil', slug: 'essential-oil-250g' },
      { url: '/storage/products/22.png', name: 'Discoloration Oil', slug: 'discoloration-oil-250g' },
      { url: '/storage/products/7.png', name: 'Children Cream', slug: 'children-cream-500g' },
      { url: '/storage/products/15.png', name: 'Body & Face Scrub', slug: 'body-and-face-scrub-500g' },
    ];

    return (imageList.length >= 6 ? imageList : [...imageList, ...defaultBackdrops]).slice(0, 6);
  }, [apiProducts, rawFeatured, flashSaleProducts]);

  const defaultFaqs = [
    {
      q: 'How fast do Dansolam organic products show results?',
      a: 'Most clients notice visible smoothing, hydration, and an improved skin glow within 5 to 7 days of consistent daily use.'
    },
    {
      q: 'Are Dansolam products hydroquinone and chemical-free?',
      a: 'Yes, 100%. All our soaps, creams, and oils are formulated with pure botanical extracts, almond oil, and herbal oils with zero steroids or harsh bleaching agents.'
    },
    {
      q: 'How long does delivery take?',
      a: 'Local and express orders dispatch within 24 hours. Nationwide delivery takes 2 to 4 working days via trusted couriers with live tracking.'
    },
    {
      q: 'Can I use Dansolam products on sensitive skin or for children?',
      a: 'Yes, we have specialized mild herbal formulations created specifically for delicate, sensitive skin and whole families.'
    },
    {
      q: 'How do I consult with a Dansolam beauty specialist for recommendations?',
      a: 'You can reach out directly to our customer care agent on WhatsApp anytime Monday through Saturday for personalized routine guidance.'
    }
  ];

  const displayFaqs = faqs.length > 0 ? faqs.map(f => ({ q: f.question, a: f.answer })) : defaultFaqs;

  return (
    <div ref={pageRef} className="min-h-screen bg-[#FBFAF8] dark:bg-[#17101F] text-[#221B2B] dark:text-[#F3EFF6] font-sans antialiased selection:bg-[#EC268F] selection:text-white relative overflow-hidden text-left transition-colors duration-300">
      <SEO
        title="Dansolam Beauty Home | Luxury Skincare & Organic Beauty SHOP"
        description="Small-batch organic soaps, brightening creams and discoloration oils. Handcrafted in small batches, shipped worldwide."
      />

      {/* 1. HERO SECTION (Dynamic Multi-Slide Hero with CMS Management & Fluid Morphing Transitions) */}
      <HeroSliderSection
        banners={banners}
        settings={settings}
        currencySymbol={currencySymbol}
      />

      {/* FLASH SALE / EDITORIAL SPOTLIGHT SECTION (Swiping banners with countdown timers) */}
      <FlashSaleSpotlightSection
        settings={settings}
        flashSaleProducts={flashSaleProducts}
      />

      {/* 2. THE CATALOGUE SECTION (Auto-swiping featured products up to 20 items with hover carets) */}
      <section className="px-4 sm:px-8 lg:px-12 py-16 sm:py-24 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-9">
          <div className="flex flex-col gap-2.5 text-left">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white dark:bg-[#1E1528] text-[#5D3E85] dark:text-[#E5C158] text-[10px] sm:text-[11px] font-extrabold tracking-widest  border border-[#EADBEE] dark:border-white/10 shadow-xs self-start">
              <Sparkles className="w-3.5 h-3.5 text-[#EC268F]" />
              <span>Best Sellers & Featured Products</span>
            </span>
            <h2 className="text-3xl sm:text-[42px] font-extrabold text-[#221B2B] dark:text-[#F3EFF6] tracking-[-0.035em] leading-[1.1]">
              Our Top Picks
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-black/15 dark:border-white/20 text-[#221B2B] dark:text-[#F3EFF6] hover:bg-black/5 dark:hover:bg-white/10 font-semibold text-sm transition-all w-fit btn-spring"
            >
              <span>View all in shop</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Carousel Container with Hover-Revealed Navigation Carets */}
        <div
          onMouseEnter={() => setIsCatalogueHovered(true)}
          onMouseLeave={() => setIsCatalogueHovered(false)}
          className="relative group/catalogue w-full"
        >
          {/* Left Navigation Caret (Smoothly reveals on section hover) */}
          <button
            type="button"
            onClick={scrollCatalogueLeft}
            className="absolute -left-2 sm:-left-5 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white/95 dark:bg-[#1F1729]/95 text-[#221B2B] dark:text-white shadow-2xl border border-[#EADBEE] dark:border-white/15 flex items-center justify-center cursor-pointer transition-all duration-300 opacity-0 -translate-x-3 group-hover/catalogue:opacity-100 group-hover/catalogue:translate-x-0 hover:bg-[#5D3E85] hover:text-white hover:scale-110 active:scale-95"
            aria-label="Previous products"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Right Navigation Caret (Smoothly reveals on section hover) */}
          <button
            type="button"
            onClick={scrollCatalogueRight}
            className="absolute -right-2 sm:-right-5 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white/95 dark:bg-[#1F1729]/95 text-[#221B2B] dark:text-white shadow-2xl border border-[#EADBEE] dark:border-white/15 flex items-center justify-center cursor-pointer transition-all duration-300 opacity-0 translate-x-3 group-hover/catalogue:opacity-100 group-hover/catalogue:translate-x-0 hover:bg-[#5D3E85] hover:text-white hover:scale-110 active:scale-95"
            aria-label="Next products"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Swiping Carousel Track (up to 20 products) */}
          <div
            ref={catalogueScrollRef}
            className="flex gap-5 sm:gap-6 overflow-x-auto scroll-smooth pb-4 pt-1 px-1 snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {featuredList.map((p) => (
              <div
                key={p.id}
                className="w-[260px] sm:w-[280px] lg:w-[290px] shrink-0 snap-start"
              >
                <ProductCard
                  product={p}
                  onQuickView={setQuickViewProduct}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. BEAUTY & GLOW TIPS (AUTO-SCROLLING TIPS & PROTOCOLS) */}
      <section
        className="px-6 sm:px-12 py-16 max-w-7xl mx-auto"
        onMouseEnter={() => setIsTipsHovered(true)}
        onMouseLeave={() => setIsTipsHovered(false)}
      >
        <div className="bg-[#FAF7FC] dark:bg-[#1F1729] border border-[#EADBEE] dark:border-white/8 rounded-[32px] p-8 sm:p-14 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center relative overflow-hidden">
          {/* Ambient Decorative Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#EC268F]/5 dark:bg-[#EC268F]/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3" />

          {/* Left Column: Heading, 4 Visible Tips, Controls, View All CTA */}
          <div className="lg:col-span-6 flex flex-col gap-6 relative z-10 text-left">
            <div className="flex items-center justify-between gap-4">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white dark:bg-[#1E1528] text-[#5D3E85] dark:text-[#E5C158] text-[10px] sm:text-[11px] font-extrabold tracking-widest uppercase border border-[#EADBEE] dark:border-white/10 shadow-xs self-start">
                <Sparkles className="w-3 h-3 text-[#EC268F]" />
                <span>Beauty & Glow Tips</span>
              </span>

              {/* Counter Badge & Navigation Buttons if > 4 tips */}
              {tipsList.length > 4 && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-[#5C5566] dark:text-[#9C90A9]">
                    {activeTipIndex + 1} of {tipsList.length}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setActiveTipIndex((prev) => (prev === 0 ? tipsList.length - 1 : prev - 1))}
                      className="w-7 h-7 rounded-full bg-white dark:bg-white/10 border border-[#EADBEE] dark:border-white/10 flex items-center justify-center text-xs text-[#221B2B] dark:text-[#F3EFF6] hover:bg-[#5D3E85] hover:text-white dark:hover:bg-[#EC268F] transition-all cursor-pointer shadow-xs active:scale-95"
                      title="Previous Tip"
                      aria-label="Previous Tip"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTipIndex((prev) => (prev + 1) % tipsList.length)}
                      className="w-7 h-7 rounded-full bg-white dark:bg-white/10 border border-[#EADBEE] dark:border-white/10 flex items-center justify-center text-xs text-[#221B2B] dark:text-[#F3EFF6] hover:bg-[#5D3E85] hover:text-white dark:hover:bg-[#EC268F] transition-all cursor-pointer shadow-xs active:scale-95"
                      title="Next Tip"
                      aria-label="Next Tip"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <h2 className="text-3xl sm:text-[42px] font-extrabold text-[#221B2B] dark:text-[#F3EFF6] tracking-[-0.035em] leading-[1.1]">
              Expert skincare tips,<br />
              proven daily rituals.
            </h2>
            <p className="text-sm sm:text-base text-[#5C5566] dark:text-[#C9BED4] leading-[1.7]">
              Step-by-step skincare rituals, botanical application techniques, and product routines crafted by our aesthetic experts.
            </p>

            {/* 4 Visible Tips on Screen at a Time */}
            <div className="flex flex-col gap-2.5">
              {visibleTips.map((tip, idx) => {
                const globalIndex = visibleWindowStart + idx;
                const isActive = activeTipIndex === globalIndex;
                const categoryName = tip.category?.name || tip.tags?.[0]?.name || 'Beauty Protocol';

                return (
                  <div
                    key={tip.id || tip.slug || globalIndex}
                    onClick={() => setActiveTipIndex(globalIndex)}
                    className={`flex items-center justify-between p-4 sm:p-4.5 rounded-2xl cursor-pointer transition-all duration-300 group ${
                      isActive
                        ? 'bg-[#C9166F] text-white shadow-xl scale-[1.01]'
                        : 'bg-white dark:bg-white/4 border border-[#EADBEE] dark:border-white/10 text-[#221B2B] dark:text-[#F3EFF6] hover:border-[#C9166F]/50 hover:bg-white/80'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0 pr-2">
                      <span
                        className={`w-7 h-7 rounded-xl flex items-center justify-center text-[11px] font-black shrink-0 transition-colors ${
                          isActive
                            ? 'bg-white/20 text-white border border-white/30'
                            : 'bg-[#5D3E85]/10 dark:bg-white/10 text-[#5D3E85] dark:text-[#EC268F]'
                        }`}
                      >
                        {String(globalIndex + 1).padStart(2, '0')}
                      </span>
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-[14px] sm:text-[15px] font-bold leading-snug truncate">
                          {tip.title}
                        </span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-extrabold uppercase tracking-wider ${
                              isActive ? 'text-white/85' : 'text-[#5D3E85] dark:text-[#E5C158]'
                            }`}
                          >
                            {categoryName}
                          </span>
                          {tip.read_time && (
                            <>
                              <span className={`text-[10px] ${isActive ? 'text-white/60' : 'text-gray-300'}`}>•</span>
                              <span className={`text-[10px] ${isActive ? 'text-white/80' : 'text-[#5C5566] dark:text-[#9C90A9]'}`}>
                                {tip.read_time}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${
                          isActive
                            ? 'bg-white text-[#C9166F] shadow-sm'
                            : 'bg-gray-100 dark:bg-white/10 text-[#221B2B] dark:text-[#F3EFF6] group-hover:bg-[#C9166F] group-hover:text-white'
                        }`}
                      >
                        <span>Read</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* View All Tips CTA & Progress Dots */}
            <div className="pt-2 flex items-center justify-between gap-4 flex-wrap">
              <Link
                to="/pages/tips"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-[#5D3E85] hover:bg-[#EC268F] text-white text-xs font-extrabold shadow-md hover:shadow-lg transition-all btn-spring group"
              >
                <span>View All Tips & Protocols</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>

              {/* Slide dots indicator */}
              {tipsList.length > 1 && (
                <div className="flex items-center gap-1.5">
                  {tipsList.map((_, dotIdx) => (
                    <button
                      key={dotIdx}
                      type="button"
                      onClick={() => setActiveTipIndex(dotIdx)}
                      aria-label={`Go to tip ${dotIdx + 1}`}
                      className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                        dotIdx === activeTipIndex
                          ? 'w-6 bg-[#C9166F]'
                          : 'w-2 bg-[#5D3E85]/20 dark:bg-white/20 hover:bg-[#5D3E85]/40'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Active Tip Featured Image & Live Preview Card */}
          <div className="lg:col-span-6 h-[440px] sm:h-[540px] rounded-[28px] overflow-hidden bg-gray-100 dark:bg-white/5 border border-[#EADBEE] dark:border-white/10 relative group/visual shadow-lg">
            <img
              key={`tip-img-${activeTip.id || activeTip.slug || activeTipIndex}`}
              src={activeTipImage}
              alt={activeTip.title}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800';
              }}
              className="w-full h-full object-cover transition-all duration-700 ease-out group-hover/visual:scale-105"
            />
            {/* Subtle Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

            {/* Top Badge: Active Tip Category */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
              <span className="px-3.5 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
                {activeTip.category?.name || 'Sanctuary Routine'}
              </span>
            </div>

            {/* Bottom Floating Info Card */}
            <div className="absolute bottom-4 left-4 right-4 z-10 bg-white/95 dark:bg-[#1E1528]/95 backdrop-blur-xl rounded-2xl p-5 border border-white/20 dark:border-white/10 shadow-xl flex flex-col gap-2.5 text-left">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold text-[#5D3E85] dark:text-[#EC268F] uppercase tracking-wider">
                  Featured Glow Tip #{activeTipIndex + 1}
                </span>
                <span className="text-[10px] font-bold text-gray-500 dark:text-[#9C90A9]">
                  {activeTip.read_time || '3 min read'}
                </span>
              </div>
              <h3 className="font-extrabold text-base sm:text-lg text-[#221B2B] dark:text-[#F3EFF6] leading-snug line-clamp-2">
                {activeTip.title}
              </h3>
              {activeTip.excerpt && (
                <p className="text-xs text-gray-600 dark:text-[#C9BED4] line-clamp-2 leading-relaxed">
                  {activeTip.excerpt}
                </p>
              )}
              <div className="flex items-center justify-between pt-1">
                <Link
                  to={activeTip.slug ? `/blog/${activeTip.slug}` : '/pages/tips'}
                  className="text-xs font-bold text-[#C9166F] hover:text-[#EC268F] inline-flex items-center gap-1.5 group/link"
                >
                  <span>Read Full Article & Routine</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-1" />
                </Link>
                <Link
                  to="/pages/tips"
                  className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 hover:underline"
                >
                  All Tips →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. WHAT CLIENTS SAY SECTION (Marquee Auto-Scrolling + Carets + All Reviews CTA) */}
      <section
        className="px-6 sm:px-12 py-16 sm:py-24 max-w-7xl mx-auto relative group/reviews"
        onMouseEnter={() => setIsReviewsHovered(true)}
        onMouseLeave={() => setIsReviewsHovered(false)}
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-9">
          <div>
            <span className="inline-flex items-center px-3.5 py-1 rounded-full bg-white dark:bg-[#1E1528] text-[#5D3E85] dark:text-[#E5C158] text-[10px] sm:text-[11px] font-extrabold tracking-widest  border border-[#EADBEE] dark:border-white/10 shadow-xs self-start mb-2">
              Client Testimonials
            </span>
            <h2 className="text-3xl sm:text-[42px] font-extrabold text-[#221B2B] dark:text-[#F3EFF6] tracking-[-0.035em] leading-[1.1]">
              What clients say
            </h2>
            <span className="text-xs sm:text-sm text-[#5C5566] dark:text-[#9C90A9] mt-1 block">
              4.9 average · 2,400+ genuine reviews
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* View All Reviews Button */}
            <Link
              to="/reviews"
              className="px-5 py-2.5 rounded-full border border-[#5D3E85]/25 dark:border-white/20 text-[#5D3E85] dark:text-[#EC268F] hover:bg-[#5D3E85] hover:text-white dark:hover:bg-[#EC268F] dark:hover:text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 btn-spring"
            >
              <span>All Reviews</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            {/* Navigation Carets */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={scrollReviewsLeft}
                className="w-10 h-10 rounded-full bg-white dark:bg-[#1F1729] border border-[#EADBEE] dark:border-white/12 flex items-center justify-center text-[#221B2B] dark:text-[#F3EFF6] hover:bg-[#5D3E85] hover:text-white dark:hover:bg-[#EC268F] transition-all shadow-xs cursor-pointer active:scale-95"
                title="Scroll Previous"
                aria-label="Previous Reviews"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={scrollReviewsRight}
                className="w-10 h-10 rounded-full bg-white dark:bg-[#1F1729] border border-[#EADBEE] dark:border-white/12 flex items-center justify-center text-[#221B2B] dark:text-[#F3EFF6] hover:bg-[#5D3E85] hover:text-white dark:hover:bg-[#EC268F] transition-all shadow-xs cursor-pointer active:scale-95"
                title="Scroll Next"
                aria-label="Next Reviews"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Marquee Horizontal Scrolling Track */}
        <div
          ref={reviewsScrollRef}
          className="flex gap-6 overflow-x-auto scrollbar-none scroll-smooth pb-4 pt-2 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {allReviewsList.map((r, idx) => (
            <div
              key={r.id || idx}
              className="min-w-[300px] sm:min-w-[360px] md:min-w-[390px] max-w-[420px] shrink-0 bg-white dark:bg-[#1F1729] border border-[#EADBEE] dark:border-white/10 rounded-[24px] p-7 md:p-8 flex flex-col justify-between gap-5 shadow-xs hover:shadow-xl transition-all duration-300 snap-start select-none"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 text-[#E5C158]">
                  {Array.from({ length: Math.min(5, Math.max(1, r.rating || 5)) }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#E5C158] text-[#E5C158]" />
                  ))}
                </div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Check className="w-3 h-3" /> Verified Order
                </span>
              </div>

              <p className="text-sm sm:text-base leading-[1.7] text-[#5C5566] dark:text-[#E4DDEA] font-medium line-clamp-4">
                "{r.text}"
              </p>

              <div className="flex items-center gap-3.5 pt-5 border-t border-[#EADBEE] dark:border-white/10 mt-auto">
                <FacelessAvatar
                  src={r.avatar}
                  name={r.name}
                  className="w-10 h-10"
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-[#221B2B] dark:text-[#F3EFF6] truncate">{r.name}</span>
                  <span className="text-xs text-[#5C5566] dark:text-[#9C90A9] truncate">{r.handle}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. SHOP BY CONCERN SECTION (Managed in Admin Collections Studio) */}
      {dynamicConcernShow && (
        <section className="px-6 sm:px-12 py-16 sm:py-24 max-w-7xl mx-auto text-left">
          <div className="flex flex-col gap-2.5 mb-9">
            <span className="inline-flex items-center px-3.5 py-1 rounded-full bg-white dark:bg-[#1E1528] text-[#5D3E85] dark:text-[#E5C158] text-[10px] sm:text-[11px] font-extrabold tracking-widest  border border-[#EADBEE] dark:border-white/10 shadow-xs self-start">
              {dynamicConcernEyebrow}
            </span>
            <h2 className="text-3xl sm:text-[42px] font-extrabold text-[#221B2B] dark:text-[#F3EFF6] tracking-tight">
              {dynamicConcernTitle}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {dynamicConcerns.map((c, idx) => (
              <Link
                key={c.id || idx}
                to={c.link || '/shop'}
                className="bg-white dark:bg-[#1F1729] border border-[#EADBEE] dark:border-white/8 rounded-[24px] overflow-hidden flex flex-col group hover:shadow-2xl transition-all"
              >
                <div className="aspect-square overflow-hidden bg-gray-100 dark:bg-white/5">
                  <img
                    src={c.image || 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=500'}
                    alt={c.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-6 flex flex-col gap-2.5 flex-1 justify-between text-left">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <h4 className="text-base font-bold text-[#221B2B] dark:text-[#F3EFF6] group-hover:text-[#C9166F] dark:group-hover:text-[#EC268F] transition-colors leading-snug">
                        {c.name}
                      </h4>
                      {c.count && (
                        <span className="text-xs text-[#5C5566] dark:text-[#9C90A9] font-medium shrink-0">
                          {c.count}
                        </span>
                      )}
                    </div>
                    {c.blurb && (
                      <p className="text-xs sm:text-[13px] text-[#5C5566] dark:text-[#C9BED4] leading-relaxed line-clamp-3">
                        {c.blurb}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 6. BLOG & ARTICLES (ROUTINES, EXPLAINED) SECTION */}
      <section className="px-6 sm:px-12 py-16 sm:py-24 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-9">
          <div className="flex flex-col gap-2.5">
            <span className="inline-flex items-center px-3.5 py-1 rounded-full bg-white dark:bg-[#1E1528] text-[#5D3E85] dark:text-[#E5C158] text-[10px] sm:text-[11px] font-extrabold tracking-widest  border border-[#EADBEE] dark:border-white/10 shadow-xs self-start">
              Blog & Articles
            </span>
            <h2 className="text-3xl sm:text-[42px] font-extrabold text-[#221B2B] dark:text-[#F3EFF6] tracking-tight">
              Routines, explained
            </h2>
          </div>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-black/15 dark:border-white/20 text-[#221B2B] dark:text-[#F3EFF6] hover:bg-black/5 dark:hover:bg-white/10 font-semibold text-sm transition-all w-fit btn-spring"
          >
            <span>All articles</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(articles.length > 0 ? articles : [
            { id: 1, title: 'The 5-Day Glow Routine for Hyperpigmentation', excerpt: 'How to combine whitening polish soaps with cold-pressed almond oil for rapid results.', image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=600', published_at: 'Routine Guide' },
            { id: 2, title: 'Why Hydroquinone-Free Skincare is the Safest Choice', excerpt: 'The science of organic herbal extracts, botanical brightening, and long-term skin health.', image: 'https://images.unsplash.com/photo-1512290900672-1f5be4df1d3a?q=80&w=600', published_at: 'Editorial' },
            { id: 3, title: 'Preserving Botanical Potency: Product Storage & Care', excerpt: 'Essential tips on keeping your natural creams and scrubs fresh and active in warm weather.', image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=600', published_at: 'SHOP Tips' }
          ]).map((a) => (
            <Link
              key={a.id}
              to={a.slug ? `/blog/${a.slug}` : '/blog'}
              className="bg-white dark:bg-[#1F1729] border border-[#EADBEE] dark:border-white/8 rounded-[24px] overflow-hidden flex flex-col group hover:shadow-2xl transition-all"
            >
              <div className="aspect-[3/2] overflow-hidden bg-gray-100 dark:bg-white/5">
                <img
                  src={a.image_url || a.image}
                  alt={a.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6 flex flex-col gap-2.5">
                <span className="text-[10px] font-bold tracking-wider  text-[#5D3E85] dark:text-[#EC268F]">
                  {a.published_at || 'Routine Guide'}
                </span>
                <h4 className="text-base font-bold text-[#221B2B] dark:text-[#F3EFF6] group-hover:text-[#C9166F] dark:group-hover:text-[#EC268F] transition-colors leading-snug">
                  {a.title}
                </h4>
                <p className="text-xs sm:text-[13px] text-[#5C5566] dark:text-[#C9BED4] leading-relaxed">
                  {a.excerpt}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 7. FROM THE STUDIO (@dansolambeautyhome) SECTION */}
      <section className="px-6 sm:px-12 py-16 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div className="flex flex-col gap-2">
            <span className="inline-flex items-center px-3.5 py-1 rounded-full bg-white dark:bg-[#1E1528] text-[#5D3E85] dark:text-[#E5C158] text-[10px] sm:text-[11px] font-extrabold tracking-widest  border border-[#EADBEE] dark:border-white/10 shadow-xs self-start">
              @dansolambeautyhome
            </span>
            <h2 className="text-3xl sm:text-[42px] font-extrabold text-[#221B2B] dark:text-[#F3EFF6] tracking-tight">
              From the studio
            </h2>
          </div>
          <a
            href={settings.instagram_url || 'https://instagram.com/dansolambeautyhome'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-black/15 dark:border-white/20 text-[#221B2B] dark:text-[#F3EFF6] hover:bg-black/5 dark:hover:bg-white/10 font-semibold text-sm transition-all w-fit btn-spring"
          >
            <span>Follow on Instagram</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {studioProductPhotos.map((item, i) => (
            <Link
              key={i}
              to={item.slug ? `/product/${item.slug}` : '/shop'}
              className="aspect-square rounded-2xl overflow-hidden bg-white dark:bg-[#1E1528] border border-[#EADBEE] dark:border-white/8 group relative shadow-2xs hover:shadow-xl transition-all duration-300 block"
            >
              <img
                src={item.url}
                alt={item.name || 'Dansolam Product'}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-contain p-2 group-hover:scale-108 transition-transform duration-500"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/storage/products/21.png';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#5D3E85]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 text-left">
                <span className="text-[10px] font-bold text-white leading-tight line-clamp-2 drop-shadow-xs">
                  {item.name}
                </span>
                <span className="text-[8px] text-pink-200 font-extrabold  tracking-wider mt-0.5">
                  View Product &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 8. COMMON QUESTIONS (FAQ ACCORDION) SECTION */}
      <section className="px-6 sm:px-12 py-16 sm:py-24 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          <div className="lg:col-span-5 flex flex-col gap-4">
            <span className="inline-flex items-center px-3.5 py-1 rounded-full bg-white dark:bg-[#1E1528] text-[#5D3E85] dark:text-[#E5C158] text-[10px] sm:text-[11px] font-extrabold tracking-widest  border border-[#EADBEE] dark:border-white/10 shadow-xs self-start">
              Before you order
            </span>
            <h2 className="text-3xl sm:text-[42px] font-extrabold text-[#221B2B] dark:text-[#F3EFF6] tracking-tight">
              Common questions
            </h2>
            <p className="text-sm text-[#5C5566] dark:text-[#C9BED4] leading-relaxed">
              Anything not covered here, our agent answers on WhatsApp within the hour, Monday to Saturday.
            </p>
            <a
              href={`https://wa.me/${(settings.whatsapp_number || '2348000000000').replace(/[^0-9]/g, '')}?text=Hello%20Dansolam,%20I%20have%20a%20question%20before%20placing%20an%20order.`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all w-fit mt-2 btn-spring"
            >
              <MessageCircle className="w-4 h-4" />
              <span>CHAT US</span>
            </a>
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

      {/* 9. TRUST BADGES SECTION */}
      <section className="px-6 sm:px-12 py-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#1F1729] border border-[#EADBEE] dark:border-white/8 rounded-2xl p-6 flex flex-col gap-2">
            <Truck className="w-5 h-5 text-[#5D3E85] dark:text-[#E5C158]" />
            <span className="text-[15px] font-bold text-[#221B2B] dark:text-[#F3EFF6]">Express delivery</span>
            <span className="text-xs text-[#5C5566] dark:text-[#9C90A9]">Nationwide & worldwide shipping</span>
          </div>
          <div className="bg-white dark:bg-[#1F1729] border border-[#EADBEE] dark:border-white/8 rounded-2xl p-6 flex flex-col gap-2">
            <ShieldCheck className="w-5 h-5 text-[#5D3E85] dark:text-[#E5C158]" />
            <span className="text-[15px] font-bold text-[#221B2B] dark:text-[#F3EFF6]">100% authentic</span>
            <span className="text-xs text-[#5C5566] dark:text-[#9C90A9]">Hand-curated organic formulas</span>
          </div>
          <div className="bg-white dark:bg-[#1F1729] border border-[#EADBEE] dark:border-white/8 rounded-2xl p-6 flex flex-col gap-2">
            <RefreshCw className="w-5 h-5 text-[#5D3E85] dark:text-[#E5C158]" />
            <span className="text-[15px] font-bold text-[#221B2B] dark:text-[#F3EFF6]">14-day returns</span>
            <span className="text-xs text-[#5C5566] dark:text-[#9B8EA9]">Hassle-free sealed exchanges</span>
          </div>
          <div className="bg-white dark:bg-[#1F1729] border border-[#EADBEE] dark:border-white/8 rounded-2xl p-6 flex flex-col gap-2">
            <MessageCircle className="w-5 h-5 text-[#5D3E85] dark:text-[#E5C158]" />
            <span className="text-[15px] font-bold text-[#221B2B] dark:text-[#F3EFF6]">WhatsApp agent</span>
            <span className="text-xs text-[#5C5566] dark:text-[#9C90A9]">Skincare help, Mon–Sat</span>
          </div>
        </div>
      </section>

      {/* Quick View Modal */}
      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
        />
      )}
    </div>
  );
}
