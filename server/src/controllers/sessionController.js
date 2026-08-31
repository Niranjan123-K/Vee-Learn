// ─── Session Controller ─────────────────────────────────────
import { query, getClient } from '../config/db.js';
import { refundCredits } from '../services/creditLedger.js';
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

    const scheduledDate = new Date(scheduled_at);
    if (scheduledDate <= new Date()) {
      return res.status(400).json({ error: 'Cannot book a session in the past.' });
    }

    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Check for overlaps for both teacher and learner
      const { rows: overlaps } = await client.query(
        `SELECT id FROM sessions
         WHERE (teacher_id = $1 OR learner_id = $1 OR teacher_id = $2 OR learner_id = $2)
           AND status IN ('pending', 'confirmed')
           AND scheduled_at < $3::timestamp + (INTERVAL '1 minute' * $4)
           AND scheduled_at + (INTERVAL '1 minute' * duration_minutes) > $3::timestamp`,
        [teacher_id, learnerId, scheduled_at, duration]
      );

      if (overlaps.length > 0) {
        throw new Error('There is a scheduling conflict with an existing session.');
      }

      // Check learner balance and escrow credits
      const { rows: [learnerUpdate] } = await client.query(
        `UPDATE users SET credit_balance = credit_balance - $1, held_balance = held_balance + $1 
         WHERE id = $2 AND credit_balance >= $1
         RETURNING credit_balance`,
        [creditsNeeded, learnerId]
      );

      if (!learnerUpdate) {
        throw new Error('Insufficient credits.');
      }

      const { rows: [session] } = await client.query(
        `INSERT INTO sessions (teacher_id, learner_id, skill_id, scheduled_at, duration_minutes, notes)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [teacher_id, learnerId, skill_id, scheduled_at, duration, notes || '']
      );

      await client.query('COMMIT');

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
      await client.query('ROLLBACK');
      console.error('[Session] createSession error:', err.message);
      const isClientError = ['There is a scheduling conflict with an existing session.', 'Insufficient credits.'].includes(err.message);
      return res.status(isClientError ? 400 : 500).json({ error: err.message || 'Failed to create session.' });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('[Session] createSession outer error:', err.message);
    return res.status(500).json({ error: 'Failed to create session.' });
  }
}

/**
 * PUT /api/sessions/:id/confirm  (protected)
 * Teacher confirms a pending session.
 */
export async function confirmSession(req, res) {
  const { id } = req.params;
  const userId = req.user.id;

  if (!isValidUUID(id)) {
    return res.status(400).json({ error: 'Invalid session ID.' });
  }

  const client = await getClient();

  try {
    await client.query('BEGIN');

    const { rows: [session] } = await client.query(
      `SELECT s.*, 
              t.email AS teacher_email, t.name AS teacher_name,
              l.email AS learner_email, l.name AS learner_name,
              sk.name AS skill_name
       FROM sessions s
       JOIN users t ON t.id = s.teacher_id
       JOIN users l ON l.id = s.learner_id
       JOIN skills sk ON sk.id = s.skill_id
       WHERE s.id = $1 FOR UPDATE`,
      [id]
    );

    if (!session) {
      throw new Error('Session not found.');
    }
    if (session.teacher_id !== userId) {
      throw new Error('Only the teacher can confirm a session.');
    }
    if (session.status !== 'pending') {
      throw new Error(`Cannot confirm a session with status '${session.status}'.`);
    }

    // Auto-generate Jitsi Meet link
    const jitsiLink = `https://meet.jit.si/veelearn-session-${id}`;

    // Update Session
    await client.query(
      `UPDATE sessions 
       SET status = 'confirmed', 
           meeting_link = $1, 
           meeting_provider = 'JITSI',
           meeting_status = 'CREATED',
           meeting_created_at = NOW()
       WHERE id = $2`,
      [jitsiLink, id],
    );

    await client.query('COMMIT');

    const enriched = await getEnrichedSession(id);

    // Format date and time for notification
    const startDate = new Date(session.scheduled_at);
    const dateStr = startDate.toLocaleDateString('en-US');
    const timeStr = startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    // Notify the LEARNER that their session was confirmed
    emitSessionEvent(req, session.learner_id, 'session_updated', {
      session: enriched,
      message: `Your session has been confirmed. A Jitsi Meet room is ready. Your session starts on ${dateStr} at ${timeStr}.`,
      action: 'confirmed',
    });

    // Also update the teacher's UI
    emitSessionEvent(req, session.teacher_id, 'session_updated', {
      session: enriched,
      message: 'Session confirmed and meeting link saved.',
      action: 'confirmed',
    });

    return res.json({ session: enriched });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Session] confirmSession error:', err.message);
    const isClientError = ['Only the teacher can confirm a session.', 'Session not found.'].includes(err.message) || err.message.startsWith('Cannot confirm');
    return res.status(isClientError ? 400 : 500).json({ error: err.message || 'Failed to confirm session.' });
  } finally {
    client.release();
  }
}

