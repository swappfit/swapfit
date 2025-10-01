// src/services/webhookService.js
import { PrismaClient } from '@prisma/client';
import AppError from '../utils/AppError.js';

const prisma = new PrismaClient();

// --- Handler for Subscription Lifecycle Events ---

const handleSubscriptionCreation = async (subscription, customer) => {
    const user = await prisma.user.findUnique({ where: { chargebeeCustomerId: customer.id } });
    if (!user) throw new Error(`Webhook Error: User not found for Chargebee customer ID ${customer.id}`);

    const planItem = subscription.subscription_items[0];
    const plan = await prisma.gymPlan.findUnique({ where: { chargebeePlanId: planItem.item_price_id } }) ||
                 await prisma.trainerPlan.findUnique({ where: { chargebeePlanId: planItem.item_price_id } });
    if (!plan) throw new Error(`Webhook Error: Plan not found in our DB for Chargebee plan_id ${planItem.item_price_id}`);

    await prisma.subscription.upsert({
        where: { chargebeeSubscriptionId: subscription.id },
        update: {
            status: subscription.status,
            startDate: new Date(subscription.start_date * 1000),
            endDate: new Date(subscription.current_term_end * 1000),
        },
        create: {
            userId: user.id,
            chargebeeSubscriptionId: subscription.id,
            status: subscription.status,
            startDate: new Date(subscription.start_date * 1000),
            endDate: new Date(subscription.current_term_end * 1000),
            gymPlanId: plan.gymId ? plan.id : undefined,
            trainerPlanId: plan.trainerProfileId ? plan.id : undefined,
        },
    });
};

const handleSubscriptionRenewal = async (subscription) => {
    await prisma.subscription.update({
        where: { chargebeeSubscriptionId: subscription.id },
        data: {
            status: 'active',
            endDate: new Date(subscription.current_term_end * 1000),
        },
    });
};

const handleSubscriptionCancellation = async (subscription) => {
    await prisma.subscription.update({
        where: { chargebeeSubscriptionId: subscription.id },
        data: {
            status: 'cancelled',
            endDate: new Date(subscription.cancelled_at * 1000),
        },
    });
};


// --- Handlers for One-Time Payment Events ---

const handleBookingPaymentSuccess = async (invoice) => {
    const metadata = invoice.custom_fields;
    const customerId = invoice.customer_id;

    const { gymId, bookingType } = metadata;

    const user = await prisma.user.findUnique({ where: { chargebeeCustomerId: customerId }});
    const gym = await prisma.gym.findUnique({ where: { id: gymId }});
    if (!user || !gym) throw new AppError('User or Gym not found during webhook processing.', 404);

    const pricePaid = invoice.amount_paid / 100;
    const startDate = new Date();
    const endDate = new Date(startDate);
    bookingType === 'daily'
      ? endDate.setDate(startDate.getDate() + 1)
      : endDate.setDate(startDate.getDate() + 7);

    await prisma.$transaction([
        prisma.booking.create({ data: { userId: user.id, gymId, bookingType, pricePaid, startDate, endDate, status: 'active' } }),
        prisma.transaction.create({ data: { userId: user.id, amount: pricePaid, currency: invoice.currency_code.toLowerCase(), description: `Booking: ${gym.name} (${bookingType} pass)`, status: 'succeeded' } })
    ]);
};

/**
 * ✅ NEW: Handles a successful payment for a store purchase.
 * Creates an Order, OrderItems, a Transaction, and clears the user's cart.
 */
const handleStorePurchaseSuccess = async (invoice) => {
    const customerId = invoice.customer_id;
    const user = await prisma.user.findUnique({ where: { chargebeeCustomerId: customerId } });
    if (!user) throw new AppError(`Webhook Error: User not found for customer ${customerId}`, 404);

    const cartItems = await prisma.cartItem.findMany({
        where: { userId: user.id },
        include: { product: true }
    });
    if (cartItems.length === 0) {
        console.error(`Webhook Warning: Cart was empty for user ${user.id} during order creation for invoice ${invoice.id}.`);
        return;
    }
    const totalAmount = invoice.amount_paid / 100;

    await prisma.$transaction(async (tx) => {
        const order = await tx.order.create({
          data: {
            userId: user.id, totalAmount, status: 'completed',
            items: { create: cartItems.map(item => ({ productId: item.productId, name: item.product.name, price: item.product.price, quantity: item.quantity })) }
          },
        });

        await tx.transaction.create({ data: { userId: user.id, amount: totalAmount, currency: invoice.currency_code.toLowerCase(), description: `Store Purchase - Order ID: ${order.id}`, status: 'succeeded' } });
        
        await tx.cartItem.deleteMany({ where: { userId: user.id } });

        for (const item of cartItems) {
            await tx.product.update({ where: { id: item.productId }, data: { stock: { decrement: item.quantity } } });
        }
    });
};


/**
 * The main entry point for the webhook controller.
 * It receives a Chargebee event and routes it to the correct handler.
 */
export const processWebhookEvent = async (event) => {
    console.log(`[Webhook Service] Received event: ${event.event_type}`);

    const { subscription, customer, invoice } = event.content;

    switch (event.event_type) {
        // --- Subscription Events ---
        case 'subscription_created':
        case 'subscription_reactivated':
            await handleSubscriptionCreation(subscription, customer);
            break;
        case 'subscription_renewed':
            await handleSubscriptionRenewal(subscription);
            break;
        case 'subscription_cancelled':
            await handleSubscriptionCancellation(subscription);
            break;

        // --- One-Time Payment Event Router ---
        case 'payment_succeeded':
            if (invoice && !invoice.subscription_id) {
                // This is a one-time payment. We check metadata to see what kind.
                const purchaseType = invoice.custom_fields?.purchaseType;
                if (purchaseType === 'booking') {
                    await handleBookingPaymentSuccess(invoice);
                } else if (purchaseType === 'store_checkout') {
                    await handleStorePurchaseSuccess(invoice);
                } else {
                    console.log(`Webhook Info: Received a one-time payment with unhandled purchaseType: ${purchaseType}`);
                }
            }
            break;

        default:
            console.log(`[Webhook Service] No handler for event type: ${event.event_type}`);
    }
};

