import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, ReceiptText, WalletCards, Clock3, Trash2, Pencil, X, Layers3, Filter, FilePlus2 } from 'lucide-react';
import { apiFetch } from '../../hooks/useAuth';
import { toast } from '../../components/ui/ToastProvider';
import { getCurrencySymbol } from '../../utils/currency';
import SearchableSelect from '../../components/ui/SearchableSelect';

const categories = ['Inventory transport', 'Rent', 'Utilities', 'Payroll', 'Marketing', 'Repairs', 'Office supplies', 'Professional services', 'Taxes', 'Other'];
const paymentMethods = ['cash', 'card', 'transfer', 'cheque', 'other'];
const statuses = ['paid', 'pending', 'void'];
const blank = () => ({ expense_date: new Date().toISOString().slice(0, 10), category: 'Other', vendor: '', description: '', amount: '', payment_method: 'cash', status: 'paid', reference: '', receipt_url: '', notes: '' });

const inputClass = 'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs text-gray-800 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10';

export default function AdminExpenses() {
  const queryClient = useQueryClient();
  const currency = getCurrencySymbol();
  const [filters, setFilters] = useState({ search: '', category: '', status: '' });
  const [selected, setSelected] = useState([]);
  const [modal, setModal] = useState(false);
  const [batchModal, setBatchModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank());
  const [batchRows, setBatchRows] = useState([blank(), blank()]);

  const queryString = new URLSearchParams(Object.entries(filters).filter(([, value]) => value)).toString();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-expenses', filters],
    queryFn: () => apiFetch(`/api/admin/expenses?${queryString}`).then(response => response.json()),
  });
  const expenses = data?.data?.data || [];
  const summary = data?.summary || {};

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-expenses'] });
  const save = useMutation({
    mutationFn: () => apiFetch(editing ? `/api/admin/expenses/${editing.id}` : '/api/admin/expenses', {
      method: editing ? 'PUT' : 'POST', body: JSON.stringify({ ...form, amount: Number(form.amount) }),
    }).then(async response => { const payload = await response.json(); if (!response.ok) throw new Error(payload.message); return payload; }),
    onSuccess: payload => { toast.success(payload.message); refresh(); setModal(false); },
    onError: error => toast.error(error.message),
  });
  const saveBatch = useMutation({
    mutationFn: () => apiFetch('/api/admin/expenses/batch', {
      method: 'POST', body: JSON.stringify({ expenses: batchRows.map(row => ({ ...row, amount: Number(row.amount) })) }),
    }).then(async response => { const payload = await response.json(); if (!response.ok) throw new Error(payload.message || Object.values(payload.errors || {})[0]?.[0]); return payload; }),
    onSuccess: payload => { toast.success(payload.message); refresh(); setBatchModal(false); setBatchRows([blank(), blank()]); },
    onError: error => toast.error(error.message),
  });
  const remove = useMutation({ mutationFn: id => apiFetch(`/api/admin/expenses/${id}`, { method: 'DELETE' }).then(response => response.json()), onSuccess: payload => { toast.success(payload.message); refresh(); } });
  const bulk = useMutation({
    mutationFn: action => apiFetch('/api/admin/expenses/bulk-action', { method: 'POST', body: JSON.stringify({ ids: selected, action }) }).then(async response => { const payload = await response.json(); if (!response.ok) throw new Error(payload.message); return payload; }),
    onSuccess: payload => { toast.success(payload.message); setSelected([]); refresh(); }, onError: error => toast.error(error.message),
  });

  const openSingle = (row = null) => {
    setEditing(row);
    setForm(row ? { ...row, expense_date: String(row.expense_date).slice(0, 10), amount: row.amount || '' } : blank());
    setModal(true);
  };
  const updateBatchRow = (index, key, value) => setBatchRows(rows => rows.map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value } : row));

  const FieldLabel = ({ children }) => <span className="mb-1.5 block text-[9px] font-extrabold uppercase tracking-wider text-gray-450">{children}</span>;
  const Select = ({ value, onChange, children }) => <SearchableSelect className={inputClass} value={value} onChange={onChange}>{children}</SearchableSelect>;

  return (
    <div className="flex flex-col gap-5 pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-primary"><ReceiptText className="h-3.5 w-3.5" /> Finance operations</div><h1 className="font-serif text-3xl font-bold text-gray-950">Expenses</h1><p className="mt-1 text-xs text-gray-400">Record, review and reconcile day-to-day operating costs.</p></div>
        <div className="flex flex-wrap gap-2"><button onClick={() => { setBatchRows([blank(), blank()]); setBatchModal(true); }} className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-xs font-bold text-primary hover:bg-primary/10"><Layers3 className="h-4 w-4" /> Record multiple</button><button onClick={() => openSingle()} className="admin-btn-primary gap-2"><Plus className="h-4 w-4" /> Record expense</button></div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {[[ReceiptText, 'Paid expenses', summary.total || 0, 'Total settled operating costs', 'bg-emerald-50 text-emerald-600'], [Clock3, 'Pending approval', summary.pending || 0, 'Costs awaiting settlement', 'bg-amber-50 text-amber-600'], [WalletCards, 'Ledger entries', summary.count || 0, 'Records in current filters', 'bg-blue-50 text-blue-600']].map(([Icon, label, value, note, tone], index) => (
          <div key={label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-3xs"><div className="flex items-start justify-between"><div><p className="text-[9px] font-extrabold uppercase tracking-wider text-gray-400">{label}</p><p className="mt-2 text-2xl font-extrabold text-gray-900">{index === 2 ? value : `${currency}${Number(value).toLocaleString()}`}</p><p className="mt-1 text-[10px] text-gray-400">{note}</p></div><div className={`rounded-xl p-2.5 ${tone}`}><Icon className="h-5 w-5" /></div></div></div>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-3xs">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(280px,1fr)_220px_180px_auto]">
          <div className="relative"><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input value={filters.search} onChange={event => setFilters({ ...filters, search: event.target.value })} placeholder="Search expense, vendor or reference…" className={`${inputClass} pl-10`} /></div>
          <Select value={filters.category} onChange={event => setFilters({ ...filters, category: event.target.value })}><option value="">All categories</option>{categories.map(category => <option key={category}>{category}</option>)}</Select>
          <Select value={filters.status} onChange={event => setFilters({ ...filters, status: event.target.value })}><option value="">All statuses</option>{statuses.map(status => <option key={status}>{status}</option>)}</Select>
          <button onClick={() => setFilters({ search: '', category: '', status: '' })} className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 text-xs font-bold text-gray-500 hover:bg-gray-50"><Filter className="h-4 w-4" /> Reset</button>
        </div>
      </div>

      {selected.length > 0 && <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-primary/20 bg-primary/5 p-3"><b className="mr-auto text-xs text-gray-800">{selected.length} expenses selected</b>{[['mark_paid', 'Mark paid'], ['mark_pending', 'Mark pending'], ['mark_void', 'Void']].map(([action, label]) => <button key={action} onClick={() => bulk.mutate(action)} className="admin-btn-secondary">{label}</button>)}<button onClick={() => confirm(`Delete ${selected.length} expenses?`) && bulk.mutate('delete')} className="rounded-xl bg-red-50 px-4 py-2 text-xs font-bold text-red-600">Delete</button></div>}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-3xs">
        <div className="border-b border-gray-100 px-5 py-4"><h2 className="text-sm font-bold text-gray-800">Expense ledger</h2><p className="mt-0.5 text-[10px] text-gray-400">Select rows to perform batch reconciliation.</p></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-xs"><thead className="bg-gray-50/80"><tr className="text-left text-[9px] font-extrabold uppercase tracking-wider text-gray-400"><th className="w-12 p-4"><input type="checkbox" checked={expenses.length > 0 && selected.length === expenses.length} onChange={event => setSelected(event.target.checked ? expenses.map(expense => expense.id) : [])} /></th><th>Date / number</th><th>Expense</th><th>Vendor</th><th>Payment</th><th>Status</th><th>Amount</th><th className="pr-5 text-right">Actions</th></tr></thead><tbody>{isLoading ? <tr><td colSpan="8" className="p-14 text-center text-gray-400">Loading expense ledger…</td></tr> : expenses.length === 0 ? <tr><td colSpan="8"><div className="flex flex-col items-center justify-center px-6 py-16 text-center"><div className="mb-3 rounded-2xl bg-gray-50 p-4"><FilePlus2 className="h-7 w-7 text-gray-300" /></div><h3 className="font-bold text-gray-700">No expenses found</h3><p className="mt-1 max-w-sm text-[11px] text-gray-400">Record a single expense or use multiple entry to add a complete batch at once.</p></div></td></tr> : expenses.map(expense => <tr key={expense.id} className="border-t border-gray-50 transition hover:bg-gray-50/50"><td className="p-4"><input type="checkbox" checked={selected.includes(expense.id)} onChange={event => setSelected(event.target.checked ? [...selected, expense.id] : selected.filter(id => id !== expense.id))} /></td><td><b>{String(expense.expense_date).slice(0, 10)}</b><small className="block text-gray-400">{expense.expense_number}</small></td><td><b>{expense.description}</b><small className="block text-gray-400">{expense.category}</small></td><td>{expense.vendor || '—'}</td><td className="capitalize">{expense.payment_method}</td><td><span className={`rounded-full px-2.5 py-1 text-[9px] font-bold capitalize ${expense.status === 'paid' ? 'bg-green-50 text-green-700' : expense.status === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>{expense.status}</span></td><td className="font-extrabold">{currency}{Number(expense.amount).toLocaleString()}</td><td className="pr-5"><div className="flex justify-end gap-1"><button onClick={() => openSingle(expense)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"><Pencil className="h-4 w-4" /></button><button onClick={() => confirm('Delete this expense?') && remove.mutate(expense.id)} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button></div></td></tr>)}</tbody></table></div>
      </div>

      {modal && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"><form onSubmit={event => { event.preventDefault(); save.mutate(); }} className="flex max-h-[92vh] w-full max-w-2xl flex-col gap-5 overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><h2 className="font-serif text-xl font-bold">{editing ? 'Edit' : 'Record'} Expense</h2><p className="text-[10px] text-gray-400">Complete the transaction details below.</p></div><button type="button" onClick={() => setModal(false)} className="rounded-lg p-1.5 hover:bg-gray-100"><X className="h-5 w-5" /></button></div><ExpenseFields row={form} setRow={setForm} FieldLabel={FieldLabel} Select={Select} /><label><FieldLabel>Notes</FieldLabel><textarea value={form.notes || ''} onChange={event => setForm({ ...form, notes: event.target.value })} className={inputClass} rows="3" /></label><button disabled={save.isPending} className="admin-btn-primary w-full">{save.isPending ? 'Saving…' : 'Save expense'}</button></form></div>}

      {batchModal && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"><form onSubmit={event => { event.preventDefault(); saveBatch.mutate(); }} className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"><div className="flex items-start justify-between border-b border-gray-100 p-6"><div><h2 className="font-serif text-xl font-bold">Record Multiple Expenses</h2><p className="mt-1 text-[10px] text-gray-400">Every row is validated and saved together. If one row fails, none are recorded.</p></div><button type="button" onClick={() => setBatchModal(false)} className="rounded-lg p-1.5 hover:bg-gray-100"><X className="h-5 w-5" /></button></div><div className="overflow-auto p-6"><div className="min-w-[1050px] space-y-2"><div className="grid grid-cols-[40px_130px_150px_1fr_160px_120px_130px_40px] gap-2 px-3 text-[9px] font-extrabold uppercase tracking-wider text-gray-400"><span>#</span><span>Date</span><span>Category</span><span>Description / vendor</span><span>Amount</span><span>Payment</span><span>Status</span><span /></div>{batchRows.map((row, index) => <div key={index} className="grid grid-cols-[40px_130px_150px_1fr_160px_120px_130px_40px] items-center gap-2 rounded-xl border border-gray-100 bg-gray-50/70 p-3"><span className="text-center text-xs font-bold text-gray-400">{index + 1}</span><input required type="date" value={row.expense_date} onChange={event => updateBatchRow(index, 'expense_date', event.target.value)} className={inputClass} /><Select value={row.category} onChange={event => updateBatchRow(index, 'category', event.target.value)}>{categories.map(category => <option key={category}>{category}</option>)}</Select><div className="grid grid-cols-2 gap-2"><input required value={row.description} onChange={event => updateBatchRow(index, 'description', event.target.value)} placeholder="Expense description" className={inputClass} /><input value={row.vendor} onChange={event => updateBatchRow(index, 'vendor', event.target.value)} placeholder="Vendor (optional)" className={inputClass} /></div><input required type="number" min="0.01" step="0.01" value={row.amount} onChange={event => updateBatchRow(index, 'amount', event.target.value)} placeholder="0.00" className={inputClass} /><Select value={row.payment_method} onChange={event => updateBatchRow(index, 'payment_method', event.target.value)}>{paymentMethods.map(method => <option key={method}>{method}</option>)}</Select><Select value={row.status} onChange={event => updateBatchRow(index, 'status', event.target.value)}>{statuses.map(status => <option key={status}>{status}</option>)}</Select><button type="button" disabled={batchRows.length === 1} onClick={() => setBatchRows(rows => rows.filter((_, rowIndex) => rowIndex !== index))} className="rounded-lg p-2 text-red-500 hover:bg-red-50 disabled:opacity-30"><Trash2 className="h-4 w-4" /></button></div>)}</div><button type="button" onClick={() => setBatchRows(rows => [...rows, blank()])} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-dashed border-primary/30 px-4 py-2.5 text-xs font-bold text-primary hover:bg-primary/5"><Plus className="h-4 w-4" /> Add another row</button></div><div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-6 py-4"><span className="text-xs font-bold text-gray-500">{batchRows.length} entries · {currency}{batchRows.reduce((sum, row) => sum + Number(row.amount || 0), 0).toLocaleString()}</span><button disabled={saveBatch.isPending} className="admin-btn-primary min-w-44">{saveBatch.isPending ? 'Recording batch…' : `Record ${batchRows.length} expenses`}</button></div></form></div>}
    </div>
  );
}

