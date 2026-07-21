import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Calendar, ArrowRight, BookOpen, Compass } from 'lucide-react';
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
      <div className="max-w-md mx-auto text-center py-24 px-6 flex flex-col items-center gap-4 font-sans">
        <span className="text-5xl">📖</span>
        <h2 className="font-serif font-bold text-gray-800 text-lg">Blog Inactive</h2>
        <p className="text-xs text-gray-500">The ecommerce style blog and article section is currently offline or disabled by the administrator.</p>
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
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 flex flex-col gap-8 font-sans pb-16">
      <SEO
        title="Ecommerce Fashion Blog & Style Guides"
        description="Discover style trends, lookbook collection guides, and custom sewing fit recommendations from Dansolam."
      />

      {/* Hero Banner Section */}
      <div className="storefront-page-hero bg-gradient-to-br from-[#FAF3E8] to-white border-b border-gray-100 py-12 text-center rounded-3xl mb-2">
        <div className="max-w-2xl mx-auto px-6 flex flex-col items-center">
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-3.5 py-1.5 rounded-full flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-primary" />
            Dansolam Journal
          </span>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 mt-4 tracking-tight leading-none">Style Guides & Fashion Stories</h1>
          <p className="text-xs text-gray-500 max-w-md mx-auto mt-3 leading-relaxed">
            Stay updated with current luxury trends, styling inspiration, lookbook edits, and custom dress fit techniques.
          </p>
        </div>
      </div>

      {articles.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-2">
          {articles.map((art) => {
            // Strip HTML tags for clean text summary excerpt
            const cleanText = art.content
              ? art.content.replace(/<[^>]*>?/gm, '')
              : '';
            const excerpt = cleanText.slice(0, 100) + (cleanText.length > 100 ? '...' : '');

            return (
              <article
                key={art.id}
                className="bg-white rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col group text-left"
              >
                {/* Cover image wrapper - Full Bleed */}
                <div className="h-52 w-full bg-[#FAF3E8] overflow-hidden relative">
                  {art.cover_image_url ? (
                    <img
                      src={art.cover_image_url}
                      alt={art.title}
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-700"
                      loading="lazy" decoding="async"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-primary/15 to-primary/5 flex flex-col items-center justify-center text-primary gap-2 opacity-80">
                      <span className="text-3xl">👑</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-primary/70">Dansolam Editorial</span>
                    </div>
                  )}
                </div>

                {/* Excerpt context block (with padding inside card) */}
                <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                  <div className="flex flex-col gap-2">
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 shrink-0 text-primary/75" />
                      {new Date(art.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                    <h3 className="font-serif font-bold text-gray-900 text-sm group-hover:text-primary transition-colors line-clamp-2 leading-snug mt-0.5">
                      {art.title}
                    </h3>
                    <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-3 mt-1.5">
                      {excerpt || 'Read the full styling post on the Dansolam journal.'}
                    </p>
                  </div>

                  <div className="border-t border-gray-50 pt-3.5">
                    <Link
                      to={`/blog/${art.slug}`}
                      className="inline-flex items-center gap-1 text-xs text-primary font-bold hover:gap-2 transition-all uppercase tracking-wider text-[10px]"
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
        <div className="bg-white rounded-3xl py-20 text-center flex flex-col items-center gap-3 shadow-xs max-w-lg mx-auto w-full">
          <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-gray-800 text-sm mt-1">Stories Coming Soon</h3>
          <p className="text-xs text-gray-455 max-w-sm">We are currently drafting fashion articles, lookbooks, and fitting guide posts. Please check back soon.</p>
        </div>
      )}
    </div>
  );
}
