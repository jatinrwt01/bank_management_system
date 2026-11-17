import pool from '../config/db.js';

export const searchCustomers = async (req, res, next) => {
  try {
    const { search } = req.query;

    let query = `
      SELECT id, full_name, email, phone, account_number, balance, role, account_status, created_at
      FROM users
      WHERE role = 'CUSTOMER'
    `;
    const params = [];

    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      query += ` AND (full_name LIKE ? OR email LIKE ? OR account_number LIKE ? OR phone LIKE ?)`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    query += ` ORDER BY id DESC LIMIT 50`;

    const [customers] = await pool.query(query, params);

    return res.status(200).json({
      status: 'success',
      data: {
        customers
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomerDetails = async (req, res, next) => {
  try {
    const { accountNumber } = req.params;

    const [rows] = await pool.query(
      `SELECT id, full_name, email, phone, account_number, balance, role, account_status, created_at
       FROM users
       WHERE account_number = ? AND role = 'CUSTOMER'`,
      [accountNumber]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        status: 'fail',
        message: 'Customer account not found.'
      });
    }

    const customer = rows[0];

    const [transactions] = await pool.query(
      `SELECT id, transaction_type, amount, direction, related_account, description, status, created_at
       FROM transactions
       WHERE user_id = ?
       ORDER BY created_at DESC, id DESC
       LIMIT 20`,
      [customer.id]
    );

    return res.status(200).json({
      status: 'success',
      data: {
        customer,
        transactions
      }
    });
  } catch (error) {
    next(error);
  }
};

export const processDeposit = async (req, res, next) => {
  const connection = await pool.getConnection();

  try {
    const accountNumber = (req.body.account_number || req.body.accountNumber || '').trim();
    const rawAmount = req.body.amount;
    const note = (req.body.description || req.body.note || '').trim();

    if (!accountNumber) {
      connection.release();
      return res.status(400).json({
        status: 'fail',
        message: 'Customer account number is required.'
      });
    }

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
      'SELECT id, full_name, account_number, balance, account_status FROM users WHERE account_number = ? FOR UPDATE',
      [accountNumber]
    );

    if (userRows.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({
        status: 'fail',
        message: 'Customer account not found.'
      });
    }

    const customer = userRows[0];

    if (customer.account_status === 'BLOCKED') {
      await connection.rollback();
      connection.release();
      return res.status(400).json({
        status: 'fail',
        message: 'Cannot process deposit: Customer account is blocked.'
      });
    }

    const currentBalance = parseFloat(customer.balance);
    const newBalance = (currentBalance + parsedAmount).toFixed(2);

    await connection.query('UPDATE users SET balance = ? WHERE id = ?', [newBalance, customer.id]);

    const description = note
      ? `Desk Deposit (Staff Processed) - Note: ${note}`
      : 'Desk Deposit (Staff Processed)';

    const [insertResult] = await connection.query(
      'INSERT INTO transactions (user_id, transaction_type, amount, direction, description, status) VALUES (?, "DEPOSIT", ?, "IN", ?, "COMPLETED")',
      [customer.id, parsedAmount, description]
    );

    await connection.commit();
    connection.release();

    return res.status(200).json({
      status: 'success',
      message: `Successfully deposited ₹${parsedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} into account ${customer.account_number}.`,
      data: {
        customer: {
          id: customer.id,
          full_name: customer.full_name,
          account_number: customer.account_number,
          balance: newBalance
        },
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

export const processWithdraw = async (req, res, next) => {
  const connection = await pool.getConnection();

  try {
    const accountNumber = (req.body.account_number || req.body.accountNumber || '').trim();
    const rawAmount = req.body.amount;
    const note = (req.body.description || req.body.note || '').trim();

    if (!accountNumber) {
      connection.release();
      return res.status(400).json({
        status: 'fail',
        message: 'Customer account number is required.'
      });
    }

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
      'SELECT id, full_name, account_number, balance, account_status FROM users WHERE account_number = ? FOR UPDATE',
      [accountNumber]
    );

    if (userRows.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({
        status: 'fail',
        message: 'Customer account not found.'
      });
    }

    const customer = userRows[0];

    if (customer.account_status === 'BLOCKED') {
      await connection.rollback();
      connection.release();
      return res.status(400).json({
        status: 'fail',
        message: 'Cannot process withdrawal: Customer account is blocked.'
      });
    }

    const currentBalance = parseFloat(customer.balance);
    if (currentBalance < parsedAmount) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({
        status: 'fail',
        message: `Insufficient funds. Customer's available balance is ₹${currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`
      });
    }

    const newBalance = (currentBalance - parsedAmount).toFixed(2);

    await connection.query('UPDATE users SET balance = ? WHERE id = ?', [newBalance, customer.id]);

    const description = note
      ? `Desk Withdrawal (Staff Processed) - Note: ${note}`
      : 'Desk Withdrawal (Staff Processed)';

    const [insertResult] = await connection.query(
      'INSERT INTO transactions (user_id, transaction_type, amount, direction, description, status) VALUES (?, "WITHDRAWAL", ?, "OUT", ?, "COMPLETED")',
      [customer.id, parsedAmount, description]
    );

    await connection.commit();
    connection.release();

    return res.status(200).json({
      status: 'success',
      message: `Successfully withdrawn ₹${parsedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} from account ${customer.account_number}.`,
      data: {
        customer: {
          id: customer.id,
          full_name: customer.full_name,
          account_number: customer.account_number,
          balance: newBalance
        },
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

export const getTransactions = async (req, res, next) => {
  try {
    const { type, search, sort } = req.query;

    let query = `
      SELECT 
        t.id, 
        t.user_id, 
        t.transaction_type, 
        t.amount, 
        t.direction, 
        t.related_account, 
        t.description, 
        t.status, 
        t.created_at,
        u.full_name AS customer_name,
        u.email AS customer_email,
        u.account_number AS customer_account
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (type && type.toUpperCase() !== 'ALL') {
      const upperType = type.toUpperCase();
      if (['DEPOSIT', 'WITHDRAWAL', 'TRANSFER'].includes(upperType)) {
        query += ` AND t.transaction_type = ?`;
        params.push(upperType);
      }
    }

    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      query += ` AND (u.full_name LIKE ? OR u.email LIKE ? OR u.account_number LIKE ? OR t.related_account LIKE ? OR t.id LIKE ?)`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const sortOrder = sort && sort.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    query += ` ORDER BY t.created_at ${sortOrder}, t.id ${sortOrder} LIMIT 100`;

    const [transactions] = await pool.query(query, params);

    return res.status(200).json({
      status: 'success',
      data: {
        transactions
      }
    });
  } catch (error) {
    next(error);
  }
};
