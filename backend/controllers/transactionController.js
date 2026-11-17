import pool from '../config/db.js';

export const deposit = async (req, res, next) => {
  const connection = await pool.getConnection();

  try {
    const userId = req.user.id;
    const rawAmount = req.body.amount;

    const parsedAmount = Number(parseFloat(rawAmount).toFixed(2));

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      connection.release();
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide a valid positive deposit amount.'
      });
    }

    await connection.beginTransaction();

    const [userRows] = await connection.query(
      'SELECT id, balance FROM users WHERE id = ? FOR UPDATE',
      [userId]
    );

    if (userRows.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({
        status: 'fail',
        message: 'User account not found.'
      });
    }

    const currentBalance = parseFloat(userRows[0].balance);
    const newBalance = (currentBalance + parsedAmount).toFixed(2);

    await connection.query(
      'UPDATE users SET balance = ? WHERE id = ?',
      [newBalance, userId]
    );

    const [insertResult] = await connection.query(
      'INSERT INTO transactions (user_id, transaction_type, amount, status) VALUES (?, "DEPOSIT", ?, "COMPLETED")',
      [userId, parsedAmount]
    );

    await connection.commit();
    connection.release();

    return res.status(200).json({
      status: 'success',
      message: `Deposit of ₹${parsedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} successful.`,
      data: {
        balance: newBalance,
        transaction: {
          id: insertResult.insertId,
          transaction_type: 'DEPOSIT',
          amount: parsedAmount.toFixed(2),
          status: 'COMPLETED'
        }
      }
    });
  } catch (error) {
    try {
      await connection.rollback();
    } catch {
      // ignore rollback error
    }
    connection.release();
    next(error);
  }
};

export const withdraw = async (req, res, next) => {
  const connection = await pool.getConnection();

  try {
    const userId = req.user.id;
    const rawAmount = req.body.amount;

    const parsedAmount = Number(parseFloat(rawAmount).toFixed(2));

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      connection.release();
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide a valid positive withdrawal amount.'
      });
    }

    await connection.beginTransaction();

    const [userRows] = await connection.query(
      'SELECT id, balance FROM users WHERE id = ? FOR UPDATE',
      [userId]
    );

    if (userRows.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({
        status: 'fail',
        message: 'User account not found.'
      });
    }

    const currentBalance = parseFloat(userRows[0].balance);

    if (currentBalance < parsedAmount) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({
        status: 'fail',
        message: `Insufficient funds. Your available balance is ₹${currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`
      });
    }

    const newBalance = (currentBalance - parsedAmount).toFixed(2);

    await connection.query(
      'UPDATE users SET balance = ? WHERE id = ?',
      [newBalance, userId]
    );

    const [insertResult] = await connection.query(
      'INSERT INTO transactions (user_id, transaction_type, amount, status) VALUES (?, "WITHDRAWAL", ?, "COMPLETED")',
      [userId, parsedAmount]
    );

    await connection.commit();
    connection.release();

    return res.status(200).json({
      status: 'success',
      message: `Withdrawal of ₹${parsedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} successful.`,
      data: {
        balance: newBalance,
        transaction: {
          id: insertResult.insertId,
          transaction_type: 'WITHDRAWAL',
          amount: parsedAmount.toFixed(2),
          status: 'COMPLETED'
        }
      }
    });
  } catch (error) {
    try {
      await connection.rollback();
    } catch {
      // ignore rollback error
    }
    connection.release();
    next(error);
  }
};

export const getTransactions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { type, sort } = req.query;

    let query = 'SELECT id, transaction_type, amount, status, created_at FROM transactions WHERE user_id = ?';
    const params = [userId];

    if (type && type.toUpperCase() !== 'ALL') {
      const validTypes = ['DEPOSIT', 'WITHDRAWAL', 'TRANSFER'];
      const upperType = type.toUpperCase();
      if (validTypes.includes(upperType)) {
        query += ' AND transaction_type = ?';
        params.push(upperType);
      }
    }

    const sortOrder = sort && sort.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    query += ` ORDER BY created_at ${sortOrder}, id ${sortOrder}`;

    const [rows] = await pool.query(query, params);

    return res.status(200).json({
      status: 'success',
      data: {
        transactions: rows
      }
    });
  } catch (error) {
    next(error);
  }
};
