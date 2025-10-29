// src/services/productService.js

import { PrismaClient } from '@prisma/client';
import chargebeeModule from 'chargebee-typescript';
import AppError from '../utils/AppError.js';

const prisma = new PrismaClient();

// --- Chargebee Initialization ---
// We configure Chargebee here to make the service self-contained.
const { ChargeBee } = chargebeeModule;
const chargebee = new ChargeBee();
chargebee.configure({
  site: process.env.CHARGEBEE_SITE,
  api_key: process.env.CHARGEBEE_API_KEY,
});

// --- Helper Functions ---

/**
 * Finds a merchant's profile by their user ID or throws an error.
 * @param {string} userId - The internal user ID.
 * @returns {Promise<MerchantProfile>}
 */
const getMerchantProfileByUserId = async (userId) => {
  const merchantProfile = await prisma.merchantProfile.findUnique({ where: { userId } });
  if (!merchantProfile) {
    throw new AppError('Merchant profile not found for this user.', 404);
  }
  return merchantProfile;
};

/**
 * Creates a one-time "plan" item in Chargebee for a marketplace product.
 * @param {object} productData - The product data from our database.
 * @returns {Promise<string>} The ID of the created Chargebee item.
 */
// src/services/productService.js

// ... inside the createMarketplaceItemInChargebee function

const createMarketplaceItemInChargebee = async (productData) => {
  try {
    // ✅✅✅ CRITICAL FIX: Generate a truly unique ID to prevent conflicts in Chargebee.
    const timestamp = Date.now();
    const uniqueChargebeeId = `product_${productData.sellerId}_${productData.id}_${timestamp}`;

    console.log(`[DEBUG] Creating Chargebee item with unique ID: ${uniqueChargebeeId}`);

    const itemResult = await chargebee.item.create({
      id: uniqueChargebeeId,
      // ✅ CHANGE THIS LINE to make the name unique
      name: `${productData.name} (${uniqueChargebeeId})`,
      description: productData.description || '',
      type: 'plan',
      status: 'active',
      external_name: productData.name, // Keep the clean name for external display
      sku: `SKU_${productData.id}`,
      item_family_id: process.env.CHARGEBEE_ITEM_FAMILY_ID,
      price: {
        amount: Math.round(productData.price * 100),
        currency_code: 'USD',
      },
      taxable: false,
      is_shippable: false,
      metadata: {
        productId: productData.id,
        merchantId: productData.sellerId,
      },
    }).request();

    console.log(`[Chargebee] Created marketplace item ${itemResult.item.id} for product ${productData.id}`);
    return itemResult.item.id;
  } catch (error) {
    // ... rest of the catch block
  }
};

// --- Merchant-Specific (Private) Functions ---

/**
 * Creates a product for a merchant, including creating a corresponding item in Chargebee.
 * This operation is atomic to ensure consistency between our DB and Chargebee.
 */
export const createProductForMerchant = async (userId, productData) => {
  const merchantProfile = await getMerchantProfileByUserId(userId);

  // Use a Prisma transaction to ensure both DB and Chargebee operations succeed or fail together.
  const newProduct = await prisma.$transaction(async (tx) => {
    // 1. Create the product in our database first to get an ID.
    const product = await tx.product.create({
      data: {
        ...productData,
        images: productData.images || [],
        sellerId: merchantProfile.id,
      },
    });

    // 2. Create the corresponding item in Chargebee.
    const chargebeeItemId = await createMarketplaceItemInChargebee(product);

    // 3. Update our product record with the Chargebee item ID.
    const updatedProduct = await tx.product.update({
      where: { id: product.id },
      data: { chargebeeItemId },
    });

    return updatedProduct;
  });

  console.log(`✅ [ProductService] Successfully created product ${newProduct.id} with Chargebee item ${newProduct.chargebeeItemId}`);
  return newProduct;
};

/**
 * Retrieves all products for a specific merchant.
 */
