import { PrismaClient } from '@prisma/client';
import chargebeeModule from 'chargebee-typescript';
import AppError from '../utils/AppError.js';

const prisma = new PrismaClient();

// Initialize Chargebee with your environment variables
const { ChargeBee } = chargebeeModule;
const chargebee = new ChargeBee();
chargebee.configure({
  site: process.env.CHARGEBEE_SITE,
  api_key: process.env.CHARGEBEE_API_KEY,
  api_version: 'v2',
});

// Helper function to ensure user exists in database
const ensureUserExists = async (userId, userEmail) => {
  console.log(`[BACKEND] [CartService] Ensuring user exists: ${userId}`);
  
  try {
    let user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      console.log(`[BACKEND] [CartService] User found by full ID`);
      return user;
    }
    
    // Try alternative ID format (for Auth0 users)
    const idParts = userId.split('|');
    if (idParts.length > 1) {
      const altUserId = idParts[1];
      console.log(`[BACKEND] [CartService] Trying alternative ID: ${altUserId}`);
      user = await prisma.user.findUnique({ where: { id: altUserId } });
      if (user) {
        console.log(`[BACKEND] [CartService] User found by alternative ID, updating to full ID`);
        user = await prisma.user.update({ 
          where: { id: altUserId }, 
          data: { id: userId } 
        });
        return user;
      }
    }
    
    // Create new user if not found
    console.log(`[BACKEND] [CartService] Creating new user with ID: ${userId}`);
    let provider = 'local';
    let auth0Id = null;
    
    if (userId.includes('|')) {
      provider = userId.split('|')[0];
      auth0Id = userId.split('|')[1];
    }
    
    const userData = { 
      id: userId, 
      email: userEmail || `user-${userId}@example.com`, 
      provider: provider, 
      role: 'USER' 
    };
    
    if (auth0Id) userData.auth0_id = auth0Id;
    
    console.log(`[BACKEND] [CartService] Creating user with data:`, userData);
    user = await prisma.user.create({ data: userData });
    console.log(`[BACKEND] [CartService] User created successfully:`, user);
    return user;
  } catch (error) {
    console.error(`[BACKEND] [CartService] Error ensuring user exists:`, error);
    if (error.code === 'P2002') throw new AppError('User already exists with this ID', 409);
    else if (error.code === 'P2003') throw new AppError('Invalid user data provided', 400);
    else if (error.code === 'P2004') throw new AppError('User data violates database constraints', 400);
    else if (error.code === 'P2025') throw new AppError('User not found', 404);
    else throw new AppError(`Failed to create or update user: ${error.message}`, 500);
  }
};

// --- CART OPERATIONS ---

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
    const existingCartItem = await prisma.cartItem.findUnique({ 
      where: { userId_productId: { userId, productId } } 
    });
    
    console.log(`[BACKEND] [CartService] Existing cart item:`, existingCartItem);
    
    let cartItem;
    if (existingCartItem) {
      console.log(`[BACKEND] [CartService] Updating existing cart item`);
      cartItem = await prisma.cartItem.update({ 
        where: { id: existingCartItem.id }, 
        data: { quantity: existingCartItem.quantity + quantity }, 
        include: { product: true } 
      });
    } else {
      console.log(`[BACKEND] [CartService] Creating new cart item`);
      cartItem = await prisma.cartItem.create({ 
        data: { userId, productId, quantity }, 
        include: { product: true } 
      });
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
  
  const cartItems = await prisma.cartItem.findMany({ 
    where: { userId }, 
    include: { product: true }, 
    orderBy: { addedAt: 'asc' } 
  });
  
  console.log(`[BACKEND] [CartService] Found ${cartItems.length} items for this user.`);
  return cartItems;
};

export const updateCartItemQuantity = async (userId, cartItemId, quantity, userEmail) => {
  console.log(`[BACKEND] [CartService] Updating cart item quantity:`, { userId, cartItemId, quantity });
  await ensureUserExists(userId, userEmail);
  
  const cartItem = await prisma.cartItem.findFirst({ 
    where: { id: cartItemId, userId } 
  });
  
  if (!cartItem) {
    console.error(`[BACKEND] [CartService] Cart item not found: ${cartItemId}`);
    throw new AppError('Cart item not found.', 404);
  }
  
  const updatedItem = await prisma.cartItem.update({ 
    where: { id: cartItemId }, 
    data: { quantity }, 
    include: { product: true } 
  });
  
  console.log(`[BACKEND] [CartService] Updated cart item:`, updatedItem);
  return updatedItem;
};

export const removeItemFromCart = async (userId, cartItemId, userEmail) => {
  console.log(`[BACKEND] [CartService] Removing cart item:`, { userId, cartItemId });
  await ensureUserExists(userId, userEmail);
  
  const cartItem = await prisma.cartItem.findFirst({ 
    where: { id: cartItemId, userId } 
  });
  
  if (!cartItem) {
    console.error(`[BACKEND] [CartService] Cart item not found: ${cartItemId}`);
    throw new AppError('Cart item not found.', 404);
  }
  
  await prisma.cartItem.delete({ where: { id: cartItemId } });
  console.log(`[BACKEND] [CartService] Cart item deleted successfully`);
};

