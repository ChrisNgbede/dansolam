import { getCurrencySymbol } from '../../utils/currency';
import React, { useState, useEffect } from 'react';
import { toast as systemToast } from '../../components/ui/ToastProvider';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, ShoppingBag, MapPin, Heart, LogOut, ArrowRight, Trash2, Plus, Loader2, Scissors, Check, Eye, EyeOff, Bell, CheckCircle, CreditCard, ShieldCheck } from 'lucide-react';
import { useAuth, apiFetch } from '../../hooks/useAuth';
import { ProductCard } from './Home';
import SEO from '../../components/seo/SEO';

export default function Account() {
  const currencySymbol = getCurrencySymbol();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch Settings
  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await fetch('/api/settings');
      return res.json();
    }
  });
  const settings = settingsData?.data?.settings || {};

  // Auth contexts
  const { customer, loading: authLoading, customerLogin, customerRegister, customerLogout } = useAuth();

  // Local state
  const [activeTab, setActiveTab] = useState('orders'); // orders, addresses, wishlist, measurements, notifications
  const [loginTab, setLoginTab] = useState(true); // true = login, false = register
  const [pushEnabled, setPushEnabled] = useState(() => {
    return typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';
  });

  const handleTogglePushNotifications = async () => {
    if (!('Notification' in window)) {
      systemToast.error('Browser push notifications are not supported on this device.');
      return;
    }
    if (Notification.permission === 'granted') {
      systemToast.info('Push notifications are already active on this browser.');
      setPushEnabled(true);
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        setPushEnabled(true);
        systemToast.success('Push notifications enabled successfully!');
        new Notification('Dansolam Beauty Home', {
          body: 'You will receive real-time order tracking & delivery notifications here.',
          icon: '/favicon.ico'
        });
      } else {
        systemToast.error('Notification permission was declined.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Login form states
  const [loginEmail, setLoginEmail] = useState(() => localStorage.getItem('dansolam_remembered_email') || '');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem('dansolam_remembered_email'));

  // Register form states
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPasswordConf, setRegPasswordConf] = useState('');
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  // Password visibility states
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegPasswordConf, setShowRegPasswordConf] = useState(false);

  // Address form states
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressLine, setAddressLine] = useState('');
  const [addressCity, setAddressCity] = useState('');
  const [addressState, setAddressState] = useState('');
  const [addressCountry, setAddressCountry] = useState('');
  const [addressDefault, setAddressDefault] = useState(true);
  const [addressLoading, setAddressLoading] = useState(false);

  // Skin Profile states
  const [skinType, setSkinType] = useState('Combination');
  const [skinGoal, setSkinGoal] = useState('Radiant Glow');
  const [skinConcern, setSkinConcern] = useState('Dark Spots & Hyperpigmentation');
  const [preferredFormulation, setPreferredFormulation] = useState('Rich Creams & Serums');
  const [skinNotes, setSkinNotes] = useState('');
  const [measSuccess, setMeasSuccess] = useState(false);
  const [measLoading, setMeasLoading] = useState(false);

  // Fetch queries (only enabled if customer authenticated)
  const isAuth = !!customer;

  const { data: ordersRes } = useQuery({
    queryKey: ['customer-orders'],
    enabled: isAuth,
    queryFn: () => apiFetch('/api/customer/orders').then(res => res.json())
  });

  const { data: addressesRes } = useQuery({
    queryKey: ['customer-addresses'],
    enabled: isAuth,
    queryFn: () => apiFetch('/api/customer/addresses').then(res => res.json())
  });

  const { data: wishlistRes } = useQuery({
    queryKey: ['customer-wishlist'],
    enabled: isAuth,
    queryFn: () => apiFetch('/api/customer/wishlist').then(res => res.json())
  });

  const orders = ordersRes?.data || [];
  const addresses = addressesRes?.data || [];
  const wishlist = wishlistRes?.data || [];

  // Populate skin profile once user is loaded
  useEffect(() => {
    if (customer?.measurements) {
      const m = customer.measurements;
      setSkinType(m.skin_type || m.fit_preference || 'Combination');
      setSkinGoal(m.skin_goal || m.bust || 'Radiant Glow');
      setSkinConcern(m.skin_concern || m.waist || 'Dark Spots & Hyperpigmentation');
      setPreferredFormulation(m.preferred_formulation || m.hips || 'Rich Creams & Serums');
      setSkinNotes(m.skin_notes || m.height || '');
    }
  }, [customer]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    const res = await customerLogin(loginEmail, loginPassword, rememberMe);
    setLoginLoading(false);
    if (res.success) {
      queryClient.invalidateQueries(['customer-orders', 'customer-addresses', 'customer-wishlist', 'customer-profile']);
    } else {
      setLoginError(res.message || 'Login failed');
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegError('');

    if (regPassword !== regPasswordConf) {
      setRegError('Passwords do not match');
      return;
    }

    setRegLoading(true);
    const res = await customerRegister(regName, regEmail, regPhone, regPassword, regPasswordConf);
    setRegLoading(false);

    if (res.success) {
      queryClient.invalidateQueries(['customer-orders', 'customer-addresses', 'customer-wishlist', 'customer-profile']);
    } else {
      setRegError(res.message || 'Registration failed');
    }
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    setAddressLoading(true);

    try {
      const res = await apiFetch('/api/customer/addresses', {
        method: 'POST',
        body: JSON.stringify({
          address_line_1: addressLine,
          city: addressCity,
          state: addressState,
          country: addressCountry,
          is_default: addressDefault
        })
      });
      const data = await res.json();
      setAddressLoading(false);

      if (data.success) {
        setShowAddressForm(false);
        setAddressLine('');
        setAddressCity('');
        queryClient.invalidateQueries(['customer-addresses']);
      } else {
        systemToast.error(data.message || 'Adding address failed');
      }
    } catch (e) {
      setAddressLoading(false);
      systemToast.error('Network error adding address');
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    try {
      const res = await apiFetch(`/api/customer/addresses/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        queryClient.invalidateQueries(['customer-addresses']);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMeasurementsSubmit = async (e) => {
    e.preventDefault();
    setMeasLoading(true);
    setMeasSuccess(false);

    try {
      const res = await apiFetch('/api/customer/measurements', {
        method: 'PUT',
        body: JSON.stringify({
          skin_type: skinType,
          skin_goal: skinGoal,
          skin_concern: skinConcern,
          preferred_formulation: preferredFormulation,
          skin_notes: skinNotes,
          // backwards compatibility fallbacks
          fit_preference: skinType,
          bust: skinGoal,
          waist: skinConcern,
          hips: preferredFormulation,
          height: skinNotes,
        })
      });
      const data = await res.json();
      setMeasLoading(false);

      if (data.success) {
        setMeasSuccess(true);
        queryClient.invalidateQueries(['customer-profile']);
        setTimeout(() => setMeasSuccess(false), 4000);
      } else {
        systemToast.error(data.message || 'Saving skin profile failed');
      }
    } catch (e) {
      setMeasLoading(false);
      systemToast.error('Connection error saving skin profile');
    }
  };

  if (authLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-24 flex items-center justify-center animate-pulse text-gray-400">
        Loading customer session...
      </div>
    );
  }

  // =========================================================================
  // GUEST MODE (Login/Register Forms)
  // =========================================================================
  if (!customer) {
    return (
      <div className="bg-white dark:bg-[#17101F] min-h-screen pt-28 sm:pt-36 pb-20 px-4 sm:px-6 md:px-12 font-sans transition-colors duration-300">
        <SEO title="Sign In / Register | Dansolam Beauty Home" description="Log in or create a customer profile to view your orders, wishlist, and account settings." />
        <div className="max-w-5xl mx-auto">

          <div className="bg-white dark:bg-[#1E1528] rounded-[36px] overflow-hidden shadow-2xl flex flex-col md:flex-row min-h-[580px] border border-[#EADBEE] dark:border-white/10 text-left">
            {/* Left Column: Image/Banner (hidden on mobile) */}
            <div className="hidden md:flex md:w-1/2 relative bg-gradient-to-br from-[#5D3E85] via-[#4A2B68] to-[#2A1740] items-end p-10 text-left">
              <div className="absolute inset-0 bg-gradient-to-t from-[#17101F] via-[#5D3E85]/40 to-transparent z-10" />
              {(settings.auth_image_url || settingsData?.data?.fallback_auth_image_url) && (
              <img loading="eager" decoding="async" fetchPriority="high" width="600" height="800"
                src={settings.auth_image_url || settingsData?.data?.fallback_auth_image_url}
                alt="Dansolam Beauty Home Campaign"
                className="absolute inset-0 w-full h-full object-cover"
              />
              )}
              <div className="relative z-20 text-white flex flex-col gap-3">
                <span className="text-[10px]  tracking-widest text-[#EC268F] font-extrabold bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 self-start">
                  SHOP Member
                </span>
                <h2 className="font-extrabold text-3xl leading-tight">
                  {settings.auth_title || "Unlock Your Radiant Inner Glow"}
                </h2>
                <p className="text-xs text-white/80 font-medium max-w-xs leading-relaxed">
                  {settings.auth_subtitle || "Join Dansolam Beauty Home for 100% organic skincare and body care."}
                </p>
              </div>
            </div>

            {/* Right Column: Auth Forms */}
            <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white dark:bg-[#1E1528] text-[#221B2B] dark:text-[#F3EFF6]">
              <div className="flex flex-col items-center text-center mb-4">
                {settings.logo_url ? (
                  <img loading="eager" decoding="async" width="160" height="40" src={settings.logo_url} alt={settings.ecommerce_name || "Logo"} className="h-10 object-contain mb-4 mx-auto" />
                ) : (
                  <div className="flex flex-col leading-none text-center mb-4">
                    <span className="font-extrabold text-[#221B2B] dark:text-[#F3EFF6] text-xl tracking-tight">Dansolam</span>
                    <span className="text-[10px] font-bold text-[#EC268F] tracking-wider ">Beauty Home</span>
                  </div>
                )}
              </div>

              {loginTab ? (
                /* LOGIN FORM */
                <form onSubmit={handleLoginSubmit} className="flex flex-col gap-5 w-full text-left">
                  <div className="text-center">
                    <h2 className="font-extrabold text-2xl text-[#221B2B] dark:text-[#F3EFF6] leading-none">Welcome Back</h2>
                    <p className="text-xs text-gray-400 dark:text-[#9B8EA9] mt-2">Sign in to check past orders, edit shipping addresses, or view your wishlist.</p>
                  </div>

                  <div className="flex flex-col gap-1.5 mt-2">
                    <label className="text-[10px] text-gray-500 dark:text-[#9B8EA9] font-bold  tracking-wider">Email Address</label>
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      className="px-4 py-3 rounded-full border border-gray-200 dark:border-white/15 focus:outline-none focus:border-[#5D3E85] text-xs bg-[#FAF7FC] dark:bg-white/5 text-[#221B2B] dark:text-[#F3EFF6] font-semibold w-full"
                      placeholder="e.g. fatima@example.com"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 relative">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] text-gray-500 dark:text-[#9B8EA9] font-bold  tracking-wider">Password</label>
                      <Link to="/forgot-password" className="text-[10px] text-[#EC268F] hover:underline font-extrabold">
                        Forgot Password?
                      </Link>
                    </div>
                    <div className="relative">
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        required
                        value={loginPassword}
                        onChange={e => setLoginPassword(e.target.value)}
                        className="pl-4 pr-10 py-3 rounded-full border border-gray-200 dark:border-white/15 focus:outline-none focus:border-[#5D3E85] text-xs bg-[#FAF7FC] dark:bg-white/5 text-[#221B2B] dark:text-[#F3EFF6] font-semibold w-full"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer"
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-0.5">
                    <input
                      type="checkbox"
                      id="rememberMe"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      className="accent-[#5D3E85] rounded text-white border-gray-300 dark:border-white/20 focus:ring-[#5D3E85] w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="rememberMe" className="text-[10px] text-gray-500 dark:text-[#9B8EA9] font-bold select-none cursor-pointer">
                      Remember Me
                    </label>
                  </div>

                  {loginError && <span className="text-[10px] text-red-500 font-semibold">{loginError}</span>}

                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full py-4 bg-[#5D3E85] hover:bg-[#EC268F] text-white text-xs font-extrabold rounded-full flex items-center justify-center gap-2 shadow-lg transition-all duration-300 tracking-wider mt-1 cursor-pointer btn-spring"
                  >
                    {loginLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Log In'}
                  </button>

                  <p className="text-xs text-gray-500 dark:text-[#9B8EA9] text-center mt-2.5">
                    Don't have an account?{' '}
                    <button type="button" onClick={() => setLoginTab(false)} className="text-[#EC268F] font-extrabold hover:underline cursor-pointer">
                      Register
                    </button>
                  </p>
                </form>
              ) : (
                /* REGISTER FORM */
                <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-4 w-full text-left">
                  <div className="text-center">
                    <h2 className="font-extrabold text-2xl text-[#221B2B] dark:text-[#F3EFF6] leading-none">Create Your Account</h2>
                    <p className="text-xs text-gray-400 dark:text-[#9B8EA9] mt-2">Create an account to store addresses, save sizes, and access fast checkouts.</p>
                  </div>

                  <div className="flex flex-col gap-1.5 mt-1">
                    <label className="text-[10px] text-gray-500 dark:text-[#9B8EA9] font-bold  tracking-wider">Full Name</label>
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={e => setRegName(e.target.value)}
                      className="px-4 py-3 rounded-full border border-gray-200 dark:border-white/15 focus:outline-none focus:border-[#5D3E85] text-xs bg-[#FAF7FC] dark:bg-white/5 text-[#221B2B] dark:text-[#F3EFF6] font-semibold w-full"
                      placeholder="e.g. Fatima Abubakar"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-500 dark:text-[#9B8EA9] font-bold  tracking-wider">Email Address</label>
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={e => setRegEmail(e.target.value)}
                        className="px-4 py-3 rounded-full border border-gray-200 dark:border-white/15 focus:outline-none focus:border-[#5D3E85] text-xs bg-[#FAF7FC] dark:bg-white/5 text-[#221B2B] dark:text-[#F3EFF6] font-semibold w-full"
                        placeholder="e.g. fatima@example.com"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-500 dark:text-[#9B8EA9] font-bold  tracking-wider">Phone Number</label>
                      <input
                        type="tel"
                        value={regPhone}
                        onChange={e => setRegPhone(e.target.value)}
                        className="px-4 py-3 rounded-full border border-gray-200 dark:border-white/15 focus:outline-none focus:border-[#5D3E85] text-xs bg-[#FAF7FC] dark:bg-white/5 text-[#221B2B] dark:text-[#F3EFF6] font-semibold w-full"
                        placeholder="e.g. +234 80 1234 5678"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="flex flex-col gap-1.5 relative">
                      <label className="text-[10px] text-gray-500 dark:text-[#9B8EA9] font-bold  tracking-wider">Password</label>
                      <div className="relative">
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          required
                          value={regPassword}
                          onChange={e => setRegPassword(e.target.value)}
                          className="pl-4 pr-10 py-3 rounded-full border border-gray-200 dark:border-white/15 focus:outline-none focus:border-[#5D3E85] text-xs bg-[#FAF7FC] dark:bg-white/5 text-[#221B2B] dark:text-[#F3EFF6] font-semibold w-full"
                          placeholder="Min 6 chars"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer"
                        >
                          {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 relative">
                      <label className="text-[10px] text-gray-500 dark:text-[#9B8EA9] font-bold  tracking-wider">Confirm Password</label>
                      <div className="relative">
                        <input
                          type={showRegPasswordConf ? 'text' : 'password'}
                          required
                          value={regPasswordConf}
                          onChange={e => setRegPasswordConf(e.target.value)}
                          className="pl-4 pr-10 py-3 rounded-full border border-gray-200 dark:border-white/15 focus:outline-none focus:border-[#5D3E85] text-xs bg-[#FAF7FC] dark:bg-white/5 text-[#221B2B] dark:text-[#F3EFF6] font-semibold w-full"
                          placeholder="Confirm password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPasswordConf(!showRegPasswordConf)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer"
                        >
                          {showRegPasswordConf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {regError && <span className="text-[10px] text-red-500 font-semibold">{regError}</span>}

                  <button
                    type="submit"
                    disabled={regLoading}
                    className="w-full py-4 bg-[#5D3E85] hover:bg-[#EC268F] text-white text-xs font-extrabold rounded-full flex items-center justify-center gap-2 shadow-lg transition-all duration-300 tracking-wider mt-2 cursor-pointer btn-spring"
                  >
                    {regLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Account'}
                  </button>

                  <p className="text-xs text-gray-500 dark:text-[#9B8EA9] text-center mt-2 font-medium">
                    Already registered?{' '}
                    <button type="button" onClick={() => setLoginTab(true)} className="text-[#EC268F] font-extrabold hover:underline cursor-pointer">
                      Sign In Here
                    </button>
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // LOGGED-IN CUSTOMER PORTAL
  // =========================================================================
  return (
    <div className="bg-white dark:bg-[#17101F] min-h-screen pt-28 sm:pt-36 pb-20 px-4 sm:px-6 md:px-12 font-sans transition-colors duration-300">
      <SEO title="Customer Portal | Dansolam Beauty Home" description="Manage your customer account, size profiles, saved addresses and order inquiries." />
      <div className="max-w-7xl mx-auto flex flex-col gap-8 text-left">

        {/* Profile Header card */}
        <div className="bg-white dark:bg-[#1E1528] border border-[#EADBEE] dark:border-white/10 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#5D3E85]/10 dark:bg-[#EC268F]/20 rounded-full flex items-center justify-center text-[#5D3E85] dark:text-[#EC268F] text-lg font-extrabold">
              {customer.name[0]}
            </div>
            <div>
              <h2 className="font-extrabold text-[#221B2B] dark:text-[#F3EFF6] text-base">{customer.name}</h2>
              <p className="text-xs text-gray-400 dark:text-[#9B8EA9]">{customer.email} {customer.phone && `| ${customer.phone}`}</p>
            </div>
          </div>

          <button
            onClick={customerLogout}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-full text-xs font-bold text-red-600 dark:text-red-400 transition-all self-start sm:self-center cursor-pointer btn-spring"
          >
            <LogOut className="w-3.5 h-3.5" />
            Log Out
          </button>
        </div>

        {/* Tabs selectors */}
        <div className="flex border-b border-gray-200 dark:border-white/10 text-xs font-bold text-gray-400 dark:text-[#9B8EA9] overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-1.5 pb-2.5 px-4 border-b-2 transition-all cursor-pointer ${activeTab === 'orders' ? 'border-[#5D3E85] dark:border-[#EC268F] text-[#5D3E85] dark:text-[#EC268F]' : 'border-transparent hover:text-gray-600 dark:hover:text-white'
              }`}
          >
            <ShoppingBag className="w-4 h-4" />
            My Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('addresses')}
            className={`flex items-center gap-1.5 pb-2.5 px-4 border-b-2 transition-all cursor-pointer ${activeTab === 'addresses' ? 'border-[#5D3E85] dark:border-[#EC268F] text-[#5D3E85] dark:text-[#EC268F]' : 'border-transparent hover:text-gray-600 dark:hover:text-white'
              }`}
          >
            <MapPin className="w-4 h-4" />
            Addresses ({addresses.length})
          </button>
          <button
            onClick={() => setActiveTab('wishlist')}
            className={`flex items-center gap-1.5 pb-2.5 px-4 border-b-2 transition-all cursor-pointer ${activeTab === 'wishlist' ? 'border-[#5D3E85] dark:border-[#EC268F] text-[#5D3E85] dark:text-[#EC268F]' : 'border-transparent hover:text-gray-600 dark:hover:text-white'
              }`}
          >
            <Heart className="w-4 h-4" />
            Wishlist ({wishlist.length})
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-1.5 pb-2.5 px-4 border-b-2 transition-all cursor-pointer ${activeTab === 'notifications' ? 'border-[#5D3E85] dark:border-[#EC268F] text-[#5D3E85] dark:text-[#EC268F]' : 'border-transparent hover:text-gray-600 dark:hover:text-white'
              }`}
          >
            <Bell className="w-4 h-4" />
            Notifications
          </button>
          <button
            onClick={() => setActiveTab('measurements')}
            className={`flex items-center gap-1.5 pb-2.5 px-4 border-b-2 transition-all cursor-pointer ${activeTab === 'measurements' ? 'border-[#5D3E85] dark:border-[#EC268F] text-[#5D3E85] dark:text-[#EC268F]' : 'border-transparent hover:text-gray-600 dark:hover:text-white'
              }`}
          >
            <User className="w-4 h-4" />
            Skin Profile
          </button>
        </div>

        {/* TAB 1: ORDER HISTORY */}
        {activeTab === 'orders' && (
          <div className="flex flex-col gap-4 animate-fade-in">
            {orders.length > 0 ? (
              orders.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-white dark:bg-[#1E1528] border border-[#EADBEE] dark:border-white/10 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex flex-col gap-1.5 text-xs text-gray-600 dark:text-[#C9BED4]">
                    <div className="flex items-center gap-3">
                      <strong className="text-[#221B2B] dark:text-[#F3EFF6] text-sm">#{ord.order_number}</strong>
                      <span className="font-extrabold px-2.5 py-0.5 rounded-full bg-[#5D3E85]/10 dark:bg-[#EC268F]/15 text-[#5D3E85] dark:text-[#EC268F] capitalize text-[10px]">
                        {ord.order_status.replace('_', ' ')}
                      </span>
                    </div>
                    <p>📅 Date: {new Date(ord.created_at).toLocaleDateString()}</p>
                    <p>💳 Payment status: <span className={ord.payment_status === 'paid' ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-amber-500 font-semibold'}>{ord.payment_status.toUpperCase()}</span></p>
                    <p>💵 Total: <span className="font-bold text-[#221B2B] dark:text-[#F3EFF6]">{currencySymbol}{parseFloat(ord.total_amount).toLocaleString()}</span></p>
                  </div>

                  <Link
                    to={`/order-tracking?order_number=${ord.order_number}&contact=${encodeURIComponent(customer.email)}`}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#5D3E85] hover:bg-[#EC268F] text-white text-xs font-bold rounded-full shadow-sm transition-all btn-spring"
                  >
                    Track Order
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))
            ) : (
              <div className="bg-white dark:bg-[#1E1528] border border-[#EADBEE] dark:border-white/10 rounded-2xl p-12 text-center text-xs text-gray-400 dark:text-[#9B8EA9] italic">
                You haven't placed any orders yet.
              </div>
            )}
          </div>
        )}

        {/* TAB: NOTIFICATIONS & SYSTEM ALERTS */}
        {activeTab === 'notifications' && (
          <div className="flex flex-col gap-6 animate-fade-in">
            {/* Push Notification Opt-in Card */}
            <div className="bg-white dark:bg-[#1E1528] border border-[#EADBEE] dark:border-white/10 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-[#5D3E85]/10 dark:bg-[#EC268F]/20 text-[#5D3E85] dark:text-[#EC268F] flex items-center justify-center shrink-0">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-[#221B2B] dark:text-[#F3EFF6]">Browser Push Notifications</h4>
                  <p className="text-xs text-gray-500 dark:text-[#9B8EA9]">Receive instant status updates on your order packing & dispatch.</p>
                </div>
              </div>
              <button
                onClick={handleTogglePushNotifications}
                className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer btn-spring ${pushEnabled
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-[#5D3E85] text-white hover:bg-[#EC268F]'
                  }`}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                {pushEnabled ? 'Push Active on Device' : 'Enable Push Notifications'}
              </button>
            </div>

            {/* In-App Notifications Feed from Customer Orders & Invoices */}
            <div className="flex flex-col gap-3">
              <h4 className="font-extrabold text-xs  tracking-wider text-gray-400 dark:text-[#9B8EA9] px-1">Recent Activity & Order Alerts</h4>
              {orders.length > 0 ? (
                orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="bg-white dark:bg-[#1E1528] border border-[#EADBEE] dark:border-white/10 rounded-2xl p-5 shadow-xs flex items-start gap-4"
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-xs ${ord.payment_status === 'paid' ? 'bg-emerald-600' : 'bg-amber-500'
                      }`}>
                      {ord.payment_status === 'paid' ? '✓' : '!'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <strong className="text-xs font-bold text-[#221B2B] dark:text-[#F3EFF6]">
                          {ord.payment_status === 'paid'
                            ? `Order #${ord.order_number} Payment Confirmed & Invoice Issued`
                            : `Order #${ord.order_number} Pending Payment`}
                        </strong>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {new Date(ord.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-[#9B8EA9] mt-1 leading-relaxed">
                        Your order for <strong className="text-[#5D3E85] dark:text-[#EC268F]">{currencySymbol}{parseFloat(ord.total_amount).toLocaleString()}</strong> via {ord.payment_method.toUpperCase()} is currently marked as <span className="font-semibold capitalize text-gray-700 dark:text-gray-300">{ord.order_status.replace('_', ' ')}</span>.
                      </p>
                      <div className="flex items-center gap-3 mt-3">
                        <Link
                          to={`/order-tracking?order_number=${ord.order_number}&contact=${encodeURIComponent(customer.email)}`}
                          className="text-xs font-bold text-[#5D3E85] dark:text-[#EC268F] hover:underline inline-flex items-center gap-1"
                        >
                          Live Tracking &rarr;
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white dark:bg-[#1E1528] border border-[#EADBEE] dark:border-white/10 rounded-2xl p-8 text-center text-xs text-gray-400 dark:text-[#9B8EA9] italic">
                  No activity alerts at this time.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: ADDRESS BOOK */}
        {activeTab === 'addresses' && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <button
              onClick={() => setShowAddressForm(!showAddressForm)}
              className="self-start inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#5D3E85] hover:bg-[#EC268F] text-white text-xs font-extrabold rounded-full shadow-sm transition-all cursor-pointer btn-spring"
            >
              <Plus className="w-4 h-4" />
              Add New Address
            </button>

            {/* Add Address Form overlay */}
            {showAddressForm && (
              <form onSubmit={handleAddressSubmit} className="bg-white dark:bg-[#1E1528] border border-[#EADBEE] dark:border-white/10 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
                <h4 className="font-extrabold text-xs text-[#221B2B] dark:text-[#F3EFF6]  border-b border-gray-100 dark:border-white/10 pb-2">Add New Shipping Address</h4>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-500 dark:text-[#9B8EA9] font-bold ">Address Line 1</label>
                  <input
                    type="text"
                    required
                    value={addressLine}
                    onChange={e => setAddressLine(e.target.value)}
                    className="px-3 py-2 rounded-full border border-gray-200 dark:border-white/15 focus:outline-none focus:border-[#5D3E85] text-xs bg-white dark:bg-white/5 text-[#221B2B] dark:text-[#F3EFF6]"
                    placeholder="e.g. Apartment, suite, street address"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-gray-500 dark:text-[#9B8EA9] font-bold ">City</label>
                    <input
                      type="text"
                      required
                      value={addressCity}
                      onChange={e => setAddressCity(e.target.value)}
                      className="px-3 py-2 rounded-full border border-gray-200 dark:border-white/15 focus:outline-none focus:border-[#5D3E85] text-xs bg-white dark:bg-white/5 text-[#221B2B] dark:text-[#F3EFF6]"
                      placeholder="e.g. London"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-gray-500 dark:text-[#9B8EA9] font-bold ">State</label>
                    <input
                      type="text"
                      required
                      value={addressState}
                      onChange={e => setAddressState(e.target.value)}
                      className="px-3.5 py-2.5 rounded-full border border-gray-200 dark:border-white/15 focus:outline-none focus:border-[#5D3E85] text-xs bg-white dark:bg-white/5 text-[#221B2B] dark:text-[#F3EFF6]"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-gray-500 dark:text-[#9B8EA9] font-bold ">Country</label>
                    <input
                      type="text"
                      required
                      value={addressCountry}
                      onChange={e => setAddressCountry(e.target.value)}
                      className="px-3.5 py-2.5 rounded-full border border-gray-200 dark:border-white/15 focus:outline-none focus:border-[#5D3E85] text-xs bg-white dark:bg-white/5 text-[#221B2B] dark:text-[#F3EFF6]"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-600 dark:text-[#C9BED4]">
                  <input
                    type="checkbox"
                    checked={addressDefault}
                    onChange={e => setAddressDefault(e.target.checked)}
                    className="rounded border-gray-300 dark:border-white/20 text-[#5D3E85] w-4 h-4"
                  />
                  Set as Default shipping address
                </label>

                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowAddressForm(false)}
                    className="px-4 py-2 border border-gray-200 dark:border-white/15 rounded-full text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addressLoading}
                    className="px-5 py-2 bg-[#5D3E85] hover:bg-[#EC268F] text-white text-xs font-extrabold rounded-full flex items-center justify-center gap-1.5 cursor-pointer btn-spring"
                  >
                    {addressLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Address'}
                  </button>
                </div>
              </form>
            )}

            {/* List Addresses */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {addresses.length > 0 ? (
                addresses.map((addr) => (
                  <div key={addr.id} className="bg-white dark:bg-[#1E1528] border border-[#EADBEE] dark:border-white/10 rounded-2xl p-5 shadow-sm flex flex-col gap-3 relative">
                    {addr.is_default && (
                      <span className="absolute top-4 right-4 bg-[#5D3E85]/10 dark:bg-[#EC268F]/15 text-[#5D3E85] dark:text-[#EC268F] text-[9px] font-extrabold px-2.5 py-0.5 rounded-full">
                        Default
                      </span>
                    )}

                    <div className="text-xs text-gray-600 dark:text-[#C9BED4] flex flex-col gap-1 pr-12">
                      <p className="font-bold text-[#221B2B] dark:text-[#F3EFF6]">{addr.address_line_1}</p>
                      <p>{addr.city}, {addr.state}</p>
                      <p>{addr.country}</p>
                    </div>

                    <button
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="self-start inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 rounded-full transition-all mt-2 cursor-pointer btn-spring"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                ))
              ) : (
                <div className="bg-white dark:bg-[#1E1528] border border-[#EADBEE] dark:border-white/10 rounded-2xl p-12 text-center text-xs text-gray-400 dark:text-[#9B8EA9] italic sm:col-span-2">
                  No addresses saved yet. Add shipping address to speed up checkouts.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: WISHLIST */}
        {activeTab === 'wishlist' && (
          <div className="animate-fade-in">
            {wishlist.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {wishlist.map((prod) => (
                  <ProductCard key={prod.id} product={prod} />
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-[#1E1528] border border-[#EADBEE] dark:border-white/10 rounded-2xl p-12 text-center text-xs text-gray-400 dark:text-[#9B8EA9] italic">
                Your wishlist is currently empty. Start adding pieces to buy later.
              </div>
            )}
          </div>
        )}

        {/* TAB 4: SKIN CARE PROFILE */}
        {activeTab === 'measurements' && (
          <form onSubmit={handleMeasurementsSubmit} className="bg-white dark:bg-[#1E1528] border border-[#EADBEE] dark:border-white/10 rounded-2xl p-6 shadow-sm flex flex-col gap-5 max-w-xl animate-fade-in text-left">
            <div>
              <h3 className="font-extrabold text-base text-[#221B2B] dark:text-[#F3EFF6]">My Skin Profile & Routine Preferences</h3>
              <p className="text-xs text-gray-500 dark:text-[#9B8EA9] mt-1">Save your skin type and concerns here. We use these to suggest suitable products for your skin.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-500 dark:text-[#9B8EA9] font-bold ">Skin Type</label>
                <select
                  value={skinType}
                  onChange={e => setSkinType(e.target.value)}
                  className="px-3.5 py-2.5 border border-gray-200 dark:border-white/15 rounded-full text-xs bg-white dark:bg-[#231B30] text-[#221B2B] dark:text-[#F3EFF6] focus:outline-none focus:border-[#5D3E85]"
                >
                  <option value="Normal">Normal Skin</option>
                  <option value="Dry">Dry / Dehydrated Skin</option>
                  <option value="Oily">Oily Skin</option>
                  <option value="Combination">Combination Skin</option>
                  <option value="Sensitive">Sensitive / Reactive Skin</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-500 dark:text-[#9B8EA9] font-bold ">Primary Skin Goal</label>
                <select
                  value={skinGoal}
                  onChange={e => setSkinGoal(e.target.value)}
                  className="px-3.5 py-2.5 border border-gray-200 dark:border-white/15 rounded-full text-xs bg-white dark:bg-[#231B30] text-[#221B2B] dark:text-[#F3EFF6] focus:outline-none focus:border-[#5D3E85]"
                >
                  <option value="Radiant Glow">Radiant Glow & Luminosity</option>
                  <option value="Deep Hydration">Deep Moisture & Hydration</option>
                  <option value="Anti-Aging & Firming">Anti-Aging & Firming</option>
                  <option value="Blemish & Acne Control">Blemish & Acne Control</option>
                  <option value="Tone Evening & Brightening">Tone Evening & Brightening</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-500 dark:text-[#9B8EA9] font-bold ">Primary Concern</label>
                <select
                  value={skinConcern}
                  onChange={e => setSkinConcern(e.target.value)}
                  className="px-3.5 py-2.5 border border-gray-200 dark:border-white/15 rounded-full text-xs bg-white dark:bg-[#231B30] text-[#221B2B] dark:text-[#F3EFF6] focus:outline-none focus:border-[#5D3E85]"
                >
                  <option value="Dark Spots & Hyperpigmentation">Dark Spots & Hyperpigmentation</option>
                  <option value="Uneven Texture">Uneven Skin Texture</option>
                  <option value="Fine Lines & Wrinkles">Fine Lines & Wrinkles</option>
                  <option value="Excess Oil & Large Pores">Excess Oil & Large Pores</option>
                  <option value="Sun Damage">Sun Exposure & Tan Removal</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-500 dark:text-[#9B8EA9] font-bold ">Preferred Texture</label>
                <select
                  value={preferredFormulation}
                  onChange={e => setPreferredFormulation(e.target.value)}
                  className="px-3.5 py-2.5 border border-gray-200 dark:border-white/15 rounded-full text-xs bg-white dark:bg-[#231B30] text-[#221B2B] dark:text-[#F3EFF6] focus:outline-none focus:border-[#5D3E85]"
                >
                  <option value="Rich Creams & Serums">Rich Creams & Serums</option>
                  <option value="Lightweight Gel Lotions">Lightweight Gel Lotions</option>
                  <option value="Organic Essential Oils">Organic Essential Oils</option>
                  <option value="Exfoliating Body Scrubs">Exfoliating Body Scrubs</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-gray-500 dark:text-[#9B8EA9] font-bold ">Skin Sensitivities or Notes (Optional)</label>
              <textarea
                rows="2"
                placeholder="e.g. Sensitive to strong fragrances, looking for daily brightening routine..."
                value={skinNotes}
                onChange={e => setSkinNotes(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 dark:border-white/15 rounded-2xl text-xs bg-white dark:bg-white/5 text-[#221B2B] dark:text-[#F3EFF6] focus:outline-none focus:border-[#5D3E85] resize-none"
              />
            </div>

            {measSuccess && (
              <div className="bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-xl p-3 text-xs font-semibold flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                Skin profile and preferences saved successfully!
              </div>
            )}

            <button
              type="submit"
              disabled={measLoading}
              className="self-end px-6 py-2.5 bg-[#5D3E85] hover:bg-[#EC268F] text-white text-xs font-extrabold rounded-full flex items-center justify-center gap-1.5 cursor-pointer shadow-md btn-spring"
            >
              {measLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Skin Profile'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
