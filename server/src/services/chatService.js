// ─── Chat Service (Socket.io) ───────────────────────────────
// Handles real-time messaging over WebSocket.
// Authenticates connections via JWT and persists messages to
// the database so they survive reconnects.
// ─────────────────────────────────────────────────────────────

import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import cookie from 'cookie';

/**
 * Initialise Socket.io event handlers on the given `io` instance.
 * Call once at server startup.
 *
 * @param {import('socket.io').Server} io
 */
export function initChatService(io) {
  // ── Authenticate on handshake ────────────────────────────
  io.use((socket, next) => {
    try {
      const cookies = cookie.parse(socket.request.headers.cookie || '');
      const token = cookies.token;
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = { id: decoded.id, email: decoded.email, name: decoded.name };
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;

    // Join user to their personal room (user:<uuid>)
    socket.join(`user:${userId}`);
    console.log(`[WS] ${socket.user.name} connected (${userId})`);

    // ── send_message ───────────────────────────────────────
    socket.on('send_message', async (data, ack) => {
      try {
        const { receiverId, content } = data;
        if (!receiverId || !content) {
          return ack?.({ error: 'receiverId and content are required' });
        }

        // Persist the message
        const { rows: [message] } = await query(
          `INSERT INTO messages (sender_id, receiver_id, content)
           VALUES ($1, $2, $3) RETURNING *`,
          [userId, receiverId, content],
        );

        // Upsert the conversation (normalise user order for the unique constraint)
        const [u1, u2] = [userId, receiverId].sort();
        await query(
          `INSERT INTO conversations (user1_id, user2_id, last_message_at)
           VALUES ($1, $2, NOW())
           ON CONFLICT (user1_id, user2_id)
           DO UPDATE SET last_message_at = NOW()`,
          [u1, u2],
        );

        // Emit to the receiver's room
        io.to(`user:${receiverId}`).emit('new_message', {
          ...message,
          sender_name: socket.user.name,
        });

        ack?.({ success: true, message });
      } catch (err) {
        console.error('[WS] send_message error:', err.message);
        ack?.({ error: 'Failed to send message' });
      }
    });

    // ── typing indicator ───────────────────────────────────
    socket.on('typing', ({ receiverId }) => {
      io.to(`user:${receiverId}`).emit('typing', {
        userId,
        name: socket.user.name,
      });
    });

    // ── mark_read ──────────────────────────────────────────
    socket.on('mark_read', async ({ senderId }, ack) => {
      try {
        await query(
          `UPDATE messages SET is_read = TRUE
           WHERE sender_id = $1 AND receiver_id = $2 AND is_read = FALSE`,
          [senderId, userId],
        );

        // Notify the original sender so their UI can update read receipts
        io.to(`user:${senderId}`).emit('messages_read', { readBy: userId });
        ack?.({ success: true });
      } catch (err) {
        console.error('[WS] mark_read error:', err.message);
        ack?.({ error: 'Failed to mark messages as read' });
      }
    });

    // ── join_session ───────────────────────────────────────
    socket.on('join_session', ({ sessionId }, ack) => {
      if (!sessionId) return ack?.({ error: 'sessionId required' });
      const roomName = `session_${sessionId}`;
      socket.join(roomName);
      console.log(`[WS] ${socket.user.name} joined room ${roomName}`);
      ack?.({ success: true });
    });

    // ── send_session_message ───────────────────────────────
    socket.on('send_session_message', async ({ sessionId, text }, ack) => {
      try {
        if (!sessionId || !text) {
          return ack?.({ error: 'sessionId and text are required' });
        }

        // Persist to database
        const { rows: [message] } = await query(
          `INSERT INTO session_messages (session_id, sender_id, content)
           VALUES ($1, $2, $3) RETURNING *`,
          [sessionId, userId, text]
        );

        const messageData = {
          id: message.id,
          sessionId,
          senderId: userId,
          text: message.content,
          timestamp: message.created_at,
          senderName: socket.user.name
        };

        // Broadcast to everyone in the room (including sender, or sender can rely on ack)
        // We broadcast to the room, so the sender's UI can also catch it if they want, 
        // but typically they do an optimistic update.
        io.to(`session_${sessionId}`).emit('new_session_message', messageData);

        ack?.({ success: true, message: messageData });
      } catch (err) {
        console.error('[WS] send_session_message error:', err.message);
        ack?.({ error: 'Failed to send session message' });
      }
    });

    // ── typing_session ─────────────────────────────────────
    socket.on('typing_session', ({ sessionId }) => {
      // Broadcast to others in the room using volatile (no guarantee, no DB, fast)
      socket.to(`session_${sessionId}`).volatile.emit('typing_session', { userId });
    });

    // ── disconnect ─────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`[WS] ${socket.user.name} disconnected`);
    });
  });
}
