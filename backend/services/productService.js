import { PrismaClient } from '@prisma/client';
import chargebeeModule from 'chargebee-typescript';
import AppError from '../utils/AppError.js';

const prisma = new PrismaClient();

// --- Chargebee Initialization ---
const { ChargeBee } = chargebeeModule;
const chargebee = new ChargeBee();
chargebee.configure({
  site: process.env.CHARGEBEE_SITE,
  api_key: process.env.CHARGEBEE_API_KEY,
  api_version: 'v2',
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
 * Creates or retrieves a default item family in Chargebee
 * @returns {Promise<string>} The ID of the item family
 */
const getOrCreateDefaultItemFamily = async () => {
  const itemFamilyId = 'marketplace-default';
  
  try {
    // Try to retrieve the default item family
    await chargebee.item_family.retrieve(itemFamilyId).request();
    console.log(`[Chargebee] Using existing item family: ${itemFamilyId}`);
    return itemFamilyId;
  } catch (error) {
    // If it doesn't exist, create it
    console.log(`[Chargebee] Creating default item family: ${itemFamilyId}`);
    await chargebee.item_family.create({
      id: itemFamilyId,
      name: "Marketplace Products",
      description: "Default family for all marketplace products"
    }).request();
    return itemFamilyId;
  }
};

/**
 * Creates a product and its corresponding item and price point in Chargebee Product Catalog 2.0.
 * @param {object} productData - The product data from our database.
 * @returns {Promise<{itemId: string, itemPriceId: string}>} The IDs of created Chargebee item and price point.
 */
const createMarketplaceItemInChargebee = async (productData) => {
  try {
    // Generate a unique ID for the Chargebee item
    const timestamp = Date.now();
    const uniqueChargebeeId = `product_${productData.sellerId}_${productData.id}_${timestamp}`;

    console.log(`[DEBUG] Creating Chargebee item with unique ID: ${uniqueChargebeeId}`);

    // Step 1: Get or create the default item family
    const itemFamilyId = await getOrCreateDefaultItemFamily();

    // Step 2: Create the item with type 'charge' for one-time purchases
    console.log(`[Chargebee] Creating item with type: charge`);
    const itemResult = await chargebee.item.create({
      id: uniqueChargebeeId,
      name: uniqueChargebeeId, // Use the unique ID as the internal name
      description: productData.description || '',
      type: 'charge', // Use 'charge' for one-time purchases
      status: 'active',
      external_name: productData.name, // Use the product name as the external name
      sku: `SKU_${productData.id}`,
      item_family_id: itemFamilyId,
      metadata: {
        productId: productData.id,
        merchantId: productData.sellerId,
      },
    }).request();
    console.log(`[Chargebee] Successfully created item with type: charge`);

    console.log(`[Chargebee] Created item ${itemResult.item.id}`);

    // Step 3: Create a price point for this item
    const pricePointResult = await chargebee.item_price.create({
      id: `${uniqueChargebeeId}_price`,
      item_id: itemResult.item.id,
      name: `Price for ${productData.name}`,
      price: Math.round(productData.price * 100), // Price in cents
      pricing_model: 'per_unit',
      status: 'active'
    }).request();

    console.log(`[Chargebee] Created price point ${pricePointResult.item_price.id} for item ${itemResult.item.id}`);

    return {
      itemId: itemResult.item.id,
      itemPriceId: pricePointResult.item_price.id,
    };
  } catch (error) {
    console.error("Error creating Chargebee item and price:", error);
    throw new AppError(`Failed to create product in payment system: ${error.message}`, 500);
  }
};

/**
 * Updates a product's item and price point in Chargebee.
 * @param {string} chargebeeItemId - The Chargebee item ID.
 * @param {string} chargebeeItemPriceId - The Chargebee item price ID.
 * @param {object} updateData - The product data to update.
 */
const updateMarketplaceItemInChargebee = async (chargebeeItemId, chargebeeItemPriceId, updateData) => {
  try {
    const itemPayload = {};
    if (updateData.name) itemPayload.external_name = updateData.name; // Update external_name instead of name
    if (updateData.description) itemPayload.description = updateData.description;
    
    if (Object.keys(itemPayload).length > 0) {
      await chargebee.item.update(chargebeeItemId, itemPayload).request();
      console.log(`[Chargebee] Updated item ${chargebeeItemId}`);
    }

    if (updateData.price && chargebeeItemPriceId) {
      await chargebee.item_price.update(chargebeeItemPriceId, {
        price: Math.round(updateData.price * 100),
      }).request();
      console.log(`[Chargebee] Updated price ${chargebeeItemPriceId}`);
    }
  } catch (error) {
    console.error("Error updating Chargebee item and price:", error);
    throw new AppError(`Failed to update product in payment system: ${error.message}`, 500);
  }
};

/**
 * Deletes a product's item and price point in Chargebee.
 * @param {string} chargebeeItemId - The Chargebee item ID.
 */
const deleteMarketplaceItemInChargebee = async (chargebeeItemId) => {
  try {
    await chargebee.item.update(chargebeeItemId, { status: 'archived' }).request();
    console.log(`[Chargebee] Archived item ${chargebeeItemId}`);
  } catch (error) {
    console.error("Error archiving Chargebee item:", error);
    throw new AppError(`Failed to delete product in payment system: ${error.message}`, 500);
  }
};

// --- Merchant-Specific (Private) Functions ---

/**
 * Creates a product for a merchant, including creating a corresponding item and price point in Chargebee.
 */
export const createProductForMerchant = async (userId, productData) => {
  const merchantProfile = await getMerchantProfileByUserId(userId);

  const newProduct = await prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        ...productData,
        images: productData.images || [],
        sellerId: merchantProfile.id,
      },
    });

    const chargebeeIds = await createMarketplaceItemInChargebee({
      ...product,
      sellerId: merchantProfile.id,
    });

    // Include chargebeePlanId in the update
    const updatedProduct = await tx.product.update({
      where: { id: product.id },
      data: {
        chargebeeItemId: chargebeeIds.itemId,
        chargebeeItemPriceId: chargebeeIds.itemPriceId,
        chargebeePlanId: chargebeeIds.itemId, // Use itemId as planId for one-time purchases
      },
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

  const updatedProduct = await prisma.product.update({
    where: { id: productId },
    data: updateData,
  });

  if (product.chargebeeItemId && product.chargebeeItemPriceId) {
    try {
      await updateMarketplaceItemInChargebee(
        product.chargebeeItemId,
        product.chargebeeItemPriceId,
        updateData
      );
    } catch (error) {
      console.error("❌ [Chargebee] Error updating marketplace item:", error);
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

  if (product.chargebeeItemId) {
    try {
      await deleteMarketplaceItemInChargebee(product.chargebeeItemId);
    } catch (error) {
      console.error("❌ [Chargebee] Error deleting marketplace item:", error);
    }
  }

  await prisma.product.delete({ where: { id: productId } });
};

// --- Public Marketplace Functions ---

/**
 * Retrieves all public products with pagination.
 */
export const getAllPublicProducts = async ({ page = 1, limit = 20 }) => {
  const skip = (page - 1) * limit;
  const whereClause = { stock: { gt: 0 } };
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
 * @param {Array} items - Array of { productId, name, price, quantity, chargebeeItemPriceId, sellerId }
 * @param {string} userEmail - The user's email for pre-filling.
 * @returns {Promise<string>} The URL for the Chargebee hosted page.
 */
export const createMarketplaceCheckout = async (userId, items, userEmail) => {
  try {
    const validItems = items.filter(item => item.chargebeeItemPriceId);
    
    if (validItems.length === 0) {
      throw new AppError('No valid items available for checkout.', 400);
    }
    
    const oneTimeItems = validItems.map(item => ({
      item_price_id: item.chargebeeItemPriceId, // Use the actual item price ID from the product
      quantity: item.quantity,
      metadata: {
        internal_product_id: item.productId,
        internal_merchant_id: item.sellerId,
        internal_cart_item_id: `cart_${userId}_${item.productId}_${Date.now()}`,
      },
    }));

    const hostedPageResult = await chargebee.hosted_page.checkout_new_for_items({
      customer: {
        email: userEmail,
        first_name: userEmail ? userEmail.split('@')[0] : '',
      },
      embed: false,
      one_time_items: oneTimeItems,
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