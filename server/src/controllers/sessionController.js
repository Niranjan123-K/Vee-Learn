// ─── Session Controller ─────────────────────────────────────
import { query, getClient } from '../config/db.js';
import { transferCredits, refundCredits } from '../services/creditLedger.js';
import { isValidUUID, requireFields } from '../middleware/validate.js';

/**
 * Helper: emit a session event to a specific user via Socket.io
 */
function emitSessionEvent(req, userId, eventName, payload) {
  const io = req.app.get('io');
  if (io) {
    io.to(`user:${userId}`).emit(eventName, payload);
  }
}

/**
 * Helper: fetch a fully enriched session object for emitting to clients
 */
async function getEnrichedSession(sessionId) {
  const { rows: [session] } = await query(
    `SELECT s.*,
      t.name AS teacher_name, t.avatar_url AS teacher_avatar,
      l.name AS learner_name, l.avatar_url AS learner_avatar,
      sk.name AS skill_name, sk.category AS skill_category
    FROM sessions s
    JOIN users t  ON t.id  = s.teacher_id
    JOIN users l  ON l.id  = s.learner_id
    JOIN skills sk ON sk.id = s.skill_id
    WHERE s.id = $1`,
    [sessionId],
  );
  return session;
}

/**
 * POST /api/sessions  (protected)
 * Create a new session booking. Learner must have sufficient credits.
 */
