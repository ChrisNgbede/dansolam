import React, { useState, useEffect } from 'react';
import { Sparkles, Clock, Mail, CheckCircle2, MessageSquare, ShieldCheck, ArrowRight, Lock, Wrench, RefreshCw, Phone, AlertCircle } from 'lucide-react';
import SEO from '../../components/seo/SEO';

export default function MaintenancePage({ settings = {}, onBypass }) {
  const title = settings.maintenance_title || "We'll Be Back Shortly!";
  const message = settings.maintenance_message || "Our ecommerce is currently undergoing scheduled maintenance to upgrade your shopping experience. Stay tuned for stunning new designer drops!";
  const endTimeStr = settings.maintenance_end_time;
  const whatsappNum = settings.whatsapp_number || '2348000000000';
  const showNewsletter = settings.maintenance_show_newsletter !== 'false' && settings.maintenance_show_newsletter !== false;
  const showContact = settings.maintenance_show_contact !== 'false' && settings.maintenance_show_contact !== false;

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });

  useEffect(() => {
    if (!endTimeStr) return;

    const targetDate = new Date(endTimeStr).getTime();
    if (isNaN(targetDate)) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = targetDate - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds, total: diff });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [endTimeStr]);

  // Email Notification form state
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [notifyMsg, setNotifyMsg] = useState('');

  const handleNotifySubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      setSubmitting(false);

      if (data.success) {
        setSubscribed(true);
        setNotifyMsg(data.message || 'You will be notified immediately when we launch!');
        setEmail('');
      } else {
        setNotifyMsg(data.message || 'Failed to submit. Please try again.');
      }
    } catch (err) {
      setSubmitting(false);
      setNotifyMsg('Error subscribing. Please try again.');
    }
  };

  // Secret Admin Bypass Modal State
  const [showBypassModal, setShowBypassModal] = useState(false);
  const [bypassInput, setBypassInput] = useState('');
  const [bypassError, setBypassError] = useState('');

  const handleBypassSubmit = (e) => {
    e.preventDefault();
    const secretKey = settings.maintenance_bypass_key || 'admin';
    const adminToken = localStorage.getItem('fairqueen_token');

    if (bypassInput.trim() === secretKey || adminToken) {
      sessionStorage.setItem('fairqueen_maintenance_bypass', 'true');
      if (onBypass) onBypass();
    } else {
      setBypassError('Invalid access key. Log into Admin Panel to access the site.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white flex flex-col items-center justify-between p-6 relative overflow-hidden font-sans select-none">
      <SEO title={`Store Under Maintenance - ${settings.ecommerce_name || 'Dansolam'}`} />

      {/* Ambient Radial Luxury Glow Background */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header Logo Bar */}
      <header className="w-full max-w-6xl flex justify-between items-center z-10 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          {settings.logo_url ? (
            <img src={settings.logo_url} alt="Logo" className="h-9 w-auto object-contain" />
          ) : (
            <div className="font-serif font-bold text-xl tracking-tight text-amber-400">
              {settings.ecommerce_name || 'Dansolam'}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-xs font-bold uppercase tracking-wider animate-pulse">
          <Wrench className="w-3.5 h-3.5" />
          <span>Scheduled Maintenance</span>
        </div>
      </header>

      {/* Main Hero Content */}
      <main className="max-w-2xl w-full text-center flex flex-col items-center my-auto py-12 z-10 animate-fade-in">
        {/* Animated Hourglass / Crown Icon Aura */}
        <div className="relative mb-8 group cursor-default">
          <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-amber-500/20 via-primary/30 to-amber-500/20 blur-lg group-hover:blur-xl transition-all duration-500 animate-spin-slow"></div>
          <div className="relative w-24 h-24 bg-gradient-to-br from-gray-900 via-gray-950 to-black rounded-3xl border border-amber-500/30 flex items-center justify-center shadow-2xl">
            <Clock className="w-11 h-11 text-amber-400 animate-bounce" />
          </div>
        </div>

        {/* Title & Subtitle */}
        <h1 className="font-serif font-extrabold text-3xl md:text-5xl tracking-tight text-white mb-4 leading-tight">
          {title}
        </h1>
        <p className="text-gray-300 text-sm md:text-base leading-relaxed max-w-lg mb-8">
          {message}
        </p>

        {/* Countdown Timer Block (if end time is provided) */}
        {endTimeStr && (
          <div className="w-full mb-10">
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 mb-3 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Estimated Reopening In</span>
            </div>

            <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
              {[
                { label: 'Days', val: timeLeft.days },
                { label: 'Hours', val: timeLeft.hours },
                { label: 'Mins', val: timeLeft.minutes },
                { label: 'Secs', val: timeLeft.seconds },
              ].map((item, idx) => (
                <div key={idx} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3 flex flex-col items-center shadow-inner">
                  <span className="font-mono font-extrabold text-2xl md:text-3xl text-amber-400">
                    {String(item.val).padStart(2, '0')}
                  </span>
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-1">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIP Early Access / Notify Me Form */}
        {showNewsletter && (
          <div className="w-full max-w-md bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-6 mb-8 shadow-2xl">
            <h3 className="font-serif font-bold text-sm text-white mb-1">Get VIP Launch Notification</h3>
            <p className="text-xs text-gray-400 mb-4">Enter your email to receive an instant message when our doors reopen.</p>

            {subscribed ? (
              <div className="p-3 bg-green-500/20 border border-green-500/40 rounded-xl text-green-300 text-xs font-bold flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-green-400" />
                <span>{notifyMsg}</span>
              </div>
            ) : (
              <form onSubmit={handleNotifySubmit} className="flex gap-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="flex-1 px-4 py-2.5 rounded-full border border-white/20 bg-black/50 text-white text-xs placeholder:text-gray-500 focus:outline-none focus:border-amber-400"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-gray-950 font-bold text-xs rounded-full flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
                >
                  {submitting ? 'Submitting...' : 'Notify Me'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>
        )}

        {/* Quick Contact & WhatsApp Order Button */}
        {showContact && (
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
            <a
              href={`https://wa.me/${whatsappNum}?text=${encodeURIComponent('Hello! I would like to place an order while the website is undergoing maintenance.')}`}
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-full flex items-center gap-2 transition-all shadow-lg hover:scale-105"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Order via WhatsApp</span>
            </a>

            {settings.instagram_url && (
              <a
                href={settings.instagram_url}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-full flex items-center gap-2 transition-all"
              >
                <span>Follow Instagram Updates</span>
              </a>
            )}
          </div>
        )}
      </main>

      {/* Footer Bar */}
      <footer className="w-full max-w-6xl flex flex-col sm:flex-row justify-between items-center gap-3 z-10 py-4 border-t border-white/10 text-xs text-gray-500">
        <div>
          © {new Date().getFullYear()} {settings.ecommerce_name || 'Dansolam'}. All rights reserved.
        </div>

        {/* Secret Admin Preview Trigger */}
        <button
          type="button"
          onClick={() => setShowBypassModal(true)}
          className="text-gray-500 hover:text-amber-400 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <Lock className="w-3 h-3" />
          <span>Admin Access</span>
        </button>
      </footer>

      {/* Admin Bypass Modal */}
      {showBypassModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-white/20 rounded-2xl p-6 max-w-md w-full font-sans shadow-2xl">
            <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <ShieldCheck className="w-4 h-4" />
                <span>Admin Maintenance Bypass</span>
              </div>
              <button
                type="button"
                onClick={() => setShowBypassModal(false)}
                className="text-gray-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-300 mb-4 leading-relaxed">
              If you are a store administrator or staff member, enter your maintenance preview key or proceed directly to the Admin Dashboard.
            </p>

            <form onSubmit={handleBypassSubmit} className="flex flex-col gap-3">
              <input
                type="password"
                value={bypassInput}
                onChange={(e) => setBypassInput(e.target.value)}
                placeholder="Enter bypass key..."
                className="px-4 py-2.5 rounded-xl border border-white/20 bg-black text-white text-xs focus:outline-none focus:border-amber-400"
              />

              {bypassError && (
                <div className="text-[11px] text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{bypassError}</span>
                </div>
              )}

              <div className="flex gap-2 mt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-gray-950 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Preview Storefront
                </button>
                <a
                  href="/admin/login"
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl flex items-center justify-center text-center transition-all"
                >
                  Admin Login
                </a>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
