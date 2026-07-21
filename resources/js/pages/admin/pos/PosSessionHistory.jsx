import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../../hooks/useAuth';
import { 
  ArrowLeft, Monitor, Calendar, User, ShoppingBag, DollarSign, Loader2, 
  ChevronDown, ChevronUp, AlertCircle, FileText, CheckCircle2, TrendingUp
} from 'lucide-react';
import { getCurrencySymbol } from '../../../utils/currency';

export default function PosSessionHistory() {
  const navigate = useNavigate();
  const currencySymbol = getCurrencySymbol();
  
  const [expandedSessionId, setExpandedSessionId] = useState(null);

  // Fetch register sessions history
  const { data: historyRes, isLoading } = useQuery({
    queryKey: ['pos-session-history-full'],
    queryFn: () => apiFetch('/api/pos/sessions/history').then(res => res.json())
  });

  const sessions = historyRes?.data?.data || [];

  const toggleExpandSession = (id) => {
    if (expandedSessionId === id) {
      setExpandedSessionId(null);
    } else {
      setExpandedSessionId(id);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-gray-900 text-gray-800 dark:text-gray-100 p-6 md:p-10">
      
      {/* Header */}
      <div className="max-w-6xl mx-auto w-full mb-6">
        <button 
          onClick={() => navigate('/admin/pos')}
          className="flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors mb-4 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to POS Start
        </button>
        
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">POS Register Reconciliation logs</h1>
            <p className="text-xs text-gray-400">View register sessions audit trails, closing balance checks, and cashier performance data</p>
          </div>
        </div>
      </div>

      {/* Sessions list */}
      <div className="max-w-6xl mx-auto w-full">
        {isLoading ? (
          <div className="bg-white dark:bg-gray-800 p-12 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
            <p className="text-sm font-semibold">Loading session audits...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 p-12 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm text-center text-gray-400">
            <Monitor className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-bold">No Register sessions audit trail found</p>
            <p className="text-xs text-gray-550 dark:text-gray-400 mt-1">Registers open/close events will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((sess) => {
              const isExpanded = expandedSessionId === sess.id;
              const expected = parseFloat(sess.expected_cash) || 0;
              const actual = parseFloat(sess.closing_cash) || 0;
              const variance = actual - expected;
              const isOpen = sess.status === 'open';

              return (
                <div 
                  key={sess.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-3xs overflow-hidden transition-all duration-200"
                >
                  {/* Summary Bar Header */}
                  <div 
                    onClick={() => toggleExpandSession(sess.id)}
                    className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-750/30 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="font-bold text-sm text-gray-850 dark:text-white">{sess.register_name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          isOpen 
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' 
                            : 'bg-gray-100 text-gray-655 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {sess.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(sess.opened_at).toLocaleString()}</span>
                        <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> Cashier: {sess.user?.name || 'Operator'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0">
                      <div className="grid grid-cols-3 gap-x-6 text-right">
                        <div>
                          <span className="text-[10px] uppercase text-gray-400 block font-bold">Sales Total</span>
                          <span className="text-xs font-bold text-emerald-600 font-mono">{currencySymbol}{parseFloat(sess.total_sales).toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase text-gray-400 block font-bold">Variance</span>
                          {isOpen ? (
                            <span className="text-xs text-gray-400 font-semibold italic">Active</span>
                          ) : (
                            <span className={`text-xs font-bold font-mono ${variance >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                              {variance >= 0 ? '+' : ''}{currencySymbol}{variance.toFixed(2)}
                            </span>
                          )}
                        </div>
                        <div>
                          <span className="text-[10px] uppercase text-gray-400 block font-bold">Transactions</span>
                          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{sess.total_transactions}</span>
                        </div>
                      </div>
                      
                      <div>
                        {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Audit details */}
                  {isExpanded && (
                    <div className="border-t border-gray-150 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20 p-5 space-y-6">
                      
                      {/* Detailed Stats Cards row */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-gray-800 p-3.5 rounded-xl border border-gray-150 dark:border-gray-700 flex flex-col">
                          <span className="text-[10px] uppercase text-gray-400 font-bold block mb-1">Opening Cash float</span>
                          <span className="text-sm font-bold font-mono">{currencySymbol}{parseFloat(sess.opening_cash).toLocaleString()}</span>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-3.5 rounded-xl border border-gray-150 dark:border-gray-700 flex flex-col">
                          <span className="text-[10px] uppercase text-gray-400 font-bold block mb-1">Expected Cash Drawer</span>
                          <span className="text-sm font-bold font-mono">{currencySymbol}{parseFloat(sess.expected_cash).toLocaleString()}</span>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-3.5 rounded-xl border border-gray-150 dark:border-gray-700 flex flex-col">
                          <span className="text-[10px] uppercase text-gray-400 font-bold block mb-1">Actual closing cash</span>
                          <span className="text-sm font-bold font-mono">
                            {isOpen ? 'Register Active' : `${currencySymbol}${parseFloat(sess.closing_cash || 0).toLocaleString()}`}
                          </span>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-3.5 rounded-xl border border-gray-150 dark:border-gray-700 flex flex-col">
                          <span className="text-[10px] uppercase text-gray-400 font-bold block mb-1">Total items checked out</span>
                          <span className="text-sm font-bold font-mono">{sess.total_items_sold} items</span>
                        </div>
                      </div>

                      {/* Payment breakups details */}
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Reconciliation Breakdowns</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-150 dark:border-gray-700 flex justify-between items-center">
                            <span className="text-xs font-bold">Cash Sales Total</span>
                            <span className="font-mono text-sm font-bold text-gray-900 dark:text-white">{currencySymbol}{parseFloat(sess.cash_sales_total).toLocaleString()}</span>
                          </div>
                          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-150 dark:border-gray-700 flex justify-between items-center">
                            <span className="text-xs font-bold">Card Checkout Total</span>
                            <span className="font-mono text-sm font-bold text-gray-900 dark:text-white">{currencySymbol}{parseFloat(sess.card_sales_total).toLocaleString()}</span>
                          </div>
                          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-150 dark:border-gray-700 flex justify-between items-center">
                            <span className="text-xs font-bold">Bank Transfer Total</span>
                            <span className="font-mono text-sm font-bold text-gray-900 dark:text-white">{currencySymbol}{parseFloat(sess.transfer_sales_total).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Session Notes */}
                      {sess.notes && (
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-150 dark:border-gray-700">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Session Logs Notes</h4>
                          <p className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{sess.notes}</p>
                        </div>
                      )}

                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
