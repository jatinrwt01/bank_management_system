import pool from '../config/db.js';

export const getHealth = async (req, res) => {
  try {
    const [result] = await pool.query('SELECT 1 AS status');

    return res.status(200).json({
      status: 'success',
      message: 'Server and MySQL database are healthy and connected.',
      data: {
        server: 'online',
        database: 'connected',
        queryCheck: result[0]?.status === 1 ? 'ok' : 'unexpected',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    const errorMessage = error.message || error.code || 'Database connection failed';

    return res.status(503).json({
      status: 'error',
      message: 'Server is running, but MySQL connection failed.',
      data: {
        server: 'online',
        database: 'disconnected',
        error: errorMessage,
        timestamp: new Date().toISOString()
      }
    });
  }
};
