import mysql from 'mysql2/promise';
import './env.js';

const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = Number(process.env.DB_PORT) || 3306;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME || 'bank_management';

const missingCredentials = [];
if (typeof dbUser !== 'string' || dbUser.trim() === '') {
  missingCredentials.push('DB_USER');
}
if (typeof dbPassword !== 'string') {
  missingCredentials.push('DB_PASSWORD');
}

let pool;

if (missingCredentials.length > 0) {
  const errorMessage = `Database configuration error: Missing required environment variable(s): ${missingCredentials.join(', ')}. Please configure backend/.env with your MySQL credentials.`;

  console.error(`\n[DATABASE CONFIGURATION ERROR] ${errorMessage}\n`);

  pool = {
    query: async () => {
      throw new Error(errorMessage);
    },
    execute: async () => {
      throw new Error(errorMessage);
    },
    getConnection: async () => {
      throw new Error(errorMessage);
    }
  };
} else {
  pool = mysql.createPool({
    host: dbHost,
    user: dbUser,
    password: dbPassword,
    database: dbName,
    port: dbPort,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
  });
}

export default pool;
