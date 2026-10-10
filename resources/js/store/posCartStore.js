import { create } from 'zustand';

export const usePosCartStore = create((set, get) => {
  return {
    items: [],
    customer: null,
    discountType: null, // 'percentage', 'fixed'
    discountValue: 0,
    discountReason: '',
    taxRate: 0, // e.g. 7.5 for 7.5%
    notes: '',

    setCustomer: (customer) => set({ customer }),
    
    setDiscount: (type, value, reason = '') => set({
      discountType: type,
      discountValue: parseFloat(value) || 0,
      discountReason: reason
    }),

    setTaxRate: (rate) => set({ taxRate: parseFloat(rate) || 0 }),
    setNotes: (notes) => set({ notes }),

    addItem: (product, variant = null, quantity = 1) => {
      const currentItems = [...get().items];
      const variantId = variant ? variant.id : null;
      const existingIndex = currentItems.findIndex(
        item => item.product_id === product.id && item.product_variant_id === variantId
      );

      const maxStock = variant ? variant.stock_quantity : product.stock_quantity;
      const price = variant && variant.price ? variant.price : (product.sale_price || product.price);
      
      let label = '';
      if (variant) {
        if (variant.size) label += `Size: ${variant.size} `;
        if (variant.color) label += `Color: ${variant.color}`;
        label = label.trim();
      } else {
        label = 'Standard';
      }

      if (existingIndex > -1) {
        const nextQty = currentItems[existingIndex].quantity + quantity;
        currentItems[existingIndex].quantity = Math.max(1, nextQty); // Allow overselling in POS if needed, but safe math.min option: Math.min(nextQty, Math.max(1, maxStock))
      } else {
        currentItems.push({
          product_id: product.id,
          product_variant_id: variantId,
          product_name: product.name,
          variant_label: label,
          price: parseFloat(price),
          quantity: quantity,
          max_stock: maxStock,
          image_url: variant && variant.image_url ? variant.image_url : (product.images?.[0]?.image_url || '/images/placeholder-product.svg'),
        });
      }

      set({ items: currentItems });
    },

    updateQuantity: (productId, variantId, quantity) => {
      const currentItems = [...get().items];
      const index = currentItems.findIndex(
        item => item.product_id === productId && item.product_variant_id === variantId
      );

      if (index > -1) {
        if (quantity <= 0) {
          currentItems.splice(index, 1);
        } else {
          currentItems[index].quantity = quantity;
        }
        set({ items: currentItems });
      }
    },

    removeItem: (productId, variantId) => {
      const currentItems = get().items.filter(
        item => !(item.product_id === productId && item.product_variant_id === variantId)
      );
      set({ items: currentItems });
    },

    clearCart: () => set({
      items: [],
      customer: null,
      discountType: null,
      discountValue: 0,
      discountReason: '',
      notes: ''
    }),

    loadHeldCart: (heldCart) => {
      const parsedItems = heldCart.items.map(item => ({
        product_id: item.product_id,
        product_variant_id: item.product_variant_id,
        product_name: item.product_name,
        variant_label: item.variant_label,
        price: parseFloat(item.price),
        quantity: item.quantity,
        max_stock: item.variant ? item.variant.stock_quantity : (item.product ? item.product.stock_quantity : 999),
        image_url: item.variant && item.variant.image_url ? item.variant.image_url : (item.product?.images?.[0]?.image_url || '/images/placeholder-product.svg'),
      }));

      set({
        items: parsedItems,
        customer: heldCart.customer || null,
        discountType: null,
        discountValue: 0,
        discountReason: '',
        notes: heldCart.note || ''
      });
    },

    // Computations
    getSubtotal: () => {
      return get().items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    },

    getDiscountAmount: () => {
      const subtotal = get().getSubtotal();
      const type = get().discountType;
      const val = get().discountValue;

      if (!type || val <= 0) return 0;
      if (type === 'percentage') {
        return (subtotal * val) / 100;
      }
      return val;
    },

    getTaxAmount: () => {
      const subtotal = get().getSubtotal();
      const discount = get().getDiscountAmount();
      const taxable = Math.max(0, subtotal - discount);
      return (taxable * get().taxRate) / 100;
    },

    getTotal: () => {
      const subtotal = get().getSubtotal();
      const discount = get().getDiscountAmount();
      const tax = get().getTaxAmount();
      return Math.max(0, subtotal - discount + tax);
    }
  };
});
