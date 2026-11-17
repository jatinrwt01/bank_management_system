import pool from '../config/db.js';

export const getProfile = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, full_name, email, phone, account_number, balance, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        status: 'fail',
        message: 'User account not found.'
      });
    }

    return res.status(200).json({
      status: 'success',
      data: {
        user: rows[0]
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [userRows] = await pool.query(
      'SELECT id, full_name, email, phone, account_number, balance, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({
        status: 'fail',
        message: 'User account not found.'
      });
    }

    const [summaryRows] = await pool.query(
      `SELECT 
        COALESCE(SUM(CASE WHEN (transaction_type = 'DEPOSIT' OR (transaction_type = 'TRANSFER' AND direction = 'IN')) AND status = 'COMPLETED' THEN amount ELSE 0 END), 0.00) AS total_deposits,
        COALESCE(SUM(CASE WHEN (transaction_type = 'WITHDRAWAL' OR (transaction_type = 'TRANSFER' AND direction = 'OUT')) AND status = 'COMPLETED' THEN amount ELSE 0 END), 0.00) AS total_withdrawals
       FROM transactions
       WHERE user_id = ?`,
      [userId]
    );

    const [recentTransactions] = await pool.query(
      `SELECT id, transaction_type, amount, direction, related_account, description, status, created_at
       FROM transactions
       WHERE user_id = ?
       ORDER BY created_at DESC, id DESC
       LIMIT 5`,
      [userId]
    );

    return res.status(200).json({
      status: 'success',
      data: {
        user: userRows[0],
        summary: {
          total_deposits: summaryRows[0]?.total_deposits || '0.00',
          total_withdrawals: summaryRows[0]?.total_withdrawals || '0.00'
        },
        recent_transactions: recentTransactions
      }
    });
  } catch (error) {
    next(error);
  }
};
