import pool from '../config/db.js';

export const initDb = async () => {
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      full_name VARCHAR(100) NOT NULL,
      email VARCHAR(150) NOT NULL UNIQUE,
      phone VARCHAR(20) NOT NULL,
      password VARCHAR(255) NOT NULL,
      account_number VARCHAR(20) NOT NULL UNIQUE,
      balance DECIMAL(15, 2) NOT NULL DEFAULT 10000.00,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  try {
    await pool.query(createUsersTable);
  } catch (error) {
    const errorDetails = error.message || error.code || 'Connection error';
    console.error('Database initialization warning:', errorDetails);
  }
};
