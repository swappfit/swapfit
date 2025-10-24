// src/routes/userRoutes.js
import express from 'express';
import * as userController from '../controllers/userController.js';
import authGatekeeper from '../middlewares/authGatekeeper.js'; // Changed from jwtAuth to authGatekeeper

const router = express.Router();

// All user routes require authentication
router.use(authGatekeeper); // Changed from jwtAuth to authGatekeeper

// Profile routes
router.get('/profile', userController.getMyProfile);
router.put('/profile', userController.updateMyProfile);
router.post('/change-password', userController.changePassword);

// Check-ins route
router.get('/check-ins', userController.getUserCheckIns);

// Stats route
router.get('/stats', userController.getUserStats);

export default router;