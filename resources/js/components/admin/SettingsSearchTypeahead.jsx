import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ChevronRight, Settings, Lock, CreditCard, Truck, ShieldCheck, Wrench, Mail, FileText, Layers, Database, Volume2 } from 'lucide-react';

const SETTINGS_SEARCH_INDEX = [
  // Brand & Identity
  { id: 'setting-store-identity', title: 'Ecommerce Name & Branding', tab: 'brand', tabName: 'Brand & Identity', keywords: ['name', 'logo', 'favicon', 'color', 'theme', 'tagline', 'identity', 'brand'], desc: 'Manage ecommerce store name, logo, favicon, and primary theme color' },
  { id: 'setting-ceo-profile', title: 'CEO Profile & Bio', tab: 'brand', tabName: 'Brand & Identity', keywords: ['ceo', 'founder', 'bio', 'quote', 'photo', 'picture'], desc: 'Configure CEO name, biography quote, and avatar photo' },
  { id: 'setting-auth-cover', title: 'Auth Pages Cover Image', tab: 'brand', tabName: 'Brand & Identity', keywords: ['auth', 'login', 'register', 'cover', 'image', 'banner', 'subtitle'], desc: 'Customize cover image and headlines on customer login/register pages' },
  { id: 'setting-contact-details', title: 'Beauty Center & Store Contact Details', tab: 'brand', tabName: 'Brand & Identity', keywords: ['contact', 'address', 'email', 'support email', 'whatsapp', 'opening hours', 'schedule', 'closed', 'location', 'phone', 'hours'], desc: 'Manage store physical address, customer support email, WhatsApp number, opening hours, and weekend schedule' },
  { id: 'setting-social-links', title: 'Social Media Channels & Feeds', tab: 'brand', tabName: 'Brand & Identity', keywords: ['instagram', 'facebook', 'tiktok', 'youtube', 'twitter', 'social', 'token', 'feed'], desc: 'Configure official Instagram feed token, Facebook, TikTok, YouTube, and X handles' },
  { id: 'setting-bank-details', title: 'Offline Bank Transfer Details', tab: 'brand', tabName: 'Brand & Identity', keywords: ['bank', 'transfer', 'account', 'number', 'name', 'offline', 'payment'], desc: 'Configure bank account details for direct bank transfer payments' },
  { id: 'setting-sku-currency', title: 'SKU, Currency & Timezone', tab: 'brand', tabName: 'Brand & Identity', keywords: ['sku', 'prefix', 'currency', 'ngn', 'naira', 'symbol', 'timezone', 'country', 'domestic'], desc: 'Set system currency code, symbol, timezone, and SKU prefixes' },

  // Announcements & Popups
  { id: 'setting-announcement-bar', title: 'Top Announcement Bar', tab: 'promotions', tabName: 'Announcements & Popups', keywords: ['announcement', 'top', 'bar', 'ticker', 'banner', 'text', 'headline'], desc: 'Enable and edit the top announcement text bar displayed across storefront' },
  { id: 'setting-promo-popup', title: 'Promotional Newsletter Popup', tab: 'promotions', tabName: 'Announcements & Popups', keywords: ['popup', 'promo', 'modal', 'newsletter', 'discount', 'delay', 'image'], desc: 'Configure automatic newsletter subscription popup modal on homepage' },

  // Shipping Rules
  { id: 'setting-shipping-rates', title: 'Shipping & Delivery Rates', tab: 'shipping', tabName: 'Shipping Rules', keywords: ['shipping', 'delivery', 'rates', 'flat', 'same-day', 'international', 'threshold', 'free', 'overselling'], desc: 'Manage base domestic shipping rates, same-day delivery, free shipping thresholds' },

  // Payment Gateways
  { id: 'setting-payment-active', title: 'Default Payment Gateway', tab: 'payment', tabName: 'Payment Gateways', keywords: ['payment', 'active', 'gateway', 'paystack', 'stripe', 'paypal', 'flutterwave', 'cod'], desc: 'Select default active payment gateway channel for checkout' },
  { id: 'setting-paystack-keys', title: 'Paystack API Keys', tab: 'payment', tabName: 'Payment Gateways', keywords: ['paystack', 'public', 'secret', 'key', 'nigeria', 'naira'], desc: 'Enter Paystack public key and secret key for online card payments' },
  { id: 'setting-flutterwave-keys', title: 'Flutterwave API Keys', tab: 'payment', tabName: 'Payment Gateways', keywords: ['flutterwave', 'rave', 'public', 'secret', 'key'], desc: 'Configure Flutterwave public and secret API keys' },
  { id: 'setting-stripe-keys', title: 'Stripe API Keys', tab: 'payment', tabName: 'Payment Gateways', keywords: ['stripe', 'usd', 'card', 'public', 'secret', 'key'], desc: 'Configure Stripe publishable key and secret key for international checkout' },
  { id: 'setting-paypal-keys', title: 'PayPal Client Credentials', tab: 'payment', tabName: 'Payment Gateways', keywords: ['paypal', 'client', 'secret', 'id'], desc: 'Enter PayPal Client ID and Client Secret' },
  { id: 'setting-cod-toggle', title: 'Cash on Delivery (COD)', tab: 'payment', tabName: 'Payment Gateways', keywords: ['cod', 'cash', 'delivery', 'pay on delivery'], desc: 'Enable or disable Cash on Delivery option at checkout' },

  // SMTP Server
  { id: 'setting-smtp-config', title: 'SMTP Server Configuration', tab: 'smtp', tabName: 'SMTP Server', keywords: ['smtp', 'email', 'host', 'port', 'encryption', 'tls', 'ssl', 'username', 'password', 'from'], desc: 'Configure mail server credentials for outbound customer emails' },
  { id: 'setting-smtp-test', title: 'Send Test Email', tab: 'smtp', tabName: 'SMTP Server', keywords: ['test', 'email', 'send', 'dispatch', 'smtp'], desc: 'Test your SMTP email server connection instantly' },

  // Notification Templates
  { id: 'setting-email-order-placed', title: 'Order Placed Email Template', tab: 'templates', tabName: 'Notification Templates', keywords: ['email', 'template', 'order', 'placed', 'subject', 'body'], desc: 'Edit email subject and message sent when customer places an order' },
  { id: 'setting-email-order-shipped', title: 'Order Shipped Email Template', tab: 'templates', tabName: 'Notification Templates', keywords: ['shipped', 'dispatch', 'tracking', 'email', 'template'], desc: 'Edit email subject and message sent when order is marked shipped' },
  { id: 'setting-email-invoice', title: 'Customer Invoice Email Template', tab: 'templates', tabName: 'Notification Templates', keywords: ['invoice', 'email', 'template', 'billing'], desc: 'Edit customer PDF invoice dispatch email subject and body' },

  // Storefront Pages
  { id: 'setting-page-visibility', title: 'Storefront Pages & Display Toggles', tab: 'pages', tabName: 'Storefront Pages', keywords: ['gallery', 'blog', 'sold', 'count', 'tips', 'beauty', 'visibility'], desc: 'Toggle visibility for Gallery page, Blog, Sold Count badge, and Beauty Tips' },

  // Modules
  { id: 'setting-module-pos', title: 'Point of Sale (POS) Module', tab: 'modules', tabName: 'Modules', keywords: ['pos', 'terminal', 'receipt', 'thermal', 'a4', 'cashier', 'offline', 'footer'], desc: 'Enable POS module, receipt footer message, offline mode, and auto-sync' },
  { id: 'setting-module-expenses', title: 'Expense Tracker Module', tab: 'modules', tabName: 'Modules', keywords: ['expense', 'spending', 'tracker', 'accounting', 'cost'], desc: 'Enable or disable internal business expense management module' },
  { id: 'setting-module-purchases', title: 'Purchase Orders Module', tab: 'modules', tabName: 'Modules', keywords: ['purchase', 'vendor', 'supplier', 'order', 'stock'], desc: 'Enable or disable vendor purchase order and inventory receiving module' },

  // Security & CAPTCHA
  { id: 'setting-captcha-config', title: 'CAPTCHA Anti-Bot Protection', tab: 'security', tabName: 'Security & CAPTCHA', keywords: ['captcha', 'recaptcha', 'turnstile', 'bot', 'spam', 'protection', 'site key', 'secret key', 'forms'], desc: 'Master CAPTCHA toggle, form switches (contact, newsletter, reviews, checkout), site keys' },

  // Maintenance Mode
  { id: 'setting-maintenance-mode', title: 'Storefront Maintenance Mode', tab: 'security', tabName: 'Security & CAPTCHA', keywords: ['maintenance', 'mode', 'lock', 'offline', 'timer', 'reopening', 'headline', 'bypass', 'secret'], desc: 'Lock public storefront with an interactive animated maintenance screen and live countdown' },

  // Demo Data
  { id: 'setting-demo-data', title: 'Demo Data Management', tab: 'demo', tabName: 'Demo Data', keywords: ['demo', 'sample', 'seed', 'reset', 'clear', 'dummy'], desc: 'Populate system with sample luxury products or reset store data' }
];

