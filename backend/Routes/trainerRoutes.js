// src/routes/trainerRoutes.js
import express from 'express';
import * as trainerController from '../controllers/trainerController.js';
import authGatekeeper from '../middlewares/authGatekeeper.js';
import roleAuth from '../middlewares/roleAuth.js';

import validate, {
  browseTrainersSchema,
  trainerIdParamSchema,
  updateProfileSchema,
  createTrainingPlanSchema,
  updateTrainingPlanSchema,
  assignPlanSchema,
  planIdParamSchema,
  updateTrialSchema,
} from '../validators/trainerValidator.js';

const router = express.Router();

//================================================================
// 1. PUBLIC ROUTES (No authentication required)
//================================================================
router.get('/browse', validate(browseTrainersSchema), trainerController.getAllTrainers);
router.get('/profile/:id', validate(trainerIdParamSchema), trainerController.getTrainerById);
router.get('/id/:id', validate(trainerIdParamSchema), trainerController.getTrainerByTrainerId);

//================================================================
// APPLY AUTHENTICATION FOR ALL SUBSEQUENT ROUTES
//================================================================
router.use(authGatekeeper);

//================================================================
// 2. TRAINER-ONLY ROUTES (Requires 'TRAINER' role)
//================================================================
router.get('/profile/me', roleAuth('TRAINER'), trainerController.getMyProfile);
router.put('/profile/me', validate(updateProfileSchema), roleAuth('TRAINER'), trainerController.updateTrainerProfile);
router.get('/dashboard', roleAuth('TRAINER'), trainerController.getTrainerDashboard);
router.get('/subscribers', roleAuth('TRAINER'), trainerController.getSubscribedMembers);

// --- Subscription Plan Management (for selling) ---
router.patch('/subscription-plans/:planId/trial', validate(updateTrialSchema), roleAuth('TRAINER'), trainerController.updatePlanTrial);

// --- Training Plan Management (the workout templates) ---
const planRouter = express.Router();
planRouter.use(roleAuth('TRAINER'));

planRouter.post('/', validate(createTrainingPlanSchema), trainerController.createTrainingPlan);
planRouter.get('/', trainerController.getMyTrainingPlans);
planRouter.put('/:planId', validate(updateTrainingPlanSchema), trainerController.updateTrainingPlan);
planRouter.post('/assign', validate(assignPlanSchema), trainerController.assignPlanToMember);

router.use('/training-plans', planRouter);

//================================================================
// 3. ADDITIONAL ROUTES
//================================================================
router.post('/by-plan-ids', trainerController.getTrainersByPlanIds);

export default router;