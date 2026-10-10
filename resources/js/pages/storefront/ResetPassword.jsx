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
    <div className="bg-[#FAF7FC] dark:bg-[#17101F] min-h-screen pt-28 sm:pt-36 pb-20 px-4 sm:px-6 md:px-12 font-sans transition-colors duration-300">
      <SEO title="Reset Password - Dansolam Beauty Home" description="Enter your password recovery token and set a new password." />
      
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        <Link
          to="/forgot-password"
          className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-[#1E1528] border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-700 dark:text-[#C9BED4] hover:text-white hover:bg-[#5D3E85] hover:border-[#5D3E85] dark:hover:text-white dark:hover:bg-[#5D3E85] shadow-xs transition-all duration-300 self-start btn-spring"
        >
          <ArrowLeft className="w-4 h-4 text-gray-500 dark:text-[#9C90A9] group-hover:text-white transition-all" />
          <span>Back</span>
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
              <span className="text-[10px]  tracking-widest text-[#EC268F] font-extrabold bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 self-start">
                Update Password
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
                  <span className="text-[10px] font-bold text-[#EC268F] tracking-wider ">Beauty Home</span>
                </div>
              )}
            </div>

            {!successMsg ? (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4.5 w-full">
                <div className="text-center">
                  <h1 className="font-extrabold text-2xl text-[#181120] dark:text-[#F3EFF6] leading-none">Reset Password</h1>
                  <p className="text-xs text-gray-400 dark:text-[#9C90A9] mt-2">Enter your 6-digit recovery code and choose a new password.</p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-500 dark:text-[#C9BED4] font-bold  tracking-wider">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="px-4 py-3 rounded-full border-2 border-[#D4C3E2] dark:border-white/20 focus:outline-none focus:border-[#5D3E85] dark:focus:border-[#EC268F] text-xs bg-[#FAF7FC] dark:bg-[#140D1C] text-gray-800 dark:text-[#F3EFF6] font-semibold w-full shadow-xs"
                    placeholder="e.g. fatima@example.com"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-500 dark:text-[#C9BED4] font-bold  tracking-wider">Reset Code (Token)</label>
                  <input
                    type="text"
                    required
                    value={token}
                    onChange={e => setToken(e.target.value)}
                    className="px-4 py-3 rounded-full border-2 border-[#D4C3E2] dark:border-white/20 focus:outline-none focus:border-[#5D3E85] dark:focus:border-[#EC268F] text-xs bg-[#FAF7FC] dark:bg-[#140D1C] text-gray-800 dark:text-[#F3EFF6] font-bold w-full font-mono text-center tracking-widest text-base shadow-xs"
                    placeholder="000000"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="flex flex-col gap-1.5 relative">
                    <label className="text-[10px] text-gray-500 dark:text-[#C9BED4] font-bold  tracking-wider">New Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="pl-4 pr-10 py-3 rounded-full border-2 border-[#D4C3E2] dark:border-white/20 focus:outline-none focus:border-[#5D3E85] dark:focus:border-[#EC268F] text-xs bg-[#FAF7FC] dark:bg-[#140D1C] text-gray-800 dark:text-[#F3EFF6] font-semibold w-full shadow-xs"
                        placeholder="Min 6 chars"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#9C90A9] hover:text-gray-700 dark:hover:text-white cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 relative">
                    <label className="text-[10px] text-gray-500 dark:text-[#C9BED4] font-bold  tracking-wider">Confirm Password</label>
                    <div className="relative">
                      <input
                        type={showPasswordConf ? 'text' : 'password'}
                        required
                        value={passwordConf}
                        onChange={e => setPasswordConf(e.target.value)}
                        className="pl-4 pr-10 py-3 rounded-full border-2 border-[#D4C3E2] dark:border-white/20 focus:outline-none focus:border-[#5D3E85] dark:focus:border-[#EC268F] text-xs bg-[#FAF7FC] dark:bg-[#140D1C] text-gray-800 dark:text-[#F3EFF6] font-semibold w-full shadow-xs"
                        placeholder="Confirm password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswordConf(!showPasswordConf)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#9C90A9] hover:text-gray-700 dark:hover:text-white cursor-pointer"
                      >
                        {showPasswordConf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {errorMsg && <span className="text-xs text-red-500 dark:text-red-400 font-semibold">{errorMsg}</span>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-[#5D3E85] hover:bg-[#EC268F] text-white text-xs font-extrabold rounded-full flex items-center justify-center gap-2 shadow-lg transition-all duration-300 tracking-wider btn-spring mt-1 cursor-pointer"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reset Password'}
                </button>
              </form>
            ) : (
              <div className="flex flex-col gap-5 w-full">
                <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center animate-bounce">
                  <CheckCircle2 className="w-5 h-5" />
                </div>

                <div>
                  <h2 className="font-extrabold text-xl text-[#181120] dark:text-[#F3EFF6] leading-none">Password Reset Complete</h2>
                  <p className="text-xs text-gray-400 dark:text-[#9C90A9] mt-2 leading-relaxed">
                    Your credentials have been successfully updated. You can now use your new password to sign in.
                  </p>
                </div>

                <button
                  onClick={() => navigate('/account')}
                  className="w-full py-3.5 bg-[#5D3E85] hover:bg-[#EC268F] text-white text-xs font-extrabold rounded-full flex items-center justify-center gap-2 shadow-lg transition-all duration-300  tracking-wider btn-spring cursor-pointer"
                >
                  Go to Sign In
                </button>
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
