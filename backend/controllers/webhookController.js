import crypto from 'crypto';
import * as orderService from '../services/orderService.js';
import catchAsync from '../utils/catchAsync.js';

export const handleChargebeeWebhook = catchAsync(async (req, res) => {
  const webhookBody = req.body;
  
  // ✅ IMPORTANT: Find the signature in the headers. The name can vary.
  const signature = req.headers['x-chargebee-signature'] || req.headers['x-chargebee-webhook-signature'];
  
  // --- SECURITY: Verify the Webhook Signature ---
  // This ensures the request is genuinely from Chargebee and not a malicious actor.
  if (!signature) {
    console.error('[WEBHOOK] Signature missing.');
    return res.status(400).send('Webhook signature missing.');
  }

  // Create the expected signature using the secret from your Chargebee dashboard
  const expectedSignature = crypto
    .createHmac('sha256', process.env.CHARGEBEE_WEBHOOK_SECRET)
    .update(JSON.stringify(webhookBody))
    .digest('hex');

  if (signature !== expectedSignature) {
    console.error('[WEBHOOK] Invalid signature.');
    return res.status(401).send('Invalid signature.');
  }

  console.log(`[WEBHOOK] ✅ Signature verified. Received event: ${webhookBody.event_type}`);

  // --- Handle the Specific Event ---
  // We only care about the 'invoice_paid' event for now.
  if (webhookBody.event_type === 'invoice_paid') {
    const invoice = webhookBody.content.invoice;
    await orderService.createOrderFromPaidInvoice(invoice);
  } else {
    console.log(`[WEBHOOK] Ignoring unhandled event type: ${webhookBody.event_type}`);
  }

  // ✅ CRITICAL: Respond to Chargebee immediately.
  // Chargebee expects a 2xx status code within a few seconds. If it doesn't get one,
  // it will assume the delivery failed and will try to resend the webhook later.
  res.status(200).send('OK');
});