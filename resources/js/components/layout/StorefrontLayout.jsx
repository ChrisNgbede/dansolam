import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { toast as systemToast } from '../ui/ToastProvider';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Home, ShoppingBag, Search, ShoppingCart, Heart, User, MessageCircle, Menu, X, Gift, Mail, ArrowRight, ArrowLeft, FileText, BookOpen, LayoutDashboard, Trash2, ArrowUpRight, Banknote, ShieldCheck, Truck, Sparkles, Megaphone, ChevronLeft, ChevronRight, Sun, Moon, Phone } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useWishlistStore } from '../../store/wishlistStore';
import SocialIcon from '../ui/SocialIcon';
import MaintenancePage from '../../pages/storefront/MaintenancePage';
import BookFittingSessionModal from '../storefront/BookFittingSessionModal';

// Helper slideshow component for dynamic mega menu advertisement banner
function MegaMenuAdSlideshow({ ads }) {
  let adList = [];
  try {
    if (typeof ads === 'string') {
      adList = JSON.parse(ads);
    } else if (Array.isArray(ads)) {
      adList = ads;
    }
  } catch (e) {
    adList = [];
  }

  if (adList.length === 0) {
    adList = ['https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=350'];
  }

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (adList.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % adList.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [adList]);

  return (
    <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 shadow-sm">
      {adList.map((url, idx) => (
        <img loading="lazy" decoding="async"
          key={idx}
          src={url}
          alt={`Promotional Banner ${idx + 1}`}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${idx === activeIndex ? 'opacity-100' : 'opacity-0'
            }`}
        />
      ))}
      {adList.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {adList.map((_, idx) => (
            <div
              key={idx}
              className={`w-1.5 h-1.5 rounded-full transition-all ${idx === activeIndex ? 'bg-white w-3' : 'bg-white/50'
                }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Helper component for interactive swiping top announcement bar with coupons carousel
function AnimatedAnnouncementBar({ text }) {
  const [copiedCode, setCopiedCode] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fetch active store coupons
  const { data: couponsRes } = useQuery({
    queryKey: ['active-coupons-announcement'],
    queryFn: () => fetch('/api/coupons/active').then(res => res.json()),
  });

  // Prepare list of announcement items
  const activeCoupons = couponsRes?.data || [];

  // Parse announcement items from text (supports '|' delimiter for multiple messages)
  const rawItems = (text || '').split('|').map(t => t.trim()).filter(Boolean);

  // Combine custom text items and active coupons into slides
  const slides = [...rawItems];

  activeCoupons.forEach(coupon => {
    const formattedVal = coupon.type === 'percentage'
      ? `${parseFloat(coupon.value)}% OFF`
      : `Save $${parseFloat(coupon.value)}`;
    const desc = `Special Offer: Get ${formattedVal} on your order! Use code ${coupon.code}`;
    if (!slides.some(s => s.includes(coupon.code))) {
      slides.push(desc);
    }
  });

  const activeSlides = slides.length > 0 ? slides : [text];

  // Auto-swipe timer if there are multiple slides
  useEffect(() => {
    if (activeSlides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [activeSlides.length]);

  if (!text && activeSlides.length === 0) return null;

  const currentText = activeSlides[currentIndex] || text || '';

  // Extract coupon code if available
  const codeMatch = currentText.match(/(?:code|coupon)\s+([A-Z0-9]{3,15})/i) || currentText.match(/\b([A-Z0-9]{4,12})\b/);
  const code = codeMatch ? codeMatch[1] : null;

  const handleCopyCode = (couponCode) => {
    try {
      navigator.clipboard.writeText(couponCode);
      setCopiedCode(couponCode);
      systemToast.success(`Coupon code "${couponCode}" copied to clipboard! ✨`);
      setTimeout(() => setCopiedCode(null), 3000);
    } catch (e) {
      systemToast.success(`Coupon code: ${couponCode}`);
    }
  };

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);

  return (
    <div className="group bg-[linear-gradient(90deg,#5E4409_0%,#906E20_25%,#B89433_55%,#906E20_80%,#5E4409_100%)] text-white text-[10px] md:text-xs font-bold py-2 px-3 md:px-6 text-center tracking-wide relative shrink-0 z-50 shadow-sm overflow-hidden flex items-center justify-between min-h-[36px] select-none">
      {/* Background shimmer animation */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent -translate-x-full animate-shimmer pointer-events-none" />

      {/* Prev slide button if multiple (only visible on hover) */}
      {activeSlides.length > 1 && (
        <button
          type="button"
          onClick={prevSlide}
          className="relative z-20 p-1 hover:bg-white/20 rounded-full transition-all duration-300 cursor-pointer text-amber-200 hover:text-white shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100"
          aria-label="Previous Announcement"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}

      {/* Active Announcement Swiper Slide */}
      <div className="flex-1 flex items-center justify-center gap-3 md:gap-4 relative z-10 overflow-hidden px-2">
        <div key={currentIndex} className="inline-flex flex-wrap items-center justify-center gap-2 md:gap-3 animate-fade-in transition-all duration-500">

          {/* Announcement Megaphone Icon & Text */}
          <span className="inline-flex items-center gap-2 animate-bulgy-pulse">
            <Megaphone className="w-4 h-4 text-amber-200 shrink-0" />
            <span className="font-bold tracking-wide drop-shadow-xs truncate max-w-[280px] sm:max-w-md md:max-w-xl">
              {currentText}
            </span>
          </span>

          {/* Copyable Coupon Badge - Moved right with margin to prevent overlap */}
          {code && (
            <button
              type="button"
              onClick={() => handleCopyCode(code)}
              className="inline-flex items-center gap-1.5 px-3 py-0.5 ml-2 md:ml-4 rounded-full bg-white/20 hover:bg-white/35 text-white font-mono font-bold text-[10px] md:text-xs tracking-wider transition-all duration-300 border border-white/40 hover:scale-105 active:scale-95 shadow-xs cursor-pointer group shrink-0"
              title="Click to copy coupon code"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-200 group-hover:rotate-12 transition-transform" />
              <span>{code}</span>
              <span className="text-[9px] bg-white text-[#8C6D1F] px-1.5 py-0.2 rounded font-sans font-extrabold uppercase ml-0.5 shadow-2xs">
                {copiedCode === code ? 'Copied! ✓' : 'COPY'}
              </span>
            </button>
          )}

        </div>
      </div>

      {/* Next slide button if multiple (only visible on hover) */}
      {activeSlides.length > 1 && (
        <button
          type="button"
          onClick={nextSlide}
          className="relative z-20 p-1 hover:bg-white/20 rounded-full transition-all duration-300 cursor-pointer text-amber-200 hover:text-white shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100"
          aria-label="Next Announcement"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export default function StorefrontLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [contactDropdownOpen, setContactDropdownOpen] = useState(false);
  const [bookFittingModalOpen, setBookFittingModalOpen] = useState(false);
  const [storefrontDark, setStorefrontDark] = useState(() => {
    const saved = localStorage.getItem('fairqueen_storefront_theme');
    return saved ? saved === 'dark' : window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchResults, setSearchResults] = useState({ products: [], pages: [], articles: [] });
  const [searchLoading, setSearchLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const megaMenuCloseTimer = useRef(null);
  const contactMenuCloseTimer = useRef(null);
  const megaMenuTriggerRef = useRef(null);
  const [megaMenuTop, setMegaMenuTop] = useState(0);

  const updateMegaMenuPosition = () => {
    const trigger = megaMenuTriggerRef.current;
    if (trigger) setMegaMenuTop(Math.round(trigger.getBoundingClientRect().bottom + 8));
  };

  const openMegaMenu = () => {
    if (megaMenuCloseTimer.current) clearTimeout(megaMenuCloseTimer.current);
    updateMegaMenuPosition();
    setMegaMenuOpen(true);
  };

  const closeMegaMenu = () => {
    if (megaMenuCloseTimer.current) clearTimeout(megaMenuCloseTimer.current);
    setMegaMenuOpen(false);
  };

  const scheduleMegaMenuClose = () => {
    if (megaMenuCloseTimer.current) clearTimeout(megaMenuCloseTimer.current);
    megaMenuCloseTimer.current = setTimeout(() => setMegaMenuOpen(false), 180);
  };

  const openContactMenu = () => {
    if (contactMenuCloseTimer.current) clearTimeout(contactMenuCloseTimer.current);
    setContactDropdownOpen(true);
  };

  const closeContactMenu = () => {
    if (contactMenuCloseTimer.current) clearTimeout(contactMenuCloseTimer.current);
    setContactDropdownOpen(false);
  };

  const scheduleContactMenuClose = () => {
    if (contactMenuCloseTimer.current) clearTimeout(contactMenuCloseTimer.current);
    contactMenuCloseTimer.current = setTimeout(() => setContactDropdownOpen(false), 220);
  };

  useEffect(() => () => {
    if (megaMenuCloseTimer.current) clearTimeout(megaMenuCloseTimer.current);
    if (contactMenuCloseTimer.current) clearTimeout(contactMenuCloseTimer.current);
  }, []);

  useEffect(() => () => {
    if (megaMenuCloseTimer.current) clearTimeout(megaMenuCloseTimer.current);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('storefront-dark', storefrontDark);
    localStorage.setItem('fairqueen_storefront_theme', storefrontDark ? 'dark' : 'light');
    return () => document.documentElement.classList.remove('storefront-dark');
  }, [storefrontDark]);

  useEffect(() => {
    if (!megaMenuOpen) return undefined;
    const reposition = () => updateMegaMenuPosition();
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [megaMenuOpen]);

  useEffect(() => {
    closeMegaMenu();
    setMobileMenuOpen(false);
  }, [location.pathname, location.search]);

  // Scroll position state for sticky transparent-to-solid transitions
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isHome = location.pathname === '/';

  // Popup Modal States
  const [showPopupModal, setShowPopupModal] = useState(false);
  const [popupEmail, setPopupEmail] = useState('');
  const [popupSubmitting, setPopupSubmitting] = useState(false);
  const [popupSuccess, setPopupSuccess] = useState(false);

  // Zustand Cart
  const cartItemsCount = useCartStore(state => state.items.reduce((sum, item) => sum + item.quantity, 0));

  // Zustand Wishlist
  const wishlistItems = useWishlistStore(state => state.items);
  const wishlistCount = wishlistItems.length;
  const toggleWishlist = useWishlistStore(state => state.toggleItem);
  const [showWishlistDrawer, setShowWishlistDrawer] = useState(false);
  const [animateCart, setAnimateCart] = useState(false);

  // Fetch Settings
  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await fetch('/api/settings');
      return res.json();
    }
  });

  // Fetch Collections with Category Relations
  const { data: collectionsData } = useQuery({
    queryKey: ['storefront-collections'],
    queryFn: async () => {
      const res = await fetch('/api/collections');
      return res.json();
    }
  });
  const collections = collectionsData?.data || [];
  const megaMenuCollections = collections.filter((collection) => collection.show_in_mega_menu !== false);

  const setCurrency = useCartStore(state => state.setCurrency);
  useEffect(() => {
    if (settingsData?.data?.settings) {
      const s = settingsData.data.settings;
      setCurrency(s.system_currency_symbol, s.system_currency_code);
    }
  }, [settingsData, setCurrency]);

  const ecommerce = settingsData?.data?.ecommerce || { name: 'Dansolam' };
  const settings = settingsData?.data?.settings || {
    logo_url: '/images/logo.png',
    theme_primary_color: '#AA8374',
    tagline: 'Luxury Skincare & Beauty',
    description: 'Transform your skin with luxury spa routines and premium beauty products.',
    whatsapp_number: '2348000000000',
    instagram_url: 'https://dansolam.com/',
    store_address: 'Abuja, Nigeria',
    opening_hours: 'Monday–Saturday: 9:00 AM - 6:00 PM',
    announcement_show: 'true',
    announcement_text: '✨ Free shipping on select beauty orders | Dansolam Luxury Sanctuary',
    promo_popup_show: 'false',
    promo_popup_title: 'Welcome to Dansolam',
    promo_popup_body: 'Save 10% off your first beauty purchase.',
    promo_popup_image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=350',
    promo_popup_delay: '3000'
  };
  const allowOverselling = settings.allow_overselling === 'true' || settings.allow_overselling === true || settings.allow_overselling === '1' || settings.allow_overselling === 1;

  // Maintenance Mode Guard
  const [maintenanceBypassed, setMaintenanceBypassed] = useState(() => {
    return sessionStorage.getItem('fairqueen_maintenance_bypass') === 'true';
  });

  const isMaintenanceActive = ['true', '1', true, 1].includes(settings.maintenance_mode_enabled);
  const searchParams = new URLSearchParams(location.search);
  const isUrlBypass = searchParams.get('bypass') === (settings.maintenance_bypass_key || 'admin123') || searchParams.get('preview') === '1';

  if (isMaintenanceActive && !maintenanceBypassed && !isUrlBypass && !localStorage.getItem('fairqueen_token')) {
    return <MaintenancePage settings={settings} onBypass={() => setMaintenanceBypassed(true)} />;
  }
  const whatsappNumber = String(settings.whatsapp_number || '').replace(/[^0-9]/g, '');
  const socialLinks = [
    { label: 'Instagram', url: settings.instagram_url, network: 'instagram' },
    { label: 'Facebook', url: settings.facebook_url, network: 'facebook' },
    { label: 'TikTok', url: settings.tiktok_url, network: 'tiktok' },
    { label: 'YouTube', url: settings.youtube_url, network: 'youtube' },
    { label: 'X', url: settings.twitter_url, network: 'x' },
  ].filter(link => link.url);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setShowSearchModal(false);
      setMobileMenuOpen(false);
    }
  };

  // Scroll to top on pathname or query search changes, except if hash is specified
  useEffect(() => {
    if (!location.hash) {
      window.scrollTo(0, 0);
    }
  }, [location.pathname, location.search]);

  // 1. Dynamic brand CSS colors & GSAP route reveals
  useEffect(() => {
    if (settings.theme_primary_color) {
      document.documentElement.style.setProperty('--color-primary', settings.theme_primary_color);
    }
  }, [settings.theme_primary_color]);

  // 1b. Listen for cart add tracing animations
  useEffect(() => {
    const handleAnimateToCart = (e) => {
      const { startX, startY, imageUrl } = e.detail;

      const desktopCart = document.getElementById('cart-btn-desktop');
      const mobileCart = document.getElementById('cart-btn-mobile');

      let targetEl = desktopCart;
      if (window.innerWidth < 768 && mobileCart) {
        targetEl = mobileCart;
      }

      if (!targetEl) return;

      const targetRect = targetEl.getBoundingClientRect();
      const endX = targetRect.left + targetRect.width / 2;
      const endY = targetRect.top + targetRect.height / 2;

      const flyer = document.createElement('div');
      flyer.className = 'fixed pointer-events-none z-[9999] flex items-center justify-center';
      flyer.style.left = `${startX - 16}px`;
      flyer.style.top = `${startY - 16}px`;
      flyer.style.width = '32px';
      flyer.style.height = '32px';
      flyer.style.borderRadius = '50%';
      flyer.style.border = '2px solid #C5A880';
      flyer.style.boxShadow = '0 10px 25px rgba(197, 168, 128, 0.5)';
      flyer.style.backgroundColor = '#fff';
      flyer.style.overflow = 'hidden';

      if (imageUrl) {
        const img = document.createElement('img');
        img.src = imageUrl;
        img.className = 'w-full h-full object-cover';
        flyer.appendChild(img);
      } else {
        flyer.innerHTML = '✨';
      }

      document.body.appendChild(flyer);

      import('gsap').then(({ gsap }) => {
        gsap.to(flyer, {
          x: endX - startX,
          y: endY - startY,
          scale: 0.3,
          opacity: 0.7,
          duration: 0.8,
          ease: 'power2.out',
          onComplete: () => {
            flyer.remove();
            setAnimateCart(true);
            setTimeout(() => setAnimateCart(false), 600);
          }
        });
      });
    };

    window.addEventListener('animate-to-cart', handleAnimateToCart);
    return () => window.removeEventListener('animate-to-cart', handleAnimateToCart);
  }, []);

  // 2. Trigger promo newsletter popup
  useEffect(() => {
    const showPopup = settings.promo_popup_show === 'true' || settings.promo_popup_show === true;
    if (showPopup) {
      const isDismissed = localStorage.getItem('fairqueen_popup_dismissed');
      if (!isDismissed) {
        const delay = parseInt(settings.promo_popup_delay || 3000);
        const timer = setTimeout(() => {
          setShowPopupModal(true);
        }, delay);
        return () => clearTimeout(timer);
      }
    }
  }, [settings.promo_popup_show, settings.promo_popup_delay]);

  // Search Debouncer
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults({ products: [], pages: [], articles: [] });
      return;
    }

    setSearchLoading(true);
    const delayDebounce = setTimeout(() => {
      fetch(`/api/search-all?q=${encodeURIComponent(searchQuery.trim())}`)
        .then(res => res.json())
        .then(res => {
          if (res.success) {
            setSearchResults(res.data);
          }
          setSearchLoading(false);
        })
        .catch(() => setSearchLoading(false));
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleDismissPopup = () => {
    setShowPopupModal(false);
    localStorage.setItem('fairqueen_popup_dismissed', 'true');
  };

  const handlePopupSubmit = async (e) => {
    e.preventDefault();
    if (!popupEmail.trim()) return;

    setPopupSubmitting(true);
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: popupEmail.trim() })
      });
      const data = await res.json();
      setPopupSubmitting(false);

      if (data.success) {
        setPopupSuccess(true);
        setTimeout(() => {
          handleDismissPopup();
        }, 3000);
      } else {
        systemToast.error(data.message || 'Subscription failed');
      }
    } catch (e) {
      setPopupSubmitting(false);
      systemToast.error('Subscription failed');
    }
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const announcementActive = settings.announcement_show === 'true' || settings.announcement_show === true;

  return (
    <div className="storefront-shell luxury-storefront flex flex-col min-h-[100dvh] relative font-sans text-gray-800">

      {/* 0. Announcement Bar */}
      {announcementActive && (
        <AnimatedAnnouncementBar text={settings.announcement_text} />
      )}

      {/* 1. Header Navigation Pill (BeautyCenter Design for secondary pages / scrolled state) */}
      {(!isHome || scrolled) && (
        <header className="sticky top-3 z-50 px-3 sm:px-6 max-w-7xl mx-auto w-full transition-all duration-300">
        <div className="bg-white/85 dark:bg-[#1a1817]/90 backdrop-blur-xl border border-white/80 dark:border-white/10 rounded-full px-3.5 py-2 shadow-lg shadow-black/5 flex items-center justify-between gap-3">
          
          {/* Mobile Menu Hamburger Trigger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition-all cursor-pointer"
            aria-label="Open Mobile Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Desktop Left Nav Pill Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-[#f5ebe6]/80 dark:bg-neutral-800/80 p-1 rounded-full border border-gray-100 dark:border-neutral-700/50">
            {/* Logo on far left before Home */}
            <Link to="/" className="px-3.5 py-1.5 text-sm font-extrabold tracking-tight text-[#1a1a1a] dark:text-white font-sans shrink-0 flex items-center gap-1 hover:opacity-90 transition-opacity">
              {settings?.logo_url ? (
                <img src={settings.logo_url} alt={ecommerce.name} className="h-5 object-contain" />
              ) : (
                <span>Beauty<span className="font-sans italic text-[#b86b53] font-medium">Center</span></span>
              )}
            </Link>

            <Link
              to="/"
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all ${
                isActive('/') ? 'bg-[#1a1a1a] text-white shadow-sm' : 'text-gray-700 dark:text-gray-300 hover:text-gray-950 dark:hover:text-white'
              }`}
            >
              Home
            </Link>

            {/* Shop with Mega Dropdown */}
            <div
              ref={megaMenuTriggerRef}
              className="static"
              onMouseEnter={openMegaMenu}
              onMouseLeave={scheduleMegaMenuClose}
            >
              <Link
                to="/shop"
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all flex items-center gap-1 ${
                  isActive('/shop') ? 'bg-[#1a1a1a] text-white shadow-sm' : 'text-gray-700 dark:text-gray-300 hover:text-gray-950 dark:hover:text-white'
                }`}
              >
                Shop <span className={`text-[9px] opacity-60 transition-transform ${megaMenuOpen ? 'rotate-180' : ''}`}>▼</span>
              </Link>

              {/* Mega Dropdown Panel Portal */}
              {typeof document !== 'undefined' && createPortal(
                <div
                  onMouseEnter={openMegaMenu}
                  onMouseLeave={scheduleMegaMenuClose}
                  style={{ top: `${megaMenuTop}px` }}
                  className={`luxury-mega-menu fixed left-1/2 -translate-x-1/2 w-[min(1200px,calc(100vw-2rem))] max-h-[calc(100dvh-8rem)] overflow-y-auto overscroll-contain bg-white/95 dark:bg-[#1a1817]/95 backdrop-blur-md border border-gray-100 dark:border-neutral-800 rounded-3xl shadow-xl p-8 grid grid-cols-[minmax(0,4fr)_minmax(220px,1fr)] gap-8 z-[100] transition-all ${
                    megaMenuOpen ? 'opacity-100 translate-y-0 visible' : 'opacity-0 -translate-y-2 invisible pointer-events-none'
                  }`}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 items-start min-w-0">
                    {megaMenuCollections.map((col) => (
                      <div key={col.id} className="flex min-w-0 flex-col gap-3">
                        <span className="font-sans font-extrabold text-xs uppercase tracking-wider text-gray-950 dark:text-white border-b border-gray-200 dark:border-neutral-800 pb-2.5">
                          {col.name}
                        </span>
                        <div className="flex flex-col gap-2.5 text-xs text-gray-600 dark:text-gray-400">
                          {col.categories && col.categories.length > 0 ? (
                            col.categories.map((cat) => (
                              <Link
                                key={cat.id}
                                to={`/shop?category=${cat.slug}`}
                                onClick={closeMegaMenu}
                                className="hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-800 px-2 py-1 rounded-lg transition-all block font-bold"
                              >
                                {cat.name}
                              </Link>
                            ))
                          ) : (
                            <span className="text-[10px] text-gray-400 italic">No categories linked</span>
                          )}
                          <Link
                            onClick={closeMegaMenu}
                            to={`/shop?collection=${col.slug}`}
                            className="hover:text-black dark:hover:text-white font-bold mt-2 text-[11px] flex items-center gap-0.5 group px-2 py-1 rounded-lg"
                          >
                            Shop {col.name}
                            <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                          </Link>
                        </div>
                      </div>
                    ))}
                    {megaMenuCollections.length === 0 && (
                      <div className="col-span-full py-6 text-xs text-gray-400">No collections featured in this menu.</div>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-col gap-3 border-l border-gray-100 dark:border-neutral-800 pl-8 h-full justify-between">
                    <span className="font-sans font-extrabold text-xs uppercase tracking-wider text-gray-950 dark:text-white border-b border-gray-200 dark:border-neutral-800 pb-2.5 flex items-center gap-1.5">
                      ✨ Featured Offers
                    </span>
                    <MegaMenuAdSlideshow ads={settings.mega_menu_ads} />
                  </div>
                </div>,
                document.body
              )}
            </div>

            <Link
              to="/pages/about-us"
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all ${
                isActive('/pages/about-us') ? 'bg-[#1a1a1a] text-white shadow-sm' : 'text-gray-700 dark:text-gray-300 hover:text-gray-950 dark:hover:text-white'
              }`}
            >
              About Us
            </Link>

            {settings?.show_gallery_page !== 'false' && (
              <Link
                to="/gallery"
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all ${
                  isActive('/gallery') ? 'bg-[#1a1a1a] text-white shadow-sm' : 'text-gray-700 dark:text-gray-300 hover:text-gray-950 dark:hover:text-white'
                }`}
              >
                Gallery
              </Link>
            )}

            {settings?.show_blog_page !== 'false' && (
              <Link
                to="/blog"
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all ${
                  isActive('/blog') ? 'bg-[#1a1a1a] text-white shadow-sm' : 'text-gray-700 dark:text-gray-300 hover:text-gray-950 dark:hover:text-white'
                }`}
              >
                Blog
              </Link>
            )}

            <Link
              to="/reviews"
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all ${
                isActive('/reviews') ? 'bg-[#1a1a1a] text-white shadow-sm' : 'text-gray-700 dark:text-gray-300 hover:text-gray-950 dark:hover:text-white'
              }`}
            >
              Reviews
            </Link>

            <Link
              to="/order-tracking"
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all ${
                isActive('/order-tracking') ? 'bg-[#1a1a1a] text-white shadow-sm' : 'text-gray-700 dark:text-gray-300 hover:text-gray-950 dark:hover:text-white'
              }`}
            >
              Track Order
            </Link>

            <Link
              to="/contact"
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all ${
                isActive('/contact') ? 'bg-[#1a1a1a] text-white shadow-sm' : 'text-gray-700 dark:text-gray-300 hover:text-gray-950 dark:hover:text-white'
              }`}
            >
              Contact
            </Link>
          </nav>

          {/* Right Action Icons & Pill Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSearchModal(true)}
              className="w-9 h-9 rounded-full bg-[#f8f5f2] dark:bg-neutral-800 border border-gray-200/60 dark:border-neutral-700 flex items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-white transition-all cursor-pointer shadow-2xs"
              title="Search store"
            >
              <Search className="w-4 h-4" />
            </button>
            <Link
              to="/account"
              className="w-9 h-9 rounded-full bg-[#f8f5f2] dark:bg-neutral-800 border border-gray-200/60 dark:border-neutral-700 flex items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-white transition-all shadow-2xs"
              title="Account"
            >
              <User className="w-4 h-4" />
            </Link>
            <button
              type="button"
              onClick={() => setShowWishlistDrawer(true)}
              className="relative w-9 h-9 rounded-full bg-[#f8f5f2] dark:bg-neutral-800 border border-gray-200/60 dark:border-neutral-700 flex items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-white transition-all cursor-pointer shadow-2xs"
              title="Wishlist"
            >
              <Heart className="w-4 h-4" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#b86b53] text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {wishlistCount}
                </span>
              )}
            </button>
            <Link
              to="/cart"
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#1a1a1a] text-white text-xs font-semibold hover:bg-neutral-800 transition-all shadow-md"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">Cart</span>
              {cartItemsCount > 0 && (
                <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-[10px] font-mono">
                  {cartItemsCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>
      )}

      {/* Slide-out Mobile Navigation Drawer */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-xs z-[60] transition-opacity duration-300 md:hidden ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        onClick={() => setMobileMenuOpen(false)}
      >
        <div
          onClick={e => e.stopPropagation()}
          className={`fixed top-0 bottom-0 left-0 w-80 max-w-[85vw] bg-white z-[60] p-6 flex flex-col gap-6 shadow-2xl transition-transform duration-300 rounded-r-3xl ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <span className="font-serif font-bold text-gray-900 text-base">{ecommerce.name}</span>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-1.5 hover:bg-gray-50 rounded-full text-gray-400 hover:text-gray-950 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Trigger */}
          <div
            onClick={() => {
              setMobileMenuOpen(false);
              setShowSearchModal(true);
            }}
            className="flex items-center relative cursor-pointer"
          >
            <div className="pl-10 pr-4 py-2.5 text-xs rounded-full border border-gray-200 text-gray-400 bg-gray-55/30 w-full select-none font-semibold">
              Search ecommerce catalog...
            </div>
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-4" />
          </div>

          {/* Nav Links */}
          <nav className="flex flex-col gap-4 text-base md:text-lg font-bold text-gray-900">
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className="hover:text-primary transition-colors py-1 flex items-center justify-between">
              Home <ArrowUpRight className="w-3.5 h-3.5 text-gray-300" />
            </Link>
            <Link to="/shop" onClick={() => setMobileMenuOpen(false)} className="hover:text-primary transition-colors py-1 flex items-center justify-between">
              Shop All Catalog <ArrowUpRight className="w-3.5 h-3.5 text-gray-300" />
            </Link>
            <Link to="/pages/about-us" onClick={() => setMobileMenuOpen(false)} className="hover:text-primary transition-colors py-1 flex items-center justify-between">
              About Us <ArrowUpRight className="w-3.5 h-3.5 text-gray-300" />
            </Link>
            <Link to="/pages/size-guide" onClick={() => setMobileMenuOpen(false)} className="hover:text-primary transition-colors py-1 flex items-center justify-between">
              Size Guide & Fit <ArrowUpRight className="w-3.5 h-3.5 text-gray-300" />
            </Link>
            {settings?.show_gallery_page !== 'false' && (
              <Link to="/gallery" onClick={() => setMobileMenuOpen(false)} className="hover:text-primary transition-colors py-1 flex items-center justify-between">
                Gallery Lookbook <ArrowUpRight className="w-3.5 h-3.5 text-gray-300" />
              </Link>
            )}
            {settings?.show_blog_page !== 'false' && (
              <Link to="/blog" onClick={() => setMobileMenuOpen(false)} className="hover:text-primary transition-colors py-1 flex items-center justify-between">
                Ecommerce Blog <ArrowUpRight className="w-3.5 h-3.5 text-gray-300" />
              </Link>
            )}
            <Link to="/reviews" onClick={() => setMobileMenuOpen(false)} className="hover:text-primary transition-colors py-1 flex items-center justify-between">
              Customer Reviews <ArrowUpRight className="w-3.5 h-3.5 text-gray-300" />
            </Link>
            <Link to="/order-tracking" onClick={() => setMobileMenuOpen(false)} className="hover:text-primary transition-colors py-1 flex items-center justify-between">
              Track Your Order <ArrowUpRight className="w-3.5 h-3.5 text-gray-300" />
            </Link>
            <Link to="/contact" onClick={() => setMobileMenuOpen(false)} className="hover:text-primary transition-colors py-1 flex items-center justify-between">
              Contact Us <ArrowUpRight className="w-3.5 h-3.5 text-gray-300" />
            </Link>
            {settings?.enable_fitting_sessions !== 'false' && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setBookFittingModalOpen(true);
                }}
                className="w-full text-left font-bold text-gray-900 hover:text-primary transition-colors py-1 flex items-center justify-between cursor-pointer"
              >
                <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                  ✨ Book VIP Fitting Session
                </span>
                <Sparkles className="w-4 h-4 text-yellow-500" />
              </button>
            )}
            <Link to="/account" onClick={() => setMobileMenuOpen(false)} className="hover:text-primary transition-colors py-1 flex items-center justify-between">
              My Profile & Orders <ArrowUpRight className="w-3.5 h-3.5 text-gray-300" />
            </Link>
            {!!window.localStorage.getItem('fairqueen_admin_token') && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="text-indigo-650 hover:text-indigo-850 transition-colors font-bold border-t border-gray-100 pt-4 flex items-center gap-1.5"
              >
                ⚙️ Go to Admin Dashboard
              </Link>
            )}
          </nav>

          {/* Drawer Footer */}
          <div className="mt-auto border-t border-gray-100 pt-6 text-[10px] text-gray-400 flex flex-col gap-1.5 leading-relaxed">
            <p className="font-semibold text-gray-600 uppercase tracking-wider">{ecommerce.name}</p>
            <p>📍 {settings.store_address}</p>
            <p>🕒 {settings.opening_hours}</p>
            {socialLinks.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-3" aria-label="Social media links">
                {socialLinks.map(({ label, url, network }) => (
                  <a key={label} href={url} target="_blank" rel="noopener noreferrer" aria-label={label} className="w-8 h-8 rounded-full border border-gray-200 bg-white text-gray-700 flex items-center justify-center">
                    <SocialIcon network={network} className="w-3.5 h-3.5" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Page Render Context */}
      <main className={`storefront-main ${location.pathname === '/' ? 'storefront-main--home' : 'storefront-main--inner'} shrink-0 pb-safe-nav md:pb-0 anim-content`}>
        <Outlet />
      </main>

      {/* 3. Footer (Desktop & Tablet) */}
      <footer className="bg-[#0B0B0B] py-16 px-6 md:px-12 text-sm text-gray-300 hidden md:block">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="flex flex-col gap-4">
            <h4 className="font-serif font-bold text-white text-lg leading-none">{ecommerce.name}</h4>
            <p className="text-xs leading-relaxed text-gray-400">{settings.description}</p>
            {socialLinks.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1" aria-label="Social media links">
                {socialLinks.map(({ label, url, network }) => (
                  <a key={label} href={url} target="_blank" rel="noopener noreferrer" aria-label={label} title={label} className="w-9 h-9 rounded-full border border-white/15 bg-white/[0.06] hover:bg-primary hover:border-primary text-white flex items-center justify-center transition-all hover:-translate-y-0.5">
                    <SocialIcon network={network} className="w-4 h-4" />
                  </a>
                ))}
              </div>
            )}
            <p className="text-[11px] text-gray-500 mt-2">© {new Date().getFullYear()} {ecommerce.name}. All Rights Reserved.</p>
          </div>
          <div>
            <h5 className="font-serif font-bold text-white mb-4 text-xs tracking-wider uppercase">Shopping Info</h5>
            <ul className="flex flex-col gap-2.5 text-xs text-gray-300">
              <li><Link to="/shop" className="hover:text-white transition-colors">Shop All Catalog</Link></li>
              <li><Link to="/pages/size-guide" className="hover:text-white transition-colors">Size Guide</Link></li>
              {settings?.show_gallery_page !== 'false' && (
                <li><Link to="/gallery" className="hover:text-white transition-colors">Lookbook Gallery</Link></li>
              )}
              {settings?.show_blog_page !== 'false' && (
                <li><Link to="/blog" className="hover:text-white transition-colors">Style Blog Articles</Link></li>
              )}
              <li><Link to="/reviews" className="hover:text-white transition-colors">Customer Reviews</Link></li>
              <li><Link to="/order-tracking" className="hover:text-white transition-colors">Track Order</Link></li>
              <li><Link to="/pages/faq" className="hover:text-white transition-colors">FAQs</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="font-serif font-bold text-white mb-4 text-xs tracking-wider uppercase">Store Details</h5>
            <ul className="flex flex-col gap-2.5 text-xs text-gray-300 leading-relaxed">
              <li>📍 {settings.store_address}</li>
              <li>🕒 Hours: {settings.opening_hours}</li>
              <li>🚚 Delivery Coverage: Worldwide</li>
            </ul>
          </div>
          <div className="flex flex-col gap-4">
            <h5 className="font-serif font-bold text-white text-xs tracking-wider uppercase">Social Selling Support</h5>
            <p className="text-xs text-gray-400 leading-relaxed">Need size recommendations, quick orders, or photos? Chat with us!</p>
            <a
              href={`https://wa.me/${whatsappNumber}?text=Hello%20${encodeURIComponent(ecommerce.name)}%2C%20I'm%20visiting%2520your%2520online%2520store%2520and%2520need%2520assistance.`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-full text-xs font-semibold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] self-start"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              Chat on WhatsApp
            </a>
          </div>
        </div>

        {/* Brand Assurances Bar */}
        <div className="max-w-6xl mx-auto border-t border-gray-800/80 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <div className="flex flex-wrap gap-4 items-center">
            <Link to="/pages/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <span className="opacity-35">|</span>
            <Link to="/pages/terms-conditions" className="hover:text-white transition-colors">Terms of Service</Link>
            <span className="opacity-35">|</span>
            <Link to="/pages/shipping-delivery" className="hover:text-white transition-colors">Shipping & Returns</Link>
          </div>

          {/* Payment Trust Assurances Icons */}
          <div className="flex items-center gap-3 select-none">
            <span className="text-[10px] font-bold text-white tracking-wider uppercase">SECURE PAYMENT SYSTEMS:</span>

            <div className="flex items-center gap-2">
              {/* VISA Badge */}
              <div className="h-6 px-2.5 bg-white/10 rounded-md border border-white/20 flex items-center justify-center backdrop-blur-xs transition-all hover:bg-white/15" title="Visa">
                <svg className="h-3 w-auto" viewBox="0 0 36 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13.67 0.35L9.04 11.5H6.11L3.71 2.5C3.57 1.95 3.44 1.74 3.01 1.51C2.31 1.14 1.08 0.77 0 0.54L0.06 0.35H5.06C5.7 0.35 6.27 0.77 6.4 1.48L7.63 8.01L10.72 0.35H13.67ZM25.29 8.21C25.31 5.08 20.97 4.9 21.01 3.5C21.03 3.08 21.44 2.62 22.38 2.5C22.84 2.44 24.13 2.39 25.56 3.05L26.11 0.78C25.35 0.5 24.37 0.25 23.15 0.25C20.31 0.25 18.28 1.77 18.26 3.9C18.23 5.5 19.67 6.39 20.76 6.92C21.88 7.47 22.25 7.82 22.24 8.31C22.23 9.06 21.34 9.39 20.5 9.4C19.06 9.42 17.84 8.98 17.18 8.68L16.61 11.02C17.39 11.38 18.82 11.69 20.3 11.7C23.36 11.7 25.28 10.19 25.29 8.21ZM32.74 11.5H35.32L33.06 0.35H30.73C30.22 0.35 29.78 0.64 29.59 1.1L25.33 11.5H28.31L28.9 9.87H32.53L32.74 11.5ZM29.72 7.56L31.25 3.32L32.13 7.56H29.72ZM17.65 0.35L15.34 11.5H12.51L14.82 0.35H17.65Z" fill="#FFFFFF" />
                  <path d="M5.06 0.35H0L0.06 0.54C2.56 1.17 4.7 1.95 6.4 3.05L5.06 0.35Z" fill="#F7B600" />
                </svg>
              </div>

              {/* MASTERCARD Badge */}
              <div className="h-6 px-2.5 bg-white/10 rounded-md border border-white/20 flex items-center justify-center backdrop-blur-xs transition-all hover:bg-white/15" title="Mastercard">
                <svg className="h-3.5 w-auto" viewBox="0 0 24 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="8" cy="8" r="7" fill="#EB001B" />
                  <circle cx="16" cy="8" r="7" fill="#F79E1B" fillOpacity="0.9" />
                  <path d="M12 2.68A6.98 6.98 0 0 0 9.33 8c0 2.24 1.05 4.23 2.67 5.32A6.98 6.98 0 0 0 14.67 8c0-2.24-1.05-4.23-2.67-5.32z" fill="#FF5F00" />
                </svg>
              </div>

              {/* PAYSTACK Badge */}
              <div className="h-6 px-2.5 bg-white/10 rounded-md border border-white/20 flex items-center justify-center backdrop-blur-xs gap-1 transition-all hover:bg-white/15" title="Paystack">
                <svg className="h-3 w-auto" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 5H22V8H2V5Z" fill="#00C3F7" />
                  <path d="M2 11H16V14H2V11Z" fill="#00C3F7" />
                  <path d="M2 17H22V20H2V17Z" fill="#00C3F7" />
                </svg>
                <span className="text-[9px] font-bold text-white tracking-tight">paystack</span>
              </div>

              {/* COD Badge */}
              <div className="h-6 px-2.5 bg-white/10 rounded-md border border-white/20 flex items-center justify-center backdrop-blur-xs gap-1 transition-all hover:bg-white/15" title="Cash on Delivery">
                <Banknote className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[8px] font-bold text-white tracking-wider">COD</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* 4. PWA Bottom Navigation (Mobile Viewports Only) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex items-center justify-around py-2.5 z-40 md:hidden pb-safe">
        <Link to="/" className={`flex flex-col items-center gap-0.5 text-gray-400 hover:text-primary ${isActive('/') && 'text-primary'}`}>
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-medium">Home</span>
        </Link>
        <Link to="/shop" className={`flex flex-col items-center gap-0.5 text-gray-400 hover:text-primary ${isActive('/shop') && 'text-primary'}`}>
          <ShoppingBag className="w-5 h-5" />
          <span className="text-[10px] font-medium">Shop</span>
        </Link>
        <Link to="/shop?focusSearch=true" className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-primary">
          <Search className="w-5 h-5" />
          <span className="text-[10px] font-medium">Search</span>
        </Link>
        <Link
          to="/cart"
          id="cart-btn-mobile"
          className={`flex flex-col items-center gap-0.5 text-gray-400 hover:text-primary relative ${isActive('/cart') && 'text-primary'} ${animateCart ? 'animate-spiral-hit' : ''}`}
        >
          <ShoppingCart className="w-5 h-5" />
          <span className="text-[10px] font-medium">Cart</span>
          {cartItemsCount > 0 && (
            <span className="absolute top-0 right-1.5 bg-primary text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
              {cartItemsCount}
            </span>
          )}
        </Link>
        <Link to="/account" className={`flex flex-col items-center gap-0.5 text-gray-400 hover:text-primary ${isActive('/account') && 'text-primary'}`}>
          <User className="w-5 h-5" />
          <span className="text-[10px] font-medium">Account</span>
        </Link>
      </nav>

      {/* 5. Floating WhatsApp Click-to-Chat Button with Stretcher Effect */}
      <a
        href={`https://wa.me/${whatsappNumber}?text=Hello%20${encodeURIComponent(ecommerce.name)}%2C%20I'm%20browsing%20your%20store%20and%20would%20love%20to%20make%20an%20inquiry.`}
        target="_blank"
        rel="noopener noreferrer"
        className="storefront-whatsapp-fab text-white p-3 md:p-3.5 rounded-full shadow-2xl z-40 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-105 active:scale-95 flex items-center gap-2.5 max-w-[52px] hover:max-w-[260px] overflow-hidden group border-2 border-white/30 backdrop-blur-xs cursor-pointer select-none"
        aria-label="WhatsApp Chat Support"
      >
        {/* Pulsing Radar Ring */}
        <span className="absolute inset-0 rounded-full animate-ping opacity-35 pointer-events-none" style={{ backgroundColor: 'var(--color-primary)' }} />

        {/* WhatsApp Icon */}
        <div className="relative shrink-0 flex items-center justify-center">
          <MessageCircle className="w-6 h-6 fill-white text-white transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-300 rounded-full border border-white animate-pulse" />
        </div>

        {/* Stretcher Expanded Text Bubble */}
        <div className="opacity-0 group-hover:opacity-100 whitespace-nowrap transition-all duration-300 transform translate-x-2 group-hover:translate-x-0 font-sans font-bold text-xs pr-2 flex flex-col justify-center leading-tight">
          <span>Need Help?</span>
          <span className="text-[10px] font-normal opacity-90">Chat on WhatsApp 💬</span>
        </div>
      </a>

      {/* 6. PROMOTIONAL POPUP NEWSLETTER MODAL */}
      {showPopupModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/65 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative flex flex-col md:flex-row border border-gray-100">
            {/* Close Button */}
            <button
              onClick={handleDismissPopup}
              className="absolute top-3 right-3 p-1.5 bg-black/40 hover:bg-black text-white rounded-full transition-all z-10 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Left Col: Imagery */}
            <div className="w-full md:w-5/12 bg-gray-50 h-36 md:h-auto shrink-0 relative">
              <img loading="lazy" decoding="async" src={settings.promo_popup_image} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-4 md:hidden">
                <span className="text-white font-serif text-xs font-bold">{settings.promo_popup_title}</span>
              </div>
            </div>

            {/* Right Col: Newsletter signup form */}
            <div className="flex-1 p-6 md:p-8 flex flex-col justify-center gap-4">
              <div className="hidden md:block">
                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full mb-2">
                  <Gift className="w-3.5 h-3.5" /> EXCLUSIVE OFFER
                </span>
                <h3 className="font-serif font-bold text-lg text-gray-950 leading-tight">{settings.promo_popup_title}</h3>
              </div>
              <p
                className="text-xs text-gray-500 leading-relaxed font-sans"
                dangerouslySetInnerHTML={{ __html: settings.promo_popup_body }}
              />

              {popupSuccess ? (
                <div className="bg-green-50 border border-green-200 text-green-600 rounded-lg p-3 text-xs font-semibold flex items-center gap-1.5">
                  ✓ Successfully subscribed! Check your mail for 10% off.
                </div>
              ) : (
                <form onSubmit={handlePopupSubmit} className="flex flex-col gap-2">
                  <div className="flex items-center relative">
                    <input
                      type="email"
                      required
                      placeholder="Enter your email address"
                      value={popupEmail}
                      onChange={(e) => setPopupEmail(e.target.value)}
                      className="px-4 py-2.5 text-xs rounded-full border border-gray-250 bg-white w-full pr-10 focus:outline-none focus:border-primary"
                    />
                    <button
                      type="submit"
                      disabled={popupSubmitting}
                      className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-primary text-white rounded-full text-[10px] font-semibold flex items-center justify-center cursor-pointer"
                    >
                      {popupSubmitting ? '...' : <ArrowRight className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <span className="text-[9px] text-gray-400">Join 5k+ fashion queens. Unsubscribe at any time.</span>
                </form>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Search Typeahead Popup Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-start justify-center pt-[10vh] p-4">
          <div className="fixed inset-0" onClick={() => setShowSearchModal(false)} />

          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-gray-150 relative z-10 flex flex-col max-h-[75vh] overflow-hidden animate-scale-up">
            {/* Search Input Header */}
            <div className="p-4 border-b border-gray-100 flex items-center gap-3">
              <Search className="w-5 h-5 text-gray-400 shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="Search products, pages, guides, blog articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-2 text-sm text-gray-800 focus:outline-none placeholder-gray-400 bg-transparent"
              />
              {searchLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary shrink-0" />
              )}
              <button
                onClick={() => {
                  setSearchQuery('');
                  setShowSearchModal(false);
                }}
                className="p-1.5 hover:bg-gray-105 rounded-xl text-gray-400 hover:text-gray-600 transition-all shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Results Area */}
            <div className="flex-1 overflow-y-auto p-5">
              {!searchQuery.trim() || searchQuery.trim().length < 2 ? (
                <div className="flex flex-col gap-6">
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-2.5">Quick Page Links</span>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        to="/shop"
                        onClick={() => setShowSearchModal(false)}
                        className="px-4 py-2 bg-gray-50 hover:bg-primary/5 hover:text-primary border border-gray-100 rounded-full text-xs text-gray-600 transition-all font-semibold"
                      >
                        🛍️ Shop Catalog
                      </Link>
                      <Link
                        to="/pages/about-us"
                        onClick={() => setShowSearchModal(false)}
                        className="px-4 py-2 bg-gray-50 hover:bg-primary/5 hover:text-primary border border-gray-100 rounded-full text-xs text-gray-600 transition-all font-semibold"
                      >
                        ✨ About Dansolam
                      </Link>
                      <Link
                        to="/pages/size-guide"
                        onClick={() => setShowSearchModal(false)}
                        className="px-4 py-2 bg-gray-50 hover:bg-primary/5 hover:text-primary border border-gray-100 rounded-full text-xs text-gray-600 transition-all font-semibold"
                      >
                        📏 Size metrics Guide
                      </Link>
                      <Link
                        to="/pages/faq"
                        onClick={() => setShowSearchModal(false)}
                        className="px-4 py-2 bg-gray-50 hover:bg-primary/5 hover:text-primary border border-gray-100 rounded-full text-xs text-gray-600 transition-all font-semibold"
                      >
                        💡 FAQ & Shipping
                      </Link>
                      <Link
                        to="/reviews"
                        onClick={() => setShowSearchModal(false)}
                        className="px-4 py-2 bg-gray-50 hover:bg-primary/5 hover:text-primary border border-gray-100 rounded-full text-xs text-gray-600 transition-all font-semibold"
                      >
                        ⭐ Customer Reviews
                      </Link>
                      <Link
                        to="/contact"
                        onClick={() => setShowSearchModal(false)}
                        className="px-4 py-2 bg-gray-50 hover:bg-primary/5 hover:text-primary border border-gray-100 rounded-full text-xs text-gray-600 transition-all font-semibold"
                      >
                        📞 Contact Us
                      </Link>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Type to search anything</span>
                    <p className="text-xs text-gray-450 leading-relaxed">Start typing to search products, content pages, size guides, shipping policies, and blog articles instantly.</p>
                  </div>
                </div>
              ) : (searchResults.products.length === 0 && searchResults.pages.length === 0 && searchResults.articles.length === 0) ? (
                <div className="text-center py-10">
                  <span className="text-3xl">🔍</span>
                  <p className="text-xs font-semibold text-gray-700 mt-2">No matching results found</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Check spelling or try a different term.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {/* Products */}
                  {searchResults.products.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block border-b border-gray-50 pb-2">Products</span>
                      <div className="flex flex-col gap-2">
                        {searchResults.products.map(prod => {
                          const price = prod.sale_price || prod.price;
                          return (
                            <Link
                              key={prod.id}
                              to={`/product/${prod.slug}`}
                              onClick={() => {
                                setShowSearchModal(false);
                                setSearchQuery('');
                              }}
                              className="flex items-center gap-4 p-2 rounded-2xl hover:bg-gray-55/50 transition-all group"
                            >
                              <div className="w-12 h-12 rounded-xl bg-gray-50 overflow-hidden shrink-0 border border-gray-100">
                                <img loading="lazy" decoding="async"
                                  src={prod.images?.[0]?.image_url || '/images/products/placeholder.jpg'}
                                  alt={prod.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className="text-xs font-bold text-gray-800 truncate group-hover:text-primary transition-colors">{prod.name}</h5>
                                <span className="text-[10px] text-gray-400 block truncate">{prod.short_description || 'View product details'}</span>
                              </div>
                              <span className="text-xs font-bold text-gray-900 shrink-0">
                                {window.localStorage.getItem('fairqueen_currency_symbol') || '₦'}{parseFloat(price).toLocaleString()}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Pages */}
                  {searchResults.pages.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block border-b border-gray-50 pb-2">Pages</span>
                      <div className="flex flex-col gap-2">
                        {searchResults.pages.map(page => (
                          <Link
                            key={page.id}
                            to={`/pages/${page.slug}`}
                            onClick={() => {
                              setShowSearchModal(false);
                              setSearchQuery('');
                            }}
                            className="flex items-center gap-4 p-2.5 rounded-2xl hover:bg-gray-55/50 transition-all group"
                          >
                            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100/50">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="text-xs font-bold text-gray-800 truncate group-hover:text-primary transition-colors">{page.title}</h5>
                              <span className="text-[10px] text-gray-400 block truncate">pages/{page.slug}</span>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity animate-fade-in" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Articles */}
                  {searchResults.articles.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block border-b border-gray-50 pb-2">Blog Articles</span>
                      <div className="flex flex-col gap-2">
                        {searchResults.articles.map(art => (
                          <Link
                            key={art.id}
                            to={`/blog/${art.slug}`}
                            onClick={() => {
                              setShowSearchModal(false);
                              setSearchQuery('');
                            }}
                            className="flex items-center gap-4 p-2.5 rounded-2xl hover:bg-gray-55/50 transition-all group"
                          >
                            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100/50">
                              <BookOpen className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="text-xs font-bold text-gray-800 truncate group-hover:text-primary transition-colors">{art.title}</h5>
                              <span className="text-[10px] text-gray-400 block truncate">{art.excerpt || 'Read blog post'}</span>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity animate-fade-in" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Wishlist Sliding Drawer Overlay */}
      <div
        className={`fixed inset-0 bg-black/60 z-[60] flex justify-end transition-opacity duration-300 ${showWishlistDrawer ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        onClick={() => setShowWishlistDrawer(false)}
      >
        <div
          onClick={e => e.stopPropagation()}
          className={`bg-white w-full max-w-md h-full shadow-2xl p-6 flex flex-col gap-6 transition-transform duration-300 rounded-l-3xl ${showWishlistDrawer ? 'translate-x-0' : 'translate-x-full'
            }`}
        >
          {/* Close Button */}
          <button onClick={() => setShowWishlistDrawer(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-55 cursor-pointer">
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="border-b border-gray-100 pb-4">
            <h3 className="font-serif font-bold text-gray-900 text-lg flex items-center gap-2">
              <Heart className="w-5 h-5 fill-red-500 text-red-500" />
              My Wishlist
              <span className="text-xs text-gray-400 font-sans font-medium">({wishlistCount} items)</span>
            </h3>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto flex flex-col gap-4">
            {wishlistItems.length > 0 ? (
              wishlistItems.map((prod) => {
                const price = prod.sale_price || prod.price;
                return (
                  <div key={prod.id} className="flex gap-4 p-3 bg-gray-55/35 hover:bg-gray-50 rounded-2xl border border-gray-150/60 transition-all group relative">
                    {/* Product Image */}
                    <div className="w-16 h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-100">
                      <img loading="lazy" decoding="async" src={prod.images?.[0]?.image_url || '/images/products/placeholder.jpg'} alt={prod.name} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div>
                        <h4 onClick={() => { setShowWishlistDrawer(false); navigate(`/product/${prod.slug}`); }} className="font-bold text-xs md:text-sm text-gray-800 leading-snug hover:text-primary transition-colors truncate cursor-pointer">
                          {prod.name}
                        </h4>
                        <span className="text-[10px] text-gray-400 font-medium block mt-0.5">{prod.category?.name || 'Designer Wear'}</span>
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-2">
                        <span className="font-bold text-xs md:text-sm text-gray-905">
                          {useCartStore.getState().currencySymbol}{parseFloat(price).toLocaleString()}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {prod.stock_quantity <= 0 && !allowOverselling ? (
                            <span className="text-[9px] font-bold text-red-500 uppercase tracking-wider">Out of Stock</span>
                          ) : (
                            <button
                              onClick={() => {
                                useCartStore.getState().addItem(prod, prod.variants?.[0] || null, 1, allowOverselling);
                                systemToast.success(`${prod.name} added to cart!`);
                              }}
                              className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-white text-[10px] font-bold rounded-full uppercase tracking-wider shadow-sm transition-all cursor-pointer"
                            >
                              + Cart
                            </button>
                          )}

                          <button
                            onClick={() => toggleWishlist(prod)}
                            className="p-1.5 text-gray-455 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all cursor-pointer"
                            title="Remove from Wishlist"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-16">
                <span className="text-4xl text-gray-300">🖤</span>
                <h4 className="font-bold text-gray-700 text-sm">Your Wishlist is Empty</h4>
                <p className="text-xs text-gray-400 max-w-[220px] leading-relaxed">
                  Save items you love here to check them out later.
                </p>
                <button
                  onClick={() => { setShowWishlistDrawer(false); navigate('/shop'); }}
                  className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-full mt-2 shadow-sm cursor-pointer"
                >
                  Explore Catalog
                </button>
              </div>
            )}
          </div>

          {/* Drawer Footer - Actions */}
          <div className="pt-4 border-t border-gray-100 flex flex-col gap-2 mt-auto shrink-0">
            <button
              onClick={() => {
                setShowWishlistDrawer(false);
                navigate('/cart');
              }}
              className="w-full py-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md shadow-primary/20 hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer group hover:scale-[1.01] active:scale-[0.99]"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>View Shopping Cart</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </button>

            <button
              onClick={() => {
                setShowWishlistDrawer(false);
                navigate('/shop');
              }}
              className="w-full py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Continue Shopping</span>
            </button>
          </div>
        </div>
      </div>

      {/* Book Fitting Session Modal */}
      <BookFittingSessionModal
        isOpen={bookFittingModalOpen}
        onClose={() => setBookFittingModalOpen(false)}
      />
    </div>
  );
}
