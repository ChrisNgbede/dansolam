import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';

/**
 * Slow, endless category ribbon shown above the footer. Categories come from
 * the catalogue, so it stays in step with whatever admin publishes.
 */
export default function CategoryMarquee() {
  const { data } = useQuery({
    queryKey: ['categories-marquee'],
    queryFn: () => fetch('/api/categories').then((res) => res.json()),
    staleTime: 10 * 60_000,
  });

  const categories = (data?.data || [])
    .filter((c) => c?.slug && c?.is_visible !== false && (c.products_count ?? 0) > 0);

  if (categories.length === 0) return null;

  // The track holds two copies, so the loop restarts unnoticed halfway through.
  const track = [...categories, ...categories];

  return (
    <section className="category-marquee relative overflow-hidden bg-gradient-to-r from-[#2A1740] via-[#4A2B68] to-[#2A1740] py-8 sm:py-10">
      <div className="px-6 md:px-12 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-6 max-w-[1400px] mx-auto">
        <div>
          <span className="block text-[12px] font-extrabold tracking-widest text-[#E5C158]">Buy from categories</span>
          <h2 className="font-serif font-bold text-2xl sm:text-3xl text-white leading-tight">Shop by what your skin needs</h2>
        </div>
        <Link
          to="/shop"
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-white/25 text-[13px] font-bold text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EC268F]"
        >
          <span>All categories</span>
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      </div>

      {/* Duplicated for the seamless loop, so the copy is hidden from screen readers. */}
      <div className="category-marquee__viewport">
        <ul className="category-marquee__track">
          {track.map((category, i) => (
            <li key={`${category.id}-${i}`} aria-hidden={i >= categories.length ? 'true' : undefined}>
              <Link
                to={`/shop?category=${category.slug}`}
                tabIndex={i >= categories.length ? -1 : undefined}
                className="group inline-flex items-center gap-2.5 h-11 pl-4 pr-3 rounded-full bg-white/10 hover:bg-white text-white hover:text-[#2A1740] border border-white/20 backdrop-blur-sm transition-colors duration-300 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EC268F]"
              >
                <span className="text-[14px] font-bold">{category.name}</span>
                <span className="grid place-items-center min-w-6 h-6 px-1.5 rounded-full bg-white/15 group-hover:bg-[#2A1740]/10 text-[12px] font-bold">
                  {category.products_count}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
