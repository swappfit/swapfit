import { PrismaClient } from '@prisma/client';
import AppError from '../utils/AppError.js';
const prisma = new PrismaClient();

// Helper function to ensure user exists in database
const ensureUserExists = async (userId, userEmail) => {
  console.log(`[BACKEND] [CartService] Ensuring user exists: ${userId}`);
  
  try {
    // First try to find user by full ID
    let user = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (user) {
      console.log(`[BACKEND] [CartService] User found by full ID`);
      return user;
    }
    
    // If not found, try to find by the part after the pipe
    const idParts = userId.split('|');
    if (idParts.length > 1) {
      const altUserId = idParts[1];
      console.log(`[BACKEND] [CartService] Trying alternative ID: ${altUserId}`);
      
      user = await prisma.user.findUnique({
        where: { id: altUserId },
      });
      
      if (user) {
        console.log(`[BACKEND] [CartService] User found by alternative ID, updating to full ID`);
        // Update the user ID to the full one
        user = await prisma.user.update({
          where: { id: altUserId },
          data: { id: userId },
        });
        return user;
      }
    }
    
    // If still not found, create the user
    console.log(`[BACKEND] [CartService] Creating new user with ID: ${userId}`);
    
    // Extract provider from user ID (format: provider|userId)
    let provider = 'local'; // Default provider
    let auth0Id = null;
    
    if (userId.includes('|')) {
      provider = userId.split('|')[0];
      auth0Id = userId.split('|')[1];
    }
    
    // Create user with all required fields
    const userData = {
      id: userId,
      email: userEmail || `user-${userId}@example.com`,
      provider: provider,
      role: 'USER', // Add the required role field with default value
    };
    
    // Add auth0_id if it's an Auth0 user
    if (auth0Id) {
      userData.auth0_id = auth0Id;
    }
    
    console.log(`[BACKEND] [CartService] Creating user with data:`, userData);
    
    user = await prisma.user.create({
      data: userData,
    });
    
    console.log(`[BACKEND] [CartService] User created successfully:`, user);
    return user;
    
  } catch (error) {
    console.error(`[BACKEND] [CartService] Error ensuring user exists:`, error);
    console.error(`[BACKEND] [CartService] Error details:`, {
      code: error.code,
      meta: error.meta,
      message: error.message,
      stack: error.stack
    });
    
    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      // Unique constraint violation
      throw new AppError('User already exists with this ID', 409);
    } else if (error.code === 'P2003') {
      // Foreign key constraint violation
      throw new AppError('Invalid user data provided', 400);
    } else if (error.code === 'P2004') {
      // A constraint failed on the database
      throw new AppError('User data violates database constraints', 400);
    } else if (error.code === 'P2025') {
      // Record not found
      throw new AppError('User not found', 404);
    } else {
      throw new AppError(`Failed to create or update user: ${error.message}`, 500);
    }
  }
};

export const addItemToCart = async (userId, { productId, quantity }, userEmail) => {
  console.log(`[BACKEND] [CartService] Adding item to cart:`, { userId, productId, quantity });
  
  // Ensure user exists in database
  await ensureUserExists(userId, userEmail);
  
  // First, ensure the product exists.
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });
  console.log(`[BACKEND] [CartService] Found product:`, product);

  // Check for product existence and stock for clearer error messages.
  if (!product) {
    console.error(`[BACKEND] [CartService] Product not found: ${productId}`);
    throw new AppError('Product not found.', 404);
  }
  if (product.stock < 1) {
    console.error(`[BACKEND] [CartService] Product out of stock: ${productId}`);
    throw new AppError('Product is out of stock.', 400);
  }

  try {
    // First check if cart item already exists
    console.log(`[BACKEND] [CartService] Checking for existing cart item`);
    const existingCartItem = await prisma.cartItem.findUnique({
      where: {
        userId_productId: {
          userId: userId,
          productId: productId,
        },
      },
    });
    console.log(`[BACKEND] [CartService] Existing cart item:`, existingCartItem);

    let cartItem;
    
    if (existingCartItem) {
      console.log(`[BACKEND] [CartService] Updating existing cart item`);
      cartItem = await prisma.cartItem.update({
        where: {
          id: existingCartItem.id,
        },
        data: {
          quantity: existingCartItem.quantity + quantity,
        },
        include: {
          product: true,
        },
      });
    } else {
      console.log(`[BACKEND] [CartService] Creating new cart item`);
      cartItem = await prisma.cartItem.create({
        data: {
          userId: userId,
          productId: productId,
          quantity: quantity,
        },
        include: {
          product: true,
        },
      });
    }
    
    console.log(`[BACKEND] [CartService] Cart item operation successful:`, cartItem);
    return cartItem;
  } catch (error) {
    console.error(`[BACKEND] [CartService] Database error:`, error);
    console.error(`[BACKEND] [CartService] Error details:`, {
      code: error.code,
      meta: error.meta,
      message: error.message
    });
    throw new AppError(`Database error: ${error.message}`, 500);
  }
};

