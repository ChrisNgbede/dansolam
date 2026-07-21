import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Search, ChevronDown, ChevronUp, Ruler, Sparkles, Heart, HelpCircle, CheckCircle, Info } from 'lucide-react';
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

  const page = pageRes?.data;
  const faqs = faqsRes?.data || [];

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

  if (!page) {
    return (
      <div className="max-w-md mx-auto text-center py-24 px-6 flex flex-col items-center gap-4">
        <span className="text-4xl">📄</span>
        <h2 className="font-serif font-bold text-gray-800 text-base">Page Not Found</h2>
        <p className="text-xs text-gray-500">The page you are trying to view does not exist or has been removed.</p>
        <Link to="/" className="px-5 py-2.5 bg-primary text-white text-xs font-semibold rounded-lg shadow-sm">
          Return Home
        </Link>
      </div>
    );
  }

  const isAdmin = !!localStorage.getItem('fairqueen_admin_token');

  // Filter FAQs based on query
  const filteredFaqs = faqs.filter(item => {
    const q = faqSearch.toLowerCase();
    return item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q);
  });

  const isWidePage = slug === 'about-us' || slug === 'size-guide';

  return (
    <div className={`mx-auto px-6 py-12 flex flex-col gap-6 transition-all duration-300 ${
      isWidePage ? 'max-w-5xl' : 'max-w-2xl'
    }`}>
      {/* Header breadcrumb & Edit link */}
      <div className="flex justify-between items-center w-full">
        <Link
          to="/"
          className="group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#1a1a1a] border border-gray-200/80 dark:border-gray-800 text-xs font-bold text-gray-700 dark:text-gray-200 hover:text-gray-950 dark:hover:text-gray-950 hover:bg-yellow-400 dark:hover:bg-yellow-400 hover:border-yellow-400 dark:hover:border-yellow-400 shadow-3xs hover:shadow-xs transition-all duration-300 shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-950 group-hover:-translate-x-0.5 transition-all duration-300" />
          <span>Back to Home</span>
        </Link>
        {isAdmin && (
          <a
            href="/admin/pages"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-lg border border-indigo-100 transition-all flex items-center gap-1 shadow-sm"
          >
            Edit in CMS ⚙️
          </a>
        )}
      </div>

      {/* ==========================================
          A. CUSTOM STYLED ABOUT-US PAGE
         ========================================== */}
      {slug === 'about-us' ? (
        <div className="flex flex-col gap-8 animate-fade-in">
          {/* Hero Banner */}
          <div className="h-[320px] md:h-[420px] rounded-3xl overflow-hidden bg-gray-55 relative shadow-sm">
            <img loading="eager" decoding="async" fetchPriority="high"
              src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200" 
              className="w-full h-full object-cover" 
              alt="Dansolam Cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent flex flex-col justify-end p-6 md:p-12">
              <span className="text-[10px] font-extrabold text-gray-950 bg-amber-400 backdrop-blur-md px-3.5 py-1 rounded-full uppercase tracking-widest self-start mb-3 border border-amber-300 shadow-md">
                Who We Are
              </span>
              <h1 className="font-serif font-bold text-2xl md:text-4.5xl text-white leading-tight">
                {page.title}
              </h1>
              <p className="text-xs md:text-sm text-gray-200 mt-2 max-w-xl font-sans leading-relaxed">
                Abuja’s luxury fashion house dedicated to curating wrap jumpsuits, custom tailored gowns, bespoke footwear, and luxury handbags.
              </p>
            </div>
          </div>

          {/* Two Column Brand Content */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-start">
            <div className="md:col-span-3 flex flex-col gap-4 text-xs md:text-sm text-gray-650 leading-relaxed font-sans">
              <h2 className="font-serif font-bold text-gray-900 text-lg md:text-xl border-b border-primary/5 pb-2">
                Our Heritage & Vision
              </h2>
              <p>
                Welcome to <strong>Dansolam</strong>. Dansolam is a luxury skincare and wellness brand inspired by the purity of soft beach sand and a refreshing sea breeze. Every product is crafted with 100% organic ingredients to nourish, hydrate, and reveal your skin's natural glow — because looking good is our pride.
              </p>
              <p>
                We source the finest silk, satin, stretch crepe, and leather catalogs to design wardrobe staples that effortlessly transition from corporate elegance to high-society evening events. Our signature collection features structured wrap jumpsuits, form-fitting corporate sets, bridal lookbooks, and hand-stitched corporate slides.
              </p>
              
              <div className="bg-primary/5 rounded-2xl p-6 flex gap-4 mt-2 border-0">
                <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-serif font-bold text-gray-800 text-xs">The Bespoke Alteration Guarantee</h4>
                  <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                    Every piece purchased from our Abuja showroom can be adjusted by our on-site master tailors to match your exact bust, waist, hips, and length specifications free of charge.
                  </p>
                </div>
              </div>
            </div>

            {/* Core Values Cards */}
            <div className="md:col-span-2 flex flex-col gap-4 bg-gray-50/30 p-6 rounded-2xl shadow-3xs">
              <h3 className="font-serif font-bold text-gray-800 text-sm border-b border-gray-200/60 pb-2">
                Core Pillars
              </h3>
              
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-primary flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> 1. COUTURE QUALITY
                </span>
                <p className="text-[11px] text-gray-500 leading-normal pl-4.5">
                  We use verified high-grade fabrics that look premium, drape elegantly, and stand the test of time.
                </p>
              </div>

              <div className="flex flex-col gap-1.5 mt-2">
                <span className="text-[10px] font-bold text-primary flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> 2. INCLUSIVE METRICS
                </span>
                <p className="text-[11px] text-gray-500 leading-normal pl-4.5">
                  Our ready-to-wear lines cover UK sizes 8 to 22. Sizing is structured to represent realistic proportions.
                </p>
              </div>

              <div className="flex flex-col gap-1.5 mt-2">
                <span className="text-[10px] font-bold text-primary flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> 3. ECO-FRIENDLY CRADLE
                </span>
                <p className="text-[11px] text-gray-500 leading-normal pl-4.5">
                  We prevent material waste by converting leftover luxury textiles into matches for matching slides and headbands.
                </p>
              </div>
            </div>
          </div>

          {/* Meet the CEO Section */}
          {settings.ceo_name && (
            <div className="bg-white rounded-3xl p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8 items-center text-left mt-4 shadow-xs">
              {settings.ceo_image_url && (
                <div className="w-40 h-48 md:w-48 md:h-56 rounded-2xl overflow-hidden bg-gray-50 shrink-0 shadow-xs">
                  <img loading="lazy" decoding="async"
                    src={settings.ceo_image_url}
                    alt={settings.ceo_name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1 flex flex-col gap-2">
                <span className="text-[9px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full uppercase tracking-wider self-start">
                  Leadership
                </span>
                <h3 className="font-serif font-bold text-gray-900 text-lg md:text-xl leading-none">
                  Meet the CEO: {settings.ceo_name}
                </h3>
                <div
                  className="text-xs md:text-sm text-gray-550 leading-relaxed font-sans prose prose-sm max-w-none mt-2"
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
          B. CUSTOM STYLED SIZE-GUIDE PAGE
         ========================================== */
      slug === 'size-guide' ? (
        <div className="flex flex-col gap-8 animate-fade-in pb-16">
          <div className="storefront-page-hero bg-gradient-to-br from-[#FAF3E8]/40 to-white rounded-3xl p-8 border-b border-gray-100/50 mb-2">
            <h1 className="font-serif font-bold text-2xl md:text-3.5xl text-gray-900 leading-tight">
              {page.title}
            </h1>
            <p className="text-xs text-gray-500 mt-2 max-w-lg leading-relaxed">
              Find your perfect fit. Our ready-to-wear lines follow standard UK metrics, while our bespoke footwear collections follow European sizing charts.
            </p>
          </div>

          {/* Size Tab Selectors */}
          <div className="flex border-b border-gray-100 max-w-xs">
            <button
              onClick={() => setSizeTab('dresses')}
              className={`px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all border-b-2 -mb-[2px] cursor-pointer flex items-center gap-1.5 ${
                sizeTab === 'dresses'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-400 hover:text-gray-650'
              }`}
            >
              👗 Dresses & Jumpsuits
            </button>
            <button
              onClick={() => setSizeTab('shoes')}
              className={`px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all border-b-2 -mb-[2px] cursor-pointer flex items-center gap-1.5 ${
                sizeTab === 'shoes'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-400 hover:text-gray-650'
              }`}
            >
              👠 Shoes & Heels
            </button>
          </div>

          {/* Sizing Tables */}
          {sizeTab === 'dresses' ? (
            <div className="flex flex-col gap-6">
              <div className="overflow-x-auto rounded-3xl bg-white shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#FAF9F6] border-b border-gray-100 text-[10px] text-gray-500 uppercase tracking-wider font-bold">
                      <th className="p-3.5 md:p-4">UK Size</th>
                      <th className="p-3.5 md:p-4">US Size</th>
                      <th className="p-3.5 md:p-4">EU Size</th>
                      <th className="p-3.5 md:p-4">Bust (in)</th>
                      <th className="p-3.5 md:p-4">Waist (in)</th>
                      <th className="p-3.5 md:p-4">Hips (in)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    <tr className="hover:bg-gray-50/50">
                      <td className="p-3.5 md:p-4 font-semibold text-gray-900">UK 8</td>
                      <td className="p-3.5 md:p-4">US 4</td>
                      <td className="p-3.5 md:p-4">EU 36</td>
                      <td className="p-3.5 md:p-4">32"</td>
                      <td className="p-3.5 md:p-4">25"</td>
                      <td className="p-3.5 md:p-4">35"</td>
                    </tr>
                    <tr className="hover:bg-gray-50/50 bg-gray-50/10">
                      <td className="p-3.5 md:p-4 font-semibold text-gray-900">UK 10</td>
                      <td className="p-3.5 md:p-4">US 6</td>
                      <td className="p-3.5 md:p-4">EU 38</td>
                      <td className="p-3.5 md:p-4">34"</td>
                      <td className="p-3.5 md:p-4">27"</td>
                      <td className="p-3.5 md:p-4">37"</td>
                    </tr>
                    <tr className="hover:bg-gray-50/50">
                      <td className="p-3.5 md:p-4 font-semibold text-gray-900">UK 12</td>
                      <td className="p-3.5 md:p-4">US 8</td>
                      <td className="p-3.5 md:p-4">EU 40</td>
                      <td className="p-3.5 md:p-4">36"</td>
                      <td className="p-3.5 md:p-4">29"</td>
                      <td className="p-3.5 md:p-4">39"</td>
                    </tr>
                    <tr className="hover:bg-gray-50/50 bg-gray-50/10">
                      <td className="p-3.5 md:p-4 font-semibold text-gray-900">UK 14</td>
                      <td className="p-3.5 md:p-4">US 10</td>
                      <td className="p-3.5 md:p-4">EU 42</td>
                      <td className="p-3.5 md:p-4">38"</td>
                      <td className="p-3.5 md:p-4">31"</td>
                      <td className="p-3.5 md:p-4">41"</td>
                    </tr>
                    <tr className="hover:bg-gray-50/50">
                      <td className="p-3.5 md:p-4 font-semibold text-gray-900">UK 16</td>
                      <td className="p-3.5 md:p-4">US 12</td>
                      <td className="p-3.5 md:p-4">EU 44</td>
                      <td className="p-3.5 md:p-4">40"</td>
                      <td className="p-3.5 md:p-4">33"</td>
                      <td className="p-3.5 md:p-4">43"</td>
                    </tr>
                    <tr className="hover:bg-gray-50/50 bg-gray-50/10">
                      <td className="p-3.5 md:p-4 font-semibold text-gray-900">UK 18</td>
                      <td className="p-3.5 md:p-4">US 14</td>
                      <td className="p-3.5 md:p-4">EU 46</td>
                      <td className="p-3.5 md:p-4">42"</td>
                      <td className="p-3.5 md:p-4">35"</td>
                      <td className="p-3.5 md:p-4">45"</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="overflow-x-auto rounded-3xl bg-white shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#FAF9F6] border-b border-gray-100 text-[10px] text-gray-500 uppercase tracking-wider font-bold">
                      <th className="p-3.5 md:p-4">EU Shoe Size</th>
                      <th className="p-3.5 md:p-4">UK Size</th>
                      <th className="p-3.5 md:p-4">US Size</th>
                      <th className="p-3.5 md:p-4">Foot Length (cm)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    <tr className="hover:bg-gray-50/50">
                      <td className="p-3.5 md:p-4 font-semibold text-gray-900">EU 37</td>
                      <td className="p-3.5 md:p-4">UK 4</td>
                      <td className="p-3.5 md:p-4">US 6</td>
                      <td className="p-3.5 md:p-4">23.5 cm</td>
                    </tr>
                    <tr className="hover:bg-gray-50/50 bg-gray-50/10">
                      <td className="p-3.5 md:p-4 font-semibold text-gray-900">EU 38</td>
                      <td className="p-3.5 md:p-4">UK 5</td>
                      <td className="p-3.5 md:p-4">US 7</td>
                      <td className="p-3.5 md:p-4">24.0 cm</td>
                    </tr>
                    <tr className="hover:bg-gray-50/50">
                      <td className="p-3.5 md:p-4 font-semibold text-gray-900">EU 39</td>
                      <td className="p-3.5 md:p-4">UK 6</td>
                      <td className="p-3.5 md:p-4">US 8</td>
                      <td className="p-3.5 md:p-4">24.5 cm</td>
                    </tr>
                    <tr className="hover:bg-gray-50/50 bg-gray-50/10">
                      <td className="p-3.5 md:p-4 font-semibold text-gray-900">EU 40</td>
                      <td className="p-3.5 md:p-4">UK 7</td>
                      <td className="p-3.5 md:p-4">US 9</td>
                      <td className="p-3.5 md:p-4">25.0 cm</td>
                    </tr>
                    <tr className="hover:bg-gray-50/50">
                      <td className="p-3.5 md:p-4 font-semibold text-gray-900">EU 41</td>
                      <td className="p-3.5 md:p-4">UK 8</td>
                      <td className="p-3.5 md:p-4">US 10</td>
                      <td className="p-3.5 md:p-4">25.5 cm</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sizing guides */}
          <div className="bg-[#FAF3E8]/30 rounded-3xl p-8 grid grid-cols-1 md:grid-cols-2 gap-8 mt-2">
            <div className="flex flex-col gap-3">
              <h3 className="font-serif font-bold text-gray-900 text-xs md:text-sm flex items-center gap-1.5">
                <Ruler className="w-4 h-4 text-primary" /> How to Measure (Garments)
              </h3>
              <ul className="text-xs text-gray-500 flex flex-col gap-2 list-disc pl-4 leading-relaxed font-sans">
                <li><strong>Bust:</strong> Measure around the fullest part of your chest, keeping the tape horizontal.</li>
                <li><strong>Waist:</strong> Measure around the narrowest part of your waistline (typically where your body bends side to side).</li>
                <li><strong>Hips:</strong> Measure around the fullest part of your seat, keeping feet flat together.</li>
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              <h3 className="font-serif font-bold text-gray-900 text-xs md:text-sm flex items-center gap-1.5">
                <Info className="w-4 h-4 text-primary" /> Sizing Tips
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed font-sans">
                If your measurements fall between two sizes on the table, we highly recommend choosing the larger size for a relaxed drape.
              </p>
              <p className="text-xs text-gray-500 leading-relaxed font-sans">
                For custom tailored wrap jumpsuits, please reach out to our Abuja showroom or specify details during order checkout notes.
              </p>
            </div>
          </div>
        </div>
      ) :

      /* ==========================================
          C. ACCORDION REPEATER FAQs PAGE
         ========================================== */
      slug === 'faq' ? (
        <div className="flex flex-col gap-6 mt-2">
          {/* FAQ Search Bar */}
          <div className="flex items-center relative">
            <input
              type="text"
              placeholder="Search frequently asked questions..."
              value={faqSearch}
              onChange={(e) => setFaqSearch(e.target.value)}
              className="pl-11 pr-4 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-primary w-full bg-white transition-all shadow-sm"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5" />
          </div>

          {/* Accordion repeater list */}
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-12 bg-gray-50/50 rounded-2xl border border-gray-100">
              <span className="text-2xl">💡</span>
              <p className="text-xs font-semibold text-gray-600 mt-2">No matching questions found</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Try searching with a different keyword.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredFaqs.map((item) => {
                const isOpen = openFaqId === item.id;
                return (
                  <div
                    key={item.id}
                    className={`bg-white border rounded-2xl overflow-hidden transition-all duration-300 ${
                      isOpen ? 'border-primary shadow-md ring-1 ring-primary/5' : 'border-gray-150 hover:border-gray-250 shadow-sm'
                    }`}
                  >
                    {/* Header trigger */}
                    <button
                      onClick={() => setOpenFaqId(isOpen ? null : item.id)}
                      className="w-full text-left p-4 md:p-5 flex items-center justify-between gap-4 cursor-pointer"
                    >
                      <h4 className="font-bold text-gray-800 text-xs md:text-sm select-none leading-snug">
                        {item.question}
                      </h4>
                      <div className={`p-1 hover:bg-gray-50 rounded-lg text-gray-400 transition-colors shrink-0`}>
                        {isOpen ? <ChevronUp className="w-4 h-4 text-primary" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </button>

                    {/* Expandable answer panel */}
                    <div
                      className={`transition-all duration-300 overflow-hidden ${
                        isOpen ? 'max-h-[800px] border-t border-gray-50' : 'max-h-0'
                      }`}
                    >
                      <div
                        className="p-5 text-xs md:text-sm text-gray-650 leading-relaxed font-sans prose prose-sm max-w-none"
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
        /* Default HTML Content renderer for other policy pages */
        <div
          className="prose prose-sm text-gray-600 leading-relaxed font-sans mt-2"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      )}
    </div>
  );
}
