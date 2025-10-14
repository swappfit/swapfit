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


// ✅ MARKETPLACE INTEGRATION: Function to process a one-time marketplace order
const processMarketplaceOrder = async (invoice) => {
    console.log(`[Webhook] Processing marketplace order for invoice: ${invoice.id}`);
    
    const { line_items, customer_id, total, id: chargebeeInvoiceId } = invoice;

    // Find the user in our database using the Chargebee customer ID
    const user = await prisma.user.findUnique({ where: { chargebeeCustomerId: customer_id } });
    if (!user) {
        throw new Error(`User not found for Chargebee customer ID: ${customer_id}`);
    }

    // Use a transaction to ensure all database operations succeed or fail together.
    const newOrder = await prisma.$transaction(async (tx) => {
        
        // First, check if an order for this invoice already exists to prevent duplicates.
        const existingOrder = await tx.order.findUnique({ where: { chargebeeInvoiceId } });
        if (existingOrder) {
            console.log(`[Webhook] Order for invoice ${chargebeeInvoiceId} already exists. Skipping.`);
            return existingOrder;
        }

        // Create the main Order record
        const order = await tx.order.create({
            data: {
                userId: user.id,
                totalAmount: total / 100, // Convert back from cents to dollars
                status: 'Paid', // Or 'Processing' if you need a fulfillment step
                chargebeeInvoiceId: chargebeeInvoiceId,
            },
        });

        // Create an OrderItem for each line item in the Chargebee invoice
        const orderItemsToCreate = line_items.map(lineItem => {
            const { internal_product_id, internal_merchant_id, internal_cart_item_id } = lineItem.metadata;
            return {
                orderId: order.id,
                productId: internal_product_id,
                name: lineItem.description,
                price: lineItem.amount / 100, // Convert back from cents
                quantity: lineItem.quantity,
            };
        });

        await tx.orderItem.createMany({ data: orderItemsToCreate });

        // Clean up the user's cart by deleting the items that were just purchased
        const cartItemIdsToDelete = line_items.map(li => li.metadata.internal_cart_item_id);
        if (cartItemIdsToDelete.length > 0) {
            await tx.cartItem.deleteMany({
                where: {
                    id: { in: cartItemIdsToDelete },
                    userId: user.id,
                },
            });
            console.log(`[Webhook] Cleaned up ${cartItemIdsToDelete.length} items from user's cart.`);
        }
        
        console.log(`[Webhook] ✅ Marketplace Order ${order.id} created successfully.`);
        return order;
    });

    // TODO: Add logic here to send notifications to the relevant merchants
    // about their new orders.
    
    return newOrder;
};


// ✅✅✅ THIS IS THE ONLY PART THAT HAS CHANGED ✅✅✅
// src/services/subscriptionService.js

// ... (keep all your other functions like createCheckoutSession, createPortalSession, and processMarketplaceOrder)

export const processWebhook = async (payload) => {
    const { parsedBody, rawBody, headers } = payload;
    let event;

    try {
        const webhookSecret = process.env.CHARGEBEE_WEBHOOK_SECRET;

        if (webhookSecret) {
            event = chargebee.event.deserialize(
                rawBody.toString(),
                headers['x-chargebee-webhook-signature'],
                webhookSecret
            );
            if (!event) {
                throw new AppError('Webhook signature verification failed.', 403);
            }
        } else {
            // IMPORTANT: Use parsedBody for direct parsing when there's no secret
            event = parsedBody;
        }
        
        const { content, event_type } = event;
        if (!content || !event_type) {
            throw new AppError('Invalid webhook payload structure.', 400);
        }

        console.log(`[Webhook] Processing event: ${event_type}`);

        // ✅ MARKETPLACE INTEGRATION: Handle one-time invoice payments
        if (event_type === 'invoice_paid') {
            const invoice = content.invoice;
            if (invoice.line_items && invoice.line_items.length > 0 && invoice.line_items[0].metadata) {
                console.log('[Webhook] Detected marketplace order payment.');
                await processMarketplaceOrder(invoice);
                return { success: true, message: `Successfully processed marketplace order for invoice ${invoice.id}` };
            } else {
                // This is a subscription payment, we will handle it below.
                console.log('[Webhook] Received subscription payment, deferring to subscription-specific events for processing.');
                return { success: true, message: 'Ignored non-marketplace invoice_paid event.' };
            }
        }

        // --- Existing Subscription Logic ---
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

        // Find user by Chargebee customer ID
        let user = await prisma.user.findUnique({
            where: { chargebeeCustomerId: customer.id }
        });

        if (!user) {
            // Fallback: Find user by email if not found by customer ID
            if (customer.email) {
                user = await prisma.user.findUnique({ where: { email: customer.email } });
                if (user) {
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { chargebeeCustomerId: customer.id }
                    });
                } else {
                    throw new AppError(`User not found for customer ID ${customer.id}`, 404);
                }
            } else {
                throw new AppError(`User not found for customer ID ${customer.id}`, 404);
            }
        }

        // Extract plan information
        let planItemId = null;
        if (subscription.subscription_items && subscription.subscription_items.length > 0) {
            planItemId = subscription.subscription_items[0].item_price_id;
        }

        if (!planItemId) {
            throw new AppError('No plan item ID found in subscription.', 400);
        }

        // Find the plan in our database
        const [gymPlan, trainerPlan] = await Promise.all([
            prisma.gymPlan.findFirst({ where: { chargebeePlanId: planItemId } }),
            prisma.trainerPlan.findFirst({ where: { chargebeePlanId: planItemId } })
        ]);

        if (!gymPlan && !trainerPlan) {
            throw new AppError(`Plan not found for Chargebee plan ID ${planItemId}.`, 404);
        }

        // Process subscription based on event type
        if (['subscription_created', 'subscription_activated', 'subscription_renewed'].includes(event_type)) {
            const subscriptionData = {
                userId: user.id,
                status: subscription.status,
                startDate: new Date(subscription.activated_at * 1000),
                endDate: new Date(subscription.current_term_end * 1000),
                chargebeeSubscriptionId: subscription.id,
                gymPlanId: gymPlan?.id || null,
                trainerPlanId: trainerPlan?.id || null,
            };
            
            await prisma.subscription.upsert({
                where: { chargebeeSubscriptionId: subscription.id },
                update: {
                    status: subscription.status,
                    endDate: new Date(subscription.current_term_end * 1000),
                },
                create: subscriptionData
            });
            console.log(`[Webhook] ✅ Successfully processed subscription ${subscription.id} for user ${user.id}`);
        }
        else if (['subscription_cancelled', 'subscription_expired'].includes(event_type)) {
            await prisma.subscription.updateMany({
                where: { chargebeeSubscriptionId: subscription.id },
                data: {
                    status: 'cancelled',
                    endDate: new Date((subscription.cancelled_at || subscription.current_term_end) * 1000)
                }
            });
            console.log(`[Webhook] ✅ Successfully cancelled subscription ${subscription.id} for user ${user.id}`);
        }

        return { success: true, message: `Successfully processed ${event_type}` };

    } catch (error) {
        console.error(`[Webhook] ❌ Error processing webhook:`, error.message);
        // Re-throw the error so the controller's catchAsync wrapper can send a proper error response.
        throw error;
    }
};