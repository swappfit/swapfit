import express from 'express';
import { handleChargebeeWebhook } from '../controllers/webhookController.js';

const router = express.Router();

router.post('/chargebee', handleChargebeeWebhook);

export default router;