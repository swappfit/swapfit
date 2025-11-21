// subscriptionService.js - Update to include trainer information
import { PrismaClient } from '@prisma/client';
import chargebeeModule from 'chargebee-typescript';
import AppError from '../utils/AppError.js';

const prisma = new PrismaClient();

const { ChargeBee } = chargebeeModule;
const chargebee = new ChargeBee();
chargebee.configure({
  site: process.env.CHARGEBEE_SITE, 
  api_key: process.env.CHARGEBEE_API_KEY
});

/**
 * Helper function to get predefined multi-gym tiers
 */
const getMultiGymTiers = async () => {
    return [
        {
            id: 'silver',
            name: 'Silver',
            price: 49.99,
            chargebeePlanId: process.env.CHARGEBEE_SILVER_PLAN_ID,
            description: 'Access to all Silver tier gyms',
            features: [
                'Access to all Silver tier gyms',
                'Basic amenities access',
                'Monthly fitness assessment'
            ]
        },
        {
            id: 'gold',
            name: 'Gold',
            price: 79.99,
            chargebeePlanId: process.env.CHARGEBEE_GOLD_PLAN_ID,
            description: 'Access to all Gold tier gyms',
            features: [
                'Access to all Gold tier gyms',
                'Premium amenities access',
                'Weekly fitness assessment',
                '1 personal training session per month'
            ]
        },
        {
            id: 'platinum',
            name: 'Platinum',
            price: 119.99,
            chargebeePlanId: process.env.CHARGEBEE_PLATINUM_PLAN_ID,
            description: 'Access to all Platinum tier gyms',
            features: [
                'Access to all Platinum tier gyms',
                'VIP amenities access',
                'Weekly fitness assessment',
                '2 personal training sessions per month',
                'Nutrition consultation'
            ]
        }
    ];
};

export const createCheckoutSession = async ({ userId, planId, planType }) => {
    console.log("--- Starting createCheckoutSession ---");
    console.log(`[Input] User ID: ${userId}`);
    console.log(`[Input] Plan ID (from our DB): ${planId}`);
    console.log(`[Input] Plan Type: ${planType}`);

    if (!userId || !planId || !planType) {
        throw new AppError('userId, planId, and planType are all required.', 400);
    }
    
    let planFromDb;
    try {
        console.log("STEP 1: Looking up plan in our database...");
        if (planType === 'GYM') {
            planFromDb = await prisma.gymPlan.findUnique({ where: { id: planId } });
        } else if (planType === 'TRAINER') {
            planFromDb = await prisma.trainerPlan.findUnique({ 
                where: { id: planId },
                include: {
                    trainer: {
                        include: {
                            user: {
                                include: {
                                    memberProfile: true
                                }
                            }
                        }
                    }
                }
            });
        } else if (planType === 'MULTI_GYM') { 
            if (['silver', 'gold', 'platinum'].includes(planId.toLowerCase())) {
                const tiers = await getMultiGymTiers();
                planFromDb = tiers.find(tier => tier.id.toLowerCase() === planId.toLowerCase());
                
                if (!planFromDb) {
                    throw new AppError(`Multi-gym tier ${planId} not found.`, 404);
                }
                
                planFromDb.id = planId.toLowerCase();
            } else {
                throw new AppError('Invalid multi-gym plan ID. Must be silver, gold, or platinum.', 400);
            }
        } else if (planType === 'MULTI_GYM_BROWSE') {
            planFromDb = { chargebeePlanId: null };
        } else {
            throw new AppError('Invalid plan type specified.', 400);
        }
        
        if (!planFromDb) {
            throw new AppError(`Plan with ID ${planId} was not found.`, 404);
        }
        console.log("  -> SUCCESS: Found plan in DB:", planFromDb);

        if (planType !== 'MULTI_GYM_BROWSE' && !planFromDb.chargebeePlanId) {
            throw new AppError('This plan is not linked to a Chargebee plan ID. It cannot be purchased.', 404);
        }
        console.log(`  -> SUCCESS: Plan is linked to Chargebee ID: ${planFromDb.chargebeePlanId || 'BROWSE'}`);

        console.log("STEP 2: Getting user from our database...");
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new AppError('User not found in our database.', 404);
        }
        console.log(`  -> SUCCESS: Found user: ${user.id} (${user.email})`);

        console.log("STEP 3: Calling Chargebee API to create Hosted Page...");
        
        let hostedPageRequest = {
            redirect_url: `${process.env.FRONTEND_URL}/dashboard?subscription=success`,
            cancel_url: `${process.env.FRONTEND_URL}/explore`,
            customer: {
                email: user.email,
                first_name: user.name ? user.name.split(' ')[0] : '',
                last_name: user.name ? user.name.split(' ').slice(1).join(' ') : '',
            }
        };
        
        if (planType === 'MULTI_GYM_BROWSE') {
            hostedPageRequest.embedded = false;
            hostedPageRequest.template_theme_id = process.env.CHARGEBEE_THEME_ID || null;
        } else {
            hostedPageRequest.subscription_items = [{ item_price_id: planFromDb.chargebeePlanId, quantity: 1 }];
        }
        
        const hostedPageResult = await chargebee.hosted_page.checkout_new_for_items(hostedPageRequest).request();
        
        console.log("  -> SUCCESS: Chargebee returned a hosted page URL.");
        console.log("--- createCheckoutSession Finished Successfully ---");
        return hostedPageResult.hosted_page.url;

    } catch (error) {
        console.error("🔥🔥🔥 ERROR in createCheckoutSession 🔥🔥🔥");
        if (error.type === 'chargebee') {
            console.error("  -> Chargebee API Error Details:", {
                message: error.message,
                api_error_code: error.api_error_code,
                param: error.param,
                http_status_code: error.http_status_code,
            });
        } else {
            console.error("  -> General Error Details:", error);
        }
        throw error;
    }
};

