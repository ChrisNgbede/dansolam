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
    <section className="storefront-faq-section rounded-[32px] bg-gradient-to-br from-[#FAF3E8]/70 via-white to-white px-5 py-8 md:p-10 border border-primary/10">
      <div className="max-w-2xl mx-auto text-center mb-7">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-primary">
          <HelpCircle className="w-3.5 h-3.5" /> {eyebrow}
        </span>
        <h2 className="font-serif text-2xl md:text-3xl font-bold text-gray-900 mt-3">{title}</h2>
        <p className="text-xs text-gray-500 leading-relaxed mt-2">{description}</p>
      </div>

      <div className="max-w-3xl mx-auto flex flex-col gap-2.5">
        {isLoading ? Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-14 rounded-2xl bg-white/75 animate-pulse" />
        )) : faqs.map((faq) => {
          const expanded = openId === faq.id;
          return (
            <article key={faq.id} className="rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-xs">
              <button
                type="button"
                onClick={() => setOpenId(expanded ? null : faq.id)}
                aria-expanded={expanded}
                className="storefront-faq-trigger w-full flex items-center justify-between gap-4 px-5 py-4 text-left cursor-pointer hover:bg-primary/[0.025] transition-colors"
              >
                <span className="storefront-faq-question flex-1 text-left text-xs md:text-sm font-bold text-gray-800">{faq.question}</span>
                <span className={`storefront-faq-caret ml-auto w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}>
                  <ChevronDown className="w-4 h-4" />
                </span>
              </button>
              <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                <div className="overflow-hidden">
                  <div
                    className="px-5 pb-5 text-xs md:text-sm leading-7 text-gray-550 border-t border-gray-50 pt-4"
                    dangerouslySetInnerHTML={{ __html: faq.answer }}
                  />
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {showAllLink && !isLoading && (data?.data || []).length > limit && (
        <div className="text-center mt-6">
          <Link to="/pages/faq" className="inline-flex px-5 py-2.5 rounded-full bg-primary text-white text-[10px] font-bold uppercase tracking-wider">
            View All FAQs
          </Link>
        </div>
      )}
    </section>
  );
}
