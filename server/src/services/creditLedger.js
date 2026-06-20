// ─── Credit Ledger Service ──────────────────────────────────
// Atomic credit operations backed by PostgreSQL transactions.
// Every balance mutation goes through this service to ensure
// the ledger and user.credit_balance stay in sync.
// ─────────────────────────────────────────────────────────────

import { getClient } from '../config/db.js';

/**
 * Transfer credits from one user to another inside a single
 * PostgreSQL transaction (all-or-nothing).
 *
 * Steps:
 *  1. Row-lock the sender and verify sufficient balance.
 *  2. Deduct from sender's balance.
 *  3. Add to receiver's balance.
 *  4. Insert SPEND transaction row for the sender.
 *  5. Insert EARN  transaction row for the receiver.
 *
 * @param {string} fromUserId
 * @param {string} toUserId
 * @param {string} sessionId
 * @param {number} amount  Must be > 0
 * @returns {Promise<{ spend: object, earn: object }>} The two transaction rows.
 */
export async function transferCredits(fromUserId, toUserId, sessionId, amount) {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // 1 — Lock sender row & check balance
    const { rows: [sender] } = await client.query(
      'SELECT credit_balance FROM users WHERE id = $1 FOR UPDATE',
      [fromUserId],
    );

    if (!sender) {
      throw new Error('Sender user not found.');
    }
    if (sender.credit_balance < amount) {
      throw new Error('Insufficient credit balance.');
    }

    // 2 — Deduct from sender
    await client.query(
      'UPDATE users SET credit_balance = credit_balance - $1 WHERE id = $2',
      [amount, fromUserId],
    );

    // 3 — Add to receiver
    await client.query(
      'UPDATE users SET credit_balance = credit_balance + $1 WHERE id = $2',
      [amount, toUserId],
    );

    // 4 — Ledger entry: SPEND
    const { rows: [spend] } = await client.query(
      `INSERT INTO credit_transactions (from_user_id, to_user_id, session_id, amount, type, description)
       VALUES ($1, $2, $3, $4, 'spend', 'Session payment')
       RETURNING *`,
      [fromUserId, toUserId, sessionId, amount],
    );

    // 5 — Ledger entry: EARN
    const { rows: [earn] } = await client.query(
      `INSERT INTO credit_transactions (from_user_id, to_user_id, session_id, amount, type, description)
       VALUES ($1, $2, $3, $4, 'earn', 'Session earning')
       RETURNING *`,
      [fromUserId, toUserId, sessionId, amount],
    );

    await client.query('COMMIT');

    return { spend, earn };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Grant bonus credits to a user (e.g. registration bonus).
 * from_user_id is NULL — credits come out of thin air.
 */
export async function grantBonusCredits(userId, amount, description = 'Bonus credits') {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    await client.query(
      'UPDATE users SET credit_balance = credit_balance + $1 WHERE id = $2',
      [amount, userId],
    );

    const { rows: [tx] } = await client.query(
      `INSERT INTO credit_transactions (from_user_id, to_user_id, amount, type, description)
       VALUES (NULL, $1, $2, 'bonus', $3)
       RETURNING *`,
      [userId, amount, description],
    );

    await client.query('COMMIT');
    return tx;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Refund credits for a cancelled session.
 */
export async function refundCredits(userId, sessionId, amount) {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    await client.query(
      'UPDATE users SET credit_balance = credit_balance + $1 WHERE id = $2',
      [amount, userId],
    );

    const { rows: [tx] } = await client.query(
      `INSERT INTO credit_transactions (from_user_id, to_user_id, session_id, amount, type, description)
       VALUES (NULL, $1, $2, $3, 'refund', 'Session cancellation refund')
       RETURNING *`,
      [userId, sessionId, amount],
    );

    await client.query('COMMIT');
    return tx;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
