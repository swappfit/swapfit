// src/Routes/trainingRoutes.js
import express from 'express';
import * as trainingController from '../controllers/trainingController.js';
import jwtAuth from '../middlewares/jwtAuth.js';
import validate, {
  createLogSchema,
  updateLogSchema,
  getLogsByDateSchema,
  logIdParamSchema
} from '../validators/trainingValidator.js';

const router = express.Router();

router.use(jwtAuth);

/**
 * @route   POST /api/training/logs
 * @desc    Log a new workout session
 * @access  Private
 */
router.post('/logs', validate(createLogSchema), trainingController.logWorkout);

/**
 * @route   GET /api/training/logs/date/:date
 * @desc    Get all workout sessions for a specific date
 * @access  Private
 */
router.get('/logs/date/:date', validate(getLogsByDateSchema), trainingController.getWorkoutsByDate);

/**
 * @route   PUT /api/training/logs/:logId
 * @desc    Update a workout session
 * @access  Private
 */
router.put('/logs/:logId', validate(updateLogSchema), trainingController.updateWorkout);

/**
 * @route   DELETE /api/training/logs/:logId
 * @desc    Delete a workout session
 * @access  Private
 */
router.delete('/logs/:logId', validate(logIdParamSchema), trainingController.deleteWorkout);

export default router;