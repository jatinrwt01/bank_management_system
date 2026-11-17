import './config/env.js';
import express from 'express';
import cors from 'cors';

import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import accountRoutes from './routes/accountRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import errorHandler from './middleware/errorHandler.js';
import { initDb } from './database/initDb.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({
    name: 'Online Bank Management System API',
    version: '1.0.0',
    endpoints: {
      healthCheck: '/api/health',
      authRegister: 'POST /api/auth/register',
      authLogin: 'POST /api/auth/login',
      accountProfile: 'GET /api/account/profile',
      accountDashboard: 'GET /api/account/dashboard',
      transactions: 'GET /api/transactions',
      transactionDeposit: 'POST /api/transactions/deposit',
      transactionWithdraw: 'POST /api/transactions/withdraw',
      transactionTransfer: 'POST /api/transactions/transfer'
    }
  });
});

app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/transactions', transactionRoutes);

app.use((req, res) => {
  res.status(404).json({
    status: 'fail',
    message: `Cannot find ${req.method} ${req.originalUrl} on this server`
  });
});

app.use(errorHandler);

initDb();

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

export default app;