export default function SettingsSearchTypeahead({ onSelectSetting }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Filter items matching query
  const filteredResults = query.trim() === '' ? [] : SETTINGS_SEARCH_INDEX.filter((item) => {
    const q = query.toLowerCase().trim();
    const matchTitle = item.title.toLowerCase().includes(q);
    const matchDesc = item.desc.toLowerCase().includes(q);
    const matchTab = item.tabName.toLowerCase().includes(q);
    const matchKeywords = item.keywords.some((k) => k.toLowerCase().includes(q));
    return matchTitle || matchDesc || matchTab || matchKeywords;
  });

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut listener (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelect = (item) => {
    setQuery('');
    setIsOpen(false);
    if (onSelectSetting) {
      onSelectSetting(item);
    }
  };

  const handleKeyDownInput = (e) => {
    if (!isOpen || filteredResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredResults.length) % filteredResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredResults[selectedIndex]) {
        handleSelect(filteredResults[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full sm:w-80 z-30 font-sans">
      {/* Search Input Box */}
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDownInput}
          placeholder="Search settings (e.g. CAPTCHA, Stripe, Maintenance)..."
          className="w-full pl-10 pr-14 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-2xs transition-all"
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="absolute right-3 text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <kbd className="absolute right-3 text-[9px] font-mono font-bold text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600 pointer-events-none">
            ⌘K
          </kbd>
        )}
      </div>

      {/* Floating Typeahead Results Dropdown */}
      {isOpen && query.trim() !== '' && (
        <div className="absolute top-full right-0 mt-2 w-full sm:w-96 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-fade-in">
          <div className="px-3.5 py-2 bg-gray-50 dark:bg-gray-850 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
            <span>Settings Search Results ({filteredResults.length})</span>
            <span>Use ↑↓ Enter</span>
          </div>

          {filteredResults.length === 0 ? (
            <div className="p-6 text-center text-xs text-gray-400 font-medium">
              No matching settings found for "<span className="text-gray-700 dark:text-gray-300 font-bold">{query}</span>"
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800/50">
              {filteredResults.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full text-left p-3 flex items-start gap-3 transition-colors cursor-pointer ${
                    idx === selectedIndex ? 'bg-primary/10 dark:bg-primary/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-primary shrink-0 mt-0.5">
                    <Settings className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-gray-900 dark:text-white truncate">
                        {item.title}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-[9px] font-extrabold uppercase shrink-0">
                        {item.tabName}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                      {item.desc}
                    </p>
                  </div>

                  <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 self-center" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
