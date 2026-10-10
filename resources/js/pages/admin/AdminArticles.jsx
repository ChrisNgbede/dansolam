import React, { useState } from 'react';
import { toast as systemToast } from '../../components/ui/ToastProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, Edit, Trash2, X, Loader2, AlertCircle, CheckCircle, 
  Eye, EyeOff, BookOpen, Search, Folder, Tag as TagIcon, MessageSquare, Check, ShieldAlert
} from 'lucide-react';
import { apiFetch } from '../../hooks/useAuth';
import { useTableState } from '../../hooks/useTableState';
import TablePaginationControls from '../../components/ui/TablePaginationControls';
import ImageUploadField from '../../components/ui/ImageUploadField';
import RichTextEditor from '../../components/ui/RichTextEditor';
import SearchableSelect from '../../components/ui/SearchableSelect';

export default function AdminArticles() {
  const queryClient = useQueryClient();
  
  // Section Navigation Tab: 'articles', 'categories', 'tags', 'comments'
  const [activeTab, setActiveTab] = useState('articles');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);
  const [viewingType, setViewingType] = useState(null);

  // Categories CRUD modal state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryName, setCategoryName] = useState('');

  // Tags CRUD modal state
  const [showTagModal, setShowTagModal] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [tagName, setTagName] = useState('');

  // Article Form states
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [content, setContent] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [status, setStatus] = useState('published');
  const [blogCategoryId, setBlogCategoryId] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState([]);

  // UI state messages
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // -------------------------------------------------------------
  // Queries
  // -------------------------------------------------------------
  
  // Fetch Articles
  const { data: articlesRes, isLoading: articlesLoading } = useQuery({
    queryKey: ['admin-articles-list'],
    queryFn: () => apiFetch('/api/admin/articles').then(res => res.json())
  });
  const articles = articlesRes?.data || [];

  // Fetch Categories
  const { data: categoriesRes, isLoading: categoriesLoading } = useQuery({
    queryKey: ['admin-blog-categories'],
    queryFn: () => apiFetch('/api/admin/blog-categories').then(res => res.json())
  });
  const categories = categoriesRes?.data || [];

  // Fetch Tags
  const { data: tagsRes, isLoading: tagsLoading } = useQuery({
    queryKey: ['admin-blog-tags'],
    queryFn: () => apiFetch('/api/admin/blog-tags').then(res => res.json())
  });
  const tags = tagsRes?.data || [];

  // Fetch Comments
  const { data: commentsRes, isLoading: commentsLoading } = useQuery({
    queryKey: ['admin-blog-comments'],
    queryFn: () => apiFetch('/api/admin/blog-comments').then(res => res.json())
  });
  const comments = commentsRes?.data || [];

  // -------------------------------------------------------------
  // Table State Management
  // -------------------------------------------------------------
  const articlesTable = useTableState({
    data: articles,
    defaultPageSize: 10,
    defaultSortField: 'title',
    defaultSortOrder: 'asc',
    searchKeys: ['title', 'slug', 'seo_title', 'status']
  });

  const commentsTable = useTableState({
    data: comments,
    defaultPageSize: 10,
    defaultSortField: 'created_at',
    defaultSortOrder: 'desc',
    searchKeys: ['name', 'email', 'content']
  });

  // -------------------------------------------------------------
  // Mutations: Articles
  // -------------------------------------------------------------
  const createMutation = useMutation({
    mutationFn: (payload) => apiFetch('/api/admin/articles', {
      method: 'POST',
      body: JSON.stringify(payload)
    }).then(res => res.json()),
    onSuccess: (data) => {
      setActionLoading(false);
      if (data.success) {
        setSuccessMsg('Article posted successfully!');
        queryClient.invalidateQueries(['admin-articles-list']);
        setTimeout(() => {
          setShowAddModal(false);
          resetForm();
        }, 1500);
      } else {
        setErrorMsg(data.message || 'Error creating article.');
      }
    },
    onError: () => {
      setActionLoading(false);
      setErrorMsg('Network error posting article.');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => apiFetch(`/api/admin/articles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }).then(res => res.json()),
    onSuccess: (data) => {
      setActionLoading(false);
      if (data.success) {
        setSuccessMsg('Article updated successfully!');
        queryClient.invalidateQueries(['admin-articles-list']);
        setTimeout(() => {
          setShowEditModal(false);
          resetForm();
        }, 1500);
      } else {
        setErrorMsg(data.message || 'Error updating article.');
      }
    },
    onError: () => {
      setActionLoading(false);
      setErrorMsg('Network error updating article.');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiFetch(`/api/admin/articles/${id}`, { method: 'DELETE' }).then(res => res.json()),
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries(['admin-articles-list']);
      } else {
        systemToast.error(data.message || 'Error removing article.');
      }
    }
  });

  // -------------------------------------------------------------
  // Mutations: Blog Categories
  // -------------------------------------------------------------
  const saveCategoryMutation = useMutation({
    mutationFn: ({ id, payload }) => {
      const url = id ? `/api/admin/blog-categories/${id}` : '/api/admin/blog-categories';
      const method = id ? 'PUT' : 'POST';
      return apiFetch(url, { method, body: JSON.stringify(payload) }).then(res => res.json());
    },
    onSuccess: (data) => {
      setActionLoading(false);
      if (data.success) {
        setShowCategoryModal(false);
        setCategoryName('');
        setEditingCategory(null);
        queryClient.invalidateQueries(['admin-blog-categories']);
      } else {
        systemToast.error(data.message || 'Error saving category.');
      }
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id) => apiFetch(`/api/admin/blog-categories/${id}`, { method: 'DELETE' }).then(res => res.json()),
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries(['admin-blog-categories']);
      } else {
        systemToast.error(data.message || 'Error removing category.');
      }
    }
  });

  // -------------------------------------------------------------
  // Mutations: Blog Tags
  // -------------------------------------------------------------
  const saveTagMutation = useMutation({
    mutationFn: ({ id, payload }) => {
      const url = id ? `/api/admin/blog-tags/${id}` : '/api/admin/blog-tags';
      const method = id ? 'PUT' : 'POST';
      return apiFetch(url, { method, body: JSON.stringify(payload) }).then(res => res.json());
    },
    onSuccess: (data) => {
      setActionLoading(false);
      if (data.success) {
        setShowTagModal(false);
        setTagName('');
        setEditingTag(null);
        queryClient.invalidateQueries(['admin-blog-tags']);
      } else {
        systemToast.error(data.message || 'Error saving tag.');
      }
    }
  });

  const deleteTagMutation = useMutation({
    mutationFn: (id) => apiFetch(`/api/admin/blog-tags/${id}`, { method: 'DELETE' }).then(res => res.json()),
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries(['admin-blog-tags']);
      } else {
        systemToast.error(data.message || 'Error removing tag.');
      }
    }
  });

  // -------------------------------------------------------------
  // Mutations: Comments Moderation
  // -------------------------------------------------------------
  const approveCommentMutation = useMutation({
    mutationFn: ({ id, is_approved }) => apiFetch(`/api/admin/blog-comments/${id}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ is_approved })
    }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-blog-comments', 'admin-articles-list']);
    }
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (id) => apiFetch(`/api/admin/blog-comments/${id}`, { method: 'DELETE' }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-blog-comments', 'admin-articles-list']);
    }
  });

  // -------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------
  const resetForm = () => {
    setTitle('');
    setSlug('');
    setCoverImageUrl('');
    setContent('');
    setSeoTitle('');
    setSeoDescription('');
    setStatus('published');
    setBlogCategoryId('');
    setSelectedTagIds([]);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleTitleChange = (val) => {
    setTitle(val);
    setSlug(
      val
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
    );
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleOpenEdit = (art) => {
    resetForm();
    setSelectedArticle(art);
    setTitle(art.title);
    setSlug(art.slug);
    setCoverImageUrl(art.cover_image_url || '');
    setContent(art.content || '');
    setSeoTitle(art.seo_title || '');
    setSeoDescription(art.seo_description || '');
    setStatus(art.status || 'published');
    setBlogCategoryId(art.blog_category_id || '');
    setSelectedTagIds(art.tags ? art.tags.map(t => t.id) : []);
    setShowEditModal(true);
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setActionLoading(true);

    const payload = {
      title,
      slug,
      cover_image_url: coverImageUrl || null,
      content,
      seo_title: seoTitle || null,
      seo_description: seoDescription || null,
      status,
      blog_category_id: blogCategoryId ? parseInt(blogCategoryId) : null,
      tag_ids: selectedTagIds
    };

    createMutation.mutate(payload);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setActionLoading(true);

    const payload = {
      title,
      slug,
      cover_image_url: coverImageUrl || null,
      content,
      seo_title: seoTitle || null,
      seo_description: seoDescription || null,
      status,
      blog_category_id: blogCategoryId ? parseInt(blogCategoryId) : null,
      tag_ids: selectedTagIds
    };

    updateMutation.mutate({ id: selectedArticle.id, payload });
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to permanently delete this blog post?')) {
      deleteMutation.mutate(id);
    }
  };

  // Category helpers
  const handleOpenCategoryAdd = () => {
    setCategoryName('');
    setEditingCategory(null);
    setShowCategoryModal(true);
  };

  const handleOpenCategoryEdit = (cat) => {
    setCategoryName(cat.name);
    setEditingCategory(cat);
    setShowCategoryModal(true);
  };

  const handleCategorySubmit = (e) => {
    e.preventDefault();
    saveCategoryMutation.mutate({
      id: editingCategory?.id,
      payload: { name: categoryName }
    });
  };

  // Tag helpers
  const handleOpenTagAdd = () => {
    setTagName('');
    setEditingTag(null);
    setShowTagModal(true);
  };

  const handleOpenTagEdit = (tg) => {
    setTagName(tg.name);
    setEditingTag(tg);
    setShowTagModal(true);
  };

  const handleTagSubmit = (e) => {
    e.preventDefault();
    saveTagMutation.mutate({
      id: editingTag?.id,
      payload: { name: tagName }
    });
  };

  if (articlesLoading || categoriesLoading || tagsLoading || commentsLoading) {
    return <div className="animate-pulse bg-white border rounded-xl h-96 w-full" />;
  }

  return (
    <div className="flex flex-col gap-6 font-sans">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif font-bold text-2xl text-gray-900">Blog & Editorial Manager</h2>
          <p className="text-xs text-gray-400 mt-1">Compose styling lookup editorials, organize blog categories, tag posts, and moderate readers' comments.</p>
        </div>

        {activeTab === 'articles' && (
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Blog Post
          </button>
        )}
        {activeTab === 'categories' && (
          <button
            onClick={handleOpenCategoryAdd}
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </button>
        )}
        {activeTab === 'tags' && (
          <button
            onClick={handleOpenTagAdd}
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Blog Tag
          </button>
        )}
      </div>

      {/* Tabs Selector Navigation */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('articles')}
          className={`px-5 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'articles'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          Blog Articles ({articles.length})
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-5 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'categories'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <Folder className="w-3.5 h-3.5" />
          Categories ({categories.length})
        </button>
        <button
          onClick={() => setActiveTab('tags')}
          className={`px-5 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'tags'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <TagIcon className="w-3.5 h-3.5" />
          Blog Tags ({tags.length})
        </button>
        <button
          onClick={() => setActiveTab('comments')}
          className={`px-5 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'comments'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Comments Moderation ({comments.filter(c => !c.is_approved).length} Pending)
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: ARTICLES LIST */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'articles' && (
        <>
          {/* Search bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-gray-150 p-4 rounded-xl shadow-sm">
            <div className="flex-1 max-w-sm relative">
              <input
                type="text"
                placeholder="Search articles (title, slug...)"
                value={articlesTable.searchQuery}
                onChange={e => articlesTable.setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary text-xs bg-white text-gray-800"
              />
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3.5 top-2.5" />
            </div>
            <span className="text-[10px] text-gray-400 font-bold uppercase">
              👑 {articlesTable.filteredCount} blog posts
            </span>
          </div>

          {/* Table */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-gray-500 uppercase font-semibold select-none text-[10px]">
                    <th className="px-6 py-3 cursor-pointer hover:bg-gray-100" onClick={() => articlesTable.requestSort('title')}>
                      Article Details {articlesTable.sortField === 'title' ? (articlesTable.sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                    </th>
                    <th className="px-6 py-3">Category & Tags</th>
                    <th className="px-6 py-3">Publish Date</th>
                    <th className="px-6 py-3">Comments</th>
                    <th className="px-6 py-3 cursor-pointer hover:bg-gray-100" onClick={() => articlesTable.requestSort('status')}>
                      Status {articlesTable.sortField === 'status' ? (articlesTable.sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                    </th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {articlesTable.paginatedData.length > 0 ? (
                    articlesTable.paginatedData.map((art) => (
                      <tr key={art.id} className="hover:bg-gray-55/20">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {art.cover_image_url ? (
                              <img loading="lazy" decoding="async" src={art.cover_image_url} alt="" className="w-10 h-10 rounded object-cover border border-gray-200 bg-gray-50" />
                            ) : (
                              <div className="w-10 h-10 rounded bg-gray-100 text-gray-400 flex items-center justify-center font-bold text-xs uppercase">
                                📝
                              </div>
                            )}
                            <div>
                              <span className="font-semibold text-gray-800 block line-clamp-1">{art.title}</span>
                              <span className="text-[10px] text-gray-450 block mt-0.5 font-mono">/blog/{art.slug}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-bold w-fit">
                              📁 {art.category ? art.category.name : 'Uncategorized'}
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {art.tags && art.tags.length > 0 ? (
                                art.tags.map(t => (
                                  <span key={t.id} className="text-[8px] bg-gray-100 text-gray-500 px-1 py-0.2 rounded font-mono">
                                    #{t.name}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[8px] text-gray-400 italic">no tags</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-500">{new Date(art.created_at).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-gray-600">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold">{art.total_comments || 0}</span>
                            {art.unapproved_comments > 0 && (
                              <span className="bg-amber-100 text-amber-700 px-1.5 py-0.2 rounded text-[8px] font-bold">
                                {art.unapproved_comments} new
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                            art.status === 'published' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {(art.status || 'draft').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setViewingItem(art);
                                setViewingType('article');
                              }}
                              className="p-1.5 text-gray-500 hover:text-primary hover:bg-primary/5 rounded transition-all cursor-pointer"
                              title="View Article Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(art)}
                              className="p-1.5 text-gray-500 hover:text-blue-650 hover:bg-blue-50 rounded transition-all cursor-pointer"
                              title="Edit Article"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(art.id)}
                              className="p-1.5 text-red-500 hover:text-red-750 hover:bg-red-50 rounded transition-all cursor-pointer"
                              title="Delete Post"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-gray-400 italic">No blog posts found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {articlesTable.filteredCount > 0 && (
              <TablePaginationControls
                currentPage={articlesTable.currentPage}
                pageSize={articlesTable.pageSize}
                totalPages={articlesTable.totalPages}
                totalCount={articlesTable.totalCount}
                filteredCount={articlesTable.filteredCount}
                onPageChange={articlesTable.setCurrentPage}
                onPageSizeChange={articlesTable.setPageSize}
                onJumpToPage={articlesTable.jumpToPage}
              />
            )}
          </div>
        </>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: CATEGORIES LIST */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'categories' && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-gray-500 uppercase font-semibold select-none text-[10px]">
                  <th className="px-6 py-3">Category Name</th>
                  <th className="px-6 py-3">URL Slug Route</th>
                  <th className="px-6 py-3">Linked Articles</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categories.length > 0 ? (
                  categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-gray-55/20">
                      <td className="px-6 py-4 font-semibold text-gray-800">{cat.name}</td>
                      <td className="px-6 py-4 font-mono text-gray-450">/blog/categories/{cat.slug}</td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-gray-700">{cat.articles_count || 0}</span> lookbooks
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenCategoryEdit(cat)}
                            className="p-1.5 text-gray-500 hover:text-blue-650 hover:bg-blue-50 rounded cursor-pointer"
                            title="Rename Category"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Delete this blog category? Articles under it will be uncategorized.')) {
                                deleteCategoryMutation.mutate(cat.id);
                              }
                            }}
                            className="p-1.5 text-red-500 hover:text-red-750 hover:bg-red-50 rounded cursor-pointer"
                            title="Delete Category"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-gray-400 italic">No categories created yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: TAGS LIST */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'tags' && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-gray-500 uppercase font-semibold select-none text-[10px]">
                  <th className="px-6 py-3">Tag Name</th>
                  <th className="px-6 py-3">Slug Code</th>
                  <th className="px-6 py-3">Usage Count</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tags.length > 0 ? (
                  tags.map((tg) => (
                    <tr key={tg.id} className="hover:bg-gray-55/20">
                      <td className="px-6 py-4 font-mono font-bold text-primary">#{tg.name}</td>
                      <td className="px-6 py-4 font-mono text-gray-450">{tg.slug}</td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-gray-700">{tg.articles_count || 0}</span> posts
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenTagEdit(tg)}
                            className="p-1.5 text-gray-500 hover:text-blue-650 hover:bg-blue-50 rounded cursor-pointer"
                            title="Edit Tag"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Delete this blog tag? It will be removed from all attached articles.')) {
                                deleteTagMutation.mutate(tg.id);
                              }
                            }}
                            className="p-1.5 text-red-500 hover:text-red-750 hover:bg-red-50 rounded cursor-pointer"
                            title="Remove Tag"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-gray-400 italic">No blog tags created yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 4: COMMENTS MODERATION */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'comments' && (
        <>
          {/* Search bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-gray-150 p-4 rounded-xl shadow-sm">
            <div className="flex-1 max-w-sm relative">
              <input
                type="text"
                placeholder="Search comments (author, content...)"
                value={commentsTable.searchQuery}
                onChange={e => commentsTable.setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary text-xs bg-white text-gray-800"
              />
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3.5 top-2.5" />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-gray-500 uppercase font-semibold select-none text-[10px]">
                    <th className="px-6 py-3">Reader info</th>
                    <th className="px-6 py-3">Article Thread</th>
                    <th className="px-6 py-3">Comment Text</th>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {commentsTable.paginatedData.length > 0 ? (
                    commentsTable.paginatedData.map((comm) => (
                      <tr key={comm.id} className="hover:bg-gray-55/20">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-800">{comm.name}</span>
                            <span className="text-[10px] text-gray-400">{comm.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-medium text-gray-700 block line-clamp-1 max-w-[150px]">
                            {comm.article ? comm.article.title : 'Deleted Article'}
                          </span>
                        </td>
                        <td className="px-6 py-4 max-w-xs">
                          <p className="text-gray-600 line-clamp-2 leading-normal">{comm.content}</p>
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {new Date(comm.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                            comm.is_approved ? 'bg-green-50 text-green-600' : 'bg-amber-55/20 text-amber-600'
                          }`}>
                            {comm.is_approved ? 'APPROVED' : 'PENDING'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {comm.is_approved ? (
                              <button
                                onClick={() => approveCommentMutation.mutate({ id: comm.id, is_approved: false })}
                                className="px-2.5 py-1 border border-amber-200 hover:bg-amber-50 text-amber-600 text-[10px] font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                                title="Hide from public"
                              >
                                <EyeOff className="w-3.5 h-3.5" />
                                Reject
                              </button>
                            ) : (
                              <button
                                onClick={() => approveCommentMutation.mutate({ id: comm.id, is_approved: true })}
                                className="px-2.5 py-1 bg-green-650 hover:bg-green-700 text-white text-[10px] font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                                title="Approve to show public"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Approve
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setViewingItem(comm);
                                setViewingType('comment');
                              }}
                              className="p-1.5 text-gray-500 hover:text-primary hover:bg-primary/5 rounded transition-all cursor-pointer"
                              title="View Comment Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('Delete this reader comment permanently?')) {
                                  deleteCommentMutation.mutate(comm.id);
                                }
                              }}
                              className="p-1.5 text-red-500 hover:text-red-750 hover:bg-red-50 rounded cursor-pointer"
                              title="Delete comment"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-gray-400 italic">No comments found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {commentsTable.filteredCount > 0 && (
              <TablePaginationControls
                currentPage={commentsTable.currentPage}
                pageSize={commentsTable.pageSize}
                totalPages={commentsTable.totalPages}
                totalCount={commentsTable.totalCount}
                filteredCount={commentsTable.filteredCount}
                onPageChange={commentsTable.setCurrentPage}
                onPageSizeChange={commentsTable.setPageSize}
                onJumpToPage={commentsTable.jumpToPage}
              />
            )}
          </div>
        </>
      )}

      {/* ------------------------------------------------------------- */}
      {/* ARTICLE CREATE MODAL */}
      {/* ------------------------------------------------------------- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full shadow-2xl flex flex-col gap-5 border border-gray-100 max-h-[90vh] overflow-y-auto animate-scale-up">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-serif font-bold text-gray-900 text-lg">Compose New Blog Post</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="bg-red-50 border border-red-150 text-red-500 rounded-lg p-2.5 text-xs font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="bg-green-50 border border-green-200 text-green-600 rounded-lg p-2.5 text-xs font-semibold flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 shrink-0" />
                {successMsg}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-555 font-bold uppercase">Article Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={e => handleTitleChange(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800"
                    placeholder="e.g. 5 Ways to Style Jumpsuits This Summer"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-555 font-bold uppercase">Route URL slug *</label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={e => setSlug(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800 font-mono"
                    placeholder="auto-generated-slug"
                  />
                </div>
              </div>

              {/* Category selector row */}
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-555 font-bold uppercase">Blog Category</label>
                  <SearchableSelect
                    value={blogCategoryId}
                    onChange={e => setBlogCategoryId(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800 h-9 cursor-pointer"
                  >
                    <option value="">No Category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </SearchableSelect>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-555 font-bold uppercase">Publish Status</label>
                  <SearchableSelect
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-700 w-full h-9 cursor-pointer"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft / Private</option>
                  </SearchableSelect>
                </div>
              </div>

              {/* Tags Selector grid */}
              {tags.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-555 font-bold uppercase">Article Tags</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-gray-50 p-3 rounded-lg border border-gray-150 max-h-36 overflow-y-auto">
                    {tags.map(t => (
                      <label key={t.id} className="flex items-center gap-1.5 text-xs text-gray-650 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={selectedTagIds.includes(t.id)}
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedTagIds([...selectedTagIds, t.id]);
                            } else {
                              setSelectedTagIds(selectedTagIds.filter(id => id !== t.id));
                            }
                          }}
                          className="rounded border-gray-300 text-primary w-3.5 h-3.5"
                        />
                        {t.name}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Cover image upload */}
              <ImageUploadField
                label="Cover Image"
                value={coverImageUrl}
                onChange={setCoverImageUrl}
                aspect="video"
                hint="Shown as the article thumbnail and header image."
              />

              <RichTextEditor
                label="Content / Story *"
                value={content}
                onChange={setContent}
                placeholder="Start writing article styles context or Lookbook guide details..."
              />

              <h4 className="text-[10px] text-primary font-bold uppercase tracking-wider border-b border-gray-50 pb-1 mt-2">Organic Google SEO Metadata Overrides</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-gray-400 font-bold uppercase">SEO Title Override</label>
                  <input
                    type="text"
                    value={seoTitle}
                    onChange={e => setSeoTitle(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800"
                    placeholder="Meta title"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-gray-400 font-bold uppercase">SEO Meta Description Override</label>
                  <input
                    type="text"
                    value={seoDescription}
                    onChange={e => setSeoDescription(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800"
                    placeholder="Meta description text"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 border-t border-gray-150 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-205 hover:bg-gray-55 text-gray-600 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Posting...
                    </>
                  ) : 'Post Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* ARTICLE EDIT MODAL */}
      {/* ------------------------------------------------------------- */}
      {showEditModal && selectedArticle && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full shadow-2xl flex flex-col gap-5 border border-gray-100 max-h-[90vh] overflow-y-auto animate-scale-up">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-serif font-bold text-gray-900 text-lg">Edit Blog Article</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="bg-red-50 border border-red-150 text-red-500 rounded-lg p-2.5 text-xs font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="bg-green-50 border border-green-200 text-green-600 rounded-lg p-2.5 text-xs font-semibold flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 shrink-0" />
                {successMsg}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-555 font-bold uppercase">Article Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800 font-semibold"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-555 font-bold uppercase">Route URL slug *</label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={e => setSlug(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-850 font-mono"
                  />
                </div>
              </div>

              {/* Category selector row */}
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-555 font-bold uppercase">Blog Category</label>
                  <SearchableSelect
                    value={blogCategoryId}
                    onChange={e => setBlogCategoryId(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800 h-9 cursor-pointer"
                  >
                    <option value="">No Category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </SearchableSelect>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-555 font-bold uppercase">Publish Status</label>
                  <SearchableSelect
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-700 w-full h-9 cursor-pointer"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft / Private</option>
                  </SearchableSelect>
                </div>
              </div>

              {/* Tags Selector grid */}
              {tags.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-555 font-bold uppercase">Article Tags</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-gray-50 p-3 rounded-lg border border-gray-150 max-h-36 overflow-y-auto">
                    {tags.map(t => (
                      <label key={t.id} className="flex items-center gap-1.5 text-xs text-gray-650 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={selectedTagIds.includes(t.id)}
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedTagIds([...selectedTagIds, t.id]);
                            } else {
                              setSelectedTagIds(selectedTagIds.filter(id => id !== t.id));
                            }
                          }}
                          className="rounded border-gray-300 text-primary w-3.5 h-3.5"
                        />
                        {t.name}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Cover image upload */}
              <ImageUploadField
                label="Cover Image"
                value={coverImageUrl}
                onChange={setCoverImageUrl}
                aspect="video"
                hint="Replace or keep the current cover image."
              />

              <RichTextEditor
                label="Content / Story *"
                value={content}
                onChange={setContent}
                placeholder="Start writing article styles context or Lookbook guide details..."
              />

              <h4 className="text-[10px] text-primary font-bold uppercase tracking-wider border-b border-gray-50 pb-1 mt-2">Organic Google SEO Metadata Overrides</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-gray-400 font-bold uppercase">SEO Title Override</label>
                  <input
                    type="text"
                    value={seoTitle}
                    onChange={e => setSeoTitle(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-gray-400 font-bold uppercase">SEO Meta Description Override</label>
                  <input
                    type="text"
                    value={seoDescription}
                    onChange={e => setSeoDescription(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 border-t border-gray-150 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-205 hover:bg-gray-55 text-gray-600 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving changes...
                    </>
                  ) : 'Save Post details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* CATEGORY CRUD DIALOG MODAL */}
      {/* ------------------------------------------------------------- */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4 border border-gray-100 animate-scale-up">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <h3 className="font-serif font-bold text-gray-900 text-sm">
                {editingCategory ? 'Rename Category' : 'Create Blog Category'}
              </h3>
              <button onClick={() => setShowCategoryModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCategorySubmit} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-gray-400 font-bold uppercase">Category Name</label>
                <input
                  type="text"
                  required
                  value={categoryName}
                  onChange={e => setCategoryName(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800"
                  placeholder="e.g. Lookbook 2026"
                />
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-3 py-1.5 border border-gray-200 text-gray-500 text-xs font-semibold rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAG CRUD DIALOG MODAL */}
      {/* ------------------------------------------------------------- */}
      {showTagModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4 border border-gray-100 animate-scale-up">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <h3 className="font-serif font-bold text-gray-900 text-sm">
                {editingTag ? 'Edit Blog Tag' : 'Create Blog Tag'}
              </h3>
              <button onClick={() => setShowTagModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleTagSubmit} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-gray-400 font-bold uppercase">Tag Name</label>
                <input
                  type="text"
                  required
                  value={tagName}
                  onChange={e => setTagName(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800"
                  placeholder="e.g. summer-fits"
                />
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowTagModal(false)}
                  className="px-3 py-1.5 border border-gray-200 text-gray-500 text-xs font-semibold rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Save Tag
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DETAILS PREVIEW MODAL ── */}
      {viewingItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col p-6 animate-scale-up border border-gray-100">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-150 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-5 h-5 text-primary" />
                <h3 className="font-serif font-bold text-lg text-gray-900">
                  {viewingType === 'article' ? 'Blog Article Preview' : 'Reader Comment Details'}
                </h3>
              </div>
              <button 
                onClick={() => { setViewingItem(null); setViewingType(null); }}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-50 p-1.5 rounded-lg transition-all cursor-pointer font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Content Renderers */}
            <div className="flex-1 flex flex-col gap-5 text-xs text-gray-700 font-sans">
              
              {viewingType === 'article' && (
                <>
                  {/* Cover Image banner */}
                  {viewingItem.cover_image_url && (
                    <div className="w-full h-48 rounded-xl overflow-hidden shadow-sm border border-gray-150 bg-gray-50">
                      <img loading="lazy" decoding="async" src={viewingItem.cover_image_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}

                  {/* Meta Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 border border-gray-150 p-4 rounded-xl">
                    <div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase block text-left">Article Title</span>
                      <span className="font-bold text-gray-900 text-sm leading-snug block text-left mt-1">{viewingItem.title}</span>
                      <span className="text-[10px] text-gray-400 font-mono block text-left mt-0.5">/blog/{viewingItem.slug}</span>
                    </div>
                    <div className="flex flex-col sm:items-end gap-1.5 sm:text-right">
                      <span className="text-[10px] text-gray-400 font-bold uppercase block">Metadata Info</span>
                      <div className="flex flex-wrap gap-1.5 sm:justify-end mt-0.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                          viewingItem.status === 'published' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-gray-100 text-gray-500 border border-gray-200'
                        }`}>
                          {(viewingItem.status || 'draft').toUpperCase()}
                        </span>
                        <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-[9px] font-bold">
                          📁 {viewingItem.category ? viewingItem.category.name : 'Uncategorized'}
                        </span>
                      </div>
                      <span className="text-gray-500 mt-1 block"><strong>Publish Date:</strong> {new Date(viewingItem.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Tags */}
                  {viewingItem.tags && viewingItem.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className="text-[10px] text-gray-400 font-bold uppercase mr-1">Tags:</span>
                      {viewingItem.tags.map(t => (
                        <span key={t.id} className="bg-gray-100 text-gray-655 px-2 py-0.5 rounded-lg font-mono text-[9px] border border-gray-200/50">
                          #{t.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Body Content Description */}
                  <div className="border-t border-b border-gray-100 py-4 my-2">
                    <span className="text-[10px] text-gray-400 font-bold uppercase block mb-3 text-left">Article Content</span>
                    <div 
                      className="prose prose-sm max-w-none text-gray-800 leading-relaxed font-sans text-xs bg-gray-50 p-4 rounded-xl border border-gray-150 max-h-60 overflow-y-auto text-left"
                      dangerouslySetInnerHTML={{ __html: viewingItem.content }}
                    />
                  </div>

                  {/* SEO Metadata Card */}
                  <div className="bg-blue-50/30 border border-blue-100 rounded-xl p-4 flex flex-col gap-2">
                    <span className="text-[10px] text-blue-650 font-bold uppercase text-left">SEO Configurations</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1 text-xs">
                      <div>
                        <strong className="block text-left">SEO Title:</strong>
                        <p className="text-gray-600 mt-0.5 text-left">{viewingItem.seo_title || viewingItem.title}</p>
                      </div>
                      <div>
                        <strong className="block text-left">SEO Description:</strong>
                        <p className="text-gray-600 mt-0.5 text-left">{viewingItem.seo_description || 'No custom description configured.'}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {viewingType === 'comment' && (
                <>
                  {/* Comment Details Card */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 border border-gray-150 p-4 rounded-xl">
                    <div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase block text-left">Reader Details</span>
                      <span className="font-bold text-gray-900 text-sm mt-1 block text-left">{viewingItem.name}</span>
                      <span className="text-gray-500 block mt-0.5 text-left">{viewingItem.email}</span>
                    </div>
                    <div className="sm:text-right flex flex-col sm:items-end">
                      <span className="text-[10px] text-gray-400 font-bold uppercase block">Moderation Status</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold mt-1.5 w-fit ${
                        viewingItem.is_approved ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                      }`}>
                        {viewingItem.is_approved ? 'APPROVED' : 'PENDING APPROVAL'}
                      </span>
                      <span className="text-gray-500 mt-2 block"><strong>Date:</strong> {new Date(viewingItem.created_at).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Thread details */}
                  <div className="bg-gray-50/50 border border-gray-150 rounded-xl p-4">
                    <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1 text-left">Article Thread</span>
                    <span className="font-semibold text-gray-800 text-xs block text-left">
                      💬 {viewingItem.article ? viewingItem.article.title : 'Deleted Article'}
                    </span>
                  </div>

                  {/* Comment Content */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] text-gray-400 font-bold uppercase block text-left">Comment Text</span>
                    <p className="text-gray-800 bg-white p-4 rounded-xl border border-gray-200 leading-relaxed font-sans text-xs italic text-left">
                      "{viewingItem.content}"
                    </p>
                  </div>
                </>
              )}

            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-gray-150 pt-4 mt-6">
              {viewingType === 'article' && (
                <button
                  onClick={() => {
                    setViewingItem(null);
                    setViewingType(null);
                    handleOpenEdit(viewingItem);
                  }}
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  Edit Article
                </button>
              )}
              <button
                onClick={() => { setViewingItem(null); setViewingType(null); }}
                className="px-4 py-2 border border-gray-200 hover:bg-gray-55 text-gray-500 text-xs font-semibold rounded-lg transition-all cursor-pointer bg-white"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
