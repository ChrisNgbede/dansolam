import { getCurrencySymbol } from '../../utils/currency';
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Star, Heart, ShoppingBag, MessageCircle, ChevronLeft, ChevronRight, Check, Eye, ShieldCheck, Truck, RefreshCw, Camera, ExternalLink } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useWishlistStore } from '../../store/wishlistStore';
import SEO from '../../components/seo/SEO';
import CaptchaWidget from '../../components/ui/CaptchaWidget';

const getCategoryImageUrl = (cat) => {
  if (cat?.image_url && cat.image_url !== '/images/categories/placeholder.jpg' && cat.image_url.trim() !== '') {
    return cat.image_url;
  }
  if (cat?.banner_url && cat.banner_url.trim() !== '') {
    return cat.banner_url;
  }
  const slug = (cat?.slug || cat?.name || '').toLowerCase();
  if (slug.includes('dresses') || slug.includes('dress')) {
    return 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=600&auto=format&fit=crop';
  }
  if (slug.includes('jumpsuits') || slug.includes('jumpsuit')) {
    return 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?q=80&w=600&auto=format&fit=crop';
  }
  if (slug.includes('shoe') || slug.includes('sneaker') || slug.includes('footwear')) {
    return 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=600&auto=format&fit=crop';
  }
  if (slug.includes('handbag') || slug.includes('bag') || slug.includes('purse')) {
    return 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=600&auto=format&fit=crop';
  }
  if (slug.includes('accessor') || slug.includes('jewel')) {
    return 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=600&auto=format&fit=crop';
  }
  if (slug.includes('corporate') || slug.includes('work') || slug.includes('suit')) {
    return 'https://images.unsplash.com/photo-1591369822096-ffd140ec948f?q=80&w=600&auto=format&fit=crop';
  }
  if (slug.includes('evening') || slug.includes('gown') || slug.includes('party')) {
    return 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=600&auto=format&fit=crop';
  }
  if (slug.includes('casual') || slug.includes('denim')) {
    return 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop';
  }
  return 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=600&auto=format&fit=crop';
};

