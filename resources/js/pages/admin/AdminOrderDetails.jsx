import { getCurrencySymbol } from '../../utils/currency';
import React, { useState, useEffect } from 'react';
import { toast as systemToast } from '../../components/ui/ToastProvider';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Landmark, CheckCircle, Clock, MessageCircle, FileText, Send } from 'lucide-react';
import { apiFetch } from '../../hooks/useAuth';

export default function AdminOrderDetails() {
  const currencySymbol = getCurrencySymbol();
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [orderStatus, setOrderStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);

  const generateWhatsAppReceiptLink = (order) => {
    if (!order) return '';
    const phone = (order.customer_phone || '').replace(/[^0-9]/g, '');
    
    const itemsList = (order.items || []).map(item => {
      const label = item.variant_label ? ` (${item.variant_label})` : '';
      return `• ${item.product_name}${label} x ${item.quantity} - ₦${(item.price * item.quantity).toLocaleString()}`;
    }).join('\n');

    const text = `*FAIRQUEEN COLLECTIONS RECEIPT*\n` +
      `--------------------------------\n` +
      `*Order Number:* #${order.order_number}\n` +
      `*Customer:* ${order.customer_name}\n` +
      `*Date:* ${new Date(order.created_at).toLocaleDateString()}\n` +
      `*Payment Method:* ${order.payment_method?.toUpperCase()}\n` +
      `*Payment Status:* ${order.payment_status?.toUpperCase()}\n` +
      `--------------------------------\n` +
      `*Items:*\n${itemsList}\n` +
      `--------------------------------\n` +
      `*Subtotal:* ₦${parseFloat(order.subtotal || 0).toLocaleString()}\n` +
      (order.discount_amount > 0 ? `*Discount:* - ₦${parseFloat(order.discount_amount).toLocaleString()}\n` : '') +
      `*Shipping:* ₦${parseFloat(order.delivery_fee || 0).toLocaleString()}\n` +
      (parseFloat(order.tax_amount) > 0 ? `*Taxes:* ₦${parseFloat(order.tax_amount).toLocaleString()}\n` : '') +
      `*Total Paid:* ₦${parseFloat(order.total_amount || 0).toLocaleString()}\n` +
      `--------------------------------\n` +
      `Thank you for shopping with us!`;

    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  };

  // Invoice sending states
  const [emailLoading, setEmailLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

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
      if (data.success) {
        queryClient.invalidateQueries(['admin-order-details', id]);
      } else {
        systemToast.error(data.message || 'Update failed');
      }
      setUpdateLoading(false);
    }
  });

  const handleUpdateSubmit = (e) => {
    e.preventDefault();
    setUpdateLoading(true);
    updateStatusMutation.mutate({
      order_status: orderStatus,
      payment_status: paymentStatus
    });
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
      systemToast.error(data.message);
    } catch (e) {
      systemToast.error('Error sending email: ' + e.message);
    } finally {
      setEmailLoading(false);
    }
  };

  if (isLoading) {
    return <div className="animate-pulse bg-white border rounded-xl h-96 w-full" />;
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto text-center py-24 flex flex-col items-center gap-4">
        <span className="text-4xl">🔎</span>
        <h2 className="font-bold text-gray-800 text-base">Order Not Found</h2>
        <Link to="/admin/orders" className="px-5 py-2.5 bg-primary text-white text-xs font-semibold rounded-lg">
          Return to Orders list
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Link to="/admin/orders" className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 transition-colors self-start">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Orders List
      </Link>

      {/* Header with invoice action buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-150 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="font-serif font-bold text-2xl text-gray-900">Fulfill Order #{order.order_number}</h2>
            <span className="text-xs font-bold bg-primary/10 text-primary px-3 py-0.5 rounded-full uppercase">
              {(order.order_status || 'pending').replace('_', ' ')}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">Placed on {new Date(order.created_at).toLocaleString()}</p>
        </div>

        {/* Invoice Generator */}
        <div className="flex items-center gap-2">
          <a
            href={generateWhatsAppReceiptLink(order)}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Share Receipt (WhatsApp)
          </a>
          <button
            onClick={handleDownloadInvoice}
            disabled={pdfLoading}
            className="px-3.5 py-2 border border-gray-250 hover:bg-gray-50 rounded-lg text-xs font-semibold text-gray-700 transition-all flex items-center gap-1.5"
          >
            {pdfLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
            Export PDF
          </button>
          <button
            onClick={handleSendEmailInvoice}
            disabled={emailLoading}
            className="px-3.5 py-2 bg-gray-800 hover:bg-black text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
          >
            {emailLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Email Invoice
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* Left Column: Summary and details */}
        <div className="flex-1 flex flex-col gap-6 w-full">
          
          {/* Customer info & Delivery */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col gap-3">
            <h3 className="font-bold text-gray-800 text-xs uppercase tracking-wider border-b border-gray-50 pb-2">Customer & Shipping Address</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-600">
              <div className="flex flex-col gap-2">
                <p>👤 <strong>Name:</strong> {order.customer_name}</p>
                <p>📞 <strong>Phone:</strong> {order.customer_phone}</p>
                <p>✉️ <strong>Email:</strong> {order.customer_email}</p>
              </div>
              <div className="flex flex-col gap-2">
                <p>🚚 <strong>Delivery Method:</strong> {order.delivery_method === 'pickup' ? 'Ecommerce Store Pickup (Abuja)' : 'Home Delivery'}</p>
                {order.delivery_method === 'delivery' && (
                  <p>📍 <strong>Address:</strong> {order.delivery_address}, {order.delivery_city}, {order.delivery_state}, {order.delivery_country}</p>
                )}
              </div>
            </div>
            {order.notes && (
              <div className="bg-yellow-50 border border-yellow-100 p-3 rounded-lg text-xs text-yellow-800 mt-2">
                📝 <strong>Notes:</strong> {order.notes}
              </div>
            )}
          </div>

          {/* Ordered items details */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h3 className="font-bold text-gray-800 text-xs uppercase tracking-wider border-b border-gray-50 pb-2 mb-4">Ordered Items</h3>
            <div className="flex flex-col gap-4">
              {order.items?.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-xs">
                  <div>
                    <span className="font-semibold text-gray-800 block">{item.product_name}</span>
                    {item.variant_label && (
                      <span className="text-[10px] text-gray-400 block mt-0.5">{item.variant_label} x {item.quantity}</span>
                    )}
                  </div>
                  <strong className="text-gray-900">{currencySymbol}{(item.price * item.quantity).toLocaleString()}</strong>
                </div>
              ))}
            </div>
            
            <div className="border-t border-gray-100 mt-4 pt-4 flex flex-col gap-2 text-xs text-gray-650 max-w-sm ml-auto">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold">{currencySymbol}{parseFloat(order.subtotal).toLocaleString()}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-green-605">
                  <span>Discount</span>
                  <span>- {currencySymbol}{parseFloat(order.discount_amount).toLocaleString()}</span>
                </div>
              )}
              {order.applied_shipping && order.applied_shipping.length > 0 ? (
                order.applied_shipping.map((ship, index) => (
                  <div key={index} className="flex justify-between text-gray-500">
                    <span>Shipping ({ship.name})</span>
                    <span>{currencySymbol}{parseFloat(ship.amount).toLocaleString()}</span>
                  </div>
                ))
              ) : (
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{currencySymbol}{parseFloat(order.delivery_fee).toLocaleString()}</span>
                </div>
              )}
              {parseFloat(order.tax_amount) > 0 && (
                <div className="flex justify-between text-gray-500">
                  <span>Taxes</span>
                  <span>{currencySymbol}{parseFloat(order.tax_amount).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-100 pt-2 text-sm font-bold text-gray-905">
                <span>Total Amount</span>
                <span className="text-primary font-serif">{currencySymbol}{parseFloat(order.total_amount).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Status Update Form */}
        <div className="w-full lg:w-80 shrink-0 bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col gap-5">
          <h3 className="font-bold text-gray-800 text-xs uppercase tracking-wider border-b border-gray-50 pb-2">Update Fulfillments</h3>
          
          <form onSubmit={handleUpdateSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-gray-500 font-semibold uppercase">Payment Status</label>
              <select
                value={paymentStatus}
                onChange={e => setPaymentStatus(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-700"
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid (Confirm Payment)</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-gray-500 font-semibold uppercase">Order Fulfillment Status</label>
              <select
                value={orderStatus}
                onChange={e => setOrderStatus(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-primary text-xs bg-white text-gray-700"
              >
                <option value="pending_payment">Pending Payment</option>
                <option value="paid">Paid / Awaiting Packing</option>
                <option value="processing">Processing / Packing</option>
                <option value="packed">Packed</option>
                <option value="ready_for_pickup">Ready for Store Pickup</option>
                <option value="shipped">Shipped / Dispatched</option>
                <option value="delivered">Delivered Successfully</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={updateLoading}
              className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-all"
            >
              {updateLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving Changes...
                </>
              ) : 'Update Status'}
            </button>
          </form>

          {/* Contact Customer via WhatsApp */}
          <a
            href={`https://wa.me/${(order.customer_phone || '').replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(order.customer_name || 'Guest')}%2C%20this%20is%20FairQueen%20Collections%20regarding%20your%20order%20%23${order.order_number}.`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full text-center inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 hover:bg-gray-50 rounded-lg text-xs font-semibold text-gray-750"
          >
            <MessageCircle className="w-4 h-4 text-[#25D366] fill-[#25D366]" />
            Contact Customer (WhatsApp)
          </a>
        </div>

      </div>
    </div>
  );
}
