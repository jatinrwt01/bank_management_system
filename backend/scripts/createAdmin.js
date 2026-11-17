import '../config/env.js';
import bcrypt from 'bcryptjs';
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

const main = async () => {
  try {
    const args = process.argv.slice(2);

    const fullName = args[0] || process.env.ADMIN_NAME || 'System Administrator';
    const email = (args[1] || process.env.ADMIN_EMAIL || 'admin@bank.com').trim().toLowerCase();
    const password = args[2] || process.env.ADMIN_PASSWORD || 'Admin@123456';
    const phone = args[3] || process.env.ADMIN_PHONE || '9876543210';
    const role = (args[4] || 'ADMIN').toUpperCase();

    if (!['ADMIN', 'EMPLOYEE'].includes(role)) {
      console.error('Error: Role must be ADMIN or EMPLOYEE');
      process.exit(1);
    }

    if (password.length < 6) {
      console.error('Error: Password must be at least 6 characters long');
      process.exit(1);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [existing] = await pool.query('SELECT id, email, role FROM users WHERE email = ?', [email]);

    if (existing.length > 0) {
      const user = existing[0];
      await pool.query(
        'UPDATE users SET full_name = ?, password = ?, phone = ?, role = ?, account_status = "ACTIVE" WHERE id = ?',
        [fullName, hashedPassword, phone, role, user.id]
      );
      console.log(`Successfully updated existing ${role} account:`);
      console.log(`- ID: ${user.id}`);
      console.log(`- Name: ${fullName}`);
      console.log(`- Email: ${email}`);
      console.log(`- Role: ${role}`);
      console.log(`- Account Status: ACTIVE`);
      process.exit(0);
    }

    const accountNumber = await generateUniqueAccountNumber();

    const [result] = await pool.query(
      `INSERT INTO users (full_name, email, phone, password, account_number, balance, role, account_status)
       VALUES (?, ?, ?, ?, ?, 0.00, ?, 'ACTIVE')`,
      [fullName, email, phone, hashedPassword, accountNumber, role]
    );

    console.log(`Successfully created ${role} account:`);
    console.log(`- ID: ${result.insertId}`);
    console.log(`- Name: ${fullName}`);
    console.log(`- Email: ${email}`);
    console.log(`- Account Number: ${accountNumber}`);
    console.log(`- Role: ${role}`);

    process.exit(0);
  } catch (error) {
    console.error('Error creating user:', error.message);
    process.exit(1);
  }
};

main();
