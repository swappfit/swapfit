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

        console.log("STEP 2: Getting user from our database...");
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new AppError('User not found in our database.', 404);
        }
        console.log(`  -> SUCCESS: Found user: ${user.id} (${user.email})`);

        console.log("STEP 3: Calling Chargebee API to create Hosted Page...");
        // Create a hosted page without specifying a customer ID
        // Chargebee will create a new customer automatically
        const hostedPageResult = await chargebee.hosted_page.checkout_new_for_items({
            subscription_items: [{ item_price_id: planFromDb.chargebeePlanId, quantity: 1 }],
            redirect_url: `${process.env.FRONTEND_URL}/dashboard?subscription=success`,
            cancel_url: `${process.env.FRONTEND_URL}/explore`,
            // Pass customer information to pre-fill the form
            customer: {
                email: user.email,
                first_name: user.name ? user.name.split(' ')[0] : '',
                last_name: user.name ? user.name.split(' ').slice(1).join(' ') : '',
            }
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
    console.log('[Webhook] Starting to process webhook...');
    console.log('[Webhook] Raw payload type:', typeof rawPayload);
    
    let event;
    
    try {
        const webhookSecret = process.env.CHARGEBEE_WEBHOOK_SECRET;

        if (webhookSecret) {
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
            console.warn('⚠️ [Webhook] SKIPPING SIGNATURE VERIFICATION. No CHARGEBEE_WEBHOOK_SECRET found. This is for DEVELOPMENT ONLY.');
            
            // Check if rawPayload is already an object (parsed by Express body-parser)
            let payloadString;
            if (typeof rawPayload === 'string') {
                payloadString = rawPayload;
            } else if (typeof rawPayload === 'object') {
                payloadString = JSON.stringify(rawPayload);
            } else {
                throw new AppError('Invalid payload type. Expected string or object.', 400);
            }
            
            event = JSON.parse(payloadString);
        }
        
        console.log(`[Webhook] Successfully parsed event. Type: ${event.event_type}`);
    } catch (parseError) {
        console.error('[Webhook] Error parsing webhook:', parseError);
        throw new AppError(`Failed to parse webhook: ${parseError.message}`, 400);
    }
    
    const { content, event_type } = event;
    if (!content || !event_type) {
        console.error('[Webhook] Invalid webhook payload structure:', event);
        throw new AppError('Invalid webhook payload structure.', 400);
    }

    console.log(`[Webhook] Processing event: ${event_type}`);

    // Extract subscription and customer from content
    const subscription = content.subscription || {};
    const customer = content.customer || {};

    // Only process subscription-related events
    const subscriptionEvents = [
        'subscription_created',
        'subscription_activated',
        'subscription_renewed',
        'subscription_cancelled',
        'subscription_expired'
    ];

    if (!subscriptionEvents.includes(event_type)) {
        console.log(`[Webhook] Skipping non-subscription event: ${event_type}`);
        return { success: true, message: `Skipped non-subscription event: ${event_type}` };
    }

    try {
        console.log(`[Webhook] Processing subscription event: ${event_type} for subscription ${subscription.id}`);
        console.log(`[Webhook] Customer ID: ${customer.id}`);
        console.log(`[Webhook] Subscription Status: ${subscription.status}`);

        // Find user by Chargebee customer ID
        let user = await prisma.user.findUnique({ 
            where: { chargebeeCustomerId: customer.id } 
        });

        if (!user) {
            console.log(`[Webhook] User not found for Chargebee customer ID ${customer.id}`);
            
            // Try to find the user by email as a fallback
            if (customer.email) {
                console.log(`[Webhook] Trying to find user by email: ${customer.email}`);
                const userByEmail = await prisma.user.findUnique({ 
                    where: { email: customer.email } 
                });
                
                if (userByEmail) {
                    console.log(`[Webhook] Found user by email: ${userByEmail.id}. Updating Chargebee customer ID.`);
                    await prisma.user.update({ 
                        where: { id: userByEmail.id }, 
                        data: { chargebeeCustomerId: customer.id } 
                    });
                    
                    // Use the found user
                    user = userByEmail;
                } else {
                    console.error(`[Webhook] User not found by email either: ${customer.email}`);
                    return { success: false, message: `User not found for customer ID ${customer.id}` };
                }
            } else {
                console.error(`[Webhook] No email in customer data`);
                return { success: false, message: `User not found for customer ID ${customer.id}` };
            }
        }

        console.log(`[Webhook] Found user: ${user.id} (${user.email})`);

        // Extract plan information
        let planItemId = null;
        if (subscription.subscription_items && subscription.subscription_items.length > 0) {
            planItemId = subscription.subscription_items[0].item_price_id;
        }

        if (!planItemId) {
            console.error(`[Webhook] No plan item ID found in subscription ${subscription.id}`);
            return { success: false, message: 'No plan item ID found in subscription' };
        }

        console.log(`[Webhook] Plan Item ID: ${planItemId}`);

        // Find the plan in our database
        const gymPlan = await prisma.gymPlan.findFirst({ 
            where: { chargebeePlanId: planItemId } 
        });
        
        const trainerPlan = await prisma.trainerPlan.findFirst({ 
            where: { chargebeePlanId: planItemId } 
        });

        if (!gymPlan && !trainerPlan) {
            console.error(`[Webhook] Plan not found in our database for Chargebee plan ID ${planItemId}`);
            return { success: false, message: `Plan not found for Chargebee plan ID ${planItemId}` };
        }

        console.log(`[Webhook] Found plan: ${gymPlan ? 'Gym Plan' : 'Trainer Plan'} - ${gymPlan ? gymPlan.name : trainerPlan.name}`);

        // Process subscription based on event type
        if (event_type === 'subscription_created' || 
            event_type === 'subscription_activated' || 
            event_type === 'subscription_renewed') {
            
            console.log(`[Webhook] Creating/updating subscription for user ${user.id}`);
            
            const subscriptionData = {
                userId: user.id, 
                status: subscription.status,
                startDate: new Date(subscription.activated_at * 1000),
                endDate: new Date(subscription.current_term_end * 1000),
                chargebeeSubscriptionId: subscription.id,
                gymPlanId: gymPlan ? gymPlan.id : null,
                trainerPlanId: trainerPlan ? trainerPlan.id : null,
            };
            
            console.log(`[Webhook] Subscription data:`, subscriptionData);
            
            const createdSubscription = await prisma.subscription.upsert({
                where: { chargebeeSubscriptionId: subscription.id },
                update: {
                    status: subscription.status,
                    endDate: new Date(subscription.current_term_end * 1000),
                },
                create: subscriptionData
            });
            
            console.log(`[Webhook] Successfully created/updated subscription:`, createdSubscription);
        }
        else if (event_type === 'subscription_cancelled' || event_type === 'subscription_expired') {
            console.log(`[Webhook] Cancelling subscription for user ${user.id}`);
            
            const updatedSubscription = await prisma.subscription.updateMany({
                where: { chargebeeSubscriptionId: subscription.id },
                data: {
                    status: 'cancelled',
                    endDate: new Date((subscription.cancelled_at || subscription.current_term_end) * 1000)
                }
            });
            
            console.log(`[Webhook] Successfully cancelled subscription:`, updatedSubscription);
        }

        return { success: true, message: `Successfully processed ${event_type}` };
    } catch (error) {
        console.error(`[Webhook] Error processing webhook:`, error);
        return { success: false, message: error.message };
    }
};