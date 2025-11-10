// src/routes/productRoutes.js

import express from 'express';
import * as publicProductController from '../controllers/productController.js';


import authGatekeeper from '../middlewares/authGatekeeper.js';

const router = express.Router();

// ✅ APPLY THE MIDDLEWARE TO ALL ROUTES IN THIS FILE
// This means every request to /api/products will now require a valid JWT.
router.use(authGatekeeper);

// --- Public Marketplace Routes (Now Protected) ---

// GET /api/products -> Gets all products from ALL merchants for the marketplace
router.get('/', publicProductController.getAllPublicProducts);

// GET /api/products/:productId -> Gets a single product's details
router.get('/:productId', publicProductController.getPublicProductById);

export default router;