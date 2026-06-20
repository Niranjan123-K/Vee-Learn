import { useEffect, useCallback } from 'react';
import { create } from 'zustand';
import useChatStore from '../stores/chatStore';
import useNotificationStore from '../stores/notificationStore';

// ─── Toast Notification Store ──────────────────────────────
export const useToastStore = create((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Date.now() + Math.random();
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 5000);
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));

// ─── Session Event Listener ────────────────────────────────
export default function useSessionNotifications() {
  const socket = useChatStore((s) => s.socket);
  const addToast = useToastStore((s) => s.addToast);
  const addNotification = useNotificationStore((s) => s.addNotification);

  const handleNewSession = useCallback((data) => {
    console.log('[Session] New session notification:', data);
    addToast({
      type: 'session',
      title: 'New Session Booking',
      message: data.message,
      action: 'new',
    });
    addNotification({
      type: 'session_new',
      title: 'New Session Booking',
      message: data.message,
      session: data.session,
    });
    // Dispatch custom event so SessionsPage can re-fetch
    window.dispatchEvent(new CustomEvent('session_update', { detail: data }));
  }, [addToast, addNotification]);

  const handleSessionUpdated = useCallback((data) => {
    console.log('[Session] Session updated:', data);
    const titles = {
      confirmed: 'Session Confirmed ✓',
      completed: 'Session Completed ★',
      cancelled: 'Session Cancelled ✕',
    };
    addToast({
      type: 'session',
      title: titles[data.action] || 'Session Updated',
      message: data.message,
      action: data.action,
    });
    addNotification({
      type: `session_${data.action}`,
      title: titles[data.action] || 'Session Updated',
      message: data.message,
      session: data.session,
    });
    // Dispatch custom event so SessionsPage can re-fetch
    window.dispatchEvent(new CustomEvent('session_update', { detail: data }));
  }, [addToast, addNotification]);

  useEffect(() => {
    if (!socket) return;

    socket.on('session_new', handleNewSession);
    socket.on('session_updated', handleSessionUpdated);

    return () => {
      socket.off('session_new', handleNewSession);
      socket.off('session_updated', handleSessionUpdated);
    };
  }, [socket, handleNewSession, handleSessionUpdated]);
}
