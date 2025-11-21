// File: src/services/productService.js

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
  api_version: process.env.CHARGEBEE_API_VERSION || 'v2',
});

// Helper: convert float currency to integer (cents/paise)
const toMinorUnit = (amount) => Math.round(Number(amount) * 100);

// --- Helper Functions ---
const getMerchantProfileByUserId = async (userId) => {
  const merchantProfile = await prisma.merchantProfile.findUnique({ where: { userId } });
  if (!merchantProfile) {
    throw new AppError('Merchant profile not found for this user.', 404);
  }
  return merchantProfile;
};

/**
 * Creates a one-time "item" and an associated item_price in Chargebee.
 * If Chargebee creation fails, the caller should handle DB rollback.
 */
const createMarketplaceItemInChargebee = async (productData) => {
  try {
    const timestamp = Date.now();
    const itemId = `product_${productData.sellerId}_${productData.id}_${timestamp}`;
    const priceId = `price_${productData.sellerId}_${productData.id}_${timestamp}`;

    console.log(`[Chargebee DEBUG] Creating item: ${itemId}`);

    // 1️⃣ Create the item (charge type)
    const itemResult = await chargebee.item.create({
      id: itemId,
      name: productData.name,
      description: productData.description || "",
      type: "charge",
      status: "active",
      item_family_id: process.env.CHARGEBEE_MARKETPLACE_FAMILY_ID,
      taxable: false,
      is_shippable: false,
      external_name: productData.name,
      metadata: {
        productId: productData.id,
        merchantId: productData.sellerId,
      }
    }).request();

    console.log(`[Chargebee DEBUG] Item Created: ${itemResult.item.id}`);

    // 2️⃣ Create the required price for the item
    const priceResult = await chargebee.item_price.create({
      id: priceId,
      item_id: itemResult.item.id,
      name: `${productData.name} - Base Price`,
      status: "active",
      pricing_model: "per_unit",
      currency_code: process.env.CHARGEBEE_CURRENCY || "INR",
      price: toMinorUnit(productData.price),
      type: "charge"
    }).request();

    console.log(`[Chargebee DEBUG] Price Created: ${priceResult.item_price.id}`);

    return {
      itemId: itemResult.item.id,
      itemPriceId: priceResult.item_price.id,
    };

  } catch (error) {
    console.error("❌ [Chargebee] Marketplace item creation failed:", error);
    throw new AppError(`Chargebee Error: ${error.message}`, 500);
  }
};

// --- Public functions ---
export const createProductForMerchant = async (userId, productData) => {
  const merchantProfile = await getMerchantProfileByUserId(userId);

  // Step 1: create product in DB to obtain internal ID
  const product = await prisma.product.create({
    data: {
      ...productData,
      images: productData.images || [],
      sellerId: merchantProfile.id,
    },
  });

  // Step 2: create Chargebee item + price
  let chargebeeIds;
  try {
    chargebeeIds = await createMarketplaceItemInChargebee(product);
  } catch (err) {
    // Try cleaning up DB product since Chargebee creation failed
    try {
      await prisma.product.delete({ where: { id: product.id } });
      console.log(`[ProductService] Rolled back DB product creation for product ${product.id} after Chargebee failure.`);
    } catch (delErr) {
      console.error(`[ProductService] Failed to rollback product ${product.id}:`, delErr);
    }
    throw err; // rethrow original
  }

  // Step 3: update DB product with Chargebee IDs
  const updatedProduct = await prisma.product.update({
    where: { id: product.id },
    data: {
      chargebeeItemId: chargebeeIds.itemId,
      chargebeeItemPriceId: chargebeeIds.itemPriceId,
    },
  });

  console.log(`✅ [ProductService] Successfully created product ${updatedProduct.id} with Chargebee item ${updatedProduct.chargebeeItemId}`);
  return updatedProduct;
};

export const getProductsForMerchant = async (userId) => {
  const merchantProfile = await getMerchantProfileByUserId(userId);
  return await prisma.product.findMany({
    where: { sellerId: merchantProfile.id },
    orderBy: { createdAt: 'desc' },
  });
};

export const updateProductForMerchant = async (userId, productId, updateData) => {
  const merchantProfile = await getMerchantProfileByUserId(userId);
  const product = await prisma.product.findUnique({ where: { id: productId } });

  if (!product) throw new AppError('Product not found.', 404);
  if (product.sellerId !== merchantProfile.id) throw new AppError('You are not authorized to modify this product.', 403);

  // Update local DB first
  const updatedProduct = await prisma.product.update({ where: { id: productId }, data: updateData });

  // If Chargebee exists, update remote resources as needed
  if (product.chargebeeItemId) {
    try {
      const itemPayload = {};
      if (updateData.name) itemPayload.name = updateData.name;
      if (updateData.description) itemPayload.description = updateData.description;

      if (Object.keys(itemPayload).length > 0) {
        await chargebee.item.update(product.chargebeeItemId, itemPayload).request();
        console.log(`[Chargebee] Updated item ${product.chargebeeItemId}`);
      }

      // Price change should update the item_price resource (not the item)
      if (updateData.price && product.chargebeeItemPriceId) {
        await chargebee.item_price.update(product.chargebeeItemPriceId, {
          price: toMinorUnit(updateData.price),
          currency_code: process.env.CHARGEBEE_CURRENCY || 'INR',
        }).request();
        console.log(`[Chargebee] Updated item price ${product.chargebeeItemPriceId}`);
      }
    } catch (error) {
      console.error('❌ [Chargebee] Error updating marketplace item or price:', error);
      // Do not revert DB update; log for manual reconciliation
    }
  }

  return updatedProduct;
};

export const deleteProductForMerchant = async (userId, productId) => {
  const merchantProfile = await getMerchantProfileByUserId(userId);
  const product = await prisma.product.findUnique({ where: { id: productId } });

  if (!product) throw new AppError('Product not found.', 404);
  if (product.sellerId !== merchantProfile.id) throw new AppError('You are not authorized to delete this product.', 403);

  if (product.chargebeeItemId) {
    try {
      await chargebee.item.delete(product.chargebeeItemId).request();
      console.log(`[Chargebee] Deleted item ${product.chargebeeItemId}`);
    } catch (error) {
      console.error('❌ [Chargebee] Error deleting marketplace item:', error);
    }
  }

  await prisma.product.delete({ where: { id: productId } });
};

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

export const getPublicProductById = async (productId) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { seller: { select: { storeName: true, id: true } } },
  });
  if (!product || product.stock <= 0) throw new AppError('Product not found or is out of stock.', 404);
  return product;
};