export const createPortalSession = async (userId) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.chargebeeCustomerId) {
        throw new AppError('Customer profile not found.', 404);
    }
    
    const portalSessionResult = await chargebee.portal_session.create({
        customer: { id: user.chargebeeCustomerId },
        redirect_url: `${process.env.FRONTEND_URL}/dashboard`
    }).request();

    return portalSessionResult.portal_session.access_url;
};

/* =========================================================
   NEW LOGIC: CREATE ORDER ON ONE-TIME INVOICE
   ========================================================= */
/**
 * FULL marketplace order creator based on invoice items
 * Works for one-time purchases (marketplace)
 */
async function createFullOrderFromInvoice(invoice) {
  try {
    console.log("🟦 createFullOrderFromInvoice() START for invoice:", invoice.id);

    // 1. CUSTOMER LOOKUP
    const user = await prisma.user.findFirst({
      where: { chargebeeCustomerId: invoice.customer_id }
    });

    if (!user) {
      console.error("❌ No user found for invoice:", invoice.customer_id);
      return;
    }

    console.log("🟩 User found:", user.id);

    // 2. GET CART ITEMS FOR THIS USER
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: user.id },
      include: {
        product: {
          include: {
            seller: true,
          }
        }
      }
    });

    if (!cartItems.length) {
      console.warn("⚠️ No cart items found — skipping order creation.");
      return;
    }

    console.log(`🛒 Found ${cartItems.length} cart item(s)`);

    // 3. CREATE ORDER
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        invoiceId: invoice.id,
        customerId: invoice.customer_id,
        totalAmount: invoice.amount_paid / 100,
        currencyCode: invoice.currency_code,
        status: "paid",
      }
    });

    console.log("🟩 Order created:", order.id);

    // 4. INSERT ORDER ITEMS
    const orderItemsData = cartItems.map(ci => ({
      orderId: order.id,
      productId: ci.productId,
      merchantId: ci.product.merchantId,
      quantity: ci.quantity,
      price: ci.product.price,
      subtotal: ci.product.price * ci.quantity
    }));

    await prisma.orderItem.createMany({
      data: orderItemsData
    });

    console.log("🟩 Order items created:", orderItemsData.length);

    // 5. CLEAR CART
    await prisma.cartItem.deleteMany({
      where: { userId: user.id }
    });

    console.log("🧹 Cart cleared for user:", user.id);

    // 6. RECORD PAYMENT TRANSACTION
    await prisma.transaction.create({
      data: {
        userId: user.id,
        orderId: order.id,
        amount: invoice.amount_paid / 100,
        currencyCode: invoice.currency_code,
        paymentProvider: "chargebee",
        paymentStatus: "success",
        referenceId: invoice.id,
      }
    });

    console.log("💳 Payment transaction stored.");

    return order;

  } catch (err) {
    console.error("❌ Full order creation FAILED:", err);
  }
}

