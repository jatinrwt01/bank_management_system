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
      'SELECT id, balance, account_status FROM users WHERE id = ? FOR UPDATE',
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

    if (userRows[0].account_status === 'BLOCKED') {
      await connection.rollback();
      connection.release();
      return res.status(403).json({
        status: 'fail',
        message: 'Your account is blocked. Transactions are not permitted.'
      });
    }

    const currentBalance = parseFloat(userRows[0].balance);
    const newBalance = (currentBalance + parsedAmount).toFixed(2);

    await connection.query(
      'UPDATE users SET balance = ? WHERE id = ?',
      [newBalance, userId]
    );

    const [insertResult] = await connection.query(
      'INSERT INTO transactions (user_id, transaction_type, amount, direction, description, status) VALUES (?, "DEPOSIT", ?, "IN", "Account Cash Deposit", "COMPLETED")',
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
          direction: 'IN',
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
      'SELECT id, balance, account_status FROM users WHERE id = ? FOR UPDATE',
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

    if (userRows[0].account_status === 'BLOCKED') {
      await connection.rollback();
      connection.release();
      return res.status(403).json({
        status: 'fail',
        message: 'Your account is blocked. Transactions are not permitted.'
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
      'INSERT INTO transactions (user_id, transaction_type, amount, direction, description, status) VALUES (?, "WITHDRAWAL", ?, "OUT", "Account Cash Withdrawal", "COMPLETED")',
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
          direction: 'OUT',
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

export const transfer = async (req, res, next) => {
  const connection = await pool.getConnection();

  try {
    const senderId = req.user.id;
    const recipientAccount = (req.body.recipient_account || req.body.recipientAccount || '').trim();
    const rawAmount = req.body.amount;
    const userNote = (req.body.description || req.body.note || '').trim();

    if (!recipientAccount) {
      connection.release();
      return res.status(400).json({
        status: 'fail',
        message: 'Recipient account number is required.'
      });
    }

    const parsedAmount = Number(parseFloat(rawAmount).toFixed(2));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      connection.release();
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide a valid positive transfer amount.'
      });
    }

    const [recipientRows] = await connection.query(
      'SELECT id, full_name, account_number FROM users WHERE account_number = ?',
      [recipientAccount]
    );

    if (recipientRows.length === 0) {
      connection.release();
      return res.status(404).json({
        status: 'fail',
        message: 'Recipient account number not found.'
      });
    }

    const recipient = recipientRows[0];
    const recipientId = recipient.id;

    if (senderId === recipientId) {
      connection.release();
      return res.status(400).json({
        status: 'fail',
        message: 'Transfers to your own account are not allowed.'
      });
    }

    await connection.beginTransaction();

    // Deadlock-free row locking: order IDs consistently
    const firstId = Math.min(senderId, recipientId);
    const secondId = Math.max(senderId, recipientId);

    const [lockedUsers] = await connection.query(
      'SELECT id, full_name, account_number, balance, account_status FROM users WHERE id IN (?, ?) ORDER BY id FOR UPDATE',
      [firstId, secondId]
    );

    const sender = lockedUsers.find((u) => u.id === senderId);
    const lockedRecipient = lockedUsers.find((u) => u.id === recipientId);

    if (!sender || !lockedRecipient) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({
        status: 'fail',
        message: 'Account verification failed during transaction.'
      });
    }

    if (sender.account_status === 'BLOCKED') {
      await connection.rollback();
      connection.release();
      return res.status(403).json({
        status: 'fail',
        message: 'Your account is blocked. Transfers are not permitted.'
      });
    }

    if (lockedRecipient.account_status === 'BLOCKED') {
      await connection.rollback();
      connection.release();
      return res.status(400).json({
        status: 'fail',
        message: 'Recipient account is blocked. Transfer cannot be processed.'
      });
    }

    const senderBalance = parseFloat(sender.balance);
    if (senderBalance < parsedAmount) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({
        status: 'fail',
        message: `Insufficient funds. Your available balance is ₹${senderBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`
      });
    }

    const recipientBalance = parseFloat(lockedRecipient.balance);
    const newSenderBalance = (senderBalance - parsedAmount).toFixed(2);
    const newRecipientBalance = (recipientBalance + parsedAmount).toFixed(2);

    await connection.query('UPDATE users SET balance = ? WHERE id = ?', [newSenderBalance, senderId]);
    await connection.query('UPDATE users SET balance = ? WHERE id = ?', [newRecipientBalance, recipientId]);

    const noteSuffix = userNote ? ` - Note: ${userNote}` : '';
    const senderDesc = `Transfer to ${lockedRecipient.full_name} (${lockedRecipient.account_number})${noteSuffix}`;
    const recipientDesc = `Transfer from ${sender.full_name} (${sender.account_number})${noteSuffix}`;

    const [senderTx] = await connection.query(
      'INSERT INTO transactions (user_id, transaction_type, amount, direction, related_account, description, status) VALUES (?, "TRANSFER", ?, "OUT", ?, ?, "COMPLETED")',
      [senderId, parsedAmount, lockedRecipient.account_number, senderDesc]
    );

    await connection.query(
      'INSERT INTO transactions (user_id, transaction_type, amount, direction, related_account, description, status) VALUES (?, "TRANSFER", ?, "IN", ?, ?, "COMPLETED")',
      [recipientId, parsedAmount, sender.account_number, recipientDesc]
    );

    await connection.commit();
    connection.release();

    return res.status(200).json({
      status: 'success',
      message: `Transfer of ₹${parsedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} to ${lockedRecipient.full_name} successful.`,
      data: {
        balance: newSenderBalance,
        recipient: {
          full_name: lockedRecipient.full_name,
          account_number: lockedRecipient.account_number
        },
        transaction: {
          id: senderTx.insertId,
          transaction_type: 'TRANSFER',
          direction: 'OUT',
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

    let query = 'SELECT id, transaction_type, amount, direction, related_account, description, status, created_at FROM transactions WHERE user_id = ?';
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
