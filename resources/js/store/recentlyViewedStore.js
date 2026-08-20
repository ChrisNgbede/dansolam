import { create } from 'zustand';

export const useRecentlyViewedStore = create((set, get) => {
  const loadInitialItems = () => {
    try {
      const saved = localStorage.getItem('dansolam_recently_viewed');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Error loading recently viewed items', e);
      return [];
    }
  };

  const saveItems = (items) => {
    try {
      localStorage.setItem('dansolam_recently_viewed', JSON.stringify(items));
    } catch (e) {
      console.error('Error saving recently viewed items', e);
    }
  };

  return {
    items: loadInitialItems(),

    addRecentlyViewed: (product) => {
      if (!product || !product.id) return;
      const currentItems = [...get().items];
      // Filter out existing occurrence if any
      const filtered = currentItems.filter(item => item.id !== product.id);
      // Insert to front
      const updated = [product, ...filtered].slice(0, 12);
      saveItems(updated);
      set({ items: updated });
    },

    clearRecentlyViewed: () => {
      saveItems([]);
      set({ items: [] });
    }
  };
});
