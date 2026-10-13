import React, { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, ShoppingCart, Package, Settings, LogOut, ArrowLeft, 
  FolderHeart, Tag, Star, Users, ClipboardList, FileText, Image, BookOpen, 
  Percent, Coins, BarChart3, Menu, X, Search, Bell, Inbox, Mail, HelpCircle, Truck, Sun, Moon,
  ChevronLeft, ChevronRight, Loader2, ChevronDown, ChevronUp, Award, Monitor, ReceiptText, PackagePlus, Calendar
} from 'lucide-react';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, useAuth } from '../../hooks/useAuth';
import { getAdminToken } from '../auth/RequireAdminAuth';
import ModalStandard from '../ui/ModalStandard';
import AdminA11y from '../ui/AdminA11y';

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
    return localStorage.getItem('dansolam_sidebar_collapsed') === 'true';
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
    return localStorage.getItem('dansolam_admin_dark_mode') === 'true';
  });

  // Mark the document so admin dark styling also reaches modals rendered in portals
  // (outside .admin-shell) without touching the storefront's own dark mode.
  useEffect(() => {
    document.documentElement.classList.toggle('admin-dark', isDarkMode);
    // `dark` follows the admin's own setting here, not the storefront theme.
    document.documentElement.classList.toggle('dark', isDarkMode);
    return () => document.documentElement.classList.remove('admin-dark');
  }, [isDarkMode]);

  // The page template applies the storefront theme to the whole document; inside the
  // admin that leaked storefront dark styles into admin screens (e.g. see-through
  // modals) even with admin dark mode off. Set it aside here, restore it on leaving.
  useEffect(() => {
    const root = document.documentElement;
    const storefrontDark = root.classList.contains('storefront-dark');
    root.classList.remove('storefront-dark');
    return () => {
      root.classList.toggle('storefront-dark', storefrontDark);
      root.classList.toggle('dark', storefrontDark);
    };
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const val = !prev;
      localStorage.setItem('dansolam_admin_dark_mode', val ? 'true' : 'false');
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
      localStorage.setItem('dansolam_currency_symbol', s.system_currency_symbol || '£');
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
      { to: '/admin/fitting-sessions', label: 'Spa Consultations', icon: Calendar, color: 'text-amber-500' },
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

    // One nav item: icon in a ring, label, optional count badge (reference design).
    const itemClass = (active) => `group flex items-center rounded-full text-[13px] font-semibold transition-colors ${
      isCollapsed ? 'justify-center w-12 h-12 mx-auto p-0' : 'gap-3 pl-1.5 pr-3 py-1.5'
    } ${active ? 'admin-nav-active text-white' : 'text-[#CFC7DB] hover:bg-white/[0.06] hover:text-white'}`;
    const ring = (active) => `relative w-9 h-9 shrink-0 rounded-full grid place-items-center border transition-colors ${
      active ? 'border-white/30 bg-white/15' : 'border-white/15 group-hover:border-white/35'
    }`;
    const badgeFor = (label) => (
      label === 'Orders' ? alertCounts.orders : label === 'Inquiries' ? alertCounts.inquiries : label === 'Reviews' ? alertCounts.reviews : 0
    );
    const Badge = ({ count, dot }) => (count > 0 ? (
      dot
        ? <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-[#D01B79] text-white text-[9px] font-bold grid place-items-center ring-2 ring-[#120C18]">{count}</span>
        : <span className="ml-auto min-w-5 h-5 px-1.5 rounded-full bg-[#D01B79] text-white text-[10px] font-bold grid place-items-center">{count}</span>
    ) : null);
    const Tooltip = ({ children }) => (isCollapsed ? (
      <span className="absolute left-[3.75rem] bg-[#1F1729] text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-lg shadow-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap border border-white/10">{children}</span>
    ) : null);

    const Group = ({ label, icon: Icon, active, expanded, onToggle, children: subs }) => (
      <div className="relative group/menu">
        {isCollapsed ? (
          <>
            <button type="button" className={`${itemClass(active)} relative`} aria-label={label}>
              <span className={ring(active)}><Icon className="w-4 h-4" /></span>
            </button>
            <div className="absolute left-[3.75rem] top-0 bg-[#1F1729] border border-white/10 rounded-2xl shadow-xl p-1.5 opacity-0 pointer-events-none group-hover/menu:opacity-100 group-hover/menu:pointer-events-auto transition-opacity z-50 flex flex-col gap-0.5 min-w-[150px]">
              <span className="px-3 pt-1 pb-1.5 text-[10px] uppercase tracking-wider text-[#B8AEC4] font-bold">{label}</span>
              {subs}
            </div>
          </>
        ) : (
          <>
            <button type="button" onClick={onToggle} aria-expanded={expanded} className={`w-full ${itemClass(active)}`}>
              <span className={ring(active)}><Icon className="w-4 h-4" /></span>
              <span className="flex-1 text-left">{label}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
            <div className={`grid transition-all duration-200 ${expanded ? 'grid-rows-[1fr] opacity-100 mt-1 mb-1' : 'grid-rows-[0fr] opacity-0'}`}>
              <div className="overflow-hidden flex flex-col gap-0.5 pl-[3.1rem] pr-1">{subs}</div>
            </div>
          </>
        )}
      </div>
    );
    const subLink = (sub) => {
      const active = isSubActive(sub);
      return (
        <Link
          key={sub.to}
          to={sub.to}
          onClick={onLinkClick}
          className={`px-3 py-2 text-[12px] rounded-full font-semibold transition-colors ${active ? 'bg-white/12 text-white' : 'text-[#B8AEC4] hover:text-white hover:bg-white/[0.06]'}`}
        >
          {sub.label}
        </Link>
      );
    };

    return (
      <>
        {links.map((link) => {
          const active = isActive(link.to);
          const Icon = link.icon;
          const count = badgeFor(link.label);
          return (
            <Link key={link.to} to={link.to} onClick={onLinkClick} aria-current={active ? 'page' : undefined} className={`${itemClass(active)} relative`}>
              <span className={ring(active)}>
                <Icon className="w-4 h-4" />
                {isCollapsed && <Badge count={count} dot />}
              </span>
              {!isCollapsed && <span className="truncate">{link.label}</span>}
              {!isCollapsed && <Badge count={count} />}
              <Tooltip>{link.label}</Tooltip>
            </Link>
          );
        })}

        <Group label="CMS" icon={FileText} active={isCmsActive} expanded={cmsExpanded} onToggle={() => setCmsExpanded((v) => !v)}>
          {subCms.map(subLink)}
        </Group>
        <Group label="Settings" icon={Settings} active={isSettingsActive} expanded={settingsExpanded} onToggle={() => setSettingsExpanded((v) => !v)}>
          {subSettings.map(subLink)}
        </Group>
      </>
    );
  };

  // Page name for the header, from the current route.
  const sectionTitle = (() => {
    const path = location.pathname;
    const named = [
      ['/admin/products/new', 'New product'], ['/admin/products', 'Products'], ['/admin/collections', 'Collections'],
      ['/admin/orders', 'Orders'], ['/admin/pos', 'Point of Sale'], ['/admin/expenses', 'Expenses'], ['/admin/purchases', 'Purchases'],
      ['/admin/coupons', 'Coupons'], ['/admin/discounts', 'Discounts'], ['/admin/customers', 'Customers'], ['/admin/newsletter', 'Newsletter'],
      ['/admin/reviews', 'Reviews'], ['/admin/inventory', 'Inventory'], ['/admin/invoices', 'Invoices'], ['/admin/inquiries', 'Inquiries'],
      ['/admin/fitting-sessions', 'Consultations'], ['/admin/brands', 'Brands'], ['/admin/users', 'Users'], ['/admin/reports', 'Reports'],
      ['/admin/hero', 'Hero'], ['/admin/pages', 'Pages'], ['/admin/articles', 'Blog'], ['/admin/gallery', 'Gallery'],
      ['/admin/settings', 'Settings'], ['/admin/taxes', 'Taxes'], ['/admin/shipping', 'Shipping'], ['/admin/profile', 'Profile'],
    ];
    if (path === '/admin' || path === '/admin/') return 'Dashboard';
    return (named.find(([prefix]) => path.startsWith(prefix)) || [null, 'Admin'])[1];
  })();

  // Brand mark + name (sidebar and mobile drawer).
  const Brand = ({ compact = false }) => (
    <div className={`flex items-center gap-3 min-w-0 ${compact ? 'justify-center' : ''}`}>
      <span className="w-10 h-10 rounded-2xl bg-white grid place-items-center overflow-hidden shrink-0 shadow-sm">
        {settings.logo_url
          ? <img loading="lazy" decoding="async" src={settings.logo_url} alt="" className="w-full h-full object-contain p-1" />
          : <span className="text-[#5D3E85] font-extrabold text-lg">{(ecommerce.name || 'D')[0]}</span>}
      </span>
      {!compact && (
        <span className="min-w-0 text-left">
          <span className="block text-white font-extrabold text-[17px] leading-tight truncate">{ecommerce.name}</span>
          <span className="block text-[11px] font-semibold text-[#B8AEC4] leading-tight">Admin panel</span>
        </span>
      )}
    </div>
  );

  // Signed-in user card with its menu (sidebar footer and mobile drawer).
  const UserCard = ({ compact = false, onNavigate = () => {} }) => (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAvatarDropdownOpen((v) => !v)}
        aria-expanded={avatarDropdownOpen}
        aria-label="Account menu"
        className={`w-full flex items-center gap-3 rounded-full border border-white/15 hover:border-white/30 transition-colors ${compact ? 'p-1 justify-center' : 'p-1.5 pr-2'}`}
      >
        <span className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7A4DB3] to-[#D01B79] text-white grid place-items-center font-bold text-sm shrink-0">{getInitials(admin?.name)}</span>
        {!compact && (
          <>
            <span className="flex-1 min-w-0 text-left">
              <span className="block text-white text-[13px] font-semibold truncate">{admin?.name || 'Admin user'}</span>
              <span className="block text-[11px] text-[#B8AEC4] truncate">{admin?.role?.name || 'Owner'}</span>
            </span>
            <span className="w-7 h-7 rounded-full bg-white/10 grid place-items-center shrink-0"><ChevronDown className={`w-4 h-4 text-white transition-transform ${avatarDropdownOpen ? 'rotate-180' : ''}`} /></span>
          </>
        )}
      </button>
      {avatarDropdownOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setAvatarDropdownOpen(false)} />
          <div className={`absolute bottom-full mb-2 z-50 w-56 rounded-2xl bg-[#1F1729] border border-white/10 shadow-2xl p-1.5 text-[13px] ${compact ? 'left-0' : 'left-0 right-0 w-auto'}`}>
            <div className="px-3 py-2 border-b border-white/10 mb-1">
              <p className="font-semibold text-white truncate">{admin?.name || 'Admin user'}</p>
              <p className="text-[11px] text-[#B8AEC4] truncate">{admin?.email}</p>
            </div>
            <Link to="/admin/profile" onClick={() => { setAvatarDropdownOpen(false); onNavigate(); }} className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#E7E1EF] hover:bg-white/10">
              <Settings className="w-4 h-4" /> Profile settings
            </Link>
            <a href="/" target="_blank" rel="noopener noreferrer" onClick={() => { setAvatarDropdownOpen(false); onNavigate(); }} className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#E7E1EF] hover:bg-white/10">
              <ArrowLeft className="w-4 h-4" /> View storefront
            </a>
            <button type="button" onClick={() => { setAvatarDropdownOpen(false); onNavigate(); handleLogout(); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#FCA5C9] hover:bg-white/10 text-left">
              <LogOut className="w-4 h-4" /> Log out
            </button>
          </div>
        </>
      )}
    </div>
  );

  const roundBtn = 'w-11 h-11 rounded-full grid place-items-center bg-white/80 dark:bg-white/[0.06] border border-[#E2DCEB] dark:border-white/10 text-[#3B3347] dark:text-[#E7E1EF] hover:bg-white dark:hover:bg-white/10 transition-colors cursor-pointer relative';

  return (
    <div className={`admin-shell flex min-h-screen font-sans animate-fade-in ${isDarkMode ? 'dark' : ''}`}>
      <ModalStandard />
      <AdminA11y />

      {/* Desktop sidebar */}
      <aside className={`admin-sidebar hidden md:flex flex-col shrink-0 h-[calc(100vh-2rem)] sticky top-4 my-4 ml-4 rounded-[28px] transition-all duration-300 z-20 ${isCollapsed ? 'w-[5.5rem]' : 'w-64'}`} aria-label="Admin navigation">
        <div className={`flex items-center shrink-0 pt-6 pb-5 ${isCollapsed ? 'flex-col gap-3 px-3' : 'justify-between px-5'}`}>
          <Brand compact={isCollapsed} />
          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => { const val = !prev; localStorage.setItem('dansolam_sidebar_collapsed', val ? 'true' : 'false'); return val; })}
            className="w-8 h-8 rounded-full grid place-items-center text-[#B8AEC4] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
        <nav className={`flex-1 flex flex-col gap-1 overflow-y-auto custom-sidebar-scroll ${isCollapsed ? 'px-2' : 'px-4'}`}>
          {renderNavLinks()}
        </nav>
        <div className={`shrink-0 pt-3 pb-5 ${isCollapsed ? 'px-2' : 'px-4'}`}>
          <UserCard compact={isCollapsed} />
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileSidebarOpen && (
        <>
          <div onClick={() => setMobileSidebarOpen(false)} className="fixed inset-0 bg-black/60 z-40 md:hidden animate-fade-in" />
          <aside className="admin-sidebar fixed inset-y-0 left-0 w-[17rem] max-w-[85vw] z-50 md:hidden flex flex-col shadow-2xl animate-slide-in h-[100dvh] rounded-r-[28px]" aria-label="Admin navigation">
            <div className="flex items-center justify-between gap-3 px-5 pt-6 pb-5 shrink-0">
              <Brand />
              <button type="button" onClick={() => setMobileSidebarOpen(false)} className="w-9 h-9 rounded-full grid place-items-center text-[#CFC7DB] hover:text-white hover:bg-white/10 cursor-pointer" aria-label="Close menu">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 px-4 flex flex-col gap-1 overflow-y-auto custom-sidebar-scroll">
              {renderNavLinks(() => setMobileSidebarOpen(false))}
            </nav>
            <div className="px-4 pt-3 pb-5 shrink-0">
              <UserCard onNavigate={() => setMobileSidebarOpen(false)} />
            </div>
          </aside>
        </>
      )}

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="admin-header px-4 md:px-6 pt-4 md:pt-6 pb-1 flex items-center justify-between gap-3 z-10 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button type="button" onClick={() => setMobileSidebarOpen(true)} className={`${roundBtn} md:hidden`} aria-label="Open menu">
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#5F566B] dark:text-[#B8AEC4] truncate">
              {sectionTitle}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="relative hidden sm:flex items-center w-56 lg:w-80">
              <Search className="w-4 h-4 text-[#5F566B] dark:text-[#B8AEC4] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10" aria-hidden="true" />
              <input
                type="search"
                placeholder="Search orders, products, customers"
                aria-label="Search admin"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setShowSearchDropdown(true); }}
                onFocus={() => setShowSearchDropdown(true)}
                className="admin-search w-full h-11 pl-11! pr-4! rounded-full! text-[13px]"
              />

              {/* Floating Dropdown Results */}
              {showSearchDropdown && (searchQuery.trim().length > 0 || searchLoading) && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowSearchDropdown(false)}></div>
                  <div className="absolute left-0 top-[calc(100%+0.5rem)] w-96 bg-white border border-gray-150 rounded-2xl shadow-xl py-3 z-50 animate-scale-up text-xs max-h-[380px] overflow-y-auto custom-sidebar-scroll dark:bg-gray-800 dark:border-gray-700">
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
                                <span className="text-[10px] font-bold text-gray-850 dark:text-gray-300">{localStorage.getItem('dansolam_currency_symbol') || '£'}{parseFloat(p.price).toLocaleString()}</span>
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
                                  <span className="font-bold text-gray-850 dark:text-gray-300">{localStorage.getItem('dansolam_currency_symbol') || '£'}{parseFloat(o.total_amount).toLocaleString()}</span>
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

            <button type="button" onClick={toggleDarkMode} className={roundBtn} aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
              {isDarkMode ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
            </button>

            <div className="relative">
              <button type="button" onClick={() => setNotificationsOpen(!notificationsOpen)} className={roundBtn} aria-label={`Notifications${notifications.length ? `, ${notifications.length} new` : ''}`}>
                <Bell className="w-[18px] h-[18px]" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-[#DC2626] text-white text-[10px] font-bold grid place-items-center ring-2 ring-[var(--adm-canvas)]">
                    {notifications.length}
                  </span>
                )}
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
          </div>
        </header>

        <main className="flex-1 px-4 md:px-6 pt-3 pb-8 overflow-y-auto max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
