import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight, Star, Heart, ShoppingBag, ChevronLeft, ChevronRight, Check, Eye, Play, Sparkles, ArrowUpRight, ShieldCheck, Truck, Clock, X, Search, User, Menu, SlidersHorizontal
} from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useWishlistStore } from '../../store/wishlistStore';
import { getCurrencySymbol } from '../../utils/currency';
import SEO from '../../components/seo/SEO';

export function ProductCard({ product }) {
  const currencySymbol = getCurrencySymbol();
  const addItemToCart = useCartStore(state => state.addItem);
  const toggleWishlist = useWishlistStore(state => state.toggleItem);
  const wishlistItems = useWishlistStore(state => state.items);

  const rawPrice = product?.sale_price || product?.price || 0;
  const numPrice = typeof rawPrice === 'number' ? rawPrice : parseFloat(rawPrice);
  const image = product?.images?.[0]?.image_url || product?.image_url || product?.image || 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=600';
  const isWishlisted = wishlistItems.some(item => item.id === product?.id);

  return (
    <div className="bg-white rounded-[28px] p-4 border border-gray-100 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50 mb-4">
        <Link to={`/product/${product?.slug || product?.id}`}>
          <img
            src={image}
            alt={product?.name || 'Product'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </Link>
        <button
          type="button"
          onClick={() => toggleWishlist(product)}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-gray-700 hover:bg-white hover:text-red-500 transition-colors shadow-sm cursor-pointer"
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
        </button>
      </div>

      <div className="space-y-2">
        <Link to={`/product/${product?.slug || product?.id}`} className="block">
          <h4 className="text-xs font-extrabold text-[#1A1817] uppercase tracking-wider truncate group-hover:text-[#B86B53] transition-colors">
            {product?.name || 'Beauty Product'}
          </h4>
        </Link>
        <div className="flex items-center justify-between">
          <span className="text-sm font-extrabold text-[#1A1817]">
            {currencySymbol}{numPrice.toFixed(2)}
          </span>
          <button
            type="button"
            onClick={() => addItemToCart({ id: product?.id || 'prod-1', name: product?.name || 'Beauty Product', price: numPrice, image_url: image, quantity: 1 })}
            className="w-8 h-8 rounded-full bg-[#1A1817] text-white flex items-center justify-center hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const currencySymbol = getCurrencySymbol();
  const navigate = useNavigate();
  const addItemToCart = useCartStore(state => state.addItem);
  const toggleWishlist = useWishlistStore(state => state.toggleItem);
  const wishlistItems = useWishlistStore(state => state.items);
  const cartItemsCount = useCartStore(state => state.items.reduce((sum, item) => sum + item.quantity, 0));

  // Modals & Interactive States
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showNavDrawer, setShowNavDrawer] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuickProduct, setSelectedQuickProduct] = useState(null);

  // Active Hero Tag Filter
  const [heroTag, setHeroTag] = useState('Skin Care');

  // Hero Carousel Slide Index (1 to 4)
  const [currentSlideIndex, setCurrentSlideIndex] = useState(1);

  // Dynamic slides for the hero bottom-right carousel
  const heroSlides = [
    {
      id: 1,
      card1: {
        title: 'Facial Care',
        desc: 'Discover Your Radiant Beauty at Our Premier Beauty Center',
        image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=400',
        link: '/shop?category=facials'
      },
      card2: {
        title: 'Hand Cream',
        desc: 'Organic botanicals for silky smooth hands and skin restoration',
        image: 'https://images.unsplash.com/photo-1608248597263-00079e96047a?q=80&w=400',
        link: '/shop?category=hand-cream'
      }
    },
    {
      id: 2,
      card1: {
        title: 'Glow Serum',
        desc: 'Exfoliating AHA & BHA complex for youthful brightness',
        image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=400',
        link: '/shop?category=serums'
      },
      card2: {
        title: 'Eye Concentrate',
        desc: 'Peptide complex reducing under-eye puffiness and lines',
        image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=400',
        link: '/shop?category=eye-care'
      }
    },
    {
      id: 3,
      card1: {
        title: 'Clay Face Mask',
        desc: 'Deep pore purifying volcanic clay for clear skin barrier',
        image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=400',
        link: '/shop?category=masks'
      },
      card2: {
        title: 'Rose Mist',
        desc: 'Hydrating Damask rose spray for instant refreshing dewiness',
        image: 'https://images.unsplash.com/photo-1567928254714-a99f70d5a41c?q=80&w=400',
        link: '/shop?category=mists'
      }
    },
    {
      id: 4,
      card1: {
        title: 'Royal Pedicure',
        desc: 'Nourishing foot spa massage and gel restorative lacquer',
        image: 'https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?q=80&w=400',
        link: '/shop?category=pedicure'
      },
      card2: {
        title: 'Spa Manicure',
        desc: 'Luxury cuticle therapy and cuticle glow oil application',
        image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=400',
        link: '/shop?category=manicure'
      }
    }
  ];

  const activeSlideData = heroSlides[currentSlideIndex - 1];

  // Interactive Services Accordion state
  const [activeService, setActiveService] = useState('Facials');
  const servicesList = [
    {
      id: 'Facials',
      title: 'Facials & Skin Cleanse',
      desc: 'Deep cleansing and hydration for glowing, healthy skin.',
      image: 'https://images.unsplash.com/photo-1512290900673-700259b85c13?q=80&w=800',
      badge: 'Most Popular'
    },
    {
      id: 'Pedicure',
      title: 'Luxury Pedicure',
      desc: 'Relaxing foot treatments and nail restoration.',
      image: 'https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?q=80&w=800',
      badge: 'Wellness'
    },
    {
      id: 'Face Cleanse',
      title: 'Organic Face Cleanse',
      desc: 'Natural exfoliating botanicals to clear impurities.',
      image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=800',
      badge: 'Botanical'
    },
    {
      id: 'Manicure',
      title: 'Royal Manicure',
      desc: 'Premium hand massage and long-lasting gel polish.',
      image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=800',
      badge: 'Nail Spa'
    }
  ];

  // Interactive Product Launch Category Filter
  const [launchCategory, setLaunchCategory] = useState('Serums');
  const launchProducts = [
    {
      id: 'launch-1',
      name: 'PRISM AHA + BHA Exfoliating Glow Serum',
      category: 'Serums',
      price: 56.00,
      image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=800',
      modelsImage: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=800',
      desc: 'A gentle exfoliating serum formulated with natural fruit acids to restore skin clarity.'
    },
    {
      id: 'launch-2',
      name: 'Hydra-Firm Bio Collagen Face Mask',
      category: 'Masks',
      price: 48.00,
      image: 'https://images.unsplash.com/photo-1567928254714-a99f70d5a41c?q=80&w=800',
      modelsImage: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?q=80&w=800',
      desc: 'Intense moisture mask infused with hyaluronic acid for instant elasticity.'
    },
    {
      id: 'launch-3',
      name: 'Gentle Botanical Cleansing Oil',
      category: 'Cleaners',
      price: 42.00,
      image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=800',
      modelsImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800',
      desc: 'Nourishing oil cleanser that dissolves makeup while hydrating your skin barrier.'
    },
    {
      id: 'launch-4',
      name: 'Peptide Eye Renewal Concentrate',
      category: 'Eye Cream',
      price: 64.00,
      image: 'https://images.unsplash.com/photo-1608248597263-00079e96047a?q=80&w=800',
      modelsImage: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=800',
      desc: 'Targeted eye cream designed to reduce fine lines and under-eye puffiness.'
    }
  ];

  const currentLaunchItem = launchProducts.find(p => p.category === launchCategory) || launchProducts[0];

  // Fetch Dynamic Products from Backend
  const { data: productsRes } = useQuery({
    queryKey: ['products-beauty-home'],
    queryFn: () => fetch('/api/products?limit=8').then(res => res.json())
  });

  // Fetch Settings (used for logo, etc.)
  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: () => fetch('/api/settings').then(res => res.json())
  });
  const settings = settingsData?.data?.settings || {};

  const apiProducts = productsRes?.data?.data || [];
  
  // Default Beauty Products Fallback if API returns empty
  const defaultCatalogue = [
    {
      id: 'cat-1',
      name: 'LUMINOUS SERUM',
      price: '45.00',
      image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=600',
      slug: 'luminous-serum'
    },
    {
      id: 'cat-2',
      name: 'BODY CREAM',
      price: '38.00',
      image: 'https://images.unsplash.com/photo-1608248597263-00079e96047a?q=80&w=600',
      slug: 'body-cream'
    },
    {
      id: 'cat-3',
      name: 'SUNSCREEN SPF 50',
      price: '32.00',
      image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=600',
      slug: 'sunscreen-spf-50'
    },
    {
      id: 'cat-4',
      name: 'ROSE HYDRATION MIST',
      price: '28.00',
      image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=600',
      slug: 'rose-hydration-mist'
    }
  ];

  const catalogueList = apiProducts.length > 0 ? apiProducts : defaultCatalogue;

  // Testimonials Carousel State
  const testimonials = [
    {
      id: 1,
      name: 'Mia R.',
      handle: '@mia.r_beauty',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150',
      text: 'Perfect service, the result was lightweight and comfortable to wear! My skin feels completely revived.'
    },
    {
      id: 2,
      name: 'Elena K.',
      handle: '@elena_glow',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=150',
      text: 'Perfect skincare, high quality skin products! The consultation changed my daily routine completely.'
    },
    {
      id: 3,
      name: 'Sophia L.',
      handle: '@sophia_wellness',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?q=80&w=150',
      text: 'Perfect floating atmosphere and expert care. The glow serum was worth every penny.'
    }
  ];

  const [reviewIndex, setReviewIndex] = useState(0);

  const handleNextReview = () => {
    setReviewIndex((prev) => (prev + 1) % testimonials.length);
  };

  const handlePrevReview = () => {
    setReviewIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const isWishlisted = (id) => wishlistItems.some(item => item.id === id);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearchModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F4] text-[#1A1817] font-sans antialiased selection:bg-[#B86B53] selection:text-white">
      <SEO
        title="Dansolam | Luxury Skincare & Beauty Sanctuary"
        description="Transform your look with expert skincare routines, facial treatments, and organic beauty products at Dansolam."
      />

      {/* SECTION 1: HERO CONTAINER - ELEGANT HEIGHT FULL-BLEED */}
      <section className="relative w-full max-w-none pt-0 pb-8 bg-[#AA8374] rounded-b-[40px] md:rounded-b-[52px] shadow-2xl text-white overflow-hidden">
        
        {/* Background Model Image Layer */}
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1400"
            alt="Dansolam Beauty Model"
            className="w-full h-full object-cover object-center scale-105 opacity-95"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#AA8374]/85 via-[#AA8374]/30 to-[#AA8374]/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#AA8374] via-transparent to-transparent" />
        </div>

        {/* INNER CONTAINER FOR WRAPPED CONTENT */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 md:px-12 pt-6 pb-8 sm:pb-10 flex flex-col justify-between min-h-[580px] sm:min-h-[630px] lg:min-h-[680px]">
          
          {/* TOP EMBEDDED NAV BAR (100% Functional) */}
          <header className="relative z-20 flex items-center justify-between gap-4 w-full">
            
            {/* Left Pill Container with Logo, Hamburger & Links */}
            <div className="flex items-center gap-1 sm:gap-1.5 bg-white/10 backdrop-blur-md p-1.5 rounded-full border border-white/20 shadow-md max-w-full overflow-x-auto scrollbar-none">
              
              {/* Brand Logo at far left before Home */}
              <Link to="/" className="px-3.5 py-1.5 text-sm font-extrabold tracking-tight text-white font-sans shrink-0 flex items-center gap-1 hover:opacity-90 transition-opacity">
                {settings?.logo_url ? (
                  <img src={settings.logo_url} alt="Logo" className="h-6 object-contain" />
                ) : (
                  <span>Beauty<span className="italic font-light opacity-90">Center</span></span>
                )}
              </Link>

              <button
                type="button"
                onClick={() => setShowNavDrawer(true)}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/20 text-white flex items-center justify-center border border-white/20 hover:bg-white/30 transition-all cursor-pointer shrink-0"
                aria-label="Open Drawer Navigation"
              >
                <div className="flex flex-col gap-1 items-center justify-center">
                  <div className="w-3.5 h-[2px] bg-white rounded-full" />
                  <div className="w-3.5 h-[2px] bg-white rounded-full" />
                </div>
              </button>

              <Link
                to="/"
                className="px-3.5 py-1.5 text-xs font-semibold rounded-full bg-white text-black shadow-sm transition-all shrink-0"
              >
                Home
              </Link>

              <button
                type="button"
                onClick={() => setShowCategoryModal(true)}
                className="px-3.5 py-1.5 text-xs font-medium rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm transition-all cursor-pointer shrink-0 flex items-center gap-1"
              >
                Category <span className="text-[9px] opacity-70">▼</span>
              </button>

              <Link
                to="/shop"
                className="px-3.5 py-1.5 text-xs font-medium rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm transition-all shrink-0"
              >
                Shop
              </Link>

              <Link
                to="/pages/about-us"
                className="px-3.5 py-1.5 text-xs font-medium rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm transition-all shrink-0"
              >
                About us
              </Link>

              <Link
                to="/gallery"
                className="px-3.5 py-1.5 text-xs font-medium rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm transition-all shrink-0 hidden md:inline-block"
              >
                Gallery
              </Link>

              <Link
                to="/blog"
                className="px-3.5 py-1.5 text-xs font-medium rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm transition-all shrink-0 hidden md:inline-block"
              >
                Blog
              </Link>

              <Link
                to="/reviews"
                className="px-3.5 py-1.5 text-xs font-medium rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm transition-all shrink-0 hidden lg:inline-block"
              >
                Reviews
              </Link>

              <Link
                to="/order-tracking"
                className="px-3.5 py-1.5 text-xs font-medium rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm transition-all shrink-0 hidden xl:inline-block"
              >
                Track Order
              </Link>

              <Link
                to="/contact"
                className="px-3.5 py-1.5 text-xs font-medium rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm transition-all shrink-0 hidden xl:inline-block"
              >
                Contact
              </Link>
            </div>

            {/* Right Circular Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowSearchModal(true)}
                className="w-9 h-9 rounded-full bg-white/20 border border-white/30 text-white flex items-center justify-center hover:bg-white/30 transition-all backdrop-blur-md cursor-pointer shadow-sm"
                title="Search Storefront"
              >
                <Search className="w-4 h-4" />
              </button>
              <Link
                to="/cart"
                className="w-9 h-9 rounded-full bg-white/20 border border-white/30 text-white flex items-center justify-center hover:bg-white/30 transition-all backdrop-blur-md relative shadow-sm"
                title="Shopping Bag"
              >
                <ShoppingBag className="w-4 h-4" />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-white text-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-extrabold shadow-sm">
                    {cartItemsCount}
                  </span>
                )}
              </Link>
              <Link
                to="/account"
                className="w-9 h-9 rounded-full bg-white/20 border border-white/30 text-white flex items-center justify-center hover:bg-white/30 transition-all backdrop-blur-md shadow-sm"
                title="User Account"
              >
                <User className="w-4 h-4" />
              </Link>
            </div>
          </header>

          {/* MAIN HERO CONTENT ROW */}
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pt-6 pb-2">
            
            {/* Left Headline & Subtitle */}
            <div className="lg:col-span-8 space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-[1.12] tracking-tight">
                Transform Your Look <span className="font-normal text-white/90">with</span><br />
                Expert Services at <span className="font-extrabold text-white">Our Luxury</span><br />
                <span className="font-extrabold text-white">Beauty Center</span>
              </h1>
              <p className="text-xs text-white/80 font-light max-w-sm leading-relaxed">
                Revitalize Your Skin and Spirit at Our Beauty Center, Step into a World of Beauty and Wellness, Unlock Your Inner Glow at Our Beauty Center
              </p>
            </div>

            {/* Top Right Video Play Trigger */}
            <div className="lg:col-span-4 flex lg:justify-end">
              <div
                onClick={() => setShowVideoModal(true)}
                className="flex items-center gap-3 group cursor-pointer bg-white/10 backdrop-blur-md p-1.5 pr-3.5 rounded-full border border-white/20 shadow-lg hover:bg-white/20 transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-white/20 border border-white/40 backdrop-blur-md flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                  <Play className="w-3.5 h-3.5 fill-white text-white translate-x-0.5" />
                </div>
                <div className="text-left leading-tight">
                  <span className="text-[10px] font-medium text-white/90 block">Gallery</span>
                  <span className="text-[10px] font-medium text-white/90 block">View</span>
                </div>
              </div>
            </div>

          </div>

          {/* HERO BOTTOM ROW: Tag Pills (Left) & Cards Carousel with Progress Slider (Right) */}
          <div className="relative z-10 pt-4 flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6">
            
            {/* Bottom Left Tag Pills Grid */}
            <div className="space-y-2 max-w-md">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setHeroTag('Skin Care');
                    navigate('/shop?category=skin-care');
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium backdrop-blur-md border transition-all cursor-pointer flex items-center gap-1.5 ${
                    heroTag === 'Skin Care' ? 'bg-white text-black border-white' : 'bg-white/20 text-white border-white/30 hover:bg-white/30'
                  }`}
                >
                  <span>🌸</span> Skin Care
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHeroTag('Facial');
                    navigate('/shop?category=facials');
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium backdrop-blur-md border transition-all cursor-pointer flex items-center gap-1.5 ${
                    heroTag === 'Facial' ? 'bg-white text-black border-white' : 'bg-white/20 text-white border-white/30 hover:bg-white/30'
                  }`}
                >
                  <span>🌸</span> Facial
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setHeroTag('Face Cleaner');
                    navigate('/shop?category=cleaners');
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium backdrop-blur-md border transition-all cursor-pointer flex items-center gap-1.5 ${
                    heroTag === 'Face Cleaner' ? 'bg-white text-black border-white' : 'bg-white/20 text-white border-white/30 hover:bg-white/30'
                  }`}
                >
                  <span>🌸</span> Face Cleaner
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHeroTag('Manicure');
                    navigate('/shop?category=manicure');
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium backdrop-blur-md border transition-all cursor-pointer flex items-center gap-1.5 ${
                    heroTag === 'Manicure' ? 'bg-white text-black border-white' : 'bg-white/20 text-white border-white/30 hover:bg-white/30'
                  }`}
                >
                  <span>🌸</span> Manicure
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHeroTag('Pedicure');
                    navigate('/shop?category=pedicure');
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium backdrop-blur-md border transition-all cursor-pointer flex items-center gap-1.5 ${
                    heroTag === 'Pedicure' ? 'bg-white text-black border-white' : 'bg-white/20 text-white border-white/30 hover:bg-white/30'
                  }`}
                >
                  <span>🌸</span> Pedicure
                </button>
              </div>
            </div>

            {/* Bottom Right Floating Cards & Progress Control Slider */}
            <div className="space-y-3 max-w-2xl w-full">
              
              {/* Cards Rail */}
              <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
                
                {/* Card 1 Image Thumbnail */}
                <Link
                  to={activeSlideData.card1.link}
                  className="relative w-28 h-32 rounded-2xl overflow-hidden shrink-0 shadow-xl border border-white/30 group cursor-pointer block"
                >
                  <img src={activeSlideData.card1.image} alt={activeSlideData.card1.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white/30 backdrop-blur-md border border-white/40 flex items-center justify-center text-white text-[9px] group-hover:bg-white group-hover:text-black transition-colors">
                    ↗
                  </div>
                </Link>

                {/* Card 1 Glass Info Card */}
                <Link
                  to={activeSlideData.card1.link}
                  className="bg-white/20 backdrop-blur-xl border border-white/30 p-3.5 rounded-2xl text-white w-44 shrink-0 shadow-xl flex flex-col justify-between h-32 relative cursor-pointer hover:bg-white/30 transition-all group"
                >
                  <div className="flex justify-end">
                    <div className="w-5 h-5 rounded-full bg-white/30 border border-white/40 flex items-center justify-center text-white text-[9px] group-hover:bg-white group-hover:text-black transition-colors">
                      ↗
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-white mb-0.5">{activeSlideData.card1.title}</h4>
                    <p className="text-[9px] text-white/80 leading-tight">{activeSlideData.card1.desc}</p>
                  </div>
                </Link>

                {/* Card 2 Image Thumbnail */}
                <Link
                  to={activeSlideData.card2.link}
                  className="relative w-28 h-32 rounded-2xl overflow-hidden shrink-0 shadow-xl border border-white/30 group cursor-pointer block"
                >
                  <img src={activeSlideData.card2.image} alt={activeSlideData.card2.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white/30 backdrop-blur-md border border-white/40 flex items-center justify-center text-white text-[9px] group-hover:bg-white group-hover:text-black transition-colors">
                    ↗
                  </div>
                </Link>

                {/* Card 2 Glass Info Card */}
                <Link
                  to={activeSlideData.card2.link}
                  className="bg-white/20 backdrop-blur-xl border border-white/30 p-3.5 rounded-2xl text-white w-44 shrink-0 shadow-xl flex flex-col justify-between h-32 relative cursor-pointer hover:bg-white/30 transition-all group"
                >
                  <div className="flex justify-end">
                    <div className="w-5 h-5 rounded-full bg-white/30 border border-white/40 flex items-center justify-center text-white text-[9px] group-hover:bg-white group-hover:text-black transition-colors">
                      ↗
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-white mb-0.5">{activeSlideData.card2.title}</h4>
                    <p className="text-[9px] text-white/80 leading-tight">{activeSlideData.card2.desc}</p>
                  </div>
                </Link>
              </div>

              {/* Slider Controls Bar */}
              <div className="flex items-center justify-between gap-4 pt-1 border-t border-white/20">
                <div className="flex items-center gap-3 flex-1 max-w-md">
                  <span className="text-[11px] font-bold font-mono">0{currentSlideIndex}</span>
                  <div className="h-[2px] flex-1 bg-white/30 rounded-full relative overflow-hidden">
                    <div
                      className="absolute left-0 top-0 bottom-0 bg-white rounded-full transition-all duration-500"
                      style={{ width: `${(currentSlideIndex / 4) * 100}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-bold font-mono">04</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentSlideIndex(prev => (prev === 1 ? 4 : prev - 1))}
                    className="w-8 h-8 rounded-full bg-white/20 border border-white/30 text-white flex items-center justify-center hover:bg-white/30 transition-all cursor-pointer text-xs"
                    aria-label="Previous Slide"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentSlideIndex(prev => (prev === 4 ? 1 : prev + 1))}
                    className="w-8 h-8 rounded-full bg-white text-black font-bold flex items-center justify-center shadow-md hover:bg-white/90 transition-all cursor-pointer text-xs"
                    aria-label="Next Slide"
                  >
                    →
                  </button>
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* SECTION 2: YOUR BEAUTY AND SUCCESS START HERE! */}
      <section className="py-16 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-10">
          <div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1A1817] tracking-tight">
              Your Beauty And Success<br />
              <span className="font-serif italic font-normal text-[#B86B53]">Start Here!</span>
            </h2>
          </div>
          <Link
            to="/pages/about-us"
            className="w-16 h-16 rounded-full bg-[#FAF3F0] border border-[#EADBBD] flex flex-col items-center justify-center text-center p-2 shadow-sm hover:bg-black hover:text-white transition-all cursor-pointer group"
          >
            <span className="text-xs group-hover:translate-x-0.5 transition-transform">↗</span>
            <span className="text-[9px] font-bold uppercase tracking-tighter">About Us</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          {/* Card 1: Face Mask Treatment */}
          <div className="md:col-span-5 bg-white rounded-[28px] p-5 border border-gray-100 shadow-sm flex flex-col justify-between space-y-4">
            <div className="h-64 rounded-2xl overflow-hidden bg-gray-100">
              <img
                src="https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=800"
                alt="Face Mask Treatment"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="space-y-3">
              <p className="text-xs font-bold text-[#1A1817] max-w-xs leading-snug">
                Elevate your skin care with our Beauty Center treatments and specialized botanicals.
              </p>
              <Link
                to="/pages/about-us"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-gray-200 text-xs font-extrabold hover:bg-black hover:text-white transition-all shadow-2xs"
              >
                Read More <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 2 & 3: Texture Swatch & Discover Potential */}
          <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-[#EFE5E0] rounded-[28px] p-4 flex items-center justify-center h-full min-h-[260px]">
              <img
                src="https://images.unsplash.com/photo-1608248597263-00079e96047a?q=80&w=800"
                alt="Cream Swatch"
                className="w-full h-full object-cover rounded-2xl"
              />
            </div>

            <div className="bg-white rounded-[28px] p-5 border border-gray-100 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-xl font-extrabold text-[#1A1817] mb-2">Discover Your Beauty Potential</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Step into our private wellness suites designed for tranquility and transformative aesthetic treatments.
                </p>
              </div>
              <div className="h-44 rounded-2xl overflow-hidden bg-gray-100">
                <img
                  src="https://images.unsplash.com/photo-1560750588-73207b1ef5b8?q=80&w=800"
                  alt="Beauty Salon Interior"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: SERVICE WE PROVIDE */}
      <section id="services" className="py-16 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-10">
          <h2 className="text-3xl font-extrabold text-[#1A1817] tracking-tight">Service We Provide</h2>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-gray-200 text-xs font-bold hover:bg-black hover:text-white transition-all shadow-2xs"
          >
            More Services <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Service Accordion List */}
          <div className="lg:col-span-4 space-y-3">
            {servicesList.map((service) => (
              <button
                key={service.id}
                type="button"
                onClick={() => setActiveService(service.id)}
                className={`w-full p-4 rounded-2xl text-left flex items-center justify-between transition-all cursor-pointer border ${
                  activeService === service.id
                    ? 'bg-[#1A1817] text-white border-[#1A1817] shadow-lg scale-[1.02]'
                    : 'bg-white text-[#1A1817] border-gray-100 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      activeService === service.id ? 'bg-white text-black' : 'bg-gray-100 text-black'
                    }`}
                  >
                    ✓
                  </div>
                  <span className="text-sm font-extrabold">{service.id}</span>
                </div>
                <ArrowRight className={`w-4 h-4 ${activeService === service.id ? 'text-white' : 'text-gray-400'}`} />
              </button>
            ))}
          </div>

          {/* Active Service Dual Photo Showcase */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Main Treatment Photo */}
            <div className="relative rounded-[28px] overflow-hidden bg-gray-100 h-80 sm:h-96 shadow-md group">
              <img
                src={servicesList.find(s => s.id === activeService)?.image || servicesList[0].image}
                alt={activeService}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent p-6 flex flex-col justify-end text-white">
                <span className="text-[10px] font-bold uppercase tracking-widest bg-white/20 backdrop-blur-md px-3 py-1 rounded-full w-fit mb-2">
                  {servicesList.find(s => s.id === activeService)?.badge}
                </span>
                <h3 className="text-xl font-bold">{servicesList.find(s => s.id === activeService)?.title}</h3>
                <p className="text-xs text-white/80 mt-1">{servicesList.find(s => s.id === activeService)?.desc}</p>
              </div>
            </div>

            {/* Secondary Product Photo with Overlay Badge */}
            <div className="relative rounded-[28px] overflow-hidden bg-gray-100 h-80 sm:h-96 shadow-md flex items-center justify-center p-6">
              <img
                src="https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?q=80&w=800"
                alt="Product Application"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="relative z-10 text-center">
                <Link
                  to="/shop"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/40 backdrop-blur-md border border-white/60 text-black font-extrabold text-xs hover:bg-white transition-all shadow-xl"
                >
                  Learn More <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: LATEST PRODUCT LAUNCH AVAILABLE NOW! */}
      <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto bg-white rounded-[36px] border border-gray-100 shadow-sm my-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
          <div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1A1817] tracking-tight">
              Latest Product Launch<br />
              <span className="font-serif italic font-normal text-[#B86B53]">Available Now!</span>
            </h2>
            <p className="text-xs text-gray-500 mt-2">Experience the Ultimate Beauty Makeover</p>
          </div>

          {/* Category Selector Pills */}
          <div className="flex flex-wrap items-center gap-2 bg-[#F7F3F0] p-1.5 rounded-full border border-gray-200">
            {['Serums', 'Masks', 'Cleaners', 'Eye Cream'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setLaunchCategory(cat)}
                className={`px-5 py-2 text-xs font-extrabold rounded-full transition-all cursor-pointer ${
                  launchCategory === cat
                    ? 'bg-[#1A1817] text-white shadow-sm'
                    : 'text-gray-700 hover:text-black'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Centerpiece Circular Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Side Product Thumbnails */}
          <div className="lg:col-span-3 flex lg:flex-col items-center gap-4">
            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shadow-sm cursor-pointer hover:border-black transition-colors" onClick={() => navigate('/shop')}>
              <img src="https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=300" alt="Serum Thumbnail 1" className="w-full h-full object-cover" />
            </div>
            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shadow-sm cursor-pointer hover:border-black transition-colors" onClick={() => navigate('/shop')}>
              <img src="https://images.unsplash.com/photo-1608248597263-00079e96047a?q=80&w=300" alt="Serum Thumbnail 2" className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Center Circular Rotating Text Container */}
          <div className="lg:col-span-5 flex justify-center relative">
            <div className="relative w-72 h-72 sm:w-96 sm:h-96 rounded-full p-6 flex items-center justify-center border border-gray-200/80 shadow-xl">
              
              {/* Rotating Circular Text SVG Ring */}
              <svg className="absolute inset-0 w-full h-full animate-spin-slow pointer-events-none p-2" viewBox="0 0 200 200">
                <path
                  id="circlePath"
                  d="M 100, 100 m -75, 0 a 75,75 0 1,1 150,0 a 75,75 0 1,1 -150,0"
                  fill="none"
                />
                <text fill="#1A1817" fontSize="9" fontWeight="bold" letterSpacing="2.5">
                  <textPath href="#circlePath">
                    Revitalize Your Skin and Spirit at Our Beauty Center • Revitalize Your Skin and Spirit •
                  </textPath>
                </text>
              </svg>

              {/* Inner Round Model Image */}
              <div className="w-56 h-56 sm:w-72 sm:h-72 rounded-full overflow-hidden shadow-2xl relative">
                <img
                  src={currentLaunchItem.modelsImage}
                  alt={currentLaunchItem.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Right Side Product Info & Add to Cart */}
          <div className="lg:col-span-4 space-y-6">
            <div>
              <h3 className="text-2xl font-extrabold text-[#1A1817] leading-tight mb-3">
                {currentLaunchItem.name}
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">
                {currentLaunchItem.desc}
              </p>
              <div className="text-3xl font-extrabold text-[#1A1817]">
                ${currentLaunchItem.price.toFixed(2)}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                addItemToCart({
                  id: currentLaunchItem.id,
                  name: currentLaunchItem.name,
                  price: currentLaunchItem.price,
                  image_url: currentLaunchItem.image,
                  quantity: 1
                });
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-[#1A1817] text-white font-extrabold text-sm hover:bg-neutral-800 transition-all shadow-xl cursor-pointer active:scale-95"
            >
              <ShoppingBag className="w-4 h-4" /> Add to Cart
            </button>
          </div>

        </div>
      </section>

      {/* SECTION 5: EXCLUSIVE BEAUTY TRANSFORMATION AWAITS */}
      <section className="py-16 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-10">
          <h2 className="text-3xl font-extrabold text-[#1A1817] tracking-tight">
            Exclusive <span className="font-serif italic font-normal text-[#B86B53]">Beauty</span> Transformation Awaits
          </h2>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-gray-200 text-xs font-bold hover:bg-black hover:text-white transition-all shadow-2xs"
          >
            More Services <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 3-Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-6 relative rounded-[32px] overflow-hidden bg-gray-900 min-h-[360px] p-8 flex flex-col justify-between text-white shadow-lg group">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800"
              alt="Holistic Approach"
              className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

            <div className="relative z-10 flex justify-end">
              <Link
                to="/shop"
                className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex flex-col items-center justify-center text-[10px] font-extrabold hover:bg-white hover:text-black transition-all shadow-lg text-center leading-tight p-2"
              >
                <span>View</span>
                <span>Trend ↗</span>
              </Link>
            </div>

            <div className="relative z-10 space-y-3">
              <h3 className="text-2xl font-extrabold">Holistic Approach</h3>
              <p className="text-xs text-white/80 max-w-sm">Enhance Your Natural Beauty with Our Expert Services</p>
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/30 backdrop-blur-md text-xs font-bold">
                🌸 Skin Care
              </span>
            </div>
          </div>

          <div className="md:col-span-3 rounded-[32px] overflow-hidden bg-gray-100 min-h-[360px] shadow-sm">
            <img
              src="https://images.unsplash.com/photo-1512290900673-700259b85c13?q=80&w=600"
              alt="Skincare Cream Application"
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            />
          </div>

          <div className="md:col-span-3 rounded-[32px] overflow-hidden bg-gray-100 min-h-[360px] shadow-sm">
            <img
              src="https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?q=80&w=600"
              alt="Glowing Beauty Portrait"
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            />
          </div>
        </div>
      </section>

      {/* SECTION 6: YOUR BEAUTY CATALOGUE */}
      <section className="py-16 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
          <div>
            <h2 className="text-3xl font-extrabold text-[#1A1817] tracking-tight">
              Your <span className="font-serif italic font-normal text-[#B86B53]">Beauty Catalogue</span>
            </h2>
            <p className="text-xs text-gray-500 mt-1">Explore our best seller beauty showcase</p>
          </div>

          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1A1817] text-white text-xs font-extrabold hover:bg-neutral-800 transition-all shadow-md"
          >
            View More ↗
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {catalogueList.slice(0, 4).map((item) => {
            const rawPrice = item.sale_price || item.price || '45.00';
            const numPrice = typeof rawPrice === 'number' ? rawPrice : parseFloat(rawPrice);
            const image = item.image_url || item.image || 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=600';

            return (
              <div
                key={item.id}
                className="bg-white rounded-[28px] p-4 border border-gray-100 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
              >
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50 mb-4">
                  <img
                    src={image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <button
                    type="button"
                    onClick={() => toggleWishlist(item)}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-gray-700 hover:bg-white hover:text-red-500 transition-colors shadow-sm cursor-pointer"
                  >
                    <Heart className={`w-4 h-4 ${isWishlisted(item.id) ? 'fill-red-500 text-red-500' : ''}`} />
                  </button>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-extrabold text-[#1A1817] uppercase tracking-wider truncate">
                    {item.name}
                  </h4>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extrabold text-[#1A1817]">
                      {currencySymbol}{numPrice.toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => addItemToCart({ id: item.id, name: item.name, price: numPrice, image_url: image, quantity: 1 })}
                      className="w-8 h-8 rounded-full bg-[#1A1817] text-white flex items-center justify-center hover:bg-neutral-800 transition-colors cursor-pointer"
                    >
                      →
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 7: GLOWING REVIEWS */}
      <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto bg-white rounded-[36px] border border-gray-100 shadow-sm my-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
          <div>
            <h2 className="text-3xl font-extrabold text-[#1A1817] tracking-tight">
              Glowing <span className="font-serif italic font-normal text-[#B86B53]">Reviews</span>
            </h2>
            <p className="text-xs text-gray-500 mt-1">Read initial feedback of clients for Beauty Center</p>
          </div>

          <div className="flex items-center gap-3 bg-[#FAF7F4] px-4 py-2 rounded-full border border-gray-200">
            <div className="flex -space-x-2">
              <img className="w-8 h-8 rounded-full border-2 border-white object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100" alt="Client 1" />
              <img className="w-8 h-8 rounded-full border-2 border-white object-cover" src="https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=100" alt="Client 2" />
              <img className="w-8 h-8 rounded-full border-2 border-white object-cover" src="https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?q=80&w=100" alt="Client 3" />
            </div>
            <span className="text-xs font-extrabold text-[#1A1817]">4.9 / 5.0 (2k+ Reviews)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className="bg-[#FAF7F4] rounded-[28px] p-6 border border-gray-200/60 shadow-2xs space-y-4 flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <p className="text-xs text-gray-700 italic leading-relaxed">
                "{t.text}"
              </p>
              <div className="flex items-center gap-3 pt-2 border-t border-gray-200/50">
                <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <h5 className="text-xs font-extrabold text-[#1A1817]">{t.name}</h5>
                  <span className="text-[10px] text-gray-400 block">{t.handle}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handlePrevReview}
            className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-black hover:bg-black hover:text-white transition-all cursor-pointer shadow-2xs"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={handleNextReview}
            className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center hover:bg-neutral-800 transition-all cursor-pointer shadow-md"
          >
            ›
          </button>
        </div>
      </section>

      {/* SEARCH MODAL (Triggered by Search Icon) */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-start justify-center pt-20 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-xl p-6 shadow-2xl space-y-4 relative border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-extrabold text-sm text-[#1A1817]">Search Beauty Center</h3>
              <button onClick={() => setShowSearchModal(false)} className="p-1 text-gray-400 hover:text-black rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSearchSubmit} className="flex items-center relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-4" />
              <input
                type="text"
                autoFocus
                placeholder="Search products, facial creams, serums..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-24 py-3 bg-[#FAF7F4] rounded-full text-xs font-medium border border-gray-200 focus:outline-none focus:border-black"
              />
              <button
                type="submit"
                className="absolute right-2 px-4 py-1.5 bg-black text-white rounded-full text-xs font-bold"
              >
                Search
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CATEGORY MODAL (Triggered by Category Pill) */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-6 md:p-8 shadow-2xl space-y-6 relative border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="font-extrabold text-lg text-[#1A1817]">Explore Beauty Categories</h3>
                <p className="text-xs text-gray-400">Select a category to browse luxury spa collections</p>
              </div>
              <button onClick={() => setShowCategoryModal(false)} className="p-1.5 text-gray-400 hover:text-black rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { name: 'Facials & Serums', slug: 'serums', icon: '🌸', count: '12 Items' },
                { name: 'Face Masks', slug: 'masks', icon: '✨', count: '8 Items' },
                { name: 'Botanical Cleansers', slug: 'cleaners', icon: '🌿', count: '10 Items' },
                { name: 'Eye Creams', slug: 'eye-care', icon: '👁️', count: '6 Items' },
                { name: 'Pedicure & Foot Care', slug: 'pedicure', icon: '🦶', count: '9 Items' },
                { name: 'Manicure & Gel Polish', slug: 'manicure', icon: '💅', count: '14 Items' },
              ].map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => {
                    setShowCategoryModal(false);
                    navigate(`/shop?category=${cat.slug}`);
                  }}
                  className="p-4 bg-[#FAF7F4] hover:bg-black hover:text-white rounded-2xl border border-gray-200/80 text-left transition-all group cursor-pointer"
                >
                  <span className="text-2xl mb-2 block">{cat.icon}</span>
                  <h4 className="text-xs font-extrabold mb-0.5">{cat.name}</h4>
                  <span className="text-[10px] text-gray-400 group-hover:text-white/70 block">{cat.count}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DRAWER NAVIGATION MODAL (Triggered by Hamburger Button) */}
      {showNavDrawer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex justify-start animate-fade-in" onClick={() => setShowNavDrawer(false)}>
          <div className="bg-[#1A1817] text-white w-80 max-w-full h-full p-8 shadow-2xl flex flex-col justify-between" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-8">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <span className="font-bold text-xl">BeautyCenter</span>
                <button onClick={() => setShowNavDrawer(false)} className="p-1 text-white/70 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex flex-col gap-4 font-bold text-base">
                <Link to="/" onClick={() => setShowNavDrawer(false)} className="hover:text-[#B86B53] transition-colors">Home</Link>
                <Link to="/shop" onClick={() => setShowNavDrawer(false)} className="hover:text-[#B86B53] transition-colors">Shop Catalog</Link>
                <Link to="/pages/about-us" onClick={() => setShowNavDrawer(false)} className="hover:text-[#B86B53] transition-colors">About Beauty Center</Link>
                <Link to="/gallery" onClick={() => setShowNavDrawer(false)} className="hover:text-[#B86B53] transition-colors">Spa Gallery</Link>
                <Link to="/reviews" onClick={() => setShowNavDrawer(false)} className="hover:text-[#B86B53] transition-colors">Client Reviews</Link>
                <Link to="/contact" onClick={() => setShowNavDrawer(false)} className="hover:text-[#B86B53] transition-colors">Contact Us</Link>
              </nav>
            </div>

            <div className="pt-6 border-t border-white/10 text-xs text-white/50 space-y-2">
              <p>© BeautyCenter Luxury Spa</p>
              <p>Step into elegance & skin wellness.</p>
            </div>
          </div>
        </div>
      )}

      {/* VIDEO MODAL */}
      {showVideoModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="relative w-full max-w-4xl bg-black rounded-3xl overflow-hidden shadow-2xl aspect-video border border-white/20">
            <button
              type="button"
              onClick={() => setShowVideoModal(false)}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-white hover:text-black transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <iframe
              className="w-full h-full"
              src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
              title="Beauty Center Spa Demo"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
}
