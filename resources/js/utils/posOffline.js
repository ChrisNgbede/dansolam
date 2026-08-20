const QUEUE_KEY = 'dansolam_pos_offline_queue_v1';
const CACHE_KEY = 'dansolam_pos_offline_cache_v1';

const readJson = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key) || '') || fallback; } catch { return fallback; }
};

export const getOfflineQueue = () => readJson(QUEUE_KEY, []);
export const saveOfflineQueue = (queue) => localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
export const queueOfflineSale = (payload) => {
  const item = {
    id: payload.offline_reference,
    payload,
    queued_at: new Date().toISOString(),
    attempts: 0,
    last_error: null,
  };
  const queue = [...getOfflineQueue(), item];
  saveOfflineQueue(queue);
  window.dispatchEvent(new CustomEvent('pos-offline-queue-changed'));
  return item;
};
export const removeOfflineSale = (id) => {
  saveOfflineQueue(getOfflineQueue().filter(item => item.id !== id));
  window.dispatchEvent(new CustomEvent('pos-offline-queue-changed'));
};
export const updateOfflineSale = (id, changes) => {
  saveOfflineQueue(getOfflineQueue().map(item => item.id === id ? { ...item, ...changes } : item));
  window.dispatchEvent(new CustomEvent('pos-offline-queue-changed'));
};

export const getPosOfflineCache = () => readJson(CACHE_KEY, {});
export const updatePosOfflineCache = (changes) => localStorage.setItem(CACHE_KEY, JSON.stringify({
  ...getPosOfflineCache(), ...changes, cached_at: new Date().toISOString(),
}));

export const makeOfflineReference = () => `OFF-${Date.now()}-${crypto.randomUUID?.() || Math.random().toString(36).slice(2)}`;
