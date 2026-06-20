// ─── Message Controller ─────────────────────────────────────
import { query } from '../config/db.js';
import { isValidUUID, isNonEmpty } from '../middleware/validate.js';

/**
 * GET /api/messages/conversations  (protected)
 * List the authenticated user's conversations sorted by last_message_at.
 */
export async function getConversations(req, res) {
  try {
    const userId = req.user.id;

    const { rows } = await query(
      `SELECT c.*,
        u1.name AS user1_name, u1.avatar_url AS user1_avatar,
        u2.name AS user2_name, u2.avatar_url AS user2_avatar,
        (SELECT COUNT(*)::INT FROM messages m
         WHERE m.receiver_id = $1 AND m.is_read = FALSE
           AND (m.sender_id = c.user1_id OR m.sender_id = c.user2_id)
        ) AS unread_count,
        (SELECT content FROM messages m2
         WHERE ((m2.sender_id = c.user1_id AND m2.receiver_id = c.user2_id)
             OR (m2.sender_id = c.user2_id AND m2.receiver_id = c.user1_id))
         ORDER BY m2.created_at DESC LIMIT 1
        ) AS last_message
      FROM conversations c
      JOIN users u1 ON u1.id = c.user1_id
      JOIN users u2 ON u2.id = c.user2_id
      WHERE c.user1_id = $1 OR c.user2_id = $1
      ORDER BY c.last_message_at DESC`,
      [userId],
    );

    return res.json({ conversations: rows });
  } catch (err) {
    console.error('[Message] getConversations error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch conversations.' });
  }
}

/**
 * GET /api/messages/conversation/:userId  (protected)
 * Get messages between the auth user and the given userId, paginated.
 */
export async function getMessages(req, res) {
  try {
    const myId = req.user.id;
    const { userId } = req.params;

    if (!isValidUUID(userId)) {
      return res.status(400).json({ error: 'Invalid user ID.' });
    }

    const { page = 1, limit = 50 } = req.query;
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);

    const { rows } = await query(
      `SELECT m.*, u.name AS sender_name, u.avatar_url AS sender_avatar
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE (m.sender_id = $1 AND m.receiver_id = $2)
          OR (m.sender_id = $2 AND m.receiver_id = $1)
       ORDER BY m.created_at ASC
       LIMIT $3 OFFSET $4`,
      [myId, userId, parseInt(limit, 10), offset],
    );

    const { rows: [countRow] } = await query(
      `SELECT COUNT(*)::INT AS total FROM messages
       WHERE (sender_id = $1 AND receiver_id = $2)
          OR (sender_id = $2 AND receiver_id = $1)`,
      [myId, userId],
    );

    return res.json({
      messages: rows,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total: countRow.total,
      },
    });
  } catch (err) {
    console.error('[Message] getMessages error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch messages.' });
  }
}

/**
 * POST /api/messages  (protected)
 * Send a message. Creates conversation if one doesn't exist yet.
 */
export async function sendMessage(req, res) {
  try {
    const senderId = req.user.id;
    const { receiver_id, content } = req.body;

    if (!receiver_id || !isValidUUID(receiver_id)) {
      return res.status(400).json({ error: 'Valid receiver_id is required.' });
    }
    if (!isNonEmpty(content)) {
      return res.status(400).json({ error: 'Message content is required.' });
    }
    if (senderId === receiver_id) {
      return res.status(400).json({ error: 'You cannot message yourself.' });
    }

    // Persist message
    const { rows: [message] } = await query(
      `INSERT INTO messages (sender_id, receiver_id, content)
       VALUES ($1, $2, $3) RETURNING *`,
      [senderId, receiver_id, content.trim()],
    );

    // Upsert conversation (normalise user order for unique constraint)
    const [u1, u2] = [senderId, receiver_id].sort();
    await query(
      `INSERT INTO conversations (user1_id, user2_id, last_message_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user1_id, user2_id)
       DO UPDATE SET last_message_at = NOW()`,
      [u1, u2],
    );

    return res.status(201).json({ message });
  } catch (err) {
    console.error('[Message] sendMessage error:', err.message);
    return res.status(500).json({ error: 'Failed to send message.' });
  }
}

/**
 * PUT /api/messages/read/:conversationId  (protected)
 * Mark all messages in a conversation as read for the auth user.
 * conversationId here is actually the OTHER user's ID for simplicity.
 */
export async function markAsRead(req, res) {
  try {
    const myId = req.user.id;
    const { conversationId } = req.params;  // the other user's ID

    if (!isValidUUID(conversationId)) {
      return res.status(400).json({ error: 'Invalid conversation ID.' });
    }

    const result = await query(
      `UPDATE messages SET is_read = TRUE
       WHERE sender_id = $1 AND receiver_id = $2 AND is_read = FALSE`,
      [conversationId, myId],
    );

    return res.json({ updated: result.rowCount });
  } catch (err) {
    console.error('[Message] markAsRead error:', err.message);
    return res.status(500).json({ error: 'Failed to mark messages as read.' });
  }
}
