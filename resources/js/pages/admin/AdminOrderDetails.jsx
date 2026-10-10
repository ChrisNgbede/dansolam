import { getCurrencySymbol } from '../../utils/currency';
import React, { useState, useEffect } from 'react';
import { toast as systemToast } from '../../components/ui/ToastProvider';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Loader2,
  Landmark,
  CheckCircle,
  Clock,
  MessageCircle,
  FileText,
  Send,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  Copy,
  ExternalLink,
  ShieldCheck,
  User,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import { apiFetch } from '../../hooks/useAuth';
import SearchableSelect from '../../components/ui/SearchableSelect';

export default function AdminOrderDetails() {
  const currencySymbol = getCurrencySymbol();
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [orderStatus, setOrderStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  // Normalize phone for WhatsApp URL (handles Nigerian 070... -> 23470...)
  const formatPhoneForWhatsApp = (rawPhone) => {
    if (!rawPhone) return '';
    let cleaned = rawPhone.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('0') && cleaned.length === 11) {
      cleaned = '234' + cleaned.substring(1);
    } else if (!cleaned.startsWith('234') && cleaned.length === 10) {
      cleaned = '234' + cleaned;
    }
    return cleaned;
  };

  const generateWhatsAppReceiptLink = (ord) => {
    if (!ord) return '';
    const phone = formatPhoneForWhatsApp(ord.customer_phone);

    const itemsList = (ord.items || []).map(item => {
      const label = item.variant_label ? ` (${item.variant_label})` : '';
      return `• ${item.product_name}${label} x ${item.quantity} - ${currencySymbol}${(item.price * item.quantity).toLocaleString()}`;
    }).join('\n');

    const text = `*DANSOLAM LUXURY BEAUTY HOME - ORDER RECEIPT*\n` +
      `--------------------------------\n` +
      `*Order Number:* #${ord.order_number}\n` +
      `*Customer:* ${ord.customer_name}\n` +
      `*Date:* ${new Date(ord.created_at).toLocaleDateString()}\n` +
      `*Fulfillment Status:* ${ord.order_status?.toUpperCase().replace('_', ' ')}\n` +
      `*Payment Method:* ${ord.payment_method?.toUpperCase()}\n` +
      `*Payment Status:* ${ord.payment_status?.toUpperCase()}\n` +
      `--------------------------------\n` +
      `*Items:*\n${itemsList}\n` +
      `--------------------------------\n` +
      `*Subtotal:* ${currencySymbol}${parseFloat(ord.subtotal || 0).toLocaleString()}\n` +
      (ord.discount_amount > 0 ? `*Discount:* - ${currencySymbol}${parseFloat(ord.discount_amount).toLocaleString()}\n` : '') +
      `*Delivery Fee:* ${currencySymbol}${parseFloat(ord.delivery_fee || 0).toLocaleString()}\n` +
      (parseFloat(ord.tax_amount) > 0 ? `*Taxes:* ${currencySymbol}${parseFloat(ord.tax_amount).toLocaleString()}\n` : '') +
      `*Total Amount:* ${currencySymbol}${parseFloat(ord.total_amount || 0).toLocaleString()}\n` +
      `--------------------------------\n` +
      `*Track your order live:* ${window.location.origin}/order-tracking?order_number=${ord.order_number}&contact=${encodeURIComponent(ord.customer_email || '')}\n\n` +
      `Thank you for choosing Dansolam!`;

    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  };

  // Fetch Order details
  const { data: orderRes, isLoading } = useQuery({
    queryKey: ['admin-order-details', id],
    queryFn: () => apiFetch(`/api/admin/orders/${id}`).then(res => res.json())
  });

  const order = orderRes?.data;

  // Load current statuses on fetch
  useEffect(() => {
    if (order) {
      setOrderStatus(order.order_status);
      setPaymentStatus(order.payment_status);
    }
  }, [order]);

  // Update Status mutation
  const updateStatusMutation = useMutation({
    mutationFn: (updatedStatus) => {
      return apiFetch(`/api/admin/orders/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify(updatedStatus)
      }).then(res => res.json());
    },
    onSuccess: (data) => {
      setUpdateLoading(false);
      if (data.success) {
        systemToast.success(data.message || 'Order status updated successfully!');
        queryClient.invalidateQueries(['admin-order-details', id]);
        queryClient.invalidateQueries(['admin-orders']);
      } else {
        systemToast.error(data.message || 'Update failed');
      }
    },
    onError: (err) => {
      setUpdateLoading(false);
      systemToast.error('Network error updating order status: ' + err.message);
    }
  });

  const isDelivered = order?.order_status === 'delivered';

  const handleUpdateSubmit = (e) => {
    if (e) e.preventDefault();
    if (isDelivered) {
      systemToast.error('This order has already been delivered and finalized. Its fulfillment status cannot be modified.');
      return;
    }
    setUpdateLoading(true);
    updateStatusMutation.mutate({
      order_status: orderStatus,
      payment_status: paymentStatus
    });
  };

  const handleQuickStatusUpdate = (newOrderStatus, newPaymentStatus = null) => {
    if (isDelivered) {
      systemToast.error('This order has already been delivered and finalized. Its fulfillment status cannot be modified.');
      return;
    }
    setUpdateLoading(true);
    setOrderStatus(newOrderStatus);
    const payload = { order_status: newOrderStatus };
    if (newPaymentStatus) {
      setPaymentStatus(newPaymentStatus);
      payload.payment_status = newPaymentStatus;
    } else {
      payload.payment_status = paymentStatus;
    }
    updateStatusMutation.mutate(payload);
  };

  const handleDownloadInvoice = async () => {
    setPdfLoading(true);
    try {
      const res = await apiFetch(`/api/admin/orders/${order.id}/invoice`);
      if (!res.ok) throw new Error('PDF export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice-${order.order_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      systemToast.success(`Invoice for Order #${order.order_number} exported to PDF!`);
    } catch (e) {
      systemToast.error('Error exporting PDF: ' + e.message);
    } finally {
      setPdfLoading(false);
    }
  };

  const handleSendEmailInvoice = async () => {
    setEmailLoading(true);
    try {
      const res = await apiFetch(`/api/admin/orders/${order.id}/send-invoice`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        systemToast.success(data.message || `Invoice email sent to ${order.customer_email}!`);
      } else {
        systemToast.error(data.message || 'Failed to send invoice email.');
      }
    } catch (e) {
      systemToast.error('Error sending email: ' + e.message);
    } finally {
      setEmailLoading(false);
    }
  };

  const copyToClipboard = (text, label = 'Text') => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      systemToast.success(`${label} copied to clipboard!`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#5D3E85] animate-spin" />
          <span className="text-xs font-extrabold text-gray-500">Loading order details...</span>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto text-center py-24 flex flex-col items-center gap-4">
        <span className="text-5xl">🔎</span>
        <h2 className="font-extrabold text-gray-800 text-lg">Order Not Found</h2>
        <p className="text-xs text-gray-500">We could not locate this order in the records.</p>
        <Link to="/admin/orders" className="px-6 py-2.5 bg-[#5D3E85] hover:bg-[#EC268F] text-white text-xs font-extrabold rounded-full shadow-sm transition-all">
          Return to Orders list
        </Link>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
      case 'delivered':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/50';
      case 'shipped':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/50';
      case 'processing':
      case 'packed':
      case 'ready_for_pickup':
        return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800/50';
      case 'pending':
      case 'pending_payment':
        return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/50';
      case 'cancelled':
      case 'failed':
        return 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/50';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const trackingUrl = `${window.location.origin}/order-tracking?order_number=${order.order_number}&contact=${encodeURIComponent(order.customer_email || '')}`;

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full pb-16">
      {/* Breadcrumb / Back button */}
      <Link
        to="/admin/orders"
        className="inline-flex items-center gap-1.5 text-xs font-extrabold text-gray-500 hover:text-[#5D3E85] dark:text-gray-400 dark:hover:text-[#EC268F] transition-colors self-start cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Orders Catalog
      </Link>

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 bg-white dark:bg-[#1E1528] border border-[#EADBEE] dark:border-white/10 p-6 rounded-3xl shadow-xs transition-colors">
        <div className="flex flex-col gap-1.5 text-left">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="font-extrabold text-2xl text-[#221B2B] dark:text-[#F3EFF6]">
              Order #{order.order_number}
            </h2>
            <span className={`text-[11px] font-extrabold px-3 py-1 rounded-full uppercase border ${getStatusBadge(order.order_status)}`}>
              {(order.order_status || 'pending').replace('_', ' ')}
            </span>
            <span className={`text-[11px] font-extrabold px-3 py-1 rounded-full uppercase border ${getStatusBadge(order.payment_status)}`}>
              Payment: {order.payment_status || 'pending'}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-[#9B8EA9] font-medium">
            Placed on {new Date(order.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })} • Gateway: <strong className="uppercase text-[#5D3E85] dark:text-[#EC268F]">{order.payment_method}</strong>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* WhatsApp Share Receipt */}
          <a
            href={generateWhatsAppReceiptLink(order)}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2.5 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-full text-xs font-extrabold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer btn-spring"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Share Receipt (WhatsApp)</span>
          </a>

          {/* Export PDF */}
          <button
            type="button"
            onClick={handleDownloadInvoice}
            disabled={pdfLoading}
            className="px-3.5 py-2.5 border border-gray-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 rounded-full text-xs font-extrabold text-[#221B2B] dark:text-[#F3EFF6] transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            {pdfLoading ? <Loader2 className="w-4 h-4 animate-spin text-[#5D3E85]" /> : <FileText className="w-4 h-4 text-[#5D3E85] dark:text-[#EC268F]" />}
            <span>Export PDF</span>
          </button>

          {/* Email Invoice */}
          <button
            type="button"
            onClick={handleSendEmailInvoice}
            disabled={emailLoading}
            className="px-4 py-2.5 bg-[#5D3E85] hover:bg-[#EC268F] text-white rounded-full text-xs font-extrabold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer btn-spring"
          >
            {emailLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>Email Invoice</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* LEFT TWO COLUMNS: DETAILS */}
        <div className="lg:col-span-2 flex flex-col gap-6 w-full text-left">

          {/* Customer & Shipping Info */}
          <div className="bg-white dark:bg-[#1E1528] border border-[#EADBEE] dark:border-white/10 rounded-3xl p-6 shadow-xs flex flex-col gap-4 transition-colors">
            <div className="flex items-center justify-between border-b border-[#EADBEE] dark:border-white/10 pb-3">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-[#5D3E85] dark:text-[#EC268F] flex items-center gap-2">
                <User className="w-4 h-4" />
                Customer & Delivery Information
              </h3>
              <button
                type="button"
                onClick={() => copyToClipboard(trackingUrl, 'Live Tracking Link')}
                className="text-[11px] font-extrabold text-[#5D3E85] dark:text-[#EC268F] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy Live Tracking Link
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs text-gray-700 dark:text-[#C9BED4]">
              <div className="flex flex-col gap-2.5">
                <div className="flex items-start gap-2">
                  <User className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Recipient</span>
                    <strong className="text-sm text-[#221B2B] dark:text-[#F3EFF6]">{order.customer_name}</strong>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Phone className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Phone Number</span>
                    <span className="font-bold text-[#221B2B] dark:text-[#F3EFF6]">{order.customer_phone}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Mail className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Email Address</span>
                    <span className="font-bold text-[#221B2B] dark:text-[#F3EFF6] break-all">{order.customer_email}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                <div className="flex items-start gap-2">
                  <Truck className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Fulfillment Method</span>
                    <span className="font-bold uppercase text-[#5D3E85] dark:text-[#EC268F]">
                      {order.delivery_method === 'pickup' ? '🏪 In-Store Pickup (Dansolam SHOP)' : '🚚 Doorstep Delivery'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Shipping Destination</span>
                    <span className="font-medium text-[#221B2B] dark:text-[#F3EFF6] leading-relaxed">
                      {order.delivery_method === 'delivery' ? (
                        [order.delivery_address, order.delivery_city, order.delivery_state, order.delivery_postcode, order.delivery_country || 'United Kingdom'].filter(Boolean).join(', ')
                      ) : (
                        'Dansolam Beauty Home Main Branch'
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {order.notes && (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 p-3.5 rounded-2xl text-xs text-amber-900 dark:text-amber-300 mt-2">
                📝 <strong className="font-extrabold">Customer Special Note:</strong> {order.notes}
              </div>
            )}
          </div>

          {/* Ordered items details */}
          <div className="bg-white dark:bg-[#1E1528] border border-[#EADBEE] dark:border-white/10 rounded-3xl p-6 shadow-xs flex flex-col gap-4 transition-colors">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-[#5D3E85] dark:text-[#EC268F] border-b border-[#EADBEE] dark:border-white/10 pb-3 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Ordered Products ({order.items?.length || 0} items)
            </h3>

            <div className="divide-y divide-gray-100 dark:divide-white/5">
              {order.items?.map((item) => (
                <div key={item.id} className="py-3.5 flex justify-between items-center text-xs gap-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-extrabold text-[#221B2B] dark:text-[#F3EFF6]">{item.product_name}</span>
                    {item.variant_label && (
                      <span className="text-[11px] font-bold text-[#5D3E85] dark:text-[#EC268F]">{item.variant_label}</span>
                    )}
                    <span className="text-[10px] text-gray-400 font-medium">
                      Qty: {item.quantity} × {currencySymbol}{parseFloat(item.price).toLocaleString()}
                    </span>
                  </div>
                  <strong className="text-sm font-extrabold text-[#221B2B] dark:text-[#F3EFF6]">
                    {currencySymbol}{(item.price * item.quantity).toLocaleString()}
                  </strong>
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div className="border-t border-[#EADBEE] dark:border-white/10 pt-4 flex flex-col gap-2 text-xs text-gray-600 dark:text-[#C9BED4] max-w-sm ml-auto w-full">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold text-[#221B2B] dark:text-[#F3EFF6]">{currencySymbol}{parseFloat(order.subtotal || 0).toLocaleString()}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                  <span>Discount</span>
                  <span>- {currencySymbol}{parseFloat(order.discount_amount).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery & Handling</span>
                <span className="font-bold text-[#221B2B] dark:text-[#F3EFF6]">{currencySymbol}{parseFloat(order.delivery_fee || 0).toLocaleString()}</span>
              </div>
              {parseFloat(order.tax_amount) > 0 && (
                <div className="flex justify-between">
                  <span>Taxes</span>
                  <span className="font-bold text-[#221B2B] dark:text-[#F3EFF6]">{currencySymbol}{parseFloat(order.tax_amount).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-[#EADBEE] dark:border-white/10 pt-3 text-base font-extrabold text-[#221B2B] dark:text-[#F3EFF6]">
                <span>Total Amount</span>
                <span className="text-[#5D3E85] dark:text-[#EC268F] font-serif">{currencySymbol}{parseFloat(order.total_amount).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Payment Gateway Records */}
          {order.payments && order.payments.length > 0 && (
            <div className="bg-white dark:bg-[#1E1528] border border-[#EADBEE] dark:border-white/10 rounded-3xl p-6 shadow-xs flex flex-col gap-3 transition-colors">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-[#5D3E85] dark:text-[#EC268F] border-b border-[#EADBEE] dark:border-white/10 pb-3 flex items-center gap-2">
                <Landmark className="w-4 h-4" />
                Transaction & Payment Gateway Logs
              </h3>
              <div className="flex flex-col gap-2">
                {order.payments.map((p) => (
                  <div key={p.id} className="p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-between text-xs flex-wrap gap-2">
                    <div className="flex flex-col">
                      <span className="font-extrabold uppercase text-[#221B2B] dark:text-[#F3EFF6]">Gateway: {p.gateway}</span>
                      <span className="text-[10px] text-gray-400 font-mono">Ref: {p.transaction_reference}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <strong className="text-[#5D3E85] dark:text-[#EC268F]">{currencySymbol}{parseFloat(p.amount).toLocaleString()}</strong>
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase border ${p.status === 'success' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-amber-100 text-amber-800 border-amber-200'}`}>
                        {p.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: FULFILLMENT & QUICK ACTIONS */}
        <div className="flex flex-col gap-6 w-full text-left">

          {isDelivered ? (
            /* Order Delivered & Locked State */
            <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-3xl p-6 shadow-xs flex flex-col gap-4.5 transition-colors">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="flex flex-col">
                  <h4 className="font-extrabold text-base text-emerald-950 dark:text-emerald-200">
                    Order Delivered & Completed
                  </h4>
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">
                    {order.delivered_at ? `Delivered on ${new Date(order.delivered_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}` : 'Delivered successfully'}
                  </span>
                </div>
              </div>

              <p className="text-xs text-emerald-900 dark:text-emerald-300/90 leading-relaxed font-medium bg-white/60 dark:bg-black/20 p-4 rounded-2xl border border-emerald-200/60 dark:border-emerald-800/40">
                🔒 <strong>Status Finalized:</strong> This order is marked as delivered and complete. The fulfillment workflow is permanently locked to protect customer transaction records and invoice integrity.
              </p>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-black/20 border border-emerald-200/60 dark:border-emerald-800/40 text-xs">
                <span className="font-bold text-gray-700 dark:text-[#C9BED4]">Order Fulfillment State:</span>
                <span className="font-extrabold text-emerald-700 dark:text-emerald-300 uppercase text-[10px] bg-emerald-100 dark:bg-emerald-900/50 px-3 py-1 rounded-full border border-emerald-300 dark:border-emerald-800">
                  Delivered (Locked)
                </span>
              </div>

              {/* Direct Customer WhatsApp Concierge */}
              <a
                href={`https://wa.me/${formatPhoneForWhatsApp(order.customer_phone)}?text=Hello%20${encodeURIComponent(order.customer_name || 'Valued Customer')}%2C%20thank%20you%20for%20shopping%20with%20Dansolam%20Beauty%20Home!%20Your%20order%20%23${order.order_number}%20has%20been%20delivered.`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-center inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-full text-xs font-extrabold transition-all cursor-pointer shadow-xs btn-spring mt-1"
              >
                <MessageCircle className="w-4 h-4 fill-white text-white" />
                <span>Message Customer on WhatsApp</span>
              </a>
            </div>
          ) : (
            <>
              {/* Quick Action Chips */}
              <div className="bg-white dark:bg-[#1E1528] border border-[#EADBEE] dark:border-white/10 rounded-3xl p-6 shadow-xs flex flex-col gap-3.5 transition-colors">
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-[#5D3E85] dark:text-[#EC268F] border-b border-[#EADBEE] dark:border-white/10 pb-2 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  1-Click Fulfillment Status
                </h3>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={updateLoading || order.payment_status === 'paid'}
                    onClick={() => handleQuickStatusUpdate(order.order_status === 'pending_payment' ? 'paid' : order.order_status, 'paid')}
                    className="px-3 py-2 rounded-2xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-extrabold border border-emerald-200 dark:border-emerald-800/50 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Confirm Payment
                  </button>

                  <button
                    type="button"
                    disabled={updateLoading || order.order_status === 'processing'}
                    onClick={() => handleQuickStatusUpdate('processing')}
                    className="px-3 py-2 rounded-2xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/60 text-[#5D3E85] dark:text-[#EC268F] text-[11px] font-extrabold border border-purple-200 dark:border-purple-800/50 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    Mark Processing
                  </button>

                  <button
                    type="button"
                    disabled={updateLoading || order.order_status === 'packed'}
                    onClick={() => handleQuickStatusUpdate('packed')}
                    className="px-3 py-2 rounded-2xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 text-[11px] font-extrabold border border-indigo-200 dark:border-indigo-800/50 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Package className="w-3.5 h-3.5" />
                    Mark Packed
                  </button>

                  <button
                    type="button"
                    disabled={updateLoading || order.order_status === 'ready_for_pickup'}
                    onClick={() => handleQuickStatusUpdate('ready_for_pickup')}
                    className="px-3 py-2 rounded-2xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-[11px] font-extrabold border border-amber-200 dark:border-amber-800/50 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    Ready for Pickup
                  </button>

                  <button
                    type="button"
                    disabled={updateLoading || order.order_status === 'shipped'}
                    onClick={() => handleQuickStatusUpdate('shipped')}
                    className="px-3 py-2 rounded-2xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-800 dark:text-blue-300 text-[11px] font-extrabold border border-blue-200 dark:border-blue-800/50 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    Mark Shipped
                  </button>

                  <button
                    type="button"
                    disabled={updateLoading}
                    onClick={() => handleQuickStatusUpdate('delivered', 'paid')}
                    className="px-3 py-2 rounded-2xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-extrabold border border-emerald-200 dark:border-emerald-800/50 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Mark Delivered
                  </button>
                </div>
              </div>

              {/* Detailed Status Selector Form */}
              <div className="bg-white dark:bg-[#1E1528] border border-[#EADBEE] dark:border-white/10 rounded-3xl p-6 shadow-xs flex flex-col gap-5 transition-colors">
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-[#5D3E85] dark:text-[#EC268F] border-b border-[#EADBEE] dark:border-white/10 pb-2">
                  Update Status & Dispatch Email
                </h3>

                <form onSubmit={handleUpdateSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-gray-500 dark:text-[#9B8EA9] font-extrabold uppercase">Payment Status</label>
                    <SearchableSelect
                      value={paymentStatus}
                      onChange={e => setPaymentStatus(e.target.value)}
                      className="px-3.5 py-2.5 rounded-2xl border border-gray-200 dark:border-white/15 focus:outline-none focus:border-[#5D3E85] dark:focus:border-[#EC268F] text-xs font-bold bg-white dark:bg-[#231B30] text-[#221B2B] dark:text-[#F3EFF6]"
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid (Confirm Payment)</option>
                      <option value="failed">Failed</option>
                    </SearchableSelect>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-gray-500 dark:text-[#9B8EA9] font-extrabold uppercase">Order Fulfillment Status</label>
                    <SearchableSelect
                      value={orderStatus}
                      onChange={e => setOrderStatus(e.target.value)}
                      className="px-3.5 py-2.5 rounded-2xl border border-gray-200 dark:border-white/15 focus:outline-none focus:border-[#5D3E85] dark:focus:border-[#EC268F] text-xs font-bold bg-white dark:bg-[#231B30] text-[#221B2B] dark:text-[#F3EFF6]"
                    >
                      <option value="pending_payment">Pending Payment</option>
                      <option value="paid">Paid / Awaiting Packing</option>
                      <option value="processing">Processing / Packing</option>
                      <option value="packed">Packed</option>
                      <option value="ready_for_pickup">Ready for Store Pickup</option>
                      <option value="shipped">Shipped / Dispatched</option>
                      <option value="delivered">Delivered Successfully</option>
                      <option value="cancelled">Cancelled</option>
                    </SearchableSelect>
                  </div>

                  <button
                    type="submit"
                    disabled={updateLoading}
                    className="w-full py-3 bg-[#5D3E85] hover:bg-[#EC268F] text-white text-xs font-extrabold rounded-full flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer btn-spring disabled:opacity-60"
                  >
                    {updateLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Updating & Sending Email...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>Save & Notify Customer</span>
                      </>
                    )}
                  </button>
                </form>

                {/* WhatsApp direct customer messaging */}
                <a
                  href={`https://wa.me/${formatPhoneForWhatsApp(order.customer_phone)}?text=Hello%20${encodeURIComponent(order.customer_name || 'Valued Customer')}%2C%20this%20is%20Dansolam%20Beauty%20Home%20regarding%20your%20order%20%23${order.order_number}.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full text-center inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-[#25D366]/40 hover:bg-[#25D366]/10 rounded-full text-xs font-extrabold text-[#25D366] transition-all cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 fill-[#25D366]" />
                  <span>Contact Customer via WhatsApp</span>
                </a>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}

