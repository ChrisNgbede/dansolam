import React, { useState } from 'react';
import { toast as systemToast } from '../../components/ui/ToastProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Eye, Users, Scissors, X, Plus, Edit, Trash2, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { apiFetch } from '../../hooks/useAuth';
import { useTableState } from '../../hooks/useTableState';
import TablePaginationControls from '../../components/ui/TablePaginationControls';
import { COUNTRIES, getStates } from '../../utils/geoData';
import { getCurrencySymbol } from '../../utils/currency';
import SearchableSelect from '../../components/ui/SearchableSelect';

const currencySymbol = getCurrencySymbol();

export default function AdminCustomers() {
  const queryClient = useQueryClient();
  const [viewingCustomer, setViewingCustomer] = useState(null);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bust, setBust] = useState('');
  const [waist, setWaist] = useState('');
  const [hips, setHips] = useState('');
  const [height, setHeight] = useState('');
  const [shoeSize, setShoeSize] = useState('');
  const [fitPreference, setFitPreference] = useState('');

  // Billing Address form states
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('United Kingdom');

  // UI state messages
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch Customers list
  const { data: customersRes, isLoading } = useQuery({
    queryKey: ['admin-customers'],
    queryFn: () => apiFetch('/api/admin/customers').then(res => res.json())
  });

  const customers = customersRes?.data || [];

  // Fetch customer orders history when viewingCustomer is selected
  const { data: customerOrdersRes, isLoading: ordersLoading } = useQuery({
    queryKey: ['admin-customer-orders', viewingCustomer?.id],
    queryFn: () => apiFetch(`/api/admin/customers/${viewingCustomer.id}/orders`).then(res => res.json()),
    enabled: !!viewingCustomer?.id
  });
  const customerOrders = customerOrdersRes?.data || [];

  // Table state management
  const {
    searchQuery,
    setSearchQuery,
    sortField,
    sortOrder,
    requestSort,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    filteredData,
    paginatedData,
    jumpToPage,
    totalCount,
    filteredCount
  } = useTableState({
    data: customers,
    defaultPageSize: 10,
    defaultSortField: 'name',
    defaultSortOrder: 'asc',
    searchKeys: ['name', 'email', 'phone', 'orders_count', 'total_spent']
  });

  // Mutations
  const createCustomerMutation = useMutation({
    mutationFn: (payload) => {
      return apiFetch('/api/admin/customers', {
        method: 'POST',
        body: JSON.stringify(payload)
      }).then(res => res.json());
    },
    onSuccess: (data) => {
      setActionLoading(false);
      if (data.success) {
        setSuccessMsg('Customer registered successfully!');
        queryClient.invalidateQueries({ queryKey: ['admin-customers'] });
        setTimeout(() => {
          setShowAddModal(false);
          resetForm();
        }, 1500);
      } else {
        setErrorMsg(data.message || 'Error registering customer.');
      }
    },
    onError: () => {
      setActionLoading(false);
      setErrorMsg('Network error registering customer.');
    }
  });

  const updateCustomerMutation = useMutation({
    mutationFn: ({ id, payload }) => {
      return apiFetch(`/api/admin/customers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      }).then(res => res.json());
    },
    onSuccess: (data) => {
      setActionLoading(false);
      if (data.success) {
        setSuccessMsg('Customer updated successfully!');
        queryClient.invalidateQueries({ queryKey: ['admin-customers'] });
        setTimeout(() => {
          setShowEditModal(false);
          resetForm();
        }, 1500);
      } else {
        setErrorMsg(data.message || 'Error updating customer.');
      }
    },
    onError: () => {
      setActionLoading(false);
      setErrorMsg('Network error updating customer.');
    }
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: (id) => {
      return apiFetch(`/api/admin/customers/${id}`, {
        method: 'DELETE'
      }).then(res => res.json());
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['admin-customers'] });
      } else {
        systemToast.error(data.message || 'Error removing customer.');
      }
    }
  });

  // Helpers
  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setBust('');
    setWaist('');
    setHips('');
    setHeight('');
    setShoeSize('');
    setFitPreference('');
    setAddressLine1('');
    setCity('');
    setState('');
    setCountry('United Kingdom');
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleOpenEdit = (c) => {
    resetForm();
    setSelectedCustomer(c);
    setName(c.name);
    setEmail(c.email);
    setPhone(c.phone || '');
    
    if (c.measurements) {
      setBust(c.measurements.bust || '');
      setWaist(c.measurements.waist || '');
      setHips(c.measurements.hips || '');
      setHeight(c.measurements.height || '');
      setShoeSize(c.measurements.shoe_size || '');
      setFitPreference(c.measurements.fit_preference || '');
    }

    const defaultAddr = c.addresses?.find(a => a.is_default) || c.addresses?.[0];
    if (defaultAddr) {
      setAddressLine1(defaultAddr.address_line_1 || '');
      setCity(defaultAddr.city || '');
      setState(defaultAddr.state || '');
      setCountry(defaultAddr.country || 'United Kingdom');
    }

    setShowEditModal(true);
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setActionLoading(true);

    const payload = {
      name,
      email,
      phone,
      measurements: {
        bust,
        waist,
        hips,
        height,
        shoe_size: shoeSize,
        fit_preference: fitPreference
      },
      address_line_1: addressLine1,
      city,
      state,
      country
    };

    createCustomerMutation.mutate(payload);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setActionLoading(true);

    const payload = {
      name,
      email,
      phone,
      measurements: {
        bust,
        waist,
        hips,
        height,
        shoe_size: shoeSize,
        fit_preference: fitPreference
      },
      address_line_1: addressLine1,
      city,
      state,
      country
    };

    updateCustomerMutation.mutate({ id: selectedCustomer.id, payload });
  };

  const handleDeleteCustomer = (id) => {
    if (confirm('Are you sure you want to permanently delete this customer profile? All address profiles and histories will be archived.')) {
      deleteCustomerMutation.mutate(id);
    }
  };

  if (isLoading) {
    return <div className="animate-pulse bg-white border rounded-xl h-96 w-full" />;
  }

  return (
    <div className="flex flex-col gap-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif font-bold text-2xl text-gray-900">Customer Management</h2>
          <p className="text-xs text-gray-405 mt-1 font-semibold">Review customer metrics, total expenditures, and custom size measurements.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Add Customer Button */}
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Customer
          </button>

          {/* Search Input */}
          <div className="relative flex items-center max-w-xs w-full">
            <input
              type="text"
              placeholder="Search name, email, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 pr-4 py-2 w-full text-xs bg-white rounded-lg border border-gray-200 focus:outline-none focus:border-primary"
            />
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3.5" />
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-gray-500 uppercase font-semibold select-none">
                <th onClick={() => requestSort('name')} className="px-6 py-3 cursor-pointer hover:bg-gray-100">
                  Customer {sortField === 'name' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                </th>
                <th onClick={() => requestSort('phone')} className="px-6 py-3 cursor-pointer hover:bg-gray-100">
                  Phone {sortField === 'phone' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                </th>
                <th onClick={() => requestSort('orders_count')} className="px-6 py-3 cursor-pointer hover:bg-gray-100">
                  Total Orders {sortField === 'orders_count' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                </th>
                <th onClick={() => requestSort('total_spent')} className="px-6 py-3 cursor-pointer hover:bg-gray-100">
                  Total Spent {sortField === 'total_spent' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                </th>
                <th className="px-6 py-3">Measurements Profile</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedData.length > 0 ? (
                paginatedData.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-55/20">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                          {c.name ? c.name[0] : 'U'}
                        </div>
                        <div>
                          <span className="font-semibold text-gray-800 block">{c.name}</span>
                          <span className="text-[10px] text-gray-400 block mt-0.5">{c.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-650">{c.phone || '—'}</td>
                    <td className="px-6 py-4 text-gray-600 font-semibold">{c.orders_count || 0} orders</td>
                    <td className="px-6 py-4 font-bold text-gray-900">
                      {currencySymbol}{parseFloat(c.total_spent || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      {c.measurements && Object.values(c.measurements).some(v => v !== '') ? (
                        <button
                          onClick={() => setViewingCustomer(c)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 border border-primary/20 hover:bg-primary/5 text-primary text-[10px] font-bold rounded-full transition-all cursor-pointer"
                        >
                          <Scissors className="w-3.5 h-3.5" />
                          View Fits File
                        </button>
                      ) : (
                        <span className="text-[10px] text-gray-400 italic">No fits profile details</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setViewingCustomer(c)}
                          className="p-1.5 text-gray-550 hover:text-primary hover:bg-gray-100 rounded transition-all cursor-pointer"
                          title="View Customer Profile & Orders"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-1.5 text-gray-550 hover:text-blue-650 hover:bg-blue-50 rounded transition-all cursor-pointer"
                          title="Edit Customer Details"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id, c.name)}
                          className="p-1.5 text-red-500 hover:text-red-750 hover:bg-red-55/20 rounded transition-all cursor-pointer"
                          title="Delete Profile"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-400 italic">No customers found matching query.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table controls */}
        {filteredCount > 0 && (
          <TablePaginationControls
            currentPage={currentPage}
            pageSize={pageSize}
            totalPages={totalPages}
            totalCount={totalCount}
            filteredCount={filteredCount}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            onJumpToPage={jumpToPage}
          />
        )}
      </div>

      {/* VIEW MEASUREMENTS PROFILE & ORDERS OVERLAY */}
      {viewingCustomer && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 md:p-6 animate-fade-in" onClick={() => setViewingCustomer(null)}>
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 flex flex-col gap-5 relative text-left animate-scale-up" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setViewingCustomer(null)}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-900 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-gray-100 pb-3.5">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-base shadow-sm">
                {viewingCustomer.name[0]}
              </div>
              <div>
                <h3 className="font-serif font-bold text-gray-900 text-base">{viewingCustomer.name}</h3>
                <p className="text-[10px] text-gray-400 mt-0.5 font-medium">Customer Profile & Fit File Details</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 min-h-[360px] overflow-y-auto max-h-[60vh] custom-sidebar-scroll pr-1">
              {/* Left column: Contact Info & Addresses (4 cols) */}
              <div className="md:col-span-4 flex flex-col gap-4">
                <div className="bg-gray-55 p-4 rounded-xl border border-gray-100 flex flex-col gap-3 text-xs">
                  <h4 className="font-bold text-gray-800 uppercase tracking-wider text-[10px]">Contact Info</h4>
                  <div className="flex flex-col gap-2">
                    <div>
                      <span className="text-[9px] text-gray-400 font-semibold block">Email Address</span>
                      <span className="font-medium text-gray-805">{viewingCustomer.email}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-400 font-semibold block">Phone Number</span>
                      <span className="font-medium text-gray-850">{viewingCustomer.phone || '—'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-400 font-semibold block">Total Spent (Paid)</span>
                      <span className="font-bold text-emerald-600">{currencySymbol}{parseFloat(viewingCustomer.total_spent || 0).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-400 font-semibold block">Orders Count</span>
                      <span className="font-semibold text-gray-805">{viewingCustomer.orders_count || 0} orders</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-55 p-4 rounded-xl border border-gray-100 flex flex-col gap-3 text-xs">
                  <h4 className="font-bold text-gray-808 uppercase tracking-wider text-[10px]">Addresses Registered</h4>
                  {viewingCustomer.addresses && viewingCustomer.addresses.length > 0 ? (
                    <div className="flex flex-col gap-3.5 divide-y divide-gray-200/50">
                      {viewingCustomer.addresses.map((addr, idx) => (
                        <div key={addr.id} className={`flex flex-col gap-1 ${idx > 0 ? 'pt-2.5' : ''}`}>
                          <span className="text-[9px] font-bold text-gray-450 uppercase tracking-wider block">
                            Address #{idx + 1} ({addr.address_type || 'Billing'})
                          </span>
                          <span className="text-gray-808 font-medium">{addr.address_line_1}</span>
                          <span className="text-gray-500 text-[10px]">
                            {addr.city}, {addr.state} · {addr.country}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400 italic">No addresses registered yet.</span>
                  )}
                </div>

                <a
                  href={`https://wa.me/${viewingCustomer.phone ? viewingCustomer.phone.replace(/[^0-9]/g, '') : ''}?text=Hello%20${encodeURIComponent(viewingCustomer.name)}%2C%20regarding%20your%20skincare%20profile%20at%20Dansolam...`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full text-center inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#25D366] text-white text-xs font-semibold rounded-lg shadow-sm hover:bg-[#20ba59] transition-colors"
                >
                  Consult Skincare on WhatsApp
                </a>
              </div>

              {/* Right column: Skin Profile & Order History (8 cols) */}
              <div className="md:col-span-8 flex flex-col gap-5">
                {/* Skin Profile details */}
                <div className="bg-gray-55 p-4 rounded-xl border border-gray-100">
                  <h4 className="font-bold text-gray-805 uppercase tracking-wider text-[10px] mb-3">Skin Profile & Preferences</h4>
                  <div className="grid grid-cols-3 gap-4 text-xs text-gray-650">
                    <div>
                      <span className="text-[9px] text-gray-400 uppercase font-semibold block">Skin Type</span>
                      <strong className="text-gray-800 text-[13px]">{viewingCustomer.measurements?.skin_type || viewingCustomer.measurements?.fit_preference || '—'}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-400 uppercase font-semibold block">Primary Goal</span>
                      <strong className="text-gray-800 text-[13px]">{viewingCustomer.measurements?.skin_goal || viewingCustomer.measurements?.bust || '—'}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-400 uppercase font-semibold block">Skin Concern</span>
                      <strong className="text-gray-800 text-[13px]">{viewingCustomer.measurements?.skin_concern || viewingCustomer.measurements?.waist || '—'}</strong>
                    </div>
                    <div className="mt-1">
                      <span className="text-[9px] text-gray-400 uppercase font-semibold block">Preferred Texture</span>
                      <strong className="text-gray-800 text-[13px]">{viewingCustomer.measurements?.preferred_formulation || viewingCustomer.measurements?.hips || '—'}</strong>
                    </div>
                    <div className="mt-1 col-span-2">
                      <span className="text-[9px] text-gray-400 uppercase font-semibold block">Sensitivities / Notes</span>
                      <strong className="text-gray-800 text-[13px]">{viewingCustomer.measurements?.skin_notes || viewingCustomer.measurements?.height || 'None specified'}</strong>
                    </div>
                  </div>
                </div>

                {/* Orders list */}
                <div>
                  <h4 className="font-bold text-gray-805 uppercase tracking-wider text-[10px] mb-3">Order log history</h4>
                  {ordersLoading ? (
                    <div className="flex items-center justify-center py-10 text-gray-450 gap-2 font-semibold text-xs bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" /> Loading orders...
                    </div>
                  ) : customerOrders && customerOrders.length > 0 ? (
                    <div className="border border-gray-150 rounded-xl overflow-hidden text-xs">
                      <div className="max-h-[220px] overflow-y-auto custom-sidebar-scroll">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-gray-55 text-gray-550 font-bold uppercase text-[9px] border-b border-gray-150 sticky top-0">
                              <th className="px-4 py-2">Order</th>
                              <th className="px-4 py-2">Date</th>
                              <th className="px-4 py-2">Amount</th>
                              <th className="px-4 py-2">Payment</th>
                              <th className="px-4 py-2">Fulfillment</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 bg-white">
                            {customerOrders.map((o) => (
                              <tr key={o.id} className="hover:bg-gray-55/20">
                                <td className="px-4 py-2 font-bold">
                                  <Link
                                    to={`/admin/orders/${o.id}`}
                                    className="text-primary hover:underline cursor-pointer"
                                    title="View Order Details"
                                  >
                                    #{o.order_number}
                                  </Link>
                                </td>
                                <td className="px-4 py-2 font-mono text-gray-455">{new Date(o.created_at).toLocaleDateString()}</td>
                                <td className="px-4 py-2 font-bold text-gray-800">{currencySymbol}{parseFloat(o.total_amount).toLocaleString()}</td>
                                <td className="px-4 py-2">
                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                                    o.payment_status === 'paid' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                                  }`}>
                                    {o.payment_status.toUpperCase()}
                                  </span>
                                </td>
                                <td className="px-4 py-2">
                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                                    o.order_status === 'delivered' ? 'bg-green-50 text-green-600' :
                                    o.order_status === 'cancelled' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-600'
                                  }`}>
                                    {o.order_status.toUpperCase()}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="px-4 py-8 text-center text-gray-400 italic bg-gray-50 rounded-xl border border-gray-100 text-xs">
                      No orders placed by this customer yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE CUSTOMER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 md:p-6">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col gap-5 border border-gray-100 animate-scale-up">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-serif font-bold text-gray-900 text-lg">Register New Customer</h3>
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
                  <label className="text-[10px] text-gray-500 font-bold uppercase">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white"
                    placeholder="Full name"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-500 font-bold uppercase">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white"
                    placeholder="e.g. +1 (555) 000-0000"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-gray-500 font-bold uppercase">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white"
                  placeholder="name@email.com"
                />
              </div>

              <h4 className="text-[10px] text-primary font-bold uppercase tracking-wider border-b border-gray-50 pb-1 mt-2">Skin Profile & Preferences</h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-gray-400 font-bold uppercase">Skin Type</label>
                  <input
                    type="text"
                    value={fitPreference}
                    onChange={e => setFitPreference(e.target.value)}
                    className="px-2.5 py-1 rounded border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800"
                    placeholder="Normal / Dry / Oily / Sensitive"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-gray-400 font-bold uppercase">Primary Goal</label>
                  <input
                    type="text"
                    value={bust}
                    onChange={e => setBust(e.target.value)}
                    className="px-2.5 py-1 rounded border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800"
                    placeholder="Radiant Glow / Hydration"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-gray-400 font-bold uppercase">Skin Concern</label>
                  <input
                    type="text"
                    value={waist}
                    onChange={e => setWaist(e.target.value)}
                    className="px-2.5 py-1 rounded border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800"
                    placeholder="Dark Spots / Acne"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-gray-400 font-bold uppercase">Preferred Texture</label>
                  <input
                    type="text"
                    value={hips}
                    onChange={e => setHips(e.target.value)}
                    className="px-2.5 py-1 rounded border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800"
                    placeholder="Creams / Serums / Oils"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-gray-400 font-bold uppercase">Sensitivities / Notes</label>
                  <input
                    type="text"
                    value={height}
                    onChange={e => setHeight(e.target.value)}
                    className="px-2.5 py-1 rounded border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800"
                    placeholder="Fragrance sensitivity, etc."
                  />
                </div>
              </div>

              <h4 className="text-[10px] text-primary font-bold uppercase tracking-wider border-b border-gray-50 pb-1 mt-2">Billing & Shipping Address</h4>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-gray-400 font-bold uppercase">Street Address</label>
                <input
                  type="text"
                  value={addressLine1}
                  onChange={e => setAddressLine1(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800"
                  placeholder="e.g. 123 Luxury Ecommerce Way"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-gray-400 font-bold uppercase">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="px-2.5 py-1 rounded border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800"
                    placeholder="e.g. New York"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-gray-400 font-bold uppercase">Country</label>
                  <SearchableSelect
                    value={country}
                    onChange={e => { setCountry(e.target.value); setState(''); }}
                    className="px-2.5 py-1 rounded border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800 cursor-pointer"
                  >
                    {COUNTRIES.map(c => (
                      <option key={c.code} value={c.name}>{c.name}</option>
                    ))}
                  </SearchableSelect>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-gray-400 font-bold uppercase">State</label>
                  <SearchableSelect
                    value={state}
                    onChange={e => setState(e.target.value)}
                    className="px-2.5 py-1 rounded border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800 cursor-pointer"
                  >
                    <option value="">Select State</option>
                    {getStates(country).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </SearchableSelect>
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
                      Creating...
                    </>
                  ) : 'Register Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CUSTOMER MODAL */}
      {showEditModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 md:p-6">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col gap-5 border border-gray-100 animate-scale-up">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-serif font-bold text-gray-900 text-lg">Edit Customer "{selectedCustomer.name}"</h3>
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
                  <label className="text-[10px] text-gray-500 font-bold uppercase">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800 font-semibold"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-500 font-bold uppercase">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-gray-500 font-bold uppercase">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800"
                />
              </div>

              <h4 className="text-[10px] text-primary font-bold uppercase tracking-wider border-b border-gray-50 pb-1 mt-2">Measurements Profile</h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-gray-400 font-bold uppercase">Bust (in)</label>
                  <input
                    type="text"
                    value={bust}
                    onChange={e => setBust(e.target.value)}
                    className="px-2.5 py-1 rounded border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-gray-400 font-bold uppercase">Waist (in)</label>
                  <input
                    type="text"
                    value={waist}
                    onChange={e => setWaist(e.target.value)}
                    className="px-2.5 py-1 rounded border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-gray-400 font-bold uppercase">Hips (in)</label>
                  <input
                    type="text"
                    value={hips}
                    onChange={e => setHips(e.target.value)}
                    className="px-2.5 py-1 rounded border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-gray-400 font-bold uppercase">Height</label>
                  <input
                    type="text"
                    value={height}
                    onChange={e => setHeight(e.target.value)}
                    className="px-2.5 py-1 rounded border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-gray-400 font-bold uppercase">Shoe Size</label>
                  <input
                    type="text"
                    value={shoeSize}
                    onChange={e => setShoeSize(e.target.value)}
                    className="px-2.5 py-1 rounded border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-gray-400 font-bold uppercase">Fit Preference</label>
                  <input
                    type="text"
                    value={fitPreference}
                    onChange={e => setFitPreference(e.target.value)}
                    className="px-2.5 py-1 rounded border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800"
                  />
                </div>
              </div>

              <h4 className="text-[10px] text-primary font-bold uppercase tracking-wider border-b border-gray-50 pb-1 mt-2">Billing & Shipping Address</h4>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-gray-400 font-bold uppercase">Street Address</label>
                <input
                  type="text"
                  value={addressLine1}
                  onChange={e => setAddressLine1(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800"
                  placeholder="e.g. 123 Luxury Ecommerce Way"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-gray-400 font-bold uppercase">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="px-2.5 py-1 rounded border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800"
                    placeholder="e.g. New York"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-gray-400 font-bold uppercase">Country</label>
                  <SearchableSelect
                    value={country}
                    onChange={e => { setCountry(e.target.value); setState(''); }}
                    className="px-2 py-1 rounded border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800 cursor-pointer"
                  >
                    {COUNTRIES.map(c => (
                      <option key={c.code} value={c.name}>{c.name}</option>
                    ))}
                  </SearchableSelect>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-gray-400 font-bold uppercase">State</label>
                  <SearchableSelect
                    value={state}
                    onChange={e => setState(e.target.value)}
                    className="px-2 py-1 rounded border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800 cursor-pointer"
                  >
                    <option value="">Select State</option>
                    {getStates(country).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </SearchableSelect>
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
                      Saving...
                    </>
                  ) : 'Save Customer details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