// --- CHECKOUT FUNCTION (100% PRODUCT CATALOG 2.0 COMPATIBLE) ---

export const createCartCheckout = async (userId, userEmail) => {
  console.log("--- Starting createCartCheckout ---");
  console.log(`[Input] User ID: ${userId}`);
  
  if (!userId) {
    throw new AppError('userId is required.', 400);
  }
  
  // Ensure user exists in our database
  const user = await ensureUserExists(userId, userEmail);
  console.log(`  -> SUCCESS: Found user: ${user.id} (${user.email})`);

  // Fetch all cart items for user
  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
    include: { 
      product: {
        include: { seller: true }
      }
    },
  });
  
  if (cartItems.length === 0) {
    console.error(`[BACKEND] [CartService] Cart is empty for user: ${userId}`);
    throw new AppError('Your cart is empty.', 400);
  }

  // Calculate total amount
  const totalAmount = cartItems.reduce(
    (total, item) => total + (item.product.price * item.quantity), 
    0
  );
  
  console.log(`[BACKEND] [CartService] Total amount: ${totalAmount}`);

  // Use proper redirect URLs
  const redirectUrl = process.env.NODE_ENV === 'production' 
    ? 'https://yourapp.com/payment-complete' 
    : 'http://localhost:3000/payment-complete';
  
  const cancelUrl = process.env.NODE_ENV === 'production' 
    ? 'https://yourapp.com/payment-cancelled' 
    : 'http://localhost:3000/payment-cancelled';
  
  console.log(`  -> Using redirect URL: ${redirectUrl}`);
  console.log(`  -> Using cancel URL: ${cancelUrl}`);
  
  // Prepare customer information
  const customerInfo = {
    email: user.email,
    first_name: user.memberProfile?.name ? user.memberProfile.name.split(' ')[0] : 'User',
    last_name: user.memberProfile?.name ? user.memberProfile.name.split(' ').slice(1).join(' ') : 'Name',
  };
  
  console.log("  -> Customer info:", customerInfo);
  
  // Initialize customer variable outside try block
  let customer;
  
  try {
    // Create or retrieve customer
    try {
      const customerResult = await chargebee.customer.retrieve(userId).request();
      customer = customerResult.customer;
    } catch (customerError) {
      console.log("Creating new customer in Chargebee...");
      const createCustomerResult = await chargebee.customer.create({
        id: userId,
        email: customerInfo.email,
        first_name: customerInfo.first_name,
        last_name: customerInfo.last_name,
      }).request();
      customer = createCustomerResult.customer;
    }
    
    // FIXED: Check if products have valid chargebeeItemPriceId before creating checkout
    const validCartItems = cartItems.filter(item => 
      item.product && 
      item.product.chargebeeItemPriceId && 
      item.product.chargebeeItemPriceId.trim() !== ''
    );
    
    if (validCartItems.length === 0) {
      throw new AppError('No valid items available for checkout. Please contact support.', 400);
    }
    
    console.log(`[BACKEND] [CartService] Found ${validCartItems.length} valid items for checkout.`);
    
    // FIXED: Use the correct Product Catalog 2.0 API with actual product item_price_ids
    // Create a hosted page for one-time purchase (PC 2.0 compatible)
    const oneTimeItems = validCartItems.map(item => ({
      item_price_id: item.product.chargebeeItemPriceId, // Use the actual item price ID from the product
      quantity: item.quantity,
      metadata: {
        internal_product_id: item.product.id,
        internal_merchant_id: item.product.seller.id,
        internal_cart_item_id: `cart_${userId}_${item.product.id}_${Date.now()}`,
      },
    }));
    
    // Debug log to see what we're sending to Chargebee
    console.log("  -> One-time items for checkout:", JSON.stringify(oneTimeItems, null, 2));
    
    const hostedPageResult = await chargebee.hosted_page.checkout_new_for_items({
      customer: {
        id: customer.id,
        email: customer.email,
        first_name: customer.first_name,
        last_name: customer.last_name,
      },
      redirect_url: redirectUrl,
      cancel_url: cancelUrl,
      embed: false,
      // Use one_time_items for one-time purchases with actual product IDs
      one_time_items: oneTimeItems,
      notes: JSON.stringify({
        cartItems: validCartItems.map(item => ({
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
          sellerId: item.product.seller.id
        })),
        userId: userId,
        totalAmount: totalAmount,
        paymentType: "cart_checkout"
      })
    }).request();
    
    console.log("  -> SUCCESS: Checkout page created.");
    return hostedPageResult.hosted_page.url;
    
  } catch (error) {
    console.error("🔥🔥🔥 ERROR in createCartCheckout 🔥🔥🔥");
    console.error("Error details:", error);
    
    // FIXED: Instead of using a complex fallback, let's just return a simple error message
    // The primary checkout method should work for most cases
    // If it fails, we'll just return an error to the user
    console.error("Primary checkout failed, no fallback available");
    throw new AppError(`Failed to create checkout: ${error.message}`, 500);
  }
};