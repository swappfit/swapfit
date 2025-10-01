// src/services/subscriptionService.js

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

const getOrCreateChargebeeCustomer = async (userId) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found in our database', 404);

    if (user.chargebeeCustomerId) {
        console.log(`[SubscriptionService] Found existing Chargebee Customer ID: ${user.chargebeeCustomerId}`);
        return user.chargebeeCustomerId;
    }

    console.log(`[SubscriptionService] No Chargebee Customer ID found for user ${userId}. Creating a new one...`);
    const customerResult = await chargebee.customer.create({
        email: user.email,
        cf_internal_user_id: user.id 
    }).request();
    
    const customerId = customerResult.customer.id;
    await prisma.user.update({ where: { id: userId }, data: { chargebeeCustomerId: customerId } });
    console.log(`[SubscriptionService] Created new Chargebee Customer ID: ${customerId} and linked to user ${userId}`);
    
    return customerId;
};


// ✅✅✅ THIS IS THE FUNCTION WITH DETAILED LOGGING ✅✅✅
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
            planFromDb = await prisma.trainerPlan.findUnique({ where: { id: planId } });
        } else {
            throw new AppError('Invalid plan type specified.', 400);
        }
        
        if (!planFromDb) {
            throw new AppError(`Plan with your ID ${planId} was not found in our database.`, 404);
        }
        console.log("  -> SUCCESS: Found plan in DB:", planFromDb);

        if (!planFromDb.chargebeePlanId) {
            throw new AppError('This plan is not linked to a Chargebee plan ID. It cannot be purchased.', 404);
        }
        console.log(`  -> SUCCESS: Plan is linked to Chargebee ID: ${planFromDb.chargebeePlanId}`);

        console.log("STEP 2: Getting or creating Chargebee customer record...");
        const customerId = await getOrCreateChargebeeCustomer(userId);
        console.log(`  -> SUCCESS: Using Chargebee Customer ID: ${customerId}`);

        console.log("STEP 3: Calling Chargebee API to create Hosted Page...");
        const hostedPageResult = await chargebee.hosted_page.checkout_new_for_items({
            customer_id: customerId,
            subscription_items: [{ item_price_id: planFromDb.chargebeePlanId, quantity: 1 }],
            redirect_url: `${process.env.FRONTEND_URL}/dashboard?subscription=success`,
            cancel_url: `${process.env.FRONTEND_URL}/explore`,
        }).request();
        
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
        // Re-throw the error so the controller can send a proper HTTP response
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


export const processWebhook = async (rawPayload, headers) => {
    let event;
    
    // ✅✅✅ THE DEFINITIVE FIX IS HERE ✅✅✅
    const webhookSecret = process.env.CHARGEBEE_WEBHOOK_SECRET;

    if (webhookSecret) {
        // In PRODUCTION, we ALWAYS verify the signature.
        console.log('[Webhook] Verifying webhook signature...');
        event = chargebee.event.deserialize(
            rawPayload.toString(), 
            headers['x-chargebee-webhook-signature'], 
            webhookSecret
        );
        if (!event) {
            throw new AppError('Webhook signature verification failed.', 403);
        }
    } else {
        // In DEVELOPMENT, if no secret is provided, we trust the webhook but log a warning.
        console.warn('⚠️ [Webhook] SKIPPING SIGNATURE VERIFICATION. No CHARGEBEE_WEBHOOK_SECRET found. This is for DEVELOPMENT ONLY.');
        // We parse the JSON directly without verification.
        event = JSON.parse(rawPayload.toString());
    }
    
    const { content, event_type } = event;
    if (!content || !event_type) {
        throw new AppError('Invalid webhook payload structure.', 400);
    }

    const { subscription, customer } = content;

    console.log(`[Webhook] Received and processed: ${event_type} for subscription ${subscription.id}`);

    const user = await prisma.user.findUnique({ where: { chargebeeCustomerId: customer.id } });
    if (!user) {
        console.error(`Webhook error: User not found for Chargebee customer ID ${customer.id}`);
        return;
    }
    
    const planItemId = subscription.subscription_items[0].item_price_id;
    const gymPlan = await prisma.gymPlan.findFirst({ where: { chargebeePlanId: planItemId } });
    const trainerPlan = await prisma.trainerPlan.findFirst({ where: { chargebeePlanId: planItemId } });

    switch (event_type) {
        case 'subscription_created':
        case 'subscription_activated':
        case 'subscription_renewed': {
            await prisma.subscription.upsert({
                where: { chargebeeSubscriptionId: subscription.id },
                update: {
                    status: 'active',
                    endDate: new Date(subscription.current_term_end * 1000),
                },
                create: {
                    userId: user.id, status: 'active',
                    startDate: new Date(subscription.activated_at * 1000),
                    endDate: new Date(subscription.current_term_end * 1000),
                    chargebeeSubscriptionId: subscription.id,
                    gymPlanId: gymPlan ? gymPlan.id : null,
                    trainerPlanId: trainerPlan ? trainerPlan.id : null,
                }
            });
            console.log(`[Webhook] Successfully updated subscription for user ${user.id}`);
            break;
        }
        
        case 'subscription_cancelled':
        case 'subscription_expired': {
            await prisma.subscription.updateMany({
                where: { chargebeeSubscriptionId: subscription.id },
                data: {
                    status: 'cancelled',
                    endDate: new Date((subscription.cancelled_at || subscription.current_term_end) * 1000)
                }
            });
            console.log(`[Webhook] Cancelled subscription for user ${user.id}`);
            break;
        }
    }
};