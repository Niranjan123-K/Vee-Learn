import { create } from 'zustand';

const useNotificationStore = create((set, get) => ({
  notifications: [],
  
  addNotification: (notification) => {
    const id = Date.now() + Math.random();
    const newNotif = {
      ...notification,
      id,
      read: false,
      timestamp: new Date().toISOString(),
    };
    set((state) => ({
      notifications: [newNotif, ...state.notifications].slice(0, 50), // keep last 50
    }));
  },

  markAllRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }));
  },

  markRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));
  },

  clearAll: () => set({ notifications: [] }),

  get unreadCount() {
    return get().notifications.filter((n) => !n.read).length;
  },
}));

export default useNotificationStore;
