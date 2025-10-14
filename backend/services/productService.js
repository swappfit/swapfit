// src/services/productService.js

import { PrismaClient } from '@prisma/client';
import AppError from '../utils/AppError.js';
const prisma = new PrismaClient();

const getMerchantProfileByUserId = async (userId) => {
  const merchantProfile = await prisma.merchantProfile.findUnique({ where: { userId } });
  if (!merchantProfile) { throw new AppError('Merchant profile not found for this user.', 404); }
  return merchantProfile;
};

// --- Merchant-Specific (Private) Functions ---

export const createProductForMerchant = async (userId, productData) => {
 try{ 
  const merchantProfile = await getMerchantProfileByUserId(userId);
  if (!merchantProfile) { throw new AppError('Merchant profile not found for this user.', 404); }
  console.log("✅ [ProductService] Merchant profile found:", merchantProfile);
  const dataToCreate = {
    ...productData,
    images: productData.images || [],
    sellerId: merchantProfile.id,
  };
  console.log("✅ [ProductService] Data to create product:", dataToCreate);
  return await prisma.product.create({ data: dataToCreate });
 }
catch (error) {
        console.error("❌ [ProductService] Prisma Error creating product:", error);
}
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
  if (product.sellerId !== merchantProfile.id) { throw new AppError('You are not authorized to modify this product.', 403); }
  return await prisma.product.update({ where: { id: productId }, data: updateData });
};

export const deleteProductForMerchant = async (userId, productId) => {
  const merchantProfile = await getMerchantProfileByUserId(userId);
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new AppError('Product not found.', 404);
  if (product.sellerId !== merchantProfile.id) { throw new AppError('You are not authorized to delete this product.', 403); }
  await prisma.product.delete({ where: { id: productId } });
};


// --- Public Marketplace Functions ---

export const getAllPublicProducts = async ({ page = 1, limit = 20 }) => {
  const skip = (page - 1) * limit;
  const whereClause = { stock: { gt: 0 } }; // Only show in-stock products
  const [products, total] = await prisma.$transaction([
    prisma.product.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { seller: { select: { storeName: true } } } // Include seller's store name
    }),
    prisma.product.count({ where: whereClause }),
  ]);
  return { data: products, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

export const getPublicProductById = async (productId) => {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { seller: { select: { storeName: true, id: true } } } // Include seller info
    });
    if (!product || product.stock <= 0) throw new AppError('Product not found or is out of stock.', 404);
    return product;
};