import express from 'express';
import {
  searchCustomers,
  getCustomerDetails,
  processDeposit,
  processWithdraw,
  getTransactions
} from '../controllers/employeeController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import requireRole from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authMiddleware);
router.use(requireRole(['EMPLOYEE', 'ADMIN']));

router.get('/customers', searchCustomers);
router.get('/customers/:accountNumber', getCustomerDetails);
router.post('/deposit', processDeposit);
router.post('/withdraw', processWithdraw);
router.get('/transactions', getTransactions);

export default router;
