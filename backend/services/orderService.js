import { PrismaClient } from '@prisma/client';
import AppError from '../utils/AppError.js';

const prisma = new PrismaClient();

export const createOrderFromPaidInvoice = async (invoice) => {
  console.log(`[ORDER SERVICE] Processing paid invoice: ${invoice.id}`);
  
  try {
    const { line_items, customer_id, total, id: chargebeeInvoiceId } = invoice;

    // Find the user in our database using the Chargebee customer ID
    const user = await prisma.user.findUnique({ where: { chargebeeCustomerId: customer_id } });
    if (!user) {
      throw new Error(`User not found for Chargebee customer ID: ${customer_id}`);
    }

    // ✅ Use a transaction to ensure all database operations succeed or fail together.
    const newOrder = await prisma.$transaction(async (tx) => {
      
      // First, check if an order for this invoice already exists to prevent duplicates.
      const existingOrder = await tx.order.findUnique({ where: { chargebeeInvoiceId } });
      if (existingOrder) {
        console.log(`[ORDER SERVICE] Order for invoice ${chargebeeInvoiceId} already exists. Skipping.`);
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

      // ✅ Clean up the user's cart by deleting the items that were just purchased
      const cartItemIdsToDelete = line_items.map(li => li.metadata.internal_cart_item_id);
      if (cartItemIdsToDelete.length > 0) {
        await tx.cartItem.deleteMany({
          where: {
            id: { in: cartItemIdsToDelete },
            userId: user.id,
          },
        });
        console.log(`[ORDER SERVICE] Cleaned up ${cartItemIdsToDelete.length} items from user's cart.`);
      }
      
      console.log(`[ORDER SERVICE] ✅ Order ${order.id} created successfully.`);
      return order;
    });

    // TODO: Add logic here to send notifications to the relevant merchants
    // about their new orders. This should be done outside the transaction.
    // For example: `await notifyMerchants(newOrder);`

    return newOrder;

  } catch (error) {
    console.error(`[ORDER SERVICE] ❌ Failed to create order for invoice ${invoice.id}:`, error);
    // This is a critical failure. You should have a monitoring system to alert you.
    // The webhook will be retried by Chargebee, which might fix transient issues.
    throw new AppError('Failed to process payment.', 500);
  }
};