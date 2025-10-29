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
  api_version: 'v2', // Make sure you're using v2 for Product Catalog 2.0
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

// Helper function to get or create item family
const getOrCreateItemFamily = async () => {
  console.log(`[BACKEND] [CartService] Getting or creating item family`);
  
  try {
    // Use the item family ID from environment variables if available
    if (process.env.CHARGEBEE_ITEM_FAMILY_ID) {
      console.log(`[BACKEND] [CartService] Using item family from environment: ${process.env.CHARGEBEE_ITEM_FAMILY_ID}`);
      return process.env.CHARGEBEE_ITEM_FAMILY_ID;
    }
    
    // Try to find an existing item family
    const itemFamilies = await chargebee.item_family.list({
      limit: 1,
      "sort_by[desc]": "created_at"
    }).request();
    
    if (itemFamilies.list.length > 0) {
      console.log(`[BACKEND] [CartService] Found existing item family: ${itemFamilies.list[0].item_family.id}`);
      return itemFamilies.list[0].item_family.id;
    }
    
    // Create a new item family if none exists
    const itemFamilyResult = await chargebee.item_family.create({
      name: 'Marketplace Products',
      description: 'Default item family for marketplace products'
    }).request();
    
    const itemFamilyId = itemFamilyResult.item_family.id;
    console.log(`[BACKEND] [CartService] Created new item family: ${itemFamilyId}`);
    return itemFamilyId;
  } catch (error) {
    console.error(`[BACKEND] [CartService] Failed to get or create item family:`, error);
    throw new AppError('Failed to set up product catalog. Please try again.', 500);
  }
};

