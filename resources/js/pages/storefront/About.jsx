import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Smartphone, ShieldCheck, Gift, Leaf } from 'lucide-react';
import FaqSection from '../../components/storefront/FaqSection';
import SEO from '../../components/seo/SEO';

const HIGHLIGHT_ICONS = [Smartphone, ShieldCheck, Gift, Leaf];

/**
 * About page. Every piece of copy and imagery comes from the CMS page record
 * (Admin → Pages → About Us); CEO details come from Admin → Settings.
 */
export default function About({ page, settings, isAdmin }) {
  const sections = page?.sections || {};
  const features = (sections.features || []).filter(Boolean);
  const highlights = (sections.highlights || []).filter((h) => h?.title);

  return (
    <div className="flex flex-col gap-10 md:gap-14 text-left">
      <SEO title={page?.meta_title?.replace(/\s*\|\s*Dansolam$/i, '') || page?.title || 'About Us'} description={page?.meta_description || page?.subtitle} />

      {/* Hero */}
      <section className="relative overflow-hidden rounded-[28px] sm:rounded-[36px] bg-gradient-to-br from-[#5D3E85] via-[#4A2B68] to-[#2A1740] text-white min-h-[220px] sm:min-h-[260px] flex">
        {page?.hero_image_url && (
          <>
            <img src={page.hero_image_url} alt="" fetchPriority="high" decoding="async" width="1400" height="400" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/20" />
          </>
        )}
        <div aria-hidden="true" className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-[#EC268F]/25 blur-3xl animate-pulse-glow" />
        <div className="relative z-10 flex flex-col justify-between gap-6 w-full p-5 sm:p-7 md:p-10">
          <div className="flex justify-between items-center">
            <Link to="/" className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-[11px] font-bold transition-colors btn-spring">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
            </Link>
            {isAdmin && (
              <a href="/admin/pages" className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-[10px] font-bold transition-colors">
                Edit in CMS
              </a>
            )}
          </div>
          <div className="max-w-2xl">
            {sections.eyebrow && (
              <span className="inline-block text-[10px] font-extrabold tracking-widest  text-[#E5C158] mb-2">{sections.eyebrow}</span>
            )}
            <h1 className="font-serif font-bold text-2xl sm:text-3xl md:text-4xl lg:text-5xl leading-tight">{page?.title || 'About Us'}</h1>
            {page?.subtitle && <p className="text-xs sm:text-sm md:text-base text-white/80 mt-3 leading-relaxed">{page.subtitle}</p>}
          </div>
        </div>
      </section>

      {/* Story — copy card beside the product image */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
        <article
          className={`${sections.image_url ? 'lg:col-span-7' : 'lg:col-span-12'} relative overflow-hidden rounded-[28px] bg-white dark:bg-[#1E1528] border border-[#EADBEE] dark:border-white/10 shadow-sm p-6 sm:p-8 md:p-10 flex flex-col gap-5`}
        >
          <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#5D3E85] via-[#EC268F] to-[#E5C158]" />
          <div className="flex items-center gap-3">
            <span className="grid place-items-center w-10 h-10 rounded-2xl bg-gradient-to-br from-[#5D3E85] to-[#EC268F] text-white shadow-md">
              <Leaf className="w-5 h-5" />
            </span>
            <div>
              <span className="block text-[11px] font-extrabold tracking-widest  text-[#5D3E85] dark:text-[#EC268F]">Our story</span>
              <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#221B2B] dark:text-[#F3EFF6] leading-tight">Why Dansolam</h2>
            </div>
          </div>
          <div
            className="prose prose-sm md:prose-base max-w-none text-gray-600 dark:text-[#C9BED4] leading-relaxed prose-p:my-0 [&>p+p]:mt-4 prose-strong:text-[#221B2B] dark:prose-strong:text-white"
            dangerouslySetInnerHTML={{ __html: page?.content || '' }}
          />
        </article>

        {sections.image_url && (
          <div className="lg:col-span-5 relative rounded-[28px] overflow-hidden bg-gradient-to-br from-[#F6EEF7] to-[#EADBEE] dark:from-[#231B30] dark:to-[#17101F] border border-[#EADBEE] dark:border-white/10 shadow-sm min-h-[320px] grid place-items-center p-8 group">
            <div aria-hidden="true" className="absolute w-3/4 aspect-square rounded-full bg-gradient-to-br from-[#EC268F]/25 to-[#E5C158]/30 blur-3xl" />
            <img
              src={sections.image_url}
              alt={page?.title || 'Dansolam'}
              loading="lazy"
              decoding="async"
              width="500"
              height="500"
              className="relative w-full max-w-sm aspect-square object-contain rounded-3xl transition-transform duration-700 ease-out group-hover:scale-105 group-hover:-rotate-1"
            />
          </div>
        )}
      </section>

      {/* Product features */}
      {features.length > 0 && (
        <section className="flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <h2 className="font-serif font-bold text-xl sm:text-2xl md:text-3xl text-[#221B2B] dark:text-[#F3EFF6]">
              {sections.features_heading || 'Features of our products'}
            </h2>
            <Link to="/shop" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5D3E85] dark:text-[#EC268F] hover:gap-2.5 transition-all">
              Shop the range <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <ul className="reveal-group grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {features.map((feature) => (
              <li key={feature} className="flex items-center gap-3 rounded-2xl bg-white dark:bg-[#1E1528] border border-[#EADBEE] dark:border-white/10 px-4 py-3.5 text-sm font-semibold text-[#221B2B] dark:text-[#F3EFF6] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-[#EC268F]/40">
                <span className="grid place-items-center w-7 h-7 rounded-full bg-[#5D3E85]/10 dark:bg-white/10 text-[#5D3E85] dark:text-[#EC268F] shrink-0">
                  <Check className="w-4 h-4" />
                </span>
                {feature}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Shopping highlights */}
      {highlights.length > 0 && (
        <section className="rounded-[28px] bg-[#5D3E85]/5 dark:bg-white/5 border border-[#5D3E85]/10 dark:border-white/10 p-6 sm:p-8 md:p-10 flex flex-col gap-6">
          {sections.highlights_heading && (
            <h2 className="font-serif font-bold text-xl sm:text-2xl text-center text-[#221B2B] dark:text-[#F3EFF6]">{sections.highlights_heading}</h2>
          )}
          <div className="reveal-group grid grid-cols-1 sm:grid-cols-3 gap-4">
            {highlights.map((item, i) => {
              const Icon = HIGHLIGHT_ICONS[i % HIGHLIGHT_ICONS.length];
              return (
                <div key={item.title} className="flex flex-col items-center text-center gap-2 rounded-2xl bg-white dark:bg-[#1E1528] p-6 shadow-xs transition-transform duration-300 hover:-translate-y-1">
                  <span className="grid place-items-center w-12 h-12 rounded-2xl bg-gradient-to-br from-[#5D3E85] to-[#EC268F] text-white shadow-md">
                    <Icon className="w-5 h-5" />
                  </span>
                  <h3 className="font-bold text-sm text-[#221B2B] dark:text-[#F3EFF6]">{item.title}</h3>
                  {item.text && <p className="text-xs text-gray-500 dark:text-[#9B8EA9] leading-relaxed">{item.text}</p>}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Founder — managed in Admin → Settings */}
      {settings?.ceo_name && (
        <section className="bg-white dark:bg-[#1E1528] border border-[#EADBEE] dark:border-white/10 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8 items-center">
          {settings.ceo_image_url && (
            <div className="w-40 h-48 md:w-48 md:h-56 rounded-2xl overflow-hidden bg-gray-50 dark:bg-white/5 shrink-0">
              <img loading="lazy" decoding="async" src={settings.ceo_image_url} alt={settings.ceo_name} width="192" height="224" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex-1 flex flex-col gap-2">
            <span className="text-[10px] font-extrabold tracking-widest  text-[#5D3E85] dark:text-[#EC268F]">Meet the founder</span>
            <h2 className="font-serif font-bold text-xl md:text-2xl text-[#221B2B] dark:text-[#F3EFF6]">{settings.ceo_name}</h2>
            {settings.ceo_bio && (
              <div className="text-sm text-gray-500 dark:text-[#C9BED4] leading-relaxed prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: settings.ceo_bio }} />
            )}
          </div>
        </section>
      )}

      {sections.show_faqs !== false && (
        <FaqSection
          title="A Little More About Shopping With Us"
          eyebrow="FAQs"
          description="Answers about our products, delivery and customer care."
        />
      )}
    </div>
  );
}
