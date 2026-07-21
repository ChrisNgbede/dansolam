import { useEffect } from 'react';

export default function SEO({ title, description }) {
  useEffect(() => {
    // 1. Update Document Title
    const baseTitle = 'FairQueen Collections';
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
      description || 'Shop standout designer clothing, elegant shoes, and luxury handbags at FairQueen Collections.'
    );
  }, [title, description]);

  return null;
}
