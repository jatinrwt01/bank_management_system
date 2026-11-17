import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

const generateUniqueAccountNumber = async () => {
  while (true) {
    const accountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    const [rows] = await pool.query('SELECT id FROM users WHERE account_number = ?', [accountNumber]);
    if (rows.length === 0) {
      return accountNumber;
    }
  }
};

export const register = async (req, res, next) => {
  try {
    const fullName = (req.body.full_name || req.body.fullName || '').trim();
    const email = (req.body.email || '').trim().toLowerCase();
    const phone = (req.body.phone || '').trim();
    const password = req.body.password || '';
    const confirmPassword = req.body.confirm_password || req.body.confirmPassword || '';

    if (!fullName || !email || !phone || !password || !confirmPassword) {
      return res.status(400).json({
        status: 'fail',
        message: 'All fields are required (full name, email, phone, password, confirm password).'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        status: 'fail',
        message: 'Password and confirm password do not match.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        status: 'fail',
        message: 'Password must be at least 6 characters long.'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide a valid email address.'
      });
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({
        status: 'fail',
        message: 'Email address is already registered.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const accountNumber = await generateUniqueAccountNumber();

    const [result] = await pool.query(
      'INSERT INTO users (full_name, email, phone, password, account_number, balance, role, account_status) VALUES (?, ?, ?, ?, ?, 10000.00, "CUSTOMER", "ACTIVE")',
      [fullName, email, phone, hashedPassword, accountNumber]
    );

    return res.status(201).json({
      status: 'success',
      message: 'User registered successfully.',
      data: {
        user: {
          id: result.insertId,
          full_name: fullName,
          email,
          phone,
          account_number: accountNumber,
          balance: '10000.00',
          role: 'CUSTOMER',
          account_status: 'ACTIVE'
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';

    if (!email || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Email and password are required.'
      });
    }

    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid email or password.'
      });
    }

    const user = users[0];

    if (user.account_status === 'BLOCKED') {
      return res.status(403).json({
        status: 'fail',
        message: 'Your account is blocked. Please contact customer support.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid email or password.'
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        accountNumber: user.account_number
      },
      process.env.JWT_SECRET || 'bank_default_jwt_secret_key_2026',
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      status: 'success',
      message: 'Login successful.',
      data: {
        token,
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          phone: user.phone,
          account_number: user.account_number,
          balance: user.balance,
          role: user.role,
          account_status: user.account_status
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
