import React, { useState } from 'react';
import { toast as systemToast } from '../../components/ui/ToastProvider';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Mail, Phone, MapPin, Clock, Send, MessageSquare, CheckCircle2, Sparkles, Map, Compass } from 'lucide-react';
import SEO from '../../components/seo/SEO';
import FaqSection from '../../components/storefront/FaqSection';
import SocialIcon from '../../components/ui/SocialIcon';
import CaptchaWidget from '../../components/ui/CaptchaWidget';

export default function ContactUs() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const { data: settingsRes } = useQuery({
    queryKey: ['settings'],
    queryFn: () => fetch('/api/settings').then(res => res.json()),
  });
  const settings = settingsRes?.data?.settings || {};
  const socialLinks = [
    { label: 'Instagram', url: settings.instagram_url, network: 'instagram' },
    { label: 'Facebook', url: settings.facebook_url, network: 'facebook' },
    { label: 'TikTok', url: settings.tiktok_url, network: 'tiktok' },
    { label: 'YouTube', url: settings.youtube_url, network: 'youtube' },
    { label: 'X', url: settings.twitter_url, network: 'x' },
  ].filter(item => item.url);

  const contactMutation = useMutation({
    mutationFn: (payload) => {
      return fetch('/api/contact-inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(res => {
        if (!res.ok) throw new Error('Submission failed');
        return res.json();
      });
    },
    onSuccess: (data) => {
      if (data.success) {
        setShowSuccess(true);
        setName('');
        setEmail('');
        setSubject('');
        setMessage('');
      } else {
        systemToast.error(data.message || 'Failed to submit inquiry.');
      }
    },
    onError: () => {
      systemToast.error('An error occurred. Please try again.');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const isCaptchaEnabled = settings.captcha_enabled === 'true' || settings.captcha_enabled === true;
    const isContactEnabled = settings.captcha_on_contact === undefined ? true : (settings.captcha_on_contact === 'true' || settings.captcha_on_contact === true);
    if (isCaptchaEnabled && isContactEnabled && !captchaVerified) {
      systemToast.error('Please complete the security verification challenge before submitting.');
      return;
    }
    contactMutation.mutate({ name, email, subject, message });
  };

  return (
    <div className="bg-[#F5F6F8] min-h-screen font-sans">
      <SEO 
        title="Contact Us - Dansolam"
        description="Get in touch with Dansolam. Contact us for order queries, size guidance, or custom fashion consultations."
      />

      {/* Hero Banner Section */}
      <div className="storefront-page-hero bg-gradient-to-br from-[#FAF3E8] to-white border-b border-gray-100 py-16 text-center">
        <div className="max-w-2xl mx-auto px-6 flex flex-col items-center">
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-3.5 py-1.5 rounded-full flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-primary" />
            Get In Touch
          </span>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 mt-4 tracking-tight leading-none">Contact Us</h1>
          <p className="text-xs text-gray-500 max-w-md mx-auto mt-3 leading-relaxed">
            Have questions about our collections, sizing, or an order? We would love to hear from you. Fill out the form or reach out directly.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Info Column */}
        <div className="md:col-span-5 flex flex-col gap-6 text-left">
          
          {/* Contact Details Card */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-xs flex flex-col gap-6">
            <h3 className="font-serif font-bold text-gray-800 text-lg border-b border-gray-50 pb-3">Contact Details</h3>
            
            <div className="flex flex-col gap-5">
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Ecommerce Address</span>
                  <span className="text-xs text-gray-700 font-semibold block mt-0.5">Plot 1234, Wuse II, Abuja, Nigeria</span>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Email Support</span>
                  <a href="mailto:support@fairqueencollections.com" className="text-xs text-gray-750 font-bold hover:text-primary transition-colors block mt-0.5">
                    support@fairqueencollections.com
                  </a>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">WhatsApp Business</span>
                  <a href="https://wa.me/2348000000000" target="_blank" rel="noopener noreferrer" className="text-xs text-primary font-bold hover:underline block mt-0.5">
                    +234 800 000 0000
                  </a>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Opening Hours</span>
                  <span className="text-xs text-gray-700 font-semibold block mt-0.5">Monday–Saturday: 9:00 AM - 6:00 PM</span>
                  <span className="text-[10px] text-rose-500 font-bold block mt-1 uppercase tracking-wider">Closed on Sundays</span>
                </div>
              </div>
            </div>

            {socialLinks.length > 0 && (
              <div className="border-t border-gray-100 pt-5">
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block mb-3">Connect With Us</span>
                <div className="flex flex-wrap gap-2.5">
                  {socialLinks.map(({ label, url, network }) => (
                    <a key={label} href={url} target="_blank" rel="noopener noreferrer" aria-label={label} title={label} className="w-10 h-10 rounded-full bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/15 flex items-center justify-center transition-all hover:-translate-y-0.5">
                      <SocialIcon network={network} className="w-4.5 h-4.5" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Premium Customer Card */}
          <div className="bg-white dark:bg-[#111111] border border-gray-150 dark:border-gray-800 rounded-2xl p-6 flex flex-col gap-3 shadow-xs">
            <h4 className="font-serif font-bold text-primary text-base flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              Looking for Custom Fitting?
            </h4>
            <p className="text-xs text-gray-650 leading-relaxed">
              We offer bespoke luxury fashion custom consultation at our Abuja showroom. Book a private fitting session via our WhatsApp concierge.
            </p>
            <a
              href="https://wa.me/2348000000000?text=I'd like to book a private fitting consultation"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 self-start px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-[10px] font-bold uppercase tracking-wider rounded-full transition-all shadow-sm flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]"
            >
              Book Fitting Session
            </a>
          </div>
        </div>

        {/* Form Column */}
        <div className="md:col-span-7 text-left">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 shadow-xs flex flex-col gap-6">
            <h3 className="font-serif font-bold text-gray-800 text-lg border-b border-gray-50 pb-3">Send Us a Message</h3>

            {showSuccess ? (
              <div className="bg-green-50/50 border border-green-150 rounded-2xl p-6 text-center flex flex-col items-center gap-3 py-12">
                <CheckCircle2 className="w-12 h-12 text-green-500" />
                <h4 className="font-serif font-bold text-green-800 text-base">Message Submitted!</h4>
                <p className="text-xs text-gray-600 max-w-xs leading-relaxed">
                  Thank you for reaching out. A client support representative will review your message and reply via email within 24 hours.
                </p>
                <button
                  onClick={() => setShowSuccess(false)}
                  className="mt-3 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Your Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. Sandra Okoro"
                      className="px-4 py-2.5 rounded-full border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800 font-semibold"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="e.g. sandra@example.com"
                      className="px-4 py-2.5 rounded-full border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800 font-semibold"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Subject *</label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="e.g. Delivery Status / Custom Order Inquiry"
                    className="px-4 py-2.5 rounded-full border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800 font-semibold"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Message / Detail *</label>
                  <textarea
                    required
                    rows="5"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Write your message details here..."
                    className="px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-850 leading-relaxed resize-none"
                  />
                </div>

                <CaptchaWidget
                  settings={settings}
                  formType="contact"
                  verified={captchaVerified}
                  setVerified={setCaptchaVerified}
                />

                <button
                  type="submit"
                  disabled={contactMutation.isPending || !captchaVerified}
                  className="px-6 py-3 bg-primary hover:bg-primary-hover text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2 hover:scale-[1.02] active:scale-[0.98]"
                >
                  {contactMutation.isPending ? 'Submitting...' : 'Send Message'}
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 pb-12">
        <FaqSection
          title="Questions Before You Reach Out?"
          eyebrow="Quick Answers"
          description="Find immediate guidance about sizing, delivery, payments, exchanges and ecommerce services."
        />
      </div>

      {/* Map Section with Fallback card */}
      <div className="max-w-5xl mx-auto px-6 pb-16">
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-xs overflow-hidden h-[380px] relative group text-center">
          <iframe 
            src="https://maps.google.com/maps?q=Plot%201234%20Wuse%20II%20Abuja%20Nigeria&t=&z=14&ie=UTF8&iwloc=&output=embed" 
            className="w-full h-full rounded-xl border-0 relative z-10"
            allowFullScreen=""
            loading="lazy" decoding="async"
            referrerPolicy="no-referrer-when-downgrade"
            title="Ecommerce Location Map"
          />
          {/* Beautiful fallback block underneath, displayed if iframe fails or is blocked */}
          <div className="absolute inset-0 bg-[#FAF9F6] flex flex-col items-center justify-center gap-3 p-6">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Map className="w-5 h-5" />
            </div>
            <h4 className="font-serif font-bold text-gray-900 text-base">Dansolam Showroom</h4>
            <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
              Plot 1234, Wuse II, Abuja, Nigeria. Locate us on Google Maps for step-by-step directions.
            </p>
            <a 
              href="https://maps.google.com/?q=Plot%201234%20Wuse%20II%20Abuja%20Nigeria" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="mt-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm"
            >
              Open in Google Maps
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