/**
 * GET /api/sessions/:id/join  (protected)
 * Get the Jitsi Meet link for a session securely.
 * Allowed 15 minutes before the session starts and during the session.
 */
export async function joinSession(req, res) {
  const { id } = req.params;
  const userId = req.user.id;

  if (!isValidUUID(id)) {
    return res.status(400).json({ error: 'Invalid session ID.' });
  }

  try {
    const { rows: [session] } = await query(
      `SELECT * FROM sessions WHERE id = $1`,
      [id]
    );

    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    if (session.teacher_id !== userId && session.learner_id !== userId) {
      return res.status(403).json({ error: 'You are not a participant of this session.' });
    }

    if (session.status !== 'confirmed') {
      return res.status(400).json({ error: `Cannot join a session with status '${session.status}'.` });
    }

    // Check join window: 15 minutes before scheduled_at
    const scheduledAt = new Date(session.scheduled_at);
    const joinWindowStart = new Date(scheduledAt.getTime() - 15 * 60 * 1000);

    if (new Date() < joinWindowStart) {
      return res.status(403).json({ error: 'You can only join the session 15 minutes before it starts.' });
    }

    return res.json({ joinUrl: session.meeting_link });
  } catch (err) {
    console.error('[Session] joinSession error:', err.message);
    return res.status(500).json({ error: 'Failed to join session.' });
  }
}

/**
 * PUT /api/sessions/:id/reject  (protected)
 * Teacher rejects a pending session.
 */
