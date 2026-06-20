// ─── Credit Controller ──────────────────────────────────────
import { query } from '../config/db.js';

/**
 * GET /api/credits/balance  (protected)
 */
export async function getBalance(req, res) {
  try {
    const { rows: [user] } = await query(
      'SELECT credit_balance FROM users WHERE id = $1',
      [req.user.id],
    );
    return res.json({ balance: user?.credit_balance ?? 0 });
  } catch (err) {
    console.error('[Credit] getBalance error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch balance.' });
  }
}

/**
 * GET /api/credits/history  (protected)
 * Paginated transaction history. Query: type, page, limit
 */
export async function getTransactionHistory(req, res) {
  try {
    const userId = req.user.id;
    const { type, page = 1, limit = 20 } = req.query;
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);

    let conditions = '(ct.from_user_id = $1 OR ct.to_user_id = $1)';
    const params = [userId];
    let paramIdx = 2;

    if (type) {
      conditions += ` AND ct.type = $${paramIdx}`;
      params.push(type);
      paramIdx++;
    }

    const sql = `
      SELECT ct.*,
        fu.name AS from_user_name,
        tu.name AS to_user_name
      FROM credit_transactions ct
      LEFT JOIN users fu ON fu.id = ct.from_user_id
      JOIN users tu ON tu.id = ct.to_user_id
      WHERE ${conditions}
      ORDER BY ct.created_at DESC
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
    `;
    params.push(parseInt(limit, 10), offset);

    const { rows } = await query(sql, params);

    const countSql = `SELECT COUNT(*)::INT AS total FROM credit_transactions ct WHERE ${conditions}`;
    const { rows: [countRow] } = await query(countSql, params.slice(0, paramIdx - 1));

    return res.json({
      transactions: rows,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total: countRow.total,
      },
    });
  } catch (err) {
    console.error('[Credit] getTransactionHistory error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch transactions.' });
  }
}

/**
 * GET /api/credits/stats  (protected)
 * Aggregate credit stats for the authenticated user.
 */
export async function getCreditStats(req, res) {
  try {
    const userId = req.user.id;

    const { rows: [balance] } = await query(
      'SELECT credit_balance FROM users WHERE id = $1',
      [userId],
    );

    const { rows: [earned] } = await query(
      `SELECT COALESCE(SUM(amount), 0)::INT AS total
       FROM credit_transactions
       WHERE to_user_id = $1 AND type IN ('earn', 'bonus', 'refund')`,
      [userId],
    );

    const { rows: [spent] } = await query(
      `SELECT COALESCE(SUM(amount), 0)::INT AS total
       FROM credit_transactions
       WHERE from_user_id = $1 AND type = 'spend'`,
      [userId],
    );

    return res.json({
      balance: balance?.credit_balance ?? 0,
      total_earned: earned.total,
      total_spent: spent.total,
    });
  } catch (err) {
    console.error('[Credit] getCreditStats error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch credit stats.' });
  }
}
