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

  const createTransactionsTable = `
    CREATE TABLE IF NOT EXISTS transactions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      transaction_type ENUM('DEPOSIT', 'WITHDRAWAL', 'TRANSFER') NOT NULL,
      amount DECIMAL(15, 2) NOT NULL,
      direction ENUM('IN', 'OUT') DEFAULT NULL,
      related_account VARCHAR(20) DEFAULT NULL,
      description VARCHAR(255) DEFAULT NULL,
      status ENUM('PENDING', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'COMPLETED',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_transactions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT chk_transactions_amount CHECK (amount > 0.00)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  try {
    await pool.query(createUsersTable);
    await pool.query(createTransactionsTable);

    // Ensure columns exist if table was previously created with older schema
    const [cols] = await pool.query("SHOW COLUMNS FROM transactions LIKE 'direction'");
    if (cols.length === 0) {
      await pool.query("ALTER TABLE transactions ADD COLUMN direction ENUM('IN', 'OUT') DEFAULT NULL AFTER amount");
    }

    const [relCols] = await pool.query("SHOW COLUMNS FROM transactions LIKE 'related_account'");
    if (relCols.length === 0) {
      await pool.query("ALTER TABLE transactions ADD COLUMN related_account VARCHAR(20) DEFAULT NULL AFTER direction");
    }

    const [descCols] = await pool.query("SHOW COLUMNS FROM transactions LIKE 'description'");
    if (descCols.length === 0) {
      await pool.query("ALTER TABLE transactions ADD COLUMN description VARCHAR(255) DEFAULT NULL AFTER related_account");
    }
  } catch (error) {
    const errorDetails = error.message || error.code || 'Connection error';
    console.error('Database initialization warning:', errorDetails);
  }
};