export const getUserCart = async (userId, userEmail) => {
  console.log(`[BACKEND] [CartService] Fetching cart for userId: ${userId}`);
  
  // Ensure user exists
  await ensureUserExists(userId, userEmail);
  
  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
    include: { product: true },
    orderBy: { addedAt: 'asc' },
  });
  console.log(`[BACKEND] [CartService] Found ${cartItems.length} items for this user.`);
  return cartItems;
};

export const updateCartItemQuantity = async (userId, cartItemId, quantity, userEmail) => {
  console.log(`[BACKEND] [CartService] Updating cart item quantity:`, { userId, cartItemId, quantity });
  
  // Ensure user exists
  await ensureUserExists(userId, userEmail);
  
  const cartItem = await prisma.cartItem.findFirst({
    where: { id: cartItemId, userId },
  });
  
  if (!cartItem) {
    console.error(`[BACKEND] [CartService] Cart item not found: ${cartItemId}`);
    throw new AppError('Cart item not found.', 404);
  }
  
  const updatedItem = await prisma.cartItem.update({
    where: { id: cartItemId },
    data: { quantity },
    include: { product: true },
  });
  
  console.log(`[BACKEND] [CartService] Updated cart item:`, updatedItem);
  return updatedItem;
};

export const removeItemFromCart = async (userId, cartItemId, userEmail) => {
  console.log(`[BACKEND] [CartService] Removing cart item:`, { userId, cartItemId });
  
  // Ensure user exists
  await ensureUserExists(userId, userEmail);
  
  const cartItem = await prisma.cartItem.findFirst({
    where: { id: cartItemId, userId },
  });
  
  if (!cartItem) {
    console.error(`[BACKEND] [CartService] Cart item not found: ${cartItemId}`);
    throw new AppError('Cart item not found.', 404);
  }
  
  await prisma.cartItem.delete({ where: { id: cartItemId } });
  console.log(`[BACKEND] [CartService] Cart item deleted successfully`);
};

export const createCartCheckout = async (userId, userEmail) => {
  console.log(`[BACKEND] [CartService] Creating checkout for user: ${userId}`);
  
  // Ensure user exists
  await ensureUserExists(userId, userEmail);
  
  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
    include: { product: true },
  });
  
  if (cartItems.length === 0) {
    console.error(`[BACKEND] [CartService] Cart is empty for user: ${userId}`);
    throw new AppError('Your cart is empty.', 400);
  }
  
  const totalAmount = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  
  const chargebeeCustomerId = await getOrCreateChargebeeCustomer(userId);

  console.log(
    `[BACKEND] [STUB] Would create one-time checkout for customer ${chargebeeCustomerId} for amount ${totalAmount}`
  );
  
  const dummyCheckoutUrl = `https://your-app.com/test-store-checkout?total=${totalAmount}`;
  return { checkoutUrl: dummyCheckoutUrl, totalAmount };
};

const getOrCreateChargebeeCustomer = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found.', 404);
  if (user.chargebeeCustomerId) return user.chargebeeCustomerId;

  console.log(`[BACKEND] [STUB] Would create Chargebee customer for user: ${user.email}`);
  const dummyChargebeeId = `cb_stub_${user.id}`;
  await prisma.user.update({
    where: { id: userId },
    data: { chargebeeCustomerId: dummyChargebeeId },
  });
  return dummyChargebeeId;
};