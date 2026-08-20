import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Search, ChevronDown, ChevronUp, Ruler, Heart, HelpCircle, CheckCircle, Info, ShieldCheck, MessageCircle, Sparkles, Sun, Moon, Droplets, Shield, ArrowRight, Zap, Flame, Eye, Star } from 'lucide-react';
import FaqSection from '../../components/storefront/FaqSection';

export default function PolicyPage() {
  const { slug } = useParams();
  const [faqSearch, setFaqSearch] = useState('');
  const [openFaqId, setOpenFaqId] = useState(null);

  // Size guide local toggle tab
  const [sizeTab, setSizeTab] = useState('dresses');

  // Fetch page content
  const { data: pageRes, isLoading } = useQuery({
    queryKey: ['policy-page', slug],
    queryFn: () => fetch(`/api/pages/${slug}`).then(res => res.json())
  });

  // Fetch FAQ items (only query if slug is faq)
  const { data: faqsRes, isLoading: isFaqsLoading } = useQuery({
    queryKey: ['faqs-list'],
    queryFn: () => fetch('/api/faqs').then(res => res.json()),
    enabled: slug === 'faq'
  });

  // Fetch articles/tips from CMS (when on tips page)
  const { data: articlesRes } = useQuery({
    queryKey: ['tips-articles-list'],
    queryFn: () => fetch('/api/articles').then(res => res.json()),
    enabled: slug === 'tips'
  });

  const page = pageRes?.data;
  const faqs = faqsRes?.data || [];
  const articlesList = articlesRes?.data || [];

  // Fetch settings for dynamic ecommerce details (CEO)
  const { data: settingsRes } = useQuery({
    queryKey: ['settings-storefront'],
    queryFn: () => fetch('/api/settings').then(res => res.json())
  });
  const settings = settingsRes?.data?.settings || {};

  if (isLoading || (slug === 'faq' && isFaqsLoading)) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 animate-pulse flex flex-col gap-6">
        <div className="bg-gray-100 h-6 rounded w-1/4" />
        <div className="bg-gray-100 h-10 rounded w-3/4" />
        <div className="bg-gray-100 h-40 rounded w-full" />
      </div>
    );
  }

  if (!page && slug !== 'tips' && slug !== 'about-us') {
    return (
      <div className="max-w-md mx-auto text-center py-24 px-6 flex flex-col items-center gap-4">
        <span className="text-4xl">📄</span>
        <h2 className="font-serif font-bold text-gray-800 text-base">Page Not Found</h2>
        <p className="text-xs text-gray-500">The page you are trying to view does not exist or has been removed.</p>
        <Link to="/" className="px-6 py-3 bg-[#5D3E85] hover:bg-[#EC268F] text-white text-xs font-extrabold rounded-full shadow-md transition-all">
          Return Home
        </Link>
      </div>
    );
  }

  const isAdmin = !!localStorage.getItem('dansolam_admin_token');

  // Filter FAQs based on query
  const filteredFaqs = faqs.filter(item => {
    const q = faqSearch.toLowerCase();
    return item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q);
  });

  const isWidePage = slug === 'about-us' || slug === 'tips';

  return (
    <div className="bg-[#FBFAF8] dark:bg-[#17101F] min-h-screen font-sans pb-20 transition-colors duration-300 w-full">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-5 lg:px-6 pt-20 sm:pt-22 md:pt-24 pb-16 flex flex-col gap-6">
        {/* ==========================================
          A. CUSTOM STYLED ABOUT-US PAGE
         ========================================== */}
        {slug === 'about-us' ? (
          <div className="flex flex-col gap-6 animate-fade-in text-left">
            {/* Hero Banner - Compact, Wide, Back Button Inside */}
            <div className="h-[200px] sm:h-[240px] md:h-[270px] rounded-[28px] sm:rounded-[36px] overflow-hidden bg-gray-900 relative shadow-md w-full">
              <img loading="eager" decoding="async" fetchPriority="high"
                src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200"
                className="w-full h-full object-cover"
                alt="Dansolam Cover"
              />
              {/* Header Action Buttons Inside Banner */}
              <div className="absolute top-4 sm:top-5 left-4 sm:left-6 right-4 sm:right-6 flex justify-between items-center z-20">
                <Link
                  to="/"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/20 text-[11px] font-bold text-white shadow-sm transition-all duration-300 btn-spring"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Home</span>
                </Link>
                {isAdmin && (
                  <a
                    href="/admin/pages"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/20 text-[10px] font-bold text-[#EC268F] rounded-full transition-all flex items-center gap-1 shadow-sm btn-spring"
                  >
                    Edit in CMS ⚙️
                  </a>
                )}
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20 flex flex-col justify-end p-5 sm:p-7 md:p-9 text-left z-10">
                <span className="text-[9px] sm:text-[10px] font-extrabold text-[#5D3E85] bg-white px-3.5 py-1 rounded-full  tracking-widest self-start mb-2 border border-white/40 shadow-sm">
                  Who We Are
                </span>
                <h1 className="font-extrabold text-xl sm:text-2xl md:text-3xl lg:text-4xl text-white leading-tight">
                  {page.title}
                </h1>
                <p className="text-[11px] sm:text-xs md:text-sm text-gray-200 mt-1 max-w-2xl font-sans leading-snug line-clamp-2">
                  Premier organic skincare shop dedicated to glowing formulas, rejuvenation treatments, and luxury care.
                </p>
              </div>
            </div>

            {/* Two Column Brand Content */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-start">
              <div className="md:col-span-3 flex flex-col gap-4 text-xs md:text-sm text-gray-600 dark:text-[#C9BED4] leading-relaxed font-sans">
                <h2 className="font-extrabold text-[#221B2B] dark:text-[#F3EFF6] text-lg md:text-xl border-b border-[#5D3E85]/10 dark:border-white/10 pb-2">
                  Our Heritage & Vision
                </h2>
                <p>
                  Welcome to <strong>Dansolam Beauty Home</strong>. Dansolam is a luxury skincare shop dedicated to delivering flawless, glowing skin naturally. Every product is formulated with 100% organic herbs, botanical extracts, almond oil, and essential oils — because looking good is our pride.
                </p>
                <p>
                  We combine age-old organic herbal wisdom with modern cold-press processing to formulate glowing soaps, whitening polishes, body scrubs, and discoloration treatments. Our products hydrate, clear dark spots, fade sunburn, and restore your skin's natural glow without harsh chemicals.
                </p>

                <div className="bg-[#5D3E85]/5 dark:bg-white/5 rounded-3xl p-6 flex gap-4 mt-2 border border-[#5D3E85]/10 dark:border-white/10">
                  <div>
                    <h4 className="font-extrabold text-[#221B2B] dark:text-[#F3EFF6] text-xs">The 100% Organic Purity Guarantee</h4>
                    <p className="text-[11px] text-gray-500 dark:text-[#9B8EA9] mt-1 leading-relaxed">
                      Every Dansolam product is tested for skin safety, zero hydroquinone, zero steroids, and 100% botanical goodness to deliver visible skin radiance safely.
                    </p>
                  </div>
                </div>
              </div>

              {/* Core Values Cards */}
              <div className="md:col-span-2 flex flex-col gap-4 bg-white dark:bg-[#1E1528] border border-[#EADBEE] dark:border-white/10 p-6 rounded-3xl shadow-xs">
                <h3 className="font-extrabold text-[#221B2B] dark:text-[#F3EFF6] text-sm border-b border-gray-100 dark:border-white/10 pb-2">
                  Core Pillars
                </h3>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-extrabold text-[#5D3E85] dark:text-[#EC268F] flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> 1. 100% ORGANIC FORMULAS
                  </span>
                  <p className="text-[11px] text-gray-500 dark:text-[#9B8EA9] leading-normal pl-4.5">
                    Formulated with pure plant oils, almond extract, and natural herbs for safe daily skin nourishment.
                  </p>
                </div>

                <div className="flex flex-col gap-1.5 mt-2">
                  <span className="text-[10px] font-extrabold text-[#5D3E85] dark:text-[#EC268F] flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> 2. RAPID 5-DAY RADIANCE
                  </span>
                  <p className="text-[11px] text-gray-500 dark:text-[#9B8EA9] leading-normal pl-4.5">
                    Formulated to visibly smooth, brighten, and clarify skin tone within 5 days of daily use.
                  </p>
                </div>

                <div className="flex flex-col gap-1.5 mt-2">
                  <span className="text-[10px] font-extrabold text-[#5D3E85] dark:text-[#EC268F] flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> 3. ALL COMPLEXIONS INCLUDED
                  </span>
                  <p className="text-[11px] text-gray-500 dark:text-[#9B8EA9] leading-normal pl-4.5">
                    Custom organic solutions for chocolate, fair, sensitive, kids, and dark spot treatment routines.
                  </p>
                </div>
              </div>
            </div>

            {/* Meet the CEO Section */}
            {settings.ceo_name && (
              <div className="bg-white dark:bg-[#1E1528] border border-[#EADBEE] dark:border-white/10 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8 items-center text-left mt-4 shadow-xs text-[#221B2B] dark:text-[#F3EFF6]">
                {settings.ceo_image_url && (
                  <div className="w-40 h-48 md:w-48 md:h-56 rounded-2xl overflow-hidden bg-gray-50 dark:bg-white/5 shrink-0 shadow-xs border border-gray-100 dark:border-white/10">
                    <img loading="lazy" decoding="async"
                      src={settings.ceo_image_url}
                      alt={settings.ceo_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 flex flex-col gap-2">
                  <span className="inline-flex items-center px-3.5 py-1 rounded-full bg-white dark:bg-[#1E1528] text-[#5D3E85] dark:text-[#EC268F] text-[9px] sm:text-[10px] font-extrabold tracking-widest  border border-[#EADBEE] dark:border-white/10 shadow-xs self-start">
                    Leadership
                  </span>
                  <h3 className="font-extrabold text-[#221B2B] dark:text-[#F3EFF6] text-lg md:text-xl leading-none">
                    Meet the CEO: {settings.ceo_name}
                  </h3>
                  <div
                    className="text-xs md:text-sm text-gray-500 dark:text-[#C9BED4] leading-relaxed font-sans prose prose-sm max-w-none mt-2"
                    dangerouslySetInnerHTML={{ __html: settings.ceo_bio }}
                  />
                </div>
              </div>
            )}

            <FaqSection
              title="A Little More About Shopping With Us"
              eyebrow="Ecommerce FAQs"
              description="Useful answers about our collections, fittings, delivery and customer care."
            />
          </div>
        ) :

          /* ==========================================
              B. CUSTOM STYLED TIPS PAGE
             ========================================== */
          slug === 'tips' ? (
            <div className="flex flex-col gap-12 animate-fade-in pb-16 text-left">
              {/* Hero Banner - Compact, Wide, Back Button Inside */}
              <div className="h-[200px] sm:h-[240px] md:h-[270px] rounded-[28px] sm:rounded-[36px] overflow-hidden bg-gray-900 relative shadow-md w-full">
                <img
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                  src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1200"
                  className="w-full h-full object-cover object-center"
                  alt="Beauty Tips & Glow Rituals"
                />

                {/* Header Action Buttons Inside Banner */}
                <div className="absolute top-4 sm:top-5 left-4 sm:left-6 right-4 sm:right-6 flex justify-between items-center z-20">
                  <Link
                    to="/"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/20 text-[11px] font-bold text-white shadow-sm transition-all duration-300 btn-spring"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Home</span>
                  </Link>
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20 flex flex-col justify-end p-5 sm:p-7 md:p-9 text-left z-10">
                  <span className="text-[9px] sm:text-[10px] font-extrabold text-[#5D3E85] bg-white px-3.5 py-1 rounded-full  tracking-widest self-start mb-2 border border-white/40 shadow-sm">
                    ✨ Beauty & Glow Protocols
                  </span>
                  <h1 className="font-extrabold text-xl sm:text-2xl md:text-3xl lg:text-4xl text-white leading-tight">
                    {page?.title || 'Expert Skincare Tips & Daily Rituals'}
                  </h1>
                  <p className="text-[11px] sm:text-xs md:text-sm text-gray-200 mt-1 max-w-2xl font-sans leading-snug line-clamp-2">
                    Discover step-by-step skincare rituals, botanical application techniques, and product routines crafted by our aesthetic experts.
                  </p>
                </div>
              </div>

              {/* 1. VISUAL 4-STEP MORNING & NIGHT RADIANCE PROTOCOL */}
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2 text-left">
                  <span className="inline-flex items-center px-3.5 py-1 rounded-full bg-white dark:bg-[#1E1528] text-[#5D3E85] dark:text-[#EC268F] text-[10px] sm:text-[11px] font-extrabold tracking-widest  border border-[#EADBEE] dark:border-white/10 shadow-xs self-start">
                    Daily Radiance Sequence
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[#221B2B] dark:text-[#F3EFF6] tracking-tight">
                    The 4-Step Glow Protocol
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-[#9B8EA9]">
                    Follow this proven sequence every morning and evening for maximum botanical absorption and rapid radiance.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {[
                    {
                      step: '01',
                      time: 'Morning & Night (2 mins)',
                      title: 'Deep Herbal Cleansing',
                      desc: 'Wash face and body with Whitening Polish Soap to eliminate impurities and dead cells without stripping moisture.',
                      image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=600',
                      pill: 'Step 1: Polish'
                    },
                    {
                      step: '02',
                      time: 'Pat Gently (1 min)',
                      title: 'Hydration Infusion',
                      desc: 'Mist or pat rose hydration toner to rebalance skin pH and open cellular pathways for active ingredient uptake.',
                      image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=600',
                      pill: 'Step 2: Tone'
                    },
                    {
                      step: '03',
                      time: '3-4 Drops Press',
                      title: 'Targeted Serum Corrective',
                      desc: 'Apply Luminous Brightening Serum directly onto hyperpigmented areas, sun spots, and dark knuckles.',
                      image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=600',
                      pill: 'Step 3: Correct'
                    },
                    {
                      step: '04',
                      time: 'Smooth & Seal',
                      title: 'Moisture Lock & SPF 50',
                      desc: 'Lock in 24hr hydration with Glowing Moisturizing Cream, and finish with mineral sunscreen to shield against UV damage.',
                      image: 'https://images.unsplash.com/photo-1608248597263-00079e96047a?q=80&w=600',
                      pill: 'Step 4: Protect'
                    }
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-white dark:bg-[#1E1528] rounded-[28px] border border-[#EADBEE] dark:border-white/10 overflow-hidden shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-500 flex flex-col group text-left"
                    >
                      {/* Photo Container with Step Number Badge */}
                      <div className="h-44 w-full relative overflow-hidden bg-[#FAF7FC] dark:bg-white/5">
                        <img
                          src={item.image}
                          alt={item.title}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                        {/* Glowing Step Tag */}
                        <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full text-[10px] font-extrabold text-white flex items-center gap-1.5 shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#EC268F] animate-ping" />
                          <span>{item.pill}</span>
                        </div>

                        <div className="absolute bottom-3 left-3 text-white font-extrabold text-2xl font-serif">
                          {item.step}
                        </div>
                      </div>

                      {/* Body Info */}
                      <div className="p-5 flex flex-col gap-2 flex-1 justify-between">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[9px] font-bold text-[#5D3E85] dark:text-[#EC268F]  tracking-wider">
                            ⏱️ {item.time}
                          </span>
                          <h3 className="font-extrabold text-[#221B2B] dark:text-[#F3EFF6] text-sm group-hover:text-[#EC268F] transition-colors leading-snug">
                            {item.title}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-[#C9BED4] leading-relaxed">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. INTERACTIVE TABBED ROUTINES WITH RICH PRODUCT CARDS */}
              <div className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div className="flex flex-col gap-2">
                    <span className="inline-flex items-center px-3.5 py-1 rounded-full bg-white dark:bg-[#1E1528] text-[#5D3E85] dark:text-[#E5C158] text-[10px] sm:text-[11px] font-extrabold tracking-widest  border border-[#EADBEE] dark:border-white/10 shadow-xs self-start">
                      Targeted Formulations
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-[#221B2B] dark:text-[#F3EFF6] tracking-tight">
                      Application Instructions & Expected Results
                    </h2>
                  </div>

                  {/* Tab Selectors */}
                  <div className="flex gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setSizeTab('creams')}
                      className={`px-5 py-2 text-xs font-extrabold rounded-full transition-all cursor-pointer flex items-center gap-1.5 btn-spring ${sizeTab === 'creams'
                        ? 'bg-[#5D3E85] dark:bg-[#EC268F] text-white shadow-md'
                        : 'bg-white dark:bg-[#1E1528] text-gray-700 dark:text-[#C9BED4] border border-[#EADBEE] dark:border-white/10 hover:border-[#5D3E85]'
                        }`}
                    >
                      <span>🧴 Creams & Soaps</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSizeTab('oils')}
                      className={`px-5 py-2 text-xs font-extrabold rounded-full transition-all cursor-pointer flex items-center gap-1.5 btn-spring ${sizeTab === 'oils'
                        ? 'bg-[#5D3E85] dark:bg-[#EC268F] text-white shadow-md'
                        : 'bg-white dark:bg-[#1E1528] text-gray-700 dark:text-[#C9BED4] border border-[#EADBEE] dark:border-white/10 hover:border-[#5D3E85]'
                        }`}
                    >
                      <Heart className="w-3.5 h-3.5" />
                      <span>Oils & Fragrances</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSizeTab('spa')}
                      className={`px-5 py-2 text-xs font-extrabold rounded-full transition-all cursor-pointer flex items-center gap-1.5 btn-spring ${sizeTab === 'spa'
                        ? 'bg-[#5D3E85] dark:bg-[#EC268F] text-white shadow-md'
                        : 'bg-white dark:bg-[#1E1528] text-gray-700 dark:text-[#C9BED4] border border-[#EADBEE] dark:border-white/10 hover:border-[#5D3E85]'
                        }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>VIP Spa Protocols</span>
                    </button>
                  </div>
                </div>

                {/* Product Tip Cards */}
                {sizeTab === 'creams' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      {
                        name: 'Glowing Moisturizing Cream',
                        volume: '500g Jar',
                        usage: 'Apply morning and night immediately after showering on damp skin.',
                        concern: 'Dryness, rough patches, dullness',
                        result: 'Instant velvety softness & 24hr deep moisture glow',
                        image: 'https://images.unsplash.com/photo-1608248597263-00079e96047a?q=80&w=600',
                        tag: 'BESTSELLER'
                      },
                      {
                        name: 'Whitening Polish Soap',
                        volume: '750ml Pump',
                        usage: 'Lather with bath sponge; leave on skin for 2-3 minutes before rinsing.',
                        concern: 'Dark spots, dead cells, textured pores',
                        result: 'Visible brightening & clarified tone in 5 days',
                        image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=600',
                        tag: 'RAPID GLOW'
                      },
                      {
                        name: 'Dansolam Plus (Molato Wash)',
                        volume: '500g Bottle',
                        usage: 'Use 3-4 times weekly for intensive cleansing and discoloration therapy.',
                        concern: 'Sunburn, dark knuckles, uneven patches',
                        result: 'Clears stubborn hyperpigmentation & rejuvenates skin layers',
                        image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=600',
                        tag: 'SPECIALTY'
                      },
                      {
                        name: 'Glowing & Spot Remover Face Cream',
                        volume: '30g Compact',
                        usage: 'Massage a dime-sized amount gently across face and neck twice daily.',
                        concern: 'Facial acne scars, melasma, dark circles',
                        result: 'Silky smooth complexion with broad SPF 30 daily shield',
                        image: 'https://images.unsplash.com/photo-1512290900672-1f5be4df1d3a?q=80&w=600',
                        tag: 'FACIAL CARE'
                      },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="group bg-white dark:bg-[#1E1528] rounded-[28px] border border-[#EADBEE] dark:border-white/10 hover:border-[#5D3E85]/40 dark:hover:border-[#EC268F]/40 p-5 sm:p-6 transition-all duration-300 hover:shadow-xl flex flex-col sm:flex-row gap-5 text-left"
                      >
                        {/* Thumbnail Image */}
                        <div className="w-full sm:w-40 h-44 rounded-2xl overflow-hidden bg-gray-50 dark:bg-white/5 shrink-0 relative">
                          <img
                            src={item.image}
                            alt={item.name}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <span className="absolute top-2 left-2 text-[8px] font-extrabold  tracking-wider bg-black/60 backdrop-blur-md text-white px-2 py-0.5 rounded-full border border-white/20">
                            {item.tag}
                          </span>
                        </div>

                        <div className="flex-1 flex flex-col justify-between gap-3">
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="font-extrabold text-sm text-[#221B2B] dark:text-[#F3EFF6] group-hover:text-[#EC268F] transition-colors leading-snug">
                                {item.name}
                              </h3>
                              <span className="text-[10px] font-bold text-[#5D3E85] dark:text-[#EC268F] bg-[#5D3E85]/10 dark:bg-[#EC268F]/20 px-2 py-0.5 rounded-full shrink-0">
                                {item.volume}
                              </span>
                            </div>

                            <div className="mt-3 space-y-2">
                              <div className="flex items-start gap-2">
                                <CheckCircle className="w-3.5 h-3.5 text-[#5D3E85] dark:text-[#EC268F] mt-0.5 shrink-0" />
                                <div>
                                  <span className="text-[9px] font-bold text-gray-400 dark:text-[#9B8EA9]  tracking-wider block">Usage Method</span>
                                  <span className="text-xs text-gray-700 dark:text-[#C9BED4] leading-tight">{item.usage}</span>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <Flame className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                                <div>
                                  <span className="text-[9px] font-bold text-gray-400 dark:text-[#9B8EA9]  tracking-wider block">Target Concern</span>
                                  <span className="text-xs text-gray-700 dark:text-[#C9BED4] leading-tight">{item.concern}</span>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <Sparkles className="w-3.5 h-3.5 text-[#EC268F] mt-0.5 shrink-0" />
                                <div>
                                  <span className="text-[9px] font-bold text-gray-400 dark:text-[#9B8EA9]  tracking-wider block">Expected Results</span>
                                  <span className="text-xs text-[#221B2B] dark:text-[#F3EFF6] font-extrabold leading-tight">{item.result}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <Link
                            to="/shop"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5D3E85] dark:text-[#EC268F] hover:underline self-start pt-1"
                          >
                            <span>Shop this formulation</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : sizeTab === 'oils' || sizeTab === 'shoes' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      {
                        name: 'Discoloration Body Oil',
                        volume: '250ml Flacon',
                        method: 'Massage gently into affected areas before bed to promote cellular regeneration.',
                        ingredients: 'Cold-pressed Sweet Almond extract, Vitamin E & Organic botanicals',
                        image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=600',
                        tag: 'HERBAL OIL'
                      },
                      {
                        name: 'Botanical Essential Oil',
                        volume: '250ml Flacon',
                        method: 'Dab 3-4 drops directly after bathing for anti-bacterial protection and radiance.',
                        ingredients: '100% Pure Essential Plant Essences & Jojoba Oil',
                        image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=600',
                        tag: 'CONCENTRATE'
                      },
                      {
                        name: 'Crimson Petal & Lustra Fragrance',
                        volume: '10g Roll-On',
                        method: 'Roll gently onto neck, collarbone, and wrists for all-day lingering luxury scent.',
                        ingredients: 'Pure Concentrated Perfume Oil & Floral Elixir',
                        image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=600',
                        tag: 'SIGNATURE'
                      }
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="group bg-white dark:bg-[#1E1528] rounded-[28px] border border-[#EADBEE] dark:border-white/10 hover:border-[#EC268F]/40 p-5 sm:p-6 transition-all duration-300 hover:shadow-xl flex flex-col sm:flex-row gap-5 text-left"
                      >
                        <div className="w-full sm:w-40 h-44 rounded-2xl overflow-hidden bg-gray-50 dark:bg-white/5 shrink-0 relative">
                          <img
                            src={item.image}
                            alt={item.name}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <span className="absolute top-2 left-2 text-[8px] font-extrabold  tracking-wider bg-black/60 backdrop-blur-md text-white px-2 py-0.5 rounded-full border border-white/20">
                            {item.tag}
                          </span>
                        </div>

                        <div className="flex-1 flex flex-col justify-between gap-3">
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="font-extrabold text-sm text-[#221B2B] dark:text-[#F3EFF6] group-hover:text-[#EC268F] transition-colors leading-snug">
                                {item.name}
                              </h3>
                              <span className="text-[10px] font-bold text-[#EC268F] bg-[#EC268F]/10 px-2 py-0.5 rounded-full shrink-0">
                                {item.volume}
                              </span>
                            </div>

                            <div className="mt-3 space-y-2">
                              <div className="flex items-start gap-2">
                                <CheckCircle className="w-3.5 h-3.5 text-[#5D3E85] dark:text-[#EC268F] mt-0.5 shrink-0" />
                                <div>
                                  <span className="text-[9px] font-bold text-gray-400 dark:text-[#9B8EA9]  tracking-wider block">Application Technique</span>
                                  <span className="text-xs text-gray-700 dark:text-[#C9BED4] leading-tight">{item.method}</span>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <Heart className="w-3.5 h-3.5 text-[#EC268F] mt-0.5 shrink-0" />
                                <div>
                                  <span className="text-[9px] font-bold text-gray-400 dark:text-[#9B8EA9]  tracking-wider block">Active Ingredients</span>
                                  <span className="text-xs text-[#221B2B] dark:text-[#F3EFF6] font-extrabold leading-tight">{item.ingredients}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <Link
                            to="/shop"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5D3E85] dark:text-[#EC268F] hover:underline self-start pt-1"
                          >
                            <span>Shop this essence</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      {
                        name: 'Organic Herbal Steam Facial',
                        frequency: 'Every 2 Weeks',
                        benefits: 'Opens deep pores, extracts blackheads, and stimulates facial microcirculation.',
                        ideal: 'Oily, combination, and acne-prone skin types',
                        image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=600',
                        tag: 'SPA RITUAL'
                      },
                      {
                        name: 'VIP Hydro-Glow Exfoliation',
                        frequency: 'Monthly Session',
                        benefits: 'Infuses hyaluronic acid and botanical brighteners directly into cellular layers.',
                        ideal: 'Dull, hyperpigmented, or sun-damaged skin',
                        image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=600',
                        tag: 'TREATMENT'
                      }
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="group bg-white dark:bg-[#1E1528] rounded-[28px] border border-[#EADBEE] dark:border-white/10 hover:border-[#5D3E85]/40 p-5 sm:p-6 transition-all duration-300 hover:shadow-xl flex flex-col sm:flex-row gap-5 text-left"
                      >
                        <div className="w-full sm:w-40 h-44 rounded-2xl overflow-hidden bg-gray-50 dark:bg-white/5 shrink-0 relative">
                          <img
                            src={item.image}
                            alt={item.name}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <span className="absolute top-2 left-2 text-[8px] font-extrabold  tracking-wider bg-black/60 backdrop-blur-md text-white px-2 py-0.5 rounded-full border border-white/20">
                            {item.tag}
                          </span>
                        </div>

                        <div className="flex-1 flex flex-col justify-between gap-3">
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="font-extrabold text-sm text-[#221B2B] dark:text-[#F3EFF6] group-hover:text-[#EC268F] transition-colors leading-snug">
                                {item.name}
                              </h3>
                              <span className="text-[10px] font-bold text-[#5D3E85] dark:text-[#EC268F] bg-[#5D3E85]/10 dark:bg-[#EC268F]/20 px-2 py-0.5 rounded-full shrink-0">
                                {item.frequency}
                              </span>
                            </div>

                            <div className="mt-3 space-y-2">
                              <div className="flex items-start gap-2">
                                <Sparkles className="w-3.5 h-3.5 text-[#5D3E85] dark:text-[#EC268F] mt-0.5 shrink-0" />
                                <div>
                                  <span className="text-[9px] font-bold text-gray-400 dark:text-[#9B8EA9]  tracking-wider block">Clinical Benefits</span>
                                  <span className="text-xs text-gray-700 dark:text-[#C9BED4] leading-tight">{item.benefits}</span>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                                <div>
                                  <span className="text-[9px] font-bold text-gray-400 dark:text-[#9B8EA9]  tracking-wider block">Recommended For</span>
                                  <span className="text-xs text-[#221B2B] dark:text-[#F3EFF6] font-extrabold leading-tight">{item.ideal}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <Link
                            to="/contact"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5D3E85] dark:text-[#EC268F] hover:underline self-start pt-1"
                          >
                            <span>Book Session at SHOP</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. PRODUCT STORAGE & PURITY PRESERVATION (3-CARD GRID) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-[#1E1528] rounded-[28px] p-6 border border-[#EADBEE] dark:border-white/10 flex flex-col gap-3 shadow-xs hover:shadow-lg transition-all duration-300 group">
                  <div className="w-10 h-10 rounded-2xl bg-[#5D3E85]/10 dark:bg-[#EC268F]/20 text-[#5D3E85] dark:text-[#EC268F] flex items-center justify-center font-bold text-lg group-hover:scale-110 transition-transform">
                    🌡️
                  </div>
                  <h3 className="font-extrabold text-[#221B2B] dark:text-[#F3EFF6] text-sm">
                    Temperature & Lighting
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-[#C9BED4] leading-relaxed">
                    Always store your organic creams and cold-pressed oils in a cool, dry area away from direct sunlight and humidity.
                  </p>
                </div>

                <div className="bg-white dark:bg-[#1E1528] rounded-[28px] p-6 border border-[#EADBEE] dark:border-white/10 flex flex-col gap-3 shadow-xs hover:shadow-lg transition-all duration-300 group">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-lg group-hover:scale-110 transition-transform">
                    🔒
                  </div>
                  <h3 className="font-extrabold text-[#221B2B] dark:text-[#F3EFF6] text-sm">
                    Airtight Botanical Purity
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-[#C9BED4] leading-relaxed">
                    Tightly reseal jars and pump dispensers after every use to prevent active botanical compounds from oxidizing in open air.
                  </p>
                </div>

                <div className="bg-white dark:bg-[#1E1528] rounded-[28px] p-6 border border-[#EADBEE] dark:border-white/10 flex flex-col gap-3 shadow-xs hover:shadow-lg transition-all duration-300 group">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-lg group-hover:scale-110 transition-transform">
                    ✨
                  </div>
                  <h3 className="font-extrabold text-[#221B2B] dark:text-[#F3EFF6] text-sm">
                    24-Hour Patch Testing
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-[#C9BED4] leading-relaxed">
                    Before beginning any new brightening formula, apply a pea-sized amount on your inner wrist to ensure skin compatibility.
                  </p>
                </div>
              </div>

              {/* 4. DYNAMIC ADMIN-CONFIGURED BEAUTY TIPS & GUIDES */}
              {articlesList.length > 0 && (
                <div className="flex flex-col gap-6 pt-4 border-t border-[#EADBEE] dark:border-white/10">
                  <div className="flex flex-col gap-2">
                    <span className="inline-flex items-center px-3.5 py-1 rounded-full bg-white dark:bg-[#1E1528] text-[#5D3E85] dark:text-[#EC268F] text-[10px] sm:text-[11px] font-extrabold tracking-widest uppercase border border-[#EADBEE] dark:border-white/10 shadow-xs self-start">
                      Expert Editorial & Guides
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-[#221B2B] dark:text-[#F3EFF6] tracking-tight">
                      All Published Beauty Tips & Rituals
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-[#9B8EA9]">
                      Browse our full library of skincare protocols and product application insights.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {articlesList.map((article) => {
                      const image = article.cover_image_url || article.image_path || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800';
                      const catName = article.category?.name || 'Beauty Guide';
                      const cleanText = article.meta_description || (article.content ? article.content.replace(/<[^>]*>?/gm, '').trim().slice(0, 120) + '...' : '');

                      return (
                        <div
                          key={article.id}
                          className="bg-white dark:bg-[#1E1528] rounded-[28px] border border-[#EADBEE] dark:border-white/10 overflow-hidden shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col group text-left"
                        >
                          <div className="h-48 w-full relative overflow-hidden bg-gray-100 dark:bg-white/5">
                            <img
                              src={image}
                              alt={article.title}
                              loading="lazy"
                              decoding="async"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                            <span className="absolute top-3 left-3 bg-black/50 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full text-[10px] font-extrabold text-white">
                              {catName}
                            </span>
                          </div>

                          <div className="p-5 flex flex-col justify-between flex-1 gap-4">
                            <div className="flex flex-col gap-2">
                              <h3 className="font-extrabold text-base text-[#221B2B] dark:text-[#F3EFF6] group-hover:text-[#EC268F] transition-colors leading-snug line-clamp-2">
                                {article.title}
                              </h3>
                              {cleanText && (
                                <p className="text-xs text-gray-500 dark:text-[#C9BED4] line-clamp-2 leading-relaxed">
                                  {cleanText}
                                </p>
                              )}
                            </div>

                            <Link
                              to={`/blog/${article.slug}`}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5D3E85] dark:text-[#EC268F] hover:underline self-start pt-1"
                            >
                              <span>Read Complete Protocol</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) :

            /* ==========================================
                C. ACCORDION REPEATER FAQs PAGE
               ========================================== */
            slug === 'faq' ? (
              <div className="flex flex-col gap-6 mt-2 text-left">
                {/* FAQ Search Bar */}
                <div className="flex items-center relative">
                  <input
                    type="text"
                    placeholder="Search frequently asked questions..."
                    value={faqSearch}
                    onChange={(e) => setFaqSearch(e.target.value)}
                    className="pl-11 pr-4 py-3 text-xs rounded-full border border-gray-200 dark:border-white/15 focus:outline-none focus:border-[#5D3E85] w-full bg-white dark:bg-[#1E1528] text-[#221B2B] dark:text-[#F3EFF6] transition-all shadow-sm"
                  />
                  <Search className="w-4 h-4 text-gray-400 dark:text-[#9B8EA9] absolute left-4" />
                </div>

                {/* Accordion repeater list */}
                {filteredFaqs.length === 0 ? (
                  <div className="text-center py-12 bg-white dark:bg-[#1E1528] rounded-3xl border border-[#EADBEE] dark:border-white/10">
                    <span className="text-2xl">💡</span>
                    <p className="text-xs font-semibold text-[#221B2B] dark:text-[#F3EFF6] mt-2">No matching questions found</p>
                    <p className="text-[11px] text-gray-400 dark:text-[#9B8EA9] mt-0.5">Try searching with a different keyword.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {filteredFaqs.map((item) => {
                      const isOpen = openFaqId === item.id;
                      return (
                        <div
                          key={item.id}
                          className={`bg-white dark:bg-[#1E1528] border rounded-3xl overflow-hidden transition-all duration-300 ${isOpen ? 'border-[#5D3E85] dark:border-[#EC268F] shadow-md' : 'border-[#EADBEE] dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 shadow-sm'
                            }`}
                        >
                          {/* Header trigger */}
                          <button
                            onClick={() => setOpenFaqId(isOpen ? null : item.id)}
                            className="w-full text-left p-5 md:p-6 flex items-center justify-between gap-4 cursor-pointer"
                          >
                            <h4 className="font-extrabold text-[#221B2B] dark:text-[#F3EFF6] text-xs md:text-sm select-none leading-snug">
                              {item.question}
                            </h4>
                            <div className="p-1 rounded-lg text-gray-400 dark:text-[#9B8EA9] transition-colors shrink-0">
                              {isOpen ? <ChevronUp className="w-4 h-4 text-[#5D3E85] dark:text-[#EC268F]" /> : <ChevronDown className="w-4 h-4" />}
                            </div>
                          </button>

                          {/* Expandable answer panel */}
                          <div
                            className={`transition-all duration-300 overflow-hidden ${isOpen ? 'max-h-[800px] border-t border-gray-100 dark:border-white/10' : 'max-h-0'
                              }`}
                          >
                            <div
                              className="p-6 text-xs md:text-sm text-gray-600 dark:text-[#C9BED4] leading-relaxed font-sans prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{ __html: item.answer }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* Luxury HTML Content Card renderer for policy & CMS pages */
              <div className="flex flex-col gap-6 animate-fade-in text-left">
                {/* Policy Header Card */}
                <div className="bg-[#17101F] rounded-3xl p-6 sm:p-10 text-white relative overflow-hidden shadow-2xl border border-white/10 text-left">
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#5D3E85]/40 via-transparent to-[#EC268F]/20 pointer-events-none" />
                  <div className="relative z-10 flex flex-col items-start gap-3">
                    <span className="text-[10px] font-extrabold  tracking-widest text-[#EC268F] bg-white/10 backdrop-blur-md border border-white/20 px-3.5 py-1 rounded-full flex items-center gap-1.5 shadow-inner">
                      {slug === 'privacy-policy' ? '🔒 Data Protection & Security' : slug === 'terms-conditions' ? '📜 Official Terms of Service' : slug === 'shipping-delivery' ? '🚚 Shipping & Delivery' : '🛡️ SHOP Policy'}
                    </span>
                    <h1 className="font-extrabold text-2xl sm:text-4xl text-white tracking-tight leading-tight">
                      {page?.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-3 md:gap-4 text-[11px] text-white/70 mt-1 pt-3 border-t border-white/10 w-full font-medium">
                      <span>✨ Official Dansolam Policy</span>
                      <span>•</span>
                      <span>Verified 100% Organic & Secure Standard</span>
                      <span>•</span>
                      <span>SHOP Care Center</span>
                    </div>
                  </div>
                </div>

                {/* Main Content Glassmorphism Card */}
                <div className="bg-white dark:bg-[#1E1528] rounded-3xl border border-[#EADBEE] dark:border-white/10 p-6 sm:p-10 md:p-12 shadow-sm relative overflow-hidden text-left text-[#221B2B] dark:text-[#F3EFF6]">
                  {/* Top Gradient accent border line */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#5D3E85] via-[#EC268F] to-[#5D3E85]" />

                  <div
                    className="policy-prose-content prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-[#C9BED4] leading-relaxed font-sans"
                    dangerouslySetInnerHTML={{ __html: page?.content || '' }}
                  />

                  {/* AGENT Support Banner at Bottom */}
                  <div className="mt-12 pt-8 border-t border-gray-100 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6 bg-[#FAF7FC] dark:bg-white/5 p-6 sm:p-8 rounded-3xl border border-[#5D3E85]/15 dark:border-white/10">
                    <div className="flex items-center gap-4 text-left">
                      <div className="w-12 h-12 rounded-2xl bg-[#5D3E85] text-white flex items-center justify-center shrink-0 shadow-md">
                        <ShieldCheck className="w-6 h-6 text-[#EC268F]" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-[#221B2B] dark:text-[#F3EFF6] text-sm sm:text-base">
                          Have questions regarding our policies or skincare routines?
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-[#9B8EA9] mt-0.5">
                          Our customer care agent is available on WhatsApp for guidance.
                        </p>
                      </div>
                    </div>
                    <a
                      href="https://wa.me/2348000000000?text=Hello%20Dansolam%20AGENT,%20I%20have%20a%20question%20regarding%20your%20policies."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md transition-all flex items-center gap-2 shrink-0 cursor-pointer btn-spring"
                    >
                      <MessageCircle className="w-4 h-4 fill-white text-white" />
                      <span>CHAT US</span>
                    </a>
                  </div>
                </div>
              </div>
            )}
      </div>
    </div>
  );
}
