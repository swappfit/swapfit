// Routes/challengeRoutes.js
import express from 'express';
import * as challengeController from '../controllers/challengeController.js';
import jwtAuth from '../middlewares/jwtAuth.js';
import roleAuth from '../middlewares/roleAuth.js';
import validate, {
    challengeIdParamSchema,
    paginationSchema,
    createChallengeSchema,
} from '../validators/challengeValidator.js';

const router = express.Router();

// --- Public Routes ---
router.get('/', validate(paginationSchema), challengeController.getAllChallenges);
router.get('/:id', validate(challengeIdParamSchema), challengeController.getChallengeDetails);

// --- Protected Member Actions ---
router.post('/:id/join', jwtAuth, validate(challengeIdParamSchema), challengeController.joinChallenge);
router.post('/:id/leave', jwtAuth, validate(challengeIdParamSchema), challengeController.leaveChallenge);

// --- Protected Creator/Admin Actions ---
router.post(
    '/',
    jwtAuth,
    roleAuth('GYM_OWNER', 'TRAINER', 'ADMIN'), // Only these roles can create
    validate(createChallengeSchema),
    challengeController.createChallenge
);

router.delete(
    '/:id',
    jwtAuth,
    validate(challengeIdParamSchema),
    challengeController.deleteChallenge // Permission check is in the service
);

export default router;

