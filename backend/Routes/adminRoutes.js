// Routes/adminRoutes.js
import express from 'express';
import jwtAuth from '../middlewares/jwtAuth.js';
import adminAuth from '../middlewares/adminAuth.js';
import * as adminController from '../controllers/adminController.js';

// ✅ CORRECTED: Import from the new, dedicated admin validator file.
import validate, {
    updateGymStatusSchema,
    updateGymBadgesSchema,
    createChallengeSchema,
    updateChallengeSchema,
    challengeIdParamSchema,
    broadcastNotificationSchema
} from '../validators/adminValidator.js';

const router = express.Router();

// Protect all admin routes
router.use(jwtAuth, adminAuth);

// --- Gym Management by Admin ---
router.get('/gyms/pending', adminController.getPendingGyms);
router.patch('/gyms/:gymId/status', validate(updateGymStatusSchema), adminController.updateGymStatus);
router.patch('/gyms/:gymId/badges', validate(updateGymBadgesSchema), adminController.updateGymBadges);

// --- User Management by Admin ---
router.get('/users', adminController.getUsers);

// --- Admin Schedules (placeholder) ---
router.get('/schedules', adminController.getSchedules);



// --- Notification Management by Admin ---
router.post(
    '/notifications/broadcast',
    validate(broadcastNotificationSchema),
    adminController.sendBroadcastNotification
);

export default router;

