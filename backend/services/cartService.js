import { PrismaClient } from '@prisma/client';
import AppError from '../utils/AppError.js';
import chargebeeModule from 'chargebee-typescript'; // ✅ NEW: Import Chargebee

// ✅ NEW: Initialize Chargebee with your environment variables
const { ChargeBee } = chargebeeModule;
const chargebee = new ChargeBee();
chargebee.configure({
  site: process.env.CHARGEBEE_SITE,
  api_key: process.env.CHARGEBEE_API_KEY
});

const prisma = new PrismaClient();

// Helper function to ensure user exists in database
const ensureUserExists = async (userId, userEmail) => {
  console.log(`[BACKEND] [CartService] Ensuring user exists: ${userId}`);
  
  try {
    // ... (your existing ensureUserExists logic remains the same)
    let user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      console.log(`[BACKEND] [CartService] User found by full ID`);
      return user;
    }
    const idParts = userId.split('|');
    if (idParts.length > 1) {
      const altUserId = idParts[1];
      console.log(`[BACKEND] [CartService] Trying alternative ID: ${altUserId}`);
      user = await prisma.user.findUnique({ where: { id: altUserId } });
      if (user) {
        console.log(`[BACKEND] [CartService] User found by alternative ID, updating to full ID`);
        user = await prisma.user.update({ where: { id: altUserId }, data: { id: userId } });
        return user;
      }
    }
    console.log(`[BACKEND] [CartService] Creating new user with ID: ${userId}`);
    let provider = 'local';
    let auth0Id = null;
    if (userId.includes('|')) {
      provider = userId.split('|')[0];
      auth0Id = userId.split('|')[1];
    }
    const userData = { id: userId, email: userEmail || `user-${userId}@example.com`, provider: provider, role: 'USER' };
    if (auth0Id) userData.auth0_id = auth0Id;
    console.log(`[BACKEND] [CartService] Creating user with data:`, userData);
    user = await prisma.user.create({ data: userData });
    console.log(`[BACKEND] [CartService] User created successfully:`, user);
    return user;
  } catch (error) {
    // ... (your existing error handling logic remains the same)
    console.error(`[BACKEND] [CartService] Error ensuring user exists:`, error);
    if (error.code === 'P2002') throw new AppError('User already exists with this ID', 409);
    else if (error.code === 'P2003') throw new AppError('Invalid user data provided', 400);
    else if (error.code === 'P2004') throw new AppError('User data violates database constraints', 400);
    else if (error.code === 'P2025') throw new AppError('User not found', 404);
    else throw new AppError(`Failed to create or update user: ${error.message}`, 500);
  }
};

// --- ORIGINAL FUNCTIONS (UNCHANGED) ---

export const addItemToCart = async (userId, { productId, quantity }, userEmail) => {
  console.log(`[BACKEND] [CartService] Adding item to cart:`, { userId, productId, quantity });
  await ensureUserExists(userId, userEmail);
  const product = await prisma.product.findUnique({ where: { id: productId } });
  console.log(`[BACKEND] [CartService] Found product:`, product);
  if (!product) {
    console.error(`[BACKEND] [CartService] Product not found: ${productId}`);
    throw new AppError('Product not found.', 404);
  }
  if (product.stock < 1) {
    console.error(`[BACKEND] [CartService] Product out of stock: ${productId}`);
    throw new AppError('Product is out of stock.', 400);
  }
  try {
    const existingCartItem = await prisma.cartItem.findUnique({ where: { userId_productId: { userId, productId } } });
    console.log(`[BACKEND] [CartService] Existing cart item:`, existingCartItem);
    let cartItem;
    if (existingCartItem) {
      console.log(`[BACKEND] [CartService] Updating existing cart item`);
      cartItem = await prisma.cartItem.update({ where: { id: existingCartItem.id }, data: { quantity: existingCartItem.quantity + quantity }, include: { product: true } });
    } else {
      console.log(`[BACKEND] [CartService] Creating new cart item`);
      cartItem = await prisma.cartItem.create({ data: { userId, productId, quantity }, include: { product: true } });
    }
    console.log(`[BACKEND] [CartService] Cart item operation successful:`, cartItem);
    return cartItem;
  } catch (error) {
    console.error(`[BACKEND] [CartService] Database error:`, error);
    throw new AppError(`Database error: ${error.message}`, 500);
  }
};

export const getUserCart = async (userId, userEmail) => {
  console.log(`[BACKEND] [CartService] Fetching cart for userId: ${userId}`);
  await ensureUserExists(userId, userEmail);
  const cartItems = await prisma.cartItem.findMany({ where: { userId }, include: { product: true }, orderBy: { addedAt: 'asc' } });
  console.log(`[BACKEND] [CartService] Found ${cartItems.length} items for this user.`);
  return cartItems;
};

