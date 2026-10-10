import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Mail, CheckCircle2, ShieldCheck, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import SEO from '../../components/seo/SEO';

export default function ForgotPassword() {
  const navigate = useNavigate();
  
  // Fetch Settings
  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await fetch('/api/settings');
      return res.json();
    }
  });
  const settings = settingsData?.data?.settings || {};

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/customer/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email: email.trim() })
      });
      const data = await res.json();
      setLoading(false);

      if (data.success) {
        setSubmitted(true);
      } else {
        setErrorMsg(data.message || 'Unable to request password reset. Please try again.');
      }
    } catch (e) {
      setLoading(false);
      setErrorMsg('Network error requesting password reset.');
    }
  };

  return (
    <div className="bg-[#FAF7FC] dark:bg-[#17101F] min-h-screen pt-28 sm:pt-36 pb-20 px-4 sm:px-6 md:px-12 font-sans transition-colors duration-300">
      <SEO title="Forgot Password - Dansolam Beauty Home" description="Request a password reset link or verification code for your Dansolam Beauty Home profile." />
      
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        <Link
          to="/account"
          className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-[#1E1528] border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-700 dark:text-[#C9BED4] hover:text-white hover:bg-[#5D3E85] hover:border-[#5D3E85] dark:hover:text-white dark:hover:bg-[#5D3E85] shadow-xs transition-all duration-300 self-start btn-spring"
        >
          <ArrowLeft className="w-4 h-4 text-gray-500 dark:text-[#9C90A9] group-hover:text-white transition-all" />
          <span>Back to Login</span>
        </Link>

        <div className="bg-white dark:bg-[#1E1528] rounded-[36px] overflow-hidden shadow-2xl flex flex-col md:flex-row min-h-[550px] border border-[#EADBEE] dark:border-white/10 transition-colors duration-300">
          {/* Left Column: Image/Banner (hidden on mobile) */}
          <div className="hidden md:flex md:w-1/2 relative bg-gradient-to-br from-[#5D3E85] via-[#4A2B68] to-[#2A1740] items-end p-10 text-left">
            <div className="absolute inset-0 bg-gradient-to-t from-[#181120] via-[#5D3E85]/40 to-transparent z-10" />
            {(settings.auth_image_url || settingsData?.data?.fallback_auth_image_url) && (
            <img loading="eager" decoding="async" fetchPriority="high" width="600" height="800"
              src={settings.auth_image_url || settingsData?.data?.fallback_auth_image_url}
              alt="Dansolam Beauty Home Campaign"
              className="absolute inset-0 w-full h-full object-cover"
            />
            )}
            <div className="relative z-20 text-white flex flex-col gap-3">
              <span className="text-[10px] tracking-widest text-[#EC268F] font-extrabold bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 self-start">
                Secure Account Recovery
              </span>
              <h2 className="font-extrabold text-3xl leading-tight">
                {settings.auth_title || "Unlock Your Radiant Inner Glow"}
              </h2>
              <p className="text-xs text-white/80 font-medium max-w-xs leading-relaxed">
                {settings.auth_subtitle || "Join Dansolam Beauty Home for 100% organic skincare and body care."}
              </p>
            </div>
          </div>

          {/* Right Column: Auth Form */}
          <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white dark:bg-[#1E1528]">
            <div className="flex flex-col items-center text-center mb-4">
              {settings.logo_url ? (
                <img loading="eager" decoding="async" width="160" height="40" src={settings.logo_url} alt={settings.ecommerce_name || "Logo"} className="h-10 object-contain mb-4 mx-auto" />
              ) : (
                <div className="flex flex-col leading-none text-center mb-4">
                  <span className="font-extrabold text-[#181120] dark:text-[#F3EFF6] text-xl tracking-tight">Dansolam</span>
                  <span className="text-[10px] font-bold text-[#EC268F] tracking-wider">Beauty Home</span>
                </div>
              )}
            </div>

            {!submitted ? (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full">
                <div className="text-center">
                  <h1 className="font-extrabold text-2xl text-[#181120] dark:text-[#F3EFF6] leading-none">Forgot Password</h1>
                  <p className="text-xs text-gray-400 dark:text-[#9C90A9] mt-2">
                    Enter your email address and we'll send you a secure password reset link and verification code.
                  </p>
                </div>

                <div className="flex flex-col gap-1.5 mt-2">
                  <label className="text-[10px] text-gray-500 dark:text-[#C9BED4] font-bold  tracking-wider">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="px-4 py-3 rounded-full border-2 border-[#D4C3E2] dark:border-white/20 focus:outline-none focus:border-[#5D3E85] dark:focus:border-[#EC268F] text-xs bg-[#FAF7FC] dark:bg-[#140D1C] text-gray-800 dark:text-[#F3EFF6] font-semibold w-full transition-colors shadow-xs"
                    placeholder="e.g. fatima@example.com"
                  />
                </div>

                {errorMsg && <span className="text-xs text-red-500 dark:text-red-400 font-semibold text-center">{errorMsg}</span>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-[#5D3E85] hover:bg-[#EC268F] text-white text-xs font-extrabold rounded-full flex items-center justify-center gap-2 shadow-lg transition-all duration-300 tracking-wider mt-1 cursor-pointer btn-spring disabled:opacity-60"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Reset Link'}
                </button>
              </form>
            ) : (
              <div className="flex flex-col gap-5 w-full text-center">
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner">
                  <Mail className="w-7 h-7" />
                </div>

                <div>
                  <h2 className="font-extrabold text-2xl text-[#181120] dark:text-[#F3EFF6] leading-snug">Check Your Email</h2>
                  <p className="text-xs text-gray-500 dark:text-[#9C90A9] mt-2.5 leading-relaxed max-w-sm mx-auto">
                    If an account is associated with <strong className="text-[#5D3E85] dark:text-[#EADBEE]">{email}</strong>, we have sent a secure password reset link and a 6-digit verification code.
                  </p>
                </div>

                <div className="bg-[#FAF7FC] dark:bg-[#140D1C] rounded-2xl p-4 border border-[#EADBEE] dark:border-white/10 text-left flex items-start gap-3 mt-1">
                  <ShieldCheck className="w-5 h-5 text-[#5D3E85] dark:text-[#EC268F] shrink-0 mt-0.5" />
                  <p className="text-[11px] text-gray-500 dark:text-[#C9BED4] leading-relaxed">
                    Check your spam or promotions folder if you don't see it within a few moments. The reset link expires in 60 minutes.
                  </p>
                </div>

                <div className="flex flex-col gap-2.5 mt-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/reset-password?email=${encodeURIComponent(email)}`)}
                    className="w-full py-3.5 bg-[#5D3E85] hover:bg-[#EC268F] text-white text-xs font-extrabold rounded-full flex items-center justify-center gap-2 shadow-lg transition-all duration-300 tracking-wider cursor-pointer btn-spring"
                  >
                    <span>I Have a Reset Code</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setErrorMsg('');
                    }}
                    className="w-full py-2.5 bg-transparent hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-[#C9BED4] text-xs font-bold rounded-full flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Try a different email address</span>
                  </button>
                </div>
              </div>
            )}

            <p className="text-xs text-gray-500 dark:text-[#C9BED4] text-center mt-6 font-medium">
              Remembered your credentials?{' '}
              <Link to="/account" className="text-[#EC268F] font-extrabold hover:underline">
                Log In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
