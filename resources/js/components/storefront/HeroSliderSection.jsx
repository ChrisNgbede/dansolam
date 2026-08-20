import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

export default function HeroSliderSection({ banners = [], settings = {}, currencySymbol = '₦' }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(null);

  // Fallback signature slide if none exist in DB
  const defaultSlide = {
    id: 'default-hero',
    eyebrow: 'Luxury Bathing & Herbal Polish Soaps',
    title: 'Pure botanical bath indulgence for',
    accent_title: 'silken radiant skin.',
    subtitle: 'Handcrafted organic whitening soaps, foaming botanical cleansers, and herbal bath polishes that gently wash away impurities and reveal deep, radiant luminosity.',
    image_url: '/images/hero/bathing_soaps.jpg',
    link_url: '/shop',
    primary_cta_label: 'Shop Bathing & Soaps',
    secondary_cta_label: 'Explore Glow Rituals',
    secondary_cta_url: '/pages/tips',
    top_kicker: '100% Herbal',
    top_text: 'Cold-Pressed Extracts',
    bottom_kicker: 'Whitening Polish Soap',
    bottom_text: 'Signature Bath Bar',
    layout_mode: 'default',
  };

  const slides = Array.isArray(banners) && banners.length > 0 ? banners : [defaultSlide];
  const activeSlide = slides[currentIndex] || slides[0] || defaultSlide;
  const isFullBleed = activeSlide.layout_mode === 'full';

  // Autoplay rotation every 7 seconds when more than 1 slide exists
  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [slides.length, isPaused]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (slides.length <= 1) return;
      if (e.key === 'ArrowRight') setCurrentIndex((p) => (p + 1) % slides.length);
      if (e.key === 'ArrowLeft') setCurrentIndex((p) => (p === 0 ? slides.length - 1 : p - 1));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slides.length]);

  const handlePrev = (e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (!touchStartX.current) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 50) handleNext();
    else if (diff < -50) handlePrev();
    touchStartX.current = null;
  };

  return (
    <section
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`group relative overflow-hidden w-full transition-all duration-1000 ease-out ${
        isFullBleed ? 'min-h-[620px] sm:min-h-[720px] lg:min-h-[780px] flex items-center' : 'min-h-[580px] sm:min-h-[660px]'
      }`}
    >
      {/* Full-bleed subtle top-right ambient glow */}
      <div
        className="fixed top-0 right-0 w-[950px] h-[950px] rounded-full pointer-events-none z-0 blur-3xl opacity-75 -translate-y-1/3 translate-x-1/4"
        style={{ background: 'radial-gradient(circle, rgba(236,38,143,0.20) 0%, rgba(93,62,133,0.16) 42%, transparent 70%)' }}
      />

      {/* FULL BLEED BACKGROUND LAYER (Growing into full view or shrinking away smoothly) */}
      <div
        className={`absolute inset-0 z-0 transition-all duration-1000 ease-out ${
          isFullBleed
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        {activeSlide.image_url && (
          <img
            key={`bg-${activeSlide.id}-${currentIndex}`}
            src={activeSlide.image_url}
            alt={activeSlide.title || 'Hero Campaign'}
            className="w-full h-full object-cover object-center transition-transform duration-1000 ease-out"
          />
        )}
        
        {/* Systematic Multi-Stage Dark Faded Gradient Overlays for soft luxury readability & contrast */}
        {/* 1. Diagonal & Vertical Left-to-Bottom gradient: soft darkness stretching downwards to cover the full text area while keeping imagery bright */}
        <div className="absolute inset-0 bg-gradient-to-tr from-black/75 via-black/45 to-transparent dark:from-[#0B0610]/85 dark:via-[#0B0610]/55 dark:to-transparent" />
        
        {/* 2. Top-to-Bottom gentle wash that stretches downwards into the footer border */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/25 to-black/70 dark:from-[#0B0610]/50 dark:via-black/20 dark:to-[#17101F]" />
        
        {/* 3. Soft localized reading scrim focused gently on the text zone */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(circle at 18% 45%, rgba(0,0,0,0.40) 0%, rgba(0,0,0,0.15) 60%, transparent 100%)' }}
        />
      </div>

      {/* MAIN CONTAINER CONTENT */}
      <div
        className={`relative z-10 px-6 sm:px-12 pt-28 sm:pt-36 pb-20 sm:pb-28 max-w-7xl mx-auto w-full transition-all duration-700 ${
          isFullBleed
            ? 'flex flex-col justify-center'
            : 'grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-16 items-center'
        }`}
      >
        {/* Left Column Text & CTAs (Fades & translates smoothly between slides) */}
        <div
          key={`text-${activeSlide.id}-${currentIndex}`}
          className={`flex flex-col gap-7 sm:gap-8 transition-all duration-500 animate-in fade-in slide-in-from-left-4 ${
            isFullBleed ? 'max-w-2xl text-white' : ''
          }`}
        >
          {activeSlide.eyebrow && (
            <span
              className={`self-start px-4 py-1.5 rounded-full text-[11px] font-bold tracking-[0.18em] uppercase ${
                isFullBleed
                  ? 'border border-[#E5C158]/70 text-[#E5C158] bg-[#E5C158]/20 backdrop-blur-md shadow-sm'
                  : 'border border-[#5D3E85]/40 dark:border-[#E5C158]/40 text-[#5D3E85] dark:text-[#E5C158] bg-[#5D3E85]/5 dark:bg-[#E5C158]/10'
              }`}
            >
              {activeSlide.eyebrow}
            </span>
          )}

          <h1
            className={`font-extrabold text-[44px] sm:text-6xl lg:text-[74px] leading-[1.06] tracking-[-0.02em] ${
              isFullBleed ? 'text-white [text-shadow:_0_2px_12px_rgba(0,0,0,0.65)]' : 'text-[#221B2B] dark:text-[#F3EFF6]'
            }`}
          >
            {activeSlide.title}{' '}
            {activeSlide.accent_title && (
              <>
                <br />
                <span className={`font-serif italic font-normal ${isFullBleed ? 'text-[#E5C158] [text-shadow:_0_2px_12px_rgba(0,0,0,0.65)]' : 'text-[#221B2B] dark:text-[#F3EFF6]'}`}>
                  {activeSlide.accent_title}
                </span>
              </>
            )}
          </h1>

          {activeSlide.subtitle && (
            <p
              className={`text-base sm:text-[17px] leading-[1.7] max-w-[44ch] ${
                isFullBleed ? 'text-white/95 font-medium [text-shadow:_0_1px_8px_rgba(0,0,0,0.6)]' : 'text-[#5C5566] dark:text-[#C9BED4]'
              }`}
            >
              {activeSlide.subtitle}
            </p>
          )}

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3.5 pt-1">
            <Link
              to={activeSlide.link_url || '/shop'}
              className="px-8.5 py-4.5 rounded-full bg-[#C9166F] hover:bg-[#EC268F] text-white font-bold text-sm shadow-xl flex items-center gap-2.5 transition-all btn-spring border border-white/20"
            >
              <span>{activeSlide.primary_cta_label || 'Shop new arrivals'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            {activeSlide.secondary_cta_label && (
              <Link
                to={activeSlide.secondary_cta_url || '/pages/about-us'}
                className={`px-7.5 py-4.5 rounded-full font-semibold text-sm transition-all btn-spring ${
                  isFullBleed
                    ? 'border-2 border-white/60 bg-black/35 hover:bg-white hover:text-[#221B2B] text-white backdrop-blur-md shadow-md'
                    : 'border border-black/15 dark:border-white/24 text-[#221B2B] dark:text-[#F3EFF6] hover:bg-black/5 dark:hover:bg-white/10'
                }`}
              >
                {activeSlide.secondary_cta_label}
              </Link>
            )}
          </div>

          {/* Stats row */}
          <div
            className={`flex items-center gap-8 pt-6.5 border-t ${
              isFullBleed ? 'border-white/25' : 'border-black/8 dark:border-white/12'
            }`}
          >
            <div className="flex flex-col gap-1">
              <span className={`text-[26px] font-extrabold tracking-tight leading-none ${isFullBleed ? 'text-white [text-shadow:_0_1px_6px_rgba(0,0,0,0.5)]' : 'text-[#221B2B] dark:text-[#F3EFF6]'}`}>
                {activeSlide.top_kicker || '4.9'}
              </span>
              <span className={`text-xs ${isFullBleed ? 'text-white/85 font-medium' : 'text-[#5C5566] dark:text-[#9C90A9]'}`}>
                {activeSlide.top_text || '2,400 reviews'}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className={`text-[26px] font-extrabold tracking-tight leading-none ${isFullBleed ? 'text-white [text-shadow:_0_1px_6px_rgba(0,0,0,0.5)]' : 'text-[#221B2B] dark:text-[#F3EFF6]'}`}>
                48
              </span>
              <span className={`text-xs ${isFullBleed ? 'text-white/85 font-medium' : 'text-[#5C5566] dark:text-[#9C90A9]'}`}>
                products in stock
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className={`text-[26px] font-extrabold tracking-tight leading-none ${isFullBleed ? 'text-white [text-shadow:_0_1px_6px_rgba(0,0,0,0.5)]' : 'text-[#221B2B] dark:text-[#F3EFF6]'}`}>
                24h
              </span>
              <span className={`text-xs ${isFullBleed ? 'text-white/85 font-medium' : 'text-[#5C5566] dark:text-[#9C90A9]'}`}>
                Fast dispatch
              </span>
            </div>
          </div>
        </div>

        {/* Right Column Hero Portrait & Floating Card (Default Split Layout Mode) */}
        {/* Animate shrink/grow when transitioning layout mode */}
        <div
          className={`relative transition-all duration-1000 ease-out ${
            isFullBleed
              ? 'opacity-0 scale-75 translate-x-12 pointer-events-none hidden lg:block invisible h-0 overflow-hidden'
              : 'opacity-100 scale-100 translate-x-0 pointer-events-auto block'
          }`}
        >
          {/* Hero image container without any borders or shadows as requested */}
          <div className="h-[480px] sm:h-[580px] lg:h-[620px] rounded-[36px] sm:rounded-[44px] overflow-hidden bg-transparent">
            <img
              key={`fg-${activeSlide.id}-${currentIndex}`}
              src={activeSlide.image_url || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=1200'}
              alt={activeSlide.title || 'Hero Portrait'}
              className="w-full h-full object-cover object-center transition-all duration-700 ease-out hover:scale-105"
            />
          </div>

          {/* Floating Highlight / Bestseller Card (Clean & Borderless Glassmorphism) */}
          <div className="absolute -left-3 sm:-left-6 bottom-6 sm:bottom-8 w-60 sm:w-68 bg-white/95 dark:bg-[#17101F]/90 backdrop-blur-xl rounded-[20px] p-3.5 sm:p-4 flex items-center gap-3.5 z-20">
            <img
              src="https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=300"
              alt={activeSlide.bottom_kicker || 'PRISM Glow Serum'}
              className="w-12 h-12 rounded-[14px] object-cover shrink-0"
            />
            <div className="flex flex-col gap-0.5 min-w-0 text-left">
              <span className="text-[9px] font-extrabold tracking-[0.18em]  text-[#5D3E85] dark:text-[#E5C158]">
                {activeSlide.bottom_text || 'Bestseller'}
              </span>
              <span className="text-xs sm:text-sm font-bold text-[#221B2B] dark:text-[#F3EFF6] truncate leading-tight">
                {activeSlide.bottom_kicker || 'PRISM Glow Serum'}
              </span>
              <span className="text-xs sm:text-[13px] font-extrabold text-[#221B2B] dark:text-[#F3EFF6]">
                {currencySymbol}56,000
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Slide Navigation: Left / Right Caret Buttons (appear on hover, centered on edges) */}
      {slides.length > 1 && (
        <>
          {/* Left Caret */}
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous slide"
            className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/80 dark:bg-[#1E1528]/80 backdrop-blur-xl shadow-lg border border-white/30 dark:border-white/10 flex items-center justify-center text-[#221B2B] dark:text-[#F3EFF6] opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer hover:bg-white dark:hover:bg-[#1E1528] hover:scale-110 hover:shadow-xl"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Right Caret */}
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next slide"
            className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/80 dark:bg-[#1E1528]/80 backdrop-blur-xl shadow-lg border border-white/30 dark:border-white/10 flex items-center justify-center text-[#221B2B] dark:text-[#F3EFF6] opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer hover:bg-white dark:hover:bg-[#1E1528] hover:scale-110 hover:shadow-xl"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Dot Indicators (bottom center) */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-black/30 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-lg">
            {slides.map((s, idx) => (
              <button
                key={s.id || idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  idx === currentIndex
                    ? 'w-6 h-2 bg-[#EC268F]'
                    : 'w-2 h-2 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
