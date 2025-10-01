// src/routes/merchantRoutes.js

import express from 'express';
import * as merchantController from '../controllers/merchantController.js';
import authGatekeeper from '../middlewares/authGatekeeper.js';
import roleAuth from '../middlewares/roleAuth.js'; // Assuming you have a role-checking middleware

const router = express.Router();

// ✅ Protect all routes and ensure the user has the 'MERCHANT' role.
router.use(authGatekeeper, roleAuth('MERCHANT'));

// --- Product Management for the Logged-in Merchant ---
// POST /api/merchant/products -> Creates a new product for THIS merchant
router.post('/products', merchantController.createMyProduct);

// GET /api/merchant/products -> Gets all products for THIS merchant
router.get('/products', merchantController.getMyProducts);

// PUT /api/merchant/products/:productId -> Updates one of THIS merchant's products
router.put('/products/:productId', merchantController.updateMyProduct);

// DELETE /api/merchant/products/:productId -> Deletes one of THIS merchant's products
router.delete('/products/:productId', merchantController.deleteMyProduct);

// --- Order Management for the Logged-in Merchant ---
// GET /api/merchant/orders -> Gets all orders for THIS merchant


export default router;