// Helper function to find or create Chargebee item for a product
const findOrCreateChargebeeItem = async (product) => {
  console.log(`[BACKEND] [CartService] Finding or creating Chargebee item for product: ${product.id}`);
  
  // Check if product already has Chargebee item IDs
  if (product.chargebeeItemId && product.chargebeeItemPriceId) {
    console.log(`[BACKEND] [CartService] Product already has Chargebee item IDs: ${product.chargebeeItemId}, ${product.chargebeeItemPriceId}`);
    
    // Verify that the item and item price actually exist in Chargebee
    try {
      await chargebee.item.retrieve(product.chargebeeItemId).request();
      await chargebee.item_price.retrieve(product.chargebeeItemPriceId).request();
      console.log(`[BACKEND] [CartService] Verified item and item price exist in Chargebee`);
      return { itemId: product.chargebeeItemId, itemPriceId: product.chargebeeItemPriceId };
    } catch (error) {
      console.log(`[BACKEND] [CartService] Item or item price not found in Chargebee, will create new ones`);
      // Continue to create new item and item price
    }
  }
  
  try {
    // Get or create item family
    const itemFamilyId = await getOrCreateItemFamily();
    
    // Generate a unique ID for the Chargebee item
    const chargebeeItemId = `product-${product.id}`;
    
    let itemResult;
    
    // First, try to retrieve the item to see if it already exists
    try {
      console.log(`[BACKEND] [CartService] Checking if item already exists: ${chargebeeItemId}`);
      const retrieveResult = await chargebee.item.retrieve(chargebeeItemId).request();
      itemResult = retrieveResult;
      console.log(`[BACKEND] [CartService] Retrieved existing Chargebee item: ${itemResult.item.id}`);
    } catch (retrieveError) {
      // If the item doesn't exist, create it
      console.log(`[BACKEND] [CartService] Item doesn't exist, creating new one: ${chargebeeItemId}`);
      
      try {
        itemResult = await chargebee.item.create({
          id: chargebeeItemId,
          name: product.name,
          description: product.description || '',
          // FIX: Use 'goods' for one-time products instead of 'charge'
          type: 'goods', 
          status: 'active',
          item_family_id: itemFamilyId,
        }).request();
        
        console.log(`[BACKEND] [CartService] Created Chargebee item: ${itemResult.item.id}`);
      } catch (createError) {
        console.error(`[BACKEND] [CartService] Failed to create item:`, createError);
        throw new AppError('Failed to create product in payment system. Please try again.', 500);
      }
    }
    
    // Generate a unique ID for the Chargebee item price
    const chargebeeItemPriceId = `price-${product.id}`;
    
    let itemPriceResult;
    
    // First, try to retrieve the item price to see if it already exists
    try {
      console.log(`[BACKEND] [CartService] Checking if item price already exists: ${chargebeeItemPriceId}`);
      
      // List all item prices for this item to find the one we're looking for
      const listResult = await chargebee.item_price.list({
        item_id: itemResult.item.id,
        limit: 100
      }).request();
      
      // Find the item price with our ID
      const existingPrice = listResult.list.find(price => price.item_price.id === chargebeeItemPriceId);
      
      if (existingPrice) {
        itemPriceResult = { item_price: existingPrice.item_price };
        console.log(`[BACKEND] [CartService] Retrieved existing Chargebee item price: ${itemPriceResult.item_price.id}`);
      } else {
        throw new Error('Item price not found');
      }
    } catch (retrievePriceError) {
      // If the item price doesn't exist, create it
      console.log(`[BACKEND] [CartService] Item price doesn't exist, creating new one: ${chargebeeItemPriceId}`);
      
      try {
        itemPriceResult = await chargebee.item_price.create({
          id: chargebeeItemPriceId,
          item_id: itemResult.item.id,
          name: `${product.name} - Price`,
          price: Math.round(product.price * 100), // Convert to cents
          pricing_model: 'per_unit',
          status: 'active',
        }).request();
        
        console.log(`[BACKEND] [CartService] Created Chargebee item price: ${itemPriceResult.item_price.id}`);
      } catch (createPriceError) {
        console.error(`[BACKEND] [CartService] Failed to create item price:`, createPriceError);
        throw new AppError('Failed to create product price in payment system. Please try again.', 500);
      }
    }
    
    // Update our product with the Chargebee IDs
    await prisma.product.update({
      where: { id: product.id },
      data: {
        chargebeeItemId: itemResult.item.id,
        chargebeeItemPriceId: itemPriceResult.item_price.id,
      },
    });
    
    console.log(`[BACKEND] [CartService] Updated product with Chargebee IDs`);
    return { itemId: itemResult.item.id, itemPriceId: itemPriceResult.item_price.id };
  } catch (error) {
    console.error(`[BACKEND] [CartService] Failed to create Chargebee item:`, error);
    throw new AppError('Failed to create product in payment system. Please try again.', 500);
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

// --- CHECKOUT FUNCTION (COMPLETELY FIXED WITH WORKAROUND) ---

export const createCartCheckout = async (userId, userEmail) => {
  console.log("--- Starting createCartCheckout ---");
  console.log(`[Input] User ID: ${userId}`);
  
  if (!userId) {
    throw new AppError('userId is required.', 400);
  }
  
  // Ensure user exists in our database
  const user = await ensureUserExists(userId, userEmail);
  console.log(`  -> SUCCESS: Found user: ${user.id} (${user.email})`);

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

  // --- Prepare Items for Chargebee ---
  // FIX: Renamed to 'items' to match the API parameter for one-time checkout
  const items = [];
  
  for (const item of cartItems) {
    // Find or create the Chargebee item for this product
    const { itemId, itemPriceId } = await findOrCreateChargebeeItem(item.product);
    
    items.push({
      item_price_id: itemPriceId,
      quantity: item.quantity,
      // Add metadata for payouts and order tracking
      metadata: {
        internal_product_id: item.product.id,
        internal_merchant_id: item.product.seller.id,
        internal_cart_item_id: item.id,
        product_name: item.product.name,
        product_price: item.product.price
      }
    });
  }

  console.log("STEP 3: Calling Chargebee API to create Hosted Page...");
  
  // Use proper redirect URLs from environment variables
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || 'https://yourapp.com' 
    : process.env.FRONTEND_URL || 'http://localhost:3000';
  
  console.log(`  -> Using base URL: ${baseUrl}`);
  
  // Prepare customer information with proper fallbacks
  const customerInfo = {
    email: user.email,
    first_name: user.memberProfile?.name ? user.memberProfile.name.split(' ')[0] : 'User',
    last_name: user.memberProfile?.name ? user.memberProfile.name.split(' ').slice(1).join(' ') : 'Name',
  };
  
  console.log("  -> Customer info:", customerInfo);
  console.log("  -> Items for checkout:", items);
  
  try {
    // --- ATTEMPT 1: TRY THE IDEAL ONE-TIME CHECKOUT ---
    console.log("[DEBUG] Attempting one-time checkout...");
    const hostedPageResult = await chargebee.hosted_page.checkout_one_time_for_items({
      items: items, 
      redirect_url: process.env.CHARGEBEE_REDIRECT_URL || `${baseUrl}/checkout-success`,
      cancel_url: process.env.CHARGEBEE_CANCEL_URL || `${baseUrl}/checkout-cancelled`,
      customer: customerInfo,
      embed: false,
      template_theme_id: process.env.CHARGEBEE_TEMPLATE_THEME_ID || undefined
    }).request();
    
    console.log("  -> SUCCESS: One-time checkout created.");
    return hostedPageResult.hosted_page.url;

  } catch (error) {
    // --- ATTEMPT 2: FALLBACK TO A SUBSCRIPTION THAT BILLS ONCE ---
    if (error.api_error_code === 'one_time_checkout_not_enabled_in_hp') {
      console.warn("  -> WARNING: One-time checkout not enabled. Falling back to subscription with 1 billing cycle.");
      
      try {
        const hostedPageResult = await chargebee.hosted_page.checkout_new_for_items({
          // NOTE: This endpoint uses 'subscription_items'
          subscription_items: items, 
          redirect_url: process.env.CHARGEBEE_REDIRECT_URL || `${baseUrl}/checkout-success`,
          cancel_url: process.env.CHARGEBEE_CANCEL_URL || `${baseUrl}/checkout-cancelled`,
          customer: customerInfo,
          embed: false,
          template_theme_id: process.env.CHARGEBEE_TEMPLATE_THEME_ID || undefined,
          // --- This is the key to making it a one-time payment ---
          billing_cycles: 1, // The subscription will only bill once and then expire.
          terms_of_service: 'This is a one-time purchase with no recurring charges.',
        }).request();
        
        console.log("  -> SUCCESS: Fallback checkout (1-bill-cycle subscription) created.");
        return hostedPageResult.hosted_page.url;

      } catch (fallbackError) {
        console.error("🔥🔥🔥 ERROR in fallback checkout 🔥🔥🔥");
        throw new AppError(`Failed to create checkout: ${fallbackError.message}`, 500);
      }
    } else {
      // If it's a different error, just throw it
      console.error("🔥🔥🔥 ERROR in createCartCheckout 🔥🔥🔥");
      throw new AppError(`Failed to create checkout: ${error.message}`, 500);
    }
  }
};