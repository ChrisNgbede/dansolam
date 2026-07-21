import React from 'react';

export default function SocialIcon({ network, className = 'w-4 h-4' }) {
  const key = String(network || '').toLowerCase();

  if (key === 'instagram') {
    return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>;
  }
  if (key === 'facebook') {
    return <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M14 8.5V7c0-1 .7-1.5 1.7-1.5H18V2.2c-.8-.1-1.8-.2-3.1-.2C11.8 2 10 3.9 10 7.2v1.3H7V12h3v10h4V12h3.2l.5-3.5H14Z"/></svg>;
  }
  if (key === 'tiktok') {
    return <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M15.5 3c.3 2 1.4 3.3 3.5 3.5V10a8 8 0 0 1-3.5-1v6.3a6.3 6.3 0 1 1-5.4-6.2v3.6a2.8 2.8 0 1 0 1.9 2.6V3h3.5Z"/></svg>;
  }
  if (key === 'youtube') {
    return <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21.6 7.1a3 3 0 0 0-2.1-2.1C17.7 4.5 12 4.5 12 4.5S6.3 4.5 4.5 5a3 3 0 0 0-2.1 2.1A31 31 0 0 0 2 12a31 31 0 0 0 .4 4.9A3 3 0 0 0 4.5 19c1.8.5 7.5.5 7.5.5s5.7 0 7.5-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 22 12a31 31 0 0 0-.4-4.9ZM10 15.4V8.6l6 3.4-6 3.4Z"/></svg>;
  }
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M4 4l16 16M20 4L4 20"/></svg>;
}
