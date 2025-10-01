// Routes/transactionRoutes.js
import express from 'express';
import * as transactionController from '../controllers/transactionController.js';
import jwtAuth from '../middlewares/jwtAuth.js';
import validate, { paginationSchema } from '../validators/transactionValidator.js';

const router = express.Router();

// All routes in this file require a user to be logged in.
router.use(jwtAuth);

/**
 * @route   GET /api/transactions/me
 * @desc    Get the logged-in user's paginated transaction history.
 * @access  Private (Authenticated User)
 */
router.get(
    '/me',
    validate(paginationSchema),
    transactionController.getMyTransactions
);

export default router;

