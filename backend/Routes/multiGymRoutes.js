// Routes/multiGymRoutes.js
import express from 'express';
import * as multiGymController from '../controllers/multiGymController.js';
import jwtAuth from '../middlewares/jwtAuth.js';
import adminAuth from '../middlewares/adminAuth.js';
import validate, {
nearbyGymsSchema,
createTierSchema,
updateTierSchema,
tierIdParamSchema,
assignGymSchema
} from '../validators/multiGymValidator.js';
const router = express.Router();
// --- Public/Member Routes ---
// Anyone can view the available tiers
router.get('/tiers', multiGymController.getAllTiers);
router.get('/tiers/:tierId', validate(tierIdParamSchema), multiGymController.getTierDetails);
// Only a logged-in member can find nearby gyms in their tier
router.get('/nearby', jwtAuth, validate(nearbyGymsSchema), multiGymController.getNearbyGymsInTier);
// --- Admin-Only Routes for Tier Management ---
const adminRouter = express.Router();
adminRouter.use(jwtAuth, adminAuth);
adminRouter.post('/tiers', validate(createTierSchema), multiGymController.createTier);
adminRouter.patch('/tiers/:tierId', validate(tierIdParamSchema), validate(updateTierSchema), multiGymController.updateTier);
adminRouter.delete('/tiers/:tierId', validate(tierIdParamSchema), multiGymController.deleteTier);
adminRouter.post('/tiers/assign-gym', validate(assignGymSchema), multiGymController.assignGymToTier);
adminRouter.post('/tiers/remove-gym', validate(assignGymSchema), multiGymController.removeGymFromTier); // Reuses schema
// Mount the admin sub-router
router.use('/admin', adminRouter);
export default router;

