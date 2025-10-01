// File: controllers/webhookController.js

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const webhookController = {
  /**
   * ✅ NEW: Handles all incoming webhooks from Chargebee.
   * This is the single source of truth for subscription state changes.
   */
  handleChargebeeWebhook: async (req, res) => {
    // ⭐️ SECURITY: In a real application, the first step is to verify
    // that the webhook request is genuinely from Chargebee.
    // This usually involves checking a signature in the request headers.
    
    const event = req.body;
    console.log(`Received Chargebee Webhook: ${event.event_type}`);

    try {
      switch (event.event_type) {
        case 'subscription_created':
        case 'subscription_reactivated': {
          const { subscription, customer } = event.content;
          const user = await prisma.user.findUnique({ where: { chargebeeCustomerId: customer.id } });
          if (!user) throw new Error(`User not found for Chargebee customer ${customer.id}`);

          // Find our internal plan ID from the Chargebee plan ID
          const planItem = subscription.subscription_items[0];
          const plan = await prisma.gymPlan.findUnique({ where: { chargebeePlanId: planItem.item_price_id } }) ||
                       await prisma.trainerPlan.findUnique({ where: { chargebeePlanId: planItem.item_price_id } });
          
          if (!plan) throw new Error(`Plan not found for Chargebee plan ${planItem.item_price_id}`);

          await prisma.subscription.create({
            data: {
              userId: user.id,
              chargebeeSubscriptionId: subscription.id,
              status: subscription.status, // "active" or "trialing"
              startDate: new Date(subscription.start_date * 1000),
              endDate: new Date(subscription.current_term_end * 1000),
              gymPlanId: plan.gymId ? plan.id : null,
              trainerPlanId: plan.trainerProfileId ? plan.id : null,
            },
          });
          break;
        }

        case 'subscription_renewed': {
          const { subscription } = event.content;
          await prisma.subscription.update({
            where: { chargebeeSubscriptionId: subscription.id },
            data: {
              status: subscription.status, // should be 'active'
              endDate: new Date(subscription.current_term_end * 1000), // The new end date
            },
          });
          break;
        }

        case 'subscription_cancelled': {
          const { subscription } = event.content;
          await prisma.subscription.update({
            where: { chargebeeSubscriptionId: subscription.id },
            data: {
              status: 'cancelled',
              endDate: new Date(subscription.cancelled_at * 1000),
            },
          });
          break;
        }

        default:
          console.log(`Unhandled event type: ${event.event_type}`);
      }

      res.status(200).send('Webhook processed.');
    } catch (err) {
      console.error(`Error processing webhook ${event.id}:`, err);
      // Return a 500 error to signal to Chargebee that it should retry sending the webhook.
      res.status(500).json({ success: false, message: 'Failed to process webhook.' });
    }
  },
};

export default webhookController;

