import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useQueryClient, useQuery } from '@tanstack/react-query';

export default function AdminLogin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { admin, adminLogin, loading } = useAuth();

  // Fetch Settings
  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await fetch('/api/settings');
      return res.json();
    }
  });
  const settings = settingsData?.data?.settings || {};

  const [adminView, setAdminView] = useState('login'); // login, forgot, reset
  const [email, setEmail] = useState(() => localStorage.getItem('fairqueen_remembered_admin_email') || '');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem('fairqueen_remembered_admin_email'));

  // Forgot password form states
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState('');
  const [forgotErrorMsg, setForgotErrorMsg] = useState('');
  const [debugCode, setDebugCode] = useState('');

  // Reset password form states
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConf, setNewPasswordConf] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccessMsg, setResetSuccessMsg] = useState('');
  const [resetErrorMsg, setResetErrorMsg] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetPasswordConf, setShowResetPasswordConf] = useState(false);

  // Redirect if session active
  useEffect(() => {
    if (admin) {
      navigate('/admin');
    }
  }, [admin, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoginLoading(true);

    const res = await adminLogin(email, password, rememberMe);
    setLoginLoading(false);
    
    if (res.success) {
      queryClient.clear();
      navigate('/admin');
    } else {
      setErrorMsg(res.message || 'Authentication failed');
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotErrorMsg('');
    setForgotSuccessMsg('');
    setDebugCode('');

    try {
      const res = await fetch('/api/admin/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email: forgotEmail })
      });
      const data = await res.json();
      setForgotLoading(false);

      if (data.success) {
        setForgotSuccessMsg(data.message);
        if (data.debug_token) {
          setDebugCode(data.debug_token);
        }
      } else {
        setForgotErrorMsg(data.message || 'Unable to request password reset.');
      }
    } catch (err) {
      setForgotLoading(false);
      setForgotErrorMsg('Network error requesting password reset.');
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    setResetErrorMsg('');
    setResetSuccessMsg('');

    if (newPassword !== newPasswordConf) {
      setResetErrorMsg('Passwords do not match');
      setResetLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: forgotEmail || email,
          token: resetToken,
          password: newPassword,
          password_confirmation: newPasswordConf
        })
      });
      const data = await res.json();
      setResetLoading(false);

      if (data.success) {
        setResetSuccessMsg(data.message);
      } else {
        setResetErrorMsg(data.message || 'Unable to reset password. Please check your reset code.');
      }
    } catch (err) {
      setResetLoading(false);
      setResetErrorMsg('Network error resetting your password.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-6 text-gray-800">
      
      {/* Return store button */}
      <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-900 transition-colors mb-6 self-start md:self-auto max-w-4xl w-full">
        <ArrowLeft className="w-3.5 h-3.5" />
        Return to Storefront
      </Link>

      <div className="w-full max-w-4xl bg-white rounded-3xl overflow-hidden shadow-xs flex flex-col md:flex-row min-h-[500px] border border-gray-100/50">
        {/* Left Column: Image/Banner (hidden on mobile) */}
        <div className="hidden md:flex md:w-1/2 relative bg-gray-900 items-end p-8 text-left">
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent z-10" />
          <img loading="eager" decoding="async" fetchPriority="high"
            src={settings.auth_image_url || "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=800"}
            alt="Ecommerce Management Administration"
            className="absolute inset-0 w-full h-full object-cover opacity-80"
          />
          <div className="relative z-20 text-white flex flex-col gap-2">
            <span className="text-[9px] uppercase tracking-widest text-primary font-bold bg-primary/10 px-2.5 py-1 rounded-full border border-primary/15 self-start">
              Admin Portal
            </span>
            <h2 className="font-serif font-bold text-2xl lg:text-3.5xl leading-tight">
              {settings.auth_title || "FairQueen Control Panel"}
            </h2>
            <p className="text-[11px] text-gray-300 font-medium max-w-xs leading-relaxed opacity-90">
              {settings.auth_subtitle || "Sign in with your authorized administrator credentials to manage catalog, orders, and sales reports."}
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

          {adminView === 'login' && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4.5 w-full">
              <div className="text-center">
                <h1 className="font-serif font-bold text-xl text-gray-905 leading-none">Admin Authentication</h1>
                <p className="text-xs text-gray-400 mt-2">Access key metrics, catalog listings, and order fullfilments.</p>
              </div>

              <div className="flex flex-col gap-1.5 mt-2">
                <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-xs bg-[#FAF9F6] text-gray-800 shadow-3xs w-full"
                  placeholder="admin@fairqueen.com"
                />
              </div>

              <div className="flex flex-col gap-1.5 relative">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Password</label>
                  <button type="button" onClick={() => setAdminView('forgot')} className="text-[10px] text-primary hover:underline font-bold cursor-pointer">
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="pl-3 pr-10 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-xs bg-[#FAF9F6] text-gray-800 shadow-3xs w-full"
                    placeholder="••••••••"
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

              <div className="flex items-center gap-2 mt-0.5">
                <input
                  type="checkbox"
                  id="rememberMeAdmin"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="accent-primary rounded text-white border-gray-300 focus:ring-primary w-3.5 h-3.5 cursor-pointer"
                />
                <label htmlFor="rememberMeAdmin" className="text-[10px] text-gray-500 font-bold select-none cursor-pointer">
                  Remember Me
                </label>
              </div>

              {errorMsg && <span className="text-xs text-red-500 font-semibold">{errorMsg}</span>}

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all duration-300 uppercase tracking-wider mt-1 cursor-pointer"
              >
                {loginLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Log In to Panel'}
              </button>
            </form>
          )}

          {adminView === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="flex flex-col gap-4.5 w-full">
              <div className="text-center">
                <h1 className="font-serif font-bold text-xl text-gray-905 leading-none">Admin Recovery</h1>
                <p className="text-xs text-gray-400 mt-2">Enter your email and we'll generate a 6-digit recovery code.</p>
              </div>

              {!forgotSuccessMsg ? (
                <>
                  <div className="flex flex-col gap-1.5 mt-2">
                    <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Email Address</label>
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      className="px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-xs bg-[#FAF9F6] text-gray-800 shadow-3xs w-full"
                      placeholder="admin@fairqueen.com"
                    />
                  </div>

                  {forgotErrorMsg && <span className="text-xs text-red-500 font-semibold">{forgotErrorMsg}</span>}

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full py-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all duration-300 uppercase tracking-wider mt-1 cursor-pointer"
                  >
                    {forgotLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Reset Code'}
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-4">
                  <p className="text-xs text-emerald-600 font-semibold">{forgotSuccessMsg}</p>
                  
                  {debugCode && (
                    <div className="bg-[#FAF3E8]/40 rounded-2xl p-4 border border-primary/10 shadow-3xs flex flex-col gap-2">
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Admin Reset Code:</span>
                      <span className="font-mono text-xl font-bold tracking-widest text-primary text-center my-1">{debugCode}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setResetToken(debugCode);
                      setAdminView('reset');
                    }}
                    className="w-full py-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all duration-300 uppercase tracking-wider cursor-pointer"
                  >
                    Go to Reset Form
                  </button>
                </div>
              )}

              <p className="text-xs text-gray-550 text-center mt-3">
                Remembered credentials?{' '}
                <button type="button" onClick={() => setAdminView('login')} className="text-primary font-bold hover:underline cursor-pointer">
                  Back to Login
                </button>
              </p>
            </form>
          )}

          {adminView === 'reset' && (
            <form onSubmit={handleResetSubmit} className="flex flex-col gap-4.5 w-full">
              <div className="text-center">
                <h1 className="font-serif font-bold text-xl text-gray-905 leading-none">Reset Admin Password</h1>
                <p className="text-xs text-gray-400 mt-2">Enter your 6-digit recovery code and new password.</p>
              </div>

              {!resetSuccessMsg ? (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Reset Code (Token)</label>
                    <input
                      type="text"
                      required
                      value={resetToken}
                      onChange={e => setResetToken(e.target.value)}
                      className="px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-xs bg-[#FAF9F6] text-gray-800 shadow-3xs w-full font-mono text-center tracking-widest text-base"
                      placeholder="000000"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="flex flex-col gap-1.5 relative">
                      <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">New Password</label>
                      <div className="relative">
                        <input
                          type={showResetPassword ? 'text' : 'password'}
                          required
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          className="pl-3 pr-10 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-xs bg-[#FAF9F6] text-gray-800 shadow-3xs w-full"
                          placeholder="Min 6 chars"
                        />
                        <button
                          type="button"
                          onClick={() => setShowResetPassword(!showResetPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-655"
                        >
                          {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 relative">
                      <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Confirm Password</label>
                      <div className="relative">
                        <input
                          type={showResetPasswordConf ? 'text' : 'password'}
                          required
                          value={newPasswordConf}
                          onChange={e => setNewPasswordConf(e.target.value)}
                          className="pl-3 pr-10 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-xs bg-[#FAF9F6] text-gray-800 shadow-3xs w-full"
                          placeholder="Confirm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowResetPasswordConf(!showResetPasswordConf)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-655"
                        >
                          {showResetPasswordConf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {resetErrorMsg && <span className="text-xs text-red-500 font-semibold">{resetErrorMsg}</span>}

                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-full py-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all duration-300 uppercase tracking-wider mt-1 cursor-pointer"
                  >
                    {resetLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reset Password'}
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-4">
                  <p className="text-xs text-emerald-600 font-semibold">{resetSuccessMsg}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setAdminView('login');
                      setResetSuccessMsg('');
                    }}
                    className="w-full py-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all duration-300 uppercase tracking-wider cursor-pointer"
                  >
                    Go to Sign In
                  </button>
                </div>
              )}

              <p className="text-xs text-gray-555 text-center mt-3">
                Remembered credentials?{' '}
                <button type="button" onClick={() => setAdminView('login')} className="text-primary font-bold hover:underline cursor-pointer">
                  Back to Login
                </button>
              </p>
            </form>
          )}

          <div className="text-center text-[10px] text-gray-400 leading-relaxed border-t border-gray-100 pt-4 mt-6">
            <p>© {new Date().getFullYear()} FairQueen Collections Management Panel. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
