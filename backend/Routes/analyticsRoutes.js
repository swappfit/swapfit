// File: routes/analyticsRoutes.js

import express from 'express';
import analyticsController from '../controllers/analyticsController.js';
import jwtAuth from '../middlewares/jwtAuth.js';

const router = express.Router();

router.use(jwtAuth);

// GET analytics for a specific gym owned by the logged-in user
router.get('/gym/:gymId', analyticsController.getGymAnalytics);

export default router;

