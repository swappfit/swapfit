// On your BACKEND in src/services/merchantService.js
import { PrismaClient } from '@prisma/client';
import AppError from '../utils/AppError.js';
const prisma = new PrismaClient();

// Helper to get the merchant profile from a user ID
const getMerchantProfile = async (userId) => {
    const merchantProfile = await prisma.merchantProfile.findUnique({ where: { userId } });
    if (!merchantProfile) throw new AppError('Merchant profile not found.', 404);
    return merchantProfile;
};
export const getDashboard = async (userId) => {
    const merchant = await getMerchantProfile(userId);

    // Run queries in parallel for efficiency
    const [productCount, orderCount, salesData] = await Promise.all([
        // 1. Get total number of active products
        prisma.product.count({
            where: { sellerId: merchant.id }
        }),
        // 2. Get total number of orders containing their products
        prisma.order.count({
            where: { items: { some: { product: { sellerId: merchant.id } } } }
        }),
        // 3. Calculate total sales revenue
        prisma.orderItem.aggregate({
            _sum: {
                price: true,
            },
            where: {
                product: {
                    sellerId: merchant.id
                }
            }
        })
    ]);

    const totalSales = salesData._sum.price || 0;

    return {
        totalOrders: orderCount,
        totalSales: totalSales,
        activeProducts: productCount,
        newOrdersToday: 0, // Placeholder for more complex logic
    };
};
// --- Product Management ---

export const createProduct = async (userId, productData) => {
    const merchant = await getMerchantProfile(userId);
    return await prisma.product.create({
        data: {
            ...productData,
            sellerId: merchant.id // Link the product to the merchant
        }
    });
};

export const getMyProducts = async (userId) => {
    const merchant = await getMerchantProfile(userId);
    return await prisma.product.findMany({
        where: { sellerId: merchant.id },
        orderBy: { createdAt: 'desc' }
    });
};

export const updateMyProduct = async (userId, productId, updateData) => {
    const merchant = await getMerchantProfile(userId);
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new AppError('Product not found.', 404);
    if (product.sellerId !== merchant.id) throw new AppError('Forbidden: You do not own this product.', 403);

    return await prisma.product.update({ where: { id: productId }, data: updateData });
};

export const deleteMyProduct = async (userId, productId) => {
    const merchant = await getMerchantProfile(userId);
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new AppError('Product not found.', 404);
    if (product.sellerId !== merchant.id) throw new AppError('Forbidden: You do not own this product.', 403);
    
    await prisma.product.delete({ where: { id: productId } });
};


// --- Order Management ---

export const getMyOrders = async (userId) => {
    const merchant = await getMerchantProfile(userId);
    // This is a more complex query to find all orders containing the merchant's products
    return await prisma.order.findMany({
        where: {
            items: {
                some: {
                    product: {
                        sellerId: merchant.id
                    }
                }
            }
        },
        include: {
            items: {
                where: { product: { sellerId: merchant.id } }, // Only include items sold by this merchant
                include: { product: true }
            },
            user: { select: { email: true, memberProfile: true } } // Include customer details
        },
        orderBy: { createdAt: 'desc' }
    });
};