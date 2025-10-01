// Routes/notificationRoutes.js
import express from 'express';
import * as notificationController from '../controllers/notificationController.js';
import { auth0Middleware } from '../middlewares/auth0Middleware.js';
import roleAuth from '../middlewares/roleAuth.js';
import validate, { 
    registerTokenSchema, 
    sendGymNotificationSchema,
    notificationIdParamSchema
} from '../validators/notificationValidator.js';

const router = express.Router();

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

router.delete(
  '/:id',
  auth0Middleware,
  validate(notificationIdParamSchema),
  notificationController.deleteNotification
);

export default router;