export const processWebhook = async (payload) => {
    const { parsedBody, rawBody, headers } = payload;
    let event;

    try {
        const webhookSecret = process.env.CHARGEBEE_WEBHOOK_SECRET;

        // NOTE: For security, you should uncomment and set CHARGEBEE_WEBHOOK_SECRET in your .env
        // if (webhookSecret) {
        //   event = chargebee.event.deserialize(
        //     rawBody.toString(),
        //     headers['x-chargebee-webhook-signature'],
        //     webhookSecret
        //   );
        //   if (!event) {
        //     throw new AppError('Webhook signature verification failed.', 403);
        //   }
        // } else {
        //   console.warn('[Webhook] WARNING: CHARGEBEE_WEBHOOK_SECRET not set. Skipping signature verification.');
        //   event = parsedBody;
        // }
        
        // Temporarily skipping verification to debug, but you MUST fix this for production
        event = parsedBody;
        
        const { content, event_type } = event;
        if (!content || !event_type) {
            throw new AppError('Invalid webhook payload structure.', 400);
        }

        console.log(`[Webhook] Processing event: ${event_type}`);

        // --- Handle Customer Creation ---
        if (event_type === 'customer_created') {
            const customer = content.customer;
            if (customer.email) {
                const user = await prisma.user.findUnique({ where: { email: customer.email } });
                if (user) {
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { chargebeeCustomerId: customer.id }
                    });
                    console.log(`[Webhook] ✅ Linked Chargebee customer ID ${customer.id} to user ${user.id} (${user.email})`);
                } else {
                    console.warn(`[Webhook] WARNING: No user found with email ${customer.email} during customer_created event.`);
                }
            }
            return { success: true, message: `Processed customer creation` };
        }

        // --- Handle Invoice / One-time marketplace orders ---
        // NOTE: handle invoice_generated BEFORE subscription-only branch so it's not skipped
        if (event_type === 'invoice_generated') {
            const invoice = content.invoice;
            if (!invoice) {
                throw new AppError('invoice payload missing in invoice_generated event', 400);
            }

            console.log(`[Webhook] invoice_generated received for invoice id: ${invoice.id}`);
            // Determine if this invoice should create a marketplace order:
            // - If invoice is NOT linked to a subscription (invoice.subscription_id is falsy)
            // - OR invoice.recurring === false (explicitly not recurring)
            const isOneTime = !invoice.subscription_id || invoice.recurring === false;

            // Also ensure there are line_items to process
            if (isOneTime && Array.isArray(invoice.line_items) && invoice.line_items.length > 0) {
                try {
                    console.log(`[Webhook] Detected one-time invoice (create order). Calling processMarketplaceOrder for invoice ${invoice.id}`);
                    const order = await createFullOrderFromInvoice(invoice);
                    console.log(`[Webhook] ✅ Marketplace order created for invoice ${invoice.id}: order id ${order?.id || 'unknown'}`);
                    return { success: true, message: `Marketplace order created for invoice ${invoice.id}` };
                } catch (orderErr) {
                    console.error(`[Webhook] ❌ Failed to create marketplace order for invoice ${invoice.id}:`, orderErr);
                    // Do not throw here unless you want the webhook to be retried.
                    // Return failure so caller can handle retry behavior if desired.
                    throw new AppError(`Failed to create marketplace order: ${orderErr.message}`, 500);
                }
            } else {
                console.log(`[Webhook] Skipping order creation for invoice ${invoice.id} (isOneTime=${isOneTime}, line_items=${invoice.line_items?.length || 0})`);
                // still return success so webhook is acknowledged
                return { success: true, message: `Invoice ${invoice.id} received but not treated as one-time marketplace order` };
            }
        }

        // --- Handle Subscription Events ---
        const subscriptionEvents = [
            'subscription_created', 'subscription_activated', 'subscription_renewed',
            'subscription_cancelled', 'subscription_expired'
        ];

        if (!subscriptionEvents.includes(event_type)) {
            console.log(`[Webhook] Skipping unhandled event type: ${event_type}`);
            return { success: true, message: `Skipped event: ${event_type}` };
        }

        const subscription = content.subscription || {};
        const customer = content.customer || {};

        // STEP 1: Find the user in our database
        let user = await prisma.user.findUnique({
            where: { chargebeeCustomerId: customer.id }
        });

        if (!user) {
            console.warn(`[Webhook] User not found by chargebeeCustomerId ${customer.id}. Attempting lookup by email.`);
            if (customer.email) {
                user = await prisma.user.findUnique({ where: { email: customer.email } });
                if (user) {
                    // Link the customer ID for future webhooks
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { chargebeeCustomerId: customer.id }
                    });
                    console.log(`[Webhook] ✅ Found and linked user ${user.id} by email.`);
                } else {
                    throw new AppError(`User not found for customer ID ${customer.id} or email ${customer.email}`, 404);
                }
            } else {
                throw new AppError(`User not found for customer ID ${customer.id} and no email was provided.`, 404);
            }
        }
        console.log(`[Webhook] ✅ Found user: ${user.id} (${user.email})`);

        // STEP 2: Get the plan item ID from the subscription
        let planItemId = null;
        if (subscription.subscription_items && subscription.subscription_items.length > 0) {
            planItemId = subscription.subscription_items[0].item_price_id;
        }

        if (!planItemId) {
            throw new AppError('No plan item ID found in subscription.', 400);
        }
        console.log(`[Webhook] Plan Item ID from webhook: ${planItemId}`);

        // STEP 3: Find the corresponding plan in our database
        const [gymPlan, trainerPlan] = await Promise.all([
            prisma.gymPlan.findFirst({ where: { chargebeePlanId: planItemId } }),
            prisma.trainerPlan.findFirst({ where: { chargebeePlanId: planItemId } })
        ]);

        let multiGymTier = null;
        const tiers = await getMultiGymTiers();
        const matchedTier = tiers.find(tier => tier.chargebeePlanId === planItemId);
        
        if (matchedTier) {
            multiGymTier = {
                id: matchedTier.id,
                name: matchedTier.name,
                price: matchedTier.price,
                chargebeePlanId: matchedTier.chargebeePlanId
            };
        }

        console.log(`[Webhook] Plan lookup results: Gym Plan: ${!!gymPlan}, Trainer Plan: ${!!trainerPlan}, MultiGym Tier: ${!!multiGymTier}`);

        if (!gymPlan && !trainerPlan && !multiGymTier) {
            throw new AppError(`Plan not found in our database for Chargebee plan ID ${planItemId}.`, 404);
        }

        // STEP 4: Create or Update the subscription in our database
        if (['subscription_created', 'subscription_activated', 'subscription_renewed'].includes(event_type)) {
            let subscriptionData = {
                userId: user.id,
                status: subscription.status,
                startDate: new Date(subscription.activated_at * 1000),
                endDate: new Date(subscription.current_term_end * 1000),
                chargebeeSubscriptionId: subscription.id,
                gymPlanId: gymPlan?.id || null,
                trainerPlanId: trainerPlan?.id || null,
            };
            
            if (multiGymTier) {
                let existingTier = await prisma.multiGymTier.findFirst({
                    where: { chargebeePlanId: multiGymTier.chargebeePlanId }
                });
                
                if (!existingTier) {
                    existingTier = await prisma.multiGymTier.create({
                        data: {
                            name: multiGymTier.name,
                            price: multiGymTier.price,
                            chargebeePlanId: multiGymTier.chargebeePlanId
                        }
                    });
                    console.log(`[Webhook] ✅ Created new MultiGymTier: ${existingTier.name}`);
                }
                
                subscriptionData.multiGymTierId = existingTier.id;
            }

            console.log(`[Webhook] Preparing to upsert subscription with data:`, {
                userId: subscriptionData.userId,
                status: subscriptionData.status,
                chargebeeSubscriptionId: subscriptionData.chargebeeSubscriptionId,
                gymPlanId: subscriptionData.gymPlanId,
                trainerPlanId: subscriptionData.trainerPlanId,
                multiGymTierId: subscriptionData.multiGymTierId
            });
            
            await prisma.subscription.upsert({
                where: { chargebeeSubscriptionId: subscription.id },
                update: {
                    status: subscription.status,
                    endDate: new Date(subscription.current_term_end * 1000),
                },
                create: subscriptionData
            });
            console.log(`[Webhook] ✅ SUCCESS: Subscription ${subscription.id} upserted for user ${user.id}.`);
        }
        else if (['subscription_cancelled', 'subscription_expired'].includes(event_type)) {
            await prisma.subscription.updateMany({
                where: { chargebeeSubscriptionId: subscription.id },
                data: {
                    status: 'cancelled',
                    endDate: new Date((subscription.cancelled_at || subscription.current_term_end) * 1000)
                }
            });
            console.log(`[Webhook] ✅ SUCCESS: Subscription ${subscription.id} cancelled for user ${user.id}.`);
        }

        return { success: true, message: `Successfully processed ${event_type}` };

    } catch (error) {
        console.error(`[Webhook] ❌ CRITICAL ERROR processing webhook:`, error.message);
        // It's useful to see the full stack trace in development
        if (process.env.NODE_ENV === 'development') {
            console.error(error.stack);
        }
        throw error;
    }
};

