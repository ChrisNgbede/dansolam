import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePosCartStore } from '../../../store/posCartStore';
import { apiFetch } from '../../../hooks/useAuth';
import {
  Search, UserPlus, ShoppingBag, CreditCard, DollarSign, ArrowLeft, RotateCcw,
  Trash2, Plus, Minus, Tag, Notebook, Printer, Layers, Loader2, ArrowRight,
  HelpCircle, Monitor, RefreshCw, X, FolderSymlink, CheckCircle2, ChevronRight, Check
  , WifiOff, CloudUpload
} from 'lucide-react';
import { toast } from '../../../components/ui/ToastProvider';
import { getCurrencySymbol } from '../../../utils/currency';
import { getOfflineQueue, getPosOfflineCache, makeOfflineReference, queueOfflineSale, removeOfflineSale, updateOfflineSale, updatePosOfflineCache } from '../../../utils/posOffline';

export default function PosTerminal() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currencySymbol = getCurrencySymbol();

  // Zustand Store variables
  const {
    items, customer, discountType, discountValue, discountReason, taxRate, notes,
    addItem, removeItem, updateQuantity, clearCart, setCustomer, setDiscount, setNotes, setTaxRate, loadHeldCart,
    getSubtotal, getDiscountAmount, getTaxAmount, getTotal
  } = usePosCartStore();

  // Search & Filters states
  const [productQuery, setProductQuery] = useState('');
  const [customerQuery, setCustomerQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Checkout payment states
  const [cashTendered, setCashTendered] = useState('');
  const [selectedPayments, setSelectedPayments] = useState([{ method: 'cash', amount: 0, reference: '' }]);
  const [shippingRateId, setShippingRateId] = useState('');

  // UI Modal toggles
  const [activeModal, setActiveModal] = useState(null); // 'discount', 'notes', 'customer_add', 'variant_select', 'held_carts', 'cash_movement', 'receipt', 'close_session'
  const [selectedProductForVariants, setSelectedProductForVariants] = useState(null);

  // Quick-add customer form state
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '' });

  // Cash drawer movement state
  const [cashMovement, setCashMovement] = useState({ type: 'cash_in', amount: '', reason: '' });

  // Hold cart note state
  const [holdCartNote, setHoldCartNote] = useState('');

  // Close session count state
  const [closingCash, setClosingCash] = useState('');
  const [closingNotes, setClosingNotes] = useState('');

  // Finished transaction holder for receipt
  const [lastTransaction, setLastTransaction] = useState(null);
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [queuedSales, setQueuedSales] = useState(() => getOfflineQueue());
  const [syncing, setSyncing] = useState(false);

  // POS Preloader splash screen state
  const [showPosSplash, setShowPosSplash] = useState(true);
  const [splashStep, setSplashStep] = useState(0);

  useEffect(() => {
    const step1 = setTimeout(() => setSplashStep(1), 700);
    const step2 = setTimeout(() => setSplashStep(2), 1500);
    const timer = setTimeout(() => setShowPosSplash(false), 2400);

    return () => {
      clearTimeout(step1);
      clearTimeout(step2);
      clearTimeout(timer);
    };
  }, []);

  // Search Input ref for scanner auto-focus
  const scanInputRef = useRef(null);

  // Fetch current session details
  const { data: sessionRes, isLoading: loadingSession } = useQuery({
    queryKey: ['pos-current-session'],
    queryFn: async () => {
      try {
        const res = await apiFetch('/api/pos/sessions/current');
        const data = res.ok ? await res.json() : null;
        if (data?.data) updatePosOfflineCache({ session: data });
        return data;
      } catch (error) {
        const cached = getPosOfflineCache().session;
        if (cached) return cached;
        throw error;
      }
    },
    retry: false
  });
  const currentSession = sessionRes?.data || null;

  const { data: configRes } = useQuery({
    queryKey: ['pos-configuration'],
    queryFn: async () => {
      try { const data = await apiFetch('/api/pos/configuration').then(res => res.json()); updatePosOfflineCache({ configuration: data }); return data; }
      catch (error) { const cached = getPosOfflineCache().configuration; if (cached) return cached; throw error; }
    },
  });
  const posConfig = configRes?.data || {};
  const paymentMethods = posConfig.payment_methods?.length ? posConfig.payment_methods : ['cash'];
  const shippingRates = posConfig.shipping_rates || [];
  const receiptFormat = posConfig.receipt_format || 'thermal';
  const receiptFooter = posConfig.receipt_footer !== undefined
    ? posConfig.receipt_footer
    : 'THANK YOU FOR YOUR PATRONAGE!\nAll items checked out in-store are non-refundable after tags are removed.';
  const selectedShippingRate = shippingRates.find(rate => String(rate.id) === String(shippingRateId));

  // Fetch products
  const { data: productsRes, isLoading: loadingProducts } = useQuery({
    queryKey: ['pos-products', productQuery],
    queryFn: async () => {
      try {
        const data = await apiFetch(`/api/pos/products?q=${encodeURIComponent(productQuery)}`).then(res => res.json());
        if (!productQuery) updatePosOfflineCache({ products: data });
        return data;
      } catch (error) {
        const cached = getPosOfflineCache().products;
        if (!cached) throw error;
        if (!productQuery) return cached;
        const query = productQuery.toLowerCase();
        return { ...cached, data: (cached.data || []).filter(product => `${product.name} ${product.sku || ''}`.toLowerCase().includes(query)) };
      }
    },
  });
  const products = productsRes?.data || [];

  // Fetch categories (for filter sidebar/pills)
  const { data: categoriesRes } = useQuery({
    queryKey: ['pos-categories'],
    queryFn: async () => {
      try {
        const catRes = await apiFetch('/api/categories');
        const data = await catRes.json(); updatePosOfflineCache({ categories: data }); return data;
      } catch (error) {
        const cached = getPosOfflineCache().categories; if (cached) return cached; throw error;
      }
    },
  });
  const categories = categoriesRes?.data || [];

  // Fetch customers
  const { data: customersRes } = useQuery({
    queryKey: ['pos-customers-search', customerQuery],
    queryFn: () => apiFetch(`/api/pos/customers/search?q=${encodeURIComponent(customerQuery)}`).then(res => res.json()),
    enabled: customerQuery.length > 1
  });
  const customersList = customersRes?.data || [];

  // Fetch held carts count/list
  const { data: heldCartsRes, refetch: refetchHeldCarts } = useQuery({
    queryKey: ['pos-held-carts'],
    queryFn: () => apiFetch('/api/pos/held-carts').then(res => res.json()),
    enabled: !!currentSession
  });
  const heldCarts = heldCartsRes?.data || [];

  useEffect(() => {
    const online = () => setIsOnline(true);
    const offline = () => setIsOnline(false);
    const queueChanged = () => setQueuedSales(getOfflineQueue());
    window.addEventListener('online', online); window.addEventListener('offline', offline); window.addEventListener('pos-offline-queue-changed', queueChanged);
    return () => { window.removeEventListener('online', online); window.removeEventListener('offline', offline); window.removeEventListener('pos-offline-queue-changed', queueChanged); };
  }, []);

  const syncOfflineSales = async (manual = false) => {
    if (!navigator.onLine || syncing || !getOfflineQueue().length) return;
    setSyncing(true);
    let synced = 0;
    for (const queued of getOfflineQueue()) {
      try {
        const res = await apiFetch('/api/pos/transactions', { method: 'POST', body: JSON.stringify(queued.payload) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Synchronization failed.');
        removeOfflineSale(queued.id); synced += 1;
      } catch (error) {
        updateOfflineSale(queued.id, { attempts: queued.attempts + 1, last_error: error.message });
        if (!navigator.onLine) break;
      }
    }
    setSyncing(false);
    queryClient.invalidateQueries({ queryKey: ['pos-current-session'] });
    if (synced) toast.success(`${synced} offline sale${synced === 1 ? '' : 's'} synchronized.`);
    else if (manual) toast.error('Queued sales could not be synchronized. Check the session and try again.');
  };

  useEffect(() => {
    if (!posConfig.auto_sync_enabled) return;
    if (isOnline) syncOfflineSales();
    const timer = setInterval(() => syncOfflineSales(), (posConfig.sync_interval || 30) * 1000);
    return () => clearInterval(timer);
  }, [isOnline, posConfig.auto_sync_enabled, posConfig.sync_interval]);

  // Redirect if session is missing
  useEffect(() => {
    if (loadingSession === false && !currentSession) {
      toast.error('You need an active register session to view the POS terminal.');
      navigate('/admin/pos');
    }
  }, [currentSession, loadingSession, navigate]);

  // Sync the combined exclusive POS tax rate from channel-scoped tax rules.
  useEffect(() => {
    const rate = (posConfig.taxes || [])
      .filter(tax => tax.type === 'exclusive')
      .reduce((sum, tax) => sum + (parseFloat(tax.rate) || 0), 0);
    setTaxRate(rate);
  }, [posConfig.taxes, setTaxRate]);

  // Auto focus barcode scanner input on mount
  useEffect(() => {
    if (scanInputRef.current) {
      scanInputRef.current.focus();
    }
  }, [activeModal]);

  // Barcode / SKU keydown handler (checks for SKU match when Enter is pressed by USB scanner)
  const handleBarcodeScanner = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const code = productQuery.trim();
      if (!code) return;

      // Find product matching exact SKU in loaded products
      const match = products.find(p => p.sku === code || p.variants?.some(v => v.sku === code));
      if (match) {
        if (match.has_variants) {
          const matchedVariant = match.variants.find(v => v.sku === code);
          if (matchedVariant) {
            addItem(match, matchedVariant, 1);
            toast.success(`Added ${match.name} (${matchedVariant.size || ''} ${matchedVariant.color || ''}) to cart.`);
            setProductQuery('');
          } else {
            // Open variants modal
            setSelectedProductForVariants(match);
            setActiveModal('variant_select');
          }
        } else {
          addItem(match, null, 1);
          toast.success(`Added ${match.name} to cart.`);
          setProductQuery('');
        }
      } else {
        toast.error(`SKU or Barcode "${code}" not found.`);
      }
    }
  };

  // Inline Quick Add Customer Mutation
  const addCustomerMutation = useMutation({
    mutationFn: (vars) => apiFetch('/api/pos/customers/quick-add', {
      method: 'POST',
      body: JSON.stringify(vars)
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create customer.');
      return data;
    }),
    onSuccess: (res) => {
      setCustomer(res.data);
      setNewCustomer({ name: '', email: '', phone: '' });
      setActiveModal(null);
      toast.success('Customer registered and assigned successfully.');
    },
    onError: (err) => {
      toast.error(err.message);
    }
  });

  // Cash movement float adjustment mutation
  const cashMovementMutation = useMutation({
    mutationFn: (vars) => apiFetch('/api/pos/cash-movements', {
      method: 'POST',
      body: JSON.stringify(vars)
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save cash movement.');
      return data;
    }),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['pos-current-session']);
      setCashMovement({ type: 'cash_in', amount: '', reason: '' });
      setActiveModal(null);
      toast.success('Cash drawer adjustment saved.');
    },
    onError: (err) => {
      toast.error(err.message);
    }
  });

  // Hold / park cart mutation
  const holdCartMutation = useMutation({
    mutationFn: (vars) => apiFetch('/api/pos/held-carts', {
      method: 'POST',
      body: JSON.stringify(vars)
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to park cart.');
      return data;
    }),
    onSuccess: () => {
      refetchHeldCarts();
      clearCart();
      setHoldCartNote('');
      setActiveModal(null);
      toast.success('Cart parked / held successfully.');
    },
    onError: (err) => {
      toast.error(err.message);
    }
  });

  // Checkout / Create sale mutation
  const checkoutMutation = useMutation({
    mutationFn: (vars) => apiFetch('/api/pos/transactions', {
      method: 'POST',
      body: JSON.stringify(vars)
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Checkout failed.');
      return data;
    }),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['pos-current-session']);
      setLastTransaction(res.data);
      clearCart();
      // Initialize payment inputs
      setCashTendered('');
      setSelectedPayments([{ method: 'cash', amount: 0, reference: '' }]);
      setActiveModal('receipt');
      toast.success('Sale completed successfully.');
    },
    onError: (err, payload) => {
      if (posConfig.offline_enabled && (!navigator.onLine || /fetch|network|offline/i.test(err.message))) {
        completeOfflineCheckout(payload);
      } else {
        toast.error(err.message);
      }
    }
  });

  const completeOfflineCheckout = (payload) => {
    queueOfflineSale(payload);
    const localTransaction = {
      transaction_number: payload.offline_reference,
      created_at: new Date().toISOString(),
      subtotal: getSubtotal(), discount_amount: payload.discount_amount, tax_amount: payload.tax_amount,
      total_amount: totalPayable,
      order: { order_number: payload.offline_reference, items: items.map((item, index) => ({ ...item, id: `${payload.offline_reference}-${index}` })) },
      payments: payload.payments.map((payment, index) => ({ ...payment, id: `${payload.offline_reference}-pay-${index}` })),
      offline_pending: true,
    };
    setLastTransaction(localTransaction);
    clearCart(); setCashTendered(''); setActiveModal('receipt');
    toast.success('Sale saved offline and queued for synchronization.');
  };

  // Close Register session mutation
  const closeSessionMutation = useMutation({
    mutationFn: (vars) => apiFetch('/api/pos/sessions/close', {
      method: 'POST',
      body: JSON.stringify(vars)
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to close register.');
      return data;
    }),
    onSuccess: () => {
      queryClient.setQueryData(['pos-current-session'], null);
      toast.success('Register session closed.');
      navigate('/admin/pos');
    },
    onError: (err) => {
      toast.error(err.message);
    }
  });

  // Handle category select
  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(product => product.categories?.some(category => category.id === parseInt(selectedCategory)));

  // Initialize total payable value in payment list
  const shippingAmount = selectedShippingRate
    ? (selectedShippingRate.type === 'per_item'
      ? (parseFloat(selectedShippingRate.rate) || 0) * items.reduce((sum, item) => sum + item.quantity, 0)
      : (parseFloat(selectedShippingRate.rate) || 0))
    : 0;
  const totalPayable = getTotal() + shippingAmount;
  useEffect(() => {
    const method = paymentMethods.includes(selectedPayments[0]?.method) ? selectedPayments[0].method : paymentMethods[0];
    setSelectedPayments([{ method, amount: totalPayable, reference: '' }]);
  }, [totalPayable, paymentMethods.join(',')]);

  const handleProductCardClick = (product) => {
    if (product.has_variants) {
      setSelectedProductForVariants(product);
      setActiveModal('variant_select');
    } else {
      addItem(product, null, 1);
      toast.success(`${product.name} added to cart.`);
    }
  };

  const handleResumeHeldCart = (held) => {
    apiFetch(`/api/pos/held-carts/${held.id}/resume`, { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          loadHeldCart(held);
          refetchHeldCarts();
          setActiveModal(null);
          toast.success('Cart resumed.');
        } else {
          toast.error(data.message || 'Failed to resume.');
        }
      });
  };

  const handleDeleteHeldCart = (id) => {
    apiFetch(`/api/pos/held-carts/${id}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          refetchHeldCarts();
          toast.success('Held cart discarded.');
        } else {
          toast.error(data.message);
        }
      });
  };

  const handleCheckoutSubmit = () => {
    if (items.length === 0) {
      toast.error('Cart is empty.');
      return;
    }

    const payloadPayments = selectedPayments.map(p => {
      const pays = { method: p.method, amount: parseFloat(p.amount) || 0, reference: p.reference };
      if (p.method === 'cash') {
        const tendered = parseFloat(cashTendered) || totalPayable;
        pays.tendered = tendered;
        pays.change_due = Math.max(0, tendered - totalPayable);
      }
      return pays;
    });

    const sumPayments = payloadPayments.reduce((sum, p) => sum + p.amount, 0);
    if (Math.abs(sumPayments - totalPayable) > 0.01) {
      toast.error(`Payment amount mismatch. Expected: ${currencySymbol}${totalPayable.toFixed(2)}, Tendered: ${currencySymbol}${sumPayments.toFixed(2)}`);
      return;
    }

    const payload = {
      cart_items: items,
      customer_id: customer ? customer.id : null,
      discount_amount: getDiscountAmount(),
      discount_type: discountType,
      discount_reason: discountReason || 'POS Discount',
      tax_amount: getTaxAmount(),
      shipping_rate_id: shippingRateId || null,
      notes: notes,
      payments: payloadPayments,
      offline_reference: makeOfflineReference(),
    };
    if (!navigator.onLine) {
      if (!posConfig.offline_enabled) { toast.error('Offline checkout is disabled in POS settings.'); return; }
      completeOfflineCheckout(payload);
      return;
    }
    checkoutMutation.mutate(payload);
  };

  const printReceipt = () => {
    const printContent = document.getElementById('pos-receipt-container').innerHTML;

    // Simple custom print window implementation
    const win = window.open('', '_blank');
    win.document.write(`
      <html>
        <head>
          <title>POS Receipt - ${lastTransaction?.transaction_number}</title>
          <style>
            @page { size: ${receiptFormat === 'a4' ? 'A4' : '80mm auto'}; margin: ${receiptFormat === 'a4' ? '18mm' : '5mm'}; }
            body { font-family: ${receiptFormat === 'a4' ? "Arial, sans-serif" : "'Courier New', monospace"}; font-size: ${receiptFormat === 'a4' ? '14px' : '12px'}; line-height: 1.4; color: #000; padding: 0; width: ${receiptFormat === 'a4' ? 'auto' : '70mm'}; margin: 0 auto; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .bold { font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 10px 0; }
            table { width: 100%; border-collapse: collapse; }
            th { text-align: left; }
            td { padding: 3px 0; }
            .receipt-header { margin-bottom: 15px; }
            .receipt-footer { margin-top: 20px; font-size: 10px; }
          </style>
        </head>
        <body onload="window.print();window.close();">
          ${printContent}
        </body>
      </html>
    `);
    win.document.close();
  };

  if (showPosSplash || loadingSession) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#0C0B0A] text-white flex flex-col items-center justify-center p-6 select-none overflow-hidden font-sans animate-fade-in">
        {/* Background glow effects */}
        <div className="absolute w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -top-32 -left-32 animate-pulse pointer-events-none" />
        <div className="absolute w-[500px] h-[500px] bg-amber-500/15 rounded-full blur-[120px] -bottom-32 -right-32 animate-pulse pointer-events-none" />

        {/* Central Animated POS Scanner Icon */}
        <div className="relative flex items-center justify-center mb-8">
          {/* Radar Ring 1 */}
          <div className="absolute w-36 h-36 rounded-full border border-primary/30 animate-ping pointer-events-none" />
          {/* Rotating Ring 2 */}
          <div className="absolute w-32 h-32 rounded-full border-2 border-dashed border-amber-400/40 animate-spin pointer-events-none" style={{ animationDuration: '7s' }} />

          {/* Animated SVG POS Cash Terminal Box */}
          <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-tr from-[#1C170E] via-[#2E2412] to-[#1C170E] border-2 border-primary/40 flex items-center justify-center shadow-2xl shadow-primary/30 backdrop-blur-xl">
            <svg className="w-12 h-12 text-primary animate-bounce" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="12" rx="2" />
              <path d="M7 20h10" />
              <path d="M9 16v4" />
              <path d="M15 16v4" />
              <line x1="7" y1="8" x2="17" y2="8" />
              <line x1="7" y1="12" x2="13" y2="12" />
              <circle cx="16" cy="12" r="1" fill="currentColor" />
            </svg>

          </div>
        </div>

        {/* Title & System Tag */}
        <h1 className="font-serif font-bold text-2xl md:text-3xl text-white tracking-wide mb-1 flex items-center gap-2">
          <span>POS</span>
        </h1>
        <p className="text-xs text-amber-200/80 font-semibold mb-8 tracking-widest uppercase">
          Ecommerce Point of Sale Terminal
        </p>

        {/* Dynamic Step Text */}
        <div className="flex items-center gap-2.5 text-xs font-bold text-gray-200 mb-4 h-6">
          <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
          <span>
            {splashStep === 0 && "Connecting to POS Terminal Node..."}
            {splashStep === 1 && "Verifying Security & Inventory Cache..."}
            {splashStep === 2 && "Register Ready! Launching Terminal..."}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-64 h-1.5 bg-gray-900 rounded-full overflow-hidden border border-gray-800 shadow-inner relative">
          <div
            className="h-full bg-gradient-to-r from-primary via-amber-400 to-primary transition-all duration-700 ease-out"
            style={{ width: splashStep === 0 ? '35%' : splashStep === 1 ? '75%' : '100%' }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#FAF9F6] dark:bg-gray-950 text-gray-850 dark:text-gray-100 flex flex-col overflow-hidden select-none">

      {/* 1. TOP HEADER BAR */}
      <header className="h-14 shrink-0 bg-gray-900 text-white flex items-center justify-between px-4 md:px-6 shadow-sm border-b border-gray-850">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-1.5 text-xs font-bold text-red-300 bg-red-500/10 border border-red-400/15 hover:text-red-100 hover:bg-red-500/20 hover:border-red-400/25 transition-all py-1 px-2.5 rounded-lg cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Exit POS
          </button>
          <div className="h-5 w-px bg-gray-800 hidden sm:block"></div>
          <div>
            <span className="font-bold text-xs uppercase tracking-wider text-amber-500 font-mono">POS</span>
            <span className="text-[10px] text-gray-400 block -mt-1 font-medium">{currentSession?.register_name || 'Register'} • {currentSession?.user?.name || 'Operator'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => syncOfflineSales(true)} disabled={!isOnline || syncing || queuedSales.length === 0}
            className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-[10px] font-bold ${isOnline ? 'bg-gray-800 text-gray-200' : 'bg-red-950/60 text-red-300'} disabled:opacity-70`}
            title={queuedSales.length ? 'Synchronize queued offline sales' : 'All sales synchronized'}>
            {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isOnline ? <CloudUpload className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {isOnline ? (queuedSales.length ? `${queuedSales.length} pending` : 'Synced') : `Offline${queuedSales.length ? ` · ${queuedSales.length} queued` : ''}`}
          </button>
          {/* Held Carts Badge */}
          <button
            onClick={() => setActiveModal('held_carts')}
            className="relative p-2 bg-gray-800 hover:bg-gray-750 transition-colors rounded-xl text-gray-300 hover:text-white cursor-pointer"
            title="Parked / Held Carts"
          >
            <Layers className="w-4.5 h-4.5" />
            {heldCarts.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white font-bold font-mono text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center animate-pulse">
                {heldCarts.length}
              </span>
            )}
          </button>

          {/* Cash Drawer float movement */}
          <button
            onClick={() => setActiveModal('cash_movement')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-gray-800 hover:bg-gray-750 rounded-xl transition-colors cursor-pointer text-gray-300 hover:text-white"
          >
            <DollarSign className="w-3.5 h-3.5" /> Cash Drawer
          </button>

          {/* Transaction Logs */}
          <button
            onClick={() => navigate('/admin/pos/history')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-gray-800 hover:bg-gray-750 rounded-xl transition-colors cursor-pointer text-gray-300 hover:text-white"
          >
            <Notebook className="w-3.5 h-3.5" /> Register Logs
          </button>

          {/* Close register */}
          <button
            onClick={() => {
              if (queuedSales.length) {
                toast.error(`Synchronize ${queuedSales.length} queued offline sale${queuedSales.length === 1 ? '' : 's'} before closing this register.`);
                return;
              }
              setClosingCash(currentSession?.expected_cash || '0');
              setActiveModal('close_session');
            }}
            className="px-3.5 py-1.5 text-xs font-bold bg-red-650 hover:bg-red-700 rounded-xl transition-colors cursor-pointer text-white"
          >
            Close Register
          </button>
        </div>
      </header>

      {/* MAIN CONTENT SPLIT PANELS */}
      <div className="flex-1 flex overflow-hidden">

        {/* 2. LEFT PANEL — PRODUCT GRID & CATEGORY SCROLL */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#FAF9F6] dark:bg-gray-900 border-r border-gray-200/55 dark:border-gray-800">

          {/* Products Filter bar */}
          <div className="p-3 bg-white dark:bg-gray-850 flex flex-col md:flex-row gap-2 border-b border-gray-150/70 dark:border-gray-800">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                ref={scanInputRef}
                type="text"
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
                onKeyDown={handleBarcodeScanner}
                placeholder="Search products by name, SKU or scan barcode..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-xs focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-[#FAF9F6] dark:bg-gray-900"
              />
            </div>

            {/* Quick action info */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-gray-100 dark:bg-gray-750 rounded-xl text-[10px] text-gray-500 font-semibold font-mono">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
              SCANNER READY (Press Enter after code)
            </div>
          </div>

          {/* Categories Pill Scroller */}
          <div className="px-4 py-2 shrink-0 flex gap-2 overflow-x-auto no-scrollbar bg-white dark:bg-gray-850 border-b border-gray-150/50 dark:border-gray-800">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${selectedCategory === 'all'
                ? 'bg-primary text-white shadow-3xs'
                : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-750 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id.toString())}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${selectedCategory === cat.id.toString()
                  ? 'bg-primary text-white shadow-3xs'
                  : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-750 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
                  }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Product grid list */}
          <div className="flex-1 overflow-y-auto p-4 max-h-full">
            {loadingProducts ? (
              <div className="h-full flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
                <p className="text-xs text-gray-500">Loading catalog items...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 text-gray-400">
                <ShoppingBag className="w-12 h-12 text-gray-300 mb-2" />
                <p className="text-sm font-semibold">No products found matching query</p>
                <p className="text-xs text-gray-550 dark:text-gray-400 mt-1">Try another search or change filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                {filteredProducts.map((prod) => {
                  const hasStock = prod.stock_quantity > 0 || prod.variants?.some(v => v.stock_quantity > 0);
                  const productImage = prod.images?.[0]?.image_url;
                  return (
                    <div
                      key={prod.id}
                      onClick={() => handleProductCardClick(prod)}
                      className="bg-white dark:bg-gray-800 p-2.5 rounded-xl border border-gray-150 dark:border-gray-750 hover:border-primary dark:hover:border-primary shadow-3xs hover:shadow-2xs transition-all flex flex-col justify-between cursor-pointer group relative overflow-hidden"
                    >
                      {productImage && (
                        <div className="aspect-square w-full rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900 mb-2 relative">
                          <img loading="lazy" decoding="async"
                            src={productImage}
                            alt={prod.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                          {prod.has_variants && (
                            <span className="absolute top-1.5 right-1.5 bg-gray-900/80 backdrop-blur-3xs text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                              Variants
                            </span>
                          )}
                          {!hasStock && (
                            <div className="absolute inset-0 bg-white/70 dark:bg-gray-900/70 backdrop-blur-3xs flex items-center justify-center text-[10px] font-bold text-red-600 uppercase tracking-wider">
                              Out of stock
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex-1 flex flex-col justify-between">
                        <h3 className="font-semibold text-xs leading-tight line-clamp-2 text-gray-800 dark:text-gray-200 mb-1 group-hover:text-primary dark:group-hover:text-amber-500 transition-colors">
                          {prod.name}
                        </h3>
                        {!productImage && (prod.has_variants || !hasStock) && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {prod.has_variants && <span className="bg-gray-900 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded-full uppercase">Variants</span>}
                            {!hasStock && <span className="bg-red-50 text-red-600 text-[8px] font-extrabold px-1.5 py-0.5 rounded-full uppercase">Out of stock</span>}
                          </div>
                        )}
                        <div>
                          <div className="text-[10px] text-gray-400 font-mono mb-1">{prod.sku}</div>
                          <div className="flex items-center justify-between mt-auto">
                            <span className="text-xs font-extrabold font-mono text-gray-900 dark:text-white">
                              {currencySymbol}{(prod.sale_price || prod.price).toLocaleString()}
                            </span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${prod.stock_quantity <= (prod.low_stock_threshold || 5)
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                              : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-350'
                              }`}>
                              Qty: {prod.stock_quantity}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 3. RIGHT PANEL — POS CART & CHECKOUT CONTROLS */}
        <div className="w-[380px] shrink-0 bg-white dark:bg-gray-850 flex flex-col shadow-lg border-l border-gray-200/50 dark:border-gray-800">

          {/* Assigned Customer Panel */}
          <div className="p-3 bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-150/70 dark:border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Assigned Customer</span>
              {customer ? (
                <button
                  onClick={() => setCustomer(null)}
                  className="text-[10px] font-bold text-red-500 hover:text-red-600 transition-colors"
                >
                  Detach
                </button>
              ) : (
                <button
                  onClick={() => setActiveModal('customer_add')}
                  className="flex items-center gap-1 text-[10px] font-bold text-primary dark:text-amber-500 hover:text-primary/90 transition-colors cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Quick Add
                </button>
              )}
            </div>

            {customer ? (
              <div className="bg-white dark:bg-gray-800 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs block text-gray-800 dark:text-gray-200">{customer.name}</span>
                  <span className="text-[10px] text-gray-400 block">{customer.email} • {customer.phone || 'No phone'}</span>
                </div>
                <div className="p-1 bg-emerald-100 dark:bg-emerald-950/40 rounded-full">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
              </div>
            ) : (
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={customerQuery}
                  onChange={(e) => setCustomerQuery(e.target.value)}
                  placeholder="Lookup customer by name, email, or phone..."
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-xs focus:outline-none focus:border-primary bg-white dark:bg-gray-850"
                />

                {/* Search Dropdown Results list */}
                {customerQuery.length > 1 && customersList.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
                    {customersList.map((cust) => (
                      <div
                        key={cust.id}
                        onClick={() => {
                          setCustomer(cust);
                          setCustomerQuery('');
                        }}
                        className="p-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer flex flex-col justify-between border-b border-gray-100 dark:border-gray-700 last:border-b-0 text-left"
                      >
                        <span className="font-bold text-xs text-gray-800 dark:text-gray-200">{cust.name}</span>
                        <span className="text-[10px] text-gray-400">{cust.email} • {cust.phone || 'No phone'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cart items listing */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 py-12">
                <ShoppingBag className="w-10 h-10 text-gray-300 mb-2 animate-bounce" />
                <p className="text-xs font-semibold">POS Cart is empty</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Click catalog items or scan barcode to checkout.</p>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={`${item.product_id}-${item.product_variant_id || 'none'}`}
                  className="bg-gray-50 dark:bg-gray-900 p-2.5 rounded-xl border border-gray-150/60 dark:border-gray-750 shadow-3xs flex gap-2"
                >
                  {item.image_url && (
                    <div className="w-12 h-12 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 overflow-hidden shrink-0">
                      <img loading="lazy" decoding="async" src={item.image_url} alt={item.product_name} className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0 flex flex-col justify-between text-left">
                    <div>
                      <div className="font-bold text-xs truncate text-gray-800 dark:text-gray-200">{item.product_name}</div>
                      {item.variant_label && item.variant_label !== 'Standard' && (
                        <span className="text-[9px] font-bold text-primary dark:text-amber-500 bg-amber-500/10 dark:bg-amber-900/20 px-1.5 py-0.2 rounded-full block w-fit mt-0.5">
                          {item.variant_label}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs font-mono font-bold text-gray-750 dark:text-gray-200">
                        {currencySymbol}{item.price.toLocaleString()}
                      </span>

                      {/* +/- control */}
                      <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
                        <button
                          onClick={() => updateQuantity(item.product_id, item.product_variant_id, item.quantity - 1)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2.5 text-xs font-bold font-mono text-gray-850 dark:text-gray-100">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product_id, item.product_variant_id, item.quantity + 1)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => removeItem(item.product_id, item.product_variant_id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg self-center transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Cart Pricing summary & totals */}
          <div className="p-3 bg-gray-50/50 dark:bg-gray-900/50 border-t border-gray-200/50 dark:border-gray-800 space-y-2">

            {/* Quick discount and notes settings triggers */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveModal('discount')}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 border border-gray-200 dark:border-gray-750 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <Tag className="w-3.5 h-3.5 text-gray-500" />
                {discountValue > 0 ? 'Discount Added' : 'Add Discount'}
              </button>
              <button
                onClick={() => setActiveModal('notes')}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 border border-gray-200 dark:border-gray-750 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <Notebook className="w-3.5 h-3.5 text-gray-500" />
                {notes ? 'Notes Added' : 'Operator Note'}
              </button>
            </div>

            <div className="divider border-t border-gray-150/65 dark:border-gray-800 my-1"></div>

            {/* Calculations lines */}
            <div className="space-y-1 text-xs font-medium text-gray-550 dark:text-gray-400">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono text-gray-900 dark:text-white font-bold">{currencySymbol}{getSubtotal().toLocaleString()}</span>
              </div>
              {getDiscountAmount() > 0 && (
                <div className="flex justify-between text-red-500">
                  <span>Discount ({discountType === 'percentage' ? `${discountValue}%` : 'Fixed'})</span>
                  <span className="font-mono font-bold">-{currencySymbol}{getDiscountAmount().toLocaleString()}</span>
                </div>
              )}
              {getTaxAmount() > 0 && (
                <div className="flex justify-between">
                  <span>Tax ({taxRate}%)</span>
                  <span className="font-mono text-gray-900 dark:text-white font-bold">{currencySymbol}{getTaxAmount().toLocaleString()}</span>
                </div>
              )}
              {shippingAmount > 0 && (
                <div className="flex justify-between">
                  <span>Shipping ({selectedShippingRate?.name})</span>
                  <span className="font-mono text-gray-900 dark:text-white font-bold">{currencySymbol}{shippingAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-extrabold text-gray-900 dark:text-white mt-1 pt-1 border-t border-dashed border-gray-200 dark:border-gray-700">
                <span>Total Payable</span>
                <span className="font-mono text-primary dark:text-amber-500">{currencySymbol}{totalPayable.toLocaleString()}</span>
              </div>
            </div>

            {/* Payment Method Details */}
            {items.length > 0 && (
              <div className="space-y-2 mt-3 pt-2 border-t border-gray-200/50 dark:border-gray-800">
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-[10px] font-bold text-gray-500">PAYMENT METHOD
                    <select value={selectedPayments[0]?.method || paymentMethods[0]} onChange={e => setSelectedPayments([{ method: e.target.value, amount: totalPayable, reference: '' }])}
                      className="block w-full mt-1 px-2 py-1.5 rounded-lg border border-gray-200 bg-white text-xs text-gray-800">
                      {paymentMethods.map(method => <option key={method} value={method}>{method.charAt(0).toUpperCase() + method.slice(1)}</option>)}
                    </select>
                  </label>
                  <label className="text-[10px] font-bold text-gray-500">FULFILMENT
                    <select value={shippingRateId} onChange={e => setShippingRateId(e.target.value)} className="block w-full mt-1 px-2 py-1.5 rounded-lg border border-gray-200 bg-white text-xs text-gray-800">
                      <option value="">In-store pickup</option>
                      {shippingRates.map(rate => <option key={rate.id} value={rate.id}>{rate.name}</option>)}
                    </select>
                  </label>
                </div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Tender Cash</span>
                  {cashTendered && parseFloat(cashTendered) > totalPayable && (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded-full font-mono">
                      Change Due: {currencySymbol}{(parseFloat(cashTendered) - totalPayable).toFixed(2)}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCashTendered(totalPayable.toString())}
                    className="flex-1 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 rounded-lg text-[10px] font-bold font-mono transition-colors border border-gray-200/40 dark:border-gray-700 cursor-pointer"
                  >
                    Exact cash
                  </button>
                  <button
                    onClick={() => {
                      const rounded = Math.ceil(totalPayable / 1000) * 1000;
                      setCashTendered(rounded.toString());
                    }}
                    className="flex-1 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 rounded-lg text-[10px] font-bold font-mono transition-colors border border-gray-200/40 dark:border-gray-700 cursor-pointer"
                  >
                    Round Up
                  </button>
                </div>
                <input
                  type="number"
                  placeholder="Enter Cash Tendered Amount..."
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-primary bg-white dark:bg-gray-900 font-mono"
                />
              </div>
            )}

            {/* Place sale button */}
            <div className="flex gap-2 mt-2 pt-2">
              <button
                onClick={() => {
                  setHoldCartNote('');
                  setActiveModal('hold_cart_confirm');
                }}
                disabled={items.length === 0 || holdCartMutation.isPending}
                className="px-4 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-750 transition-colors rounded-xl text-xs font-bold cursor-pointer text-gray-700 dark:text-gray-350"
              >
                Park Cart
              </button>

              <button
                onClick={handleCheckoutSubmit}
                disabled={items.length === 0 || checkoutMutation.isPending}
                className="flex-1 bg-primary hover:bg-primary/95 text-white py-3 rounded-xl text-sm font-extrabold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {checkoutMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Completing Sale...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    Complete checkout ({currencySymbol}{totalPayable.toLocaleString()})
                  </>
                )}
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4. MODALS INTERACTION SECTION */}
      {/* ========================================================================= */}
      {activeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-3xs flex items-center justify-center z-50 p-4">

          {/* Modal Backdrop closer */}
          <div className="absolute inset-0" onClick={() => setActiveModal(null)}></div>

          {/* Modal Card wrapper */}
          <div className="bg-white dark:bg-gray-850 p-6 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-xl max-w-md w-full relative z-10 text-left animate-in fade-in zoom-in-95 duration-150">

            {/* Modal Closer header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {activeModal === 'discount' && 'Add Transaction Discount'}
                {activeModal === 'notes' && 'Add Operator Note'}
                {activeModal === 'customer_add' && 'Register Walk-in Customer'}
                {activeModal === 'held_carts' && 'Parked / Held Carts'}
                {activeModal === 'cash_movement' && 'Adjust Register Cash Drawer'}
                {activeModal === 'hold_cart_confirm' && 'Park Cart Note'}
                {activeModal === 'close_session' && 'Close Register Drawer'}
                {activeModal === 'variant_select' && 'Select Product Variant'}
                {activeModal === 'receipt' && 'Transaction Completed'}
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* A. Variant selector modal */}
            {activeModal === 'variant_select' && selectedProductForVariants && (
              <div className="space-y-4">
                <div className="flex gap-3 bg-gray-50 dark:bg-gray-900 p-2 rounded-xl">
                  {selectedProductForVariants.images?.[0]?.image_url && (
                    <img loading="lazy" decoding="async"
                      src={selectedProductForVariants.images[0].image_url}
                      alt={selectedProductForVariants.name}
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                  )}
                  <div>
                    <h4 className="font-bold text-xs">{selectedProductForVariants.name}</h4>
                    <span className="text-[10px] text-gray-400">Please pick size/color variants to checkout</span>
                  </div>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {selectedProductForVariants.variants?.map((v) => {
                    const hasQty = v.stock_quantity > 0;
                    return (
                      <div
                        key={v.id}
                        onClick={() => {
                          if (hasQty) {
                            addItem(selectedProductForVariants, v, 1);
                            setActiveModal(null);
                            toast.success(`Added ${selectedProductForVariants.name} (${v.size || ''} ${v.color || ''}) to cart.`);
                          }
                        }}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${hasQty
                          ? 'border-gray-150 hover:border-primary bg-white dark:bg-gray-800 dark:border-gray-700 dark:hover:border-primary'
                          : 'border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed dark:bg-gray-900 dark:border-gray-850'
                          }`}
                      >
                        <div>
                          <span className="font-extrabold text-xs block text-gray-850 dark:text-gray-100">
                            {v.size || 'No Size'} / {v.color || 'No Color'}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono">SKU: {v.sku}</span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-bold text-xs font-mono">
                            {currencySymbol}{(v.price || selectedProductForVariants.sale_price || selectedProductForVariants.price).toLocaleString()}
                          </span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${hasQty
                            ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400'
                            : 'bg-red-50 text-red-800 dark:bg-red-950/20 dark:text-red-400'
                            }`}>
                            Stock: {v.stock_quantity}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* B. Discount Modal */}
            {activeModal === 'discount' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setDiscount('percentage', discountValue, discountReason)}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${discountType === 'percentage'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-gray-250 dark:border-gray-700'
                      }`}
                  >
                    Percentage (%)
                  </button>
                  <button
                    onClick={() => setDiscount('fixed', discountValue, discountReason)}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${discountType === 'fixed'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-gray-250 dark:border-gray-700'
                      }`}
                  >
                    Fixed Amount ({currencySymbol})
                  </button>
                </div>

                <input
                  type="number"
                  placeholder="Discount value..."
                  value={discountValue || ''}
                  onChange={(e) => setDiscount(discountType || 'percentage', e.target.value, discountReason)}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-primary text-xs bg-white dark:bg-gray-800"
                />

                <input
                  type="text"
                  placeholder="Discount reason (e.g. Birthday Special)..."
                  value={discountReason}
                  onChange={(e) => setDiscount(discountType || 'percentage', discountValue, e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-primary text-xs bg-white dark:bg-gray-800"
                />

                <button
                  onClick={() => setActiveModal(null)}
                  className="w-full py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-all cursor-pointer"
                >
                  Apply Discount
                </button>
              </div>
            )}

            {/* C. Notes Modal */}
            {activeModal === 'notes' && (
              <div className="space-y-4">
                <textarea
                  placeholder="Enter staff cashier notes for this order..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-primary text-xs bg-white dark:bg-gray-800 h-28 resize-none"
                />
                <button
                  onClick={() => setActiveModal(null)}
                  className="w-full py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-all cursor-pointer"
                >
                  Save Cashier Notes
                </button>
              </div>
            )}

            {/* D. Held carts list */}
            {activeModal === 'held_carts' && (
              <div className="space-y-3">
                {heldCarts.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Layers className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs font-semibold">No parked carts in this session</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {heldCarts.map((held) => (
                      <div
                        key={held.id}
                        className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-3 rounded-xl flex items-center justify-between"
                      >
                        <div className="text-left">
                          <span className="font-bold text-xs block text-gray-850 dark:text-gray-150">
                            {held.customer_name || 'Walk-in Customer'}
                          </span>
                          <span className="text-[10px] text-gray-400 block -mt-0.5">
                            {held.items?.length || 0} items • {held.note || 'No note'}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleResumeHeldCart(held)}
                            className="px-2.5 py-1 bg-primary text-white text-[10px] font-bold rounded-lg hover:bg-primary/95 transition-all cursor-pointer"
                          >
                            Resume
                          </button>
                          <button
                            onClick={() => handleDeleteHeldCart(held.id)}
                            className="p-1 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 dark:bg-red-950/20 dark:text-red-400 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* E. Cash movement modal */}
            {activeModal === 'cash_movement' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setCashMovement({ ...cashMovement, type: 'cash_in' })}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${cashMovement.type === 'cash_in'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-gray-250 dark:border-gray-750'
                      }`}
                  >
                    Add Cash (Float/Cash-In)
                  </button>
                  <button
                    onClick={() => setCashMovement({ ...cashMovement, type: 'cash_out' })}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${cashMovement.type === 'cash_out'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-gray-250 dark:border-gray-750'
                      }`}
                  >
                    Remove Cash (Payout/Cash-Out)
                  </button>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Amount ({currencySymbol})</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={cashMovement.amount}
                    onChange={(e) => setCashMovement({ ...cashMovement, amount: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-primary text-xs bg-white dark:bg-gray-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Reason / Description</label>
                  <input
                    type="text"
                    placeholder="e.g. Initial float, payout to supplier..."
                    value={cashMovement.reason}
                    onChange={(e) => setCashMovement({ ...cashMovement, reason: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-primary text-xs bg-white dark:bg-gray-800"
                  />
                </div>

                <button
                  onClick={() => {
                    if (!cashMovement.amount || !cashMovement.reason) {
                      toast.error('Please enter amount and reason.');
                      return;
                    }
                    cashMovementMutation.mutate({
                      type: cashMovement.type,
                      amount: parseFloat(cashMovement.amount),
                      reason: cashMovement.reason
                    });
                  }}
                  disabled={cashMovementMutation.isPending}
                  className="w-full py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {cashMovementMutation.isPending ? (
                    <>
                      <Loader2 className="w-4.5 h-4.5 animate-spin" />
                      Saving adjustment...
                    </>
                  ) : (
                    'Record Cash Movement'
                  )}
                </button>
              </div>
            )}

            {/* F. Hold / Park Cart Confirm Modal */}
            {activeModal === 'hold_cart_confirm' && (
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Customer name reference (optional)..."
                  value={holdCartNote}
                  onChange={(e) => setHoldCartNote(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-primary text-xs bg-white dark:bg-gray-800"
                />
                <button
                  onClick={() => {
                    holdCartMutation.mutate({
                      cart_items: items,
                      customer_id: customer ? customer.id : null,
                      customer_name: holdCartNote || (customer ? customer.name : 'Walk-in'),
                      note: holdCartNote || 'Parked Cart'
                    });
                  }}
                  disabled={holdCartMutation.isPending}
                  className="w-full py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {holdCartMutation.isPending ? (
                    <>
                      <Loader2 className="w-4.5 h-4.5 animate-spin" />
                      Parking cart...
                    </>
                  ) : (
                    'Confirm Park Cart'
                  )}
                </button>
              </div>
            )}

            {/* G. Customer Registration Modal */}
            {activeModal === 'customer_add' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Full Name</label>
                  <input
                    type="text"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    placeholder="e.g. Fatima Yusuf"
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-primary text-xs bg-white dark:bg-gray-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Email Address</label>
                  <input
                    type="email"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    placeholder="e.g. fatima@gmail.com"
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-primary text-xs bg-white dark:bg-gray-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    placeholder="e.g. 08012345678"
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-primary text-xs bg-white dark:bg-gray-800"
                  />
                </div>

                <button
                  onClick={() => {
                    if (!newCustomer.name || !newCustomer.email) {
                      toast.error('Name and email are required.');
                      return;
                    }
                    addCustomerMutation.mutate(newCustomer);
                  }}
                  disabled={addCustomerMutation.isPending}
                  className="w-full py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {addCustomerMutation.isPending ? (
                    <>
                      <Loader2 className="w-4.5 h-4.5 animate-spin" />
                      Creating customer...
                    </>
                  ) : (
                    'Register Customer'
                  )}
                </button>
              </div>
            )}

            {/* H. Close session drawer reconciliation modal */}
            {activeModal === 'close_session' && (
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-xl space-y-1 text-xs">
                  <div className="flex justify-between font-bold text-gray-550 dark:text-gray-400">
                    <span>Expected Cash in drawer</span>
                    <span className="font-mono text-gray-850 dark:text-gray-150">
                      {currencySymbol}{parseFloat(currentSession?.expected_cash || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Opening Float</span>
                    <span className="font-mono">{currencySymbol}{parseFloat(currentSession?.opening_cash || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cash Sales total</span>
                    <span className="font-mono">{currencySymbol}{parseFloat(currentSession?.cash_sales_total || 0).toLocaleString()}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Actual Closing Cash Counted ({currencySymbol})</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={closingCash}
                    onChange={(e) => setClosingCash(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-primary text-xs bg-white dark:bg-gray-800 font-mono"
                  />
                  {closingCash && (
                    <div className="flex justify-between items-center text-[10px] font-bold mt-1.5">
                      <span>Drawer Cash Variance:</span>
                      <span className={parseFloat(closingCash) - currentSession?.expected_cash >= 0 ? 'text-emerald-600' : 'text-red-500'}>
                        {currencySymbol}{(parseFloat(closingCash) - currentSession?.expected_cash).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Register Closing Notes</label>
                  <textarea
                    placeholder="Optional reconciliation notes..."
                    value={closingNotes}
                    onChange={(e) => setClosingNotes(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-primary text-xs bg-white dark:bg-gray-800 h-16 resize-none"
                  />
                </div>

                <button
                  onClick={() => {
                    if (!closingCash) {
                      toast.error('Please enter actual counted cash.');
                      return;
                    }
                    closeSessionMutation.mutate({
                      closing_cash: parseFloat(closingCash) || 0,
                      notes: closingNotes
                    });
                  }}
                  disabled={closeSessionMutation.isPending}
                  className="w-full py-2.5 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-750 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {closeSessionMutation.isPending ? (
                    <>
                      <Loader2 className="w-4.5 h-4.5 animate-spin" />
                      Closing session...
                    </>
                  ) : (
                    'Confirm Close Session & Reconcile'
                  )}
                </button>
              </div>
            )}

            {/* I. Receipt Thermal Printing Modal */}
            {activeModal === 'receipt' && lastTransaction && (
              <div className="space-y-4">

                {/* Visual receipt preview wrapper for thermal paper standard format */}
                <div
                  id="pos-receipt-container"
                  className={`p-4 bg-gray-50 border border-gray-200 rounded-xl max-h-96 overflow-y-auto text-[10px] leading-tight text-gray-900 text-left ${receiptFormat === 'thermal' ? 'font-mono' : 'font-sans'}`}
                >
                  <div className="text-center">
                    <h3 className="text-xs font-bold font-serif">FAIRQUEEN COLLECTIONS</h3>
                    {lastTransaction.offline_pending && <p className="text-[8px] font-bold text-amber-700">OFFLINE SALE · PENDING SYNC</p>}
                    <p className="text-[8px] text-gray-500">Premium Fashion Brand</p>
                    <p className="text-[8px] text-gray-500">Wuse II, Abuja, Nigeria</p>
                    <p className="text-[8px] text-gray-500">Tel: +234 800 FAIRQUEEN</p>
                  </div>

                  <div className="divider border-t border-dashed border-gray-400 my-2"></div>

                  <div className="space-y-0.5 text-[8px] text-gray-600">
                    <div>Receipt: <span className="font-bold">{lastTransaction.transaction_number}</span></div>
                    <div>Order Ref: <span className="font-bold">{lastTransaction.order?.order_number}</span></div>
                    <div>Date: <span className="font-bold">{new Date(lastTransaction.created_at).toLocaleString()}</span></div>
                    <div>Operator: <span className="font-bold">{currentSession?.user?.name || 'Cashier'}</span></div>
                    <div>Customer: <span className="font-bold">{lastTransaction.customer?.name || 'Walk-in'}</span></div>
                  </div>

                  <div className="divider border-t border-dashed border-gray-400 my-2"></div>

                  {/* Items list */}
                  <table className="w-full text-[8px]">
                    <thead>
                      <tr className="border-b border-dashed border-gray-400 text-left">
                        <th className="pb-1">Item</th>
                        <th className="pb-1 text-center">Qty</th>
                        <th className="pb-1 text-right">Price</th>
                        <th className="pb-1 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lastTransaction.order?.items?.map((item) => (
                        <tr key={item.id}>
                          <td className="py-1">
                            <div>{item.product_name}</div>
                            {item.variant_label && <div className="text-[7px] text-gray-500 font-sans italic">{item.variant_label}</div>}
                          </td>
                          <td className="py-1 text-center font-bold">{item.quantity}</td>
                          <td className="py-1 text-right font-mono">{currencySymbol}{parseFloat(item.price).toLocaleString()}</td>
                          <td className="py-1 text-right font-mono font-bold">{currencySymbol}{(item.price * item.quantity).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="divider border-t border-dashed border-gray-400 my-2"></div>

                  <div className="space-y-1 text-[8px]">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="font-mono">{currencySymbol}{parseFloat(lastTransaction.subtotal).toLocaleString()}</span>
                    </div>
                    {parseFloat(lastTransaction.discount_amount) > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Discount:</span>
                        <span className="font-mono">-{currencySymbol}{parseFloat(lastTransaction.discount_amount).toLocaleString()}</span>
                      </div>
                    )}
                    {parseFloat(lastTransaction.tax_amount) > 0 && (
                      <div className="flex justify-between">
                        <span>Tax:</span>
                        <span className="font-mono">{currencySymbol}{parseFloat(lastTransaction.tax_amount).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-xs pt-1 border-t border-dashed border-gray-400">
                      <span>TOTAL PAYABLE:</span>
                      <span className="font-mono">{currencySymbol}{parseFloat(lastTransaction.total_amount).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="divider border-t border-dashed border-gray-400 my-2"></div>

                  {/* Payments list */}
                  <div className="space-y-0.5 text-[8px] text-gray-700">
                    <span className="font-bold block mb-1">PAYMENTS:</span>
                    {lastTransaction.payments?.map((pay) => (
                      <div key={pay.id} className="flex justify-between">
                        <span className="capitalize">{pay.method}:</span>
                        <span className="font-mono font-bold">{currencySymbol}{parseFloat(pay.amount).toLocaleString()}</span>
                      </div>
                    ))}
                    {lastTransaction.payments?.some(p => p.method === 'cash') && (
                      <>
                        <div className="flex justify-between">
                          <span>Tendered:</span>
                          <span className="font-mono">
                            {currencySymbol}{parseFloat(lastTransaction.payments.find(p => p.method === 'cash').tendered || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-emerald-650 font-bold">
                          <span>Change Due:</span>
                          <span className="font-mono">
                            {currencySymbol}{parseFloat(lastTransaction.payments.find(p => p.method === 'cash').change_due || 0).toLocaleString()}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="divider border-t border-dashed border-gray-400 my-2"></div>

                  <div className="text-center text-[7px] text-gray-500 space-y-1">
                    {receiptFooter ? (
                      receiptFooter.split('\n').map((line, idx) => (
                        <p key={idx} className={idx === 0 ? "font-bold uppercase" : ""}>{line}</p>
                      ))
                    ) : (
                      <>
                        <p className="font-bold">THANK YOU FOR YOUR PATRONAGE!</p>
                        <p>All items checked out in-store are non-refundable after tags are removed.</p>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={printReceipt}
                    className="flex-1 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" /> Print Receipt
                  </button>
                  <button
                    onClick={() => setActiveModal(null)}
                    className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all cursor-pointer"
                  >
                    Continue Checkout
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
