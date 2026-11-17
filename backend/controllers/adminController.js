import pool from '../config/db.js';

export const getCustomers = async (req, res, next) => {
  try {
    const { search, status } = req.query;

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

    if (status && ['ACTIVE', 'BLOCKED'].includes(status.toUpperCase())) {
      query += ` AND account_status = ?`;
      params.push(status.toUpperCase());
    }

    query += ` ORDER BY id DESC`;

    const [rows] = await pool.query(query, params);

    return res.status(200).json({
      status: 'success',
      data: {
        customers: rows
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomerById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `SELECT id, full_name, email, phone, account_number, balance, role, account_status, created_at
       FROM users
       WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        status: 'fail',
        message: 'Customer not found.'
      });
    }

    const customer = rows[0];

    const [transactions] = await pool.query(
      `SELECT id, transaction_type, amount, direction, related_account, description, status, created_at
       FROM transactions
       WHERE user_id = ?
       ORDER BY created_at DESC, id DESC
       LIMIT 50`,
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

export const updateCustomerStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const targetStatus = (status || '').toUpperCase();
    if (!['ACTIVE', 'BLOCKED'].includes(targetStatus)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid status. Status must be ACTIVE or BLOCKED.'
      });
    }

    const [users] = await pool.query('SELECT id, role, account_status FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found.'
      });
    }

    if (users[0].role === 'ADMIN') {
      return res.status(400).json({
        status: 'fail',
        message: 'Cannot block an administrator account.'
      });
    }

    await pool.query('UPDATE users SET account_status = ? WHERE id = ?', [targetStatus, id]);

    return res.status(200).json({
      status: 'success',
      message: `Customer account status updated to ${targetStatus}.`,
      data: {
        id: Number(id),
        account_status: targetStatus
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAllTransactions = async (req, res, next) => {
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
    query += ` ORDER BY t.created_at ${sortOrder}, t.id ${sortOrder} LIMIT 200`;

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
