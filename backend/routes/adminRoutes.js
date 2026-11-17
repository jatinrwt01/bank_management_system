import express from 'express';
import {
  getCustomers,
  getCustomerById,
  updateCustomerStatus,
  getAllTransactions
} from '../controllers/adminController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import requireRole from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authMiddleware);
router.use(requireRole(['ADMIN']));

router.get('/customers', getCustomers);
router.get('/customers/:id', getCustomerById);
router.patch('/customers/:id/status', updateCustomerStatus);
router.get('/transactions', getAllTransactions);

export default router;
