import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { toast as systemToast } from '../ui/ToastProvider';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Home, ShoppingBag, Search, ShoppingCart, Heart, User, MessageCircle, Menu, X, Gift, Mail, ArrowRight, ArrowLeft, FileText, BookOpen, LayoutDashboard, Trash2, ArrowUpRight, Banknote, ShieldCheck, Truck, Megaphone, ChevronLeft, ChevronRight, Sun, Moon, Phone } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useWishlistStore } from '../../store/wishlistStore';
import SocialIcon from '../ui/SocialIcon';
import MaintenancePage from '../../pages/storefront/MaintenancePage';
import BookFittingSessionModal from '../storefront/BookFittingSessionModal';
import NotFoundCrossSellSection from '../storefront/NotFoundCrossSellSection';
import { triggerCartAnimation } from '../../utils/cartAnimation';
import useScrollReveal from '../../hooks/useScrollReveal';
import { PaystackLogo, StripeLogo, PayPalLogo, FlutterwaveLogo, VisaLogo, MastercardLogo } from '../storefront/PaymentGatewayLogos';

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

// Helper component for interactive swiping top announcement bar with customizable styling & coupons carousel
function AnimatedAnnouncementBar({ text, settings = {} }) {
  const [copiedCode, setCopiedCode] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fetch active store coupons
  const { data: couponsRes } = useQuery({
    queryKey: ['active-coupons-announcement'],
    queryFn: () => fetch('/api/coupons/active').then(res => res.json()),
  });

  const currencySymbol = typeof window !== 'undefined' ? (localStorage.getItem('dansolam_currency_symbol') || '₦') : '₦';

  // Prepare list of announcement items
  const activeCoupons = couponsRes?.data || [];
  const includeCoupons = settings.announcement_include_coupons === undefined || ['true', '1', true, 1].includes(settings.announcement_include_coupons);

  // Parse announcement items from text (supports '|' delimiter for multiple messages)
  const rawItems = (text || '').split('|').map(t => t.trim()).filter(Boolean);

  // Combine custom text items and active coupons into slides
  const slides = [...rawItems];

  if (includeCoupons && activeCoupons.length > 0) {
    activeCoupons.forEach(coupon => {
      let formattedVal = '';
      if (coupon.type === 'percentage') {
        formattedVal = `${parseFloat(coupon.value)}% OFF`;
      } else if (coupon.type === 'free_delivery') {
        formattedVal = 'Free Delivery';
      } else {
        formattedVal = `${currencySymbol}${parseFloat(coupon.value || 0).toLocaleString()}`;
      }
      const desc = `Special Offer: Get ${formattedVal} on your order! Use code ${coupon.code}`;
      if (!slides.some(s => s.includes(coupon.code))) {
        slides.push(desc);
      }
    });
  }

  const activeSlides = slides.length > 0 ? slides : [text || 'Welcome to Dansolam Beauty Home!'];
  const autoplaySpeed = parseInt(settings.announcement_autoplay_speed !== undefined ? settings.announcement_autoplay_speed : '4500', 10);

  // Auto-swipe timer if there are multiple slides
  useEffect(() => {
    if (activeSlides.length <= 1 || autoplaySpeed <= 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
    }, autoplaySpeed);
    return () => clearInterval(interval);
  }, [activeSlides.length, autoplaySpeed]);

  if (!text && activeSlides.length === 0) return null;

  const currentText = activeSlides[currentIndex] || text || '';

  // Extract coupon code if available
  const codeMatch = currentText.match(/(?:code|coupon)\s+([A-Z0-9]{3,15})/i) || currentText.match(/\b([A-Z0-9]{4,12})\b/);
  const code = codeMatch ? codeMatch[1] : null;

  const handleCopyCode = (couponCode, e) => {
    if (e) e.stopPropagation();
    try {
      navigator.clipboard.writeText(couponCode);
      setCopiedCode(couponCode);
      systemToast.success(`Coupon code "${couponCode}" copied to clipboard! ✨`);
      setTimeout(() => setCopiedCode(null), 3000);
    } catch (err) {
      systemToast.success(`Coupon code: ${couponCode}`);
    }
  };

  const nextSlide = (e) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
  };
  const prevSlide = (e) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);
  };

  const bgColor = settings.announcement_bg_color || '#181120';
  const textColor = settings.announcement_text_color || '#FFFFFF';
  const accentColor = settings.announcement_accent_color || '#EC268F';
  const linkUrl = settings.announcement_link_url;

  return (
    <div
      style={{
        backgroundColor: bgColor,
        color: textColor,
        borderBottomColor: `${accentColor}30`
      }}
      className="group border-b text-[10px] md:text-xs font-bold py-2.5 px-3 md:px-6 text-center tracking-wide relative shrink-0 z-50 shadow-md overflow-hidden flex items-center justify-between min-h-[38px] select-none transition-colors duration-300"
    >
      {/* Background shimmer animation */}
      <div
        style={{
          background: `linear-gradient(to right, transparent, ${accentColor}25, transparent)`
        }}
        className="absolute inset-0 -translate-x-full animate-shimmer pointer-events-none"
      />

      {/* Prev slide button if multiple (only visible on hover) */}
      {activeSlides.length > 1 && (
        <button
          type="button"
          onClick={prevSlide}
          style={{ color: accentColor }}
          className="relative z-20 p-1 hover:bg-white/20 rounded-full transition-all duration-300 cursor-pointer shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100"
          aria-label="Previous Announcement"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}

      {/* Active Announcement Swiper Slide */}
      <div className="flex-1 flex items-center justify-center gap-3 md:gap-4 relative z-10 overflow-hidden px-2">
        <div key={currentIndex} className="inline-flex flex-wrap items-center justify-center gap-2 md:gap-3 animate-fade-in transition-all duration-500">

          {/* Announcement Megaphone Icon & Text */}
          {linkUrl ? (
            <Link
              to={linkUrl}
              style={{ color: textColor }}
              className="inline-flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <Megaphone style={{ color: accentColor }} className="w-4 h-4 shrink-0" />
              <span className="font-bold tracking-wide truncate max-w-[280px] sm:max-w-md md:max-w-xl underline decoration-dotted underline-offset-2">
                {currentText}
              </span>
            </Link>
          ) : (
            <span className="inline-flex items-center gap-2 animate-bulgy-pulse">
              <Megaphone style={{ color: accentColor }} className="w-4 h-4 shrink-0" />
              <span className="font-bold tracking-wide truncate max-w-[280px] sm:max-w-md md:max-w-xl">
                {currentText}
              </span>
            </span>
          )}

          {/* Copyable Coupon Badge */}
          {code && (
            <button
              type="button"
              onClick={(e) => handleCopyCode(code, e)}
              style={{
                backgroundColor: `${textColor}18`,
                borderColor: `${textColor}40`,
                color: textColor
              }}
              className="inline-flex items-center gap-1.5 px-3 py-0.5 ml-2 md:ml-4 rounded-full font-mono font-bold text-[10px] md:text-xs tracking-wider transition-all duration-300 border hover:scale-105 active:scale-95 shadow-xs cursor-pointer group shrink-0"
              title="Click to copy coupon code"
            >
              <span>{code}</span>
              <span
                style={{
                  backgroundColor: accentColor,
                  color: '#FFFFFF'
                }}
                className="text-[9px] px-1.5 py-0.2 rounded font-sans font-black ml-0.5 shadow-2xs"
              >
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
          style={{ color: accentColor }}
          className="relative z-20 p-1 hover:bg-white/20 rounded-full transition-all duration-300 cursor-pointer shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100"
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
  const [userThemePref, setUserThemePref] = useState(() => {
    return localStorage.getItem('dansolam_storefront_theme');
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
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const userDropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    }
    if (showUserDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showUserDropdown]);

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

  // Fetch Settings
  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await fetch('/api/settings');
      return res.json();
    }
  });

  const themeMode = settingsData?.data?.settings?.storefront_theme_mode || 'user_choice';
  const defaultTheme = settingsData?.data?.settings?.storefront_default_theme || 'dark';

  const storefrontDark = useMemo(() => {
    if (themeMode === 'b_night') return true;
    if (themeMode === 'light') return false;
    if (userThemePref === 'dark') return true;
    if (userThemePref === 'light') return false;
    return defaultTheme === 'dark';
  }, [themeMode, defaultTheme, userThemePref]);

  const toggleTheme = () => {
    if (themeMode !== 'user_choice') return;
    const nextTheme = storefrontDark ? 'light' : 'dark';
    setUserThemePref(nextTheme);
    localStorage.setItem('dansolam_storefront_theme', nextTheme);
  };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', storefrontDark);
    document.documentElement.classList.toggle('storefront-dark', storefrontDark);
  }, [storefrontDark]);

  // Section reveal animation, re-scanned on every route change.
  useScrollReveal(location.pathname);

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
      if (s.system_currency_symbol) {
        localStorage.setItem('dansolam_currency_symbol', s.system_currency_symbol);
      }
      if (s.system_currency_code) {
        localStorage.setItem('dansolam_currency_code', s.system_currency_code);
      }
    }
  }, [settingsData, setCurrency]);

  const ecommerce = settingsData?.data?.ecommerce || { name: 'Dansolam Beauty Home' };
  const settings = settingsData?.data?.settings || {
    logo_url: '/images/logo.png',
    theme_primary_color: '#5D3E85',
    tagline: 'Dansolam Beauty Home',
    description: 'Transform your skin with luxury spa routines and premium beauty products at Dansolam Beauty Home.',
    whatsapp_number: '2348000000000',
    instagram_url: 'https://dansolam.com/',
    store_address: 'Plot 1234, SHOP Boulevard',
    opening_hours: 'Monday–Saturday: 9:00 AM - 6:00 PM',
    announcement_show: 'true',
    announcement_text: '✨ Free delivery on orders above ₦100,000! | 🌿 100% Organic Skincare, Whitening Soaps & Discoloration Oils | 🎁 Use coupon code WELCOME10 for 10% OFF your first beauty order',
    promo_popup_show: 'false',
    promo_popup_title: 'Welcome to Dansolam',
    promo_popup_body: 'Save 10% off your first beauty purchase.',
    promo_popup_image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=350',
    promo_popup_delay: '3000'
  };
  const allowOverselling = settings.allow_overselling === 'true' || settings.allow_overselling === true || settings.allow_overselling === '1' || settings.allow_overselling === 1;

  // Maintenance Mode Guard
  const [maintenanceBypassed, setMaintenanceBypassed] = useState(() => {
    return sessionStorage.getItem('dansolam_maintenance_bypass') === 'true';
  });

  const isMaintenanceActive = ['true', '1', true, 1].includes(settings.maintenance_mode_enabled);
  const searchParams = new URLSearchParams(location.search);
  const isUrlBypass = searchParams.get('bypass') === (settings.maintenance_bypass_key || 'admin123') || searchParams.get('preview') === '1';

  if (isMaintenanceActive && !maintenanceBypassed && !isUrlBypass && !localStorage.getItem('dansolam_token')) {
    return <MaintenancePage settings={settings} onBypass={() => setMaintenanceBypassed(true)} />;
  }
  const whatsappNumber = String(settings.whatsapp_number || '').replace(/[^0-9]/g, '');
  const socialLinks = [
    { label: 'Instagram', url: settings.instagram_url, network: 'instagram' },
    { label: 'Facebook', url: settings.facebook_url, network: 'facebook' },
    { label: 'TikTok', url: settings.tiktok_url, network: 'tiktok' },
    { label: 'YouTube', url: settings.youtube_url, network: 'youtube' },
    { label: 'X', url: settings.twitter_url, network: 'x' },
    ...(whatsappNumber ? [{ label: 'WhatsApp', url: `https://wa.me/${whatsappNumber}?text=Hello%20${encodeURIComponent(ecommerce?.name || 'Dansolam')}`, network: 'whatsapp' }] : [])
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

  // 1b. Listen for cart add tracing animations with trailing lines & sparks
  useEffect(() => {
    const handleAnimateToCart = (e) => {
      const { startX, startY, fromElement, imageUrl, type = 'add', count = 1 } = e.detail || {};
      triggerCartAnimation({ startX, startY, fromElement, imageUrl, type, count });
      setAnimateCart(true);
      setTimeout(() => setAnimateCart(false), 700);
    };

    window.addEventListener('animate-to-cart', handleAnimateToCart);
    return () => window.removeEventListener('animate-to-cart', handleAnimateToCart);
  }, []);

  // 2. Trigger promo newsletter popup
  useEffect(() => {
    const showPopup = settings.promo_popup_show === 'true' || settings.promo_popup_show === true;
    if (showPopup) {
      const isDismissed = localStorage.getItem('dansolam_popup_dismissed');
      if (!isDismissed) {
        const delay = parseInt(settings.promo_popup_delay || 3000);
        const timer = setTimeout(() => {
          setShowPopupModal(true);
        }, delay);
        return () => clearTimeout(timer);
      }
    }
  }, [settings.promo_popup_show, settings.promo_popup_delay]);

  // 2b. Need Chat Bubble Interval Pop & Expand Animation
  const [isChatBubblePopped, setIsChatBubblePopped] = useState(false);
  const [chatMessageIndex, setChatMessageIndex] = useState(0);

  const chatMessages = useMemo(() => [
    { title: 'Need Help?', subtitle: 'Chat with Skincare Specialist 💬', badge: 'Online Now' },
    { title: 'Looking for advice?', subtitle: 'Ask about routines & spots ✨', badge: 'Active AGENT' },
    { title: 'Personal Routine', subtitle: 'Tap to get custom formulas 🌿', badge: 'Instant Reply' },
    { title: 'Delivery Questions?', subtitle: 'We ship nationwide & worldwide ✈️', badge: 'Customer Care' },
  ], []);

  useEffect(() => {
    // Initial pop after 3.5 seconds of user browsing
    const initialTimer = setTimeout(() => {
      setIsChatBubblePopped(true);
      const closeTimer = setTimeout(() => setIsChatBubblePopped(false), 4500);
      return () => clearTimeout(closeTimer);
    }, 3500);

    // Recurring pop expanding at intervals (every 11 seconds)
    const intervalTimer = setInterval(() => {
      setChatMessageIndex((prev) => (prev + 1) % chatMessages.length);
      setIsChatBubblePopped(true);
      setTimeout(() => {
        setIsChatBubblePopped(false);
      }, 4500);
    }, 11000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
    };
  }, [chatMessages.length]);

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
    localStorage.setItem('dansolam_popup_dismissed', 'true');
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

  const announcementActive = settings.announcement_show === 'true' || settings.announcement_show === true || settings.announcement_show === '1' || settings.announcement_show === 1 || settings.announcement_show === undefined;

  return (
    <div className="storefront-shell luxury-storefront flex flex-col min-h-[100dvh] relative font-sans text-gray-800 dark:text-[#F3EFF6] bg-[#FBFAF8] dark:bg-[#17101F] transition-colors duration-300">

      {/* 0. Top Bar Announcement */}
      {announcementActive && (
        <AnimatedAnnouncementBar
          text={settings.announcement_text || '✨ Free delivery on orders above ₦100,000! | 🌿 100% Organic Skincare, Whitening Soaps & Discoloration Oils | 🎁 Use coupon code WELCOME10 for 10% OFF your first beauty order'}
          settings={settings}
        />
      )}

      {/* 1. Header Navigation (Floating Transparent Layered Header) */}
      <header className="sticky top-0 z-50 transition-all duration-300 px-6 sm:px-12 h-20 flex items-center justify-between -mb-20 pointer-events-auto bg-transparent border-b border-transparent">

        {/* Mobile Menu Hamburger Trigger */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="lg:hidden p-2 text-gray-800 dark:text-white bg-white/90 dark:bg-white/15 hover:bg-white dark:hover:bg-white/25 rounded-full shadow-sm transition-all cursor-pointer mr-2"
          aria-label="Open Mobile Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand Logo / Sticky Favicon Transition with Solid White Background on Favicon */}
        <Link to="/" className="relative flex items-center shrink-0 group py-1" aria-label={ecommerce.name || "Dansolam"}>
          {/* 1. Full Logo (Shown when at top of page) */}
          <div
            className={`transition-all duration-400 ease-out origin-left flex items-center ${
              scrolled
                ? 'opacity-0 scale-90 -translate-x-3 pointer-events-none absolute'
                : 'opacity-100 scale-100 translate-x-0 relative'
            }`}
          >
            {settings?.logo_url ? (
              <img
                src={settings.logo_url}
                alt={ecommerce.name}
                className="h-10 sm:h-11 md:h-12 w-auto object-contain transition-transform group-hover:scale-105 duration-300"
              />
            ) : (
              <div className="flex flex-col leading-tight">
                <span className="font-sans font-bold text-2xl sm:text-3xl text-[#221B2B] dark:text-[#F3EFF6] tracking-tight group-hover:text-[#5D3E85] dark:group-hover:text-[#EC268F] transition-colors">Dansolam</span>
                <span className="font-sans font-semibold text-[9px] sm:text-[10px] tracking-[0.3em]  text-[#5D3E85] dark:text-[#E5C158]">Beauty Home</span>
              </div>
            )}
          </div>

          {/* 2. Favicon Icon Badge with Solid Opaque White Background (Shown when scrolled) */}
          <div
            className={`transition-all duration-400 ease-out origin-left flex items-center ${
              scrolled
                ? 'opacity-100 scale-100 translate-x-0 relative'
                : 'opacity-0 scale-75 -translate-x-3 pointer-events-none absolute'
            }`}
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white shadow-md border border-gray-200/80 flex items-center justify-center p-2 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300">
              {settings?.favicon_url ? (
                <img
                  src={settings.favicon_url}
                  alt={ecommerce.name}
                  className="w-full h-full object-contain"
                />
              ) : settings?.logo_url ? (
                <img
                  src={settings.logo_url}
                  alt={ecommerce.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-sm font-extrabold text-[#5D3E85]">D</span>
              )}
            </div>
          </div>
        </Link>

        {/* Desktop Centered Pronounced Glassmorphism Pill Navigation with Blurry Motion & High-Legibility Typography */}
        <nav className="hidden lg:flex items-center gap-1.5 p-1.5 rounded-full bg-white/70 dark:bg-[#100A16]/70 backdrop-blur-2xl border border-white/60 dark:border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.12)] text-xs font-bold transition-all">
          <Link
            to="/"
            className={`px-4 py-2 rounded-full transition-all ${isActive('/')
              ? 'bg-[#221B2B] text-white dark:bg-white dark:text-[#17101F] font-extrabold shadow-sm'
              : 'text-[#221B2B] dark:text-[#F3EFF6] hover:text-[#EC268F] dark:hover:text-[#EC268F] hover:bg-black/5 dark:hover:bg-white/10'
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
              className={`px-4 py-2 rounded-full transition-all flex items-center gap-1 ${isActive('/shop')
                ? 'bg-[#221B2B] text-white dark:bg-white dark:text-[#17101F] font-extrabold shadow-sm'
                : 'text-[#221B2B] dark:text-[#F3EFF6] hover:text-[#EC268F] dark:hover:text-[#EC268F] hover:bg-black/5 dark:hover:bg-white/10'
                }`}
            >
              Shop <span className={`text-[9px] opacity-75 transition-transform ${megaMenuOpen ? 'rotate-180' : ''}`}>▼</span>
            </Link>

            {/* Mega Dropdown Panel Portal */}
            {typeof document !== 'undefined' && createPortal(
              <div
                onMouseEnter={openMegaMenu}
                onMouseLeave={scheduleMegaMenuClose}
                style={{ top: `${megaMenuTop}px` }}
                className={`luxury-mega-menu fixed left-1/2 -translate-x-1/2 w-[min(1200px,calc(100vw-2rem))] max-h-[calc(100dvh-8rem)] overflow-y-auto overscroll-contain bg-white/95 dark:bg-[#1E1528]/95 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-3xl shadow-2xl p-8 grid grid-cols-[minmax(0,4fr)_minmax(220px,1fr)] gap-8 z-[100] transition-all ${megaMenuOpen ? 'opacity-100 translate-y-0 visible' : 'opacity-0 -translate-y-2 invisible pointer-events-none'
                  }`}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 items-start min-w-0">
                  {megaMenuCollections.map((col) => (
                    <div key={col.id} className="flex min-w-0 flex-col gap-3">
                      <span className="font-sans font-extrabold text-xs  tracking-wider text-gray-950 dark:text-white border-b border-gray-200 dark:border-white/10 pb-2.5">
                        {col.name}
                      </span>
                      <div className="flex flex-col gap-2.5 text-xs text-gray-600 dark:text-gray-400">
                        {col.categories && col.categories.length > 0 ? (
                          col.categories.map((cat) => (
                            <Link
                              key={cat.id}
                              to={`/shop?category=${cat.slug}`}
                              onClick={closeMegaMenu}
                              className="hover:text-[#5D3E85] dark:hover:text-[#EC268F] hover:bg-gray-100 dark:hover:bg-white/5 px-2 py-1 rounded-lg transition-all block font-bold"
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
                          className="text-[#5D3E85] dark:text-[#EC268F] hover:underline font-bold mt-2 text-[11px] flex items-center gap-0.5 group px-2 py-1 rounded-lg"
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

                <div className="flex min-w-0 flex-col gap-3 border-l border-gray-100 dark:border-white/10 pl-8 h-full justify-between">
                  <span className="font-sans font-extrabold text-xs  tracking-wider text-gray-950 dark:text-white border-b border-gray-200 dark:border-white/10 pb-2.5 flex items-center gap-1.5">
                    ✨ Featured Offers
                  </span>
                  <MegaMenuAdSlideshow ads={settings.mega_menu_ads} />
                </div>
              </div>,
              document.body
            )}
          </div>

          {/* 3. Reviews */}
          <Link
            to="/reviews"
            className={`px-4 py-2 rounded-full transition-all ${isActive('/reviews')
              ? 'bg-[#221B2B] text-white dark:bg-white dark:text-[#17101F] font-extrabold shadow-sm'
              : 'text-[#221B2B] dark:text-[#F3EFF6] hover:text-[#EC268F] dark:hover:text-[#EC268F] hover:bg-black/5 dark:hover:bg-white/10'
              }`}
          >
            Reviews
          </Link>

          {/* 4. About */}
          <Link
            to="/pages/about-us"
            className={`px-4 py-2 rounded-full transition-all ${isActive('/pages/about-us')
              ? 'bg-[#221B2B] text-white dark:bg-white dark:text-[#17101F] font-extrabold shadow-sm'
              : 'text-[#221B2B] dark:text-[#F3EFF6] hover:text-[#EC268F] dark:hover:text-[#EC268F] hover:bg-black/5 dark:hover:bg-white/10'
              }`}
          >
            About
          </Link>

          {/* 5. Tips */}
          <Link
            to="/pages/tips"
            className={`px-4 py-2 rounded-full transition-all ${isActive('/pages/tips')
              ? 'bg-[#221B2B] text-white dark:bg-white dark:text-[#17101F] font-extrabold shadow-sm'
              : 'text-[#221B2B] dark:text-[#F3EFF6] hover:text-[#EC268F] dark:hover:text-[#EC268F] hover:bg-black/5 dark:hover:bg-white/10'
              }`}
          >
            Tips
          </Link>

          {/* 6. Track Order */}
          <Link
            to="/order-tracking"
            className={`px-4 py-2 rounded-full transition-all ${isActive('/order-tracking')
              ? 'bg-[#221B2B] text-white dark:bg-white dark:text-[#17101F] font-extrabold shadow-sm'
              : 'text-[#221B2B] dark:text-[#F3EFF6] hover:text-[#EC268F] dark:hover:text-[#EC268F] hover:bg-black/5 dark:hover:bg-white/10'
              }`}
          >
            Track Order
          </Link>

          {/* 7. Blog */}
          <Link
            to="/blog"
            className={`px-4 py-2 rounded-full transition-all ${isActive('/blog')
              ? 'bg-[#221B2B] text-white dark:bg-white dark:text-[#17101F] font-extrabold shadow-sm'
              : 'text-[#221B2B] dark:text-[#F3EFF6] hover:text-[#EC268F] dark:hover:text-[#EC268F] hover:bg-black/5 dark:hover:bg-white/10'
              }`}
          >
            Blog
          </Link>

          {/* 8. Contact */}
          <Link
            to="/contact"
            className={`px-4 py-2 rounded-full transition-all ${isActive('/contact')
              ? 'bg-[#221B2B] text-white dark:bg-white dark:text-[#17101F] font-extrabold shadow-sm'
              : 'text-[#221B2B] dark:text-[#F3EFF6] hover:text-[#EC268F] dark:hover:text-[#EC268F] hover:bg-black/5 dark:hover:bg-white/10'
              }`}
          >
            Contact
          </Link>
        </nav>

        {/* Right Action Icons & Bag Pill (Borderless with Solid White Backgrounds & Crisp Shadows) */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Theme Toggle (shown when admin mode allows user_choice) */}
          {themeMode === 'user_choice' && (
            <button
              type="button"
              onClick={toggleTheme}
              className="hidden sm:flex w-10 h-10 rounded-full bg-white dark:bg-white/90 shadow-md hover:shadow-lg items-center justify-center text-[#221B2B] hover:text-[#EC268F] hover:scale-105 transition-all cursor-pointer btn-spring"
              title={storefrontDark ? 'Switch to Quiet Editorial Light Mode' : 'Switch to B Night Dark Mode'}
              aria-label="Toggle Light and Dark Theme"
            >
              {storefrontDark ? (
                <Sun className="w-4 h-4 text-[#5D3E85]" />
              ) : (
                <Moon className="w-4 h-4 text-[#5D3E85]" />
              )}
            </button>
          )}

          {/* Search Trigger */}
          <button
            type="button"
            onClick={() => setShowSearchModal(true)}
            className="w-10 h-10 rounded-full bg-white dark:bg-white/90 shadow-md hover:shadow-lg flex items-center justify-center text-[#221B2B] hover:text-[#EC268F] hover:scale-105 transition-all cursor-pointer btn-spring"
            title="Search catalog"
          >
            <Search className="w-4.5 h-4.5" />
          </button>

          {/* User Account Direct Dashboard / Login Dropdown Trigger */}
          <div className="relative hidden sm:block" ref={userDropdownRef}>
            <button
              type="button"
              onClick={() => {
                const adminToken = localStorage.getItem('dansolam_admin_token') || sessionStorage.getItem('dansolam_admin_token');
                const customerToken = localStorage.getItem('dansolam_customer_token') || sessionStorage.getItem('dansolam_customer_token');
                if (adminToken) {
                  navigate('/admin');
                } else if (customerToken) {
                  navigate('/account');
                } else {
                  setShowUserDropdown((prev) => !prev);
                }
              }}
              className={`w-10 h-10 rounded-full bg-white dark:bg-white/90 shadow-md hover:shadow-lg flex items-center justify-center text-[#221B2B] hover:text-[#EC268F] hover:scale-105 transition-all cursor-pointer btn-spring ${showUserDropdown ? 'ring-2 ring-[#5D3E85]' : ''
                }`}
              title="Account / Dashboard"
              aria-label="Account / Dashboard"
              aria-expanded={showUserDropdown}
            >
              <User className="w-4.5 h-4.5" />
            </button>

            {/* Dropdown Menu (Shown only when not logged in to select destination) */}
            {showUserDropdown && (
              <div className="absolute right-0 top-full mt-2.5 w-64 md:w-72 bg-white dark:bg-[#1E1528] rounded-2xl p-2.5 shadow-2xl border border-[#EADBEE] dark:border-white/12 z-50 animate-fade-in text-left">
                <div className="px-3 py-2 border-b border-[#EADBEE]/60 dark:border-white/10 mb-1.5">
                  <span className="text-[10px]  tracking-wider font-extrabold text-[#5D3E85] dark:text-[#EC268F] block">Select Login Portal</span>
                  <span className="text-[11px] text-gray-500 dark:text-[#9B8EA9] leading-tight block mt-0.5">Choose your account destination</span>
                </div>

                <div className="flex flex-col gap-1">
                  {/* Customer Portal */}
                  <Link
                    to="/account"
                    onClick={() => setShowUserDropdown(false)}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#5D3E85]/8 dark:hover:bg-white/5 transition-all group"
                  >
                    <div className="w-9 h-9 rounded-full bg-[#5D3E85]/10 dark:bg-[#EC268F]/20 text-[#5D3E85] dark:text-[#EC268F] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <User className="w-4.5 h-4.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <strong className="block text-xs font-bold text-[#221B2B] dark:text-[#F3EFF6] group-hover:text-[#5D3E85] dark:group-hover:text-[#EC268F] transition-colors">
                        Customer Login
                      </strong>
                      <span className="block text-[10px] text-gray-500 dark:text-[#9B8EA9] truncate">
                        Orders, Profile & Wishlist
                      </span>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#5D3E85] dark:group-hover:text-[#EC268F] transition-colors opacity-60" />
                  </Link>

                  {/* Staff & Admin Portal */}
                  <Link
                    to="/admin/login"
                    onClick={() => setShowUserDropdown(false)}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-amber-500/10 dark:hover:bg-amber-400/10 transition-all group"
                  >
                    <div className="w-9 h-9 rounded-full bg-amber-500/10 dark:bg-amber-400/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <ShieldCheck className="w-4.5 h-4.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <strong className="block text-xs font-bold text-[#221B2B] dark:text-[#F3EFF6] group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        Staff & Admin Login
                      </strong>
                      <span className="block text-[10px] text-gray-500 dark:text-[#9B8EA9] truncate">
                        Store Management & POS
                      </span>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors opacity-60" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Wishlist */}
          <button
            type="button"
            onClick={() => setShowWishlistDrawer(true)}
            className="relative w-10 h-10 rounded-full bg-white dark:bg-white/90 shadow-md hover:shadow-lg flex items-center justify-center text-[#221B2B] hover:text-[#EC268F] hover:scale-105 transition-all cursor-pointer btn-spring"
            title="Saved Wishlist"
          >
            <Heart className="w-4.5 h-4.5" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#EC268F] text-white text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold shadow-xs">
                {wishlistCount}
              </span>
            )}
          </button>

          {/* Bag Pill Button */}
          <Link
            to="/cart"
            id="cart-btn-desktop"
            className="flex items-center gap-2 px-4.5 sm:px-5 py-2.5 rounded-full bg-[#EC268F] hover:bg-[#C9166F] text-white text-xs font-bold shadow-md hover:scale-105 active:scale-95 transition-all btn-spring"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Bag · {cartItemsCount}</span>
          </Link>
        </div>
      </header>

      {/* Slide-out Mobile Navigation Drawer */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-xs z-[60] transition-opacity duration-300 md:hidden ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        onClick={() => setMobileMenuOpen(false)}
      >
        <div
          onClick={e => e.stopPropagation()}
          className={`fixed top-0 bottom-0 left-0 w-80 max-w-[85vw] bg-white dark:bg-[#1E1528] text-[#221B2B] dark:text-[#F3EFF6] z-[60] p-6 flex flex-col gap-6 shadow-2xl transition-transform duration-300 rounded-r-3xl ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-white/10">
            {settings?.logo_url ? (
              <img src={settings.logo_url} alt={ecommerce.name} className="h-9 object-contain" />
            ) : (
              <div className="flex flex-col leading-tight">
                <span className="font-sans font-bold text-lg text-[#221B2B] dark:text-[#F3EFF6]">{ecommerce.name}</span>
                <span className="font-sans font-semibold text-[8px] tracking-[0.25em]  text-[#5D3E85] dark:text-[#E5C158]">Beauty Home</span>
              </div>
            )}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-1.5 hover:bg-gray-50 dark:hover:bg-white/10 rounded-full text-gray-400 dark:text-gray-300 hover:text-gray-950 transition-all cursor-pointer"
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
            <div className="pl-10 pr-4 py-2.5 text-xs rounded-full border border-gray-200 dark:border-white/15 text-gray-400 bg-gray-50 dark:bg-white/5 w-full select-none font-semibold">
              Search catalog...
            </div>
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-4" />
          </div>

          {/* Nav Links */}
          <nav className="flex flex-col gap-3.5 text-sm font-bold text-gray-800 dark:text-[#F3EFF6]">
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#5D3E85] dark:hover:text-[#EC268F] transition-colors py-1 flex items-center justify-between">
              Home <ArrowUpRight className="w-3.5 h-3.5 opacity-40" />
            </Link>
            <Link to="/shop" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#5D3E85] dark:hover:text-[#EC268F] transition-colors py-1 flex items-center justify-between">
              Shop <ArrowUpRight className="w-3.5 h-3.5 opacity-40" />
            </Link>
            <Link to="/reviews" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#5D3E85] dark:hover:text-[#EC268F] transition-colors py-1 flex items-center justify-between">
              Reviews <ArrowUpRight className="w-3.5 h-3.5 opacity-40" />
            </Link>
            <Link to="/pages/about-us" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#5D3E85] dark:hover:text-[#EC268F] transition-colors py-1 flex items-center justify-between">
              About <ArrowUpRight className="w-3.5 h-3.5 opacity-40" />
            </Link>
            <Link to="/pages/tips" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#5D3E85] dark:hover:text-[#EC268F] transition-colors py-1 flex items-center justify-between">
              Tips <ArrowUpRight className="w-3.5 h-3.5 opacity-40" />
            </Link>
            <Link to="/order-tracking" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#5D3E85] dark:hover:text-[#EC268F] transition-colors py-1 flex items-center justify-between">
              Track Order <ArrowUpRight className="w-3.5 h-3.5 opacity-40" />
            </Link>
            {settings?.show_blog_page !== 'false' && (
              <Link to="/blog" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#5D3E85] dark:hover:text-[#EC268F] transition-colors py-1 flex items-center justify-between">
                Blog <ArrowUpRight className="w-3.5 h-3.5 opacity-40" />
              </Link>
            )}
            {settings?.show_gallery_page !== 'false' && (
              <Link to="/gallery" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#5D3E85] dark:hover:text-[#EC268F] transition-colors py-1 flex items-center justify-between">
                Gallery Lookbook <ArrowUpRight className="w-3.5 h-3.5 opacity-40" />
              </Link>
            )}
            <Link to="/contact" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#5D3E85] dark:hover:text-[#EC268F] transition-colors py-1 flex items-center justify-between">
              Contact <ArrowUpRight className="w-3.5 h-3.5 opacity-40" />
            </Link>
            {settings?.enable_fitting_sessions !== 'false' && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setBookFittingModalOpen(true);
                }}
                className="w-full text-left font-bold text-gray-800 dark:text-[#F3EFF6] hover:text-[#5D3E85] dark:hover:text-[#EC268F] transition-colors py-1 flex items-center justify-between cursor-pointer"
              >
                <span className="flex items-center gap-1.5 text-amber-600 dark:text-[#E5C158]">
                  Book VIP Spa Session
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 opacity-40" />
              </button>
            )}
            <div className="pt-2 pb-1 flex flex-col gap-1 border-t border-gray-100 dark:border-white/10">
              <span className="text-[10px]  tracking-wider font-extrabold text-gray-400 dark:text-[#9B8EA9] px-1 block mb-1">Login Portals</span>
              <Link to="/account" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#5D3E85] dark:hover:text-[#EC268F] transition-colors py-1 flex items-center justify-between text-xs font-semibold text-gray-800 dark:text-[#F3EFF6]">
                <span className="flex items-center gap-2"><User className="w-3.5 h-3.5 text-[#5D3E85] dark:text-[#EC268F]" /> Customer Login (Orders & Profile)</span>
                <ArrowUpRight className="w-3.5 h-3.5 opacity-40" />
              </Link>
              <Link to="/admin/login" onClick={() => setMobileMenuOpen(false)} className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors py-1 flex items-center justify-between text-xs font-semibold text-gray-800 dark:text-[#F3EFF6]">
                <span className="flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> Staff & Admin Portal</span>
                <ArrowUpRight className="w-3.5 h-3.5 opacity-40" />
              </Link>
            </div>

            {/* Theme Mode Toggle Button Row (when user_choice is allowed) */}
            {themeMode === 'user_choice' && (
              <div className="pt-3 border-t border-gray-100 dark:border-white/10 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700 dark:text-[#C9BED4] flex items-center gap-2">
                  {storefrontDark ? <Moon className="w-4 h-4 text-purple-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                  Appearance
                </span>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${storefrontDark ? 'bg-amber-400 text-gray-950 hover:bg-amber-300' : 'bg-[#181120] text-white hover:bg-[#281b36]'
                    }`}
                >
                  {storefrontDark ? (
                    <>
                      <Sun className="w-3.5 h-3.5" /> Light Mode
                    </>
                  ) : (
                    <>
                      <Moon className="w-3.5 h-3.5" /> B Night
                    </>
                  )}
                </button>
              </div>
            )}

            {!!window.localStorage.getItem('dansolam_admin_token') && (
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

      {/* Cross-Selling & Not Found CTA Partial (Shown on all pages except Home and Shop) */}
      {location.pathname !== '/' && !location.pathname.startsWith('/shop') && (
        <NotFoundCrossSellSection />
      )}

      {/* 3. Footer (Desktop & Tablet) */}
      <footer className="bg-[#100A16] border-t border-white/5 py-16 px-6 md:px-12 text-sm text-[#C9BED4] hidden md:block">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
          
          {/* Column 1: Brand Logo & Copyright starting from same flush left symmetrical line */}
          <div className="flex flex-col gap-4 items-start text-left">
            {settings?.logo_url ? (
              <img
                src={settings.logo_url}
                alt={ecommerce.name}
                className="h-10 sm:h-11 w-auto object-contain object-left mr-auto brightness-110"
              />
            ) : (
              <div className="flex flex-col leading-none text-left">
                <span className="font-serif italic text-2xl text-[#F3EFF6] font-normal tracking-tight">{ecommerce.name}</span>
                <span className="text-[8px] font-extrabold text-[#EC268F] tracking-[0.22em]  mt-0.5">Luxury Skincare & Spa</span>
              </div>
            )}
            {settings.description && (
              <p className="text-xs leading-relaxed text-[#9B8EA9] text-left">{settings.description}</p>
            )}
            <p className="text-[11px] text-[#6B6274] mt-1 text-left">© {new Date().getFullYear()} {ecommerce.name}. All Rights Reserved.</p>
          </div>

          {/* Column 2: Go To Links displaying all navbar links */}
          <div>
            <h5 className="font-sans font-bold text-[#F3EFF6] mb-4 text-xs tracking-wider uppercase">Go To Links</h5>
            <ul className="flex flex-col gap-2.5 text-xs text-[#C9BED4]">
              <li><Link to="/" className="hover:text-[#EC268F] transition-colors">Home</Link></li>
              <li><Link to="/shop" className="hover:text-[#EC268F] transition-colors">Shop All Products</Link></li>
              <li><Link to="/pages/about-us" className="hover:text-[#EC268F] transition-colors">About Us</Link></li>
              <li><Link to="/pages/tips" className="hover:text-[#EC268F] transition-colors">Beauty & Glow Tips</Link></li>
              {settings?.show_gallery_page !== 'false' && (
                <li><Link to="/gallery" className="hover:text-[#EC268F] transition-colors">Lookbook Gallery</Link></li>
              )}
              {settings?.show_blog_page !== 'false' && (
                <li><Link to="/blog" className="hover:text-[#EC268F] transition-colors">Blog & Articles</Link></li>
              )}
              <li><Link to="/reviews" className="hover:text-[#EC268F] transition-colors">Client Reviews</Link></li>
              <li><Link to="/order-tracking" className="hover:text-[#EC268F] transition-colors">Track Order</Link></li>
              <li><Link to="/contact" className="hover:text-[#EC268F] transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* Column 3: Get In Touch with address, hours & admin managed social media icons */}
          <div>
            <h5 className="font-sans font-bold text-[#F3EFF6] mb-4 text-xs tracking-wider uppercase">Get In Touch</h5>
            <ul className="flex flex-col gap-2.5 text-xs text-[#C9BED4] leading-relaxed">
              <li>📍 {settings.store_address || 'Wuse II, Abuja, Nigeria'}</li>
              <li>🕒 Hours: {settings.opening_hours || 'Mon–Sat: 9am - 7pm'}</li>
              <li>🚚 Rapid Doorstep Dispatch</li>
            </ul>

            {/* Social Media Icons Managed Under Admin Settings */}
            {socialLinks.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-4" aria-label="Social media links">
                {socialLinks.map(({ label, url, network }) => (
                  <a
                    key={label}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    title={label}
                    className="w-8 h-8 rounded-full border border-white/10 bg-white/5 hover:bg-[#EC268F] hover:border-[#EC268F] text-white flex items-center justify-center transition-all hover:-translate-y-0.5"
                  >
                    <SocialIcon network={network} className="w-4 h-4" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Column 4: VIP Beauty AGENT & WhatsApp CTA */}
          <div className="flex flex-col gap-4">
            <h5 className="font-sans font-bold text-[#F3EFF6] text-xs tracking-wider uppercase">VIP Beauty AGENT</h5>
            <p className="text-xs text-[#9B8EA9] leading-relaxed">Need custom routine advice, bulk orders, or rapid dispatch? Chat with our specialist!</p>
            <a
              href={`https://wa.me/${whatsappNumber}?text=Hello%20${encodeURIComponent(ecommerce.name)}%2C%20I'm%20visiting%20your%20online%20store%20and%20need%20assistance.`}
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
        <div className="max-w-7xl mx-auto border-t border-white/10 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#9B8EA9]">
          <div className="flex flex-wrap gap-4 items-center">
            <Link to="/pages/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <span className="opacity-35">|</span>
            <Link to="/pages/terms-conditions" className="hover:text-white transition-colors">Terms of Service</Link>
            <span className="opacity-35">|</span>
            <Link to="/pages/shipping-delivery" className="hover:text-white transition-colors">Shipping & Returns</Link>
          </div>

          {/* Payment Trust Assurances Icons */}
          <div className="flex flex-wrap items-center gap-3 select-none">
            <span className="text-[10px] font-bold text-[#F3EFF6] tracking-wider ">SECURE CARDS & GLOBAL PAYMENTS:</span>

            <div className="flex flex-wrap items-center gap-2">
              {/* VISA Badge */}
              <div className="h-7 px-3 bg-white dark:bg-white/95 rounded-md border border-white/20 flex items-center justify-center shadow-3xs" title="Visa">
                <VisaLogo className="h-3 w-auto" />
              </div>

              {/* MASTERCARD Badge */}
              <div className="h-7 px-3 bg-white dark:bg-white/95 rounded-md border border-white/20 flex items-center justify-center shadow-3xs" title="Mastercard">
                <MastercardLogo className="h-4 w-auto" />
              </div>

              {/* PAYSTACK Badge */}
              <div className="h-7 px-3 bg-white dark:bg-white/95 rounded-md border border-white/20 flex items-center justify-center shadow-3xs" title="Paystack">
                <PaystackLogo className="h-4 w-auto" />
              </div>

              {/* STRIPE Badge */}
              <div className="h-7 px-3 bg-white dark:bg-white/95 rounded-md border border-white/20 flex items-center justify-center shadow-3xs" title="Stripe">
                <StripeLogo className="h-3.5 w-auto" />
              </div>

              {/* PAYPAL Badge */}
              <div className="h-7 px-3 bg-white dark:bg-white/95 rounded-md border border-white/20 flex items-center justify-center shadow-3xs" title="PayPal">
                <PayPalLogo className="h-3.5 w-auto" />
              </div>

              {/* COD Badge */}
              <div className="h-7 px-2.5 bg-white/10 rounded-md border border-white/15 flex items-center justify-center backdrop-blur-xs gap-1" title="Cash on Delivery">
                <Banknote className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[9px] font-bold text-white tracking-wider">COD</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* 4. PWA Bottom Navigation (Mobile Viewports Only) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#FBFAF8]/95 dark:bg-[#150F1D]/95 backdrop-blur-xl border-t border-[#EADBEE] dark:border-white/10 flex items-center justify-around py-2.5 z-40 md:hidden pb-safe">
        <Link to="/" className={`flex flex-col items-center gap-0.5 text-gray-500 dark:text-[#C9BED4] hover:text-[#5D3E85] dark:hover:text-[#EC268F] ${isActive('/') && '!text-[#EC268F] font-bold'}`}>
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-medium">Home</span>
        </Link>
        <Link to="/shop" className={`flex flex-col items-center gap-0.5 text-gray-500 dark:text-[#C9BED4] hover:text-[#5D3E85] dark:hover:text-[#EC268F] ${isActive('/shop') && '!text-[#EC268F] font-bold'}`}>
          <ShoppingBag className="w-5 h-5" />
          <span className="text-[10px] font-medium">Shop</span>
        </Link>
        <button
          type="button"
          onClick={() => setShowSearchModal(true)}
          className="flex flex-col items-center gap-0.5 text-gray-500 dark:text-[#C9BED4] hover:text-[#EC268F] cursor-pointer"
        >
          <Search className="w-5 h-5" />
          <span className="text-[10px] font-medium">Search</span>
        </button>
        <button
          type="button"
          onClick={() => setShowWishlistDrawer(true)}
          className="flex flex-col items-center gap-0.5 text-gray-500 dark:text-[#C9BED4] hover:text-[#EC268F] relative cursor-pointer"
        >
          <Heart className="w-5 h-5" />
          <span className="text-[10px] font-medium">Saved</span>
          {wishlistCount > 0 && (
            <span className="absolute -top-1 right-2 bg-[#EC268F] text-white text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold">
              {wishlistCount}
            </span>
          )}
        </button>
        <Link to="/account" className={`flex flex-col items-center gap-0.5 text-gray-500 dark:text-[#C9BED4] hover:text-[#EC268F] ${isActive('/account') && '!text-[#EC268F] font-bold'}`}>
          <User className="w-5 h-5" />
          <span className="text-[10px] font-medium">Account</span>
        </Link>
      </nav>

      {/* 5. Floating WhatsApp Click-to-CHAT US with Interval Pop Animation */}
      <div className="fixed right-4 sm:right-6 bottom-20 md:bottom-8 z-40 flex flex-col items-end pointer-events-none select-none">
        {/* Animated Pop Speech Bubble */}
        {isChatBubblePopped && (
          <div className="animate-bubble-pop mb-2.5 max-w-[240px] sm:max-w-[280px] bg-white dark:bg-[#1E1528] rounded-2xl p-3 shadow-2xl border border-[#EADBEE] dark:border-white/15 pointer-events-auto relative text-left">
            {/* Small speech arrow pointing down */}
            <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-white dark:bg-[#1E1528] border-r border-b border-[#EADBEE] dark:border-white/15 rotate-45" />

            <div className="flex items-start gap-2.5 relative z-10">
              {/* Agent Avatar / Glow */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#5D3E85] to-[#EC268F] flex items-center justify-center text-white shrink-0 shadow-sm relative">
                <MessageCircle className="w-4 h-4" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-[#1E1528]" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[9px] font-extrabold  tracking-wider text-[#EC268F] bg-[#EC268F]/10 px-1.5 py-0.5 rounded-md">
                    {chatMessages[chatMessageIndex].badge}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsChatBubblePopped(false);
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-0.5 cursor-pointer"
                    aria-label="Dismiss chat tip"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <p className="font-extrabold text-[11px] text-[#221B2B] dark:text-[#F3EFF6] mt-1 leading-snug">
                  {chatMessages[chatMessageIndex].title}
                </p>
                <p className="text-[10px] text-gray-500 dark:text-[#C9BED4] leading-tight mt-0.5 font-medium">
                  {chatMessages[chatMessageIndex].subtitle}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Floating WhatsApp Action Button */}
        <a
          href={`https://wa.me/${whatsappNumber}?text=Hello%20${encodeURIComponent(ecommerce.name)}%2C%20I'm%20browsing%20your%20store%20and%20would%20love%20to%20make%20an%20inquiry.`}
          target="_blank"
          rel="noopener noreferrer"
          className={`pointer-events-auto text-white p-3 md:p-3.5 rounded-full shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-105 active:scale-95 flex items-center gap-2.5 overflow-hidden group border-2 border-white/30 backdrop-blur-xs cursor-pointer select-none bg-[#EC268F] hover:bg-[#5D3E85] ${isChatBubblePopped
            ? 'max-w-[280px] ring-4 ring-[#EC268F]/30 shadow-[#EC268F]/40 scale-105'
            : 'max-w-[52px] hover:max-w-[260px]'
            }`}
          aria-label="WhatsApp Chat Support"
        >
          {/* Pulsing Radar Ring */}
          <span className="absolute inset-0 rounded-full animate-ping opacity-35 pointer-events-none bg-[#EC268F]" />

          {/* WhatsApp Icon */}
          <div className="relative shrink-0 flex items-center justify-center">
            <MessageCircle className="w-6 h-6 fill-white text-white transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-300 rounded-full border border-white animate-pulse" />
          </div>

          {/* Stretcher Expanded Text Bubble */}
          <div
            className={`whitespace-nowrap transition-all duration-300 font-sans font-bold text-xs pr-2 flex flex-col justify-center leading-tight ${isChatBubblePopped
              ? 'opacity-100 transform translate-x-0'
              : 'opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0'
              }`}
          >
            <span>Need Help?</span>
            <span className="text-[10px] font-normal opacity-90">Chat on WhatsApp 💬</span>
          </div>
        </a>
      </div>

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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-start justify-center pt-[10vh] p-4 animate-fade-in">
          <div className="fixed inset-0" onClick={() => setShowSearchModal(false)} />

          <div className="bg-white dark:bg-[#1E1528] text-gray-900 dark:text-[#F3EFF6] rounded-3xl w-full max-w-2xl shadow-2xl border border-gray-200 dark:border-white/10 relative z-10 flex flex-col max-h-[75vh] overflow-hidden animate-scale-up">
            {/* Search Input Header */}
            <div className="p-4 border-b border-gray-100 dark:border-white/10 flex items-center gap-3">
              <Search className="w-5 h-5 text-gray-400 dark:text-[#9B8EA9] shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="Search products, treatments, routines, articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-2 text-sm text-gray-800 dark:text-[#F3EFF6] focus:outline-none placeholder-gray-400 dark:placeholder-[#9B8EA9] bg-transparent font-medium"
              />
              {searchLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#5D3E85] dark:border-[#EC268F] shrink-0" />
              )}
              <button
                onClick={() => {
                  setSearchQuery('');
                  setShowSearchModal(false);
                }}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-white transition-all shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Results Area */}
            <div className="flex-1 overflow-y-auto p-5">
              {!searchQuery.trim() || searchQuery.trim().length < 2 ? (
                <div className="flex flex-col gap-6">
                  <div>
                    <span className="text-[10px] text-gray-400 dark:text-[#9B8EA9] font-bold  tracking-wider block mb-2.5">Quick Links</span>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        to="/shop"
                        onClick={() => setShowSearchModal(false)}
                        className="px-4 py-2 bg-gray-50 dark:bg-white/5 hover:bg-[#5D3E85]/10 dark:hover:bg-[#EC268F]/10 hover:text-[#5D3E85] dark:hover:text-[#EC268F] border border-gray-100 dark:border-white/10 rounded-full text-xs text-gray-600 dark:text-[#C9BED4] transition-all font-semibold"
                      >
                        🛍️ Shop Catalogue
                      </Link>
                      <Link
                        to="/pages/about-us"
                        onClick={() => setShowSearchModal(false)}
                        className="px-4 py-2 bg-gray-50 dark:bg-white/5 hover:bg-[#5D3E85]/10 dark:hover:bg-[#EC268F]/10 hover:text-[#5D3E85] dark:hover:text-[#EC268F] border border-gray-100 dark:border-white/10 rounded-full text-xs text-gray-600 dark:text-[#C9BED4] transition-all font-semibold"
                      >
                        ✨ About Dansolam
                      </Link>
                      <Link
                        to="/pages/tips"
                        onClick={() => setShowSearchModal(false)}
                        className="px-4 py-2 bg-gray-50 dark:bg-white/5 hover:bg-[#5D3E85]/10 dark:hover:bg-[#EC268F]/10 hover:text-[#5D3E85] dark:hover:text-[#EC268F] border border-gray-100 dark:border-white/10 rounded-full text-xs text-gray-600 dark:text-[#C9BED4] transition-all font-semibold"
                      >
                        🌿 Beauty Tips
                      </Link>
                      <Link
                        to="/pages/faq"
                        onClick={() => setShowSearchModal(false)}
                        className="px-4 py-2 bg-gray-50 dark:bg-white/5 hover:bg-[#5D3E85]/10 dark:hover:bg-[#EC268F]/10 hover:text-[#5D3E85] dark:hover:text-[#EC268F] border border-gray-100 dark:border-white/10 rounded-full text-xs text-gray-600 dark:text-[#C9BED4] transition-all font-semibold"
                      >
                        💡 FAQ & Shipping
                      </Link>
                      <Link
                        to="/reviews"
                        onClick={() => setShowSearchModal(false)}
                        className="px-4 py-2 bg-gray-50 dark:bg-white/5 hover:bg-[#5D3E85]/10 dark:hover:bg-[#EC268F]/10 hover:text-[#5D3E85] dark:hover:text-[#EC268F] border border-gray-100 dark:border-white/10 rounded-full text-xs text-gray-600 dark:text-[#C9BED4] transition-all font-semibold"
                      >
                        ⭐ Customer Reviews
                      </Link>
                      <Link
                        to="/contact"
                        onClick={() => setShowSearchModal(false)}
                        className="px-4 py-2 bg-gray-50 dark:bg-white/5 hover:bg-[#5D3E85]/10 dark:hover:bg-[#EC268F]/10 hover:text-[#5D3E85] dark:hover:text-[#EC268F] border border-gray-100 dark:border-white/10 rounded-full text-xs text-gray-600 dark:text-[#C9BED4] transition-all font-semibold"
                      >
                        📞 Contact Us
                      </Link>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 dark:text-[#9B8EA9] font-bold  tracking-wider block mb-1">Instant discovery</span>
                    <p className="text-xs text-gray-500 dark:text-[#9B8EA9] leading-relaxed">Search organic formulas, nourishing creams, body polishes, treatments, and skincare articles.</p>
                  </div>
                </div>
              ) : (searchResults.products.length === 0 && searchResults.pages.length === 0 && searchResults.articles.length === 0) ? (
                <div className="text-center py-10">
                  <span className="text-3xl">🔍</span>
                  <p className="text-xs font-semibold text-gray-700 dark:text-[#F3EFF6] mt-2">No matching results found</p>
                  <p className="text-[11px] text-gray-400 dark:text-[#9B8EA9] mt-0.5">Check spelling or try a different keyword.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {/* Products */}
                  {searchResults.products.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] text-gray-400 dark:text-[#9B8EA9] font-bold  tracking-wider block border-b border-gray-100 dark:border-white/10 pb-2">Products</span>
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
                              className="flex items-center gap-4 p-2 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all group"
                            >
                              <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-white/5 overflow-hidden shrink-0 border border-gray-100 dark:border-white/10">
                                <img loading="lazy" decoding="async"
                                  src={prod.images?.[0]?.image_url || '/images/products/placeholder.jpg'}
                                  alt={prod.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className="text-xs font-bold text-gray-800 dark:text-[#F3EFF6] truncate group-hover:text-[#5D3E85] dark:group-hover:text-[#EC268F] transition-colors">{prod.name}</h5>
                                <span className="text-[10px] text-gray-400 dark:text-[#9B8EA9] block truncate">{prod.short_description || 'View product details'}</span>
                              </div>
                              <span className="text-xs font-bold text-gray-900 dark:text-[#F3EFF6] shrink-0">
                                {window.localStorage.getItem('dansolam_currency_symbol') || '₦'}{parseFloat(price).toLocaleString()}
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
                      <span className="text-[10px] text-gray-400 font-bold  tracking-wider block border-b border-gray-50 pb-2">Pages</span>
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
                      <span className="text-[10px] text-gray-400 font-bold  tracking-wider block border-b border-gray-50 pb-2">Blog Articles</span>
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
                        <h4 onClick={() => { setShowWishlistDrawer(false); navigate(`/product/${prod.slug}`); }} className="font-bold text-xs md:text-sm text-gray-800 leading-snug hover:text-[#5D3E85] transition-colors truncate cursor-pointer">
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
                            <span className="text-[9px] font-bold text-red-500  tracking-wider">Out of Stock</span>
                          ) : (
                            <button
                              onClick={(e) => {
                                if (e.currentTarget) {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  window.dispatchEvent(new CustomEvent('animate-to-cart', {
                                    detail: {
                                      startX: rect.left + rect.width / 2,
                                      startY: rect.top + rect.height / 2,
                                      imageUrl: prod.images?.[0]?.image_url || prod.image_url,
                                      type: 'add',
                                      count: 1
                                    }
                                  }));
                                }
                                useCartStore.getState().addItem(prod, prod.variants?.[0] || null, 1, allowOverselling);
                                useWishlistStore.getState().removeItem(prod.id);
                                systemToast.success(`${prod.name} added to cart!`);
                              }}
                              className="px-3 py-1.5 bg-[#5D3E85] hover:bg-[#EC268F] text-white text-[10px] font-bold rounded-full uppercase tracking-wider shadow-sm transition-all cursor-pointer"
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
                  className="px-5 py-2.5 bg-[#5D3E85] hover:bg-[#EC268F] text-white text-xs font-extrabold rounded-full mt-2 shadow-sm cursor-pointer"
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
              className="w-full py-3 bg-[#5D3E85] hover:bg-[#EC268F] text-white text-xs font-extrabold uppercase tracking-wider rounded-xl shadow-md shadow-[#5D3E85]/20 hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer group hover:scale-[1.01] active:scale-[0.99]"
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
