import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Calendar, ArrowRight, BookOpen, Compass, ArrowLeft } from 'lucide-react';
import SEO from '../../components/seo/SEO';

export default function Blog() {
  // Fetch settings to check visibility
  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: () => fetch('/api/settings').then(res => res.json())
  });

  const settings = settingsData?.data?.settings || {};
  const isBlogActive = settings.show_blog_page !== 'false';

  // Fetch public blog articles list
  const { data: articlesRes, isLoading } = useQuery({
    queryKey: ['public-blog-articles'],
    queryFn: () => fetch('/api/blog').then(res => res.json()),
    enabled: isBlogActive
  });

  const articles = articlesRes?.data || [];

  if (!isBlogActive) {
    return (
      <div className="max-w-md mx-auto text-center py-24 px-6 flex flex-col items-center gap-4">
        <span className="text-4xl">📖</span>
        <h2 className="font-serif font-bold text-gray-800 dark:text-[#F3EFF6] text-base">Blog Offline</h2>
        <p className="text-xs text-gray-500 dark:text-[#9B8EA9]">The skincare blog and articles are currently unavailable.</p>
        <Link to="/" className="px-6 py-3 bg-[#5D3E85] hover:bg-[#EC268F] text-white text-xs font-extrabold rounded-full shadow-md transition-all">
          Return Home
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 font-sans">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse bg-white rounded-2xl h-80 w-full shadow-xs" />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-[#FBFAF8] dark:bg-[#17101F] min-h-screen font-sans pb-20 transition-colors duration-300">
      <SEO
        title="Beauty Guides, Articles & Skincare Blog | Dansolam Beauty Home"
        description="Discover beauty tips, facial care guides, and skincare articles from Dansolam Beauty Home."
      />

      <div className="max-w-[1400px] mx-auto px-3 sm:px-5 lg:px-6 pt-20 sm:pt-22 md:pt-24 pb-16 flex flex-col gap-6">
        {/* Hero Banner Card - Compact, Wide, Back to Home Inside */}
        <div className="h-[200px] sm:h-[240px] md:h-[270px] rounded-[28px] sm:rounded-[36px] overflow-hidden bg-gray-900 relative shadow-md w-full">
          <img
            loading="eager"
            decoding="async"
            src="https://images.unsplash.com/photo-1512290900672-1f5be4df1d3a?q=80&w=1200"
            className="w-full h-full object-cover object-center"
            alt="Dansolam Blog & Articles"
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
              Dansolam Blog
            </span>
            <h1 className="font-extrabold text-xl sm:text-2xl md:text-3xl lg:text-4xl text-white leading-tight">
              Beauty Guides & Skincare Articles
            </h1>
            <p className="text-[11px] sm:text-xs md:text-sm text-gray-200 mt-1 max-w-2xl font-sans leading-snug line-clamp-2">
              Stay updated with luxury beauty advice, facial treatment routines, and skincare secrets.
            </p>
          </div>
        </div>

        {articles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-2">
            {articles.map((art) => {
              const cleanText = art.content
                ? art.content.replace(/<[^>]*>?/gm, '')
                : '';
              const excerpt = cleanText.slice(0, 100) + (cleanText.length > 100 ? '...' : '');
              const formattedDate = art.created_at
                ? new Date(art.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : 'Recent Story';

              return (
                <article
                  key={art.id}
                  className="bg-white dark:bg-[#1E1528] rounded-3xl overflow-hidden shadow-xs hover:shadow-xl border border-[#EADBEE] dark:border-white/10 hover:-translate-y-1 transition-all duration-300 flex flex-col group text-left"
                >
                  {/* Cover image wrapper */}
                  <div className="h-52 w-full bg-[#FAF7FC] dark:bg-[#150F1D] overflow-hidden relative">
                    {art.cover_image_url ? (
                      <>
                        <img
                          src={art.cover_image_url}
                          alt={art.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          loading="lazy" decoding="async"
                        />
                        {/* Flash Glass Sheen */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none z-10" />
                      </>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-[#5D3E85]/15 to-[#EC268F]/10 flex flex-col items-center justify-center text-[#5D3E85] dark:text-[#EC268F] gap-2 opacity-80">
                        <BookOpen className="w-7 h-7 stroke-1" />
                        <span className="text-[10px] font-extrabold  tracking-widest text-[#5D3E85]/70 dark:text-[#EC268F]/70">Dansolam Editorial</span>
                      </div>
                    )}
                  </div>

                  {/* Excerpt context block */}
                  <div className="p-6 flex-1 flex flex-col justify-between gap-4 text-[#221B2B] dark:text-[#F3EFF6]">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-extrabold  tracking-wider text-[#5D3E85] dark:text-[#EC268F]">
                          {art.category?.name || (art.tags && art.tags[0]?.name) || 'Routine Guide'}
                        </span>
                        <span className="text-[9px] text-gray-400 dark:text-[#9B8EA9] font-bold  tracking-wider flex items-center gap-1">
                          <Calendar className="w-3 h-3 shrink-0 text-[#5D3E85] dark:text-[#EC268F]" />
                          <span>{formattedDate}</span>
                        </span>
                      </div>

                      <h3 className="font-extrabold text-[#221B2B] dark:text-[#F3EFF6] text-base group-hover:text-[#5D3E85] dark:group-hover:text-[#EC268F] transition-colors line-clamp-2 leading-snug mt-0.5">
                        {art.title}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-[#C9BED4] leading-relaxed line-clamp-3 mt-1 font-medium">
                        {excerpt || 'Read the full skincare articles on the Dansolam blog.'}
                      </p>
                    </div>

                    <div className="border-t border-gray-100 dark:border-white/10 pt-4">
                      <Link
                        to={`/blog/${art.slug}`}
                        className="inline-flex items-center gap-1 text-[#5D3E85] dark:text-[#EC268F] font-extrabold hover:gap-2 transition-all tracking-wider text-[10px] btn-spring"
                      >
                        Read Story <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="bg-white dark:bg-[#1E1528] rounded-3xl py-20 text-center flex flex-col items-center gap-3 shadow-xs max-w-lg mx-auto w-full border border-[#EADBEE] dark:border-white/10">
            <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400 dark:text-[#9B8EA9]">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-[#221B2B] dark:text-[#F3EFF6] text-sm mt-1">Stories Coming Soon</h3>
            <p className="text-xs text-gray-400 dark:text-[#9B8EA9] max-w-sm">We are currently drafting skincare guides, lookbooks, and beauty tips. Please check back soon.</p>
          </div>
        )}
      </div>
    </div>
  );
}
