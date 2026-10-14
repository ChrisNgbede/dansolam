import { getCurrencySymbol } from '../../utils/currency';
import React, { useState } from 'react';
import { toast as systemToast } from '../../components/ui/ToastProvider';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Eye, Filter, Plus, Edit, Trash2, X, Loader2, AlertCircle, CheckCircle, MessageCircle } from 'lucide-react';
import { apiFetch } from '../../hooks/useAuth';
import { useTableState } from '../../hooks/useTableState';
import TablePaginationControls from '../../components/ui/TablePaginationControls';
import { COUNTRIES, getStates } from '../../utils/geoData';
import SearchableSelect from '../../components/ui/SearchableSelect';

export default function AdminOrders() {
  const currencySymbol = getCurrencySymbol();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');

  const generateWhatsAppReceiptLink = (order) => {
    if (!order) return '';
    const phone = (order.customer_phone || '').replace(/[^0-9]/g, '');
    
    const itemsList = (order.items || []).map(item => {
      const label = item.variant_label ? ` (${item.variant_label})` : '';
      return `• ${item.product_name}${label} x ${item.quantity} - ${currencySymbol}${(item.price * item.quantity).toLocaleString()}`;
    }).join('\n');

    const text = `*DANSOLAM RECEIPT*\n` +
      `--------------------------------\n` +
      `*Order Number:* #${order.order_number}\n` +
      `*Customer:* ${order.customer_name}\n` +
      `*Date:* ${new Date(order.created_at).toLocaleDateString()}\n` +
      `*Payment Method:* ${order.payment_method?.toUpperCase()}\n` +
      `*Payment Status:* ${order.payment_status?.toUpperCase()}\n` +
      `--------------------------------\n` +
      `*Items:*\n${itemsList}\n` +
      `--------------------------------\n` +
      `*Subtotal:* ${currencySymbol}${parseFloat(order.subtotal || 0).toLocaleString()}\n` +
      (order.discount_amount > 0 ? `*Discount:* - ${currencySymbol}${parseFloat(order.discount_amount).toLocaleString()}\n` : '') +
      `*Shipping:* ${currencySymbol}${parseFloat(order.delivery_fee || 0).toLocaleString()}\n` +
      (parseFloat(order.tax_amount) > 0 ? `*Taxes:* ${currencySymbol}${parseFloat(order.tax_amount).toLocaleString()}\n` : '') +
      `*Total Paid:* ${currencySymbol}${parseFloat(order.total_amount || 0).toLocaleString()}\n` +
      `--------------------------------\n` +
      `Thank you for shopping with us!`;

    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  };

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryCity, setDeliveryCity] = useState('');
  const [deliveryState, setDeliveryState] = useState('');
  const [deliveryCountry, setDeliveryCountry] = useState('United Kingdom');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [orderStatus, setOrderStatus] = useState('pending_payment');
  const [deliveryFee, setDeliveryFee] = useState('0');
  const [discountAmount, setDiscountAmount] = useState('0');
  const [notes, setNotes] = useState('');
  
  // Order items array
  const [items, setItems] = useState([
    { product_id: '', product_variant_id: '', price: '0', quantity: 1 }
  ]);

  // UI status messages
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(false);


  // Fetch all orders
  const { data: ordersRes, isLoading } = useQuery({
    queryKey: ['admin-orders', statusFilter],
    queryFn: () => apiFetch(`/api/admin/orders?status=${statusFilter}`).then(res => res.json())
  });

  const orders = ordersRes?.data || [];

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
    data: orders,
    defaultPageSize: 10,
    defaultSortField: 'created_at',
    defaultSortOrder: 'desc',
    searchKeys: ['order_number', 'customer_name', 'customer_email', 'payment_method', 'order_status', 'total_amount']
  });

  // Fetch all products (flat admin list) to select items
  const { data: productsRes } = useQuery({
    queryKey: ['admin-orders-products-lookup'],
    queryFn: () => apiFetch('/api/admin/products').then(res => res.json())
  });

  const products = productsRes?.data || [];

  // Mutations
  const createOrderMutation = useMutation({
    mutationFn: (payload) => {
      return apiFetch('/api/admin/orders', {
        method: 'POST',
        body: JSON.stringify(payload)
      }).then(res => res.json());
    },
    onSuccess: (data) => {
      setActionLoading(false);
      if (data.success) {
        setSuccessMsg('Order registered successfully!');
        queryClient.invalidateQueries(['admin-orders']);
        setTimeout(() => {
          setShowAddModal(false);
          resetForm();
        }, 1500);
      } else {
        setErrorMsg(data.message || 'Order registration failed.');
      }
    },
    onError: () => {
      setActionLoading(false);
      setErrorMsg('Network error registering order.');
    }
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ id, payload }) => {
      return apiFetch(`/api/admin/orders/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      }).then(res => res.json());
    },
    onSuccess: (data) => {
      setActionLoading(false);
      if (data.success) {
        setSuccessMsg('Order updated successfully!');
        queryClient.invalidateQueries(['admin-orders']);
        setTimeout(() => {
          setShowEditModal(false);
          resetForm();
        }, 1500);
      } else {
        setErrorMsg(data.message || 'Order update failed.');
      }
    },
    onError: () => {
      setActionLoading(false);
      setErrorMsg('Network error updating order.');
    }
  });

  const deleteOrderMutation = useMutation({
    mutationFn: (id) => {
      return apiFetch(`/api/admin/orders/${id}`, {
        method: 'DELETE'
      }).then(res => res.json());
    },
    onSuccess: (data) => {
      if (data.success) {
        systemToast.success(data.message || 'Order deleted successfully!');
        queryClient.invalidateQueries(['admin-orders']);
      } else {
        systemToast.error(data.message || 'Error deleting order.');
      }
    },
    onError: (err) => {
      systemToast.error('Network error deleting order: ' + err.message);
    }
  });

  // Helpers
  const resetForm = () => {
    setCustomerName('');
    setCustomerEmail('');
    setCustomerPhone('');
    setDeliveryMethod('pickup');
    setDeliveryAddress('');
    setDeliveryCity('');
    setDeliveryState('');
    setDeliveryCountry('United Kingdom');
    setPaymentMethod('bank_transfer');
    setPaymentStatus('pending');
    setOrderStatus('pending_payment');
    setDeliveryFee('0');
    setDiscountAmount('0');
    setNotes('');
    setItems([{ product_id: '', product_variant_id: '', price: '0', quantity: 1 }]);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleOpenEdit = (ord) => {
    resetForm();
    setSelectedOrder(ord);
    setCustomerName(ord.customer_name);
    setCustomerEmail(ord.customer_email);
    setCustomerPhone(ord.customer_phone);
    setDeliveryMethod(ord.delivery_method || 'pickup');
    setDeliveryAddress(ord.delivery_address || '');
    setDeliveryCity(ord.delivery_city || '');
    setDeliveryState(ord.delivery_state || '');
    setDeliveryCountry(ord.delivery_country || 'United Kingdom');
    setPaymentMethod(ord.payment_method || 'bank_transfer');
    setPaymentStatus(ord.payment_status || 'pending');
    setOrderStatus(ord.order_status || 'pending_payment');
    setDeliveryFee(String(ord.delivery_fee || 0));
    setDiscountAmount(String(ord.discount_amount || 0));
    setNotes(ord.notes || '');
    setShowEditModal(true);
  };

  // Dynamic lines helpers
  const handleAddItemLine = () => {
    setItems([...items, { product_id: '', product_variant_id: '', price: '0', quantity: 1 }]);
  };

  const handleRemoveItemLine = (idx) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleProductSelect = (idx, prodId) => {
    const newLines = [...items];
    const prod = products.find(p => p.id === parseInt(prodId));
    if (!prod) return;

    newLines[idx].product_id = prodId;
    newLines[idx].price = String(prod.sale_price || prod.price);
    newLines[idx].product_variant_id = '';
    
    // Auto-select first variant if exists
    if (prod.variants && prod.variants.length > 0) {
      newLines[idx].product_variant_id = String(prod.variants[0].id);
      newLines[idx].price = String(prod.variants[0].sale_price || prod.variants[0].price || newLines[idx].price);
    }

    setItems(newLines);
  };

  const handleVariantSelect = (idx, varId) => {
    const newLines = [...items];
    newLines[idx].product_variant_id = varId;
    
    const prod = products.find(p => p.id === parseInt(newLines[idx].product_id));
    if (prod && prod.variants) {
      const v = prod.variants.find(varObj => varObj.id === parseInt(varId));
      if (v) {
        newLines[idx].price = String(v.sale_price || v.price || prod.sale_price || prod.price);
      }
    }
    setItems(newLines);
  };

  const handlePaypalAuthorizationAction = async (order, action) => {
    const question = action === 'capture'
      ? `Collect the held PayPal payment for order #${order.order_number}?`
      : `Release the held PayPal payment for order #${order.order_number}? The buyer will not be charged and the order will be cancelled.`;
    if (!window.confirm(question)) return;
    try {
      const res = await apiFetch(`/api/admin/paypal/${action === 'capture' ? 'capture' : 'void'}-authorization`, {
        method: 'POST',
        body: JSON.stringify({ order_id: order.id }),
      });
      const data = await res.json();
      if (data.success) {
        systemToast.success(data.message);
        queryClient.invalidateQueries(['admin-orders']);
      } else {
        systemToast.error(data.message || 'PayPal action failed.');
      }
    } catch (err) {
      systemToast.error('Network error contacting PayPal.');
    }
  };

  const handleLineUpdate = (idx, field, val) => {
    const newLines = [...items];
    newLines[idx][field] = val;
    setItems(newLines);
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setActionLoading(true);

    const validItems = items.filter(line => line.product_id !== '');
    if (validItems.length === 0) {
      setErrorMsg('Please add at least one valid product line.');
      setActionLoading(false);
      return;
    }

    const payload = {
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      delivery_method: deliveryMethod,
      delivery_address: deliveryAddress,
      delivery_city: deliveryCity,
      delivery_state: deliveryState,
      delivery_country: deliveryCountry,
      payment_method: paymentMethod,
      payment_status: paymentStatus,
      order_status: orderStatus,
      delivery_fee: parseFloat(deliveryFee) || 0,
      discount_amount: parseFloat(discountAmount) || 0,
      notes,
      items: validItems.map(line => ({
        product_id: parseInt(line.product_id),
        product_variant_id: line.product_variant_id ? parseInt(line.product_variant_id) : null,
        quantity: parseInt(line.quantity) || 1,
        price: parseFloat(line.price) || 0
      }))
    };

    createOrderMutation.mutate(payload);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setActionLoading(true);

    const payload = {
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      delivery_method: deliveryMethod,
      delivery_address: deliveryAddress,
      delivery_city: deliveryCity,
      delivery_state: deliveryState,
      delivery_country: deliveryCountry,
      payment_method: paymentMethod,
      payment_status: paymentStatus,
      order_status: orderStatus,
      delivery_fee: parseFloat(deliveryFee) || 0,
      discount_amount: parseFloat(discountAmount) || 0,
      notes
    };

    updateOrderMutation.mutate({ id: selectedOrder.id, payload });
  };

  const handleDeleteOrder = (id) => {
    if (confirm('Are you sure you want to permanently delete this order? All items logs will be archived.')) {
      deleteOrderMutation.mutate(id);
    }
  };

  if (isLoading) {
    return <div className="animate-pulse bg-white border rounded-xl h-96 w-full" />;
  }

  return (
    <div className="flex flex-col gap-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif font-bold text-2xl text-gray-900">Order Management</h2>
          <p className="text-xs text-gray-400 mt-1">Review checkout inquiries, change statuses, and track package deliveries.</p>
        </div>

          {/* Search bar */}
          <div className="flex-1 max-w-xs relative">
            <input
              type="text"
              placeholder="Search orders (name, #, email...)"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary text-xs bg-white"
            />
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3.5 top-2.5" />
          </div>

          <div className="flex items-center gap-3">
            {/* Add Manual Order Button */}
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Create An Order
            </button>

            {/* Filter status */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-450 font-medium flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                Status:
              </label>
              <SearchableSelect
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs font-semibold px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary bg-white cursor-pointer text-gray-700 h-[34px]"
              >
                <option value="">All Orders</option>
                <option value="pending_payment">Pending Payment</option>
                <option value="paid">Paid</option>
                <option value="processing">Processing</option>
                <option value="packed">Packed</option>
                <option value="ready_for_pickup">Ready for Pickup</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </SearchableSelect>
            </div>
          </div>
        </div>

      {/* Orders Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-gray-500 uppercase font-semibold select-none">
                <th onClick={() => requestSort('order_number')} className="px-6 py-3 cursor-pointer hover:bg-gray-100">
                  Order Number {sortField === 'order_number' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                </th>
                <th onClick={() => requestSort('customer_name')} className="px-6 py-3 cursor-pointer hover:bg-gray-100">
                  Customer {sortField === 'customer_name' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                </th>
                <th onClick={() => requestSort('created_at')} className="px-6 py-3 cursor-pointer hover:bg-gray-100">
                  Date {sortField === 'created_at' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                </th>
                <th onClick={() => requestSort('payment_status')} className="px-6 py-3 cursor-pointer hover:bg-gray-100">
                  Payment {sortField === 'payment_status' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                </th>
                <th onClick={() => requestSort('order_status')} className="px-6 py-3 cursor-pointer hover:bg-gray-100">
                  Status {sortField === 'order_status' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                </th>
                <th onClick={() => requestSort('total_amount')} className="px-6 py-3 cursor-pointer hover:bg-gray-100">
                  Total Amount {sortField === 'total_amount' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                </th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedData.length > 0 ? (
                paginatedData.map((ord) => (
                  <tr key={ord.id} className="hover:bg-gray-55/20">
                    <td className="px-6 py-4 font-semibold">
                      <Link
                        to={`/admin/orders/${ord.id}`}
                        className="text-primary hover:underline font-bold cursor-pointer"
                        title="View Order Details"
                      >
                        #{ord.order_number}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-800 block">{ord.customer_name}</span>
                      <span className="text-[10px] text-gray-400 block mt-0.5">{ord.customer_email}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{new Date(ord.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                        ord.payment_status === 'paid' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-500'
                      }`}>
                        {(ord.payment_status || 'pending').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-primary/10 text-primary capitalize`}>
                        {(ord.order_status || 'pending').replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold">{currencySymbol}{parseFloat(ord.total_amount).toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={generateWhatsAppReceiptLink(ord)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition-all"
                          title="Share Receipt (WhatsApp)"
                        >
                          <MessageCircle className="w-4 h-4 text-[#25D366] fill-[#25D366]/10" />
                        </a>
                        <Link
                          to={`/admin/orders/${ord.id}`}
                          className="p-1.5 text-gray-550 hover:text-primary hover:bg-gray-55 rounded transition-all"
                          title="Fulfill / View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        {ord.payment_method === 'paypal' && ord.payment_status === 'authorized' && (
                          <>
                            <button
                              onClick={() => handlePaypalAuthorizationAction(ord, 'capture')}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-[10px] font-bold rounded-md transition-all cursor-pointer"
                              title="Collect the funds held on this PayPal authorization"
                            >
                              Capture
                            </button>
                            <button
                              onClick={() => handlePaypalAuthorizationAction(ord, 'void')}
                              className="px-2 py-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 text-[10px] font-bold rounded-md transition-all cursor-pointer"
                              title="Release the held funds without charging"
                            >
                              Void
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleOpenEdit(ord)}
                          className="p-1.5 text-gray-550 hover:text-blue-600 hover:bg-blue-50 rounded transition-all cursor-pointer"
                          title="Edit Order Properties"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteOrder(ord.id)}
                          className="p-1.5 text-red-500 hover:text-red-750 hover:bg-red-50 rounded transition-all cursor-pointer"
                          title="Delete Order"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-400 italic">No orders found matching status parameters or query.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
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

      {/* CREATE MANUAL ORDER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 md:p-6">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col gap-5 border border-gray-100 animate-scale-up">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-serif font-bold text-gray-900 text-lg">Create Manual Client Order</h3>
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
              <h4 className="text-[10px] text-primary font-bold uppercase tracking-wider border-b border-gray-50 pb-1">1. Customer Information</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-gray-500 font-bold uppercase">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white"
                    placeholder="Full name"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-gray-500 font-bold uppercase">Customer Email *</label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={e => setCustomerEmail(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white"
                    placeholder="email@example.com"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-gray-500 font-bold uppercase">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white"
                    placeholder="e.g. +1 (555) 000-0000"
                  />
                </div>
              </div>

              <h4 className="text-[10px] text-primary font-bold uppercase tracking-wider border-b border-gray-50 pb-1 mt-2">2. Delivery & Address Options</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-gray-500 font-bold uppercase">Delivery Method</label>
                  <SearchableSelect
                    value={deliveryMethod}
                    onChange={e => setDeliveryMethod(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-700"
                  >
                    <option value="pickup">Store Pickup</option>
                    <option value="delivery">Home Delivery</option>
                  </SearchableSelect>
                </div>
                {deliveryMethod === 'delivery' && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-gray-500 font-bold uppercase">Street Address</label>
                    <input
                      type="text"
                      value={deliveryAddress}
                      onChange={e => setDeliveryAddress(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white"
                      placeholder="Street name and building number"
                    />
                  </div>
                )}
              </div>

              {deliveryMethod === 'delivery' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-gray-500 font-bold uppercase">City</label>
                    <input
                      type="text"
                      value={deliveryCity}
                      onChange={e => setDeliveryCity(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white"
                      placeholder="e.g. London"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-gray-550 font-bold uppercase">Country</label>
                    <SearchableSelect
                      value={deliveryCountry}
                      onChange={e => { setDeliveryCountry(e.target.value); setDeliveryState(''); }}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800 cursor-pointer h-[34px]"
                    >
                      {COUNTRIES.map(c => (
                        <option key={c.code} value={c.name}>{c.name}</option>
                      ))}
                    </SearchableSelect>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-gray-550 font-bold uppercase">State</label>
                    <SearchableSelect
                      value={deliveryState}
                      onChange={e => setDeliveryState(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800 cursor-pointer h-[34px]"
                    >
                      <option value="">Select State</option>
                      {getStates(deliveryCountry).map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </SearchableSelect>
                  </div>
                </div>
              )}

              <h4 className="text-[10px] text-primary font-bold uppercase tracking-wider border-b border-gray-50 pb-1 mt-2">3. Payment & Fulfillments Status</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-gray-500 font-bold uppercase">Payment Gateway / Method</label>
                  <SearchableSelect
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-700"
                  >
                    <option value="bank_transfer">Bank Transfer (Manual)</option>
                    <option value="cash_on_delivery">Cash on Delivery (COD)</option>
                    <option value="paystack">Paystack Online</option>
                    <option value="stripe">Stripe Card</option>
                    <option value="paypal">PayPal Express</option>
                    <option value="flutterwave">Flutterwave Gateway</option>
                  </SearchableSelect>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-gray-500 font-bold uppercase">Payment Status</label>
                  <SearchableSelect
                    value={paymentStatus}
                    onChange={e => setPaymentStatus(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-700"
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="failed">Failed</option>
                  </SearchableSelect>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-gray-500 font-bold uppercase">Order Status</label>
                  <SearchableSelect
                    value={orderStatus}
                    onChange={e => setOrderStatus(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-700"
                  >
                    <option value="pending_payment">Pending Payment</option>
                    <option value="paid">Paid</option>
                    <option value="processing">Processing</option>
                    <option value="packed">Packed</option>
                    <option value="ready_for_pickup">Ready for Pickup</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </SearchableSelect>
                </div>
              </div>

              <h4 className="text-[10px] text-primary font-bold uppercase tracking-wider border-b border-gray-50 pb-1 mt-2 flex justify-between items-center">
                <span>4. Catalog Items List</span>
                <button
                  type="button"
                  onClick={handleAddItemLine}
                  className="px-2 py-0.5 border border-primary text-primary hover:bg-primary/5 rounded text-[9px] font-bold cursor-pointer"
                >
                  + Add Item Line
                </button>
              </h4>

              <div className="flex flex-col gap-3">
                {items.map((line, idx) => {
                  const selectedProd = products.find(p => p.id === parseInt(line.product_id));
                  return (
                    <div key={idx} className="flex flex-wrap sm:flex-nowrap items-end gap-3 bg-gray-50 p-3 rounded-lg border border-gray-150 relative">
                      <div className="flex flex-col gap-1 flex-1 min-w-[150px]">
                        <label className="text-[8px] text-gray-400 font-bold uppercase">Select Product *</label>
                        <SearchableSelect
                          value={line.product_id}
                          onChange={e => handleProductSelect(idx, e.target.value)}
                          className="px-2 py-1 rounded border border-gray-250 text-xs bg-white text-gray-700 w-full"
                          required
                        >
                          <option value="">-- Choose Product --</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </SearchableSelect>
                      </div>

                      {selectedProd && selectedProd.variants && selectedProd.variants.length > 0 && (
                        <div className="flex flex-col gap-1 w-32 shrink-0">
                          <label className="text-[8px] text-gray-400 font-bold uppercase">Variant / Sizing *</label>
                          <SearchableSelect
                            value={line.product_variant_id}
                            onChange={e => handleVariantSelect(idx, e.target.value)}
                            className="px-2 py-1 rounded border border-gray-250 text-xs bg-white text-gray-700 w-full"
                            required
                          >
                            {selectedProd.variants.map(v => (
                              <option key={v.id} value={v.id}>{v.size} / {v.color} (Stock: {v.stock_quantity})</option>
                            ))}
                          </SearchableSelect>
                        </div>
                      )}

                      <div className="flex flex-col gap-1 w-20 shrink-0">
                        <label className="text-[8px] text-gray-400 font-bold uppercase">Unit Price ({currencySymbol}) *</label>
                        <input
                          type="number"
                          value={line.price}
                          onChange={e => handleLineUpdate(idx, 'price', e.target.value)}
                          className="px-2 py-1 rounded border border-gray-250 text-xs bg-white text-gray-800 font-semibold"
                          required
                        />
                      </div>

                      <div className="flex flex-col gap-1 w-16 shrink-0">
                        <label className="text-[8px] text-gray-400 font-bold uppercase">Qty *</label>
                        <input
                          type="number"
                          min="1"
                          value={line.quantity}
                          onChange={e => handleLineUpdate(idx, 'quantity', e.target.value)}
                          className="px-2 py-1 rounded border border-gray-250 text-xs bg-white text-gray-800"
                          required
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItemLine(idx)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded shrink-0 mb-0.5 cursor-pointer"
                        disabled={items.length === 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2 border-t border-gray-100 pt-4">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-gray-500 font-bold uppercase">Delivery Zone / Surcharge Fee ({currencySymbol})</label>
                    <input
                      type="number"
                      value={deliveryFee}
                      onChange={e => setDeliveryFee(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white font-semibold"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-gray-500 font-bold uppercase">Discount Deductions ({currencySymbol})</label>
                    <input
                      type="number"
                      value={discountAmount}
                      onChange={e => setDiscountAmount(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white font-semibold"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-gray-500 font-bold uppercase">Order Private Notes / Specifications</label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows="3"
                    className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white"
                    placeholder="e.g. customized dimensions or specific packing instructions..."
                  ></textarea>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 border-t border-gray-100 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-205 hover:bg-gray-50 text-gray-600 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
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
                      Creating Order...
                    </>
                  ) : 'Register Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ORDER MODAL */}
      {showEditModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 md:p-6">
          <div className="bg-white rounded-xl p-6 max-w-xl w-full max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col gap-5 border border-gray-100 animate-scale-up">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-serif font-bold text-gray-900 text-lg">Edit Order #{selectedOrder.order_number}</h3>
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-gray-500 font-bold uppercase">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-gray-500 font-bold uppercase">Customer Email *</label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={e => setCustomerEmail(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-gray-500 font-bold uppercase">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-gray-500 font-bold uppercase">Delivery Method</label>
                  <SearchableSelect
                    value={deliveryMethod}
                    onChange={e => setDeliveryMethod(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-700"
                  >
                    <option value="pickup">Store Pickup</option>
                    <option value="delivery">Home Delivery</option>
                  </SearchableSelect>
                </div>
                {deliveryMethod === 'delivery' && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-gray-500 font-bold uppercase">Street Address</label>
                    <input
                      type="text"
                      value={deliveryAddress}
                      onChange={e => setDeliveryAddress(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white"
                    />
                  </div>
                )}
              </div>

              {deliveryMethod === 'delivery' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-gray-500 font-bold uppercase">City</label>
                    <input
                      type="text"
                      value={deliveryCity}
                      onChange={e => setDeliveryCity(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-gray-550 font-bold uppercase">Country</label>
                    <SearchableSelect
                      value={deliveryCountry}
                      onChange={e => { setDeliveryCountry(e.target.value); setDeliveryState(''); }}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800 cursor-pointer h-[34px]"
                    >
                      {COUNTRIES.map(c => (
                        <option key={c.code} value={c.name}>{c.name}</option>
                      ))}
                    </SearchableSelect>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-gray-555 font-bold uppercase">State</label>
                    <SearchableSelect
                      value={deliveryState}
                      onChange={e => setDeliveryState(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800 cursor-pointer h-[34px]"
                    >
                      <option value="">Select State</option>
                      {getStates(deliveryCountry).map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </SearchableSelect>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-gray-500 font-bold uppercase">Payment Gateway</label>
                  <SearchableSelect
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-700"
                  >
                    <option value="bank_transfer">Bank Transfer (Manual)</option>
                    <option value="cash_on_delivery">Cash on Delivery (COD)</option>
                    <option value="paystack">Paystack Online</option>
                    <option value="stripe">Stripe Card</option>
                    <option value="paypal">PayPal Express</option>
                    <option value="flutterwave">Flutterwave Gateway</option>
                  </SearchableSelect>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-gray-500 font-bold uppercase">Payment Status</label>
                  <SearchableSelect
                    value={paymentStatus}
                    onChange={e => setPaymentStatus(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-700"
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="failed">Failed</option>
                  </SearchableSelect>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-gray-500 font-bold uppercase flex items-center justify-between">
                    <span>Order Status</span>
                    {selectedOrder?.order_status === 'delivered' && (
                      <span className="text-[9px] text-emerald-600 font-extrabold uppercase">🔒 Delivered (Locked)</span>
                    )}
                  </label>
                  <SearchableSelect
                    value={orderStatus}
                    disabled={selectedOrder?.order_status === 'delivered'}
                    onChange={e => setOrderStatus(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-700 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    <option value="pending_payment">Pending Payment</option>
                    <option value="paid">Paid</option>
                    <option value="processing">Processing</option>
                    <option value="packed">Packed</option>
                    <option value="ready_for_pickup">Ready for Pickup</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </SearchableSelect>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-gray-500 font-bold uppercase">Delivery Fee ({currencySymbol})</label>
                  <input
                    type="number"
                    value={deliveryFee}
                    onChange={e => setDeliveryFee(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white font-semibold text-gray-800"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-gray-500 font-bold uppercase">Discount Amount ({currencySymbol})</label>
                  <input
                    type="number"
                    value={discountAmount}
                    onChange={e => setDiscountAmount(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white font-semibold text-gray-800"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-gray-500 font-bold uppercase">Subtotal ({currencySymbol})</label>
                  <div className="px-3 py-1.5 rounded-lg border border-gray-100 bg-gray-50 text-xs text-gray-500 font-bold">
                    {currencySymbol}{(selectedOrder.subtotal || 0).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-gray-550 font-bold uppercase">Private Notes</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows="2"
                  className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2.5 border-t border-gray-100 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-205 hover:bg-gray-50 text-gray-600 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
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
                  ) : 'Save Order details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
