import { create } from 'zustand';

// Same rules as App\Services\ShippingCalculator: UK is the United Kingdom only;
// every other country (incl. Jersey, Guernsey, Isle of Man) is International;
// methods can target products/categories with quantity conditions.
const UK_NAMES = ['united kingdom', 'uk', 'u.k.', 'gb', 'great britain', 'britain', 'england', 'scotland', 'wales', 'northern ireland'];
export const isUkCountry = (country) => UK_NAMES.includes(String(country || '').trim().toLowerCase());

const quantityPasses = (method, quantity) => {
  const value = method.quantity_value == null ? null : Number(method.quantity_value);
  switch (method.quantity_condition || 'between') {
    case 'lt': return value == null || quantity < value;
    case 'lte': return value == null || quantity <= value;
    case 'gt': return value == null || quantity > value;
    case 'gte': return value == null || quantity >= value;
    case 'eq': return value == null || quantity === value;
    default:
      return (method.min_quantity == null || quantity >= Number(method.min_quantity))
        && (method.max_quantity == null || quantity <= Number(method.max_quantity));
  }
};

// Mirrors ShippingCalculator::matches(). `items` is the bag: [{ product_id, quantity }].
export const shippingMethodApplies = (method, country, items) => {
  const zone = method.zone || 'all';
  if (zone !== 'all' && zone !== (isUkCountry(country) ? 'uk' : 'international')) return false;

  const bag = (items || []).filter((i) => Number(i.quantity) > 0);
  const bagQuantity = bag.reduce((sum, i) => sum + Number(i.quantity), 0);
  if (bagQuantity < 1) return false;

  let quantity = bagQuantity;
  const targets = Array.isArray(method.target_product_ids) ? method.target_product_ids.map(Number) : null;
  if (targets) {
    const matching = bag.filter((i) => targets.includes(Number(i.product_id)));
    if (matching.length === 0) return false;
    if ((method.target_match || 'any') === 'all' && matching.length !== bag.length) return false;
    if ((method.quantity_basis || 'bag') === 'matching') {
      quantity = matching.reduce((sum, i) => sum + Number(i.quantity), 0);
    }
  }
  return quantityPasses(method, quantity);
};

// Mirrors ShippingCalculator::unitsCovered() / chargeFor().
export const shippingUnitsCovered = (method, items) => {
  const bag = (items || []).filter((i) => Number(i.quantity) > 0);
  const targets = Array.isArray(method.target_product_ids) ? method.target_product_ids.map(Number) : null;
  const covered = targets ? bag.filter((i) => targets.includes(Number(i.product_id))) : bag;
  return covered.reduce((sum, i) => sum + Number(i.quantity), 0);
};

export const shippingChargeFor = (method, items) => {
  const rate = parseFloat(method?.rate || 0);
  const amount = method?.charge_per_item ? rate * shippingUnitsCovered(method, items) : rate;
  return Math.round(amount * 100) / 100;
};

