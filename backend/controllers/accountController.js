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
