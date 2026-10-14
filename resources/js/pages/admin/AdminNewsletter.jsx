import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays, ChevronLeft, ChevronRight, Download, Mail, Search, Trash2,
  TrendingUp, Users, Send, Plus, LayoutTemplate, Eye, CheckCircle, AlertCircle,
  FileText, ArrowRight, RefreshCw, Loader2, Play, ExternalLink, ShieldCheck,
  Tag, Clock, Check
} from 'lucide-react';
import { apiFetch } from '../../hooks/useAuth';
import { toast as systemToast } from '../../components/ui/ToastProvider';
import ImageUploadField from '../../components/ui/ImageUploadField';
import SearchableSelect from '../../components/ui/SearchableSelect';

export default function AdminNewsletter() {
  const queryClient = useQueryClient();

  // Active view tab: 'subscribers' | 'campaigns' | 'composer'
  const [activeTab, setActiveTab] = useState('subscribers');

  // ─── TAB 1: SUBSCRIBERS STATE ───
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null);
  const [showAddSubscriberModal, setShowAddSubscriberModal] = useState(false);
  const [newSubscriberEmail, setNewSubscriberEmail] = useState('');

  // ─── TAB 2: CAMPAIGNS LIST STATE ───
  const [campaignSearch, setCampaignSearch] = useState('');
  const [campaignStatus, setCampaignStatus] = useState('all');
  const [viewingCampaign, setViewingCampaign] = useState(null);

  // ─── TAB 3: CAMPAIGN COMPOSER STATE ───
  const [editingCampaignId, setEditingCampaignId] = useState(null);
  const [campaignTitle, setCampaignTitle] = useState('August Glow Routine & Organic Arrivals');
  const [campaignSubject, setCampaignSubject] = useState('Glow Naturally: The 5-Day Organic Routine + Exclusive VIP Code');
  const [campaignPreview, setCampaignPreview] = useState('Discover handcrafted botanical soaps and restorative oils.');
  const [campaignTemplate, setCampaignTemplate] = useState('new_arrival');
  const [campaignBanner, setCampaignBanner] = useState('https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=800');
  const [campaignContent, setCampaignContent] = useState(
    "Hello Beautiful,\n\nWe are thrilled to introduce our newest organic formulations handcrafted with cold-pressed herbal botanicals, shea butter, and almond oils.\n\nWhether you are targeting stubborn hyperpigmentation, dry skin, or looking to restore youthful luminosity, our tailored routines deliver visible results in as little as 5 days.\n\nEnjoy an exclusive 10% discount on your order with code WELCOME10 at checkout."
  );
  const [campaignCtaText, setCampaignCtaText] = useState('Explore Organic Formulas');
  const [campaignCtaUrl, setCampaignCtaUrl] = useState('http://dansolam.test/shop');
  const [testEmail, setTestEmail] = useState('');

  // Debounced search for subscribers
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch Subscribers Query
  const { data: subscribersData, isLoading: isLoadingSubscribers } = useQuery({
    queryKey: ['admin-newsletter-subscribers', search, page],
    queryFn: async () => {
      const response = await apiFetch(`/api/admin/newsletter-subscribers?search=${encodeURIComponent(search)}&page=${page}&per_page=20`);
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Unable to load subscribers.');
      return result;
    },
  });

  const subscribers = subscribersData?.data || [];
  const meta = subscribersData?.meta || { current_page: 1, last_page: 1, total: 0 };
  const stats = subscribersData?.stats || { total: 0, today: 0, last_30_days: 0 };

  // Fetch Campaigns Query
  const { data: campaignsData, isLoading: isLoadingCampaigns } = useQuery({
    queryKey: ['admin-newsletter-campaigns', campaignSearch, campaignStatus],
    queryFn: async () => {
      const response = await apiFetch(`/api/admin/newsletter-campaigns?search=${encodeURIComponent(campaignSearch)}&status=${campaignStatus}`);
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Unable to load campaigns.');
      return result;
    },
  });

  const campaigns = campaignsData?.data || [];
  const campaignStats = campaignsData?.stats || {
    total_campaigns: 0,
    sent_campaigns: 0,
    total_subscribers: stats.total,
    total_emails_broadcast: 0
  };

  // Add Subscriber Mutation
  const addSubscriberMutation = useMutation({
    mutationFn: async (email) => {
      const response = await apiFetch('/api/admin/newsletter-subscribers', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Unable to add subscriber.');
      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin-newsletter-subscribers'] });
      systemToast.success(result.message);
      setShowAddSubscriberModal(false);
      setNewSubscriberEmail('');
    },
    onError: (error) => systemToast.error(error.message),
  });

  // Delete Subscriber Mutation
  const deleteSubscriberMutation = useMutation({
    mutationFn: async (id) => {
      const response = await apiFetch(`/api/admin/newsletter-subscribers/${id}`, { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Unable to remove subscriber.');
      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin-newsletter-subscribers'] });
      systemToast.success(result.message);
    },
    onError: (error) => systemToast.error(error.message),
  });

  // Save / Update Campaign Mutation
  const saveCampaignMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const endpoint = id ? `/api/admin/newsletter-campaigns/${id}` : '/api/admin/newsletter-campaigns';
      const method = id ? 'PUT' : 'POST';
      const response = await apiFetch(endpoint, {
        method,
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Unable to save campaign.');
      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin-newsletter-campaigns'] });
      systemToast.success(result.message);
      setActiveTab('campaigns');
      setEditingCampaignId(null);
    },
    onError: (error) => systemToast.error(error.message),
  });

  // Send Broadcast Mutation (Push to all subscribers)
  const sendCampaignMutation = useMutation({
    mutationFn: async (id) => {
      const response = await apiFetch(`/api/admin/newsletter-campaigns/${id}/send`, { method: 'POST' });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Push failed.');
      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin-newsletter-campaigns'] });
      systemToast.success(result.message);
      if (viewingCampaign) setViewingCampaign(null);
    },
    onError: (error) => systemToast.error(error.message),
  });

  // Test Email Mutation
  const testEmailMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await apiFetch('/api/admin/newsletter-campaigns/test-send', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Test email failed.');
      return result;
    },
    onSuccess: (result) => {
      systemToast.success(result.message);
    },
    onError: (error) => systemToast.error(error.message),
  });

  // Delete Campaign Mutation
  const deleteCampaignMutation = useMutation({
    mutationFn: async (id) => {
      const response = await apiFetch(`/api/admin/newsletter-campaigns/${id}`, { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Unable to delete campaign.');
      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin-newsletter-campaigns'] });
      systemToast.success(result.message);
    },
    onError: (error) => systemToast.error(error.message),
  });

  // Preset Template loader
  const handleApplyPreset = (templateKey) => {
    setCampaignTemplate(templateKey);
    if (templateKey === 'new_arrival') {
      setCampaignTitle('New Season Organic Skincare Arrivals');
      setCampaignSubject('Unveiling Our Latest Handcrafted Skincare Drops');
      setCampaignPreview('Explore gentle herbal polishes, whitening soaps, and night elixirs.');
      setCampaignBanner('https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=800');
      setCampaignContent(
        "Dear Skincare Enthusiast,\n\nOur artisans at Dansolam Beauty Home have finalized our latest botanical collection. Specially formulated for sensitive and melanin-rich skin, each product is enriched with pure almond oils, turmeric extracts, and deep moisturizing plant butters.\n\nExperience radiant luminosity and smooth textures today."
      );
      setCampaignCtaText('Shop New Arrivals');
      setCampaignCtaUrl('http://dansolam.test/shop');
    } else if (templateKey === 'spa_consultation') {
      setCampaignTitle('Exclusive VIP Spa & Consultation Sessions');
      setCampaignSubject('💆 Reserve Your Private Abuja Aesthetics Consultation');
      setCampaignPreview('Personalized routine analysis and targeted skincare guidance.');
      setCampaignBanner('https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=800');
      setCampaignContent(
        "Hello,\n\nElevate your skincare journey with a 1-on-1 private consultation at our Abuja Beauty Sanctuary. Our master aesthetician will evaluate your skin type, curate custom routines, and formulate direct solutions for sun damage, acne marks, and uneven pigmentation."
      );
      setCampaignCtaText('Book VIP Session');
      setCampaignCtaUrl('http://dansolam.test/fitting-sessions');
    } else if (templateKey === 'flash_promo') {
      setCampaignTitle('Flash Weekend Glow Discount — 15% OFF');
      setCampaignSubject('🎁 Weekend VIP Exclusive: 15% OFF All Herbal Soaps & Body Polish');
      setCampaignPreview('Use coupon code WEEKEND15 before Sunday midnight.');
      setCampaignBanner('https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=800');
      setCampaignContent(
        "Exclusive VIP Offer,\n\nThis weekend only, claim 15% OFF our bestselling whitening polish soaps, discoloration body creams, and glow oils.\n\nEnter code WEEKEND15 at checkout. Free delivery on orders over £500."
      );
      setCampaignCtaText('Claim Weekend Discount');
      setCampaignCtaUrl('http://dansolam.test/shop');
    }
  };

  const handleEditCampaign = (camp) => {
    setEditingCampaignId(camp.id);
    setCampaignTitle(camp.title);
    setCampaignSubject(camp.subject);
    setCampaignPreview(camp.preview_text || '');
    setCampaignTemplate(camp.template || 'custom');
    setCampaignBanner(camp.banner_image_url || '');
    setCampaignContent(camp.content_html || '');
    setCampaignCtaText(camp.cta_text || 'Shop Now');
    setCampaignCtaUrl(camp.cta_url || 'http://dansolam.test/shop');
    setActiveTab('composer');
  };

  const handleSaveCampaign = (status = 'draft') => {
    saveCampaignMutation.mutate({
      id: editingCampaignId,
      payload: {
        title: campaignTitle,
        subject: campaignSubject,
        preview_text: campaignPreview,
        template: campaignTemplate,
        content_html: campaignContent,
        cta_text: campaignCtaText,
        cta_url: campaignCtaUrl,
        banner_image_url: campaignBanner,
        status
      }
    });
  };

  const handleSendTestEmail = (e) => {
    e.preventDefault();
    if (!testEmail) {
      systemToast.error('Please enter a recipient test email address.');
      return;
    }
    testEmailMutation.mutate({
      test_email: testEmail,
      title: campaignTitle,
      subject: campaignSubject,
      preview_text: campaignPreview,
      content_html: campaignContent,
      cta_text: campaignCtaText,
      cta_url: campaignCtaUrl,
      banner_image_url: campaignBanner
    });
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const response = await apiFetch('/api/admin/newsletter-subscribers/export');
      if (!response.ok) throw new Error('Export could not be generated.');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      systemToast.success('Subscriber CSV exported successfully.');
    } catch (error) {
      systemToast.error(error.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-none text-left">
      
      {/* ─── 1. PAGE HEADER & THREE-WAY TAB SWITCHER ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-white/10 pb-6 text-left">
        <div>
          <h2 className="font-sans font-extrabold text-2xl md:text-3xl text-gray-900 dark:text-white leading-tight">
            Newsletter & Campaign Studio
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-semibold">
            Manage subscriber audience, create luxury email broadcasts, and push newsletter campaigns end-to-end.
          </p>
        </div>

        {/* Tab Switcher Buttons */}
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-white/10 p-1.5 rounded-full border border-gray-200 dark:border-white/10 shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab('subscribers')}
            className={`px-4 py-2 rounded-full text-xs font-black transition-all cursor-pointer ${
              activeTab === 'subscribers'
                ? 'bg-[#5D3E85] text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Subscribers ({stats.total})
          </button>
          
          <button
            type="button"
            onClick={() => setActiveTab('campaigns')}
            className={`px-4 py-2 rounded-full text-xs font-black transition-all cursor-pointer ${
              activeTab === 'campaigns'
                ? 'bg-[#5D3E85] text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Campaigns ({campaignStats.total_campaigns})
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingCampaignId(null);
              setActiveTab('composer');
            }}
            className={`px-4 py-2 rounded-full text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'composer'
                ? 'bg-[#EC268F] text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Push New Campaign</span>
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* ─── TAB 1: SUBSCRIBERS & AUDIENCE LIST ─── */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'subscribers' && (
        <div className="flex flex-col gap-6 animate-fade-in text-left">
          
          {/* KPI Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white dark:bg-[#1E1528] border-2 border-gray-200 dark:border-white/15 rounded-3xl p-6 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Total Active Subscribers</span>
                <span className="text-3xl font-extrabold text-gray-950 dark:text-white mt-1 block">{stats.total}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#5D3E85]/10 text-[#5D3E85] dark:text-[#EC268F]">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white dark:bg-[#1E1528] border-2 border-gray-200 dark:border-white/15 rounded-3xl p-6 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Joined Today</span>
                <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 block">{stats.today}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-600">
                <CalendarDays className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white dark:bg-[#1E1528] border-2 border-gray-200 dark:border-white/15 rounded-3xl p-6 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Last 30 Days Growth</span>
                <span className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 mt-1 block">{stats.last_30_days}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-blue-50 text-blue-600">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Controls Bar & Table */}
          <div className="bg-white dark:bg-[#1E1528] border-2 border-gray-200 dark:border-white/15 rounded-3xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-gray-100 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search subscriber by email address…"
                  className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-gray-300 bg-white dark:bg-black/20 text-gray-900 dark:text-white focus:outline-none focus:border-[#5D3E85]"
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddSubscriberModal(true)}
                  className="px-4 py-2 bg-[#5D3E85] hover:bg-[#4D326F] text-white rounded-full text-xs font-black inline-flex items-center gap-1.5 shadow-sm transition-all cursor-pointer btn-spring"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Subscriber</span>
                </button>

                <button
                  type="button"
                  onClick={exportCsv}
                  disabled={exporting || stats.total === 0}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-gray-800 dark:text-white rounded-full text-xs font-black inline-flex items-center gap-1.5 border border-gray-300 dark:border-white/15 shadow-xs transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{exporting ? 'Exporting…' : 'Export CSV'}</span>
                </button>
              </div>
            </div>

            {/* Table content */}
            {isLoadingSubscribers ? (
              <div className="p-16 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#5D3E85]" />
                <span>Loading subscribers audience…</span>
              </div>
            ) : subscribers.length === 0 ? (
              <div className="p-16 text-center">
                <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="font-sans font-bold text-gray-700 dark:text-gray-300 text-base">No subscribers found</h3>
                <p className="text-xs text-gray-400 mt-1">New newsletter signups through the storefront and manual additions will appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50/70 dark:bg-white/5 border-b border-gray-100 dark:border-white/10 text-[10px] font-black uppercase tracking-wider text-gray-500">
                      <th className="py-3 px-6">Subscriber</th>
                      <th className="py-3 px-6">Status</th>
                      <th className="py-3 px-6">Subscribed Date</th>
                      <th className="py-3 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscribers.map((subscriber) => (
                      <tr key={subscriber.id} className="border-b border-gray-100 dark:border-white/5 last:border-0 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-3">
                            <span className="w-9 h-9 rounded-full bg-[#5D3E85]/10 text-[#5D3E85] dark:text-[#EC268F] flex items-center justify-center font-bold">
                              <Mail className="w-4 h-4" />
                            </span>
                            <a href={`mailto:${subscriber.email}`} className="font-bold text-xs text-gray-900 dark:text-white hover:text-[#5D3E85]">
                              {subscriber.email}
                            </a>
                          </div>
                        </td>
                        <td className="py-3.5 px-6">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            ACTIVE SUBSCRIBER
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-xs text-gray-500 dark:text-gray-400 font-medium">
                          {new Date(subscriber.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              if (confirmingDeleteId === subscriber.id) {
                                deleteSubscriberMutation.mutate(subscriber.id);
                                setConfirmingDeleteId(null);
                              } else {
                                setConfirmingDeleteId(subscriber.id);
                                systemToast.info('Click trash again to confirm removal.');
                              }
                            }}
                            className={`p-2 rounded-full border cursor-pointer transition-all ${
                              confirmingDeleteId === subscriber.id
                                ? 'bg-red-500 border-red-500 text-white'
                                : 'border-rose-200 text-rose-500 hover:bg-rose-50'
                            }`}
                            title={confirmingDeleteId === subscriber.id ? 'Click again to confirm removal' : 'Remove subscriber'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {meta.last_page > 1 && (
              <div className="p-4 border-t border-gray-100 dark:border-white/10 flex items-center justify-between">
                <span className="text-xs text-gray-400 font-medium">Page {meta.current_page} of {meta.last_page}</span>
                <div className="flex gap-2">
                  <button disabled={page <= 1} onClick={() => setPage(v => v - 1)} className="p-2 rounded-full border border-gray-200 dark:border-white/15 disabled:opacity-40 cursor-pointer">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button disabled={page >= meta.last_page} onClick={() => setPage(v => v + 1)} className="p-2 rounded-full border border-gray-200 dark:border-white/15 disabled:opacity-40 cursor-pointer">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* ─── TAB 2: CAMPAIGNS & BROADCASTS LIST ─── */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'campaigns' && (
        <div className="flex flex-col gap-6 animate-fade-in text-left">
          
          {/* Campaign Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
            <div className="bg-white dark:bg-[#1E1528] border-2 border-gray-200 dark:border-white/15 rounded-3xl p-6 shadow-sm">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Total Campaigns</span>
              <span className="text-3xl font-extrabold text-gray-950 dark:text-white mt-1 block">{campaignStats.total_campaigns}</span>
            </div>

            <div className="bg-white dark:bg-[#1E1528] border-2 border-gray-200 dark:border-white/15 rounded-3xl p-6 shadow-sm">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Broadcasts Sent</span>
              <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 block">{campaignStats.sent_campaigns}</span>
            </div>

            <div className="bg-white dark:bg-[#1E1528] border-2 border-gray-200 dark:border-white/15 rounded-3xl p-6 shadow-sm">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Total Emails Broadcast</span>
              <span className="text-3xl font-extrabold text-[#5D3E85] dark:text-[#EC268F] mt-1 block">{campaignStats.total_emails_broadcast}</span>
            </div>

            <div className="bg-white dark:bg-[#1E1528] border-2 border-gray-200 dark:border-white/15 rounded-3xl p-6 shadow-sm">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Ready Audience</span>
              <span className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 mt-1 block">{stats.total} subscribers</span>
            </div>
          </div>

          {/* Campaigns Grid */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <input
                  type="text"
                  value={campaignSearch}
                  onChange={e => setCampaignSearch(e.target.value)}
                  placeholder="Filter campaigns by title or subject..."
                  className="px-3.5 py-2 border border-gray-300 rounded-xl text-xs bg-white text-gray-900 w-72 focus:outline-none focus:border-[#5D3E85]"
                />
                <SearchableSelect
                  value={campaignStatus}
                  onChange={e => setCampaignStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-xl text-xs bg-white text-gray-900 focus:outline-none focus:border-[#5D3E85]"
                >
                  <option value="all">All Statuses</option>
                  <option value="sent">Sent Broadcasts</option>
                  <option value="draft">Drafts</option>
                </SearchableSelect>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingCampaignId(null);
                  setActiveTab('composer');
                }}
                className="px-5 py-2.5 bg-[#5D3E85] hover:bg-[#4D326F] text-white rounded-full text-xs font-black inline-flex items-center gap-2 shadow-md transition-all cursor-pointer btn-spring"
              >
                <Plus className="w-4 h-4" />
                <span>+ Create & Push Campaign</span>
              </button>
            </div>

            {isLoadingCampaigns ? (
              <div className="p-16 text-center text-xs text-gray-400 flex items-center justify-center gap-2 bg-white dark:bg-[#1E1528] rounded-3xl border border-gray-200">
                <Loader2 className="w-4 h-4 animate-spin text-[#5D3E85]" />
                <span>Loading campaigns...</span>
              </div>
            ) : campaigns.length === 0 ? (
              <div className="p-16 text-center bg-white dark:bg-[#1E1528] rounded-3xl border-2 border-gray-200 dark:border-white/15">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="font-bold text-gray-800 dark:text-gray-200 text-base">No newsletter campaigns found</h3>
                <p className="text-xs text-gray-400 mt-1">Create your first broadcast to send promotional updates, routine guides, and drops to your subscribers.</p>
                <button
                  type="button"
                  onClick={() => {
                    setEditingCampaignId(null);
                    setActiveTab('composer');
                  }}
                  className="mt-4 px-5 py-2.5 bg-[#5D3E85] text-white rounded-full text-xs font-black shadow-md cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" /> Push New Campaign
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {campaigns.map(camp => (
                  <div
                    key={camp.id}
                    className="bg-white dark:bg-[#1E1528] border-2 border-gray-200 dark:border-white/15 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      {/* Banner image or preview block */}
                      {camp.banner_image_url ? (
                        <div className="h-32 bg-gray-900 overflow-hidden relative">
                          <img src={camp.banner_image_url} alt="" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                              camp.status === 'sent' ? 'bg-emerald-600' : 'bg-amber-600'
                            }`}>
                              {camp.status === 'sent' ? 'SENT BROADCAST' : 'DRAFT'}
                            </span>
                            <span className="text-[10px] font-bold">
                              {camp.recipients_count || 0} recipients
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            camp.status === 'sent' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {camp.status === 'sent' ? 'SENT BROADCAST' : 'DRAFT'}
                          </span>
                          <span className="text-[10px] text-gray-500 font-bold">
                            {camp.recipients_count || 0} recipients
                          </span>
                        </div>
                      )}

                      {/* Card Content */}
                      <div className="p-5 flex flex-col gap-2.5">
                        <h4 className="font-bold text-gray-950 dark:text-white text-base tracking-tight leading-snug">
                          {camp.title}
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                          <strong>Subject:</strong> {camp.subject}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                          {camp.content_html}
                        </p>
                        
                        <div className="pt-2 text-[10px] text-gray-400 flex items-center gap-1 font-semibold">
                          <Clock className="w-3 h-3" />
                          <span>{camp.sent_at ? `Sent ${new Date(camp.sent_at).toLocaleDateString()}` : `Created ${new Date(camp.created_at).toLocaleDateString()}`}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="p-4 border-t border-gray-100 dark:border-white/10 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {camp.status !== 'sent' ? (
                          <button
                            type="button"
                            onClick={() => sendCampaignMutation.mutate(camp.id)}
                            disabled={sendCampaignMutation.isPending}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-black shadow-xs flex items-center gap-1 cursor-pointer btn-spring"
                          >
                            <Send className="w-3 h-3" />
                            <span>Push Now</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> Broadcasted
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleEditCampaign(camp)}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-white/10 text-gray-800 dark:text-white rounded-full text-xs font-bold border border-gray-300 dark:border-white/15 cursor-pointer"
                        >
                          Edit
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete campaign "${camp.title}"?`)) {
                            deleteCampaignMutation.mutate(camp.id);
                          }
                        }}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-full border border-rose-100 cursor-pointer"
                        title="Delete campaign"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* ─── TAB 3: CAMPAIGN PUSH & BROADCAST STUDIO (COMPOSER) ─── */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'composer' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 animate-fade-in text-left">
          
          {/* LEFT 7 COLS: FORM COMPOSER */}
          <div className="xl:col-span-7 flex flex-col gap-6">
            
            {/* Quick Templates Selector */}
            <div className="bg-white dark:bg-[#1E1528] border-2 border-gray-200 dark:border-white/15 rounded-3xl p-6 shadow-sm flex flex-col gap-3">
              <div className="flex items-center gap-2 text-[#5D3E85] dark:text-[#EC268F]">
                <LayoutTemplate className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-wider">Quick Skincare Campaign Templates</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleApplyPreset('new_arrival')}
                  className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                    campaignTemplate === 'new_arrival'
                      ? 'border-[#5D3E85] bg-[#5D3E85]/5 dark:bg-[#5D3E85]/20 font-bold'
                      : 'border-gray-200 hover:bg-gray-50 dark:hover:bg-white/5'
                  }`}
                >
                  <span className="text-xs font-black text-gray-900 dark:text-white block">🌿 New Season Drops</span>
                  <span className="text-[10px] text-gray-500 mt-0.5 block">Showcase latest organic arrivals.</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyPreset('spa_consultation')}
                  className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                    campaignTemplate === 'spa_consultation'
                      ? 'border-[#EC268F] bg-[#EC268F]/5 dark:bg-[#EC268F]/20 font-bold'
                      : 'border-gray-200 hover:bg-gray-50 dark:hover:bg-white/5'
                  }`}
                >
                  <span className="text-xs font-black text-gray-900 dark:text-white block">💆 Spa Consultations</span>
                  <span className="text-[10px] text-gray-500 mt-0.5 block">Invite clients to VIP sanctuary.</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyPreset('flash_promo')}
                  className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                    campaignTemplate === 'flash_promo'
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/20 font-bold'
                      : 'border-gray-200 hover:bg-gray-50 dark:hover:bg-white/5'
                  }`}
                >
                  <span className="text-xs font-black text-gray-900 dark:text-white block">🎁 Weekend Flash Coupon</span>
                  <span className="text-[10px] text-gray-500 mt-0.5 block">Limited discount promotion.</span>
                </button>
              </div>
            </div>

            {/* Campaign Form Inputs */}
            <div className="bg-white dark:bg-[#1E1528] border-2 border-gray-200 dark:border-white/15 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col gap-4">
              <h3 className="font-extrabold text-lg text-gray-950 dark:text-white border-b border-gray-100 dark:border-white/10 pb-3">
                {editingCampaignId ? 'Edit Broadcast Campaign' : 'Compose New Skincare Campaign'}
              </h3>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-gray-600 dark:text-gray-300 font-black uppercase">
                  Internal Campaign Title *
                </label>
                <input
                  type="text"
                  required
                  value={campaignTitle}
                  onChange={e => setCampaignTitle(e.target.value)}
                  placeholder="e.g. August Organic Glow Drop Announcement"
                  className="px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs bg-white text-gray-900 font-bold focus:outline-none focus:border-[#5D3E85]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-600 dark:text-gray-300 font-black uppercase">
                    Email Subject Line *
                  </label>
                  <input
                    type="text"
                    required
                    value={campaignSubject}
                    onChange={e => setCampaignSubject(e.target.value)}
                    placeholder="e.g. The 5-Day Organic Routine for Glowing Skin"
                    className="px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs bg-white text-gray-900 focus:outline-none focus:border-[#5D3E85]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-600 dark:text-gray-300 font-black uppercase">
                    Preview / Preheader Text
                  </label>
                  <input
                    type="text"
                    value={campaignPreview}
                    onChange={e => setCampaignPreview(e.target.value)}
                    placeholder="Short summary preview shown in inbox..."
                    className="px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs bg-white text-gray-900 focus:outline-none focus:border-[#5D3E85]"
                  />
                </div>
              </div>

              <ImageUploadField
                label="Hero Banner Image"
                value={campaignBanner}
                onChange={setCampaignBanner}
                aspect="banner"
                hint="Upload campaign image or supply a high resolution banner URL."
              />

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-gray-600 dark:text-gray-300 font-black uppercase">
                  Editorial Body Content (HTML / Text) *
                </label>
                <textarea
                  rows={7}
                  value={campaignContent}
                  onChange={e => setCampaignContent(e.target.value)}
                  placeholder="Write your email announcement here..."
                  className="px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs bg-white text-gray-900 focus:outline-none focus:border-[#5D3E85] leading-relaxed font-sans"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-600 dark:text-gray-300 font-black uppercase">
                    CTA Button Label
                  </label>
                  <input
                    type="text"
                    value={campaignCtaText}
                    onChange={e => setCampaignCtaText(e.target.value)}
                    placeholder="e.g. Shop New Formulas"
                    className="px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs bg-white text-gray-900 focus:outline-none focus:border-[#5D3E85]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-600 dark:text-gray-300 font-black uppercase">
                    CTA Button Destination URL
                  </label>
                  <input
                    type="text"
                    value={campaignCtaUrl}
                    onChange={e => setCampaignCtaUrl(e.target.value)}
                    placeholder="http://dansolam.test/shop"
                    className="px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs bg-white text-gray-900 font-mono focus:outline-none focus:border-[#5D3E85]"
                  />
                </div>
              </div>

              {/* Action Buttons Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => handleSaveCampaign('draft')}
                  disabled={saveCampaignMutation.isPending}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-white/10 text-gray-800 dark:text-white rounded-full text-xs font-black border border-gray-300 dark:border-white/15 cursor-pointer shadow-xs"
                >
                  Save as Draft
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (stats.total === 0) {
                        systemToast.error('You need at least 1 subscriber to push a live broadcast.');
                        return;
                      }
                      if (confirm(`Are you ready to broadcast and push "${campaignTitle}" to ALL ${stats.total} subscribers immediately?`)) {
                        saveCampaignMutation.mutate(
                          {
                            id: editingCampaignId,
                            payload: {
                              title: campaignTitle,
                              subject: campaignSubject,
                              preview_text: campaignPreview,
                              template: campaignTemplate,
                              content_html: campaignContent,
                              cta_text: campaignCtaText,
                              cta_url: campaignCtaUrl,
                              banner_image_url: campaignBanner,
                              status: 'draft'
                            }
                          },
                          {
                            onSuccess: (res) => {
                              const campId = res.data?.id || editingCampaignId;
                              if (campId) {
                                sendCampaignMutation.mutate(campId);
                              }
                            }
                          }
                        );
                      }
                    }}
                    disabled={sendCampaignMutation.isPending || saveCampaignMutation.isPending}
                    className="px-6 py-3 bg-[#EC268F] hover:bg-[#D01B79] text-white rounded-full text-xs font-black flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer btn-spring"
                  >
                    {sendCampaignMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Broadcasting to {stats.total} subscribers...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>🚀 Push Campaign to {stats.total} Subscribers</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>

            {/* Test Preview Sender */}
            <div className="bg-white dark:bg-[#1E1528] border-2 border-gray-200 dark:border-white/15 rounded-3xl p-6 shadow-sm flex flex-col gap-3">
              <div className="flex items-center gap-2 text-gray-900 dark:text-white font-bold text-xs">
                <Mail className="w-4 h-4 text-[#5D3E85]" />
                <span>Send Single Test Preview Email</span>
              </div>
              <p className="text-[11px] text-gray-500">
                Deliver a single test preview to verify design and links before launching the full broadcast.
              </p>
              <form onSubmit={handleSendTestEmail} className="flex gap-2">
                <input
                  type="email"
                  required
                  value={testEmail}
                  onChange={e => setTestEmail(e.target.value)}
                  placeholder="admin@dansolam.test"
                  className="px-3 py-2 border border-gray-300 rounded-xl text-xs bg-white text-gray-900 flex-1 focus:outline-none focus:border-[#5D3E85]"
                />
                <button
                  type="submit"
                  disabled={testEmailMutation.isPending}
                  className="px-4 py-2 bg-[#5D3E85] text-white text-xs font-bold rounded-xl hover:bg-[#4D326F] cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  {testEmailMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Send Test</span>
                </button>
              </form>
            </div>

          </div>

          {/* RIGHT 5 COLS: LIVE EMAIL PREVIEW */}
          <div className="xl:col-span-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-bold text-xs">
                <Eye className="w-4 h-4 text-[#EC268F]" />
                <span>Live Inbox Email Preview</span>
              </div>
              <span className="text-[10px] text-gray-400 font-mono">Desktop & Mobile Ready</span>
            </div>

            {/* Email Container Frame */}
            <div className="bg-[#FAF7FC] border-2 border-gray-200 dark:border-white/15 rounded-3xl p-4 sm:p-6 shadow-md flex flex-col gap-4 max-w-md mx-auto w-full text-left">
              
              {/* Fake Email Client Header */}
              <div className="bg-white rounded-2xl p-3 border border-gray-200 shadow-xs flex flex-col gap-1 text-[11px]">
                <div className="flex items-center justify-between text-gray-400 font-mono text-[9px]">
                  <span>From: Dansolam Beauty Home &lt;vip@dansolam.test&gt;</span>
                  <span>Now</span>
                </div>
                <div className="font-bold text-gray-900 truncate">
                  Subject: {campaignSubject || 'Exclusive Organic Skincare'}
                </div>
                {campaignPreview && (
                  <div className="text-gray-500 text-[10px] truncate">
                    {campaignPreview}
                  </div>
                )}
              </div>

              {/* Rendered Email Body */}
              <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                
                {/* Luxury Header Banner */}
                <div className="bg-[#17101F] p-5 text-center border-b-2 border-[#EC268F]">
                  <span className="text-[#E5C158] text-[9px] font-black tracking-widest uppercase block mb-1">
                    Dansolam Beauty Home
                  </span>
                  <h3 className="text-white text-base font-bold tracking-tight">
                    {campaignTitle || 'New Skincare Routine'}
                  </h3>
                </div>

                {/* Body Content */}
                <div className="p-5 flex flex-col gap-3.5">
                  {campaignBanner && (
                    <div className="rounded-xl overflow-hidden aspect-video bg-gray-100">
                      <img src={campaignBanner} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="text-xs text-gray-700 leading-relaxed whitespace-pre-line font-sans">
                    {campaignContent}
                  </div>

                  {campaignCtaText && (
                    <div className="text-center pt-2 pb-1">
                      <span className="inline-block px-5 py-2.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-[#5D3E85] to-[#EC268F] shadow-sm">
                        {campaignCtaText} &rarr;
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="bg-[#FAF7FC] p-3 text-center border-t border-gray-100 text-[9px] text-gray-500">
                  <p className="font-semibold text-gray-700">Dansolam Beauty Home & Spa</p>
                  <p className="mt-0.5 text-gray-400">100% Organic Botanical Extracts &bull; Abuja Sanctuary</p>
                  <p className="mt-1 text-gray-400 underline">Unsubscribe</p>
                </div>

              </div>

            </div>
          </div>

        </div>
      )}

      {/* ─── ADD SUBSCRIBER MODAL ─── */}
      {showAddSubscriberModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#1E1528] rounded-3xl max-w-md w-full p-6 sm:p-7 flex flex-col gap-5 border border-gray-200 dark:border-white/10 text-left shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 pb-3">
              <h3 className="font-extrabold text-lg text-gray-950 dark:text-white">Add Subscriber to Audience</h3>
              <button
                type="button"
                onClick={() => setShowAddSubscriberModal(false)}
                className="p-1 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newSubscriberEmail.trim()) return;
                addSubscriberMutation.mutate(newSubscriberEmail.trim());
              }}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-600 dark:text-gray-300 font-black uppercase">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={newSubscriberEmail}
                  onChange={e => setNewSubscriberEmail(e.target.value)}
                  placeholder="customer@example.com"
                  className="px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs bg-white text-gray-900 focus:outline-none focus:border-[#5D3E85]"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-100 dark:border-white/10 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddSubscriberModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-full text-xs font-bold hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addSubscriberMutation.isPending}
                  className="px-5 py-2 bg-[#5D3E85] hover:bg-[#4D326F] text-white text-xs font-black rounded-full shadow-md cursor-pointer btn-spring"
                >
                  {addSubscriberMutation.isPending ? 'Adding…' : 'Add to Audience'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
