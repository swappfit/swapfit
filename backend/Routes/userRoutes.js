// Routes/auth0UserRoutes.js
import express from 'express';
import * as userController from '../controllers/userController.js';
import { auth0Middleware } from '../middlewares/auth0Middleware.js';

const router = express.Router();

// Auth0 protected user routes
router.get('/profile', auth0Middleware, userController.getUserProfile);
router.get('/stats', auth0Middleware, userController.getUserStats);
router.put('/profile', auth0Middleware, userController.updateUserProfile);

export default router;


