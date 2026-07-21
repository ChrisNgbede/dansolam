import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Eye, Image as ImageIcon, Sparkles } from 'lucide-react';
import SEO from '../../components/seo/SEO';

export default function Gallery() {
  const [lightboxImg, setLightboxImg] = useState(null);

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
        <h2 className="font-serif font-bold text-gray-800 text-lg">Lookbook Inactive</h2>
        <p className="text-xs text-gray-500">The ecommerce gallery showcase is currently offline or disabled by the administrator.</p>
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
        title="Fashion Lookbooks & Collections Gallery"
        description="Browse through Dansolam elegant style lookbooks, custom collections showcases, and designer wear spotlights."
      />

      {/* Hero Banner Section */}
      <div className="storefront-page-hero bg-gradient-to-br from-[#FAF3E8] to-white border-b border-gray-100 py-12 text-center rounded-3xl mb-2">
        <div className="max-w-2xl mx-auto px-6 flex flex-col items-center">
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-3.5 py-1.5 rounded-full flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Style Lookbooks
          </span>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 mt-4 tracking-tight leading-none">Our Collections Showcase</h1>
          <p className="text-xs text-gray-500 max-w-md mx-auto mt-3 leading-relaxed">
            Be inspired by our curated highlights, seasonal designer arrivals, and bespoke tailored fits. Click any image to view details.
          </p>
        </div>
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col group cursor-zoom-in relative text-left"
              onClick={() => setLightboxImg(item.image_url)}
            >
              {/* Media showcase image - Full Bleed */}
              <div className="h-64 sm:h-72 w-full bg-[#FAF9F6] overflow-hidden relative">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.title || 'Showcase look'}
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500 ease-out"
                    loading="lazy" decoding="async"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-primary/10 to-primary/5 flex items-center justify-center text-primary text-2xl">👑</div>
                )}
                {/* Modern hover glass overlay */}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <span className="text-[10px] text-white font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md border border-white/30 px-4 py-2 rounded-full flex items-center gap-1.5 shadow-sm">
                    <Eye className="w-3.5 h-3.5" /> Zoom View
                  </span>
                </div>
              </div>

              {/* Title / Description (Padded details box) */}
              {(item.title || item.description) && (
                <div className="p-4 flex flex-col gap-1.5 bg-white flex-1 justify-between">
                  <div className="flex flex-col gap-1">
                    {item.title && <h3 className="font-serif font-bold text-gray-900 text-sm leading-snug">{item.title}</h3>}
                    {item.description && <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5">{item.description}</p>}
                  </div>
                  {item.link_url && (
                    <a
                      href={item.link_url}
                      className="text-[10px] text-primary hover:text-primary-hover hover:underline font-bold uppercase tracking-wider mt-2.5 inline-flex items-center gap-0.5 self-start"
                      onClick={e => e.stopPropagation()}
                    >
                      Shop Look →
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl py-20 text-center flex flex-col items-center gap-3 shadow-xs max-w-lg mx-auto w-full">
          <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
            <ImageIcon className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-gray-800 text-sm mt-1">Showcase Coming Soon</h3>
          <p className="text-xs text-gray-450 max-w-sm">We are currently editing our lookbook collections. Check back shortly to browse new uploads.</p>
        </div>
      )}

      {/* LIGHTBOX FOR CLICK TO ZOOM */}
      {lightboxImg && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={() => setLightboxImg(null)}>
          <div className="relative max-w-3xl w-full max-h-[85vh] flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setLightboxImg(null)}
              className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white rounded-full bg-white/10 hover:bg-white/20 transition-all cursor-pointer shadow-sm"
            >
              <X className="w-6 h-6" />
            </button>
            <img loading="lazy" decoding="async" src={lightboxImg} alt="Lookbook Zoom View" className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  );
}