export const updateCartItemQuantity = async (userId, cartItemId, quantity, userEmail) => {
  console.log(`[BACKEND] [CartService] Updating cart item quantity:`, { userId, cartItemId, quantity });
  await ensureUserExists(userId, userEmail);
  const cartItem = await prisma.cartItem.findFirst({ where: { id: cartItemId, userId } });
  if (!cartItem) {
    console.error(`[BACKEND] [CartService] Cart item not found: ${cartItemId}`);
    throw new AppError('Cart item not found.', 404);
  }
  const updatedItem = await prisma.cartItem.update({ where: { id: cartItemId }, data: { quantity }, include: { product: true } });
  console.log(`[BACKEND] [CartService] Updated cart item:`, updatedItem);
  return updatedItem;
};

export const removeItemFromCart = async (userId, cartItemId, userEmail) => {
  console.log(`[BACKEND] [CartService] Removing cart item:`, { userId, cartItemId });
  await ensureUserExists(userId, userEmail);
  const cartItem = await prisma.cartItem.findFirst({ where: { id: cartItemId, userId } });
  if (!cartItem) {
    console.error(`[BACKEND] [CartService] Cart item not found: ${cartItemId}`);
    throw new AppError('Cart item not found.', 404);
  }
  await prisma.cartItem.delete({ where: { id: cartItemId } });
  console.log(`[BACKEND] [CartService] Cart item deleted successfully`);
};


// ✅ ✅ ✅ PART 1: NEW FULLY IMPLEMENTED FUNCTION ✅ ✅ ✅

export const createCartCheckout = async (userId, userEmail) => {
  console.log(`[BACKEND] [CartService] Creating checkout for user: ${userId}`);
  
  // Ensure user exists in our database
  const user = await ensureUserExists(userId, userEmail);

  // Fetch all cart items for the user, including product and seller details
  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
    include: { 
      product: {
        include: { seller: true } // Include seller to get merchant info for metadata
      }
    },
  });
  
  if (cartItems.length === 0) {
    console.error(`[BACKEND] [CartService] Cart is empty for user: ${userId}`);
    throw new AppError('Your cart is empty.', 400);
  }

  // --- Chargebee Customer Logic ---
  let chargebeeCustomerId = user.chargebeeCustomerId;
  if (!chargebeeCustomerId) {
    console.log(`[BACKEND] [CartService] No Chargebee customer found for user ${user.id}. Creating one...`);
    try {
      const customerResult = await chargebee.customer.create({
        email: user.email,
        first_name: user.memberProfile?.name || user.email.split('@')[0],
      }).request();
      chargebeeCustomerId = customerResult.customer.id;
      
      // Save the new Chargebee ID back to our user record
      await prisma.user.update({
        where: { id: userId },
        data: { chargebeeCustomerId: chargebeeCustomerId },
      });
      console.log(`[BACKEND] [CartService] Created and saved Chargebee customer: ${chargebeeCustomerId}`);
    } catch (error) {
      console.error(`[BACKEND] [CartService] Failed to create Chargebee customer:`, error);
      throw new AppError('Could not create a billing profile. Please try again.', 500);
    }
  }

  // --- Prepare Line Items for Chargebee Invoice ---
  const invoiceLineItems = cartItems.map(item => ({
    item_type: "charge",
    description: item.product.name,
    amount: Math.round(item.product.price * 100), // Amount in cents
    quantity: item.quantity,
    // ✅ CRITICAL: Add metadata for payouts and order tracking
    metadata: {
      internal_product_id: item.product.id,
      internal_merchant_id: item.product.seller.id,
      internal_cart_item_id: item.id, // To delete cart items after payment
    }
  }));

  // --- Create Ad-Hoc Invoice in Chargebee ---
  console.log(`[BACKEND] [CartService] Creating ad-hoc invoice for customer ${chargebeeCustomerId}`);
  let invoiceResult;
  try {
    invoiceResult = await chargebee.invoice.create({
      customer_id: chargebeeCustomerId,
      line_items: invoiceLineItems,
    }).request();
  } catch (error) {
    console.error(`[BACKEND] [CartService] Failed to create Chargebee invoice:`, error);
    throw new AppError('Failed to generate invoice. Please try again.', 500);
  }

  // --- Create Hosted Checkout Page ---
  console.log(`[BACKEND] [CartService] Creating hosted checkout page for invoice ${invoiceResult.invoice.id}`);
  let checkoutPageResult;
  try {
    checkoutPageResult = await chargebee.checkout_page.create_for_invoice({
      invoice: { id: invoiceResult.invoice.id }
    }).request();
  } catch (error) {
    console.error(`[BACKEND] [CartService] Failed to create Chargebee checkout page:`, error);
    throw new AppError('Failed to create payment page. Please try again.', 500);
  }
  
  console.log(`[BACKEND] [CartService] Checkout created successfully. URL: ${checkoutPageResult.checkout_page.url}`);
  
  // Return the hosted page URL to the frontend
  return { checkoutUrl: checkoutPageResult.checkout_page.url };
};