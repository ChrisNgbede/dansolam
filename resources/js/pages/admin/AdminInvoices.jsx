import { getCurrencySymbol } from '../../utils/currency';
import React, { useState } from 'react';
import { toast as systemToast } from '../../components/ui/ToastProvider';
import { useQuery } from '@tanstack/react-query';
import { Loader2, FileText, Send, Plus, Trash2, CheckCircle, AlertCircle, ArrowLeft, Eye, Mail, Download } from 'lucide-react';
import { apiFetch } from '../../hooks/useAuth';
import { useTableState } from '../../hooks/useTableState';
import TablePaginationControls from '../../components/ui/TablePaginationControls';
import { COUNTRIES, getStates } from '../../utils/geoData';

export default function AdminInvoices() {
  const currencySymbol = getCurrencySymbol();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState(null);

  // Form states for Custom Invoice Creator
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryCity, setDeliveryCity] = useState('');
  const [deliveryState, setDeliveryState] = useState('');
  const [deliveryCountry, setDeliveryCountry] = useState('Nigeria');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');

  // Costs overrides
  const [deliveryFee, setDeliveryFee] = useState('0');
  const [discountAmount, setDiscountAmount] = useState('0');

  // Items lists
  const [items, setItems] = useState([
    { name: '', variant_label: 'Standard', price: '0', quantity: 1 }
  ]);

  // Submit states
  const [pdfLoading, setPdfLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch catalog products to auto-fill custom creator
  const { data: productsRes } = useQuery({
    queryKey: ['admin-products-invoice-list'],
    queryFn: () => apiFetch('/api/admin/products').then(res => res.json()),
    enabled: showCreateForm
  });
  const products = Array.isArray(productsRes?.data) ? productsRes.data : [];

  // Fetch actual orders to show in invoices list
  const { data: ordersRes, isLoading: ordersLoading, refetch: refetchOrders } = useQuery({
    queryKey: ['admin-orders-invoices-list'],
    queryFn: () => apiFetch('/api/admin/orders').then(res => res.json()),
    enabled: !showCreateForm
  });
  const orders = ordersRes?.data || [];

  // Table state hook for listing orders/invoices
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
    searchKeys: ['order_number', 'customer_name', 'customer_email', 'payment_method', 'order_status']
  });

  const handleAddItemLine = () => {
    setItems([...items, { name: '', variant_label: 'Standard', price: '0', quantity: 1 }]);
  };

  const handleRemoveItemLine = (idx) => {
    if (items.length === 1) return;
    const newItems = items.filter((_, i) => i !== idx);
    setItems(newItems);
  };

  const handleUpdateItemLine = (idx, field, val) => {
    const newItems = [...items];
    newItems[idx][field] = val;
    setItems(newItems);
  };

  const handleProductSelect = (idx, prodId) => {
    const product = products.find(p => p.id === parseInt(prodId));
    if (!product) return;

    const newItems = [...items];
    newItems[idx].name = product.name;
    newItems[idx].price = String(product.sale_price || product.price);

    if (product.has_variants && product.variants?.length > 0) {
      const v = product.variants[0];
      newItems[idx].variant_label = `${v.size} / ${v.color}`;
      newItems[idx].price = String(v.sale_price || v.price || newItems[idx].price);
    } else {
      newItems[idx].variant_label = 'Standard';
    }

    setItems(newItems);
  };

  // Calculations for custom creator
  const subtotal = items.reduce((sum, item) => {
    const pr = parseFloat(item.price) || 0;
    const qty = parseInt(item.quantity) || 1;
    return sum + (pr * qty);
  }, 0);

  const df = parseFloat(deliveryFee) || 0;
  const disc = parseFloat(discountAmount) || 0;
  const totalAmount = Math.max(0, (subtotal + df) - disc);

  const buildPayload = () => {
    return {
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      delivery_method: deliveryMethod,
      delivery_address: deliveryMethod === 'delivery' ? deliveryAddress : 'Store Pickup',
      delivery_city: deliveryMethod === 'delivery' ? deliveryCity : '',
      delivery_state: deliveryMethod === 'delivery' ? deliveryState : '',
      delivery_country: deliveryMethod === 'delivery' ? deliveryCountry : '',
      payment_method: paymentMethod,
      subtotal,
      delivery_fee: df,
      discount_amount: disc,
      total_amount: totalAmount,
      items: items.map(i => ({
        name: i.name,
        variant_label: i.variant_label,
        price: parseFloat(i.price) || 0,
        quantity: parseInt(i.quantity) || 1
      }))
    };
  };

  // Custom PDF Export
  const handleExportPDF = async () => {
    if (!customerName || !customerEmail) {
      setErrorMsg('Please specify client Name and Email to export invoice.');
      return;
    }
    setErrorMsg('');
    setSuccessMsg('');
    setPdfLoading(true);

    try {
      const token = localStorage.getItem('dansolam_admin_token');
      const res = await fetch('/api/admin/invoices/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(buildPayload())
      });

      if (!res.ok) throw new Error('Failed to generate PDF');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${customerName.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setSuccessMsg('PDF generated and downloaded successfully!');
    } catch (e) {
      setErrorMsg(e.message || 'Error exporting PDF invoice.');
    } finally {
      setPdfLoading(false);
    }
  };

  // Send Custom Email Invoice
  const handleSendEmail = async () => {
    if (!customerName || !customerEmail) {
      setErrorMsg('Please specify client Name and Email to send receipt.');
      return;
    }
    setErrorMsg('');
    setSuccessMsg('');
    setEmailLoading(true);

    try {
      const res = await apiFetch('/api/admin/invoices/send', {
        method: 'POST',
        body: JSON.stringify(buildPayload())
      });
      const data = await res.json();
      setEmailLoading(false);

      if (data.success) {
        setSuccessMsg(data.message);
      } else {
        setErrorMsg(data.message);
      }
    } catch (e) {
      setEmailLoading(false);
      setErrorMsg('Network error sending email receipt.');
    }
  };

  // Order Invoice actions (existing orders)
  const [downloadingOrderId, setDownloadingOrderId] = useState(null);
  const [sendingEmailOrderId, setSendingEmailOrderId] = useState(null);

  const handleDownloadOrderInvoice = async (orderId, orderNum) => {
    setDownloadingOrderId(orderId);
    try {
      const token = localStorage.getItem('dansolam_admin_token');
      const res = await fetch(`/api/admin/orders/${orderId}/invoice`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to generate PDF');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${orderNum}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      systemToast.success(`Invoice #${orderNum} PDF downloaded successfully!`);
    } catch (e) {
      systemToast.error('Error exporting PDF invoice: ' + e.message);
    } finally {
      setDownloadingOrderId(null);
    }
  };

  const handleSendOrderInvoiceEmail = async (orderId) => {
    setSendingEmailOrderId(orderId);
    try {
      const res = await apiFetch(`/api/admin/orders/${orderId}/send-invoice`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        systemToast.success(data.message || 'Invoice sent to email successfully!');
      } else {
        systemToast.error(data.message || 'Failed to send invoice');
      }
    } catch (e) {
      systemToast.error('Error sending invoice email');
    } finally {
      setSendingEmailOrderId(null);
    }
  };

  // Reset creator form
  const handleBackToList = () => {
    setShowCreateForm(false);
    setCustomerName('');
    setCustomerEmail('');
    setCustomerPhone('');
    setDeliveryMethod('pickup');
    setDeliveryAddress('');
    setDeliveryCity('');
    setDeliveryState('');
    setDeliveryCountry('Nigeria');
    setPaymentMethod('bank_transfer');
    setDeliveryFee('0');
    setDiscountAmount('0');
    setItems([{ name: '', variant_label: 'Standard', price: '0', quantity: 1 }]);
    setErrorMsg('');
    setSuccessMsg('');
  };

  return (
    <div className="flex flex-col gap-6 font-sans">

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif font-bold text-2xl text-gray-900">
            {showCreateForm ? 'Custom Invoice Creator' : 'Invoices & Receipts List'}
          </h2>
          <p className="text-xs text-gray-400 mt-1 font-semibold">
            {showCreateForm
              ? 'Generate custom templates, manual quotes, or custom billing codes.'
              : 'View bills, print customer invoices, and send PDF receipts for orders.'}
          </p>
        </div>

        {!showCreateForm ? (
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create New
          </button>
        ) : (
          <button
            onClick={handleBackToList}
            className="px-4 py-2 border border-gray-250 hover:bg-gray-55 text-gray-600 text-xs font-semibold rounded-lg flex items-center gap-1 shadow-sm transition-all cursor-pointer bg-white"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Invoices List
          </button>
        )}
      </div>

      {/* VIEW RENDER CONDITIONAL */}
      {!showCreateForm ? (
        /* ── INVOICES LIST VIEW ── */
        <div className="flex flex-col gap-4">

          {/* Table Search & Header Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-gray-150 p-4 rounded-xl shadow-sm">
            <div className="flex-1 max-w-sm">
              <input
                type="text"
                placeholder="Search invoices (name, order #, method, status...)"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary text-xs bg-white"
              />
            </div>
            <span className="text-[10px] text-gray-400 font-bold uppercase">
              👑 {filteredCount} invoices / receipts
            </span>
          </div>

          {/* Table Container */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-gray-500 uppercase font-semibold select-none">
                    <th onClick={() => requestSort('order_number')} className="px-6 py-3 cursor-pointer hover:bg-gray-100">
                      Invoice # {sortField === 'order_number' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                    </th>
                    <th onClick={() => requestSort('customer_name')} className="px-6 py-3 cursor-pointer hover:bg-gray-100">
                      Customer {sortField === 'customer_name' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                    </th>
                    <th onClick={() => requestSort('created_at')} className="px-6 py-3 cursor-pointer hover:bg-gray-100">
                      Date {sortField === 'created_at' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                    </th>
                    <th onClick={() => requestSort('total_amount')} className="px-6 py-3 cursor-pointer hover:bg-gray-100">
                      Total Bill {sortField === 'total_amount' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                    </th>
                    <th onClick={() => requestSort('payment_method')} className="px-6 py-3 cursor-pointer hover:bg-gray-100">
                      Payment Mode {sortField === 'payment_method' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                    </th>
                    <th onClick={() => requestSort('payment_status')} className="px-6 py-3 cursor-pointer hover:bg-gray-100">
                      Status {sortField === 'payment_status' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                    </th>
                    <th className="px-6 py-3 text-right">Invoice Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {ordersLoading ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center">
                        <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                        <span className="text-gray-400 text-xs mt-1 block">Loading invoices dataset...</span>
                      </td>
                    </tr>
                  ) : paginatedData.length > 0 ? (
                    paginatedData.map((ord) => (
                      <tr key={ord.id} className="hover:bg-gray-55/20">
                        <td className="px-6 py-4 font-semibold">
                          <button
                            onClick={() => setViewingInvoice(ord)}
                            className="text-primary hover:underline font-bold cursor-pointer"
                            title="View Invoice Details"
                          >
                            #{ord.order_number}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-gray-800 block">{ord.customer_name}</span>
                          <span className="text-[10px] text-gray-400 block mt-0.5">{ord.customer_email}</span>
                        </td>
                        <td className="px-6 py-4 text-gray-500">{new Date(ord.created_at).toLocaleDateString()}</td>
                        <td className="px-6 py-4 font-semibold text-gray-900">{currencySymbol}{parseFloat(ord.total_amount).toLocaleString()}</td>
                        <td className="px-6 py-4 capitalize text-gray-600">{ord.payment_method?.replace('_', ' ')}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${ord.payment_status === 'paid' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-500'
                            }`}>
                            {(ord.payment_status || 'pending').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleDownloadOrderInvoice(ord.id, ord.order_number)}
                              disabled={downloadingOrderId === ord.id}
                              className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition-all cursor-pointer"
                              title="Download PDF Invoice"
                            >
                              {downloadingOrderId === ord.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Download className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              onClick={() => setViewingInvoice(ord)}
                              className="p-1.5 text-gray-500 hover:text-primary hover:bg-primary/5 rounded transition-all cursor-pointer"
                              title="View Invoice Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleSendOrderInvoiceEmail(ord.id)}
                              disabled={sendingEmailOrderId === ord.id}
                              className="p-1.5 text-gray-500 hover:text-primary hover:bg-primary/5 rounded transition-all cursor-pointer"
                              title="Send PDF to Client Email"
                            >
                              {sendingEmailOrderId === ord.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Mail className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-6 py-10 text-center text-gray-400 italic">
                        No orders or invoices found matching query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
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
        </div>
      ) : (
        /* ── CREATE CUSTOM MANUAL INVOICE FORM ── */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-fade-in">

          {/* Form inputs column */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col gap-5">
            <h3 className="font-semibold text-xs text-gray-800 uppercase tracking-wider border-b border-gray-50 pb-2">Client Details</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] text-gray-550 font-bold uppercase">Customer Name *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800"
                  placeholder="Client Name"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] text-gray-555 font-bold uppercase">Customer Email *</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800"
                  placeholder="client@mail.com"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] text-gray-555 font-bold uppercase">Customer Phone</label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800"
                  placeholder="Phone number"
                />
              </div>
            </div>

            <h3 className="font-semibold text-xs text-gray-800 uppercase tracking-wider border-b border-gray-50 pb-2 mt-2">Delivery & Fulfilment</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] text-gray-550 font-bold uppercase">Delivery Method</label>
                <select
                  value={deliveryMethod}
                  onChange={e => setDeliveryMethod(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-700 font-semibold"
                >
                  <option value="pickup">Store Pickup</option>
                  <option value="delivery">Home Delivery</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] text-gray-550 font-bold uppercase">Payment Mode</label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-700 font-semibold"
                >
                  <option value="bank_transfer">Bank Wire Transfer</option>
                  <option value="cash_on_delivery">Cash on Delivery (COD)</option>
                  <option value="paystack">Paystack Online Payment</option>
                  <option value="stripe">Stripe Credit Card</option>
                  <option value="paypal">PayPal Express</option>
                  <option value="flutterwave">Flutterwave Gateway</option>
                </select>
              </div>
            </div>

            {deliveryMethod === 'delivery' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in">
                <div className="sm:col-span-3 flex flex-col gap-1.5">
                  <label className="text-[9px] text-gray-550 font-bold uppercase">Shipping Address</label>
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={e => setDeliveryAddress(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800"
                    placeholder="Street Address, Area"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] text-gray-555 font-bold uppercase">City</label>
                  <input
                    type="text"
                    value={deliveryCity}
                    onChange={e => setDeliveryCity(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] text-gray-555 font-bold uppercase">Country</label>
                  <select
                    value={deliveryCountry}
                    onChange={e => { setDeliveryCountry(e.target.value); setDeliveryState(''); }}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800 cursor-pointer h-[34px]"
                  >
                    {COUNTRIES.map(c => (
                      <option key={c.code} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] text-gray-555 font-bold uppercase">State</label>
                  <select
                    value={deliveryState}
                    onChange={e => setDeliveryState(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800 cursor-pointer h-[34px]"
                  >
                    <option value="">Select State</option>
                    {getStates(deliveryCountry).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <h3 className="font-semibold text-xs text-gray-800 uppercase tracking-wider border-b border-gray-50 pb-2 mt-2 flex justify-between items-center select-none">
              Invoice Items Lines
              <button
                type="button"
                onClick={handleAddItemLine}
                className="text-[10px] text-primary hover:underline font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Item
              </button>
            </h3>

            <div className="flex flex-col gap-3">
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-3 items-end bg-gray-50 p-3 rounded-lg border border-gray-150 animate-scale-up">

                  {/* Catalog dropdown selector */}
                  <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-2 flex flex-col gap-1.5">
                      <label className="text-[8px] text-gray-400 font-bold uppercase">Product Title / Custom Name</label>
                      <div className="flex flex-col gap-1">
                        <select
                          onChange={(e) => handleProductSelect(idx, e.target.value)}
                          className="px-2 py-1 rounded border border-gray-200 focus:outline-none focus:border-primary text-[10px] bg-white text-gray-700 font-semibold"
                          defaultValue=""
                        >
                          <option value="" disabled>-- Auto-fill from Catalog --</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={item.name}
                          onChange={e => handleUpdateItemLine(idx, 'name', e.target.value)}
                          className="px-3 py-1 rounded border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white mt-1 text-gray-800 font-semibold"
                          placeholder="Item Description Name"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[8px] text-gray-400 font-bold uppercase">Variant / Sizing</label>
                      <input
                        type="text"
                        value={item.variant_label}
                        onChange={e => handleUpdateItemLine(idx, 'variant_label', e.target.value)}
                        className="px-3 py-1 rounded border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800"
                        placeholder="e.g. Size 38 / Gold"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[8px] text-gray-400 font-bold uppercase">Price ({currencySymbol}) *</label>
                      <input
                        type="number"
                        value={item.price}
                        onChange={e => handleUpdateItemLine(idx, 'price', e.target.value)}
                        className="px-3 py-1 rounded border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800 font-semibold"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 w-16 shrink-0">
                    <label className="text-[8px] text-gray-400 font-bold uppercase">Qty *</label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={e => handleUpdateItemLine(idx, 'quantity', parseInt(e.target.value) || 1)}
                      className="px-3 py-1 rounded border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-850 font-bold"
                      min="1"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveItemLine(idx)}
                    className="p-2 text-red-500 hover:bg-red-55 rounded transition-all cursor-pointer bg-white border border-gray-200"
                    disabled={items.length === 1}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                </div>
              ))}
            </div>

          </div>

          {/* Totals & Actions column */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col gap-4">
            <h3 className="font-serif font-bold text-gray-800 text-lg border-b border-gray-100 pb-3">Payment Summary</h3>

            <div className="flex flex-col gap-3 text-xs text-gray-600 font-sans">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-gray-900">{currencySymbol}{subtotal.toLocaleString()}</span>
              </div>

              <div className="flex flex-col gap-1.5 border-t border-gray-50 pt-3">
                <label className="text-[9px] text-gray-550 font-bold uppercase">Shipping / Delivery Cost ({currencySymbol})</label>
                <input
                  type="number"
                  value={deliveryFee}
                  onChange={e => setDeliveryFee(e.target.value)}
                  className="px-3 py-1 rounded border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800 font-semibold"
                />
              </div>

              <div className="flex flex-col gap-1.5 mt-1 pb-3">
                <label className="text-[9px] text-gray-550 font-bold uppercase">Discount Amount ({currencySymbol})</label>
                <input
                  type="number"
                  value={discountAmount}
                  onChange={e => setDiscountAmount(e.target.value)}
                  className="px-3 py-1 rounded border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-800 font-semibold"
                />
              </div>

              <div className="flex justify-between border-t border-gray-100 pt-3 text-sm font-bold text-gray-900">
                <span>Total Bill</span>
                <span className="text-primary font-serif">{currencySymbol}{totalAmount.toLocaleString()}</span>
              </div>
            </div>

            {/* Error alerts */}
            {errorMsg && (
              <div className="bg-red-50 border border-red-100 text-red-500 rounded-lg p-3 text-xs font-semibold flex items-center gap-1.5 mt-2 leading-relaxed">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="bg-green-50 border border-green-200 text-green-600 rounded-lg p-3 text-xs font-semibold flex items-center gap-1.5 mt-2 leading-relaxed">
                <CheckCircle className="w-4 h-4 shrink-0" />
                {successMsg}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col gap-2 mt-4">
              <button
                onClick={handleExportPDF}
                disabled={pdfLoading || emailLoading}
                className="w-full py-2.5 bg-gray-800 hover:bg-black text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                {pdfLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    Export & Download PDF
                  </>
                )}
              </button>

              <button
                onClick={handleSendEmail}
                disabled={pdfLoading || emailLoading}
                className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                {emailLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending Email...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Invoice to Mail
                  </>
                )}
              </button>
            </div>

          </div>

        </div>
      )}

      {/* ── INVOICE DETAILS MODAL ── */}
      {viewingInvoice && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col p-6 animate-scale-up border border-gray-100">

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-150 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-primary" />
                <h3 className="font-serif font-bold text-lg text-gray-900">
                  Invoice Details: #{viewingInvoice.order_number}
                </h3>
              </div>
              <button
                onClick={() => setViewingInvoice(null)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-50 p-1.5 rounded-lg transition-all cursor-pointer font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Invoice Digital Layout */}
            <div className="flex-1 flex flex-col gap-6 font-sans text-xs text-gray-700">

              {/* Header Info Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 border border-gray-150 p-4 rounded-xl">
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase block text-left">Billed From</span>
                  <span className="font-bold text-gray-900 text-sm mt-1 block text-left">Dansolam</span>
                  <span className="text-gray-500 block mt-0.5 text-left">Plot 1234, SHOP Boulevard</span>
                  <span className="text-gray-500 block mt-0.5 text-left">WhatsApp: +234 80 0000 0000</span>
                </div>
                <div className="sm:text-right flex flex-col sm:items-end">
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Invoice Information</span>
                  <div className="mt-1 flex items-center gap-2 sm:justify-end">
                    <span className="font-bold text-gray-900">Status:</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${viewingInvoice.payment_status === 'paid' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-orange-50 text-orange-500 border border-orange-100'
                      }`}>
                      {(viewingInvoice.payment_status || 'pending').toUpperCase()}
                    </span>
                  </div>
                  <span className="text-gray-500 mt-1.5 block"><strong>Date:</strong> {new Date(viewingInvoice.created_at).toLocaleDateString()}</span>
                  <span className="text-gray-500 mt-0.5 block"><strong>Payment Mode:</strong> {viewingInvoice.payment_method?.replace('_', ' ').toUpperCase()}</span>
                </div>
              </div>

              {/* Billed To / Shipping Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-b border-gray-100 pb-4">
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1 text-left">Billed To</span>
                  <span className="font-bold text-gray-955 text-xs block text-left">{viewingInvoice.customer_name}</span>
                  <span className="text-gray-500 block mt-0.5 text-left">{viewingInvoice.customer_email}</span>
                  <span className="text-gray-500 block mt-0.5 text-left">{viewingInvoice.customer_phone}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1 text-left">Shipping Details</span>
                  <span className="font-semibold text-gray-900 block capitalize text-left">
                    Method: {viewingInvoice.delivery_method?.replace('_', ' ')}
                  </span>
                  {viewingInvoice.delivery_method === 'delivery' ? (
                    <span className="text-gray-500 block mt-0.5 leading-relaxed text-left">
                      {viewingInvoice.delivery_address}, {viewingInvoice.delivery_city}, {viewingInvoice.delivery_state}, {viewingInvoice.delivery_country}
                    </span>
                  ) : (
                    <span className="text-gray-400 italic block mt-0.5 text-left">Store Pickup at Main SHOP</span>
                  )}
                </div>
              </div>

              {/* Items Breakdown Table */}
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase block mb-2 text-left">Item breakdown</span>
                <div className="border border-gray-150 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-150 text-gray-500 uppercase font-semibold text-[10px]">
                        <th className="px-4 py-2">Item Details</th>
                        <th className="px-4 py-2 text-right">Price</th>
                        <th className="px-4 py-2 text-center">Qty</th>
                        <th className="px-4 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {viewingInvoice.items?.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3">
                            <span className="font-semibold text-gray-800 block text-left">{item.name}</span>
                            <span className="text-[10px] text-gray-400 block mt-0.5 text-left">Variant: {item.variant_label || 'Standard'}</span>
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-gray-700">
                            {currencySymbol}{parseFloat(item.price).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-650 font-bold">{item.quantity}</td>
                          <td className="px-4 py-3 text-right font-bold text-gray-900">
                            {currencySymbol}{(parseFloat(item.price) * item.quantity).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals Summary */}
              <div className="flex flex-col items-end gap-2 border-t border-gray-100 pt-4">
                <div className="w-64 flex flex-col gap-2 text-xs">
                  <div className="flex justify-between text-gray-500">
                    <span>Subtotal:</span>
                    <span className="font-medium text-gray-700">
                      {currencySymbol}{parseFloat(viewingInvoice.subtotal || viewingInvoice.total_amount).toLocaleString()}
                    </span>
                  </div>
                  {parseFloat(viewingInvoice.delivery_fee) > 0 && (
                    <div className="flex justify-between text-gray-500">
                      <span>Shipping Fee:</span>
                      <span className="font-medium text-gray-700">
                        +{currencySymbol}{parseFloat(viewingInvoice.delivery_fee).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {parseFloat(viewingInvoice.discount_amount) > 0 && (
                    <div className="flex justify-between text-gray-500">
                      <span>Discount Applied:</span>
                      <span className="font-medium text-green-600">
                        -{currencySymbol}{parseFloat(viewingInvoice.discount_amount).toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-gray-150 pt-2 text-sm font-bold text-gray-900">
                    <span>Total Paid:</span>
                    <span className="text-primary font-serif">
                      {currencySymbol}{parseFloat(viewingInvoice.total_amount).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer Actions */}
            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-gray-150 pt-4 mt-6">
              <button
                onClick={() => handleDownloadOrderInvoice(viewingInvoice.id, viewingInvoice.order_number)}
                disabled={downloadingOrderId === viewingInvoice.id}
                className="px-4 py-2 border border-gray-250 hover:bg-gray-55 text-gray-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer bg-white"
              >
                {downloadingOrderId === viewingInvoice.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                Download PDF
              </button>

              <button
                onClick={() => handleSendOrderInvoiceEmail(viewingInvoice.id)}
                disabled={sendingEmailOrderId === viewingInvoice.id}
                className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                {sendingEmailOrderId === viewingInvoice.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Mail className="w-3.5 h-3.5" />
                )}
                Send to Client Email
              </button>

              <button
                onClick={() => setViewingInvoice(null)}
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
