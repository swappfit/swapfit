// ----------------------------------------------------------
// File: src/services/cartService.js
// ----------------------------------------------------------

import { PrismaClient } from '@prisma/client';
import chargebeeModule from 'chargebee-typescript';
import AppError from '../utils/AppError.js';

const prisma2 = new PrismaClient();
const { ChargeBee: ChargeBee2 } = chargebeeModule;
const chargebee2 = new ChargeBee2();
chargebee2.configure({
  site: process.env.CHARGEBEE_SITE,
  api_key: process.env.CHARGEBEE_API_KEY,
  api_version: process.env.CHARGEBEE_API_VERSION || 'v2',
});

// Reuse toMinorUnit
const toMinor = (n) => Math.round(Number(n) * 100);

const ensureUserExists = async (userId, userEmail) => {
  console.log(`[BACKEND] [CartService] Ensuring user exists: ${userId}`);
  try {
    let user = await prisma2.user.findUnique({ where: { id: userId } });
    if (user) return user;

    const idParts = userId.split('|');
    if (idParts.length > 1) {
      const altUserId = idParts[1];
      user = await prisma2.user.findUnique({ where: { id: altUserId } });
      if (user) {
        user = await prisma2.user.update({ where: { id: altUserId }, data: { id: userId } });
        return user;
      }
    }

    // Create new user
    let provider = 'local';
    let auth0Id = null;
    if (userId.includes('|')) {
      provider = userId.split('|')[0];
      auth0Id = userId.split('|')[1];
    }

    const userData = {
      id: userId,
      email: userEmail || `user-${userId}@example.com`,
      provider,
      role: 'USER',
    };
    if (auth0Id) userData.auth0_id = auth0Id;

    user = await prisma2.user.create({ data: userData });
    return user;
  } catch (error) {
    console.error(`[BACKEND] [CartService] Error ensuring user exists:`, error);
    if (error.code === 'P2002') throw new AppError('User already exists with this ID', 409);
    else if (error.code === 'P2003') throw new AppError('Invalid user data provided', 400);
    else throw new AppError(`Failed to create or update user: ${error.message}`, 500);
  }
};

// CART OPERATIONS
export const addItemToCart = async (userId, { productId, quantity }, userEmail) => {
  await ensureUserExists(userId, userEmail);
  const product = await prisma2.product.findUnique({ where: { id: productId } });
  if (!product) throw new AppError('Product not found.', 404);
  if (product.stock < 1) throw new AppError('Product is out of stock.', 400);
  if (!product.chargebeeItemId || !product.chargebeeItemPriceId) throw new AppError('Product is not ready for purchase. Please contact support.', 400);

  try {
    const existingCartItem = await prisma2.cartItem.findUnique({ where: { userId_productId: { userId, productId } } });
    let cartItem;
    if (existingCartItem) {
      cartItem = await prisma2.cartItem.update({ where: { id: existingCartItem.id }, data: { quantity: existingCartItem.quantity + quantity }, include: { product: true } });
    } else {
      cartItem = await prisma2.cartItem.create({ data: { userId, productId, quantity }, include: { product: true } });
    }
    return cartItem;
  } catch (error) {
    console.error(`[BACKEND] [CartService] Database error:`, error);
    throw new AppError(`Database error: ${error.message}`, 500);
  }
};

export const getUserCart = async (userId, userEmail) => {
  await ensureUserExists(userId, userEmail);
  const cartItems = await prisma2.cartItem.findMany({ where: { userId }, include: { product: true }, orderBy: { addedAt: 'asc' } });
  return cartItems;
};

export const updateCartItemQuantity = async (userId, cartItemId, quantity, userEmail) => {
  await ensureUserExists(userId, userEmail);
  const cartItem = await prisma2.cartItem.findFirst({ where: { id: cartItemId, userId } });
  if (!cartItem) throw new AppError('Cart item not found.', 404);
  const updatedItem = await prisma2.cartItem.update({ where: { id: cartItemId }, data: { quantity }, include: { product: true } });
  return updatedItem;
};

export const removeItemFromCart = async (userId, cartItemId, userEmail) => {
  await ensureUserExists(userId, userEmail);
  const cartItem = await prisma2.cartItem.findFirst({ where: { id: cartItemId, userId } });
  if (!cartItem) throw new AppError('Cart item not found.', 404);
  await prisma2.cartItem.delete({ where: { id: cartItemId } });
};

// CHECKOUT: Hosted one-time checkout using Chargebee
export const createCartCheckout = async (userId, userEmail) => {
  console.log("=========== CHARGEBEE CHECKOUT START ===========");

  const redirectUrl = process.env.CHARGEBEE_REDIRECT_URL;
  console.log("[CHECKOUT] Using redirect URL:", redirectUrl);

  // 1️⃣ Ensure user exists or create internally
  const user = await ensureUserExists(userId, userEmail);
  console.log("[CHECKOUT] User exists:", user.id);

  // 2️⃣ Fetch cart items
  const cartItems = await getUserCart(userId, userEmail);
  console.log("[CHECKOUT] Cart Items:", cartItems.length);

  if (!cartItems || cartItems.length === 0) {
    throw new AppError("Your cart is empty.", 400);
  }

  // 3️⃣ Ensure Chargebee customer exists
  let chargebeeCustomerId = user.chargebeeCustomerId;

  if (!chargebeeCustomerId) {
    console.log("[CHECKOUT] Creating Chargebee customer...");

    const newCustomer = await chargebee2.customer.create({
      email: user.email,
      auto_collection: "on"
    }).request();

    chargebeeCustomerId = newCustomer.customer.id;

    await prisma2.user.update({
      where: { id: user.id },
      data: { chargebeeCustomerId }
    });

    console.log("[CHECKOUT] Chargebee Customer Created:", chargebeeCustomerId);
  }

  // 4️⃣ Prepare item_prices payload for one-time checkout
  const itemPrices = cartItems.map((c) => ({
    item_price_id: c.product.chargebeeItemPriceId,
    quantity: c.quantity
  }));

  console.log("[CHECKOUT] item_prices payload:", itemPrices);

  // 5️⃣ Correct one-time checkout payload
  const payload = {
    customer: { id: chargebeeCustomerId },
    item_prices: itemPrices,
    currency_code: "INR",
    redirect_url: redirectUrl
  };

  console.log("======= FINAL ONE-TIME CHECKOUT PAYLOAD =======");
  console.log(payload);

  try {
    // 🟢 THE CORRECT ENDPOINT FOR ONE-TIME CART CHECKOUT
    const checkout = await chargebee2.hosted_page
      .checkout_one_time_for_items(payload)
      .request();

    console.log("[CHECKOUT] SUCCESS:", checkout.hosted_page.url);
    return checkout.hosted_page.url;

  } catch (err) {
    console.error("🔥 ERROR from Chargebee:", err);
    throw new AppError("Failed to create checkout session.", 500);
  }
};
