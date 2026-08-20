import { create } from 'zustand';

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
    deliveryZone: null,
    deliveryMethod: 'delivery', // delivery or pickup
    shippingOption: 'standard', // standard, same_day, international
    shippingRates: [],
    setShippingRates: (rates) => set({ shippingRates: rates }),
    deliveryCountry: 'Nigeria',
    setDeliveryCountry: (country) => set({ deliveryCountry: country }),
    currencySymbol: '₦',
    currencyCode: 'NGN',
    setCurrency: (symbol, code) => set({ currencySymbol: symbol || '₦', currencyCode: code || 'NGN' }),
    formatPrice: (amount) => {
      const sym = get().currencySymbol || '₦';
      return sym + parseFloat(amount || 0).toLocaleString(undefined, {
        minimumFractionDigits: 0,
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
          image = 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=600';
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

    setDeliveryZone: (zone) => {
      set({ deliveryZone: zone });
    },

    setDeliveryMethod: (method) => {
      set({ deliveryMethod: method });
    },

    setShippingOption: (option) => {
      set({ shippingOption: option });
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

    getAppliedShippingRates: (settings = {}) => {
      if (get().deliveryMethod === 'pickup') {
        return [{ name: 'Storefront Boutique Pickup', amount: 0 }];
      }

      const coupon = get().coupon;
      if (coupon && coupon.type === 'free_delivery') {
        return [{ name: 'Free Delivery Coupon Applied', amount: 0 }];
      }

      const subtotal = get().getSubtotal();
      const freeThreshold = parseFloat(settings.shipping_free_threshold || 100000);
      const isFreeThresholdAchieved = freeThreshold > 0 && subtotal >= freeThreshold;

      const option = get().shippingOption || 'standard';
      const applied = [];

      // 1. Calculate Base Delivery Rate
      if (isFreeThresholdAchieved && option !== 'international') {
        applied.push({ name: 'Free Shipping (Order Threshold Reached)', amount: 0 });
      } else if (option === 'international') {
        const intlBase = parseFloat(settings.shipping_international_base || 25000);
        applied.push({ name: 'Worldwide International Courier', amount: intlBase });
      } else {
        // Domestic delivery: Use user-selected deliveryZone or matched rate or default
        const zone = get().deliveryZone;
        const activeRates = get().shippingRates || [];
        
        let baseFee = 0;
        let baseName = 'Standard Nationwide Delivery';

        if (zone && zone.shipping_fee !== undefined && zone.shipping_fee !== null) {
          baseFee = parseFloat(zone.shipping_fee) || 0;
          baseName = `Delivery Area: ${zone.name}`;
        } else if (activeRates.length > 0) {
          const custCountry = get().deliveryCountry || 'Nigeria';
          const matchedRate = activeRates.find(r => r.is_active && (r.shipping_zone_type === 'domestic' || r.shipping_zone_type === 'all'));
          if (matchedRate) {
            baseFee = parseFloat(matchedRate.rate) || 0;
            baseName = matchedRate.name;
          } else {
            baseFee = parseFloat(settings.shipping_base_domestic || 2000);
          }
        } else {
          baseFee = parseFloat(settings.shipping_base_domestic || 2000);
        }

        applied.push({
          name: baseName,
          amount: Math.round(baseFee * 100) / 100
        });
      }

      // 2. Shipping Service Priority Surcharges (Real-time reactivity)
      if (option === 'same_day') {
        const surcharge = parseFloat(settings.shipping_same_day_surcharge || 5000);
        if (surcharge > 0) {
          applied.push({
            name: '⚡ Same Day Priority Express Surcharge',
            amount: surcharge
          });
        }
      }

      // 3. Bulk items surcharge if more than 5 items
      const totalItems = get().items.reduce((sum, item) => sum + item.quantity, 0);
      if (totalItems > 5 && option !== 'international') {
        const extraItems = totalItems - 5;
        const multiplier = parseFloat(settings.shipping_item_multiplier || 1500);
        if (multiplier > 0) {
          const bulkFee = extraItems * multiplier;
          applied.push({
            name: `Bulk Order Handling (+${extraItems} items)`,
            amount: bulkFee
          });
        }
      }

      return applied;
    },

    getDeliveryFee: (settings = {}) => {
      const applied = get().getAppliedShippingRates(settings);
      return applied.reduce((sum, r) => sum + r.amount, 0);
    },

    getTotal: (settings = {}) => {
      const subtotal = get().getSubtotal();
      const discount = get().getDiscountAmount();
      const delivery = get().getDeliveryFee(settings);
      return Math.max(0, (subtotal + delivery) - discount);
    }
  };
});
