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
  MapPin,
  Undo2,
  X
} from 'lucide-react';
import { apiFetch } from '../../hooks/useAuth';
import OrderStatusPanel from '../../components/admin/OrderStatusPanel';

export default function AdminOrderDetails() {
  const currencySymbol = getCurrencySymbol();
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [updateLoading, setUpdateLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  // PayPal refund
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundNote, setRefundNote] = useState('');
  const [refundLoading, setRefundLoading] = useState(false);

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

  const openRefundModal = () => {
    setRefundAmount('');
    setRefundNote(`Refund for order #${order.order_number}`);
    setShowRefundModal(true);
  };

  const handleExecutePaypalRefund = async (e) => {
    e.preventDefault();
    setRefundLoading(true);
    try {
      const res = await apiFetch('/api/admin/paypal/refund', {
        method: 'POST',
        body: JSON.stringify({
          order_id: order.id,
          // Blank = refund the whole remaining balance.
          amount: refundAmount ? parseFloat(refundAmount) : null,
          note: refundNote
        })
      });
      const data = await res.json();
      if (data.success) {
        systemToast.success(data.message || 'PayPal refund issued successfully!');
        setShowRefundModal(false);
        queryClient.invalidateQueries(['admin-order-details', id]);
        queryClient.invalidateQueries(['admin-orders']);
      } else {
        systemToast.error(data.message || 'PayPal refund failed.');
      }
    } catch (err) {
      systemToast.error('Error executing PayPal refund.');
    } finally {
      setRefundLoading(false);
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

  const paypalPayment = (order.payments || []).find(p => p.gateway === 'paypal');
  const paypalCapture = paypalPayment?.gateway_response?.capture;
  const paypalRefunds = paypalPayment?.gateway_response?.refunds || [];
  const refundedSoFar = paypalRefunds.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
  const canRefund = order.payment_method === 'paypal' && ['paid', 'partially_refunded'].includes(order.payment_status);

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

          {/* PayPal refund */}
          {canRefund && (
            <button
              type="button"
              onClick={openRefundModal}
              className="admin-btn-secondary inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Undo2 className="w-4 h-4 text-rose-600" />
              <span>Refund</span>
            </button>
          )}
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

          <OrderStatusPanel
            order={order}
            saving={updateLoading}
            onSave={(payload) => {
              setUpdateLoading(true);
              updateStatusMutation.mutate(payload);
            }}
            whatsappHref={`https://wa.me/${formatPhoneForWhatsApp(order.customer_phone)}?text=Hello%20${encodeURIComponent(order.customer_name || 'Valued Customer')}%2C%20this%20is%20Dansolam%20Beauty%20Home%20regarding%20your%20order%20%23${order.order_number}.`}
          />
        </div>

      </div>

      {/* PAYPAL REFUND MODAL */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 md:p-6" role="dialog" aria-modal="true" aria-labelledby="refund-title">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-5 border border-gray-100">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 id="refund-title" className="font-bold text-gray-900 text-lg">Refund PayPal payment</h3>
              <button type="button" onClick={() => setShowRefundModal(false)} aria-label="Close" className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <dl className="bg-gray-50 border border-gray-150 rounded-xl p-3.5 text-sm text-gray-700 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
              <dt>Order</dt>
              <dd className="text-right font-semibold text-gray-900">#{order.order_number}</dd>
              <dt>Order total</dt>
              <dd className="text-right font-semibold text-gray-900">{currencySymbol}{parseFloat(order.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</dd>
              {paypalCapture && (
                <>
                  <dt>Captured by PayPal</dt>
                  <dd className="text-right">{paypalCapture.currency} {parseFloat(paypalCapture.amount).toFixed(2)}</dd>
                </>
              )}
              {paypalRefunds.length > 0 && (
                <>
                  <dt>Already refunded</dt>
                  <dd className="text-right">{paypalCapture?.currency} {refundedSoFar.toFixed(2)}</dd>
                </>
              )}
              <dt>Customer</dt>
              <dd className="text-right truncate">{order.customer_name}</dd>
            </dl>

            {paypalRefunds.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <h4 className="font-bold text-gray-900 text-sm">Earlier refunds</h4>
                <ul className="flex flex-col gap-1 text-xs text-gray-600">
                  {paypalRefunds.map((r, i) => (
                    <li key={r.id || i} className="flex justify-between gap-3">
                      <span>{r.at ? new Date(r.at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}{r.note ? ` · ${r.note}` : ''}</span>
                      <span className="font-semibold text-gray-900 shrink-0">{paypalCapture?.currency} {parseFloat(r.amount).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <form onSubmit={handleExecutePaypalRefund} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="refund-amount" className="text-[10px] text-gray-500 font-bold uppercase">Refund amount ({currencySymbol})</label>
                <input
                  id="refund-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={order.total_amount}
                  value={refundAmount}
                  onChange={e => setRefundAmount(e.target.value)}
                  placeholder="Full remaining balance"
                  className="px-3.5 py-2 rounded-xl border border-gray-200 text-sm bg-white text-gray-900"
                />
                <span className="text-xs text-gray-500">Leave blank to refund everything not yet refunded, or enter a smaller amount for a partial refund.</span>
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="refund-note" className="text-[10px] text-gray-500 font-bold uppercase">Reason / note to payer</label>
                <input
                  id="refund-note"
                  type="text"
                  maxLength={255}
                  value={refundNote}
                  onChange={e => setRefundNote(e.target.value)}
                  placeholder="Reason for refund..."
                  className="px-3.5 py-2 rounded-xl border border-gray-200 text-sm bg-white"
                />
              </div>

              <div className="flex justify-end gap-2.5 border-t border-gray-100 pt-4 mt-1">
                <button type="button" onClick={() => setShowRefundModal(false)} className="admin-btn-secondary cursor-pointer">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={refundLoading}
                  className="bg-red-600 text-white inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {refundLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Refunding…
                    </>
                  ) : 'Refund via PayPal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

