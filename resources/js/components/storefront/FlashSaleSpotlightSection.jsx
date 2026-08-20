import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Zap, Clock, Sparkles, ShoppingBag } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { getCurrencySymbol } from '../../utils/currency';

export default function FlashSaleSpotlightSection({ settings = {}, flashSaleProducts = [] }) {
  const navigate = useNavigate();
  const addItem = useCartStore((state) => state.addItem);
  const currencySymbol = settings.system_currency_symbol || getCurrencySymbol();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(null);

  // 1. Build composite slides (Editorial Spotlight + Product Flash Sales)
  const slides = useMemo(() => {
    const list = [];

    // Editorial / Custom Admin Flash Banner Slide (shown if enabled and explicitly customized or when no product flash sales exist)
    const showEditorial = settings.flash_sale_show === 'true' || settings.flash_sale_show === true;
    if (showEditorial || (!flashSaleProducts.length && !settings.flash_sale_show)) {
      list.push({
        id: 'editorial-spotlight',
        type: 'editorial',
        badge: settings.flash_sale_badge || '⚡ FLASH SALE SPOTLIGHT',
        title: settings.flash_sale_title || 'Limited-Time Flash Sale Deals',
        subtitle: settings.flash_sale_subtitle || settings.flash_sale_description || 'Exclusive limited-time flash discounts on our bestselling organic skincare and beauty formulas.',
        ctaText: settings.flash_sale_cta_text || 'EXPLORE FLASH DEALS →',
        ctaLink: settings.flash_sale_cta_link || '/shop?flash_sale=true',
        endTime: settings.flash_sale_end_time || null,
        discount: settings.flash_sale_discount_percent || null,
        imageUrl: settings.flash_sale_banner_url || null,
      });
    }

    // Individual Admin-Configured Flash Sale Products (ONLY products with is_flash_sale)
    if (Array.isArray(flashSaleProducts) && flashSaleProducts.length > 0) {
      flashSaleProducts.forEach((prod) => {
        const rawPrice = prod.price ? parseFloat(prod.price) : 0;
        const salePrice = prod.sale_price ? parseFloat(prod.sale_price) : 0;
        let discountPercent = '';
        if (salePrice && rawPrice && rawPrice > salePrice) {
          discountPercent = `${Math.round(((rawPrice - salePrice) / rawPrice) * 100)}% OFF`;
        }

        const rawImg = prod.images?.[0]?.image_url || prod.image_url || prod.image;
        const pImg = (rawImg && typeof rawImg === 'string' && rawImg.trim().length > 3)
          ? (rawImg.startsWith('http') || rawImg.startsWith('/') ? rawImg.trim() : `/${rawImg.trim()}`)
          : 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=600';

        list.push({
          id: `product-${prod.id}`,
          type: 'product',
          badge: discountPercent ? `⚡ FLASH SALE · ${discountPercent}` : '⚡ FLASH SALE DEAL',
          title: prod.name,
          subtitle: prod.short_description || prod.description?.replace(/<[^>]*>?/gm, '').slice(0, 110) || 'Exclusive limited-time flash discount on our signature organic formulation.',
          ctaText: salePrice ? `CLAIM ${currencySymbol}${salePrice.toLocaleString()} DEAL →` : 'SHOP THIS DEAL →',
          ctaLink: `/products/${prod.slug || prod.id}`,
          endTime: settings.flash_sale_end_time || null,
          price: rawPrice,
          salePrice: salePrice,
          product: prod,
          imageUrl: pImg,
        });
      });
    }

    return list;
  }, [settings, flashSaleProducts, currencySymbol]);

  // If no slides or disabled, return null
  const isEnabled = settings.flash_sale_show === 'true' || settings.flash_sale_show === true || slides.length > 0;
  if (!isEnabled || slides.length === 0) {
    return null;
  }

  const activeSlide = slides[currentSlideIndex] || slides[0];

  // 2. Active Slide Countdown Timer
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false });

  useEffect(() => {
    const calculateTime = () => {
      let targetTime;
      if (activeSlide?.endTime) {
        targetTime = new Date(activeSlide.endTime).getTime();
      } else {
        // Default rolling 24-hour flash sale timer if none specified
        const now = new Date();
        targetTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 23, 59, 59).getTime();
      }

      const diff = targetTime - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
      } else {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / 1000 / 60) % 60),
          seconds: Math.floor((diff / 1000) % 60),
          expired: false
        });
      }
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [activeSlide?.endTime, currentSlideIndex]);

  // 3. Auto slide rotation every 7 seconds
  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [slides.length, isPaused]);

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentSlideIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (!touchStartX.current) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 50) {
      handleNext(e);
    } else if (diff < -50) {
      handlePrev(e);
    }
    touchStartX.current = null;
  };

  return (
    <section className="px-4 sm:px-8 lg:px-12 py-4 sm:py-6 max-w-7xl mx-auto w-full">
      <div
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative overflow-hidden rounded-[28px] sm:rounded-[36px] bg-gradient-to-r from-[#2B1046] via-[#481862] to-[#C71C78] text-white p-6 sm:p-9 md:p-11 shadow-2xl border border-white/15 transition-all duration-700"
      >
        {/* Subtle Ambient Radial Backlight Glow */}
        <div
          className="absolute -right-20 -bottom-20 w-96 h-96 rounded-full pointer-events-none opacity-40 blur-3xl"
          style={{ background: 'radial-gradient(circle, #EC268F 0%, rgba(93,62,133,0) 70%)' }}
        />
        <div
          className="absolute -left-20 -top-20 w-80 h-80 rounded-full pointer-events-none opacity-20 blur-2xl"
          style={{ background: 'radial-gradient(circle, #E5C158 0%, rgba(93,62,133,0) 70%)' }}
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 sm:gap-8">
          {/* Left Column: Badge, Headline, Subtitle & Optional Countdown Timer */}
          <div className="flex flex-col gap-3.5 max-w-2xl text-left">
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Badge */}
              <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-extrabold tracking-wider  bg-white/15 backdrop-blur-md px-3.5 py-1 rounded-full border border-white/20 text-amber-200 shadow-xs">
                {activeSlide.badge}
              </span>

              {/* Countdown Timer Pill */}
              <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-extrabold bg-black/30 backdrop-blur-md px-3 py-1 rounded-full border border-white/15 text-white">
                <Clock className="w-3 h-3 text-[#EC268F] animate-pulse" />
                <span>ENDS IN:</span>
                <span className="font-mono text-amber-300">
                  {String(timeLeft.days).padStart(2, '0')}d : {String(timeLeft.hours).padStart(2, '0')}h : {String(timeLeft.minutes).padStart(2, '0')}m : {String(timeLeft.seconds).padStart(2, '0')}s
                </span>
              </div>
            </div>

            {/* Headline */}
            <h2 className="font-extrabold text-2xl sm:text-3xl md:text-4xl lg:text-[40px] leading-[1.12] tracking-tight text-white drop-shadow-xs">
              {activeSlide.title}
            </h2>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-white/85 leading-relaxed font-sans max-w-xl line-clamp-2 sm:line-clamp-3">
              {activeSlide.subtitle}
            </p>

            {/* Associated Discount Information (if product slide) */}
            {activeSlide.type === 'product' && activeSlide.salePrice && (
              <div className="flex items-center gap-3 pt-1">
                <span className="text-xl sm:text-2xl font-extrabold text-white">
                  {currencySymbol}{activeSlide.salePrice.toLocaleString()}
                </span>
                {activeSlide.price && activeSlide.price > activeSlide.salePrice && (
                  <span className="text-sm text-white/60 line-through">
                    {currencySymbol}{activeSlide.price.toLocaleString()}
                  </span>
                )}
                <span className="text-[10px] font-extrabold  tracking-wider bg-[#EC268F] text-white px-2 py-0.5 rounded-full shadow-xs">
                  Save {currencySymbol}{(activeSlide.price - activeSlide.salePrice).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Right Column: CTA Action Button & Controls */}
          <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-4 shrink-0">
            {/* CTA Button */}
            <Link
              to={activeSlide.ctaLink}
              className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-100 text-[#2B1046] font-extrabold text-xs sm:text-sm px-7 py-3.5 sm:py-4 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 active:scale-95 whitespace-nowrap btn-spring"
            >
              <span>{activeSlide.ctaText}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            {/* Swiper Navigation Controls (if multiple slides) */}
            {slides.length > 1 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1.5 px-2">
                  {slides.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCurrentSlideIndex(i)}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${i === currentSlideIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70'
                        }`}
                      aria-label={`Go to slide ${i + 1}`}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleNext}
                  className="w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
                  aria-label="Next slide"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