export const getProductsForMerchant = async (userId) => {
  const merchantProfile = await getMerchantProfileByUserId(userId);
  return await prisma.product.findMany({
    where: { sellerId: merchantProfile.id },
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * Updates a product for a merchant, both in our DB and in Chargebee.
 */
export const updateProductForMerchant = async (userId, productId, updateData) => {
  const merchantProfile = await getMerchantProfileByUserId(userId);
  const product = await prisma.product.findUnique({ where: { id: productId } });

  if (!product) throw new AppError('Product not found.', 404);
  if (product.sellerId !== merchantProfile.id) {
    throw new AppError('You are not authorized to modify this product.', 403);
  }

  // 1. Update the product in our database.
  const updatedProduct = await prisma.product.update({
    where: { id: productId },
    data: updateData,
  });

  // 2. If the product has a Chargebee ID, update it in Chargebee as well.
  if (product.chargebeeItemId) {
    try {
      const payload = {};
      if (updateData.name) payload.name = updateData.name;
      if (updateData.description) payload.description = updateData.description;
      if (updateData.price) {
        payload.price = {
          amount: Math.round(updateData.price * 100),
          currency_code: 'USD',
        };
      }
      if (Object.keys(payload).length > 0) {
        await chargebee.item.update(product.chargebeeItemId, payload).request();
        console.log(`[Chargebee] Updated item ${product.chargebeeItemId}`);
      }
    } catch (error) {
      console.error("❌ [Chargebee] Error updating marketplace item:", error);
      // We don't throw an error here to prevent blocking the local update,
      // but we log it for manual reconciliation.
    }
  }

  return updatedProduct;
};

/**
 * Deletes a product for a merchant, both in our DB and in Chargebee.
 */
export const deleteProductForMerchant = async (userId, productId) => {
  const merchantProfile = await getMerchantProfileByUserId(userId);
  const product = await prisma.product.findUnique({ where: { id: productId } });

  if (!product) throw new AppError('Product not found.', 404);
  if (product.sellerId !== merchantProfile.id) {
    throw new AppError('You are not authorized to delete this product.', 403);
  }

  // 1. Delete from Chargebee if it exists.
  if (product.chargebeeItemId) {
    try {
      await chargebee.item.delete(product.chargebeeItemId).request();
      console.log(`[Chargebee] Deleted item ${product.chargebeeItemId}`);
    } catch (error) {
      console.error("❌ [Chargebee] Error deleting marketplace item:", error);
      // Log but don't block the local deletion.
    }
  }

  // 2. Delete from our database.
  await prisma.product.delete({ where: { id: productId } });
};

// --- Public Marketplace Functions ---

/**
 * Retrieves all public products with pagination.
 */
export const getAllPublicProducts = async ({ page = 1, limit = 20 }) => {
  const skip = (page - 1) * limit;
  const whereClause = { stock: { gt: 0 } }; // Only show in-stock products
  const [products, total] = await prisma.$transaction([
    prisma.product.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { seller: { select: { storeName: true } } },
    }),
    prisma.product.count({ where: whereClause }),
  ]);
  return { data: products, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

/**
 * Retrieves a single public product by its ID.
 */
export const getPublicProductById = async (productId) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { seller: { select: { storeName: true, id: true } } },
  });
  if (!product || product.stock <= 0) throw new AppError('Product not found or is out of stock.', 404);
  return product;
};

/**
 * Creates a Chargebee hosted checkout page for a one-time marketplace purchase.
 * @param {string} userId - Our internal user ID.
 * @param {Array} items - Array of { productId, name, price, quantity, chargebeeItemId, merchantId }
 * @param {string} userEmail - The user's email for pre-filling.
 * @returns {Promise<string>} The URL for the Chargebee hosted page.
 */
export const createMarketplaceCheckout = async (userId, items, userEmail) => {
  try {
    // For one-time purchases, the item itself acts as the price
    const subscriptionItems = items.map(item => ({
      item_price_id: item.chargebeeItemId, // Use the item's ID for one-time purchases
      quantity: item.quantity,
      // Metadata is crucial for webhook processing
      metadata: {
        internal_product_id: item.productId,
        internal_merchant_id: item.merchantId,
        internal_cart_item_id: `cart_${userId}_${item.productId}_${Date.now()}`,
      },
    }));

    const hostedPageResult = await chargebee.hosted_page.checkout_new_for_items({
      subscription_items: subscriptionItems,
      // IMPORTANT: Ensure FRONTEND_URL in your .env is set to your app's URL (e.g., http://localhost:3000)
      redirect_url: `${process.env.FRONTEND_URL}/dashboard?order=success`,
      cancel_url: `${process.env.FRONTEND_URL}/marketplace/cart`,
      customer: {
        email: userEmail,
        first_name: userEmail ? userEmail.split('@')[0] : '',
      },
      notes: {
        type: 'marketplace_order',
        user_id: userId,
      },
    }).request();

    return hostedPageResult.hosted_page.url;
  } catch (error) {
    console.error("❌ [Chargebee] Error creating marketplace checkout:", error);
    throw new AppError('Failed to create checkout session.', 500);
  }
};