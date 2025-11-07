// src/routes/publicRoutes.js
import express from 'express';
import * as adminController from '../controllers/adminController.js';

const router = express.Router();

// Public route for multi-gym tiers (no authentication required)
router.get('/multi-gym-tiers', adminController.getMultiGymTiers);

export default router;