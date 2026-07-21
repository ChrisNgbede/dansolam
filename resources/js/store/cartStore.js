import { create } from 'zustand';

export const useCartStore = create((set, get) => {
  // Helper to load cart from localStorage
  const loadInitialCart = () => {
    try {
      const saved = localStorage.getItem('fairqueen_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Error loading cart', e);
      return [];
    }
  };

  const saveCart = (items) => {
    try {
      localStorage.setItem('fairqueen_cart', JSON.stringify(items));
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
      const currentItems = [...get().items];
      const variantId = variant ? variant.id : null;
      const availableStock = variant ? variant.stock_quantity : product.stock_quantity;
      
      const existingIndex = currentItems.findIndex(
        item => item.product_id === product.id && item.product_variant_id === variantId
      );

      if (existingIndex > -1) {
        const requestedQuantity = currentItems[existingIndex].quantity + quantity;
        currentItems[existingIndex].quantity = allowOverselling
          ? requestedQuantity
          : Math.min(requestedQuantity, Math.max(1, availableStock));
      } else {
        const price = variant && variant.price ? variant.price : (product.sale_price || product.price);
        const label = variant ? `${variant.size} / ${variant.color}` : 'Standard';
        
        currentItems.push({
          product_id: product.id,
          product_variant_id: variantId,
          name: product.name,
          slug: product.slug,
          image: variant && variant.image_url ? variant.image_url : (product.images[0]?.image_url || '/images/products/placeholder.jpg'),
          variant_label: label,
          price: parseFloat(price),
          quantity: allowOverselling ? quantity : Math.min(quantity, Math.max(1, availableStock)),
          max_stock: variant ? variant.stock_quantity : product.stock_quantity,
          category_id: product.categories?.[0]?.id || product.category?.id || product.category_id || null,
          category_ids: product.categories?.map(category => category.id)
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
        return [{ name: 'Ecommerce Store Pickup', amount: 0 }];
      }

      const coupon = get().coupon;
      if (coupon && coupon.type === 'free_delivery') {
        return [{ name: 'Free Delivery Coupon Applied', amount: 0 }];
      }

      const subtotal = get().getSubtotal();
      const activeRates = get().shippingRates || [];

      if (activeRates.length > 0) {
        const applied = [];
        const cartItems = get().items;

        activeRates.forEach(rate => {
          let applies = false;
          let matchingQuantity = 0;
          let matchingWeight = 0;
          let matchingVolume = 0;
          let hasFragile = false;

          if (rate.applicability === 'global') {
            applies = true;
            cartItems.forEach(item => {
              matchingQuantity += item.quantity;
              matchingWeight += (parseFloat(item.weight) || 0) * item.quantity;
              const vol = (parseFloat(item.width) || 0) * (parseFloat(item.height) || 0) * (parseFloat(item.depth) || 0);
              matchingVolume += vol * item.quantity;
              if (item.is_fragile) hasFragile = true;
            });
          } else if (rate.applicability === 'products') {
            const allowedProductIds = rate.products ? rate.products.map(p => p.id) : [];
            cartItems.forEach(item => {
              if (allowedProductIds.includes(item.product_id)) {
                applies = true;
                matchingQuantity += item.quantity;
                matchingWeight += (parseFloat(item.weight) || 0) * item.quantity;
                const vol = (parseFloat(item.width) || 0) * (parseFloat(item.height) || 0) * (parseFloat(item.depth) || 0);
                matchingVolume += vol * item.quantity;
                if (item.is_fragile) hasFragile = true;
              }
            });
          } else if (rate.applicability === 'categories') {
            const allowedCategoryIds = rate.categories ? rate.categories.map(c => c.id) : [];
            cartItems.forEach(item => {
              const itemCategoryIds = item.category_ids?.length
                ? item.category_ids
                : (item.category_id ? [item.category_id] : []);
              if (itemCategoryIds.some(categoryId => allowedCategoryIds.includes(categoryId))) {
                applies = true;
                matchingQuantity += item.quantity;
                matchingWeight += (parseFloat(item.weight) || 0) * item.quantity;
                const vol = (parseFloat(item.width) || 0) * (parseFloat(item.height) || 0) * (parseFloat(item.depth) || 0);
                matchingVolume += vol * item.quantity;
                if (item.is_fragile) hasFragile = true;
              }
            });
          }

          if (applies) {
            // Location country scope filter
            const custCountry = get().deliveryCountry || 'Nigeria';
            const custState = get().deliveryState || '';
            const zoneType = rate.shipping_zone_type || 'all';
            const domesticCountry = settings.system_domestic_country || 'Nigeria';

            if (zoneType === 'domestic') {
              if (custCountry.toLowerCase() !== domesticCountry.toLowerCase()) return;
            } else if (zoneType === 'international') {
              if (custCountry.toLowerCase() === domesticCountry.toLowerCase()) return;
            } else if (zoneType === 'specific_countries') {
              const allowed = rate.shipping_countries || [];
              const matched = allowed.some(loc => 
                loc.toLowerCase() === custCountry.toLowerCase() || 
                (custState && loc.toLowerCase() === custState.toLowerCase())
              );
              if (!matched) return;
            }

            // Attribute-based filtering
            if (rate.only_fragile && !hasFragile) return;
            if (rate.min_weight != null && matchingWeight < parseFloat(rate.min_weight)) return;
            if (rate.max_weight != null && matchingWeight > parseFloat(rate.max_weight)) return;
            if (rate.min_volume != null && matchingVolume < parseFloat(rate.min_volume)) return;
            if (rate.max_volume != null && matchingVolume > parseFloat(rate.max_volume)) return;

            let fee = 0;
            const calcMethod = rate.calculation_method || 'flat';

            if (calcMethod === 'flat') {
              fee = parseFloat(rate.rate);
            } else if (calcMethod === 'per_item') {
              fee = parseFloat(rate.rate) * matchingQuantity;
            } else if (calcMethod === 'per_kg') {
              fee = parseFloat(rate.rate) * matchingWeight;
            } else if (calcMethod === 'per_volume') {
              fee = parseFloat(rate.rate) * (matchingVolume / 1000);
            }

            if (fee > 0) {
              applied.push({
                name: rate.name,
                amount: Math.round(fee * 100) / 100
              });
            }
          }
        });
        return applied;
      } else {
        // Fallback to classic settings-based calculation
        const applied = [];
        const freeThreshold = parseFloat(settings.shipping_free_threshold || 100000);
        
        if (freeThreshold > 0 && subtotal >= freeThreshold) {
          return [{ name: 'Free Shipping (Promotion Threshold Achieved)', amount: 0 }];
        }

        const option = get().shippingOption;
        let baseFee = 0;

        if (option === 'international') {
          baseFee = parseFloat(settings.shipping_international_base || 25000);
          applied.push({ name: 'International Delivery Base Fee', amount: baseFee });
        } else {
          const zone = get().deliveryZone;
          const zoneFee = zone ? parseFloat(zone.shipping_fee) : parseFloat(settings.shipping_base_domestic || 2000);
          baseFee = zoneFee;
          applied.push({ name: zone ? `Delivery Zone: ${zone.name}` : 'Domestic Delivery Base Fee', amount: zoneFee });
          
          if (option === 'same_day') {
            const surcharge = parseFloat(settings.shipping_same_day_surcharge || 5000);
            baseFee += surcharge;
            applied.push({ name: 'Same-Day Express Surcharge', amount: surcharge });
          }
        }

        // Add surcharge if items count is more than 5
        const totalItems = get().items.reduce((sum, item) => sum + item.quantity, 0);
        if (totalItems > 5) {
          const extraItems = totalItems - 5;
          const multiplier = parseFloat(settings.shipping_item_multiplier || 1500);
          const bulkFee = extraItems * multiplier;
          applied.push({ name: 'Bulk Order Items Surcharge', amount: bulkFee });
        }

        return applied;
      }
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