export async function createSession(req, res) {
  try {
    const { teacher_id, skill_id, scheduled_at, duration_minutes, notes } = req.body;

    const { valid, missing } = requireFields(req.body, ['teacher_id', 'skill_id', 'scheduled_at']);
    if (!valid) {
      return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
    }
    if (!isValidUUID(teacher_id) || !isValidUUID(skill_id)) {
      return res.status(400).json({ error: 'Invalid teacher_id or skill_id.' });
    }

    const learnerId = req.user.id;
    if (learnerId === teacher_id) {
      return res.status(400).json({ error: 'You cannot book a session with yourself.' });
    }

    // Calculate credits needed (1 credit per 60 minutes)
    const duration = duration_minutes || 60;
    const creditsNeeded = Math.ceil(duration / 60);

    // Check learner balance
    const { rows: [learner] } = await query(
      'SELECT credit_balance FROM users WHERE id = $1',
      [learnerId],
    );
    if (!learner || learner.credit_balance < creditsNeeded) {
      return res.status(400).json({
        error: 'Insufficient credits.',
        required: creditsNeeded,
        balance: learner?.credit_balance || 0,
      });
    }

    const { rows: [session] } = await query(
      `INSERT INTO sessions (teacher_id, learner_id, skill_id, scheduled_at, duration_minutes, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [teacher_id, learnerId, skill_id, scheduled_at, duration, notes || ''],
    );

    // Fetch enriched session for the notification
    const enriched = await getEnrichedSession(session.id);

    // Notify the TEACHER that a new session was booked
    emitSessionEvent(req, teacher_id, 'session_new', {
      session: enriched,
      message: `${req.user.name} booked a session with you`,
    });

    // Also notify the learner for confirmation
    emitSessionEvent(req, learnerId, 'session_new', {
      session: enriched,
      message: `Session booked successfully`,
    });

    return res.status(201).json({ session: enriched });
  } catch (err) {
    console.error('[Session] createSession error:', err.message);
    return res.status(500).json({ error: 'Failed to create session.' });
  }
}

/**
 * PUT /api/sessions/:id/confirm  (protected)
 * Teacher confirms a pending session.
 */
export async function confirmSession(req, res) {
  try {
    const { id } = req.params;
    if (!isValidUUID(id)) {
      return res.status(400).json({ error: 'Invalid session ID.' });
    }

    const { rows: [session] } = await query(
      'SELECT * FROM sessions WHERE id = $1',
      [id],
    );
    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }
    if (session.teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the teacher can confirm a session.' });
    }
    if (session.status !== 'pending') {
      return res.status(400).json({ error: `Cannot confirm a session with status '${session.status}'.` });
    }

    await query(
      `UPDATE sessions SET status = 'confirmed' WHERE id = $1`,
      [id],
    );

    const enriched = await getEnrichedSession(id);

    // Notify the LEARNER that their session was confirmed
    emitSessionEvent(req, session.learner_id, 'session_updated', {
      session: enriched,
      message: `${req.user.name} confirmed your session`,
      action: 'confirmed',
    });

    // Also update the teacher's UI
    emitSessionEvent(req, session.teacher_id, 'session_updated', {
      session: enriched,
      message: 'Session confirmed',
      action: 'confirmed',
    });

    return res.json({ session: enriched });
  } catch (err) {
    console.error('[Session] confirmSession error:', err.message);
    return res.status(500).json({ error: 'Failed to confirm session.' });
  }
}

/**
 * PUT /api/sessions/:id/complete  (protected)
 * Mark session as completed and transfer credits from learner → teacher atomically.
 */
export async function completeSession(req, res) {
  const { id } = req.params;
  const userId = req.user.id;

  if (!isValidUUID(id)) {
    return res.status(400).json({ error: 'Invalid session ID.' });
  }

  const client = await getClient();

  try {
    // 1. BEGIN THE TRANSACTION
    await client.query('BEGIN');

    // 2. Fetch the session details to verify it exists, is confirmed, and get user IDs
    const sessionResult = await client.query(
      `SELECT learner_id, teacher_id, status, duration_minutes 
       FROM sessions WHERE id = $1 FOR UPDATE`, 
      [id]
    );

    if (sessionResult.rows.length === 0) {
      throw new Error('Session not found.');
    }

    const session = sessionResult.rows[0];

    // Security check: Only the learner or teacher involved can complete it
    if (session.learner_id !== userId && session.teacher_id !== userId) {
      throw new Error('Unauthorized to complete this session.');
    }

    // State check: You can't complete a pending, cancelled, or already completed session
    if (session.status !== 'confirmed') {
      throw new Error(`Cannot complete a session with status '${session.status}'.`);
    }

    const creditsToTransfer = Math.ceil(session.duration_minutes / 60);

    // 3. Deduct credits from the learner
    // The FOR UPDATE lock inside this query is automatic for UPDATEs.
    const learnerUpdate = await client.query(
      `UPDATE users SET credit_balance = credit_balance - $1 
       WHERE id = $2 AND credit_balance >= $1 
       RETURNING credit_balance`,
      [creditsToTransfer, session.learner_id]
    );

    if (learnerUpdate.rows.length === 0) {
      throw new Error('Learner has insufficient credits to complete transaction.');
    }

    // 4. Add credits to the teacher
    await client.query(
      `UPDATE users SET credit_balance = credit_balance + $1 WHERE id = $2`,
      [creditsToTransfer, session.teacher_id]
    );

    // 5. Ledger entries: SPEND & EARN
    await client.query(
      `INSERT INTO credit_transactions (from_user_id, to_user_id, session_id, amount, type, description)
       VALUES ($1, $2, $3, $4, 'spend', 'Session payment')`,
      [session.learner_id, session.teacher_id, id, creditsToTransfer]
    );
    await client.query(
      `INSERT INTO credit_transactions (from_user_id, to_user_id, session_id, amount, type, description)
       VALUES ($1, $2, $3, $4, 'earn', 'Session earning')`,
      [session.learner_id, session.teacher_id, id, creditsToTransfer]
    );

    // 6. Mark the session as completed
    await client.query(
      `UPDATE sessions SET status = 'completed' WHERE id = $1`,
      [id]
    );

    // 7. COMMIT THE CHANGES
    await client.query('COMMIT');

    // 8. Fetch enriched session for UI notifications (outside the transaction lock)
    const enriched = await getEnrichedSession(id);
    const otherUserId = session.teacher_id === userId ? session.learner_id : session.teacher_id;

    // Notify the other participant
    emitSessionEvent(req, otherUserId, 'session_updated', {
      session: enriched,
      message: `${req.user.name} marked the session as completed`,
      action: 'completed',
    });

    // Also update the current user's UI
    emitSessionEvent(req, userId, 'session_updated', {
      session: enriched,
      message: 'Session completed! Credits transferred.',
      action: 'completed',
    });

    return res.json({ session: enriched });

  } catch (error) {
    // IF ANYTHING FAILED ABOVE, REVERT ALL CHANGES IMMEDIATELY
    await client.query('ROLLBACK');
    console.error('[Session] completeSession Transaction failed, rolling back:', error.message);
    
    // Return a clean error to the frontend
    const isClientError = ['Unauthorized to complete this session.', 'Session not found.', 'Learner has insufficient credits to complete transaction.'].includes(error.message) || error.message.startsWith('Cannot complete');
    
    return res.status(isClientError ? 400 : 500).json({ error: error.message || 'Failed to complete session.' });
  } finally {
    // ALWAYS release the client back to the pool
    client.release();
  }
}

/**
 * PUT /api/sessions/:id/cancel  (protected)
 * Cancel a session. Refund credits if they were already deducted.
 */
export async function cancelSession(req, res) {
  try {
    const { id } = req.params;
    if (!isValidUUID(id)) {
      return res.status(400).json({ error: 'Invalid session ID.' });
    }

    const { rows: [session] } = await query(
      'SELECT * FROM sessions WHERE id = $1',
      [id],
    );
    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }
    if (session.teacher_id !== req.user.id && session.learner_id !== req.user.id) {
      return res.status(403).json({ error: 'You are not a participant of this session.' });
    }
    if (session.status === 'completed' || session.status === 'cancelled') {
      return res.status(400).json({ error: `Cannot cancel a session with status '${session.status}'.` });
    }

    // If credits were already transferred, issue a refund
    const { rows: spendTx } = await query(
      `SELECT amount FROM credit_transactions
       WHERE session_id = $1 AND type = 'spend'`,
      [id],
    );
    if (spendTx.length > 0) {
      await refundCredits(session.learner_id, id, spendTx[0].amount);
    }

    await query(
      `UPDATE sessions SET status = 'cancelled' WHERE id = $1`,
      [id],
    );

    const enriched = await getEnrichedSession(id);
    const otherUserId = session.teacher_id === req.user.id ? session.learner_id : session.teacher_id;

    // Notify the other participant
    emitSessionEvent(req, otherUserId, 'session_updated', {
      session: enriched,
      message: `${req.user.name} cancelled the session`,
      action: 'cancelled',
    });

    // Update current user's UI
    emitSessionEvent(req, req.user.id, 'session_updated', {
      session: enriched,
      message: 'Session cancelled',
      action: 'cancelled',
    });

    return res.json({ session: enriched });
  } catch (err) {
    console.error('[Session] cancelSession error:', err.message);
    return res.status(500).json({ error: 'Failed to cancel session.' });
  }
}

/**
 * GET /api/sessions  (protected)
 * List the authenticated user's sessions with optional filters.
 * Query params: status, period (upcoming|past), page, limit
 */
export async function getUserSessions(req, res) {
  try {
    const userId = req.user.id;
    const { status, period, page = 1, limit = 20 } = req.query;
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);

    let conditions = '(s.teacher_id = $1 OR s.learner_id = $1)';
    const params = [userId];
    let paramIdx = 2;

    if (status) {
      conditions += ` AND s.status = $${paramIdx}`;
      params.push(status);
      paramIdx++;
    }
    if (period === 'upcoming') {
      conditions += ` AND s.scheduled_at > NOW()`;
    } else if (period === 'past') {
      conditions += ` AND s.scheduled_at <= NOW()`;
    }

    const sql = `
      SELECT s.*,
        t.name AS teacher_name, t.avatar_url AS teacher_avatar,
        l.name AS learner_name, l.avatar_url AS learner_avatar,
        sk.name AS skill_name, sk.category AS skill_category
      FROM sessions s
      JOIN users t  ON t.id  = s.teacher_id
      JOIN users l  ON l.id  = s.learner_id
      JOIN skills sk ON sk.id = s.skill_id
      WHERE ${conditions}
      ORDER BY s.scheduled_at DESC
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
    `;
    params.push(parseInt(limit, 10), offset);

    const { rows } = await query(sql, params);

    // Total count for pagination
    const countSql = `SELECT COUNT(*)::INT AS total FROM sessions s WHERE ${conditions}`;
    const { rows: [countRow] } = await query(countSql, params.slice(0, paramIdx - 1));

    return res.json({
      sessions: rows,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total: countRow.total,
      },
    });
  } catch (err) {
    console.error('[Session] getUserSessions error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch sessions.' });
  }
}

/**
 * GET /api/sessions/:id  (protected)
 * Get full details for a single session.
 */
export async function getSessionById(req, res) {
  try {
    const { id } = req.params;
    if (!isValidUUID(id)) {
      return res.status(400).json({ error: 'Invalid session ID.' });
    }

    const session = await getEnrichedSession(id);

    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    return res.json({ session });
  } catch (err) {
    console.error('[Session] getSessionById error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch session.' });
  }
}

/**
 * GET /api/sessions/:id/messages
 * Retrieves the chat history for a specific session.
 * Rejects if the user is not a participant.
 */
export async function getSessionMessages(req, res) {
  try {
    const { id } = req.params;

    // 1. Verify participation
    const { rows: [session] } = await query(
      `SELECT teacher_id, learner_id FROM sessions WHERE id = $1`,
      [id]
    );

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.teacher_id !== req.user.id && session.learner_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to view these messages' });
    }

    // 2. Fetch messages
    const { rows: messages } = await query(
      `SELECT 
         m.id, 
         m.session_id AS "sessionId", 
         m.sender_id AS "senderId", 
         m.content AS text, 
         m.created_at AS timestamp,
         u.name AS "senderName"
       FROM session_messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.session_id = $1
       ORDER BY m.created_at ASC`,
      [id]
    );

    return res.json({ messages });
  } catch (err) {
    console.error('[Session] getSessionMessages error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch session messages' });
  }
}
