import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast as systemToast } from '../../components/ui/ToastProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Edit, Save, X, FileText, Globe, ArrowUpRight, HelpCircle } from 'lucide-react';
import { apiFetch } from '../../hooks/useAuth';
import RichTextEditor from '../../components/ui/RichTextEditor';

export default function AdminPages() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();

  // Tab state: 'pages' or 'faqs'
  const requestedTab = new URLSearchParams(location.search).get('tab');
  const [activeTab, setActiveTab] = useState(requestedTab === 'faqs' ? 'faqs' : 'pages');

  useEffect(() => {
    setActiveTab(requestedTab === 'faqs' ? 'faqs' : 'pages');
  }, [requestedTab]);

  const changeTab = (tab) => {
    setActiveTab(tab);
    navigate(`/admin/pages?tab=${tab}`, { replace: true });
  };

  // =========================================================================
  // 1. CMS Pages State & Mutations
  // =========================================================================
  const [showPageModal, setShowPageModal] = useState(false);
  const [editingPage, setEditingPage] = useState(null);
  const [pageTitle, setPageTitle] = useState('');
  const [pageSlug, setPageSlug] = useState('');
  const [pageContent, setPageContent] = useState('');

  // Fetch Pages
  const { data: pagesRes, isLoading: isPagesLoading } = useQuery({
    queryKey: ['admin-pages'],
    queryFn: () => apiFetch('/api/admin/pages').then(res => res.json())
  });
  const pages = pagesRes?.data || [];

  const handleOpenPageCreate = () => {
    setEditingPage(null);
    setPageTitle('');
    setPageSlug('');
    setPageContent('');
    setShowPageModal(true);
  };

  const handleOpenPageEdit = (page) => {
    setEditingPage(page);
    setPageTitle(page.title);
    setPageSlug(page.slug);
    setPageContent(page.content);
    setShowPageModal(true);
  };

  const createPageMutation = useMutation({
    mutationFn: (payload) => {
      return apiFetch('/api/admin/pages', {
        method: 'POST',
        body: JSON.stringify(payload)
      }).then(res => res.json());
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries(['admin-pages']);
        setShowPageModal(false);
      } else {
        systemToast.error(data.message || 'Failed to create page');
      }
    }
  });

  const updatePageMutation = useMutation({
    mutationFn: ({ id, payload }) => {
      return apiFetch(`/api/admin/pages/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      }).then(res => res.json());
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries(['admin-pages']);
        setShowPageModal(false);
      } else {
        systemToast.error(data.message || 'Failed to update page');
      }
    }
  });

  const deletePageMutation = useMutation({
    mutationFn: (id) => {
      return apiFetch(`/api/admin/pages/${id}`, { method: 'DELETE' }).then(res => res.json());
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries(['admin-pages']);
      } else {
        systemToast.error(data.message || 'Failed to delete page');
      }
    }
  });

  const handlePageSubmit = (e) => {
    e.preventDefault();
    const payload = { title: pageTitle, slug: pageSlug, content: pageContent };
    if (editingPage) {
      updatePageMutation.mutate({ id: editingPage.id, payload });
    } else {
      createPageMutation.mutate(payload);
    }
  };

  // =========================================================================
  // 2. FAQs Repeater State & Mutations
  // =========================================================================
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');
  const [faqSortOrder, setFaqSortOrder] = useState('0');

  // Fetch FAQs
  const { data: faqsRes, isLoading: isFaqsLoading } = useQuery({
    queryKey: ['admin-faqs'],
    queryFn: () => apiFetch('/api/admin/faqs').then(res => res.json())
  });
  const faqs = faqsRes?.data || [];

  const handleOpenFaqCreate = () => {
    setEditingFaq(null);
    setFaqQuestion('');
    setFaqAnswer('');
    setFaqSortOrder(String(faqs.length + 1));
    setShowFaqModal(true);
  };

  const handleOpenFaqEdit = (faq) => {
    setEditingFaq(faq);
    setFaqQuestion(faq.question);
    setFaqAnswer(faq.answer);
    setFaqSortOrder(String(faq.sort_order));
    setShowFaqModal(true);
  };

  const createFaqMutation = useMutation({
    mutationFn: (payload) => {
      return apiFetch('/api/admin/faqs', {
        method: 'POST',
        body: JSON.stringify(payload)
      }).then(res => res.json());
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries(['admin-faqs']);
        setShowFaqModal(false);
      } else {
        systemToast.error(data.message || 'Failed to create FAQ');
      }
    }
  });

  const updateFaqMutation = useMutation({
    mutationFn: ({ id, payload }) => {
      return apiFetch(`/api/admin/faqs/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      }).then(res => res.json());
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries(['admin-faqs']);
        setShowFaqModal(false);
      } else {
        systemToast.error(data.message || 'Failed to update FAQ');
      }
    }
  });

  const deleteFaqMutation = useMutation({
    mutationFn: (id) => {
      return apiFetch(`/api/admin/faqs/${id}`, { method: 'DELETE' }).then(res => res.json());
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries(['admin-faqs']);
      } else {
        systemToast.error(data.message || 'Failed to delete FAQ');
      }
    }
  });

  const handleFaqSubmit = (e) => {
    e.preventDefault();
    const payload = {
      question: faqQuestion,
      answer: faqAnswer,
      sort_order: parseInt(faqSortOrder) || 0
    };
    if (editingFaq) {
      updateFaqMutation.mutate({ id: editingFaq.id, payload });
    } else {
      createFaqMutation.mutate(payload);
    }
  };

  return (
    <div className="flex-1 p-6 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* Header Block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="font-serif text-2xl font-bold text-gray-800">Content Management System (CMS)</h2>
          <p className="text-xs text-gray-450 mt-1">Manage storefront pages, beauty tips, custom policy pages, and interactive FAQs.</p>
        </div>
        
        {activeTab === 'pages' ? (
          <button
            onClick={handleOpenPageCreate}
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Page
          </button>
        ) : (
          <button
            onClick={handleOpenFaqCreate}
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create FAQ Item
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => changeTab('pages')}
          className={`px-5 py-2.5 font-serif font-bold text-sm transition-all border-b-2 -mb-[2px] cursor-pointer ${
            activeTab === 'pages'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          📄 Storefront Pages
        </button>
        <button
          onClick={() => changeTab('faqs')}
          className={`px-5 py-2.5 font-serif font-bold text-sm transition-all border-b-2 -mb-[2px] cursor-pointer ${
            activeTab === 'faqs'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          ❓ Frequently Asked Questions (FAQ)
        </button>
      </div>

      {/* CMS Pages Tab */}
      {activeTab === 'pages' && (
        <>
          {isPagesLoading ? (
            <div className="flex justify-center items-center py-24">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : pages.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-2xl p-16 text-center shadow-sm">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="font-serif font-bold text-gray-700">No CMS Pages</h3>
              <p className="text-xs text-gray-400 max-w-xs mx-auto mt-1">Configure your site's about pages, guides, policies, or contact documentation.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pages.map((page) => (
                <div
                  key={page.id}
                  className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-gray-250 transition-all flex flex-col justify-between gap-4"
                >
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        CMS Page
                      </span>
                      <a
                        href={page.slug === 'faq' ? '/pages/faq' : `/pages/${page.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-primary transition-colors flex items-center gap-0.5 text-[10px] font-semibold"
                      >
                        View Page <ArrowUpRight className="w-3 h-3" />
                      </a>
                    </div>
                    <h4 className="font-serif font-bold text-gray-805 text-base line-clamp-1 mt-1">{page.title}</h4>
                    <p className="text-[11px] font-mono text-gray-450 bg-gray-50 px-2 py-1 rounded inline-flex items-center gap-1 self-start">
                      <Globe className="w-3.5 h-3.5 text-gray-400" />
                      pages/{page.slug}
                    </p>
                    <div 
                      className="text-xs text-gray-500 line-clamp-3 mt-1.5 prose prose-xs"
                      dangerouslySetInnerHTML={{ __html: page.content.replace(/<[^>]*>/g, '').substring(0, 150) + '...' }}
                    />
                  </div>

                  <div className="flex justify-end gap-2 border-t border-gray-50 pt-3">
                    <button
                      onClick={() => handleOpenPageEdit(page)}
                      className="p-1.5 text-gray-500 hover:text-primary rounded-lg hover:bg-gray-50 transition-all cursor-pointer"
                      title="Edit Page"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to delete the "${page.title}" page?`)) {
                          deletePageMutation.mutate(page.id);
                        }
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-all cursor-pointer"
                      title="Delete Page"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* FAQ Repeater Tab */}
      {activeTab === 'faqs' && (
        <>
          {isFaqsLoading ? (
            <div className="flex justify-center items-center py-24">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : faqs.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-2xl p-16 text-center shadow-sm">
              <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="font-serif font-bold text-gray-700">No FAQ Items Yet</h3>
              <p className="text-xs text-gray-400 max-w-xs mx-auto mt-1">Populate Frequently Asked Questions to help customers resolve queries quickly.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {faqs.map((faq) => (
                <div
                  key={faq.id}
                  className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-gray-250 transition-all flex flex-col sm:flex-row justify-between items-start gap-4"
                >
                  <div className="flex-1 flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Order #{faq.sort_order}
                      </span>
                    </div>
                    <h4 className="font-bold text-gray-805 text-sm mt-1">Q: {faq.question}</h4>
                    <div 
                      className="text-xs text-gray-500 mt-2 prose prose-xs"
                      dangerouslySetInnerHTML={{ __html: faq.answer }}
                    />
                  </div>

                  <div className="flex justify-end gap-2 shrink-0 self-end sm:self-start">
                    <button
                      onClick={() => handleOpenFaqEdit(faq)}
                      className="p-1.5 text-gray-500 hover:text-primary rounded-lg hover:bg-gray-50 transition-all cursor-pointer"
                      title="Edit FAQ"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to delete this FAQ?`)) {
                          deleteFaqMutation.mutate(faq.id);
                        }
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-all cursor-pointer"
                      title="Delete FAQ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Pages Editor Modal */}
      {showPageModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-gray-100 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between shrink-0">
              <h3 className="font-serif text-lg font-bold text-gray-800">
                {editingPage ? `Edit Page: ${editingPage.title}` : 'Create CMS Page'}
              </h3>
              <button
                onClick={() => setShowPageModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-55 rounded-lg transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePageSubmit} className="flex-1 overflow-y-auto custom-sidebar-scroll p-6 flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-550 font-bold uppercase">Page Title *</label>
                  <input
                    type="text"
                    required
                    value={pageTitle}
                    onChange={e => {
                      setPageTitle(e.target.value);
                      if (!editingPage) {
                        setPageSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                      }
                    }}
                    className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800"
                    placeholder="e.g. About Us"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-555 font-bold uppercase">URL Slug *</label>
                  <input
                    type="text"
                    required
                    value={pageSlug}
                    onChange={e => setPageSlug(e.target.value.toLowerCase().replace(/[^a-z0-9\-]+/g, ''))}
                    className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800"
                    placeholder="e.g. about-us"
                  />
                </div>
              </div>

              <RichTextEditor
                label="Page Content (HTML/Plain Text) *"
                value={pageContent}
                onChange={setPageContent}
                placeholder="<h1>About Our Ecommerce</h1><p>Welcome to Dansolam...</p>"
              />

              <div className="flex justify-end gap-2.5 border-t border-gray-100 pt-4 mt-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowPageModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-550 hover:bg-gray-50 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createPageMutation.isPending || updatePageMutation.isPending}
                  className="px-5 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {editingPage ? 'Save Changes' : 'Create Page'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FAQ Editor Modal */}
      {showFaqModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-gray-100 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between shrink-0">
              <h3 className="font-serif text-lg font-bold text-gray-800">
                {editingFaq ? 'Edit FAQ Item' : 'Create FAQ Item'}
              </h3>
              <button
                onClick={() => setShowFaqModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-55 rounded-lg transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFaqSubmit} className="flex-1 overflow-y-auto custom-sidebar-scroll p-6 flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="sm:col-span-3 flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-550 font-bold uppercase">Question *</label>
                  <input
                    type="text"
                    required
                    value={faqQuestion}
                    onChange={e => setFaqQuestion(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800"
                    placeholder="e.g. How long does shipping take?"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-555 font-bold uppercase">Sort Order *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={faqSortOrder}
                    onChange={e => setFaqSortOrder(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800"
                    placeholder="e.g. 1"
                  />
                </div>
              </div>

              <RichTextEditor
                label="Answer Detail *"
                value={faqAnswer}
                onChange={setFaqAnswer}
                placeholder="Start typing the answer detail here..."
              />

              <div className="flex justify-end gap-2.5 border-t border-gray-100 pt-4 mt-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowFaqModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-550 hover:bg-gray-50 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createFaqMutation.isPending || updateFaqMutation.isPending}
                  className="px-5 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {editingFaq ? 'Save Changes' : 'Create FAQ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
