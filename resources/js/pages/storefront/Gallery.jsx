import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { X, Eye, Image as ImageIcon, ArrowLeft } from 'lucide-react';
import SEO from '../../components/seo/SEO';

export default function Gallery() {
  const [lightboxImg, setLightboxImg] = useState(null);

  // Lock body scroll when lightbox is open
  useEffect(() => {
    if (lightboxImg) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e) => { if (e.key === 'Escape') setLightboxImg(null); };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [lightboxImg]);

  // Fetch settings to check visibility
  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: () => fetch('/api/settings').then(res => res.json())
  });

  const settings = settingsData?.data?.settings || {};
  const isGalleryActive = settings.show_gallery_page !== 'false';

  // Fetch public gallery items
  const { data: galleryRes, isLoading } = useQuery({
    queryKey: ['public-gallery-items'],
    queryFn: () => fetch('/api/gallery').then(res => res.json()),
    enabled: isGalleryActive
  });

  const items = galleryRes?.data || [];

  if (!isGalleryActive) {
    return (
      <div className="max-w-md mx-auto text-center py-24 px-6 flex flex-col items-center gap-4 font-sans">
        <span className="text-5xl">🖼️</span>
        <h2 className="font-serif font-bold text-gray-800 text-lg">Gallery Unavailable</h2>
        <p className="text-xs text-gray-500">The ecommerce gallery showcase is currently offline or disabled by the administrator.</p>
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
    <div className="bg-white dark:bg-[#17101F] min-h-screen font-sans pb-20 transition-colors duration-300">
      <SEO
        title="Gallery | Dansolam Beauty Home"
        description="Browse photos of Dansolam Beauty Home organic skincare products."
      />

      <div className="max-w-[1400px] mx-auto px-3 sm:px-5 lg:px-6 pt-20 sm:pt-22 md:pt-24 pb-16 flex flex-col gap-6">
        {/* Hero Banner Card - Compact, Wide, Back to Home Inside */}
        <section className="h-[200px] sm:h-[240px] md:h-[270px] rounded-[28px] sm:rounded-[36px] overflow-hidden bg-gradient-to-br from-[#5D3E85] via-[#4A2B68] to-[#2A1740] relative shadow-md w-full">

          {/* Header Action Buttons Inside Banner */}
          <div className="absolute top-4 sm:top-5 left-4 sm:left-6 right-4 sm:right-6 flex justify-between items-center z-20">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-[11px] font-bold text-white shadow-sm transition-all duration-300 btn-spring"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>
          </div>

          <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-7 md:p-9 text-left z-10">
            <span className="text-[9px] sm:text-[10px] font-extrabold text-[#5D3E85] bg-white px-3.5 py-1 rounded-full  tracking-widest self-start mb-2 border border-white/40 shadow-sm">
              Dansolam Gallery
            </span>
            <h1 className="font-serif font-bold text-2xl sm:text-3xl md:text-4xl text-white leading-tight">
              Our Gallery
            </h1>
            <p className="text-[11px] sm:text-xs md:text-sm text-gray-200 mt-1 max-w-2xl font-sans leading-snug line-clamp-2">
              A look at our organic creams, oils, scrubs and soaps.
            </p>
          </div>
        </section>

        {items.length > 0 ? (
          <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-[#1E1528] rounded-3xl overflow-hidden shadow-xs hover:shadow-xl border border-[#EADBEE] dark:border-white/10 hover:-translate-y-1 transition-all duration-300 flex flex-col group cursor-zoom-in relative text-left"
                onClick={() => setLightboxImg(item.image_url)}
              >
                {/* Media showcase image */}
                <div className="h-64 sm:h-72 w-full bg-[#FAF7FC] dark:bg-[#150F1D] overflow-hidden relative">
                  {item.image_url ? (
                    <>
                      <img
                        src={item.image_url}
                        alt={item.title || 'Showcase look'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                        loading="lazy" decoding="async"
                      />
                      {/* Flash Glass Sheen */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none z-10" />
                    </>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-[#5D3E85]/10 to-[#EC268F]/5 flex items-center justify-center text-[#5D3E85] text-2xl">🌸</div>
                  )}
                  {/* Modern hover glass overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <span className="text-[10px] text-white font-extrabold  tracking-wider bg-white/20 backdrop-blur-md border border-white/30 px-4 py-2 rounded-full flex items-center gap-1.5 shadow-sm">
                      <Eye className="w-3.5 h-3.5" /> Zoom View
                    </span>
                  </div>
                </div>

                {/* Title / Description */}
                {(item.title || item.description) && (
                  <div className="p-5 flex flex-col gap-1.5 bg-white dark:bg-[#1E1528] flex-1 justify-between text-[#221B2B] dark:text-[#F3EFF6]">
                    <div className="flex flex-col gap-1">
                      {item.title && <h3 className="font-extrabold text-[#221B2B] dark:text-[#F3EFF6] text-base leading-snug">{item.title}</h3>}
                      {item.description && <p className="text-xs text-gray-500 dark:text-[#C9BED4] leading-relaxed mt-0.5 font-medium">{item.description}</p>}
                    </div>
                    {item.link_url && (
                      <a
                        href={item.link_url}
                        className="text-[10px] text-[#5D3E85] dark:text-[#EC268F] hover:underline font-extrabold tracking-wider mt-2.5 inline-flex items-center gap-0.5 self-start btn-spring"
                        onClick={e => e.stopPropagation()}
                      >
                        Shop Look →
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </section>
        ) : (
          <section className="bg-white dark:bg-[#1E1528] rounded-3xl py-20 text-center flex flex-col items-center gap-3 shadow-xs max-w-lg mx-auto w-full border border-[#EADBEE] dark:border-white/10">
            <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400 dark:text-[#9B8EA9]">
              <ImageIcon className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-[#221B2B] dark:text-[#F3EFF6] text-sm mt-1">Photos Coming Soon</h3>
            <p className="text-xs text-gray-400 dark:text-[#9B8EA9] max-w-sm">New photos will be added soon.</p>
          </section>
        )}

        {/* LIGHTBOX FOR CLICK TO ZOOM */}
        {lightboxImg && createPortal(
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-md z-[99999] flex items-center justify-center p-4 animate-fade-in"
            role="dialog"
            aria-modal="true"
            onClick={() => setLightboxImg(null)}
          >
            <div className="relative max-w-3xl w-full max-h-[85vh] flex flex-col items-center" onClick={e => e.stopPropagation()}>
              <button
                onClick={() => setLightboxImg(null)}
                className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white rounded-full bg-white/10 hover:bg-white/20 transition-all cursor-pointer shadow-sm"
              >
                <X className="w-6 h-6" />
              </button>
              <img loading="lazy" decoding="async" src={lightboxImg} alt="Gallery image" className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl" />
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
}
