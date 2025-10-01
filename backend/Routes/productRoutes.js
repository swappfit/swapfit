// src/routes/productRoutes.js

import express from 'express';
import * as publicProductController from '../controllers/productController.js';

const router = express.Router();

// --- Public Marketplace Routes ---

// GET /api/products -> Gets all products from ALL merchants for the marketplace
router.get('/', publicProductController.getAllPublicProducts);

// GET /api/products/:productId -> Gets a single product's details
router.get('/:productId', publicProductController.getPublicProductById);

export default router;