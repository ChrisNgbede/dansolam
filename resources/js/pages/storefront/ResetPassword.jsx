import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import SEO from '../../components/seo/SEO';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Fetch Settings
  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await fetch('/api/settings');
      return res.json();
    }
  });
  const settings = settingsData?.data?.settings || {};

  // Local state
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConf, setPasswordConf] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConf, setShowPasswordConf] = useState(false);

  // Pre-fill fields from query params
  useEffect(() => {
    const emailParam = searchParams.get('email');
    const codeParam = searchParams.get('code');
    if (emailParam) setEmail(emailParam);
    if (codeParam) setToken(codeParam);
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    if (password !== passwordConf) {
      setErrorMsg('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/customer/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email,
          token,
          password,
          password_confirmation: passwordConf
        })
      });
      const data = await res.json();
      setLoading(false);

      if (data.success) {
        setSuccessMsg(data.message);
      } else {
        setErrorMsg(data.message || 'Unable to reset password. Please check your reset code.');
      }
    } catch (e) {
      setLoading(false);
      setErrorMsg('Network error resetting your password.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 pt-20 pb-16">
      <SEO title="Reset Password" description="Enter your password recovery token and set a new password." />
      
      <Link
        to="/forgot-password"
        className="group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#1a1a1a] border border-gray-200/80 dark:border-gray-800 text-xs font-bold text-gray-700 dark:text-gray-200 hover:text-gray-950 dark:hover:text-gray-950 hover:bg-yellow-400 dark:hover:bg-yellow-400 hover:border-yellow-400 dark:hover:border-yellow-400 shadow-3xs hover:shadow-xs transition-all duration-300 mb-6 self-start"
      >
        <ArrowLeft className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-950 group-hover:-translate-x-0.5 transition-all duration-300" />
        <span>Back</span>
      </Link>

      <div className="bg-white rounded-3xl overflow-hidden shadow-xs flex flex-col md:flex-row min-h-[520px] border border-gray-100/50">
        {/* Left Column: Image/Banner (hidden on mobile) */}
        <div className="hidden md:flex md:w-1/2 relative bg-[#FAF9F6] items-end p-8 text-left">
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent z-10" />
          <img loading="eager" decoding="async" fetchPriority="high"
            src={settings.auth_image_url || "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=800"}
            alt="Ecommerce Fashion Campaign"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="relative z-20 text-white flex flex-col gap-2">
            <span className="text-[9px] uppercase tracking-widest text-primary font-bold bg-primary/10 px-2.5 py-1 rounded-full border border-primary/15 self-start">
              Update Password
            </span>
            <h2 className="font-serif font-bold text-2xl lg:text-3.5xl leading-tight">
              {settings.auth_title || "Find Your Perfect Style Today"}
            </h2>
            <p className="text-[11px] text-gray-300 font-medium max-w-xs leading-relaxed opacity-90">
              {settings.auth_subtitle || "Join Dansolam and start exploring the best hand-curated designer outfits."}
            </p>
          </div>
        </div>

        {/* Right Column: Auth Form */}
        <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col justify-center bg-white">
          <div className="flex flex-col items-center text-center mb-2">
            {settings.logo_url ? (
              <img loading="eager" decoding="async" fetchPriority="high" src={settings.logo_url} alt={settings.ecommerce_name || "Logo"} className="h-10 object-contain mb-4 mx-auto" />
            ) : (
              <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-serif font-bold text-xl mb-4 mx-auto">
                F
              </div>
            )}
          </div>

          {!successMsg ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4.5 w-full">
              <div className="text-center">
                <h1 className="font-serif font-bold text-xl text-gray-905 leading-none">Reset Password</h1>
                <p className="text-xs text-gray-400 mt-2">Enter your 6-digit recovery code and choose a new password.</p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-xs bg-[#FAF9F6] text-gray-800 shadow-3xs w-full"
                  placeholder="e.g. fatima@example.com"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Reset Code (Token)</label>
                <input
                  type="text"
                  required
                  value={token}
                  onChange={e => setToken(e.target.value)}
                  className="px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-xs bg-[#FAF9F6] text-gray-800 shadow-3xs w-full font-mono text-center tracking-widest text-base"
                  placeholder="000000"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="flex flex-col gap-1.5 relative">
                  <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">New Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="pl-3 pr-10 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-xs bg-[#FAF9F6] text-gray-800 shadow-3xs w-full"
                      placeholder="Min 6 chars"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-655 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 relative">
                  <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showPasswordConf ? 'text' : 'password'}
                      required
                      value={passwordConf}
                      onChange={e => setPasswordConf(e.target.value)}
                      className="pl-3 pr-10 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-xs bg-[#FAF9F6] text-gray-800 shadow-3xs w-full"
                      placeholder="Confirm password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordConf(!showPasswordConf)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-655 cursor-pointer"
                    >
                      {showPasswordConf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {errorMsg && <span className="text-xs text-red-500 font-semibold">{errorMsg}</span>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all duration-300 uppercase tracking-wider mt-1 cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reset Password'}
              </button>
            </form>
          ) : (
            <div className="flex flex-col gap-5 w-full">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center animate-bounce">
                <CheckCircle2 className="w-5 h-5" />
              </div>

              <div>
                <h2 className="font-serif font-bold text-xl text-gray-905 leading-none">Password Reset Complete</h2>
                <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                  Your credentials have been successfully updated. You can now use your new password to sign in.
                </p>
              </div>

              <button
                onClick={() => navigate('/account')}
                className="w-full py-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all duration-300 uppercase tracking-wider cursor-pointer"
              >
                Go to Sign In
              </button>
            </div>
          )}

          <p className="text-xs text-gray-555 text-center mt-6">
            Remembered your credentials?{' '}
            <Link to="/account" className="text-primary font-bold hover:underline">
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