// Export the getMultiGymTiers function for use in controllers
export { getMultiGymTiers };

// Get multi-gym subscriptions for a specific user
export const getMultiGymSubscriptions = async (userId) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                memberProfile: true,
                subscriptions: {
                    where: {
                        multiGymTierId: { not: null }
                    },
                    include: {
                        multiGymTier: true
                    }
                }
            },
            orderBy: {
                id: 'desc'
            }
        });

        if (!user) {
            throw new AppError('User not found', 404);
        }

        const allSubscriptions = [];
        
        if (user.subscriptions && user.subscriptions.length > 0) {
            user.subscriptions.forEach(subscription => {
                allSubscriptions.push({
                    ...subscription,
                    userId: user.id,
                    userEmail: user.email,
                    userName: user.memberProfile?.name || user.email?.split('@')[0] || 'Unknown',
                    userAvatar: (user.email || 'U')[0] + (user.email?.split('@')[0]?.[1] || 'N'),
                });
            });
        }
        
        return allSubscriptions;
    } catch (error) {
        console.error("Error fetching multi-gym subscriptions:", error);
        throw error;
    }
}

// Cancel subscription
export const cancelSubscription = async (subscriptionId) => {
    try {
        const subscription = await prisma.subscription.findUnique({
            where: { id: subscriptionId }
        });

        if (!subscription) {
            throw new AppError('Subscription not found', 404);
        }

        // Cancel in Chargebee if it has a chargebee subscription ID
        if (subscription.chargebeeSubscriptionId) {
            try {
                await chargebee.subscription.cancel(subscription.chargebeeSubscriptionId, {
                    end_of_term: true
                }).request();
                console.log(`[Subscription] Cancelled Chargebee subscription: ${subscription.chargebeeSubscriptionId}`);
            } catch (cbError) {
                console.error(`[Subscription] Failed to cancel Chargebee subscription:`, cbError);
                // Continue with local cancellation even if Chargebee fails
            }
        }

        // Update local subscription status
        const updatedSubscription = await prisma.subscription.update({
            where: { id: subscriptionId },
            data: {
                status: 'cancelled',
                cancelledAt: new Date()
            }
        });

        return updatedSubscription;
    } catch (error) {
        console.error("Error cancelling subscription:", error);
        throw error;
    }
}