export default function Home() {
  const currencySymbol = getCurrencySymbol();
  const navigate = useNavigate();
  const [activeSlide, setActiveSlide] = useState(0);
  const [marqueeOffset, setMarqueeOffset] = useState(30);
  const [arrivalIndex, setArrivalIndex] = useState(0);
  const [arrivalPaused, setArrivalPaused] = useState(false);
  const arrivalsTrackRef = useRef(null);

  // Newsletter states
  const [newsEmail, setNewsEmail] = useState('');
  const [newsSuccess, setNewsSuccess] = useState('');
  const [newsError, setNewsError] = useState('');
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsCaptchaVerified, setNewsCaptchaVerified] = useState(false);

  // Recently viewed states
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  // Flash Sale States
  const [showFlashSale, setShowFlashSale] = useState(false);
  const [currentFlashIndex, setCurrentFlashIndex] = useState(0);
  const [flashTimeLeft, setFlashTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0, total: 0 });

  // Fetch Homepage Banners
  const { data: bannersRes } = useQuery({
    queryKey: ['banners'],
    queryFn: () => fetch('/api/banners').then(res => res.json())
  });

  // Fetch Categories
  const { data: categoriesRes } = useQuery({
    queryKey: ['categories'],
    queryFn: () => fetch('/api/categories').then(res => res.json())
  });

  // Fetch Featured Products (using the products API with limit=4)
  const { data: productsRes } = useQuery({
    queryKey: ['products-featured'],
    queryFn: () => fetch('/api/products?limit=4&sort=popular').then(res => res.json())
  });

  // Fetch up to ten products for the auto-swiping New Arrivals rail.
  const { data: newArrivalsRes } = useQuery({
    queryKey: ['products-new-arrivals'],
    queryFn: () => fetch('/api/products?limit=10&sort=newest').then(res => res.json())
  });

  // Fetch Featured Brands
  const { data: brandsRes } = useQuery({
    queryKey: ['brands'],
    queryFn: () => fetch('/api/brands').then(res => res.json())
  });
  const brands = brandsRes?.data || [];

  // Fetch Collections
  const { data: collectionsRes } = useQuery({
    queryKey: ['collections'],
    queryFn: () => fetch('/api/collections').then(res => res.json())
  });
  const collections = collectionsRes?.data || [];

  // Fetch Settings
  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: () => fetch('/api/settings').then(res => res.json())
  });
  const settings = settingsData?.data?.settings || {};
  const { data: instagramFeedRes } = useQuery({
    queryKey: ['instagram-feed'],
    queryFn: () => fetch('/api/instagram-feed').then(res => res.json()),
    staleTime: 30 * 60 * 1000,
    retry: false,
  });
  const instagramProfileUrl = settings.instagram_url || 'https://www.instagram.com/fairqueen_collections/';
  const instagramHandle = settings.instagram_handle || (() => {
    try {
      return `@${new URL(instagramProfileUrl).pathname.split('/').filter(Boolean)[0] || 'fairqueencollections'}`;
    } catch {
      return '@fairqueencollections';
    }
  })();
  const liveInstagramPosts = instagramFeedRes?.data || [];
  const allowOverselling = settings.allow_overselling === 'true' || settings.allow_overselling === true || settings.allow_overselling === '1' || settings.allow_overselling === 1;
  const whatsappNumber = String(settings.whatsapp_number || '').replace(/[^0-9]/g, '');

  // Fetch Flash Sale Products
  const { data: flashSaleRes } = useQuery({
    queryKey: ['products-flash-sale'],
    queryFn: () => fetch('/api/products?is_flash_sale=true').then(res => res.json())
  });
  const flashSaleProducts = flashSaleRes?.data || [];

  // Fetch Reviews list for homepage swiper
  const { data: reviewsRes } = useQuery({
    queryKey: ['storefront-reviews-home'],
    queryFn: () => fetch('/api/reviews?limit=10').then(res => res.json())
  });

  const rawReviews = reviewsRes?.data?.data || reviewsRes?.data || [];
  const dynamicReviews = Array.isArray(rawReviews) ? rawReviews : [];

  const defaultReviews = [
    {
      id: 'static-1',
      rating: 5,
      comment: "The quality of the Jumpsuit is unmatched! I ordered size 16 in Abuja, and it was delivered to my doorstep within 4 hours. Absolute luxury.",
      customer_name: "Fatima A., Wuse II"
    },
    {
      id: 'static-2',
      rating: 5,
      comment: "Fitted corporate double-breasted suit set fits like a glove. Their WhatsApp customer support answered all my sizing doubts instantly.",
      customer_name: "Chidi E., Gwarinpa"
    },
    {
      id: 'static-3',
      rating: 5,
      comment: "Exquisite fabrics and attention to detail. The colors are exactly as shown in the pictures. Highly recommended!",
      customer_name: "Amara K., Lagos"
    },
    {
      id: 'static-4',
      rating: 5,
      comment: "Excellent customer service and prompt delivery. The package arrived beautifully wrapped. Will definitely buy again.",
      customer_name: "Zainab U., Kaduna"
    }
  ];

  const reviewsList = dynamicReviews.length > 0 ? dynamicReviews.slice(0, 10) : defaultReviews;

  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);

  useEffect(() => {
    if (reviewsList.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentReviewIndex((prev) => (prev + 1) % reviewsList.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [reviewsList]);

  // 1. Flash Sale Countdown Timer logic
  useEffect(() => {
    const isShow = settings.flash_sale_show === 'true' || settings.flash_sale_show === true;
    const endTimeStr = settings.flash_sale_end_time;
    if (!isShow || !endTimeStr || flashSaleProducts.length === 0) {
      setShowFlashSale(false);
      return;
    }

    const targetDate = new Date(endTimeStr).getTime();
    
    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        setFlashTimeLeft({ hours: 0, minutes: 0, seconds: 0, total: 0 });
        setShowFlashSale(false);
      } else {
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setFlashTimeLeft({ hours, minutes, seconds, total: difference });
      }
    };

    // Run immediately and start interval
    updateCountdown();
    const intervalId = setInterval(updateCountdown, 1000);

    // Show popup modal after a 2-second delay if not dismissed in current session
    const isDismissed = sessionStorage.getItem('fairqueen_flash_dismissed');
    if (!isDismissed) {
      const delayId = setTimeout(() => {
        setShowFlashSale(true);
      }, 2000);
      return () => {
        clearInterval(intervalId);
        clearTimeout(delayId);
      };
    }

    return () => clearInterval(intervalId);
  }, [settings.flash_sale_show, settings.flash_sale_end_time, flashSaleProducts]);

  // 2. Swipe rotation logic (cycles every 5 seconds)
  useEffect(() => {
    if (!showFlashSale || flashSaleProducts.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentFlashIndex(prev => (prev + 1) % flashSaleProducts.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [showFlashSale, flashSaleProducts]);

  const banners = bannersRes?.data || [
    {
      eyebrow: 'New Season Drops',
      title: 'Step Into Your',
      accent_title: 'Signature Style',
      subtitle: 'Shop elegant designer clothing, shoes, bags and accessories made for confident women who love standout fashion. Discover premium looks and fast delivery from Abuja to your doorstep.',
      image_url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200&auto=format&fit=crop',
      link_url: '/shop',
      primary_cta_label: 'Explore Shop',
      secondary_cta_label: 'WhatsApp Order',
      top_kicker: 'Private Edit',
      top_text: 'Made for your entrance.',
      bottom_kicker: 'Worldwide delivery',
      bottom_text: 'Curated in Abuja',
    }
  ];

  const categories = categoriesRes?.data || [];
  const featuredProducts = productsRes?.data?.data || [];
  const newArrivals = newArrivalsRes?.data?.data || [];

  const scrollArrivalsTo = (index) => {
    const track = arrivalsTrackRef.current;
    const item = track?.children?.[index];
    if (!track || !item) return;
    track.scrollTo({ left: item.offsetLeft - track.offsetLeft, behavior: 'smooth' });
  };

  const moveArrivals = (direction) => {
    if (newArrivals.length <= 1) return;
    const next = (arrivalIndex + direction + newArrivals.length) % newArrivals.length;
    setArrivalIndex(next);
    scrollArrivalsTo(next);
  };

  useEffect(() => {
    if (newArrivals.length <= 1 || arrivalPaused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const interval = window.setInterval(() => {
      setArrivalIndex(current => {
        const next = (current + 1) % newArrivals.length;
        scrollArrivalsTo(next);
        return next;
      });
    }, 4000);
    return () => window.clearInterval(interval);
  }, [newArrivals.length, arrivalPaused]);

  // Load recently viewed on mount
  useEffect(() => {
    try {
      const items = JSON.parse(localStorage.getItem('recently_viewed') || '[]');
      if (items.length > 0) {
        setRecentlyViewed(items.slice(0, 4));
      }
    } catch (e) {
      console.error('Error loading recently viewed', e);
    }
  }, []);

  const handlePrevSlide = () => {
    setActiveSlide(prev => (prev === 0 ? banners.length - 1 : prev - 1));
  };

  const handleNextSlide = () => {
    setActiveSlide(prev => (prev === banners.length - 1 ? 0 : prev + 1));
  };

  // Autoplay hero slider
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(handleNextSlide, 6000);
    return () => clearInterval(interval);
  }, [banners]);

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    const isCaptchaEnabled = settings.captcha_enabled === 'true' || settings.captcha_enabled === true;
    const isNewsEnabled = settings.captcha_on_newsletter === undefined ? true : (settings.captcha_on_newsletter === 'true' || settings.captcha_on_newsletter === true);
    if (isCaptchaEnabled && isNewsEnabled && !newsCaptchaVerified) {
      setNewsError('Please complete the security verification challenge before subscribing.');
      return;
    }
    setNewsSuccess('');
    setNewsError('');
    setNewsLoading(true);

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email: newsEmail })
      });
      const data = await res.json();
      setNewsLoading(false);

      if (data.success) {
        setNewsSuccess(data.message);
        setNewsEmail('');
      } else {
        setNewsError(data.message || 'Subscription failed');
      }
    } catch (err) {
      setNewsLoading(false);
      setNewsError('Network error subscribing to newsletter.');
    }
  };

  return (
    <div className="luxury-home flex flex-col gap-20 md:gap-32">
      <SEO title="Ecommerce Luxury Designer Clothing, Shoes & Bags" description="Shop standout designer clothing, elegant shoes, and luxury handbags at FairQueen Collections. Elegant fashion with nationwide delivery." />
      
      {/* 1. EDITORIAL TWO-COLUMN HERO SLIDER */}
      <section className="luxury-cinematic-hero relative overflow-hidden min-h-[calc(100svh-2rem)] flex items-center pt-24 md:pt-20 -mt-[96px]">
        {/* Background Layered Decorative Shapes */}
        <div className="absolute top-1/4 left-10 w-96 h-96 bg-[#FAF3E8] rounded-full blur-3xl opacity-60 pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-primary/5 rounded-full blur-3xl opacity-60 pointer-events-none" />

        <div className="relative w-full max-w-[1440px] mx-auto px-4 md:px-8 lg:px-12 z-10 flex flex-col justify-center h-full pt-16 md:pt-20">
          <div className="luxury-hero-viewport overflow-hidden relative w-full h-full">
            <div className="luxury-hero-track flex transition-transform duration-700 ease-in-out" style={{ transform: `translate3d(-${activeSlide * 100}%, 0, 0)` }}>
              {banners.map((slide, idx) => (
                <div key={idx} className="luxury-hero-slide w-full flex-shrink-0 flex flex-col md:flex-row items-center gap-8 md:gap-12 relative min-w-full">
                  
                  {/* Left Column: 42% on desktop */}
                  <div className="luxury-hero-copy w-full md:w-[44%] flex flex-col items-start gap-6 z-25 text-left">
                    {(slide.eyebrow ?? 'New Season Drops') && (
                      <span className="text-[10px] uppercase tracking-widest text-primary font-bold bg-primary/10 px-3.5 py-1.5 rounded-full border border-primary/15">
                        ✨ {slide.eyebrow ?? 'New Season Drops'}
                      </span>
                    )}
                    <h1 className="font-serif font-bold text-5xl md:text-6xl lg:text-[78px] leading-[0.96] text-gray-900 tracking-[-0.055em]">
                      {slide.title || 'Step Into Your'} {(slide.accent_title ?? 'Signature Style') && <span className="text-primary block font-serif">{slide.accent_title ?? 'Signature Style'}</span>}
                    </h1>
                    <p className="text-gray-550 text-xs md:text-sm leading-relaxed max-w-md font-sans">
                      {slide.subtitle || 'Shop elegant designer clothing, shoes, bags and accessories made for confident women who love standout fashion.'}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto mt-2">
                      {(slide.primary_cta_label ?? 'Explore Shop') && (
                        <a
                          href={slide.link_url || '/shop'}
                          className="px-6 py-3.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-full shadow-sm transition-all uppercase tracking-wider hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                        >
                          {slide.primary_cta_label ?? 'Explore Shop'}
                        </a>
                      )}
                      {(slide.secondary_cta_label ?? 'WhatsApp Order') && (
                        <a
                          href={slide.secondary_cta_url || `https://wa.me/${whatsappNumber}?text=Hello%20FairQueen%20Collections%2C%20I'm%20looking%20for%20available%2520sizes%2520in%2520the%2520new%2520arrivals.`}
                          target={(slide.secondary_cta_url || '').startsWith('/') ? undefined : '_blank'}
                          rel={(slide.secondary_cta_url || '').startsWith('/') ? undefined : 'noopener noreferrer'}
                          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white hover:bg-gray-50 text-gray-800 text-xs font-semibold rounded-full border border-gray-200 shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <MessageCircle className="w-4 h-4 text-[#25D366] fill-[#25D366]" />
                          {slide.secondary_cta_label ?? 'WhatsApp Order'}
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Right Column: 58% on desktop */}
                  <div className="luxury-hero-visual w-full md:w-[56%] flex items-center justify-center relative">
                    <div className="w-full aspect-[4/5] md:aspect-[5/4] rounded-[32px] overflow-hidden bg-primary/10 shadow-xl border border-white relative">
                      <img
                        loading={idx === activeSlide ? 'eager' : 'lazy'}
                        decoding="async"
                        fetchPriority={idx === activeSlide ? 'high' : 'low'}
                        src={slide.image_url || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=600'}
                        alt="Campaign Slide"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=85&w=1400&auto=format&fit=crop';
                        }}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                      />
                      {((slide.top_kicker ?? 'Private Edit') || (slide.top_text ?? 'Made for your entrance.')) && (
                        <div className="luxury-hero-float luxury-hero-float-top">
                          <span>{slide.top_kicker ?? 'Private Edit'}</span>
                          <strong>{slide.top_text ?? 'Made for your entrance.'}</strong>
                        </div>
                      )}
                      {((slide.bottom_kicker ?? 'Worldwide delivery') || (slide.bottom_text ?? 'Curated in Abuja')) && (
                        <div className="luxury-hero-float luxury-hero-float-bottom">
                          <span>{slide.bottom_kicker ?? 'Worldwide delivery'}</span>
                          <strong>{slide.bottom_text ?? 'Curated in Abuja'}</strong>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Carousel Manual Controls */}
        {banners.length > 1 && (
          <>
            <button
              onClick={handlePrevSlide}
              className="luxury-hero-control luxury-hero-control-prev absolute p-2.5 bg-white hover:bg-gray-50 text-gray-800 rounded-full transition-all z-30 cursor-pointer"
              aria-label="Previous Slide"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextSlide}
              className="luxury-hero-control luxury-hero-control-next absolute p-2.5 bg-white hover:bg-gray-50 text-gray-800 rounded-full transition-all z-30 cursor-pointer"
              aria-label="Next Slide"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            
            {/* Dots Pagination */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-30">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSlide(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    activeSlide === i ? 'bg-primary w-5' : 'bg-gray-300 w-2'
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </section>

      {/* IMAGE-LED DUAL EDITORIAL MARQUEE */}
      {categories.length > 0 && (
        <section className="luxury-image-marquee w-full overflow-hidden py-8 md:py-12" aria-label="Shop categories">
          <button type="button" onClick={() => setMarqueeOffset(value => Math.max(0, value - 5))} className="luxury-marquee-control luxury-marquee-control-left" aria-label="Rewind category marquee">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button type="button" onClick={() => setMarqueeOffset(value => value + 5)} className="luxury-marquee-control luxury-marquee-control-right" aria-label="Advance category marquee">
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="luxury-marquee-row luxury-marquee-forward" style={{ animationDelay: `-${marqueeOffset}s` }}>
            {[...categories, ...categories].map((cat, idx) => (
              <Link key={`forward-${cat.id}-${idx}`} to={`/shop?category=${cat.slug}`} className="luxury-marquee-card group">
                <img src={getCategoryImageUrl(cat)} alt={cat.name} loading="lazy" decoding="async" />
                <span>{cat.name}</span>
              </Link>
            ))}
          </div>
          <div className="luxury-marquee-row luxury-marquee-reverse" style={{ animationDelay: `-${marqueeOffset}s` }}>
            {[...categories].reverse().concat([...categories].reverse()).map((cat, idx) => (
              <Link key={`reverse-${cat.id}-${idx}`} to={`/shop?category=${cat.slug}`} className="luxury-marquee-card group">
                <img src={getCategoryImageUrl(cat)} alt={cat.name} loading="lazy" decoding="async" />
                <span>{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 2. VALUE PROPOSITIONS & BENEFIT CARDS */}
      <section className="px-6 md:px-12 max-w-6xl mx-auto w-full -mt-4">
        <div className="text-center mb-8 md:mb-10">
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary bg-amber-50 dark:bg-amber-950/60 px-3 py-1 rounded-full border border-amber-200/50 dark:border-amber-900/40 inline-block shadow-3xs">The FairQueen Standard</span>
          <h2 className="font-serif font-bold text-3xl md:text-5xl text-gray-950 dark:text-white mt-3">Why Shop With Us</h2>
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-3 max-w-lg mx-auto leading-relaxed">Thoughtful service, secure shopping and dependable delivery for every carefully selected piece.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
          <div className="bg-white dark:bg-[#161616] border border-gray-200/90 dark:border-gray-800 rounded-2xl p-5 md:p-6 shadow-xs hover:shadow-md hover:-translate-y-1 hover:border-amber-400/60 dark:hover:border-amber-500/50 transition-all duration-300 flex items-start gap-4 text-left group">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/60 rounded-xl shrink-0 group-hover:scale-110 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all duration-300">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs md:text-sm text-gray-950 dark:text-white uppercase tracking-wider group-hover:text-primary transition-colors">Fast Shipping</h4>
              <p className="text-xs text-gray-650 dark:text-gray-300 mt-1.5 leading-relaxed font-medium">Abuja local delivery same day. Nationwide within 3–5 business days.</p>
            </div>
          </div>
          <div className="bg-white dark:bg-[#161616] border border-gray-200/90 dark:border-gray-800 rounded-2xl p-5 md:p-6 shadow-xs hover:shadow-md hover:-translate-y-1 hover:border-amber-400/60 dark:hover:border-amber-500/50 transition-all duration-300 flex items-start gap-4 text-left group">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/60 rounded-xl shrink-0 group-hover:scale-110 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all duration-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs md:text-sm text-gray-950 dark:text-white uppercase tracking-wider group-hover:text-primary transition-colors">Secure Payment</h4>
              <p className="text-xs text-gray-650 dark:text-gray-300 mt-1.5 leading-relaxed font-medium">Shop safely using Paystack, Flutterwave, COD, or Bank Transfer.</p>
            </div>
          </div>
          <div className="bg-white dark:bg-[#161616] border border-gray-200/90 dark:border-gray-800 rounded-2xl p-5 md:p-6 shadow-xs hover:shadow-md hover:-translate-y-1 hover:border-amber-400/60 dark:hover:border-amber-500/50 transition-all duration-300 flex items-start gap-4 text-left group">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/60 rounded-xl shrink-0 group-hover:scale-110 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all duration-300">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs md:text-sm text-gray-950 dark:text-white uppercase tracking-wider group-hover:text-primary transition-colors">Easy Exchange</h4>
              <p className="text-xs text-gray-650 dark:text-gray-300 mt-1.5 leading-relaxed font-medium">Simple sizes swap or store credit refund within 7 days of drop.</p>
            </div>
          </div>
          <div className="bg-white dark:bg-[#161616] border border-gray-200/90 dark:border-gray-800 rounded-2xl p-5 md:p-6 shadow-xs hover:shadow-md hover:-translate-y-1 hover:border-amber-400/60 dark:hover:border-amber-500/50 transition-all duration-300 flex items-start gap-4 text-left group">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/60 rounded-xl shrink-0 group-hover:scale-110 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all duration-300">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs md:text-sm text-gray-950 dark:text-white uppercase tracking-wider group-hover:text-primary transition-colors">WhatsApp Support</h4>
              <p className="text-xs text-gray-650 dark:text-gray-300 mt-1.5 leading-relaxed font-medium">Chat directly with ecommerce styling assistants for fit and details.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SHOP BY EDITORIAL CATEGORY CARDS */}
      <section className="px-6 md:px-12 max-w-6xl mx-auto w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-serif font-bold text-2xl md:text-3xl text-gray-900">Shop by Category</h2>
            <p className="text-xs text-gray-550 mt-1">Curated fashion elements designed for standout looks</p>
          </div>
          <Link to="/shop" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
            See All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.slice(0, 4).map((cat) => (
            <Link
              key={cat.id}
              to={`/shop?category=${cat.slug}`}
              className="group relative h-48 md:h-56 rounded-2xl overflow-hidden bg-gray-100 flex items-end p-5 shadow-sm border border-gray-100"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent z-10" />
              <img loading="lazy" decoding="async"
                src={getCategoryImageUrl(cat)}
                alt={cat.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="relative z-20 flex items-center gap-1 text-white">
                <span className="font-semibold text-xs md:text-sm tracking-wider uppercase">
                  {cat.name}
                </span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. ACTIVE COLLECTIONS EDITORIAL */}
      {collections.length > 0 && (
        <section className="px-6 md:px-12 max-w-6xl mx-auto w-full">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-serif font-bold text-2xl md:text-3xl text-gray-900">Featured Collections</h2>
              <p className="text-xs text-gray-550 mt-1">Explore our signature designer collection campaigns</p>
            </div>
            <Link to="/shop" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
              See All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {collections.map((coll) => (
              <Link
                key={coll.id}
                to={`/shop?collection=${coll.id}`}
                className="group relative h-64 rounded-3xl overflow-hidden bg-gray-150 flex flex-col justify-end p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent z-10 transition-opacity group-hover:from-black/90" />
                
                {coll.image_url ? (
                  <img loading="lazy" decoding="async"
                    src={coll.image_url}
                    alt={coll.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-primary/25 to-primary-hover/20 flex items-center justify-center">
                    <span className="text-white/40 text-xs tracking-wider uppercase font-semibold">FairQueen Collections</span>
                  </div>
                )}
                
                <div className="relative z-20 flex flex-col gap-1.5">
                  <h3 className="font-serif font-bold text-white text-base md:text-lg tracking-wide uppercase group-hover:text-primary transition-colors">
                    {coll.name}
                  </h3>
                  {coll.description && (
                    <p className="text-[11px] text-gray-300 font-medium leading-relaxed max-w-sm opacity-90 line-clamp-2">
                      {coll.description}
                    </p>
                  )}
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1 mt-1 group-hover:translate-x-1 transition-all">
                    Explore Collection <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 5. SHOP BY SIZE GRID BUTTONS */}
      <section className="px-6 md:px-12 max-w-6xl mx-auto w-full">
        <div className="mb-6 text-left">
          <h2 className="font-serif font-bold text-2xl md:text-3xl text-gray-900">Shop by Size</h2>
          <p className="text-xs text-gray-550 mt-1">Select your fit to browse available ecommerce stocks directly</p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {['UK 8', 'UK 10', 'UK 12', 'UK 14', 'UK 16', 'UK 18', 'EU 37', 'EU 38', 'EU 39', 'EU 40', 'EU 41'].map((sz) => (
            <button
              key={sz}
              onClick={() => navigate(`/shop?size=${encodeURIComponent(sz)}`)}
              className="group px-5 py-3 bg-[#FAF9F6]/45 hover:bg-primary hover:text-white border border-gray-150/60 hover:border-primary rounded-2xl text-xs font-bold text-gray-800 transition-all flex items-center gap-1.5 shadow-xs active:scale-95 cursor-pointer"
            >
              <span>{sz}</span>
              <span className="text-[9px] text-gray-400 group-hover:text-white font-normal transition-colors">Select</span>
            </button>
          ))}
        </div>
      </section>

      {/* 6. NEW ARRIVALS PRODUCT GRID */}
      <section className="px-6 md:px-12 max-w-6xl mx-auto w-full">
        <div className="flex items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="font-serif font-bold text-2xl md:text-3xl text-gray-900 dark:text-white">New Arrivals</h2>
            <p className="text-xs text-gray-550 dark:text-gray-400 mt-1">Freshly stocked luxury fits from our design studio</p>
          </div>
          <div className="flex items-center gap-2">
            {newArrivals.length > 1 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => moveArrivals(-1)}
                  className="flex h-11 w-11 md:h-12 md:w-12 items-center justify-center rounded-full bg-gray-900 dark:bg-gray-800 text-white transition-all hover:bg-primary shadow-md active:scale-95 cursor-pointer border-0"
                  aria-label="Previous new arrival"
                >
                  <ChevronLeft className="h-6 w-6 stroke-[3] text-white" />
                </button>
                <button
                  type="button"
                  onClick={() => moveArrivals(1)}
                  className="flex h-11 w-11 md:h-12 md:w-12 items-center justify-center rounded-full bg-gray-900 dark:bg-gray-800 text-white transition-all hover:bg-primary shadow-md active:scale-95 cursor-pointer border-0"
                  aria-label="Next new arrival"
                >
                  <ChevronRight className="h-6 w-6 stroke-[3] text-white" />
                </button>
              </div>
            )}
            <Link to="/shop?sort=newest" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 whitespace-nowrap ml-2">
              See All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Carousel Track with Hover Caret Overlay Buttons when > 4 items */}
        <div className="relative group/arrivals">
          {newArrivals.length > 4 && (
            <>
              {/* Left Floating Caret Button */}
              <button
                type="button"
                onClick={() => moveArrivals(-1)}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-6 z-30 w-12 h-12 md:w-14 md:h-14 rounded-full bg-white dark:bg-[#1f1f1f] text-gray-900 dark:text-white border border-gray-200 dark:border-transparent shadow-xl hover:scale-110 active:scale-95 opacity-0 group-hover/arrivals:opacity-100 transition-all duration-300 flex items-center justify-center cursor-pointer pointer-events-auto"
                aria-label="Previous items"
              >
                <ChevronLeft className="w-7 h-7 md:w-8 md:h-8 stroke-[2.5] text-gray-900 dark:text-white" />
              </button>

              {/* Right Floating Caret Button */}
              <button
                type="button"
                onClick={() => moveArrivals(1)}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-6 z-30 w-12 h-12 md:w-14 md:h-14 rounded-full bg-white dark:bg-[#1f1f1f] text-gray-900 dark:text-white border border-gray-200 dark:border-transparent shadow-xl hover:scale-110 active:scale-95 opacity-0 group-hover/arrivals:opacity-100 transition-all duration-300 flex items-center justify-center cursor-pointer pointer-events-auto"
                aria-label="Next items"
              >
                <ChevronRight className="w-7 h-7 md:w-8 md:h-8 stroke-[2.5] text-gray-900 dark:text-white" />
              </button>
            </>
          )}

          <div
            ref={arrivalsTrackRef}
            onMouseEnter={() => setArrivalPaused(true)}
            onMouseLeave={() => setArrivalPaused(false)}
            onTouchStart={() => setArrivalPaused(true)}
            onTouchEnd={() => window.setTimeout(() => setArrivalPaused(false), 1500)}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-3 [scrollbar-width:none] md:gap-6 [&::-webkit-scrollbar]:hidden"
            aria-label="New arrivals carousel"
          >
            {newArrivals.map((prod) => (
              <div key={prod.id} className="min-w-0 shrink-0 basis-[calc((100%_-_1rem)/2)] snap-start lg:basis-[calc((100%_-_4.5rem)/4)]">
                <ProductCard product={prod} />
              </div>
            ))}
          </div>
        </div>

        {newArrivals.length > 1 && (
          <div className="mt-3 flex justify-center gap-1.5" aria-hidden="true">
            {newArrivals.map((product, index) => (
              <span
                key={product.id}
                className={`h-1.5 rounded-full transition-all duration-300 ${index === arrivalIndex ? 'w-5 bg-primary' : 'w-1.5 bg-gray-200 dark:bg-gray-800'}`}
              />
            ))}
          </div>
        )}
      </section>

      {/* 7. QUEEN'S SPOTLIGHT & BEST SELLERS */}
      {featuredProducts.length > 0 && (
        <section className="px-6 md:px-12 max-w-6xl mx-auto w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-2 border-b border-gray-100 pb-4">
            <div>
              <h2 className="font-serif font-bold text-2xl md:text-3xl text-gray-900">Featured Spotlight</h2>
              <p className="text-xs text-gray-550 mt-1">Our best sellers and featured ecommerce picks of the week</p>
            </div>
            <span className="text-[9px] text-primary bg-primary/10 px-3 py-1.5 rounded-full font-bold uppercase tracking-wider self-start md:self-auto border border-primary/15">
              👑 Selected Fits
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {/* Left Column: Trending Lists */}
            <div className="flex flex-col gap-4">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b pb-2">Trending Fits</h3>
              {featuredProducts.slice(1, 3).map((prod) => (
                <HorizontalProductRow key={prod.id} product={prod} />
              ))}
            </div>

            {/* Middle Column: Spotlight Card */}
            {featuredProducts[0] && (
              <div className="bg-white border border-primary/20 rounded-3xl p-6 flex flex-col gap-5 shadow-sm hover:shadow-md transition-all relative">
                <span className="absolute top-5 right-5 bg-primary text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider z-20">
                  Spotlight
                </span>

                <div className="h-64 rounded-2xl overflow-hidden bg-gray-50 relative border border-gray-100">
                  <img loading="lazy" decoding="async"
                    src={featuredProducts[0].images?.[0]?.image_url || '/images/products/placeholder.jpg'}
                    alt={featuredProducts[0].name}
                    className="w-full h-full object-cover hover:scale-103 transition-transform duration-700"
                  />
                </div>

                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center gap-1.5">
                    <div className="flex text-amber-400 gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current text-amber-400" />
                      ))}
                    </div>
                    <span className="text-[9px] text-gray-400 font-semibold">(5.0 Review Rating)</span>
                  </div>

                  <h4
                    onClick={() => navigate(`/product/${featuredProducts[0].slug}`)}
                    className="font-serif font-bold text-lg text-gray-900 leading-tight hover:text-primary transition-colors cursor-pointer"
                  >
                    {featuredProducts[0].name}
                  </h4>

                  {/* Sizing options */}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {featuredProducts[0].variants && [...new Set(featuredProducts[0].variants.map(v => v.size))].filter(Boolean).map(sz => (
                      <span key={sz} className="text-[9px] bg-gray-100 px-2 py-0.5 rounded font-bold text-gray-655">
                        {sz}
                      </span>
                    ))}
                  </div>

                  {/* Stock urgency progress bar */}
                  <div className="mt-2 flex flex-col gap-1.5">
                    <div className="flex justify-between text-[10px] font-bold text-gray-600">
                      <span>Stock Status:</span>
                      <span className="text-primary font-mono">{featuredProducts[0].stock_quantity || 6} items left</span>
                    </div>
                    <div className="w-full bg-gray-150 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, Math.max(12, ((featuredProducts[0].stock_quantity || 6) / 20) * 100))}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <span className="font-bold text-base text-gray-905">
                      {currencySymbol}{parseFloat(featuredProducts[0].sale_price || featuredProducts[0].price).toLocaleString()}
                    </span>
                    {featuredProducts[0].stock_quantity > 0 || allowOverselling ? (
                      <button
                        onClick={() => {
                          const hasVars = featuredProducts[0].variants && featuredProducts[0].variants.length > 0;
                          if (hasVars) {
                            navigate(`/product/${featuredProducts[0].slug}`);
                          } else {
                            const addItem = useCartStore.getState().addItem;
                            addItem(featuredProducts[0], null, 1, allowOverselling);
                          }
                        }}
                        className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-full shadow-sm transition-all uppercase tracking-wider cursor-pointer"
                      >
                        {featuredProducts[0].variants && featuredProducts[0].variants.length > 0 ? 'Select Option' : 'Buy'}
                      </button>
                    ) : (
                      <span className="text-xs text-red-500 font-bold">SOLD OUT</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Right Column: New Releases */}
            <div className="flex flex-col gap-4">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b pb-2">New Releases</h3>
              {newArrivals.slice(1, 3).map((prod) => (
                <HorizontalProductRow key={prod.id} product={prod} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 8. INSTAGRAM LOOKBOOK SHOP */}
      <section className="bg-[#FAF9F6]/60 py-16 px-6 md:px-12 w-full border-y border-gray-100">
        <div className="max-w-6xl mx-auto text-center mb-10 flex flex-col items-center gap-2">
          <a href={instagramProfileUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] uppercase font-bold text-primary tracking-widest hover:underline inline-flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5" /> {instagramHandle}
          </a>
          <h2 className="font-serif font-bold text-2xl md:text-3xl text-gray-950">Seen on Instagram</h2>
          <p className="text-xs text-gray-550 max-w-md">
            Follow our latest ecommerce looks, new arrivals and styling inspiration directly on Instagram.
          </p>
          <a href={instagramProfileUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-white text-[10px] font-bold uppercase tracking-wider">
            Follow {instagramHandle} <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-6xl mx-auto">
          {(liveInstagramPosts.length > 0 ? liveInstagramPosts.slice(0, 4).map(post => ({
            id: post.id,
            img: post.thumbnail_url || post.media_url,
            tag: post.caption?.slice(0, 80) || 'View this look on Instagram',
            url: post.permalink || instagramProfileUrl,
          })) : [
            { img: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop', tag: 'Luxury Jumpsuits', url: instagramProfileUrl },
            { img: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=600&auto=format&fit=crop', tag: 'Corporate Suits', url: instagramProfileUrl },
            { img: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=600&auto=format&fit=crop', tag: 'Standout Dresses', url: instagramProfileUrl },
            { img: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=600&auto=format&fit=crop', tag: 'Designer Sneakers', url: instagramProfileUrl }
          ]).map((item, idx) => (
            <a key={item.id || idx} href={item.url} target="_blank" rel="noopener noreferrer" className="group relative h-64 md:h-72 rounded-2xl overflow-hidden shadow-xs bg-gray-100 border-0">
              <img loading="lazy" decoding="async" src={item.img} alt={item.tag} className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center items-center gap-3 z-10 p-5 text-center">
                <span className="text-white text-xs font-semibold line-clamp-3">{item.tag}</span>
                <span className="px-4 py-2 bg-primary text-white text-[10px] font-medium rounded-full inline-flex items-center gap-1.5">
                  View on Instagram <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* 9. RECENTLY VIEWED ITEMS */}
      {recentlyViewed.length > 0 && (
        <section className="px-6 md:px-12 max-w-6xl mx-auto w-full">
          <div className="mb-6 flex items-center gap-2 border-b border-gray-100 pb-3">
            <div>
              <h2 className="font-serif font-bold text-xl text-gray-900">Recently Viewed</h2>
              <p className="text-[10px] text-gray-400">Pick up where you left off</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {recentlyViewed.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </section>
      )}
      {/* 10. CUSTOMER REVIEWS */}
      <section className="px-6 md:px-12 max-w-6xl mx-auto w-full text-center group relative">
        <h2 className="font-serif font-bold text-2xl md:text-3xl text-gray-900 mb-8">What Our Queens Say</h2>
        
        <div className="relative">
          <div key={currentReviewIndex} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-fade-in text-left">
            {reviewsList.slice(0, Math.min(4, reviewsList.length)).map((_, offset) => {
              const idx = (currentReviewIndex + offset) % reviewsList.length;
              const rev = reviewsList[idx];
              return (
                <div 
                  key={offset} 
                  className={`bg-white border border-gray-100 p-5 rounded-2xl shadow-xs flex flex-col justify-between gap-4 transition-all duration-300 hover:shadow-md ${
                    offset === 1 ? 'hidden sm:flex' : 
                    offset === 2 ? 'hidden md:flex' : 
                    offset === 3 ? 'hidden lg:flex' : 'flex'
                  }`}
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex gap-0.5 text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-250'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-655 italic leading-relaxed min-h-[72px]">
                      "{rev.comment || 'Excellent fabric quality and beautiful fit!'}"
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-gray-800 border-t border-gray-50 pt-3 truncate">
                    — {rev.customer_name}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Left Arrow Button */}
          {reviewsList.length > 1 && (
            <button
              onClick={() => setCurrentReviewIndex(prev => (prev === 0 ? reviewsList.length - 1 : prev - 1))}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 lg:-translate-x-10 p-2.5 bg-white hover:bg-gray-55 border border-gray-200 text-gray-800 rounded-full transition-opacity duration-300 opacity-0 group-hover:opacity-100 shadow-md z-30 cursor-pointer hidden md:flex items-center justify-center hover:scale-105 active:scale-95"
              aria-label="Previous Reviews"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          {/* Right Arrow Button */}
          {reviewsList.length > 1 && (
            <button
              onClick={() => setCurrentReviewIndex(prev => (prev + 1) % reviewsList.length)}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 lg:translate-x-10 p-2.5 bg-white hover:bg-gray-55 border border-gray-200 text-gray-800 rounded-full transition-opacity duration-300 opacity-0 group-hover:opacity-100 shadow-md z-30 cursor-pointer hidden md:flex items-center justify-center hover:scale-105 active:scale-95"
              aria-label="Next Reviews"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Carousel indicators */}
        {reviewsList.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-6">
            {reviewsList.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentReviewIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  currentReviewIndex === idx ? 'bg-primary w-4' : 'bg-gray-250 w-1.5'
                }`}
                aria-label={`Go to review slide ${idx + 1}`}
              />
            ))}
          </div>
        )}

        {/* See All Testimonials Button */}
        <div className="mt-8 flex justify-center">
          <Link
            to="/reviews"
            className="px-6 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-855 text-xs font-semibold rounded-full shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            See All Reviews
          </Link>
        </div>
      </section>

      {/* 11. NEWSLETTER SUBSCRIPTION CARD */}
      <section className="bg-primary/5 py-14 px-6 rounded-3xl max-w-6xl mx-auto w-full text-center flex flex-col items-center gap-4 border border-primary/10">
        <h2 className="font-serif font-bold text-2xl md:text-3xl text-gray-900">Join the FairQueen Club</h2>
        <p className="text-xs text-gray-550 max-w-md leading-relaxed">
          Subscribe to get exclusive first-access to weekly drops, available sizes, discount codes, and style lookbooks.
        </p>

        <form onSubmit={handleNewsletterSubmit} className="flex flex-col items-center gap-2 max-w-md w-full mt-2">
          <div className="flex gap-2 w-full">
            <input
              type="email"
              value={newsEmail}
              onChange={e => setNewsEmail(e.target.value)}
              placeholder="Enter your email address"
              className="flex-1 px-4 py-2.5 rounded-full border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white"
              required
              disabled={newsLoading}
            />
            <button
              type="submit"
              disabled={newsLoading}
              className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-full flex items-center justify-center cursor-pointer shadow-sm active:scale-95 shrink-0"
            >
              {newsLoading ? 'Subscribing...' : 'Subscribe'}
            </button>
          </div>

          <CaptchaWidget
            settings={settings}
            formType="newsletter"
            verified={newsCaptchaVerified}
            setVerified={setNewsCaptchaVerified}
          />
        </form>

        {newsSuccess && (
          <span className="text-xs text-green-600 font-semibold mt-1 flex items-center gap-1">
            <Check className="w-3.5 h-3.5" />
            {newsSuccess}
          </span>
        )}
        {newsError && (
          <span className="text-xs text-red-500 font-semibold mt-1">
            ❌ {newsError}
          </span>
        )}
      </section>

      {/* 12. FEATURED BRANDS MARQUEE SCROLL */}
      {brands.length > 0 && (
        <section className="storefront-brand-strip py-7 bg-white dark:bg-black w-full overflow-hidden">
          <style>{`
            @keyframes marquee-scroll {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            .brand-marquee-track {
              display: flex;
              width: max-content;
              animation: marquee-scroll 25s linear infinite;
            }
            .brand-marquee-track:hover {
              animation-play-state: paused;
            }
          `}</style>
          
          <div className="max-w-6xl mx-auto px-6 text-center mb-4">
            <span className="text-[9px] uppercase font-bold text-primary tracking-widest bg-primary/5 px-3 py-1 rounded-full border border-primary/10">
              Brands We Love
            </span>
          </div>

          <div className="relative w-full overflow-hidden py-2 before:absolute before:left-0 before:top-0 before:z-10 before:h-full before:w-24 before:bg-gradient-to-r before:from-white dark:before:from-black before:to-transparent after:absolute after:right-0 after:top-0 after:z-10 after:h-full after:w-24 after:bg-gradient-to-l after:from-white dark:after:from-black after:to-transparent">
            <div className="brand-marquee-track flex gap-12 items-center">
              {[...brands, ...brands].map((brand, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-center shrink-0 w-32 h-16 p-2.5 transition-all cursor-pointer group"
                  title={brand.name}
                  onClick={() => brand.website_url && window.open(brand.website_url, '_blank', 'noopener,noreferrer')}
                >
                  <img loading="lazy" decoding="async"
                    src={brand.logo_path}
                    alt={brand.name}
                    className="max-h-full max-w-full object-contain filter grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-350 transform group-hover:scale-105"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 13. FLASH SALE COUNTDOWN POPUP */}
      {showFlashSale && flashSaleProducts.length > 0 && flashSaleProducts[currentFlashIndex] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
          <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header / Top Ribbon */}
            <div className="bg-[#b8860b] text-white px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="animate-pulse flex h-2 w-2 rounded-full bg-red-500" />
                <span className="text-xs font-bold uppercase tracking-wider font-sans">
                  ⚡ {settings.flash_sale_title || 'Midnight Madness Flash Sale'} ⚡
                </span>
              </div>
              <button
                onClick={() => {
                  setShowFlashSale(false);
                  sessionStorage.setItem('fairqueen_flash_dismissed', 'true');
                }}
                className="text-white hover:text-gray-200 transition-colors p-1"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex flex-col md:flex-row h-72 md:h-64">
              
              {/* Product Image Left */}
              <div className="w-full md:w-1/2 h-40 md:h-full relative overflow-hidden bg-gray-100">
                <img loading="lazy" decoding="async"
                  src={settings.flash_sale_banner_url || flashSaleProducts[currentFlashIndex].images?.[0]?.image_url || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=350'}
                  alt="Flash Sale Banner"
                  className="w-full h-full object-cover transition-all duration-700 ease-in-out scale-100 hover:scale-105"
                />
                
                {/* Discount Tag */}
                {flashSaleProducts[currentFlashIndex].sale_price && (
                  <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-md">
                    Save {Math.round((1 - (flashSaleProducts[currentFlashIndex].sale_price / flashSaleProducts[currentFlashIndex].price)) * 100)}%
                  </div>
                )}

                {/* Multiple items Swipe Indicator */}
                {flashSaleProducts.length > 1 && (
                  <div className="absolute bottom-3 left-3 flex gap-1.5 z-20">
                    {flashSaleProducts.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentFlashIndex(idx)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          currentFlashIndex === idx ? 'w-4 bg-white shadow' : 'w-1.5 bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Product Info Right */}
              <div className="w-full md:w-1/2 p-5 flex flex-col justify-between bg-white">
                
                {/* Ticking Countdown Container */}
                <div>
                  <div className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1">
                    Offer Expires In:
                  </div>
                  <div className="flex gap-2 items-center font-mono font-bold text-sm text-gray-800 bg-gray-55/60 px-3 py-1.5 rounded-full w-max border border-gray-100 shadow-xs">
                    <span>{String(flashTimeLeft.hours).padStart(2, '0')}h</span>
                    <span className="text-gray-300">:</span>
                    <span>{String(flashTimeLeft.minutes).padStart(2, '0')}m</span>
                    <span className="text-gray-300">:</span>
                    <span className="text-red-500 animate-pulse">{String(flashTimeLeft.seconds).padStart(2, '0')}s</span>
                  </div>
                </div>

                {/* Swiping Item Info */}
                <div className="my-2 flex-1 flex flex-col justify-center">
                  <span className="text-[10px] text-primary uppercase font-bold tracking-wider">Featured Sale Item</span>
                  <h4 className="font-serif font-bold text-gray-900 text-xs md:text-sm line-clamp-2 mt-0.5 leading-snug">
                    {flashSaleProducts[currentFlashIndex].name}
                  </h4>
                  
                  {/* Prices */}
                  <div className="flex items-baseline gap-2 mt-1.5">
                    <span className="text-sm font-bold text-red-600">
                      {currencySymbol}{parseFloat(flashSaleProducts[currentFlashIndex].sale_price || flashSaleProducts[currentFlashIndex].price).toLocaleString()}
                    </span>
                    {(flashSaleProducts[currentFlashIndex].sale_price) && (
                      <span className="text-[10px] text-gray-450 line-through">
                        {currencySymbol}{parseFloat(flashSaleProducts[currentFlashIndex].price).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action button */}
                <button
                  onClick={() => {
                    setShowFlashSale(false);
                    navigate(`/product/${flashSaleProducts[currentFlashIndex].slug}`);
                  }}
                  className="w-full py-2.5 bg-red-650 hover:bg-red-750 text-white text-[10px] font-bold uppercase tracking-wider rounded-full transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  ⚡ Claim This Deal
                </button>
              </div>

            </div>

          </div>
        </div>
      )}
    </div>
  );
}

// Reusable Product Card Component
function ProductCard({ product }) {
  const navigate = useNavigate();
  const currencySymbol = getCurrencySymbol();
  const addItem = useCartStore(state => state.addItem);
  const hasWishlist = useWishlistStore(state => state.hasItem(product.id));
  const toggleWishlist = useWishlistStore(state => state.toggleItem);
  const [isAdded, setIsAdded] = useState(false);
  const { data: cardSettingsRes } = useQuery({
    queryKey: ['settings'],
    queryFn: () => fetch('/api/settings').then(res => res.json())
  });
  const cardSettings = cardSettingsRes?.data?.settings || {};
  const allowOverselling = cardSettings.allow_overselling === 'true' || cardSettings.allow_overselling === true || cardSettings.allow_overselling === '1' || cardSettings.allow_overselling === 1;

  const price = product.sale_price || product.price;
  const isSale = !!product.sale_price;

  // Find unique sizes available
  const sizes = product.variants ? [...new Set(product.variants.map(v => v.size))].filter(Boolean) : [];

  const handleAddToCart = (e) => {
    e.stopPropagation();
    const selectedCardVariant = product.variants?.find(variant => allowOverselling || variant.stock_quantity > 0) || product.variants?.[0] || null;
    addItem(product, selectedCardVariant, 1, allowOverselling);

    if (e && e.currentTarget) {
      const rect = e.currentTarget.getBoundingClientRect();
      window.dispatchEvent(new CustomEvent('animate-to-cart', {
        detail: {
          startX: rect.left + rect.width / 2,
          startY: rect.top + rect.height / 2,
          imageUrl: product.images?.[0]?.image_url
        }
      }));
    }

    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  return (
    <div
      onClick={() => navigate(`/product/${product.slug}`)}
      className="group flex flex-col bg-white rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer relative"
    >
      {/* Badge Container */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5">
        {isSale && (
          <span className="bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
            Sale
          </span>
        )}
        {product.is_new_arrival && (
          <span className="bg-yellow-400 text-gray-950 text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase shadow-2xs">
            New
          </span>
        )}
      </div>

      {/* Wishlist Toggler Heart Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleWishlist(product);
        }}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/95 border border-gray-100 shadow-xs text-gray-500 hover:text-red-500 hover:scale-105 active:scale-95 transition-all cursor-pointer"
        title={hasWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
      >
        <Heart className={`w-3.5 h-3.5 transition-colors ${hasWishlist ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
      </button>

      {/* Image Block */}
      <div className="h-60 md:h-64 overflow-hidden bg-[#FAF9F6] relative">
        <img loading="lazy" decoding="async"
          src={product.images?.[0]?.image_url || '/images/products/placeholder.jpg'}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-700"
        />
        {/* Hover Crossfade Overlay */}
        {product.images?.[1]?.image_url && (
          <img loading="lazy" decoding="async"
            src={product.images[1].image_url}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          />
        )}
      </div>

      {/* Details */}
      <div className="p-4 flex flex-col gap-1.5 text-left flex-1 justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider truncate">
              {product.categories?.[0]?.name || product.category?.name || 'Designer Wear'}
            </span>
            <div className="flex items-center gap-0.5">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="text-[9px] text-gray-400 font-bold">(5.0)</span>
            </div>
          </div>

          <h3 className="font-serif font-bold text-sm text-gray-905 leading-tight group-hover:text-primary transition-colors truncate mt-1">
            {product.name}
          </h3>
          
          {/* Sizes Metadata */}
          <div className="text-[9px] text-gray-450 mt-1 flex flex-wrap gap-1">
            <span className="font-semibold text-gray-400">Sizes:</span>
            {sizes.length > 0 ? sizes.slice(0, 3).join(', ') : 'One Size'}
          </div>
        </div>

        <div>
          {/* Price and Stock Summary */}
          <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-gray-55">
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-xs md:text-sm text-gray-905">
                {currencySymbol}{parseFloat(price).toLocaleString()}
              </span>
              {isSale && (
                <span className="text-[10px] text-gray-400 line-through">
                  {currencySymbol}{parseFloat(product.price).toLocaleString()}
                </span>
              )}
            </div>
            
            <span className={`text-[10px] font-bold ${product.stock_quantity > 0 || allowOverselling ? 'text-orange-600' : 'text-red-500'}`}>
              {product.stock_quantity > 0
                ? `Only ${product.stock_quantity} left`
                : allowOverselling
                  ? 'Backorder'
                  : 'Out of Stock'}
            </span>
          </div>

          {/* Action Controls */}
          <div className="mt-3.5 grid grid-cols-2 gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/product/${product.slug}`);
              }}
              className="py-2 border border-gray-200 hover:border-primary hover:text-primary text-gray-600 text-[10px] font-bold rounded-full transition-all uppercase tracking-wider flex items-center justify-center gap-1 hover:bg-primary/5 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              See
            </button>

            {product.stock_quantity <= 0 && !allowOverselling ? (
              <button
                disabled
                className="py-2 bg-gray-100 text-gray-400 text-[10px] font-bold rounded-full cursor-not-allowed uppercase tracking-wider text-center"
              >
                Sold Out
              </button>
            ) : (
              <button
                onClick={handleAddToCart}
                disabled={isAdded}
                className={`py-2 text-[10px] font-bold rounded-full shadow-xs transition-all uppercase tracking-wider flex items-center justify-center gap-1 ${
                  isAdded 
                    ? 'bg-emerald-600 text-white font-medium cursor-default' 
                    : 'bg-primary hover:bg-primary-hover text-white cursor-pointer active:scale-95'
                }`}
              >
                {isAdded ? (
                  <>
                    <Check className="w-3.5 h-3.5 animate-bounce" />
                    Added!
                  </>
                ) : (
                  'Buy'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Reusable Horizontal Row Component for Trending lists
function HorizontalProductRow({ product }) {
  const navigate = useNavigate();
  const currencySymbol = getCurrencySymbol();
  const addItem = useCartStore(state => state.addItem);
  const { data: rowSettingsRes } = useQuery({
    queryKey: ['settings'],
    queryFn: () => fetch('/api/settings').then(res => res.json())
  });
  const rowSettings = rowSettingsRes?.data?.settings || {};
  const allowOverselling = rowSettings.allow_overselling === 'true' || rowSettings.allow_overselling === true || rowSettings.allow_overselling === '1' || rowSettings.allow_overselling === 1;

  const price = product.sale_price || product.price;
  const hasVariants = product.variants && product.variants.length > 0;

  return (
    <div
      onClick={() => navigate(`/product/${product.slug}`)}
      className="flex items-center gap-3 bg-white p-2.5 rounded-2xl border border-gray-100 hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-50 shrink-0 border border-gray-100">
        <img loading="lazy" decoding="async"
          src={product.images?.[0]?.image_url || '/images/products/placeholder.jpg'}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-0.5 text-left">
        <h4 className="font-serif font-bold text-xs text-gray-800 truncate group-hover:text-primary transition-colors">
          {product.name}
        </h4>
        <div className="flex text-amber-400 gap-0.5">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-2.5 h-2.5 fill-current text-amber-400" />
          ))}
        </div>
        <div className="flex items-center justify-between mt-1 pt-1 border-t border-gray-50">
          <span className="text-[11px] font-bold text-gray-905">
            {currencySymbol}{parseFloat(price).toLocaleString()}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (hasVariants) {
                navigate(`/product/${product.slug}`);
              } else {
                addItem(product, null, 1, allowOverselling);
              }
            }}
            className="text-[9px] font-bold text-primary hover:underline uppercase tracking-wide cursor-pointer"
          >
            {hasVariants ? 'Options' : '+ Add'}
          </button>
        </div>
      </div>
    </div>
  );
}

export { ProductCard };
