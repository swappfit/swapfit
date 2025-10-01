// Routes/trainerRoutes.js

import express from 'express';
import * as trainerController from '../controllers/trainerController.js';
import jwtAuth from '../middlewares/jwtAuth.js';
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


//================================================================
// APPLY JWT AUTHENTICATION FOR ALL SUBSEQUENT ROUTES
//================================================================
router.use(jwtAuth);


//================================================================
// 2. TRAINER-ONLY ROUTES (Requires 'TRAINER' role)
//================================================================
// All routes in this section are automatically protected by jwtAuth and roleAuth('TRAINER')
router.put('/profile/me', validate(updateProfileSchema), roleAuth('TRAINER'), trainerController.updateTrainerProfile);
router.get('/dashboard', roleAuth('TRAINER'), trainerController.getTrainerDashboard);
router.get('/subscribers', roleAuth('TRAINER'), trainerController.getSubscribedMembers);

// --- Subscription Plan Management (for selling) ---
router.patch('/subscription-plans/:planId/trial', validate(updateTrialSchema), roleAuth('TRAINER'), trainerController.updatePlanTrial);

// --- Training Plan Management (the workout templates) ---
const planRouter = express.Router(); // Sub-router for cleaner organization
planRouter.use(roleAuth('TRAINER'));

planRouter.post('/', validate(createTrainingPlanSchema), trainerController.createTrainingPlan);
planRouter.get('/', trainerController.getMyTrainingPlans); // No validation needed
planRouter.put('/:planId', validate(updateTrainingPlanSchema), trainerController.updateTrainingPlan);
planRouter.post('/assign', validate(assignPlanSchema), trainerController.assignPlanToMember);

router.use('/training-plans', planRouter);


export default router;

