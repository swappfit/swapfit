// src/routes/gymRoutes.js

import express from 'express';
import * as gymController from '../controllers/gymController.js';
import authGatekeeper from '../middlewares/authGatekeeper.js'; // Changed from jwtAuth to authGatekeeper
import roleAuth from '../middlewares/roleAuth.js';

// Import all validators
import validate, {
    getAllGymsSchema,
    gymIdParamSchema,
    planIdParamSchema,
    updateGymSchema,
    checkInSchema,
    checkOutSchema,
    gymAndTrainerIdSchema,
    createPlanSchema,
    updatePlanSchema
} from '../validators/gymValidator.js';

const router = express.Router();

//================================================================
// 1. PUBLIC ROUTES (No authentication required)
//================================================================
router.use((req, res, next) => {
  console.log('[gymRoutes] hit: ', req.method, req.path);
  next();
});
router.get('/discover', validate(getAllGymsSchema), gymController.getAllGyms);
router.get('/profile/:id', validate(gymIdParamSchema), gymController.getGymById);
router.get('/:gymId/plans', gymController.getGymPlans); // gymId param validation could be added
router.get('/:gymId/trainers', gymController.getAssignedTrainers);

// ✅ ADD THIS NEW PUBLIC ROUTE
router.post('/by-plan-ids', gymController.getGymsByPlanIds);


//================================================================
// APPLY AUTHENTICATION FOR ALL SUBSEQUENT ROUTES
//================================================================
router.use(authGatekeeper); // Changed from jwtAuth to authGatekeeper


//================================================================
// 2. GENERAL MEMBER ROUTES (Requires any authenticated user)
//================================================================
router.post('/check-in', validate(checkInSchema), gymController.checkIn);
router.patch('/check-out/:checkInId', validate(checkOutSchema), gymController.checkOut);
// NOTE: Subscribing to a plan is a separate concern.
// The route POST /api/subscriptions should handle this, not gymRoutes.


//================================================================
// 3. GYM OWNER ROUTES (Requires 'GYM_OWNER' role)
//================================================================
const ownerRouter = express.Router(); // Create a sub-router for owner routes
ownerRouter.use(roleAuth('GYM_OWNER')); // Apply role protection to the entire sub-router

ownerRouter.get('/my-profile', gymController.getMyGymProfile);
ownerRouter.get('/members', gymController.getGymMembers);
// --- Dashboard & Profile ---
ownerRouter.get('/dashboard', gymController.getOwnerDashboard);
ownerRouter.put('/:id', validate(updateGymSchema), gymController.updateGym);

// --- Member & Trainer Management ---
ownerRouter.get('/members', gymController.getGymMembers); 
ownerRouter.post('/:gymId/trainers/assign', validate(gymAndTrainerIdSchema), gymController.assignTrainer);
ownerRouter.post('/:gymId/trainers/unassign', validate(gymAndTrainerIdSchema), gymController.unassignTrainer);

// --- Plan Management ---
ownerRouter.post('/:gymId/plans', validate(createPlanSchema), gymController.createGymPlan);
ownerRouter.put('/plans/:planId', validate(updatePlanSchema), gymController.updateGymPlan);
ownerRouter.delete('/plans/:planId', validate(planIdParamSchema), gymController.deleteGymPlan);

// Mount the protected owner router
router.use('/owner', ownerRouter);


export default router;