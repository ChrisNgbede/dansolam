import { useEffect } from 'react';

export default function SEO({ title, description }) {
  useEffect(() => {
    // 1. Update Document Title
    const baseTitle = 'Dansolam';
    document.title = title ? `${title} | ${baseTitle}` : baseTitle;

    // 2. Update Document Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute(
      'content',
      description || 'Experience luxury skincare, beauty treatments, and spa routines at Dansolam.'
    );
  }, [title, description]);

  return null;
}
