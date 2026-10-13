import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Mail, Trash2, Eye, EyeOff, MessageSquare, Calendar, Search } from 'lucide-react';
import { apiFetch } from '../../hooks/useAuth';

export default function AdminInquiries() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [searchVal, setSearchVal] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(searchVal);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchVal]);

  // Fetch inquiries with pagination and filters
  const { data: inquiriesRes, isLoading } = useQuery({
    queryKey: ['admin-inquiries', search, status, page],
    queryFn: () =>
      apiFetch(
        `/api/admin/contact-inquiries?search=${encodeURIComponent(search)}&status=${status}&page=${page}&per_page=${perPage}`
      ).then((res) => res.json()),
  });

  const inquiries = inquiriesRes?.data || [];
  const meta = inquiriesRes?.meta || { current_page: 1, last_page: 1, total: 0 };

  // Toggle Read Mutation
  const toggleReadMutation = useMutation({
    mutationFn: (id) => {
      return apiFetch(`/api/admin/contact-inquiries/${id}/read`, {
        method: 'PUT',
      }).then((res) => res.json());
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries(['admin-inquiries']);
      }
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => {
      return apiFetch(`/api/admin/contact-inquiries/${id}`, {
        method: 'DELETE',
      }).then((res) => res.json());
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries(['admin-inquiries']);
      }
    },
  });

  const handleDelete = (id, sender) => {
    if (window.confirm(`Are you sure you want to delete the message from "${sender}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header Block */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-serif text-2xl font-bold text-gray-800">Contact Inquiries</h2>
          <p className="text-xs text-gray-500 mt-1">Review contact inquiries submitted by storefront users.</p>
        </div>
      </div>

      {/* Filters and Search Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800/40 p-1 rounded-xl w-fit">
          {['all', 'unread', 'read'].map((s) => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(1); }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                status === s
                  ? 'bg-white dark:bg-gray-800 text-primary shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative flex-1 md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search inquiries by name, email, subject..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="w-full pl-11 pr-10 py-2.5 text-xs border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/10 rounded-xl focus:outline-none bg-gray-50/50 dark:bg-gray-800/20 text-gray-800 dark:text-gray-100"
          />
          {searchVal && (
            <button
              onClick={() => setSearchVal('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-650 dark:hover:text-gray-200 text-xs font-bold transition-colors cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>
      {isLoading ? (
        <div className="flex justify-center items-center py-24">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : inquiries.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-16 text-center shadow-sm">
          <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-serif font-bold text-gray-700">No Inquiries Yet</h3>
          <p className="text-xs text-gray-400 max-w-xs mx-auto mt-1">When customers fill out the Contact Us form, their messages will appear here.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {inquiries.map((item) => (
            <div
              key={item.id}
              className={`bg-white border rounded-2xl p-5 shadow-sm transition-all flex flex-col sm:flex-row justify-between gap-4 ${
                item.is_read ? 'border-gray-100 opacity-80' : 'border-primary/30 ring-1 ring-primary/5'
              }`}
            >
              <div className="flex-1 flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    item.is_read ? 'bg-gray-100 text-gray-500' : 'bg-primary/10 text-primary'
                  }`}>
                    {item.is_read ? 'Read' : 'New Inquiry'}
                  </span>
                  <span className="text-[10px] font-medium text-gray-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(item.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>

                <div className="mt-1">
                  <h4 className="font-serif font-bold text-gray-800 text-base">{item.subject}</h4>
                  <p className="text-xs text-gray-600 mt-1">
                    From: <strong className="text-gray-800">{item.name}</strong> ({item.email})
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl text-xs text-gray-700 leading-relaxed font-sans mt-2 whitespace-pre-line border border-gray-100">
                  {item.message}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="sm:self-start flex sm:flex-col gap-2 shrink-0">
                <button
                  onClick={() => toggleReadMutation.mutate(item.id)}
                  className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center gap-1 text-[11px] font-semibold justify-center w-full ${
                    item.is_read 
                      ? 'border-gray-200 text-gray-500 hover:bg-gray-50' 
                      : 'border-primary bg-primary/5 text-primary hover:bg-primary/10'
                  }`}
                  title={item.is_read ? 'Mark as Unread' : 'Mark as Read'}
                >
                  {item.is_read ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {item.is_read ? 'Mark Unread' : 'Mark Read'}
                </button>
                <button
                  onClick={() => handleDelete(item.id, item.name)}
                  className="p-2 border border-gray-200 hover:border-red-200 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-[11px] font-semibold justify-center w-full"
                  title="Delete Inquiry"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {!isLoading && meta.last_page > 1 && (
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-gray-500">
            Showing <span className="font-semibold text-gray-700">{(meta.current_page - 1) * perPage + 1}</span> to{' '}
            <span className="font-semibold text-gray-700">
              {Math.min(meta.current_page * perPage, meta.total)}
            </span>{' '}
            of <span className="font-semibold text-gray-700">{meta.total}</span> inquiries
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={meta.current_page === 1}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              Previous
            </button>
            {Array.from({ length: meta.last_page }, (_, i) => i + 1)
              .filter(p => p === 1 || p === meta.last_page || Math.abs(p - meta.current_page) <= 1)
              .map((p, idx, arr) => {
                const prev = arr[idx - 1];
                return (
                  <React.Fragment key={p}>
                    {prev && p - prev > 1 && <span className="px-1 text-gray-400 text-xs">...</span>}
                    <button
                      onClick={() => setPage(p)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        meta.current_page === p
                          ? 'bg-primary text-white shadow-sm'
                          : 'border border-gray-200 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                );
              })}
            <button
              onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
              disabled={meta.current_page === meta.last_page}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
