import express from 'express';
import * as workoutController from '../controllers/workoutController.js';
import validate, {
    logSessionSchema,
    getHistorySchema,
    sessionIdParamSchema,
    deleteExerciseSchema,
} from '../validators/workoutValidator.js';
import { auth0Middleware } from '../middlewares/auth0Middleware.js';

const router = express.Router();

router.post('/sessions', auth0Middleware, validate(logSessionSchema), workoutController.logWorkoutSession);
router.get('/sessions', auth0Middleware, validate(getHistorySchema), workoutController.getWorkoutHistory);
router.delete('/sessions/:sessionId', auth0Middleware, validate(sessionIdParamSchema), workoutController.deleteWorkoutSession);
router.delete('/sessions/:sessionId/exercises/:exerciseId', auth0Middleware, validate(deleteExerciseSchema), workoutController.deleteExerciseFromSession);

export default router;