// src/routes/subscriptionRoutes.js

import express from 'express';
import * as subscriptionController from '../controllers/subscriptionController.js';
import authGatekeeper from '../middlewares/authGatekeeper.js';

const router = express.Router();

// This public endpoint is for Chargebee to send updates to.
// It must come BEFORE any global JSON parsers if they interfere with raw bodies.
router.post(
    '/webhooks/chargebee', 
    express.raw({type: 'application/json'}), // Use express.raw to get the raw buffer for signature verification
    subscriptionController.handleChargebeeWebhook
);

// All other subscription routes are for authenticated users.
router.use(authGatekeeper);

// POST /api/subscriptions/create-checkout-session
// A member uses this to start the subscription process for a specific Gym or Trainer plan.
router.post('/create-checkout-session', subscriptionController.createCheckoutSession);

// GET /api/subscriptions/portal-session
// A member uses this to manage their existing subscriptions (e.g., cancel, update card).
router.post('/portal-session', subscriptionController.createPortalSession);

export default router;