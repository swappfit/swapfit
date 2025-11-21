// src/routes/subscriptionRoutes.js
import express from 'express';
import * as subscriptionController from '../controllers/subscriptionController.js';
import authGatekeeper from '../middlewares/authGatekeeper.js';

const router = express.Router();

// This public endpoint is for Chargebee to send updates to.
// It must come BEFORE any global JSON parsers if they interfere with raw bodies.
router.post(
    '/webhooks/chargebee', 
    express.raw({type: 'application/json'}), // Use express.raw to get raw buffer for signature verification
    subscriptionController.handleChargebeeWebhook
);

// All other subscription routes are for authenticated users.
router.use(authGatekeeper);

// NEW: Admin endpoint to fetch all subscriptions
router.get('/admin/all-subscriptions', subscriptionController.getAllSubscriptions);

// POST /api/subscriptions/create-checkout-session
// A member uses this to start the subscription process for a specific Gym or Trainer plan.
router.post('/create-checkout-session', subscriptionController.createCheckoutSession);

// POST /api/subscriptions/portal-session
// A member uses this to manage their existing subscriptions (e.g., cancel, update card).
router.post('/portal-session', subscriptionController.createPortalSession);

// POST /api/subscriptions/purchase-multi-gym
// Purchase multi-gym tier subscription
router.post('/purchase-multi-gym', subscriptionController.purchaseMultiGymTier);

// GET /api/subscriptions/user/multi-gym
// Get user's multi-gym subscriptions
router.get('/user/multi-gym', subscriptionController.getUserMultiGymSubscriptions);

// PATCH /api/subscriptions/:subscriptionId/cancel
// Cancel subscription
router.patch('/:subscriptionId/cancel', subscriptionController.cancelSubscription);

export default router;