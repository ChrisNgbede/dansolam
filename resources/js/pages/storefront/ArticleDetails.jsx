import React from 'react';
import { toast as systemToast } from '../../components/ui/ToastProvider';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Calendar, ArrowLeft, Clock, Share2, BookOpen } from 'lucide-react';
import SEO from '../../components/seo/SEO';

export default function ArticleDetails() {
  const { slug } = useParams();

  // Fetch individual article by slug
  const { data: articleRes, isLoading, isError } = useQuery({
    queryKey: ['article-detail', slug],
    queryFn: () => fetch(`/api/blog/${slug}`).then(res => res.json()),
    enabled: !!slug
  });

  const article = articleRes?.data || null;

  // Fetch all articles for "More Articles" sidebar
  const { data: allArticlesRes } = useQuery({
    queryKey: ['public-blog-articles'],
    queryFn: () => fetch('/api/blog').then(res => res.json())
  });

  const allArticles = (allArticlesRes?.data || []).filter(a => a.slug !== slug).slice(0, 4);

  // Estimate reading time from content
  const estimateReadTime = (html) => {
    if (!html) return '1 min read';
    const text = html.replace(/<[^>]*>?/gm, '');
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.max(1, Math.round(words / 220));
    return `${minutes} min read`;
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-12 font-sans animate-pulse">
        <div className="h-6 w-1/3 bg-gray-100 rounded mb-3" />
        <div className="h-10 w-2/3 bg-gray-100 rounded mb-6" />
        <div className="h-72 bg-gray-100 rounded-2xl mb-8" />
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-4 bg-gray-100 rounded" style={{ width: `${80 + Math.random() * 20}%` }} />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !article) {
    return (
      <div className="max-w-md mx-auto text-center py-24 px-6 flex flex-col items-center gap-4 font-sans">
        <span className="text-5xl">📖</span>
        <h2 className="font-serif font-bold text-gray-800 text-lg">Article Not Found</h2>
        <p className="text-xs text-gray-500">
          Sorry, the article you're looking for doesn't exist or may have been removed.
        </p>
        <Link
          to="/blog"
          className="group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#1a1a1a] border border-gray-200/80 dark:border-gray-800 text-xs font-bold text-gray-700 dark:text-gray-200 hover:text-gray-950 dark:hover:text-gray-950 hover:bg-yellow-400 dark:hover:bg-yellow-400 hover:border-yellow-400 dark:hover:border-yellow-400 shadow-3xs hover:shadow-xs transition-all duration-300 shrink-0 mt-2"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-950 group-hover:-translate-x-0.5 transition-all duration-300" />
          <span>Back to Blog</span>
        </Link>
      </div>
    );
  }

  const publishedDate = new Date(article.created_at).toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: article.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      systemToast.success('Link copied to clipboard!');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 font-sans">
      <SEO
        title={article.title}
        description={article.content ? article.content.replace(/<[^>]*>?/gm, '').slice(0, 155) : 'Read this article on FairQueen Collections.'}
      />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-[10px] text-gray-400 mb-6">
        <Link to="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <Link to="/blog" className="hover:text-primary transition-colors">Blog</Link>
        <span>/</span>
        <span className="text-gray-600 font-medium truncate max-w-[180px]">{article.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-10">
        {/* Main article */}
        <article className="flex flex-col gap-6">
          {/* Meta info */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-4 text-[10px] text-gray-400 font-medium">
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {publishedDate}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {estimateReadTime(article.content)}
              </span>
            </div>
            <h1 className="font-serif font-bold text-2xl md:text-3xl text-gray-900 leading-tight">
              {article.title}
            </h1>
          </div>
          {/* Cover image */}
          {article.cover_image_url && (
            <div className="rounded-3xl overflow-hidden shadow-xs">
              <img loading="eager" decoding="async" fetchPriority="high"
                src={article.cover_image_url}
                alt={article.title}
                className="w-full h-auto max-h-[480px] object-cover"
              />
            </div>
          )}

          {/* Article body */}
          <div
            className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
            style={{
              fontSize: '13px',
              lineHeight: '1.8'
            }}
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          {/* Share + Back */}
          <div className="flex items-center justify-between border-t border-gray-100 pt-6 mt-4">
            <Link
              to="/blog"
              className="group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#1a1a1a] border border-gray-200/80 dark:border-gray-800 text-xs font-bold text-gray-700 dark:text-gray-200 hover:text-gray-950 dark:hover:text-gray-950 hover:bg-yellow-400 dark:hover:bg-yellow-400 hover:border-yellow-400 dark:hover:border-yellow-400 shadow-3xs hover:shadow-xs transition-all duration-300 shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-950 group-hover:-translate-x-0.5 transition-all duration-300" />
              <span>Back to Blog</span>
            </Link>
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-primary font-bold transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" /> Share Article
            </button>
          </div>
        </article>

        {/* Sidebar */}
        <aside className="flex flex-col gap-6">
          {/* Related articles */}
          {allArticles.length > 0 && (
            <div className="bg-white rounded-3xl p-6 flex flex-col gap-4 shadow-3xs">
              <h3 className="font-serif font-bold text-sm text-gray-800 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-primary" /> More Articles
              </h3>
              <div className="flex flex-col gap-3">
                {allArticles.map(a => {
                  const excerpt = a.content
                    ? a.content.replace(/<[^>]*>?/gm, '').slice(0, 60) + '...'
                    : '';
                  return (
                    <Link
                      key={a.id}
                      to={`/blog/${a.slug}`}
                      className="flex gap-3 group"
                    >
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-50 shrink-0">
                        {a.cover_image_url ? (
                          <img loading="lazy" decoding="async"
                            src={a.cover_image_url}
                            alt={a.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-tr from-primary/20 to-primary/5 flex items-center justify-center text-[10px] font-bold text-primary">
                            👑
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-0.5 min-w-0 text-left">
                        <h4 className="text-xs font-bold text-gray-800 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                          {a.title}
                        </h4>
                        <span className="text-[9px] text-gray-400">
                          {new Date(a.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-3xl p-6 text-center flex flex-col gap-3 shadow-3xs">
            <span className="text-2xl">👑</span>
            <h4 className="font-serif font-bold text-sm text-gray-800">Explore Our Collections</h4>
            <p className="text-[10px] text-gray-500 leading-relaxed">
              Discover our latest ecommerce arrivals, custom fits, and luxury ready-to-wear pieces.
            </p>
            <Link
              to="/shop"
              className="mt-1 inline-flex items-center justify-center gap-1 bg-primary text-white text-[10px] font-bold px-4 py-2 rounded-full hover:bg-primary/90 transition-colors"
            >
              Shop Now →
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
