import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../hooks/useAuth';
import { toast } from '../../components/ui/ToastProvider';
import {
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  Users,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trash2,
  MessageSquare,
  RefreshCw,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';

export default function AdminFittingSessions() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedSession, setSelectedSession] = useState(null);
  const [adminNotesInput, setAdminNotesInput] = useState('');
  const [showNotesModal, setShowNotesModal] = useState(false);

  // Fetch fitting sessions data
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-fitting-sessions', page, search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page, search: search || '', status: statusFilter || '', per_page: 15 });
      const res = await apiFetch(`/api/admin/fitting-sessions?${params}`);
      if (!res.ok) throw new Error('Failed to load');
      return res.json();
    },
    keepPreviousData: true,
  });

  // Update status mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, status, admin_notes }) => {
      const res = await apiFetch(`/api/admin/fitting-sessions/${id}`, { method: 'PUT', body: JSON.stringify({ status, admin_notes }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw Object.assign(new Error(data.message || 'Failed to update fitting session'), { response: { data } });
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Fitting session updated');
      queryClient.invalidateQueries(['admin-fitting-sessions']);
      setShowNotesModal(false);
      setSelectedSession(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update fitting session');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await apiFetch(`/api/admin/fitting-sessions/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw Object.assign(new Error(data.message || 'Failed to delete fitting session'), { response: { data } });
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Fitting session deleted');
      queryClient.invalidateQueries(['admin-fitting-sessions']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete fitting session');
    },
  });

  const handleStatusChange = (session, newStatus) => {
    updateMutation.mutate({
      id: session.id,
      status: newStatus,
      admin_notes: session.admin_notes,
    });
  };

  const handleOpenNotes = (session) => {
    setSelectedSession(session);
    setAdminNotesInput(session.admin_notes || '');
    setShowNotesModal(true);
  };

  const handleSaveNotes = (e) => {
    e.preventDefault();
    if (!selectedSession) return;
    updateMutation.mutate({
      id: selectedSession.id,
      status: selectedSession.status,
      admin_notes: adminNotesInput,
    });
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this fitting session request?')) {
      deleteMutation.mutate(id);
    }
  };

  const counts = data?.counts || { total: 0, pending: 0, acknowledged: 0, approved: 0, declined: 0, completed: 0 };
  const sessions = data?.data?.data || [];
  const meta = data?.data || {};

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">Pending</span>;
      case 'acknowledged':
        return <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">Acknowledged</span>;
      case 'approved':
        return <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">Approved</span>;
      case 'declined':
        return <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">Declined</span>;
      case 'completed':
        return <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase rounded-full bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-700">Completed</span>;
      default:
        return <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase rounded-full bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#5D3E85] dark:text-[#EC268F] uppercase tracking-widest mb-1">
            <Calendar className="w-4 h-4" /> Beauty SHOP Concierge
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 dark:text-white">Skin & Spa Consultations</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Manage private aesthetic consultations, bespoke facial appointments, client schedules, and session statuses.</p>
        </div>

        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-xl shadow-xs hover:bg-gray-50 transition-all cursor-pointer w-fit"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Data
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 bg-white dark:bg-[#141414] rounded-2xl border border-gray-150 dark:border-gray-800 shadow-3xs">
          <div className="text-[10px] font-bold text-gray-400 uppercase">Total Requests</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{counts.total}</div>
        </div>
        <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 rounded-2xl border border-amber-200/60 dark:border-amber-900/40 shadow-3xs">
          <div className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase">Pending</div>
          <div className="text-2xl font-bold text-amber-800 dark:text-amber-200 mt-1">{counts.pending}</div>
        </div>
        <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-2xl border border-blue-200/60 dark:border-blue-900/40 shadow-3xs">
          <div className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase">Acknowledged</div>
          <div className="text-2xl font-bold text-blue-800 dark:text-blue-200 mt-1">{counts.acknowledged}</div>
        </div>
        <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200/60 dark:border-emerald-900/40 shadow-3xs">
          <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">Approved</div>
          <div className="text-2xl font-bold text-emerald-800 dark:text-emerald-200 mt-1">{counts.approved}</div>
        </div>
        <div className="p-4 bg-rose-50/50 dark:bg-rose-950/20 rounded-2xl border border-rose-200/60 dark:border-rose-900/40 shadow-3xs">
          <div className="text-[10px] font-bold text-rose-700 dark:text-rose-300 uppercase">Declined</div>
          <div className="text-2xl font-bold text-rose-800 dark:text-rose-200 mt-1">{counts.declined}</div>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-3xs">
          <div className="text-[10px] font-bold text-gray-500 uppercase">Completed</div>
          <div className="text-2xl font-bold text-gray-700 dark:text-gray-300 mt-1">{counts.completed}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#141414] rounded-2xl p-4 border border-gray-150 dark:border-gray-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'All' },
            { id: 'pending', label: 'Pending' },
            { id: 'acknowledged', label: 'Acknowledged' },
            { id: 'approved', label: 'Approved' },
            { id: 'declined', label: 'Declined' },
            { id: 'completed', label: 'Completed' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setStatusFilter(tab.id); setPage(1); }}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${statusFilter === tab.id
                ? 'bg-yellow-400 text-gray-950 shadow-3xs'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by client name, email, phone..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-[#1c1c1c] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      {/* Main Table View */}
      <div className="bg-white dark:bg-[#141414] rounded-2xl border border-gray-150 dark:border-gray-800 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-gray-500">Loading fitting sessions...</div>
        ) : isError ? (
          <div className="p-12 text-center text-xs text-red-500">Failed to load fitting session bookings.</div>
        ) : sessions.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Calendar className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto" />
            <h3 className="font-bold text-sm text-gray-700 dark:text-gray-300">No fitting session requests found</h3>
            <p className="text-xs text-gray-400">Try adjusting your filter or search criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 dark:bg-[#1a1a1a] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider text-[10px] border-b border-gray-150 dark:border-gray-800">
                <tr>
                  <th className="py-3.5 px-4">Client Details</th>
                  <th className="py-3.5 px-4">Session Date & Time</th>
                  <th className="py-3.5 px-4">Guests</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Client Notes</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 dark:divide-gray-800">
                {sessions.map((session) => (
                  <tr key={session.id} className="hover:bg-gray-50/50 dark:hover:bg-[#1a1a1a]/50 transition-colors">
                    {/* Client Info */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-gray-900 dark:text-white text-sm">{session.name}</div>
                      <div className="flex flex-col gap-0.5 mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-gray-400" /> {session.email}</span>
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-gray-400" /> {session.phone}</span>
                      </div>
                    </td>

                    {/* Date & Time */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-primary" /> {session.preferred_date}
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-gray-400" /> {session.preferred_time}
                      </div>
                    </td>

                    {/* Guests */}
                    <td className="py-3.5 px-4 font-semibold text-gray-700 dark:text-gray-300">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs">
                        <Users className="w-3.5 h-3.5 text-gray-500" /> {session.guests_count} {session.guests_count === 1 ? 'Guest' : 'Guests'}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      {getStatusBadge(session.status)}
                    </td>

                    {/* Notes */}
                    <td className="py-3.5 px-4 max-w-xs">
                      {session.notes ? (
                        <p className="text-[11px] text-gray-600 dark:text-gray-300 line-clamp-2 italic">"{session.notes}"</p>
                      ) : (
                        <span className="text-[10px] text-gray-400 italic">None specified</span>
                      )}
                      {session.admin_notes && (
                        <div className="mt-1 text-[10px] text-amber-700 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-950/40 p-1.5 rounded-lg border border-amber-200/50">
                          <strong className="font-bold">Admin Note:</strong> {session.admin_notes}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                      {/* Action Dropdown / Buttons */}
                      {session.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleStatusChange(session, 'acknowledged')}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] rounded-lg transition-all shadow-3xs cursor-pointer"
                            title="Acknowledge request"
                          >
                            Acknowledge
                          </button>
                          <button
                            onClick={() => handleStatusChange(session, 'approved')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg transition-all shadow-3xs cursor-pointer"
                            title="Approve booking"
                          >
                            Approve
                          </button>
                        </>
                      )}

                      {session.status === 'acknowledged' && (
                        <button
                          onClick={() => handleStatusChange(session, 'approved')}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg transition-all shadow-3xs cursor-pointer"
                        >
                          Approve
                        </button>
                      )}

                      {session.status !== 'declined' && session.status !== 'completed' && (
                        <button
                          onClick={() => handleStatusChange(session, 'declined')}
                          className="px-2 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-bold text-[10px] rounded-lg transition-all cursor-pointer"
                          title="Decline request"
                        >
                          Decline
                        </button>
                      )}

                      {session.status === 'approved' && (
                        <button
                          onClick={() => handleStatusChange(session, 'completed')}
                          className="px-2 py-1 bg-gray-800 hover:bg-black text-white font-bold text-[10px] rounded-lg transition-all cursor-pointer"
                        >
                          Complete
                        </button>
                      )}

                      <button
                        onClick={() => handleOpenNotes(session)}
                        className="p-1.5 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-pointer"
                        title="Add/Edit Admin Note"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDelete(session.id)}
                        className="p-1.5 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50 transition-all cursor-pointer"
                        title="Delete request"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {meta.last_page > 1 && (
          <div className="p-4 border-t border-gray-150 dark:border-gray-800 flex items-center justify-between text-xs">
            <span className="text-gray-500">
              Showing page {meta.current_page} of {meta.last_page} ({meta.total} records)
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={meta.current_page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-1.5 border border-gray-200 dark:border-gray-800 rounded-lg disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={meta.current_page >= meta.last_page}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 border border-gray-200 dark:border-gray-800 rounded-lg disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Admin Notes Edit Modal */}
      {showNotesModal && selectedSession && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-150 dark:border-gray-800 space-y-4">
            <h3 className="font-serif font-bold text-lg text-gray-900 dark:text-white">
              Admin Note for {selectedSession.name}
            </h3>
            <form onSubmit={handleSaveNotes} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">
                  Internal Staff Notes / Confirmation Ref
                </label>
                <textarea
                  rows={4}
                  value={adminNotesInput}
                  onChange={(e) => setAdminNotesInput(e.target.value)}
                  placeholder="e.g. Master Tailor Assigned: Mr. Okon. Confirmed via phone on July 21st."
                  className="w-full p-3 text-xs rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#141414] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNotesModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-950 font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-xs"
                >
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
