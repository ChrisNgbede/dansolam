import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../../hooks/useAuth';
import { Monitor, ArrowLeft, Loader2, Play, BookOpen, AlertCircle } from 'lucide-react';
import { toast } from '../../../components/ui/ToastProvider';
import { getCurrencySymbol } from '../../../utils/currency';

export default function PosSessionStart() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currencySymbol = getCurrencySymbol();
  
  const [registerName, setRegisterName] = useState('Main Register');
  const [openingCash, setOpeningCash] = useState('0');
  const [notes, setNotes] = useState('');

  // Fetch current open session
  const { data: sessionRes, isLoading: checkingSession } = useQuery({
    queryKey: ['pos-current-session'],
    queryFn: () => apiFetch('/api/pos/sessions/current').then(async (res) => {
      if (res.status === 403) {
        throw new Error('POS_DISABLED');
      }
      if (!res.ok) return null;
      return res.json();
    }),
    retry: false
  });

  // Fetch past sessions history
  const { data: historyRes, isLoading: loadingHistory } = useQuery({
    queryKey: ['pos-session-history'],
    queryFn: () => apiFetch('/api/pos/sessions/history').then(res => res.ok ? res.json() : null),
    enabled: sessionRes === null || sessionRes?.success === false
  });

  // Redirect to terminal if already open
  useEffect(() => {
    if (sessionRes?.success && sessionRes?.data) {
      navigate('/admin/pos/terminal');
    }
  }, [sessionRes, navigate]);

  // Open session mutation
  const openSessionMutation = useMutation({
    mutationFn: (variables) => apiFetch('/api/pos/sessions/open', {
      method: 'POST',
      body: JSON.stringify(variables)
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to open register.');
      return data;
    }),
    onSuccess: (data) => {
      toast.success(data.message || 'Register session started.');
      queryClient.setQueryData(['pos-current-session'], data);
      navigate('/admin/pos/terminal');
    },
    onError: (err) => {
      toast.error(err.message || 'Error opening register.');
    }
  });

  const handleStartSession = (e) => {
    e.preventDefault();
    if (!registerName.trim()) {
      toast.error('Register name is required.');
      return;
    }
    openSessionMutation.mutate({
      register_name: registerName,
      opening_cash: parseFloat(openingCash) || 0,
      notes: notes
    });
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
        <p className="text-sm font-semibold">Checking active POS sessions...</p>
      </div>
    );
  }

  // Handle module disabled error state
  if (openSessionMutation.error?.message?.includes('not enabled') || checkingSession === false && sessionRes === undefined) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 p-6">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">POS Module Disabled</h2>
          <p className="text-sm text-gray-550 dark:text-gray-400 mb-6">
            The Point of Sale module is currently disabled. Go to Admin Settings → Modules to enable checkout features.
          </p>
          <button 
            onClick={() => navigate('/admin/settings')} 
            className="w-full bg-primary hover:bg-primary/95 text-white py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm"
          >
            Go to Settings
          </button>
        </div>
      </div>
    );
  }

  const pastSessions = historyRes?.data?.data || [];

  return (
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-gray-900 text-gray-800 dark:text-gray-100 flex flex-col lg:flex-row">
      {/* Left panel: Opening register form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 md:px-12 lg:px-20 max-w-xl mx-auto w-full lg:max-w-none lg:mx-0">
        <div className="mb-6">
          <button 
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-amber-500/10 rounded-xl">
              <Monitor className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Open Register</h1>
              <p className="text-xs text-gray-400">Initialize POS checkout drawer for walk-in sales</p>
            </div>
          </div>

          <form onSubmit={handleStartSession} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Register name</label>
              <input
                type="text"
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
                placeholder="e.g. Main Register, Counter A"
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-750 rounded-xl focus:outline-none focus:border-primary text-sm bg-white dark:bg-gray-850"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Opening Cash Float ({currencySymbol})</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={openingCash}
                onChange={(e) => setOpeningCash(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-750 rounded-xl focus:outline-none focus:border-primary text-sm bg-white dark:bg-gray-850"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Operator Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional starting notes..."
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-750 rounded-xl focus:outline-none focus:border-primary text-sm bg-white dark:bg-gray-850 h-20 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={openSessionMutation.isPending}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              {openSessionMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Starting session...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  Start Register Session
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Right panel: Session logs & history */}
      <div className="lg:w-2/5 bg-gray-50/50 dark:bg-gray-900/50 border-t lg:border-t-0 lg:border-l border-gray-200/50 dark:border-gray-800 p-8 md:p-12 overflow-y-auto max-h-screen lg:max-h-none flex flex-col">
        <div className="flex items-center gap-2 mb-6">
          <BookOpen className="w-5 h-5 text-gray-500" />
          <h2 className="text-md font-bold">Recent Closed Registers</h2>
        </div>

        {loadingHistory ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        ) : pastSessions.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12 text-gray-400 border border-dashed border-gray-250 dark:border-gray-750 rounded-2xl">
            <Monitor className="w-10 h-10 text-gray-300 mb-2" />
            <p className="text-xs font-semibold">No previous session logs found</p>
          </div>
        ) : (
          <div className="space-y-4 flex-1">
            {pastSessions.map((sess) => (
              <div 
                key={sess.id} 
                className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-150/70 dark:border-gray-750 shadow-3xs flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm">{sess.register_name}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-655 dark:bg-gray-700 dark:text-gray-300">
                    Closed
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-3 font-medium">
                  <div>Opened: <span className="font-bold text-gray-700 dark:text-gray-300">{new Date(sess.opened_at).toLocaleDateString()}</span></div>
                  <div>Operator: <span className="font-bold text-gray-700 dark:text-gray-300">{sess.user?.name || 'Operator'}</span></div>
                  <div>Sales total: <span className="font-bold text-emerald-600 font-mono">{currencySymbol}{parseFloat(sess.total_sales).toLocaleString()}</span></div>
                  <div>Items sold: <span className="font-bold text-gray-700 dark:text-gray-300">{sess.total_items_sold}</span></div>
                </div>
                <button
                  onClick={() => navigate('/admin/pos/history')}
                  className="w-full text-center py-1.5 bg-gray-50 hover:bg-gray-100 dark:bg-gray-700/50 dark:hover:bg-gray-700 rounded-lg text-[11px] font-bold text-primary dark:text-amber-500 transition-all border border-gray-100 dark:border-gray-700 cursor-pointer"
                >
                  View Reconciliation Details
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
