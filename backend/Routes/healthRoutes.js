// Routes/healthRoutes.js
import express from 'express';
import * as healthController from '../controllers/healthController.js';
import jwtAuth from '../middlewares/jwtAuth.js';
import validate, { syncDataSchema } from '../validators/healthValidator.js';

const router = express.Router();

// All health routes must be for an authenticated user
router.use(jwtAuth);

/**
 * @route   POST /api/health/sync
 * @desc    A single, powerful endpoint for all incoming health data batches.
 * @access  Private
 */
router.post(
  '/sync',
  validate(syncDataSchema),
  healthController.syncHealthData
);

/**
 * @route   GET /api/health/sync/timestamps
 * @desc    Get the last successful sync time for each data type.
 * @access  Private
 */
router.get(
    '/sync/timestamps',
    healthController.getLastSyncTimestamps
);


export default router;

