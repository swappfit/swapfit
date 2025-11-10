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
    broadcastNotificationSchema,
    // ✅ UPDATED: Validator for assigning predefined tiers
    assignGymToTierSchema
} from '../validators/adminValidator.js';
import authGatekeeper from '../middlewares/authGatekeeper.js';

const router = express.Router();

// Protect all admin routes
router.use(authGatekeeper, adminAuth);

// --- Gym Management by Admin ---
router.get('/gyms/pending', adminController.getPendingGyms);
router.patch('/gyms/:gymId/status', validate(updateGymStatusSchema), adminController.updateGymStatus);
router.patch('/gyms/:gymId/badges', validate(updateGymBadgesSchema), adminController.updateGymBadges);

// --- User Management by Admin ---
router.get('/users', adminController.getUsers);
router.get('/users/stats', adminController.getUserStats);
router.get('/users-with-subscriptions', adminController.getUsersWithSubscriptions);

// --- Admin Schedules (placeholder) ---
router.get('/schedules', adminController.getSchedules);

// --- Notification Management by Admin ---
router.post(
    '/notifications/broadcast',
    validate(broadcastNotificationSchema),
    adminController.sendBroadcastNotification
);

// --- ✅ UPDATED: Multi-Gym Tier Management ---
// Route to get the predefined multi-gym tiers (Silver, Gold, Platinum)
router.get('/multi-gym-tiers', adminController.getMultiGymTiers);
// Route to assign a predefined tier to a gym
router.patch('/gyms/:gymId/assign-tier', validate(assignGymToTierSchema), adminController.assignGymToTier);

// --- Subscription Management by Admin ---
router.get('/all-subscriptions', adminController.getAllSubscriptions);
router.get('/multi-gym-subscriptions', adminController.getMultiGymSubscriptions);
router.get('/subscriptions/:subscriptionId', adminController.getSubscriptionById);
router.patch('/subscriptions/:subscriptionId/cancel', adminController.cancelUserSubscription);
router.get('/subscription-stats', adminController.getSubscriptionStats);

// --- Transaction Management by Admin ---
router.get('/transactions', adminController.getAllTransactions);

// --- Plan Management by Admin ---
router.get('/plans', adminController.getAllPlans);

// --- Gym Management by Admin ---
router.get('/gyms', adminController.getAllGyms);

// --- Dashboard Stats by Admin ---
router.get('/dashboard', adminController.getAdminDashboard);

export default router;