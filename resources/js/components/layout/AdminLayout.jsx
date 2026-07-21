import React, { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, ShoppingCart, Package, Settings, LogOut, ArrowLeft, 
  FolderHeart, Tag, Star, Users, ClipboardList, FileText, Image, BookOpen, 
  Percent, Coins, BarChart3, Menu, X, Search, Bell, Inbox, Mail, HelpCircle, Truck, Sun, Moon,
  ChevronLeft, ChevronRight, Loader2, ChevronDown, ChevronUp, Award, Monitor, ReceiptText, PackagePlus, Sparkles
} from 'lucide-react';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, useAuth } from '../../hooks/useAuth';
import { getAdminToken } from '../auth/RequireAdminAuth';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { admin, adminLogout } = useAuth();
  const token = getAdminToken();

  const getInitials = (name) => {
    if (!name) return 'AD';
    return name
      .split(' ')
      .filter(Boolean)
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  // Responsive state
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  // Sidebar expand/collapse state
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('fairqueen_sidebar_collapsed') === 'true';
  });
  // Top-bar search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ products: [], orders: [], customers: [] });
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  // Profile dropdown state
  const [avatarDropdownOpen, setAvatarDropdownOpen] = useState(false);

  // Dark Mode state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('fairqueen_admin_dark_mode') === 'true';
  });

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const val = !prev;
      localStorage.setItem('fairqueen_admin_dark_mode', val ? 'true' : 'false');
      return val;
    });
  };
  // Notifications state
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Fetch live notifications
  const { data: notificationsRes } = useQuery({
    queryKey: ['admin-notifications-bell'],
    queryFn: () => apiFetch('/api/admin/notifications').then(res => res.json()),
    refetchInterval: 30000, // 30 seconds poll
    enabled: !!token
  });
  const notifications = notificationsRes?.data || [];
  const alertCounts = notificationsRes?.counts || { orders: 0, inquiries: 0, reviews: 0 };

  // Fetch settings to sync currency
  const { data: settingsRes } = useQuery({
    queryKey: ['settings-admin-layout'],
    queryFn: () => apiFetch('/api/admin/settings').then(res => res.json()),
    enabled: !!token
  });

  useEffect(() => {
    if (settingsRes?.data?.settings) {
      const s = settingsRes.data.settings;
      localStorage.setItem('fairqueen_currency_symbol', s.system_currency_symbol || '₦');
    }
  }, [settingsRes]);

  const settings = settingsRes?.data?.settings || {};
  const ecommerce = settingsRes?.data?.ecommerce || { name: 'Dansolam' };

  // Handle top bar search effect with debouncing
  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setSearchResults({ products: [], orders: [], customers: [] });
      setSearchLoading(false);
      return;
    }
    
    setSearchLoading(true);
    const delayDebounceFn = setTimeout(() => {
      apiFetch(`/api/admin/search?q=${encodeURIComponent(searchQuery)}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setSearchResults(data.data || { products: [], orders: [], customers: [] });
          }
          setSearchLoading(false);
        })
        .catch(() => setSearchLoading(false));
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Guard routing
  useEffect(() => {
    if (!token) {
      navigate('/admin/login');
    }
  }, [token, navigate]);

  const handleLogout = async () => {
    await adminLogout();
    queryClient.clear();
    navigate('/admin/login');
  };

  const isActive = (path) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  const [settingsExpanded, setSettingsExpanded] = useState(() => {
    return location.pathname.startsWith('/admin/settings') || 
           location.pathname.startsWith('/admin/taxes') || 
           location.pathname.startsWith('/admin/shipping');
  });

  const [cmsExpanded, setCmsExpanded] = useState(() => (
    location.pathname.startsWith('/admin/hero') ||
    location.pathname.startsWith('/admin/pages') ||
    location.pathname.startsWith('/admin/articles') ||
    location.pathname.startsWith('/admin/gallery')
  ));

  useEffect(() => {
    const isSettings = location.pathname.startsWith('/admin/settings') || 
                       location.pathname.startsWith('/admin/taxes') || 
                       location.pathname.startsWith('/admin/shipping');
    if (isSettings) {
      setSettingsExpanded(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname.startsWith('/admin/hero') || location.pathname.startsWith('/admin/pages') || location.pathname.startsWith('/admin/articles') || location.pathname.startsWith('/admin/gallery')) {
      setCmsExpanded(true);
    }
  }, [location.pathname]);

  const renderNavLinks = (onLinkClick = () => {}) => {
    const links = [
      { to: '/admin', label: 'Overview', icon: LayoutDashboard, color: 'text-amber-500' },
      { to: '/admin/products', label: 'Products', icon: Package, color: 'text-blue-450' },
      { to: '/admin/collections', label: 'Collections', icon: FolderHeart, color: 'text-pink-400' },
      { to: '/admin/orders', label: 'Orders', icon: ShoppingCart, color: 'text-emerald-450' },
      ...(settings.module_pos_enabled === 'true' ? [{ to: '/admin/pos', label: 'Point of Sale', icon: Monitor, color: 'text-amber-500' }] : []),
      ...(settings.module_expenses_enabled === 'true' ? [{ to: '/admin/expenses', label: 'Expenses', icon: ReceiptText, color: 'text-red-400' }] : []),
      ...(settings.module_purchases_enabled === 'true' ? [{ to: '/admin/purchases', label: 'Purchases', icon: PackagePlus, color: 'text-indigo-400' }] : []),
      { to: '/admin/coupons', label: 'Coupons', icon: Tag, color: 'text-orange-455' },
      { to: '/admin/discounts', label: 'Discounts', icon: Percent, color: 'text-red-450' },
      { to: '/admin/customers', label: 'Customers', icon: Users, color: 'text-teal-450' },
      { to: '/admin/newsletter', label: 'Newsletter', icon: Mail, color: 'text-pink-400' },
      { to: '/admin/reviews', label: 'Reviews', icon: Star, color: 'text-yellow-500' },
      { to: '/admin/inventory', label: 'Inventory Logs', icon: ClipboardList, color: 'text-cyan-450' },
      { to: '/admin/invoices', label: 'Manual Invoices', icon: FileText, color: 'text-slate-400' },
      { to: '/admin/inquiries', label: 'Inquiries', icon: Inbox, color: 'text-lime-500' },
      { to: '/admin/fitting-sessions', label: 'Fitting Sessions', icon: Sparkles, color: 'text-yellow-400' },
      { to: '/admin/brands', label: 'Brands', icon: Award, color: 'text-rose-455' },
      { to: '/admin/users', label: 'Users', icon: Users, color: 'text-violet-400' },
      { to: '/admin/reports', label: 'Reports', icon: BarChart3, color: 'text-purple-450' },
    ];

    const isSettingsActive = location.pathname.startsWith('/admin/settings') || 
                             location.pathname.startsWith('/admin/taxes') || 
                             location.pathname.startsWith('/admin/shipping');

    const subSettings = [
      { to: '/admin/settings?tab=brand', label: 'General' },
      { to: '/admin/settings?tab=modules', label: 'Modules' },
      { to: '/admin/taxes', label: 'Taxes' },
      { to: '/admin/shipping', label: 'Shipping' }
    ];

    const isCmsActive = location.pathname.startsWith('/admin/hero') ||
      location.pathname.startsWith('/admin/pages') ||
      location.pathname.startsWith('/admin/articles') ||
      location.pathname.startsWith('/admin/gallery');

    const subCms = [
      { to: '/admin/hero', label: 'Hero' },
      { to: '/admin/pages?tab=pages', label: 'Pages' },
      { to: '/admin/pages?tab=faqs', label: 'FAQs' },
      { to: '/admin/articles', label: 'Blog' },
      { to: '/admin/gallery', label: 'Gallery' },
    ];

    const isSubActive = (sub) => {
      const currentPathWithSearch = location.pathname + location.search;
      if (sub.to.includes('?')) {
        return currentPathWithSearch === sub.to || 
               (sub.to === '/admin/settings?tab=brand' && location.pathname === '/admin/settings' && !location.search);
      }
      return location.pathname === sub.to;
    };

    return (
      <>
        {links.map((link) => {
          const active = isActive(link.to);
          const Icon = link.icon;
          return (
            <Link
              key={link.to}
              to={link.to}
              onClick={onLinkClick}
              title={isCollapsed ? link.label : ''}
              className={`flex items-center rounded-xl text-xs font-semibold transition-all relative group ${
                isCollapsed 
                  ? 'justify-center p-2.5 mx-auto w-10 h-10 my-0.5' 
                  : 'gap-3 px-4 py-2.5 my-0.5'
              } ${
                active
                  ? 'active-glass shadow-sm'
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
              }`}
            >
              <div className="relative shrink-0">
                <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${active ? 'text-primary dark:text-[#FAF3E8]' : link.color}`} />
                {isCollapsed && (
                  <>
                    {link.label === 'Orders' && alertCounts.orders > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-emerald-500 rounded-full text-[7px] font-bold text-white flex items-center justify-center">
                        {alertCounts.orders}
                      </span>
                    )}
                    {link.label === 'Inquiries' && alertCounts.inquiries > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-lime-600 rounded-full text-[7px] font-bold text-white flex items-center justify-center">
                        {alertCounts.inquiries}
                      </span>
                    )}
                    {link.label === 'Reviews' && alertCounts.reviews > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-yellow-500 rounded-full text-[7px] font-bold text-white flex items-center justify-center">
                        {alertCounts.reviews}
                      </span>
                    )}
                  </>
                )}
              </div>
              {!isCollapsed && (
                <span className="flex-1 flex items-center justify-between">
                  <span>{link.label}</span>
                  {link.label === 'Orders' && alertCounts.orders > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-2 bg-emerald-500 text-white">
                      {alertCounts.orders}
                    </span>
                  )}
                  {link.label === 'Inquiries' && alertCounts.inquiries > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-2 bg-lime-650 text-white">
                      {alertCounts.inquiries}
                    </span>
                  )}
                  {link.label === 'Reviews' && alertCounts.reviews > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-2 bg-yellow-505 text-white">
                      {alertCounts.reviews}
                    </span>
                  )}
                </span>
              )}
              {/* Collapse Hover Tooltip */}
              {isCollapsed && (
                <div className="absolute left-16 bg-gray-900 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg shadow-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50 whitespace-nowrap border border-gray-800">
                  {link.label}
                </div>
              )}
            </Link>
          );
        })}

        {/* CMS parent menu */}
        <div className="relative group">
          {isCollapsed ? (
            <div className="flex flex-col items-center">
              <button className={`flex items-center justify-center p-2.5 mx-auto w-10 h-10 my-0.5 rounded-xl transition-all ${isCmsActive ? 'active-glass shadow-sm' : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'}`} title="CMS">
                <FileText className={`w-4 h-4 ${isCmsActive ? 'text-primary' : 'text-rose-450'}`} />
              </button>
              <div className="absolute left-16 top-0 bg-gray-900 border border-gray-800 rounded-lg shadow-xl py-1.5 px-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 flex flex-col gap-0.5 min-w-[130px]">
                <div className="px-2.5 py-1 text-[10px] uppercase tracking-wider text-gray-500 font-bold border-b border-gray-800 mb-1">CMS</div>
                {subCms.map((sub) => {
                  const active = isSubActive(sub);
                  return <Link key={sub.to} to={sub.to} onClick={onLinkClick} className={`px-3 py-1.5 text-xs rounded font-medium ${active ? 'active-glass font-semibold' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}>{sub.label}</Link>;
                })}
              </div>
            </div>
          ) : (
            <div>
              <button onClick={() => setCmsExpanded((value) => !value)} className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 my-0.5 rounded-xl text-xs font-semibold transition-all ${isCmsActive ? 'active-glass shadow-sm' : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'}`}>
                <span className="flex items-center gap-3"><FileText className={`w-4 h-4 ${isCmsActive ? 'text-primary' : 'text-rose-450'}`} /><span>CMS</span></span>
                {cmsExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
              <div className={`transition-all duration-200 overflow-hidden ${cmsExpanded ? 'max-h-48 opacity-100 mt-1 mb-2' : 'max-h-0 opacity-0'}`}>
                <div className="pl-6 flex flex-col border-l border-gray-800 ml-6 gap-0.5">
                  {subCms.map((sub) => {
                    const active = isSubActive(sub);
                    return <Link key={sub.to} to={sub.to} onClick={onLinkClick} className={`px-3 py-1.5 text-[11px] font-medium rounded-md transition-all ${active ? 'active-glass font-bold' : 'text-gray-400 hover:bg-gray-800/40 hover:text-white'}`}>{sub.label}</Link>;
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Settings parent menu */}
        <div className="relative group">
          {isCollapsed ? (
            /* Collapsed Parent Menu Icon */
            <div className="flex flex-col items-center">
              <button
                className={`flex items-center justify-center p-2.5 mx-auto w-10 h-10 my-0.5 rounded-xl text-xs font-semibold transition-all relative ${
                  isSettingsActive
                    ? 'active-glass shadow-sm'
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                }`}
              >
                <Settings className={`w-4 h-4 shrink-0 transition-transform ${isSettingsActive ? 'text-primary dark:text-[#FAF3E8]' : 'text-gray-400'} group-hover:scale-110`} />
              </button>
              
              {/* Hover Popover containing children */}
              <div className="absolute left-16 top-0 bg-gray-900 border border-gray-800 rounded-lg shadow-xl py-1.5 px-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-150 z-50 flex flex-col gap-0.5 min-w-[120px]">
                <div className="px-2.5 py-1 text-[10px] uppercase tracking-wider text-gray-500 font-bold border-b border-gray-800 mb-1">
                  Settings
                </div>
                {subSettings.map(sub => {
                  const subActive = isSubActive(sub);
                  return (
                    <Link
                      key={sub.to}
                      to={sub.to}
                      onClick={onLinkClick}
                      className={`px-3 py-1.5 text-xs rounded transition-colors text-left font-medium block ${
                        subActive 
                          ? 'active-glass font-semibold' 
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }`}
                    >
                      {sub.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Expanded Parent Menu */
            <div>
              <button
                onClick={() => setSettingsExpanded(prev => !prev)}
                className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 my-0.5 rounded-xl text-xs font-semibold transition-all relative ${
                  isSettingsActive
                    ? 'active-glass shadow-sm'
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Settings className={`w-4 h-4 shrink-0 transition-transform ${isSettingsActive ? 'text-primary dark:text-[#FAF3E8]' : 'text-gray-400'} group-hover:scale-110`} />
                  <span>Settings</span>
                </div>
                {settingsExpanded ? (
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform shrink-0 ${isSettingsActive ? 'text-primary dark:text-[#FAF3E8] opacity-90' : 'opacity-65'}`} />
                ) : (
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform shrink-0 ${isSettingsActive ? 'text-primary dark:text-[#FAF3E8] opacity-90' : 'opacity-65'}`} />
                )}
              </button>
              
              {/* Dropdown Children items */}
              <div 
                className={`transition-all duration-200 ease-in-out overflow-hidden ${
                  settingsExpanded ? 'max-h-40 opacity-100 mt-1 mb-2' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="pl-6 flex flex-col border-l border-gray-800 ml-6 gap-0.5">
                  {subSettings.map(sub => {
                    const subActive = isSubActive(sub);
                    return (
                      <Link
                        key={sub.to}
                        to={sub.to}
                        onClick={onLinkClick}
                        className={`px-3 py-1.5 text-[11px] font-medium rounded-md transition-all ${
                          subActive
                            ? 'active-glass font-bold'
                            : 'text-gray-400 hover:bg-gray-800/40 hover:text-white'
                        }`}
                      >
                        {sub.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <div className={`flex bg-gray-50 min-h-screen text-gray-800 font-sans animate-fade-in ${isDarkMode ? 'dark bg-gray-950 text-gray-100' : ''}`}>
      <style>{`
        .dark {
          background-color: #030712 !important;
          color: #f3f4f6 !important;
        }
        .dark header, 
        .dark .bg-white {
          background-color: #09090b !important;
          color: #f3f4f6 !important;
          border-color: #18181b !important;
        }
        .dark .border-gray-150,
        .dark .border-gray-200,
        .dark .border-gray-250,
        .dark .border-gray-100 {
          border-color: #1f2937 !important;
        }
        .dark input, 
        .dark select, 
        .dark textarea,
        .dark .rich-editor,
        .dark .bg-gray-50, 
        .dark .bg-gray-55 {
          background-color: #1f2937 !important;
          color: #f3f4f6 !important;
          border-color: #374151 !important;
        }
        .dark input::placeholder, 
        .dark textarea::placeholder,
        .dark .text-gray-400,
        .dark .text-gray-450,
        .dark .text-gray-500,
        .dark .text-gray-550 {
          color: #cbd5e1 !important;
        }
        .dark .text-gray-600,
        .dark .text-gray-650,
        .dark .text-gray-700,
        .dark .text-gray-800,
        .dark .text-gray-850,
        .dark .text-gray-900,
        .dark .text-gray-950 {
          color: #f3f4f6 !important;
        }
        .dark .hover\:bg-gray-50:hover, 
        .dark .hover\:bg-gray-55:hover,
        .dark .hover\:bg-gray-50\/50:hover {
          background-color: #1f2937 !important;
        }
        .dark table th {
          background-color: #1f2937 !important;
          color: #9ca3af !important;
        }
        .dark tr {
          border-color: #1f2937 !important;
        }
        .dark .custom-sidebar-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15) !important;
        }
        .custom-sidebar-scroll::-webkit-scrollbar {
          width: 5px;
        }
        .custom-sidebar-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-sidebar-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 99px;
        }
        .custom-sidebar-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>

      {/* 1. Desktop Sidebar (Floating Layout) */}
      <aside className={`bg-[#09090b] text-gray-300 hidden md:flex flex-col shrink-0 h-[calc(100vh-2rem)] sticky top-4 my-4 ml-4 rounded-2xl transition-all duration-300 z-20 border border-gray-800/60 ${
        isCollapsed ? 'w-20' : 'w-60'
      }`}>
        {/* Brand Header */}
        <div className={`h-16 border-b border-gray-800 flex items-center shrink-0 justify-between transition-all ${
          isCollapsed ? 'px-4 justify-center' : 'px-6'
        }`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-xl overflow-hidden shrink-0 shadow-sm flex items-center justify-center bg-transparent">
              {settings.logo_url ? (
                <img loading="lazy" decoding="async" src={settings.logo_url} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-bold text-sm">👑</span>
              )}
            </div>
            {!isCollapsed && (
              <div className="animate-fade-in text-left">
                <h1 className="font-serif font-bold text-xs leading-none text-white uppercase tracking-wider">
                  {ecommerce.name}
                </h1>
                <span className="text-[9px] text-gray-500 font-bold block mt-0.5">Management Panel</span>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button
              onClick={() => {
                setIsCollapsed(prev => {
                  const val = !prev;
                  localStorage.setItem('fairqueen_sidebar_collapsed', val ? 'true' : 'false');
                  return val;
                });
              }}
              className="p-1 text-gray-500 hover:text-white hover:bg-gray-850 rounded-lg transition-colors cursor-pointer block"
              title="Collapse Sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          {isCollapsed && (
            <button
              onClick={() => {
                setIsCollapsed(prev => {
                  const val = !prev;
                  localStorage.setItem('fairqueen_sidebar_collapsed', val ? 'true' : 'false');
                  return val;
                });
              }}
              className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-850 rounded-lg transition-colors cursor-pointer mx-auto mt-2"
              title="Expand Sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation links with custom scrollbar */}
        <nav className="flex-1 p-3 flex flex-col gap-0.5 overflow-y-auto custom-sidebar-scroll">
          {renderNavLinks()}
        </nav>

        {/* Fixed Footer section */}
        <div className={`p-4 border-t border-gray-800 bg-[#09090b] shrink-0 flex flex-col gap-2 rounded-b-2xl ${
          isCollapsed ? 'items-center' : ''
        }`}>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            title={isCollapsed ? "View Storefront" : ""}
            className={`flex items-center rounded-xl text-xs font-bold text-indigo-400 bg-indigo-950/40 hover:bg-indigo-900/40 border border-indigo-900/30 transition-all shadow-sm ${
              isCollapsed ? 'justify-center w-10 h-10 p-0 relative group' : 'w-full gap-3 px-4 py-2.5'
            }`}
          >
            <ArrowLeft className="w-4 h-4 text-indigo-400 shrink-0" />
            {!isCollapsed && <span>View Storefront</span>}
            {isCollapsed && (
              <div className="absolute left-16 bg-indigo-900 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                View Storefront
              </div>
            )}
          </a>
          <button
            onClick={handleLogout}
            title={isCollapsed ? "Log Out" : ""}
            className={`flex items-center rounded-xl text-xs font-bold text-rose-400 bg-rose-950/40 hover:bg-rose-900/40 border border-rose-900/30 transition-all cursor-pointer shadow-sm ${
              isCollapsed ? 'justify-center w-10 h-10 p-0 relative group' : 'w-full gap-3 px-4 py-2.5'
            }`}
          >
            <LogOut className="w-4 h-4 text-rose-455 shrink-0" />
            {!isCollapsed && <span>Log Out</span>}
            {isCollapsed && (
              <div className="absolute left-16 bg-rose-900 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                Log Out
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile Slide-out Drawer */}
      {mobileSidebarOpen && (
        <>
          {/* Backdrop overlay */}
          <div 
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 z-40 md:hidden animate-fade-in"
          />
          {/* Drawer container */}
          <aside className="fixed inset-y-0 left-0 w-60 bg-[#09090b] text-gray-300 z-50 md:hidden flex flex-col shadow-2xl animate-slide-in h-screen border-r border-gray-800">
            {/* Header */}
            <div className="h-16 px-6 border-b border-gray-800 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 shadow-sm flex items-center justify-center bg-primary">
                  {settings.logo_url ? (
                    <img loading="lazy" decoding="async" src={settings.logo_url} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-bold text-sm">👑</span>
                  )}
                </div>
                <div className="text-left">
                  <h1 className="font-semibold text-sm leading-none text-white">{ecommerce.name}</h1>
                  <span className="text-[10px] text-gray-500">Management Panel</span>
                </div>
              </div>
              <button 
                onClick={() => setMobileSidebarOpen(false)}
                className="p-1 text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation links */}
            <nav className="flex-1 p-4 flex flex-col gap-1 overflow-y-auto custom-sidebar-scroll">
              {renderNavLinks(() => setMobileSidebarOpen(false))}
            </nav>

            {/* Fixed Footer section */}
            <div className="p-4 border-t border-gray-800 bg-[#09090b] shrink-0 flex flex-col gap-2.5">
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileSidebarOpen(false)}
                className="flex w-full items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-indigo-400 bg-indigo-950/40 hover:bg-indigo-900/40 border border-indigo-900/30 transition-all shadow-sm"
              >
                <ArrowLeft className="w-4 h-4 text-indigo-400" />
                View Storefront
              </a>
              <button
                onClick={() => {
                  setMobileSidebarOpen(false);
                  handleLogout();
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-450 bg-rose-950/40 hover:bg-rose-900/40 border border-rose-900/30 transition-all cursor-pointer shadow-sm"
              >
                <LogOut className="w-4 h-4 text-rose-455" />
                Log Out
              </button>
            </div>
          </aside>
        </>
      )}

      {/* 2. Main content container */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F5F6F8] dark:bg-gray-950">
        {/* Floating Top Header */}
        <header className="mx-4 md:mx-6 mt-4 h-16 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl px-6 flex items-center justify-between z-10 shrink-0 gap-4 shadow-sm">
          <div className="flex items-center gap-4 flex-1">
            {/* Mobile Menu Trigger */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-1.5 text-gray-500 hover:text-gray-950 dark:hover:text-white md:hidden cursor-pointer rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Search Input Shortcut (Pill Shaped) */}
            <div className="relative hidden sm:block w-72">
              <input
                type="text"
                placeholder="Search admin (orders, items...)"
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setShowSearchDropdown(true);
                }}
                onFocus={() => setShowSearchDropdown(true)}
                className="w-full pl-11 pr-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-full focus:outline-none focus:border-primary text-xs bg-white text-gray-800 dark:bg-gray-800 dark:text-gray-100 transition-all focus:ring-2 focus:ring-primary/20"
              />
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3.5 top-2.5" />

              {/* Floating Dropdown Results */}
              {showSearchDropdown && (searchQuery.trim().length > 0 || searchLoading) && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowSearchDropdown(false)}></div>
                  <div className="absolute left-0 mt-2 w-96 bg-white border border-gray-150 rounded-2xl shadow-xl py-3 z-50 animate-scale-up text-xs max-h-[380px] overflow-y-auto custom-sidebar-scroll dark:bg-gray-800 dark:border-gray-700">
                    {searchLoading ? (
                      <div className="flex items-center justify-center py-6 text-gray-400 gap-1.5 font-semibold">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" /> Searching...
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {/* Products results */}
                        {searchResults.products?.length > 0 && (
                          <div className="flex flex-col">
                            <div className="px-3 py-1 text-[9px] font-bold text-gray-400 uppercase tracking-wider dark:text-gray-500">
                              Products ({searchResults.products.length})
                            </div>
                            {searchResults.products.map(p => (
                              <Link
                                key={p.id}
                                to="/admin/products"
                                onClick={() => {
                                  setShowSearchDropdown(false);
                                  setSearchQuery('');
                                }}
                                className="px-3.5 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-center justify-between group"
                              >
                                <div className="flex items-center gap-2 max-w-[70%] text-left">
                                  {p.images?.[0]?.image_url ? (
                                    <img loading="lazy" decoding="async" src={p.images[0].image_url} alt={p.name} className="w-6 h-6 rounded object-cover border border-gray-100 dark:border-gray-700 shrink-0" />
                                  ) : (
                                    <div className="w-6 h-6 rounded bg-gray-100 dark:bg-gray-700 text-gray-400 flex items-center justify-center text-[10px] shrink-0">👑</div>
                                  )}
                                  <div className="flex flex-col min-w-0">
                                    <span className="font-semibold text-gray-850 truncate group-hover:text-primary transition-colors dark:text-gray-200">{p.name}</span>
                                    <span className="text-[9px] text-gray-400 font-mono mt-0.5 leading-none">SKU: {p.sku || 'N/A'}</span>
                                  </div>
                                </div>
                                <span className="text-[10px] font-bold text-gray-850 dark:text-gray-300">₦{parseFloat(p.price).toLocaleString()}</span>
                              </Link>
                            ))}
                          </div>
                        )}

                        {/* Orders results */}
                        {searchResults.orders?.length > 0 && (
                          <div className="flex flex-col">
                            <div className="px-3 py-1 text-[9px] font-bold text-gray-400 uppercase tracking-wider dark:text-gray-500">
                              Orders ({searchResults.orders.length})
                            </div>
                            {searchResults.orders.map(o => (
                              <Link
                                key={o.id}
                                to={`/admin/orders`}
                                onClick={() => {
                                  setShowSearchDropdown(false);
                                  setSearchQuery('');
                                  setTimeout(() => {
                                    const searchInput = document.querySelector('input[placeholder*="Search orders"]');
                                    if (searchInput) {
                                      searchInput.value = o.order_number;
                                      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                                    }
                                  }, 100);
                                }}
                                className="px-3.5 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-center justify-between group border-t border-gray-50/50 dark:border-gray-700/50 first:border-t-0"
                              >
                                <div className="flex flex-col min-w-0 text-left">
                                  <span className="font-bold text-gray-850 group-hover:text-primary transition-colors dark:text-gray-200">{o.order_number}</span>
                                  <span className="text-[9px] text-gray-450 mt-0.5 leading-none truncate dark:text-gray-400">{o.customer_name} · {o.customer_email}</span>
                                </div>
                                <div className="text-right flex flex-col items-end shrink-0">
                                  <span className="font-bold text-gray-850 dark:text-gray-300">₦{parseFloat(o.total_amount).toLocaleString()}</span>
                                  <span className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider mt-0.5 ${
                                    o.order_status === 'delivered' ? 'bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400' :
                                    o.order_status === 'cancelled' ? 'bg-red-50 text-red-500 dark:bg-red-950/30 dark:text-red-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400'
                                  }`}>{o.order_status}</span>
                                </div>
                              </Link>
                            ))}
                          </div>
                        )}

                        {/* Customers results */}
                        {searchResults.customers?.length > 0 && (
                          <div className="flex flex-col">
                            <div className="px-3 py-1 text-[9px] font-bold text-gray-400 uppercase tracking-wider dark:text-gray-500">
                              Customers ({searchResults.customers.length})
                            </div>
                            {searchResults.customers.map(c => (
                              <Link
                                key={c.id}
                                to="/admin/customers"
                                onClick={() => {
                                  setShowSearchDropdown(false);
                                  setSearchQuery('');
                                }}
                                className="px-3.5 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex flex-col group border-t border-gray-50/50 dark:border-gray-700/50 first:border-t-0 text-left"
                              >
                                <span className="font-semibold text-gray-850 group-hover:text-primary transition-colors dark:text-gray-200">{c.name}</span>
                                <span className="text-[9px] text-gray-400 mt-0.5 leading-none">{c.email} · {c.phone || 'No Phone'}</span>
                              </Link>
                            ))}
                          </div>
                        )}

                        {/* No results */}
                        {(!searchResults.products?.length && !searchResults.orders?.length && !searchResults.customers?.length) && (
                          <div className="px-4 py-8 text-center text-gray-450 italic">
                            No products, orders, or customers found for "{searchQuery}"
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4 shrink-0">
            {/* Icons Shortcuts */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Notifications Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer relative block"
                >
                  {notifications.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-[8px] font-bold text-white flex items-center justify-center rounded-full animate-bounce">
                      {notifications.length}
                    </span>
                  )}
                  <Bell className="w-4 h-4" />
                </button>
                {notificationsOpen && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setNotificationsOpen(false)}></div>
                    <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-150 rounded-2xl shadow-xl py-2 z-30 animate-scale-up text-xs dark:bg-gray-800 dark:border-gray-700">
                      <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between mb-1.5">
                        <span className="font-bold text-gray-800 dark:text-gray-250">System Notifications</span>
                        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                          {notifications.length} Alerts
                        </span>
                      </div>
                      <div className="max-h-72 overflow-y-auto custom-sidebar-scroll flex flex-col divide-y divide-gray-50 dark:divide-gray-800">
                        {notifications.length > 0 ? (
                          notifications.map((notif, idx) => (
                            <Link
                              key={idx}
                              to={notif.link}
                              onClick={() => setNotificationsOpen(false)}
                              className="px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors flex gap-2.5 text-left border-b border-gray-50 dark:border-gray-800 last:border-b-0"
                            >
                              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-sm">
                                {notif.type === 'order' && '🛍️'}
                                {notif.type === 'stock' && '⚠️'}
                                {notif.type === 'review' && '⭐'}
                                {notif.type === 'comment' && '💬'}
                                {notif.type === 'inquiry' && '✉️'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-800 dark:text-gray-200 truncate">{notif.title}</p>
                                <p className="text-[10px] text-gray-450 dark:text-gray-400 mt-0.5 leading-normal">{notif.message}</p>
                                <span className="text-[8px] text-gray-400 block mt-1 font-mono">
                                  {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {new Date(notif.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </Link>
                          ))
                        ) : (
                          <div className="px-4 py-8 text-center text-gray-400 italic">
                            No notifications to display.
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <button 
                onClick={toggleDarkMode}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer relative block"
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDarkMode ? <Sun className="w-4 h-4 text-amber-500 animate-spin-slow" /> : <Moon className="w-4 h-4 text-indigo-500" />}
              </button>
              <button className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer hidden xs:block">
                <Inbox className="w-4 h-4" />
              </button>
              <button className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer hidden sm:block">
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>

            {/* Avatar Dropdown */}
            <div className="relative">
              <button
                onClick={() => setAvatarDropdownOpen(!avatarDropdownOpen)}
                className="flex items-center gap-2 focus:outline-none cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs border border-primary/20 hover:bg-primary/20 transition-colors uppercase">
                  {getInitials(admin?.name)}
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-xs font-semibold text-gray-850 dark:text-gray-250 leading-none group-hover:text-gray-950 dark:group-hover:text-white">
                    {admin?.name || "Admin User"}
                  </span>
                  <span className="text-[9px] text-gray-450 mt-0.5">
                    Role: {admin?.role?.name || "Owner"}
                  </span>
                </div>
              </button>
              {avatarDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setAvatarDropdownOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-150 rounded-2xl shadow-xl py-1.5 z-30 animate-scale-up text-xs dark:bg-gray-800 dark:border-gray-750">
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 mb-1 text-left">
                      <p className="font-bold text-gray-800 dark:text-gray-200">{admin?.name || "Admin User"}</p>
                      <p className="text-[10px] text-gray-400">{admin?.email || "admin@fairqueen.com"}</p>
                    </div>
                    <Link
                      to="/admin/profile"
                      onClick={() => setAvatarDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-gray-655 dark:text-gray-300 hover:bg-gray-55 dark:hover:bg-gray-700/50 font-medium transition-colors text-left"
                    >
                      <Settings className="w-3.5 h-3.5 text-gray-400" />
                      Profile Settings
                    </Link>
                    <button
                      onClick={() => {
                        setAvatarDropdownOpen(false);
                        handleLogout();
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2 text-red-655 hover:bg-red-50 dark:hover:bg-red-950/20 font-medium text-left transition-colors cursor-pointer border-t border-gray-100 dark:border-gray-700 mt-1"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-500" />
                      Log Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content outlet */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