export async function rejectSession(req, res) {
  const { id } = req.params;

  if (!isValidUUID(id)) {
    return res.status(400).json({ error: 'Invalid session ID.' });
  }

  const client = await getClient();

  try {
    await client.query('BEGIN');

    const { rows: [session] } = await client.query(
      'SELECT * FROM sessions WHERE id = $1 FOR UPDATE',
      [id],
    );

    if (!session) {
      throw new Error('Session not found.');
    }
    if (session.teacher_id !== req.user.id) {
      throw new Error('Only the teacher can reject a session.');
    }
    if (session.status !== 'pending') {
      throw new Error(`Cannot reject a session with status '${session.status}'.`);
    }

    // Refund escrowed credits
    const creditsToRefund = Math.ceil(session.duration_minutes / 60);
    await client.query(
      `UPDATE users SET held_balance = held_balance - $1, credit_balance = credit_balance + $1 WHERE id = $2`,
      [creditsToRefund, session.learner_id]
    );

    await client.query(
      `UPDATE sessions SET status = 'rejected' WHERE id = $1`,
      [id],
    );

    await client.query('COMMIT');

    const enriched = await getEnrichedSession(id);

    // Notify the LEARNER that their session was rejected
    emitSessionEvent(req, session.learner_id, 'session_updated', {
      session: enriched,
      message: `${req.user.name} declined your session request`,
      action: 'rejected',
    });

    // Also update the teacher's UI
    emitSessionEvent(req, session.teacher_id, 'session_updated', {
      session: enriched,
      message: 'Session rejected',
      action: 'rejected',
    });

    return res.json({ session: enriched });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Session] rejectSession error:', err.message);
    const isClientError = ['Only the teacher can reject a session.', 'Session not found.'].includes(err.message) || err.message.startsWith('Cannot reject');
    return res.status(isClientError ? 400 : 500).json({ error: err.message || 'Failed to reject session.' });
  } finally {
    client.release();
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

    // 2. Fetch the session details and lock the row
    const sessionResult = await client.query(
      `SELECT learner_id, teacher_id, status, duration_minutes,
              teacher_completion_confirmed, learner_completion_confirmed 
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

    const isTeacher = (session.teacher_id === userId);

    // Prevent double clicks
    if (isTeacher && session.teacher_completion_confirmed) {
      throw new Error('Already confirmed.');
    }
    if (!isTeacher && session.learner_completion_confirmed) {
      throw new Error('Already confirmed.');
    }

    // Update the completion flags in the database
    if (isTeacher) {
      await client.query(
        `UPDATE sessions SET teacher_completion_confirmed = true, teacher_completed_at = NOW() WHERE id = $1`,
        [id]
      );
      session.teacher_completion_confirmed = true;
    } else {
      await client.query(
        `UPDATE sessions SET learner_completion_confirmed = true, learner_completed_at = NOW() WHERE id = $1`,
        [id]
      );
      session.learner_completion_confirmed = true;
    }

    const bothConfirmed = session.teacher_completion_confirmed && session.learner_completion_confirmed;

    // If both parties have confirmed, finalize the escrow and transfer credits
    if (bothConfirmed) {
      const creditsToTransfer = Math.ceil(session.duration_minutes / 60);

      // Relese held credits from the learner
      const learnerUpdate = await client.query(
        `UPDATE users SET held_balance = held_balance - $1 
         WHERE id = $2 AND held_balance >= $1 
         RETURNING held_balance`,
        [creditsToTransfer, session.learner_id]
      );

      if (learnerUpdate.rows.length === 0) {
        throw new Error('Learner has insufficient credits to complete transaction.');
      }

      // Add credits to the teacher
      await client.query(
        `UPDATE users SET credit_balance = credit_balance + $1 WHERE id = $2`,
        [creditsToTransfer, session.teacher_id]
      );

      // Ledger entries: SPEND & EARN
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

      // Mark the session as completely finalized
      await client.query(
        `UPDATE sessions SET status = 'completed', credits_transferred = true WHERE id = $1`,
        [id]
      );
    }

    // Future:
    // Auto-complete after timeout
    // Dispute workflow
    // Admin override

    // 7. COMMIT THE CHANGES
    await client.query('COMMIT');

    // 8. Fetch enriched session for UI notifications (outside the transaction lock)
    const enriched = await getEnrichedSession(id);
    const otherUserId = isTeacher ? session.learner_id : session.teacher_id;

    // Notify users
    if (bothConfirmed) {
      emitSessionEvent(req, otherUserId, 'session_updated', {
        session: enriched,
        message: `${req.user.name} confirmed completion. Session completed!`,
        action: 'completed',
      });
      emitSessionEvent(req, userId, 'session_updated', {
        session: enriched,
        message: 'Session completed! Credits transferred.',
        action: 'completed',
      });
    } else {
      emitSessionEvent(req, otherUserId, 'session_updated', {
        session: enriched,
        message: `${req.user.name} marked the session as completed. Please confirm.`,
        action: 'completion_requested',
      });
      emitSessionEvent(req, userId, 'session_updated', {
        session: enriched,
        message: 'Waiting for the other user to confirm.',
        action: 'completion_requested',
      });
    }

    return res.json({ session: enriched });

  } catch (error) {
    // IF ANYTHING FAILED ABOVE, REVERT ALL CHANGES IMMEDIATELY
    await client.query('ROLLBACK');
    console.error('[Session] completeSession Transaction failed, rolling back:', error.message);

    // Return a clean error to the frontend
    const isClientError = ['Unauthorized to complete this session.', 'Session not found.', 'Learner has insufficient credits to complete transaction.', 'Already confirmed.'].includes(error.message) || error.message.startsWith('Cannot complete');

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
  const { id } = req.params;
  const userId = req.user.id;

  if (!isValidUUID(id)) {
    return res.status(400).json({ error: 'Invalid session ID.' });
  }

  const client = await getClient();

  try {
    await client.query('BEGIN');

    const { rows: [session] } = await client.query(
      'SELECT * FROM sessions WHERE id = $1 FOR UPDATE',
      [id],
    );
    if (!session) {
      throw new Error('Session not found.');
    }
    if (session.teacher_id !== userId && session.learner_id !== userId) {
      throw new Error('You are not a participant of this session.');
    }
    if (session.status === 'completed' || session.status === 'cancelled') {
      throw new Error(`Cannot cancel a session with status '${session.status}'.`);
    }

    // Refund escrowed credits back to the learner
    const creditsToRefund = Math.ceil(session.duration_minutes / 60);
    await client.query(
      `UPDATE users SET held_balance = held_balance - $1, credit_balance = credit_balance + $1 WHERE id = $2`,
      [creditsToRefund, session.learner_id]
    );

    // Attempt to delete Google Calendar Event if it exists - removed based on instructions

    await client.query(
      `UPDATE sessions 
       SET status = 'cancelled', meeting_status = 'CANCELLED' 
       WHERE id = $1`,
      [id],
    );

    await client.query('COMMIT');

    const enriched = await getEnrichedSession(id);
    const otherUserId = session.teacher_id === userId ? session.learner_id : session.teacher_id;

    // Notify the other participant
    emitSessionEvent(req, otherUserId, 'session_updated', {
      session: enriched,
      message: `Your session has been cancelled and the meeting is no longer available.`,
      action: 'cancelled',
    });

    // Update current user's UI
    emitSessionEvent(req, userId, 'session_updated', {
      session: enriched,
      message: 'Session cancelled',
      action: 'cancelled',
    });

    return res.json({ session: enriched });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Session] cancelSession error:', err.message);
    const isClientError = ['You are not a participant of this session.', 'Session not found.'].includes(err.message) || err.message.startsWith('Cannot cancel');
    return res.status(isClientError ? 400 : 500).json({ error: err.message || 'Failed to cancel session.' });
  } finally {
    client.release();
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
