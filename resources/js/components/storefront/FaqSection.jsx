import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FaqSection({
  title = 'Frequently Asked Questions',
  eyebrow = 'Helpful Answers',
  description = 'Everything you need to know before placing your order.',
  limit = 6,
  showAllLink = true,
}) {
  const [openId, setOpenId] = useState(null);
  const { data, isLoading } = useQuery({
    queryKey: ['storefront-faqs'],
    queryFn: async () => {
      const response = await fetch('/api/faqs');
      if (!response.ok) throw new Error('Unable to load FAQs');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const faqs = (data?.data || []).slice(0, limit);
  if (!isLoading && faqs.length === 0) return null;

  return (
    <section className="storefront-faq-section rounded-[36px] bg-white dark:bg-[#1E1528] border border-[#EADBEE] dark:border-white/10 px-5 py-10 md:p-12 shadow-sm text-left transition-colors duration-300">
      <div className="max-w-2xl mx-auto text-center mb-8">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white dark:bg-[#1E1528] px-4 py-1 text-[9px] sm:text-[10px] font-extrabold  tracking-[0.16em] text-[#5D3E85] dark:text-[#E5C158] border border-[#EADBEE] dark:border-white/10 shadow-xs">
          <HelpCircle className="w-3.5 h-3.5 text-[#EC268F]" /> {eyebrow}
        </span>
        <h2 className="font-extrabold text-2xl md:text-4xl text-[#221B2B] dark:text-[#F3EFF6] mt-3 tracking-tight">{title}</h2>
        <p className="text-xs text-gray-500 dark:text-[#9B8EA9] leading-relaxed mt-2 font-medium">{description}</p>
      </div>

      <div className="max-w-3xl mx-auto flex flex-col gap-3">
        {isLoading ? Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-14 rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse" />
        )) : faqs.map((faq) => {
          const expanded = openId === faq.id;
          return (
            <article key={faq.id} className="rounded-2xl bg-[#FAF7FC] dark:bg-white/5 border border-[#EADBEE] dark:border-white/10 overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => setOpenId(expanded ? null : faq.id)}
                aria-expanded={expanded}
                className="storefront-faq-trigger w-full flex items-center justify-between gap-4 px-6 py-4 text-left cursor-pointer hover:bg-white dark:hover:bg-white/10 transition-colors"
              >
                <span className="storefront-faq-question flex-1 text-left text-xs md:text-sm font-extrabold text-[#221B2B] dark:text-[#F3EFF6]">{faq.question}</span>
                <span className={`storefront-faq-caret ml-auto w-8 h-8 rounded-full bg-[#5D3E85]/10 dark:bg-[#EC268F]/20 text-[#5D3E85] dark:text-[#EC268F] flex items-center justify-center shrink-0 transition-transform ${expanded ? 'rotate-180 bg-[#5D3E85] dark:bg-[#EC268F] text-white' : ''}`}>
                  <ChevronDown className="w-4 h-4" />
                </span>
              </button>
              <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                <div className="overflow-hidden">
                  <div
                    className="px-6 pb-6 text-xs md:text-sm leading-relaxed text-gray-600 dark:text-[#C9BED4] border-t border-gray-100 dark:border-white/10 pt-4 font-medium"
                    dangerouslySetInnerHTML={{ __html: faq.answer }}
                  />
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {showAllLink && !isLoading && (data?.data || []).length > limit && (
        <div className="text-center mt-8">
          <Link to="/pages/faq" className="inline-flex px-6 py-3 rounded-full bg-[#5D3E85] hover:bg-[#EC268F] text-white text-[10px] font-extrabold tracking-widest shadow-md transition-all btn-spring">
            View All FAQs
          </Link>
        </div>
      )}
    </section>
  );
}