export const useCartStore = create((set, get) => {
  // Helper to load cart from localStorage
  const loadInitialCart = () => {
    try {
      const saved = localStorage.getItem('dansolam_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Error loading cart', e);
      return [];
    }
  };

  const saveCart = (items) => {
    try {
      localStorage.setItem('dansolam_cart', JSON.stringify(items));
    } catch (e) {
      console.error('Error saving cart', e);
    }
  };

  return {
    items: loadInitialCart(),
    coupon: null,
    // Shipping: the customer picks one of the methods that apply to their country
    // and item count; the server re-checks the choice and charges its fixed fee.
    shippingRates: [],
    shippingMethodId: null,
    setShippingMethodId: (id) => set({ shippingMethodId: id }),
    setShippingRates: (rates) => set({ shippingRates: rates }),
    deliveryCountry: 'United Kingdom',
    setDeliveryCountry: (country) => set({ deliveryCountry: country }),
    currencySymbol: '£',
    currencyCode: 'GBP',
    setCurrency: (symbol, code) => set({ currencySymbol: symbol || '£', currencyCode: code || 'GBP' }),
    formatPrice: (amount) => {
      const sym = get().currencySymbol || '£';
      const value = parseFloat(amount || 0);
      // Whole amounts stay clean (£20); anything with pence always shows two digits (£16.50).
      const decimals = Number.isInteger(Math.round(value * 100) / 100) ? 0 : 2;
      return sym + value.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: 2
      });
    },

    addItem: (product, variant = null, quantity = 1, allowOverselling = false) => {
      if (!product) return;

      const currentItems = [...get().items];
      
      // Determine if passed a pre-formatted item or DB product
      const productId = product.product_id || product.id || 'prod-' + Date.now();
      const variantId = variant ? variant.id : (product.product_variant_id || null);
      
      const rawStock = variant?.stock_quantity ?? product.stock_quantity ?? product.max_stock;
      const availableStock = typeof rawStock === 'number' && !isNaN(rawStock) ? rawStock : 999;
      
      const addQty = typeof quantity === 'number' ? quantity : (product.quantity || 1);

      const existingIndex = currentItems.findIndex(
        item => String(item.product_id) === String(productId) && String(item.product_variant_id || '') === String(variantId || '')
      );

      if (existingIndex > -1) {
        const requestedQuantity = currentItems[existingIndex].quantity + addQty;
        currentItems[existingIndex].quantity = allowOverselling
          ? requestedQuantity
          : Math.min(requestedQuantity, Math.max(1, availableStock));
      } else {
        const rawPrice = variant?.price ?? product.sale_price ?? product.price ?? 0;
        const price = typeof rawPrice === 'number' ? rawPrice : (parseFloat(rawPrice) || 0);

        let image = variant?.image_url 
          || product.image 
          || product.image_url;

        if (!image && Array.isArray(product.images) && product.images.length > 0) {
          image = product.images[0]?.image_url;
        }
        if (!image) {
          image = '/images/placeholder-product.svg';
        }

        const label = variant 
          ? `${variant.size || ''} ${variant.color ? '/ ' + variant.color : ''}`.trim()
          : (product.variant_label || 'Standard');

        currentItems.push({
          id: productId,
          product_id: productId,
          product_variant_id: variantId,
          name: product.name || 'Beauty Product',
          slug: product.slug || String(productId),
          image: image,
          variant_label: label,
          price: price,
          quantity: allowOverselling ? addQty : Math.min(addQty, Math.max(1, availableStock)),
          max_stock: availableStock,
          category_id: product.categories?.[0]?.id || product.category?.id || product.category_id || null,
          category_ids: product.categories?.map(c => c.id)
            || (product.category?.id ? [product.category.id] : (product.category_id ? [product.category_id] : [])),
        });
      }

      saveCart(currentItems);
      set({ items: currentItems });
    },

    updateQuantity: (productId, variantId, quantity, allowOverselling = false) => {
      let currentItems = [...get().items];
      const itemIndex = currentItems.findIndex(
        item => item.product_id === productId && item.product_variant_id === variantId
      );

      if (itemIndex > -1) {
        if (quantity <= 0) {
          currentItems.splice(itemIndex, 1);
        } else {
          // Check stock limit
          const maxStock = currentItems[itemIndex].max_stock;
          currentItems[itemIndex].quantity = allowOverselling ? quantity : Math.min(quantity, Math.max(1, maxStock));
        }
        saveCart(currentItems);
        set({ items: currentItems });
      }
    },

    removeItem: (productId, variantId) => {
      const currentItems = get().items.filter(
        item => !(item.product_id === productId && item.product_variant_id === variantId)
      );
      saveCart(currentItems);
      set({ items: currentItems });
    },

    clearCart: () => {
      saveCart([]);
      set({ items: [], coupon: null });
    },

    setCoupon: (coupon) => {
      set({ coupon });
    },

    getSubtotal: () => {
      return get().items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    },

    getDiscountAmount: () => {
      const subtotal = get().getSubtotal();
      const coupon = get().coupon;
      if (!coupon) return 0;

      if (coupon.type === 'percentage') {
        return (parseFloat(coupon.value) / 100) * subtotal;
      } else if (coupon.type === 'fixed_amount') {
        return parseFloat(coupon.value);
      }
      return 0;
    },

    getItemCount: () => get().items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),

    getEligibleShipping: () => {
      const country = get().deliveryCountry;
      const items = get().items;
      // Without a country we can't tell UK from International.
      if (!country || get().getItemCount() < 1) return [];
      let eligible = (get().shippingRates || [])
        .filter((method) => method.is_active !== false && shippingMethodApplies(method, country, items))
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || parseFloat(a.rate) - parseFloat(b.rate));
      // A targeted method set to replace the general ones hides them for this bag.
      if (eligible.some((m) => m.overrides_others && Array.isArray(m.target_product_ids))) {
        eligible = eligible.filter((m) => Array.isArray(m.target_product_ids));
      }
      return eligible;
    },

    // The chosen method if it still applies, else the default for this cart.
    getSelectedShipping: () => {
      const eligible = get().getEligibleShipping();
      return eligible.find((m) => m.id === get().shippingMethodId)
        || eligible.find((m) => m.is_default)
        || eligible.find((m) => !m.is_pickup)
        || eligible[0]
        || null;
    },

    getAppliedShippingRates: () => {
      const method = get().getSelectedShipping();
      if (!method) return [];
      const coupon = get().coupon;
      if (coupon && coupon.type === 'free_delivery') {
        return [{ name: `${method.name} (free with coupon)`, amount: 0 }];
      }
      return [{ name: method.name, amount: shippingChargeFor(method, get().items) }];
    },

    getDeliveryFee: () => get().getAppliedShippingRates().reduce((sum, r) => sum + r.amount, 0),

    getTotal: (settings = {}) => {
      const subtotal = get().getSubtotal();
      const discount = get().getDiscountAmount();
      const delivery = get().getDeliveryFee(settings);
      return Math.max(0, (subtotal + delivery) - discount);
    }
  };
});
