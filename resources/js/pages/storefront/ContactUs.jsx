import React, { useState } from 'react';
import { toast as systemToast } from '../../components/ui/ToastProvider';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Mail, Phone, Clock, Send, MessageSquare, CheckCircle2, ArrowLeft } from 'lucide-react';
import SEO from '../../components/seo/SEO';
import FaqSection from '../../components/storefront/FaqSection';
import SocialIcon from '../../components/ui/SocialIcon';
import CaptchaWidget from '../../components/ui/CaptchaWidget';
import { useLiveValidation } from '../../hooks/useLiveValidation';
import { FieldMessage, PasswordStrength } from '../../components/ui/FieldMessage';
import * as rules from '../../utils/validators';

export default function ContactUs() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);

  const v = useLiveValidation({ name, email, subject, message }, {
    name: [rules.required('Enter your name.'), rules.maxLength(255)],
    email: [rules.required('Enter your email address so we can reply.'), rules.email()],
    subject: [rules.required('Add a short subject.'), rules.maxLength(255)],
    message: [rules.required('Write your message.'), rules.minLength(10, 'Please add a little more detail (at least 10 characters).')],
  });
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
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      }).then(async res => {
        const data = await res.json().catch(() => null);
        if (res.status === 422) return { success: false, errors: data?.errors, message: data?.message };
        if (!res.ok) throw new Error('Submission failed');
        return data;
      });
    },
    onSuccess: (data) => {
      if (data.success) {
        setShowSuccess(true);
        setName('');
        setEmail('');
        setSubject('');
        setMessage('');
        v.reset();
      } else if (!v.applyServerErrors(data.errors)) {
        systemToast.error(data.message || 'Failed to submit inquiry.');
      }
    },
    onError: () => {
      systemToast.error('An error occurred. Please try again.');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!v.validateAll()) return;
    const isCaptchaEnabled = settings.captcha_enabled === 'true' || settings.captcha_enabled === true;
    const isContactEnabled = settings.captcha_on_contact === undefined ? true : (settings.captcha_on_contact === 'true' || settings.captcha_on_contact === true);
    if (isCaptchaEnabled && isContactEnabled && !captchaVerified) {
      systemToast.error('Please complete the security verification challenge before submitting.');
      return;
    }
    contactMutation.mutate({ name, email, subject, message });
  };

  return (
    <div className="bg-white dark:bg-[#17101F] min-h-screen font-sans pb-20 transition-colors duration-300">
      <SEO
        title="Contact Us - Dansolam Beauty Home"
        description="Get in touch with Dansolam Beauty Home. Contact us with questions about our organic skincare products and orders."
      />

      <div className="max-w-[1400px] mx-auto px-3 sm:px-5 lg:px-6 pt-20 sm:pt-22 md:pt-24 pb-12 flex flex-col gap-6">
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
              Get In Touch
            </span>
            <h1 className="font-serif font-bold text-2xl sm:text-3xl md:text-4xl text-white leading-tight">
              Contact Us
            </h1>
            <p className="text-[11px] sm:text-xs md:text-sm text-gray-200 mt-1 max-w-2xl font-sans leading-snug line-clamp-2">
              Questions about our products, an order or delivery? Our team is here to help.
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
          {/* Info Column */}
          <div className="md:col-span-5 flex flex-col gap-6 text-left">

            {/* Contact Details Card */}
            <div className="bg-white dark:bg-[#1E1528] border border-[#EADBEE] dark:border-white/10 rounded-3xl p-8 shadow-sm flex flex-col gap-6 text-[#221B2B] dark:text-[#F3EFF6]">
              <h3 className="font-extrabold text-[#221B2B] dark:text-[#F3EFF6] text-xl border-b border-gray-100 dark:border-white/10 pb-4">Contact Details</h3>

              <div className="flex flex-col gap-6">

                {(settings.support_email || settings.contact_email) && (
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#5D3E85]/10 dark:bg-[#EC268F]/20 flex items-center justify-center text-[#5D3E85] dark:text-[#EC268F] shrink-0 font-bold">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-400 dark:text-[#9B8EA9] font-bold  tracking-wider block">Email Support</span>
                    <a href={`mailto:${settings.support_email || settings.contact_email}`} className="text-xs text-gray-750 dark:text-[#F3EFF6] font-bold hover:text-[#EC268F] transition-colors block mt-0.5">
                      {settings.support_email || settings.contact_email}
                    </a>
                  </div>
                </div>
                )}

                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#5D3E85]/10 dark:bg-[#EC268F]/20 flex items-center justify-center text-[#5D3E85] dark:text-[#EC268F] shrink-0 font-bold">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-400 dark:text-[#9B8EA9] font-bold  tracking-wider block">WhatsApp Business</span>
                    <a
                      href={`https://wa.me/${String(settings.whatsapp_number || '+234 800 000 0000').replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#5D3E85] dark:text-[#EC268F] font-bold hover:underline block mt-0.5"
                    >
                      {settings.whatsapp_number || '+234 800 000 0000'}
                    </a>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#5D3E85]/10 dark:bg-[#EC268F]/20 flex items-center justify-center text-[#5D3E85] dark:text-[#EC268F] shrink-0 font-bold">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-400 dark:text-[#9B8EA9] font-bold  tracking-wider block">Opening Hours</span>
                    <span className="text-xs text-gray-700 dark:text-[#C9BED4] font-semibold block mt-0.5">{settings.opening_hours || 'Monday–Saturday: 9:00 AM - 6:00 PM'}</span>
                    {(settings.opening_hours_note !== undefined && settings.opening_hours_note !== '') ? (
                      <span className="text-[10px] text-rose-500 dark:text-rose-400 font-bold block mt-1  tracking-wider">{settings.opening_hours_note}</span>
                    ) : (
                      <span className="text-[10px] text-rose-500 dark:text-rose-400 font-bold block mt-1  tracking-wider">Closed on Sundays</span>
                    )}
                  </div>
                </div>
              </div>

              {socialLinks.length > 0 && (
                <div className="border-t border-gray-100 dark:border-white/10 pt-5">
                  <span className="text-[9px] text-gray-400 dark:text-[#9B8EA9] font-bold  tracking-wider block mb-3">Connect With Us</span>
                  <div className="flex flex-wrap gap-2.5">
                    {socialLinks.map(({ label, url, network }) => (
                      <a key={label} href={url} target="_blank" rel="noopener noreferrer" aria-label={label} title={label} className="w-10 h-10 rounded-full bg-[#5D3E85]/10 dark:bg-white/5 hover:bg-[#5D3E85] text-[#5D3E85] dark:text-[#EC268F] hover:text-white border border-[#5D3E85]/15 dark:border-white/10 flex items-center justify-center transition-all hover:-translate-y-0.5 btn-spring">
                        <SocialIcon network={network} className="w-4.5 h-4.5" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Form Column */}
          <div className="md:col-span-7 text-left">
            <div className="bg-white dark:bg-[#1E1528] border border-[#EADBEE] dark:border-white/10 rounded-3xl p-6 md:p-8 shadow-xs flex flex-col gap-6 text-[#221B2B] dark:text-[#F3EFF6]">
              <h3 className="font-extrabold text-[#221B2B] dark:text-[#F3EFF6] text-xl border-b border-gray-100 dark:border-white/10 pb-4">Send Us a Message</h3>

              {showSuccess ? (
                <div className="bg-green-50/50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-3xl p-6 text-center flex flex-col items-center gap-3 py-12">
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
                  <h4 className="font-extrabold text-green-800 dark:text-green-300 text-base">Message Submitted!</h4>
                  <p className="text-xs text-gray-600 dark:text-[#C9BED4] max-w-xs leading-relaxed">
                    Thank you for reaching out. A client support representative will review your message and reply via email within 24 hours.
                  </p>
                  <button
                    onClick={() => setShowSuccess(false)}
                    className="mt-3 px-6 py-2.5 bg-[#5D3E85] hover:bg-[#EC268F] text-white text-xs font-bold rounded-full shadow-sm transition-all btn-spring"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-500 dark:text-[#9B8EA9] font-bold  tracking-wider">Your Name *</label>
                      <input
                        {...v.bind('name')}
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="e.g. Sandra Okoro"
                        className={`px-4 py-3 rounded-full border border-gray-200 dark:border-white/15 focus:outline-none focus:border-[#5D3E85] text-xs bg-white dark:bg-white/5 text-[#221B2B] dark:text-[#F3EFF6] font-semibold transition-colors ${v.stateClass('name')}`}
                      />
                      <FieldMessage {...v.message('name')} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-500 dark:text-[#9B8EA9] font-bold  tracking-wider">Email Address *</label>
                      <input
                        {...v.bind('email')}
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="e.g. sandra@example.com"
                        className={`px-4 py-3 rounded-full border border-gray-200 dark:border-white/15 focus:outline-none focus:border-[#5D3E85] text-xs bg-white dark:bg-white/5 text-[#221B2B] dark:text-[#F3EFF6] font-semibold transition-colors ${v.stateClass('email')}`}
                      />
                      <FieldMessage {...v.message('email')} />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-gray-500 dark:text-[#9B8EA9] font-bold  tracking-wider">Subject *</label>
                    <input
                      {...v.bind('subject')}
                      type="text"
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      placeholder="e.g. Delivery Status / Custom Order Inquiry"
                      className={`px-4 py-3 rounded-full border border-gray-200 dark:border-white/15 focus:outline-none focus:border-[#5D3E85] text-xs bg-white dark:bg-white/5 text-[#221B2B] dark:text-[#F3EFF6] font-semibold transition-colors ${v.stateClass('subject')}`}
                    />
                    <FieldMessage {...v.message('subject')} />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-gray-500 dark:text-[#9B8EA9] font-bold  tracking-wider">Message / Detail *</label>
                    <textarea
                      {...v.bind('message')}
                      rows="5"
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      placeholder="Write your message details here..."
                      className={`px-4 py-3 rounded-2xl border border-gray-200 dark:border-white/15 focus:outline-none focus:border-[#5D3E85] text-xs bg-white dark:bg-white/5 text-[#221B2B] dark:text-[#F3EFF6] leading-relaxed resize-none font-medium transition-colors ${v.stateClass('message')}`}
                    />
                    <FieldMessage {...v.message('message', message ? (message.trim().length < 10 ? `${10 - message.trim().length} more character${10 - message.trim().length === 1 ? '' : 's'} needed` : `${message.length} characters`) : 'At least 10 characters.')} />
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
                    className="px-8 py-4 bg-[#5D3E85] hover:bg-[#EC268F] text-white text-xs font-extrabold tracking-widest rounded-full shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2 btn-spring"
                  >
                    {contactMutation.isPending ? 'Submitting...' : 'Send Message'}
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>

        <section className="max-w-5xl mx-auto w-full px-0 sm:px-6 pb-12">
          <FaqSection
            title="Questions Before You Reach Out?"
            eyebrow="Quick Answers"
            description="Find quick answers about orders, payments, delivery and our products."
          />
        </section>

      </div>
    </div>
  );
}
