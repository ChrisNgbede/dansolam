import { getCurrencySymbol } from '../../utils/currency';
import React, { useState, useEffect } from 'react';
import { toast as systemToast } from '../../components/ui/ToastProvider';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, ShoppingBag, MapPin, Heart, LogOut, ArrowRight, Trash2, Plus, Loader2, Scissors, Check, Eye, EyeOff } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState('orders'); // orders, addresses, wishlist, measurements
  const [loginTab, setLoginTab] = useState(true); // true = login, false = register

  // Login form states
  const [loginEmail, setLoginEmail] = useState(() => localStorage.getItem('fairqueen_remembered_email') || '');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem('fairqueen_remembered_email'));

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
  const [addressState, setAddressState] = useState('Abuja');
  const [addressCountry, setAddressCountry] = useState('Nigeria');
  const [addressDefault, setAddressDefault] = useState(true);
  const [addressLoading, setAddressLoading] = useState(false);

  // Measurements states
  const [bust, setBust] = useState('');
  const [waist, setWaist] = useState('');
  const [hips, setHips] = useState('');
  const [height, setHeight] = useState('');
  const [shoeSize, setShoeSize] = useState('');
  const [fitPreference, setFitPreference] = useState('Fitted');
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

  // Populate measurements once user is loaded
  useEffect(() => {
    if (customer?.measurements) {
      const m = customer.measurements;
      setBust(m.bust || '');
      setWaist(m.waist || '');
      setHips(m.hips || '');
      setHeight(m.height || '');
      setShoeSize(m.shoe_size || '');
      setFitPreference(m.fit_preference || 'Fitted');
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
          bust,
          waist,
          hips,
          height,
          shoe_size: shoeSize,
          fit_preference: fitPreference
        })
      });
      const data = await res.json();
      setMeasLoading(false);

      if (data.success) {
        setMeasSuccess(true);
        queryClient.invalidateQueries(['customer-profile']);
        setTimeout(() => setMeasSuccess(false), 4000);
      } else {
        systemToast.error(data.message || 'Saving measurements failed');
      }
    } catch (e) {
      setMeasLoading(false);
      systemToast.error('Connection error saving measurements');
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
      <div className="max-w-4xl mx-auto px-4 md:px-8 pt-12 pb-16">
        <SEO title="Sign In / Register" description="Log in or create a ecommerce customer profile to view your orders, wishlist, and sizing settings." />
        
        <div className="bg-white rounded-3xl overflow-hidden shadow-xs flex flex-col md:flex-row min-h-[550px] border border-gray-100/50">
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
                New Arrivals
              </span>
              <h2 className="font-serif font-bold text-2xl lg:text-3.5xl leading-tight">
                {settings.auth_title || "Find Your Perfect Style Today"}
              </h2>
              <p className="text-[11px] text-gray-300 font-medium max-w-xs leading-relaxed opacity-90">
                {settings.auth_subtitle || "Join FairQueen Collections and start exploring the best hand-curated designer outfits."}
              </p>
            </div>
          </div>

          {/* Right Column: Auth Forms */}
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

            {loginTab ? (
              /* LOGIN FORM */
              <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4.5 w-full">
                <div className="text-center">
                  <h2 className="font-serif font-bold text-xl text-gray-905 leading-none">Welcome Back Queen</h2>
                  <p className="text-xs text-gray-400 mt-2">Sign in to check past orders, edit shipping addresses, or view your wishlist.</p>
                </div>
                
                <div className="flex flex-col gap-1.5 mt-2">
                  <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    className="px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-xs bg-[#FAF9F6] text-gray-800 shadow-3xs w-full"
                    placeholder="e.g. fatima@example.com"
                  />
                </div>

                <div className="flex flex-col gap-1.5 relative">
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Password</label>
                    <Link to="/forgot-password" className="text-[10px] text-primary hover:underline font-bold">
                      Forgot Password?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      className="pl-3 pr-10 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-xs bg-[#FAF9F6] text-gray-800 shadow-3xs w-full"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-655 cursor-pointer"
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
                    className="accent-primary rounded text-white border-gray-300 focus:ring-primary w-3.5 h-3.5 cursor-pointer"
                  />
                  <label htmlFor="rememberMe" className="text-[10px] text-gray-500 font-bold select-none cursor-pointer">
                    Remember Me
                  </label>
                </div>

                {loginError && <span className="text-[10px] text-red-500 font-semibold">{loginError}</span>}

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all duration-300 uppercase tracking-wider mt-1 cursor-pointer"
                >
                  {loginLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Log In'}
                </button>

                <p className="text-xs text-gray-500 text-center mt-2.5">
                  Don't have an account?{' '}
                  <button type="button" onClick={() => setLoginTab(false)} className="text-primary font-bold hover:underline cursor-pointer">
                    Register
                  </button>
                </p>
              </form>
            ) : (
              /* REGISTER FORM */
              <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-4 w-full">
                <div className="text-center">
                  <h2 className="font-serif font-bold text-xl text-gray-905 leading-none">Create Your Account</h2>
                  <p className="text-xs text-gray-400 mt-2">Create an account to store addresses, save sizes, and access fast checkouts.</p>
                </div>

                <div className="flex flex-col gap-1.5 mt-1">
                  <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={e => setRegName(e.target.value)}
                    className="px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-xs bg-[#FAF9F6] text-gray-800 shadow-3xs w-full"
                    placeholder="e.g. Fatima Abubakar"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Email Address</label>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={e => setRegEmail(e.target.value)}
                      className="px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-xs bg-[#FAF9F6] text-gray-800 shadow-3xs w-full"
                      placeholder="e.g. fatima@example.com"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Phone Number</label>
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={e => setRegPhone(e.target.value)}
                      className="px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-xs bg-[#FAF9F6] text-gray-800 shadow-3xs w-full"
                      placeholder="e.g. +234 80 1234 5678"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="flex flex-col gap-1.5 relative">
                    <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Password</label>
                    <div className="relative">
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        value={regPassword}
                        onChange={e => setRegPassword(e.target.value)}
                        className="pl-3 pr-10 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-xs bg-[#FAF9F6] text-gray-800 shadow-3xs w-full"
                        placeholder="Min 6 chars"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-655 cursor-pointer"
                      >
                        {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 relative">
                    <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Confirm Password</label>
                    <div className="relative">
                      <input
                        type={showRegPasswordConf ? 'text' : 'password'}
                        required
                        value={regPasswordConf}
                        onChange={e => setRegPasswordConf(e.target.value)}
                        className="pl-3 pr-10 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-xs bg-[#FAF9F6] text-gray-800 shadow-3xs w-full"
                        placeholder="Confirm password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPasswordConf(!showRegPasswordConf)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-655 cursor-pointer"
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
                  className="w-full py-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all duration-300 uppercase tracking-wider mt-1 cursor-pointer"
                >
                  {regLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Account'}
                </button>

                <p className="text-xs text-gray-550 text-center mt-2">
                  Already have an account?{' '}
                  <button type="button" onClick={() => setLoginTab(true)} className="text-primary font-bold hover:underline cursor-pointer">
                    Login
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // LOGGED-IN CUSTOMER PORTAL
  // =========================================================================
  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 flex flex-col gap-8">
      <SEO title="Customer Portal" description="Manage your customer account, size profiles, saved addresses and order inquiries." />
      
      {/* Profile Header card */}
      <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary text-lg font-bold">
            {customer.name[0]}
          </div>
          <div>
            <h2 className="font-bold text-gray-900 text-base">{customer.name}</h2>
            <p className="text-xs text-gray-400">{customer.email} {customer.phone && `| ${customer.phone}`}</p>
          </div>
        </div>

        <button
          onClick={customerLogout}
          className="inline-flex items-center gap-1.5 px-4 py-2 border border-red-200 hover:bg-red-50 rounded-lg text-xs font-semibold text-red-600 transition-all self-start sm:self-center"
        >
          <LogOut className="w-3.5 h-3.5" />
          Log Out
        </button>
      </div>

      {/* Tabs selectors */}
      <div className="flex border-b border-gray-150 text-xs font-semibold text-gray-400">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-1.5 pb-2.5 px-4 border-b-2 transition-all ${
            activeTab === 'orders' ? 'border-primary text-primary' : 'border-transparent hover:text-gray-600'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          My Orders ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('addresses')}
          className={`flex items-center gap-1.5 pb-2.5 px-4 border-b-2 transition-all ${
            activeTab === 'addresses' ? 'border-primary text-primary' : 'border-transparent hover:text-gray-600'
          }`}
        >
          <MapPin className="w-4 h-4" />
          Addresses ({addresses.length})
        </button>
        <button
          onClick={() => setActiveTab('wishlist')}
          className={`flex items-center gap-1.5 pb-2.5 px-4 border-b-2 transition-all ${
            activeTab === 'wishlist' ? 'border-primary text-primary' : 'border-transparent hover:text-gray-600'
          }`}
        >
          <Heart className="w-4 h-4" />
          Wishlist ({wishlist.length})
        </button>
        <button
          onClick={() => setActiveTab('measurements')}
          className={`flex items-center gap-1.5 pb-2.5 px-4 border-b-2 transition-all ${
            activeTab === 'measurements' ? 'border-primary text-primary' : 'border-transparent hover:text-gray-600'
          }`}
        >
          <Scissors className="w-4 h-4" />
          My Sizes
        </button>
      </div>

      {/* TAB 1: ORDER HISTORY */}
      {activeTab === 'orders' && (
        <div className="flex flex-col gap-4 animate-fade-in">
          {orders.length > 0 ? (
            orders.map((ord) => (
              <div
                key={ord.id}
                className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex flex-col gap-1.5 text-xs text-gray-605">
                  <div className="flex items-center gap-3">
                    <strong className="text-gray-900 text-sm">#{ord.order_number}</strong>
                    <span className="font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary capitalize text-[10px]">
                      {ord.order_status.replace('_', ' ')}
                    </span>
                  </div>
                  <p>📅 Date: {new Date(ord.created_at).toLocaleDateString()}</p>
                  <p>💳 Payment status: <span className={ord.payment_status === 'paid' ? 'text-green-605 font-semibold' : 'text-orange-505 font-semibold'}>{ord.payment_status.toUpperCase()}</span></p>
                  <p>💵 Total: <span className="font-bold text-gray-800">{currencySymbol}{parseFloat(ord.total_amount).toLocaleString()}</span></p>
                </div>

                <Link
                  to={`/order-tracking?order_number=${ord.order_number}&contact=${encodeURIComponent(customer.email)}`}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-gray-800 hover:bg-black text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
                >
                  Track Order
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))
          ) : (
            <div className="bg-white border border-gray-100 rounded-xl p-12 text-center text-xs text-gray-400 italic">
              You haven't placed any orders yet.
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ADDRESS BOOK */}
      {activeTab === 'addresses' && (
        <div className="flex flex-col gap-6 animate-fade-in">
          <button
            onClick={() => setShowAddressForm(!showAddressForm)}
            className="self-start inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Add New Address
          </button>

          {/* Add Address Form overlay */}
          {showAddressForm && (
            <form onSubmit={handleAddressSubmit} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col gap-4">
              <h4 className="font-semibold text-xs text-gray-800 uppercase border-b border-gray-50 pb-2">Add New Shipping Address</h4>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-500 font-semibold uppercase">Address Line 1</label>
                <input
                  type="text"
                  required
                  value={addressLine}
                  onChange={e => setAddressLine(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-250 focus:outline-none focus:border-primary text-xs bg-white"
                  placeholder="e.g. Apartment, suite, street address"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-500 font-semibold uppercase">City</label>
                  <input
                    type="text"
                    required
                    value={addressCity}
                    onChange={e => setAddressCity(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-gray-250 focus:outline-none focus:border-primary text-xs bg-white"
                    placeholder="e.g. Abuja"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-500 font-semibold uppercase">State</label>
                  <input
                    type="text"
                    required
                    value={addressState}
                    onChange={e => setAddressState(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-gray-255 focus:outline-none focus:border-primary text-xs bg-white"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-500 font-semibold uppercase">Country</label>
                  <input
                    type="text"
                    required
                    value={addressCountry}
                    onChange={e => setAddressCountry(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-gray-255 focus:outline-none focus:border-primary text-xs bg-white"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={addressDefault}
                  onChange={e => setAddressDefault(e.target.checked)}
                  className="rounded border-gray-300 text-primary w-4 h-4"
                />
                Set as Default shipping address
              </label>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddressForm(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-55"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addressLoading}
                  className="px-5 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5"
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
                <div key={addr.id} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex flex-col gap-3 relative">
                  {addr.is_default && (
                    <span className="absolute top-4 right-4 bg-primary/10 text-primary text-[9px] font-bold px-2 py-0.5 rounded">
                      Default
                    </span>
                  )}
                  
                  <div className="text-xs text-gray-600 flex flex-col gap-1 pr-12">
                    <p className="font-bold text-gray-800">{addr.address_line_1}</p>
                    <p>{addr.city}, {addr.state}</p>
                    <p>{addr.country}</p>
                  </div>

                  <button
                    onClick={() => handleDeleteAddress(addr.id)}
                    className="self-start inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold border border-red-200 hover:bg-red-50 text-red-650 rounded transition-all mt-2"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                </div>
              ))
            ) : (
              <div className="bg-white border border-gray-100 rounded-xl p-12 text-center text-xs text-gray-400 italic sm:col-span-2">
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
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {wishlist.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          ) : (
            <div className="bg-white border border-gray-100 rounded-xl p-12 text-center text-xs text-gray-400 italic">
              Your wishlist is currently empty. Start adding pieces to buy later.
            </div>
          )}
        </div>
      )}

      {/* TAB 4: MY SIZE MEASUREMENTS */}
      {activeTab === 'measurements' && (
        <form onSubmit={handleMeasurementsSubmit} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col gap-5 max-w-xl animate-fade-in">
          <div>
            <h3 className="font-serif font-bold text-base text-gray-900">My Size Profile</h3>
            <p className="text-xs text-gray-500 mt-1">Save your measurements here. We will refer to these to recommend available sizes for jumpsuits, suits and shoes.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-gray-505 font-bold uppercase">Bust (inches)</label>
              <input
                type="text"
                placeholder="e.g. 36"
                value={bust}
                onChange={e => setBust(e.target.value)}
                className="px-3 py-2 border border-gray-250 rounded-lg text-xs bg-white focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-gray-550 font-bold uppercase">Waist (inches)</label>
              <input
                type="text"
                placeholder="e.g. 30"
                value={waist}
                onChange={e => setWaist(e.target.value)}
                className="px-3 py-2 border border-gray-250 rounded-lg text-xs bg-white focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-gray-550 font-bold uppercase">Hips (inches)</label>
              <input
                type="text"
                placeholder="e.g. 40"
                value={hips}
                onChange={e => setHips(e.target.value)}
                className="px-3 py-2 border border-gray-250 rounded-lg text-xs bg-white focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-gray-550 font-bold uppercase">Height (ft / cm)</label>
              <input
                type="text"
                placeholder="e.g. 5ft 8"
                value={height}
                onChange={e => setHeight(e.target.value)}
                className="px-3 py-2 border border-gray-250 rounded-lg text-xs bg-white focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-gray-550 font-bold uppercase">Shoe Size (EU)</label>
              <input
                type="text"
                placeholder="e.g. 39"
                value={shoeSize}
                onChange={e => setShoeSize(e.target.value)}
                className="px-3 py-2 border border-gray-250 rounded-lg text-xs bg-white focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-gray-550 font-bold uppercase">Fit Preference</label>
              <select
                value={fitPreference}
                onChange={e => setFitPreference(e.target.value)}
                className="px-3 py-2 border border-gray-250 rounded-lg text-xs bg-white focus:outline-none focus:border-primary text-gray-700"
              >
                <option value="Fitted">Fitted / Bodycon</option>
                <option value="Regular">Regular Fit</option>
                <option value="Loose">Loose / Flowing</option>
                <option value="Oversized">Oversized Chic</option>
              </select>
            </div>
          </div>

          {measSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-600 rounded-lg p-3 text-xs font-semibold flex items-center gap-1.5">
              <Check className="w-4 h-4" />
              Size measurements profile saved successfully!
            </div>
          )}

          <button
            type="submit"
            disabled={measLoading}
            className="self-end px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5"
          >
            {measLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Measurements'}
          </button>
        </form>
      )}

    </div>
  );
}
