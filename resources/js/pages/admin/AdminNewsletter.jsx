import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, ChevronLeft, ChevronRight, Download, Mail, Search, Trash2, TrendingUp, Users } from 'lucide-react';
import { apiFetch } from '../../hooks/useAuth';
import { toast as systemToast } from '../../components/ui/ToastProvider';

export default function AdminNewsletter() {
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-newsletter-subscribers', search, page],
    queryFn: async () => {
      const response = await apiFetch(`/api/admin/newsletter-subscribers?search=${encodeURIComponent(search)}&page=${page}&per_page=20`);
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Unable to load subscribers.');
      return result;
    },
  });

  const subscribers = data?.data || [];
  const meta = data?.meta || { current_page: 1, last_page: 1, total: 0 };
  const stats = data?.stats || { total: 0, today: 0, last_30_days: 0 };

  const deleteMutation = useMutation({
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
    <div className="flex-1 p-6 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full">
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1"><Mail className="w-4 h-4" /><span className="text-[10px] uppercase tracking-widest font-bold">Audience</span></div>
          <h1 className="font-serif text-2xl font-bold text-gray-850">Newsletter Subscribers</h1>
          <p className="text-xs text-gray-450 mt-1">View and export customers who subscribed through the storefront.</p>
        </div>
        <button onClick={exportCsv} disabled={exporting || stats.total === 0} className="px-5 py-2.5 bg-primary text-white rounded-full text-xs font-bold inline-flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer">
          <Download className="w-4 h-4" /> {exporting ? 'Exporting…' : 'Export CSV'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Users} label="Total Subscribers" value={stats.total} color="text-primary bg-primary/10" />
        <StatCard icon={CalendarDays} label="Joined Today" value={stats.today} color="text-emerald-600 bg-emerald-50" />
        <StatCard icon={TrendingUp} label="Last 30 Days" value={stats.last_30_days} color="text-blue-600 bg-blue-50" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search subscriber email…" className="w-full pl-11 pr-4 py-2.5 rounded-full border border-gray-200 bg-gray-50/50 text-xs focus:outline-none focus:border-primary" />
          </div>
          <span className="hidden sm:block text-[10px] font-bold text-gray-400 uppercase tracking-wider">{meta.total} records</span>
        </div>

        {isLoading ? (
          <div className="p-16 text-center text-xs text-gray-400">Loading subscribers…</div>
        ) : subscribers.length === 0 ? (
          <div className="p-16 text-center">
            <Mail className="w-11 h-11 text-gray-300 mx-auto mb-3" />
            <h2 className="font-serif font-bold text-gray-700">No subscribers found</h2>
            <p className="text-xs text-gray-400 mt-1">New newsletter signups will appear here automatically.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-gray-50/70 border-b border-gray-100"><th className="text-left">Subscriber</th><th className="text-left">Subscribed</th><th className="text-right">Action</th></tr></thead>
              <tbody>
                {subscribers.map((subscriber) => (
                  <tr key={subscriber.id} className="border-b border-gray-50 last:border-0 hover:bg-primary/[0.02]">
                    <td><div className="flex items-center gap-3"><span className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center"><Mail className="w-4 h-4" /></span><a href={`mailto:${subscriber.email}`} className="font-semibold text-gray-800 hover:text-primary">{subscriber.email}</a></div></td>
                    <td className="text-gray-500">{new Date(subscriber.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</td>
                    <td className="text-right">
                      <button
                        onClick={() => {
                          if (confirmingDeleteId === subscriber.id) {
                            deleteMutation.mutate(subscriber.id);
                            setConfirmingDeleteId(null);
                          } else {
                            setConfirmingDeleteId(subscriber.id);
                            systemToast.info('Click remove again to confirm.');
                          }
                        }}
                        className={`p-2 rounded-full border cursor-pointer ${confirmingDeleteId === subscriber.id ? 'bg-red-500 border-red-500 text-white' : 'border-red-100 text-red-500 hover:bg-red-50'}`}
                        title={confirmingDeleteId === subscriber.id ? 'Click again to confirm removal' : 'Remove subscriber'}
                      ><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta.last_page > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-[10px] text-gray-400">Page {meta.current_page} of {meta.last_page}</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(value => value - 1)} className="p-2 rounded-full border border-gray-200 disabled:opacity-40 cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
              <button disabled={page >= meta.last_page} onClick={() => setPage(value => value + 1)} className="p-2 rounded-full border border-gray-200 disabled:opacity-40 cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex items-center gap-4"><span className={`w-11 h-11 rounded-2xl flex items-center justify-center ${color}`}><Icon className="w-5 h-5" /></span><div><p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">{label}</p><p className="font-serif text-2xl font-bold text-gray-850 mt-0.5">{value}</p></div></div>;
}
