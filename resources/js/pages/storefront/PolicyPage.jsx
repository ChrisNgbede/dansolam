import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Search, ChevronDown, ChevronUp, Ruler, Heart, HelpCircle, CheckCircle, Info, ShieldCheck, MessageCircle, Sparkles, Sun, Moon, Droplets, Shield, ArrowRight, Zap, Flame, Eye, Star } from 'lucide-react';
import FaqSection from '../../components/storefront/FaqSection';
import About from './About';
import { cmsPageQuery } from '../../utils/pageQueries';
import { getAdminToken } from '../../components/auth/RequireAdminAuth';

export default function PolicyPage() {
  const { slug } = useParams();
  const [faqSearch, setFaqSearch] = useState('');
  const [openFaqId, setOpenFaqId] = useState(null);


  // Fetch page content
  const { data: pageRes, isLoading, isError, refetch } = useQuery(cmsPageQuery(slug));

  // Fetch FAQ items (only query if slug is faq)
  const { data: faqsRes, isLoading: isFaqsLoading } = useQuery({
    queryKey: ['faqs-list'],
    queryFn: () => fetch('/api/faqs').then(res => res.json()),
    enabled: slug === 'faq'
  });

  const page = pageRes?.data;
  const faqs = faqsRes?.data || [];

  // Fetch settings for dynamic ecommerce details (CEO)
  const { data: settingsRes } = useQuery({
    queryKey: ['settings-storefront'],
    queryFn: () => fetch('/api/settings').then(res => res.json())
  });
  const settings = settingsRes?.data?.settings || {};

  const isAboutPage = slug === 'about-us' || slug === 'about';
  const isFaqPage = slug === 'faq';

  if (isLoading || (isFaqPage && isFaqsLoading)) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 animate-pulse flex flex-col gap-6">
        <div className="bg-gray-100 dark:bg-white/10 h-6 rounded w-1/4" />
        <div className="bg-gray-100 dark:bg-white/10 h-10 rounded w-3/4" />
        <div className="bg-gray-100 dark:bg-white/10 h-40 rounded w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-md mx-auto text-center py-24 px-6 flex flex-col items-center gap-4">
        <Info className="w-9 h-9 text-[#EC268F]" aria-hidden="true" />
        <h2 className="font-serif font-bold text-gray-800 dark:text-white text-lg">We couldn't load this page</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">Please check your connection and try again.</p>
        <button type="button" onClick={() => refetch()} className="px-6 py-3 bg-[#5D3E85] hover:bg-[#EC268F] text-white text-xs font-extrabold rounded-full shadow-md transition-all">
          Try Again
        </button>
      </div>
    );
  }

  if (!page && !isAboutPage) {
    return (
      <div className="max-w-md mx-auto text-center py-24 px-6 flex flex-col items-center gap-4">
        <span className="text-4xl">📄</span>
        <h2 className="font-serif font-bold text-gray-800 dark:text-white text-base">Page Not Found</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">The page you are trying to view does not exist or has been removed.</p>
        <Link to="/" className="px-6 py-3 bg-[#5D3E85] hover:bg-[#EC268F] text-white text-xs font-extrabold rounded-full shadow-md transition-all">
          Return Home
        </Link>
      </div>
    );
  }

  const isAdmin = !!getAdminToken();

  // Filter FAQs based on query
  const filteredFaqs = faqs.filter(item => {
    const q = faqSearch.toLowerCase();
    return item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q);
  });

  const isWidePage = isAboutPage;

  return (
    <div className="bg-white dark:bg-[#17101F] min-h-screen font-sans pb-4 transition-colors duration-300 w-full">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-5 lg:px-6 pt-20 sm:pt-22 md:pt-24 pb-8 flex flex-col gap-6">
        {/* ==========================================
          A. CUSTOM STYLED ABOUT-US PAGE
         ========================================== */}
        {isAboutPage ? (
          <About page={page} settings={settings} isAdmin={isAdmin} />
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
                      href={`https://wa.me/${String(settings.whatsapp_number || '+234 800 000 0000').replace(/[^0-9]/g, '')}?text=Hello%20Dansolam%20AGENT,%20I%20have%20a%20question%20regarding%20your%20policies.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md transition-all flex items-center gap-2 shrink-0 cursor-pointer btn-spring"
                    >
                      <MessageCircle className="w-4 h-4 fill-white text-white" />
                      <span>Chat Us</span>
                    </a>
                  </div>
                </div>
              </div>
            )}
      </div>
    </div>
  );
}
