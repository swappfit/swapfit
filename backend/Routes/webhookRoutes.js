// File: routes/webhookRoutes.js
import express from 'express';
import webhookController from '../controllers/webhookController.js';
const router = express.Router();

// This endpoint must not have the jwtAuth middleware, as it's called by an external service (Chargebee).
// It will be exposed publicly, but secured by signature verification inside the controller.
router.post('/chargebee', express.json(), webhookController.handleChargebeeWebhook);

export default router;

