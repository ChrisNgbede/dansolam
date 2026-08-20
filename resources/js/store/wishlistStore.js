import { create } from 'zustand';

export const useWishlistStore = create((set, get) => {
  // Helper to load wishlist from localStorage
  const loadInitialWishlist = () => {
    try {
      const saved = localStorage.getItem('dansolam_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Error loading wishlist', e);
      return [];
    }
  };

  const saveWishlist = (items) => {
    try {
      localStorage.setItem('dansolam_wishlist', JSON.stringify(items));
    } catch (e) {
      console.error('Error saving wishlist', e);
    }
  };

  return {
    items: loadInitialWishlist(),

    toggleItem: (product) => {
      const currentItems = [...get().items];
      const existingIndex = currentItems.findIndex(item => item.id === product.id);

      if (existingIndex > -1) {
        currentItems.splice(existingIndex, 1);
      } else {
        currentItems.push(product);
      }

      saveWishlist(currentItems);
      set({ items: currentItems });
    },

    removeItem: (productId) => {
      const currentItems = get().items.filter(item => item.id !== productId);
      saveWishlist(currentItems);
      set({ items: currentItems });
    },

    hasItem: (productId) => {
      return get().items.some(item => item.id === productId);
    },

    clearWishlist: () => {
      saveWishlist([]);
      set({ items: [] });
    }
  };
});
