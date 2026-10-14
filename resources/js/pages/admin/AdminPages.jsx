import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast as systemToast } from '../../components/ui/ToastProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Edit, Save, X, FileText, Globe, ArrowUpRight, HelpCircle, Search, ChevronDown, ChevronsUpDown, ShieldCheck, Info } from 'lucide-react';
import { apiFetch } from '../../hooks/useAuth';
import RichTextEditor from '../../components/ui/RichTextEditor';
import AboutSectionsEditor, { ABOUT_SLUGS, EMPTY_ABOUT_SECTIONS, PageMetaFields } from '../../components/admin/PageSectionsEditor';

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
  const [pageMeta, setPageMeta] = useState({});
  const [pageSections, setPageSections] = useState(null);

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
    setPageMeta({});
    setPageSections(null);
    setShowPageModal(true);
  };

  const handleOpenPageEdit = (page) => {
    setEditingPage(page);
    setPageTitle(page.title);
    setPageSlug(page.slug);
    setPageContent(page.content);
    setPageMeta({
      subtitle: page.subtitle || '',
      hero_image_url: page.hero_image_url || '',
      meta_title: page.meta_title || '',
      meta_description: page.meta_description || '',
    });
    setPageSections(page.sections || (ABOUT_SLUGS.includes(page.slug) ? EMPTY_ABOUT_SECTIONS : null));
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
        systemToast.success(data.message || 'Page created.');
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
        systemToast.success(data.message || 'Page saved.');
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
        systemToast.success(data.message || 'Page deleted.');
      } else {
        systemToast.error(data.message || 'Failed to delete page');
      }
    }
  });

  const handlePageSubmit = (e) => {
    e.preventDefault();
    const payload = { title: pageTitle, slug: pageSlug, content: pageContent, ...pageMeta };
    if (ABOUT_SLUGS.includes(pageSlug)) {
      payload.sections = pageSections || EMPTY_ABOUT_SECTIONS;
    }
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
        systemToast.success(data.message || 'Question added.');
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
        systemToast.success(data.message || 'Question saved.');
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
        systemToast.success(data.message || 'Question deleted.');
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

  // List UI state: FAQ search, which answers are open, inline delete confirmations.
  const [faqSearch, setFaqSearch] = useState('');
  const [openFaqs, setOpenFaqs] = useState(() => new Set());
  const [confirmDelete, setConfirmDelete] = useState(null); // { kind: 'page' | 'faq', id }

  const sortedFaqs = [...faqs].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.id - b.id);
  const term = faqSearch.trim().toLowerCase();
  const plain = (html) => (html || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  const shownFaqs = term
    ? sortedFaqs.filter((f) => `${f.question} ${plain(f.answer)}`.toLowerCase().includes(term))
    : sortedFaqs;
  const allOpen = shownFaqs.length > 0 && shownFaqs.every((f) => openFaqs.has(f.id));
  const toggleFaq = (id) => setOpenFaqs((set) => {
    const next = new Set(set);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const toggleAll = () => setOpenFaqs(allOpen ? new Set() : new Set(shownFaqs.map((f) => f.id)));

  const pageKind = (slug) => {
    if (/(privacy|terms|refund|return|shipping|policy|cookie)/.test(slug)) return { label: 'Policy', icon: ShieldCheck };
    if (/(about|story|faq|contact|help)/.test(slug)) return { label: 'Info', icon: Info };
    return { label: 'Page', icon: FileText };
  };

  const isConfirming = (kind, id) => confirmDelete?.kind === kind && confirmDelete?.id === id;

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header Block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-gray-800">Pages & FAQs</h2>
          <p className="text-sm text-gray-500 mt-1">Manage storefront pages, custom policy pages, and FAQs.</p>
        </div>

        {activeTab === 'pages' ? (
          <button onClick={handleOpenPageCreate} className="admin-btn-primary px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
            <Plus className="w-4 h-4" />
            Create Page
          </button>
        ) : (
          <button onClick={handleOpenFaqCreate} className="admin-btn-primary px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
            <Plus className="w-4 h-4" />
            Add Question
          </button>
        )}
      </div>

      {/* Tabs: a segmented control with counts */}
      <div className="inline-flex self-start bg-gray-100 rounded-full p-1" role="tablist" aria-label="Content type">
        {[
          { key: 'pages', label: 'Storefront pages', icon: FileText, count: pages.length },
          { key: 'faqs', label: 'FAQs', icon: HelpCircle, count: faqs.length },
        ].map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => changeTab(tab.key)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold cursor-pointer ${activeTab === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            <span className={`adm-count ${activeTab === tab.key ? 'adm-count--on' : ''}`}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* CMS Pages Tab */}
      {activeTab === 'pages' && (
        <>
          {isPagesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" aria-busy="true">
              {[0, 1, 2].map((i) => <div key={i} className="h-44 rounded-3xl adm-skeleton" />)}
            </div>
          ) : pages.length === 0 ? (
            <div className="bg-white rounded-3xl p-16 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="font-bold text-gray-800">No pages yet</h3>
              <p className="text-sm text-gray-500 max-w-xs mx-auto mt-1">Add your About page, guides, policies or contact details.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {pages.map((page) => {
                const kind = pageKind(page.slug);
                const url = page.slug === 'faq' ? '/pages/faq' : `/pages/${page.slug}`;
                const excerpt = plain(page.content);
                return (
                  <div key={page.id} className="adm-lift bg-white rounded-3xl p-5 flex flex-col gap-4">
                    <div className="flex items-start gap-3">
                      <span className="adm-tile"><kind.icon className="w-5 h-5" /></span>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-2">{page.title}</h3>
                        <p className="mt-1 inline-flex items-center gap-1 text-xs font-mono text-gray-500"><Globe className="w-3.5 h-3.5" />/pages/{page.slug}</p>
                      </div>
                      <span className="adm-pill">{kind.label}</span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 flex-1">{excerpt || <span className="italic text-gray-400">No content yet.</span>}</p>

                    <div className="flex items-center justify-between gap-2 pt-4 border-t border-gray-100">
                      {isConfirming('page', page.id) ? (
                        <div className="flex flex-wrap items-center gap-2 w-full" role="alert">
                          <span className="text-sm font-semibold text-gray-800 mr-auto">Delete “{page.title}”?</span>
                          <button type="button" onClick={() => setConfirmDelete(null)} className="admin-btn-secondary px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer">Keep</button>
                          <button type="button" onClick={() => { deletePageMutation.mutate(page.id); setConfirmDelete(null); }} className="bg-red-600 text-white px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer">Delete</button>
                        </div>
                      ) : (
                        <>
                          <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                            View live <ArrowUpRight className="w-4 h-4" />
                          </a>
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleOpenPageEdit(page)} className="text-gray-600 cursor-pointer" title="Edit page" aria-label={`Edit ${page.title}`}>
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => setConfirmDelete({ kind: 'page', id: page.id })} className="text-red-600 cursor-pointer" title="Delete page" aria-label={`Delete ${page.title}`}>
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* FAQ Tab: one accordion card */}
      {activeTab === 'faqs' && (
        <>
          {isFaqsLoading ? (
            <div className="bg-white rounded-3xl p-5 space-y-3" aria-busy="true">
              {[0, 1, 2, 3].map((i) => <div key={i} className="h-14 rounded-2xl adm-skeleton" />)}
            </div>
          ) : faqs.length === 0 ? (
            <div className="bg-white rounded-3xl p-16 text-center">
              <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="font-bold text-gray-800">No questions yet</h3>
              <p className="text-sm text-gray-500 max-w-xs mx-auto mt-1">Answer common questions so customers can help themselves.</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 border-b border-gray-100">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  <input
                    type="search"
                    value={faqSearch}
                    onChange={(e) => setFaqSearch(e.target.value)}
                    placeholder="Search questions and answers…"
                    aria-label="Search FAQs"
                    className="w-full pl-10 pr-3"
                  />
                </div>
                <p className="text-sm text-gray-500 sm:ml-auto">
                  {term ? `${shownFaqs.length} of ${faqs.length}` : faqs.length} {faqs.length === 1 ? 'question' : 'questions'}
                </p>
                <button type="button" onClick={toggleAll} disabled={shownFaqs.length === 0} className="admin-btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer">
                  <ChevronsUpDown className="w-4 h-4" /> {allOpen ? 'Collapse all' : 'Expand all'}
                </button>
              </div>

              {shownFaqs.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-gray-500">No questions match “{faqSearch}”.</p>
              ) : (
                <ol className="adm-faq-list">
                  {shownFaqs.map((faq) => {
                    const open = openFaqs.has(faq.id);
                    const position = sortedFaqs.indexOf(faq) + 1;
                    return (
                      <li key={faq.id} className={`adm-faq ${open ? 'adm-faq--open' : ''}`}>
                        <div className="flex items-start gap-4 px-5 py-4">
                          <span className="adm-faq-num" aria-hidden="true">{position}</span>
                          <details
                            open={open}
                            onToggle={(e) => { if (e.currentTarget.open !== open) toggleFaq(faq.id); }}
                            className="flex-1 min-w-0"
                          >
                            <summary className="adm-faq-q list-none cursor-pointer">
                              <span className="flex items-start gap-2">
                                <span className="flex-1 font-semibold text-gray-900 text-[15px] leading-snug">{faq.question}</span>
                                <ChevronDown className="adm-faq-chevron w-4 h-4 mt-0.5 shrink-0 text-gray-500" aria-hidden="true" />
                              </span>
                              {!open && <span className="adm-faq-preview mt-1 text-sm text-gray-500">{plain(faq.answer)}</span>}
                            </summary>
                            <div className="pt-3">
                              <div className="adm-faq-answer prose prose-sm max-w-none text-gray-600" dangerouslySetInnerHTML={{ __html: faq.answer }} />
                              <p className="mt-3 text-xs text-gray-500">Sort order {faq.sort_order}</p>
                            </div>
                          </details>
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => handleOpenFaqEdit(faq)} className="text-gray-600 cursor-pointer" title="Edit question" aria-label={`Edit question ${position}`}>
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => setConfirmDelete({ kind: 'faq', id: faq.id })} className="text-red-600 cursor-pointer" title="Delete question" aria-label={`Delete question ${position}`}>
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {isConfirming('faq', faq.id) && (
                          <div className="mx-5 mb-4 flex flex-wrap items-center gap-2 rounded-2xl bg-red-50 px-4 py-3" role="alert">
                            <span className="text-sm font-semibold text-red-800 mr-auto">Delete this question? This can't be undone.</span>
                            <button type="button" onClick={() => setConfirmDelete(null)} className="admin-btn-secondary px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer">Keep</button>
                            <button type="button" onClick={() => { deleteFaqMutation.mutate(faq.id); setConfirmDelete(null); }} className="bg-red-600 text-white px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer">Delete</button>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          )}
        </>
      )}

      {/* Pages Editor Modal */}
      {showPageModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full border border-gray-100 shadow-2xl flex flex-col max-h-[90vh]">
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

              <PageMetaFields values={pageMeta} onChange={setPageMeta} />

              {ABOUT_SLUGS.includes(pageSlug) && (
                <AboutSectionsEditor sections={pageSections} onChange={setPageSections} />
              )}

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
                {editingFaq ? 'Edit question' : 'Add a question'}
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
