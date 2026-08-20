import React from 'react';

/**
 * Modern, elegant faceless avatar silhouette with customizable size and palette.
 */
export default function FacelessAvatar({ 
  className = "w-10 h-10", 
  src = null, 
  alt = "", 
  name = ""
}) {
  if (src && typeof src === 'string' && src.trim().length > 5 && !src.includes('unsplash.com/photo-')) {
    return (
      <img
        src={src}
        alt={alt || name}
        loading="lazy"
        decoding="async"
        className={`${className} rounded-full object-cover shrink-0`}
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
    );
  }

  return (
    <div 
      className={`${className} rounded-full bg-gradient-to-tr from-[#5D3E85]/15 via-[#FAF7FC] to-[#EC268F]/15 dark:from-[#2B183E] dark:via-[#1F1729] dark:to-[#381B46] border border-[#EADBEE] dark:border-white/10 flex items-center justify-center shrink-0 overflow-hidden relative shadow-2xs`}
      title={name || alt || "Client"}
    >
      <svg 
        className="w-[68%] h-[68%] text-[#5D3E85]/70 dark:text-[#E4DDEA]/70 translate-y-1" 
        viewBox="0 0 24 24" 
        fill="currentColor"
      >
        <circle cx="12" cy="7" r="4.5" />
        <path d="M12 13.5c-4.42 0-8 2.69-8 6 0 .55.45 1 1 1h14c.55 0 1-.45 1-1 0-3.31-3.58-6-8-6z" />
      </svg>
    </div>
  );
}
