import { create } from 'zustand';
import { io as socketIO } from 'socket.io-client';
import api from '../utils/api';

// Singleton socket reference — survives store re-creation
let _socket = null;

const useChatStore = create((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: [],
  socket: null,
  onlineUsers: new Set(),
  typingUsers: {},
  unreadCount: 0,

  connectSocket: () => {
    // If socket already exists and is connected or connecting, skip
    if (_socket && (_socket.connected || _socket.connecting)) {
      // Make sure the store reference is up to date
      if (!get().socket) set({ socket: _socket });
      return;
    }

    // Clean up any stale socket
    if (_socket) {
      _socket.removeAllListeners();
      _socket.disconnect();
      _socket = null;
    }

    const serverUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:5001';

    const socket = socketIO(serverUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    _socket = socket;

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
    });

    // ── Chat messages ─────────────────────────────────
    socket.on('new_message', (message) => {
      set((state) => ({ messages: [...state.messages, message] }));
      get().updateUnreadCount();
    });

    socket.on('typing', ({ userId, name }) => {
      set((state) => ({
        typingUsers: { ...state.typingUsers, [userId]: name },
      }));
      setTimeout(() => {
        set((state) => {
          const updated = { ...state.typingUsers };
          delete updated[userId];
          return { typingUsers: updated };
        });
      }, 3000);
    });

    socket.on('messages_read', ({ readBy }) => {
      set((state) => ({
        messages: state.messages.map((m) => ({ ...m, is_read: true })),
      }));
    });

    set({ socket });
  },

  disconnectSocket: () => {
    if (_socket) {
      _socket.removeAllListeners();
      _socket.disconnect();
      _socket = null;
    }
    set({ socket: null });
  },

  loadConversations: async () => {
    try {
      const res = await api.get('/messages/conversations');
      const conversations = res.data.conversations || res.data || [];
      set({ conversations });
      get().updateUnreadCount();
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  },

  loadMessages: async (userId) => {
    try {
      const res = await api.get(`/messages/conversation/${userId}`);
      set({ messages: res.data.messages || res.data || [] });
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  },

  sendMessage: (receiverId, content) => {
    const socket = _socket;
    if (!socket?.connected) {
      console.error('[Socket] Not connected, cannot send message');
      return;
    }
    socket.emit('send_message', { receiverId, content }, (response) => {
      if (response?.success && response.message) {
        set((state) => ({ messages: [...state.messages, response.message] }));
      } else {
        console.error('[Socket] send_message failed:', response?.error);
      }
    });
  },

  setActiveConversation: (conversation) => {
    set({ activeConversation: conversation, messages: [] });
  },

  markAsRead: (senderId) => {
    const socket = _socket;
    if (socket?.connected && senderId) {
      socket.emit('mark_read', { senderId });
    }
  },

  emitTyping: (receiverId) => {
    const socket = _socket;
    if (socket?.connected) {
      socket.emit('typing', { receiverId });
    }
  },

  updateUnreadCount: () => {
    const { conversations } = get();
    const count = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
    set({ unreadCount: count });
  },
}));

export default useChatStore;