function ExpenseFields({ row, setRow, FieldLabel, Select }) {
  const set = (key, value) => setRow({ ...row, [key]: value });
  return <div className="grid gap-4 sm:grid-cols-2"><label><FieldLabel>Expense date</FieldLabel><input required type="date" value={row.expense_date} onChange={event => set('expense_date', event.target.value)} className={inputClass} /></label><label><FieldLabel>Amount</FieldLabel><input required type="number" min="0.01" step="0.01" value={row.amount} onChange={event => set('amount', event.target.value)} className={inputClass} /></label><label><FieldLabel>Category</FieldLabel><Select value={row.category} onChange={event => set('category', event.target.value)}>{categories.map(category => <option key={category}>{category}</option>)}</Select></label><label><FieldLabel>Vendor</FieldLabel><input value={row.vendor || ''} onChange={event => set('vendor', event.target.value)} className={inputClass} /></label><label className="sm:col-span-2"><FieldLabel>Description</FieldLabel><input required value={row.description} onChange={event => set('description', event.target.value)} className={inputClass} /></label><label><FieldLabel>Payment method</FieldLabel><Select value={row.payment_method} onChange={event => set('payment_method', event.target.value)}>{paymentMethods.map(method => <option key={method}>{method}</option>)}</Select></label><label><FieldLabel>Status</FieldLabel><Select value={row.status} onChange={event => set('status', event.target.value)}>{statuses.map(status => <option key={status}>{status}</option>)}</Select></label><label><FieldLabel>Payment reference</FieldLabel><input value={row.reference || ''} onChange={event => set('reference', event.target.value)} className={inputClass} /></label><label><FieldLabel>Receipt URL</FieldLabel><input value={row.receipt_url || ''} onChange={event => set('receipt_url', event.target.value)} className={inputClass} /></label></div>;
}
