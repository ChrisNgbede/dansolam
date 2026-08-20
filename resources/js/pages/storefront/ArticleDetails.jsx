import React, { useState } from 'react';
import { toast as systemToast } from '../../components/ui/ToastProvider';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Calendar, ArrowLeft, Clock, Share2, BookOpen, Check, Copy, MessageCircle, Mail } from 'lucide-react';
import SEO from '../../components/seo/SEO';

export default function ArticleDetails() {
  const { slug } = useParams();
  const [copied, setCopied] = useState(false);

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

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareTitle = article.title;
  const shareText = `Check out this beauty & wellness article on Dansolam: ${shareTitle}`;

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(currentUrl);
      } else {
        const tempInput = document.createElement('input');
        tempInput.value = currentUrl;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
      }
      setCopied(true);
      systemToast.success('Article link copied to clipboard! ✨');
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      systemToast.error('Could not copy link.');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: currentUrl,
        });
      } catch (e) {
        // User dismissed native share
      }
    } else {
      handleCopyLink();
    }
  };

  const shareLinks = [
    {
      name: 'WhatsApp',
      href: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + currentUrl)}`,
      icon: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      ),
      bg: 'hover:bg-[#25D366]/10 hover:text-[#25D366] hover:border-[#25D366]/30',
    },
    {
      name: 'X (Twitter)',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(currentUrl)}`,
      icon: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      bg: 'hover:bg-black/10 dark:hover:bg-white/10 hover:text-black dark:hover:text-white hover:border-black/30 dark:hover:border-white/30',
    },
    {
      name: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`,
      icon: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M14 8.5V7c0-1 .7-1.5 1.7-1.5H18V2.2c-.8-.1-1.8-.2-3.1-.2C11.8 2 10 3.9 10 7.2v1.3H7V12h3v10h4V12h3.2l.5-3.5H14Z" />
        </svg>
      ),
      bg: 'hover:bg-[#1877F2]/10 hover:text-[#1877F2] hover:border-[#1877F2]/30',
    },
    {
      name: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`,
      icon: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.49 1.49 0 0 0 1.49-1.49 1.5 1.5 0 0 0-3 0c0 .83.67 1.49 1.51 1.49m1.4 9.74v-8.37H5.06v8.37h2.8Z" />
        </svg>
      ),
      bg: 'hover:bg-[#0A66C2]/10 hover:text-[#0A66C2] hover:border-[#0A66C2]/30',
    },
    {
      name: 'Email',
      href: `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(shareText + '\n\n' + currentUrl)}`,
      icon: <Mail className="w-3.5 h-3.5" />,
      bg: 'hover:bg-[#5D3E85]/10 hover:text-[#5D3E85] dark:hover:text-[#EC268F] hover:border-[#5D3E85]/30',
    }
  ];

  return (
    <div className="bg-[#FBFAF8] dark:bg-[#17101F] min-h-screen pt-28 sm:pt-36 pb-20 px-4 md:px-8 font-sans text-left transition-colors duration-300">
      <SEO
        title={article.title}
        description={article.content ? article.content.replace(/<[^>]*>?/gm, '').slice(0, 155) : 'Read this article on Dansolam Beauty Home.'}
      />

      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-[10px] text-gray-400 dark:text-[#9B8EA9] mb-6">
          <Link to="/" className="hover:text-[#5D3E85] dark:hover:text-[#EC268F] transition-colors font-semibold">Home</Link>
          <span>/</span>
          <Link to="/blog" className="hover:text-[#5D3E85] dark:hover:text-[#EC268F] transition-colors font-semibold">Blog & Articles</Link>
          <span>/</span>
          <span className="text-gray-600 dark:text-[#F3EFF6] font-medium truncate max-w-[180px]">{article.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10">
          {/* Main article */}
          <article className="flex flex-col gap-6 bg-white dark:bg-[#1E1528] border border-[#EADBEE] dark:border-white/10 rounded-3xl p-6 sm:p-10 shadow-xs text-left">
            {/* Meta info */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-4 text-[10px] text-gray-400 dark:text-[#9B8EA9] font-medium">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#5D3E85] dark:text-[#EC268F]" />
                  {publishedDate}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#5D3E85] dark:text-[#EC268F]" />
                  {estimateReadTime(article.content)}
                </span>
              </div>
              <h1 className="font-extrabold text-2xl md:text-4xl text-[#221B2B] dark:text-[#F3EFF6] leading-tight">
                {article.title}
              </h1>
            </div>
            {/* Cover image */}
            {article.cover_image_url && (
              <div className="rounded-2xl overflow-hidden shadow-xs border border-gray-100 dark:border-white/10">
                <img loading="eager" decoding="async" fetchPriority="high"
                  src={article.cover_image_url}
                  alt={article.title}
                  className="w-full h-auto max-h-[480px] object-cover"
                />
              </div>
            )}

            {/* Article body */}
            <div
              className="prose prose-sm max-w-none text-gray-700 dark:text-[#C9BED4] leading-relaxed"
              style={{
                fontSize: '14px',
                lineHeight: '1.8'
              }}
              dangerouslySetInnerHTML={{ __html: article.content }}
            />

            {/* Social Share Bar */}
            <div className="flex flex-col gap-3.5 border-t border-gray-100 dark:border-white/10 pt-6 mt-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs font-extrabold text-[#221B2B] dark:text-[#F3EFF6]">
                  <Share2 className="w-4 h-4 text-[#5D3E85] dark:text-[#EC268F]" />
                  <span>Share this article:</span>
                </div>

                {/* Social Share Links */}
                <div className="flex flex-wrap items-center gap-2">
                  {shareLinks.map((item) => (
                    <a
                      key={item.name}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 dark:border-white/15 bg-[#FAF7FC] dark:bg-white/5 text-[11px] font-bold text-gray-600 dark:text-[#C9BED4] transition-all duration-200 shadow-3xs cursor-pointer ${item.bg}`}
                      aria-label={`Share on ${item.name}`}
                    >
                      {item.icon}
                      <span className="hidden sm:inline">{item.name}</span>
                    </a>
                  ))}

                  {/* Copy Link Button */}
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-[11px] font-bold transition-all duration-200 shadow-3xs cursor-pointer ${
                      copied
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'border-gray-200 dark:border-white/15 bg-[#FAF7FC] dark:bg-white/5 text-gray-700 dark:text-[#C9BED4] hover:border-[#5D3E85] dark:hover:border-[#EC268F] hover:text-[#5D3E85] dark:hover:text-[#EC268F]'
                    }`}
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
                  </button>

                  {/* Native Device Share (if supported) */}
                  {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
                    <button
                      type="button"
                      onClick={handleNativeShare}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#5D3E85] hover:bg-[#EC268F] text-white text-[11px] font-extrabold shadow-sm transition-all cursor-pointer btn-spring"
                      title="More share options"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>More</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Navigation Back */}
              <div className="pt-2 flex justify-start">
                <Link
                  to="/blog"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FAF7FC] dark:bg-white/5 border border-gray-200 dark:border-white/15 text-xs font-bold text-[#221B2B] dark:text-[#F3EFF6] hover:text-[#EC268F] transition-all duration-300 btn-spring"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Articles</span>
                </Link>
              </div>
            </div>
          </article>

          {/* Sidebar */}
          <aside className="flex flex-col gap-6">
            {/* Related articles */}
            {allArticles.length > 0 && (
              <div className="bg-white dark:bg-[#1E1528] border border-[#EADBEE] dark:border-white/10 rounded-3xl p-6 flex flex-col gap-4 shadow-3xs text-left">
                <h3 className="font-extrabold text-sm text-[#221B2B] dark:text-[#F3EFF6] flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-[#5D3E85] dark:text-[#EC268F]" /> More Stories
                </h3>
                <div className="flex flex-col gap-3">
                  {allArticles.map(a => {
                    return (
                      <Link
                        key={a.id}
                        to={`/blog/${a.slug}`}
                        className="flex gap-3 group"
                      >
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-50 dark:bg-white/5 shrink-0 border border-gray-100 dark:border-white/10">
                          {a.cover_image_url ? (
                            <img loading="lazy" decoding="async"
                              src={a.cover_image_url}
                              alt={a.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-tr from-[#5D3E85]/20 to-[#EC268F]/10 flex items-center justify-center text-[9px] font-bold text-[#5D3E85] dark:text-[#EC268F]">
                              Dansolam
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-[#221B2B] dark:text-[#F3EFF6] group-hover:text-[#5D3E85] dark:group-hover:text-[#EC268F] transition-colors line-clamp-2 leading-snug">
                            {a.title}
                          </h4>
                          <span className="text-[9px] text-gray-400 dark:text-[#9B8EA9]">
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
            <div className="bg-[#FAF7FC] dark:bg-[#1E1528] border border-[#EADBEE] dark:border-white/10 rounded-3xl p-6 text-center flex flex-col gap-3 shadow-3xs text-left">
              <span className="text-2xl">✨</span>
              <h4 className="font-extrabold text-sm text-[#221B2B] dark:text-[#F3EFF6]">Explore Our Shop Page</h4>
              <p className="text-[10px] text-gray-500 dark:text-[#9B8EA9] leading-relaxed">
                Discover our organic skin products, soothing treatments, and luxury sets.
              </p>
              <Link
                to="/shop"
                className="mt-1 inline-flex items-center justify-center gap-1 bg-[#5D3E85] hover:bg-[#EC268F] text-white text-[10px] font-extrabold tracking-wider px-4 py-2.5 rounded-full transition-colors btn-spring"
              >
                Shop Now →
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
