// src/routes/notificationRoutes.js
import express from 'express';
import * as notificationController from '../controllers/notificationController.js';
import { auth0Middleware } from '../middlewares/auth0Middleware.js';
import authGatekeeper from '../middlewares/authGatekeeper.js';
import roleAuth from '../middlewares/roleAuth.js'; // Assumes this middleware exists and works
import validate, { 
    registerTokenSchema, 
    sendGymNotificationSchema,
    notificationIdParamSchema,
    // New validators for admin routes
    sendToAllSchema,
    sendToRoleSchema,
    sendToUserSchema,
    sendToGymSchema
} from '../validators/notificationValidator.js';
import { auth } from 'express-oauth2-jwt-bearer';

const router = express.Router();

// =================================================================
// ADMIN-SPECIFIC ROUTES
// =================================================================

// Get all notifications in the system for the admin dashboard
router.get('/', 
    auth0Middleware,
    roleAuth('ADMIN'), // Only admins can see all notifications
    notificationController.getAllNotificationsForAdmin
);

// Send a notification to ALL users in the system
router.post(
    '/send-to-all',
    authGatekeeper,
    roleAuth('ADMIN'),
    validate(sendToAllSchema),
    notificationController.sendNotificationToAll
);

// Send a notification to all users with a specific role
router.post(
    '/send-to-role',
    authGatekeeper,
    roleAuth('ADMIN'),
    validate(sendToRoleSchema),
    notificationController.sendNotificationToRole
);

// Send a notification to a specific user by their database ID
router.post(
    '/send-to-user',
    authGatekeeper,
    roleAuth('ADMIN'),
    validate(sendToUserSchema),
    notificationController.sendNotificationToUserById
);

// Send a notification to all members of a specific gym (by Gym ID)
router.post(
    '/send-to-gym',
    authGatekeeper,
    roleAuth('ADMIN'),
    validate(sendToGymSchema),
    notificationController.sendNotificationToGymMembersAdmin
);

// Delete any notification by its ID
router.delete(
    '/:id',
    authGatekeeper,
    roleAuth('ADMIN'),
    validate(notificationIdParamSchema),
    notificationController.deleteNotificationAdmin
);


// =================================================================
// EXISTING MEMBER/GYM OWNER ROUTES (Unchanged)
// =================================================================

// Debug middleware to log request details
const debugMiddleware = (req, res, next) => {
    console.log('[Route Debug] Request headers:', JSON.stringify(req.headers, null, 2));
    console.log('[Route Debug] Request user before auth:', JSON.stringify(req.user, null, 2));
    next();
};

// --- Member Routes ---
router.get('/me', 
    debugMiddleware,
    auth0Middleware, 
    (req, res, next) => {
        console.log('[Route Debug] Request user after auth:', JSON.stringify(req.user, null, 2));
        next();
    },
    notificationController.getMyNotifications
);

router.post('/register-fcm', auth0Middleware, validate(registerTokenSchema), notificationController.registerFcmToken);

// --- Gym Owner Routes ---
router.post(
    '/gym/:gymId',
    auth0Middleware,
    roleAuth('GYM_OWNER'),
    validate(sendGymNotificationSchema),
    notificationController.sendNotificationToGymMembers
);

router.post(
  '/user/:userId',
  auth0Middleware,
  roleAuth('GYM_OWNER'),
  validate(sendGymNotificationSchema),
  notificationController.sendNotificationToUser
);

router.patch(
  '/:id/read',
  auth0Middleware,
  validate(notificationIdParamSchema),
  notificationController.markAsRead
);

// Note: The general delete route is now handled by the admin version above.
// If gym owners need to delete their own notifications, that logic would need to be separate.

export default router;