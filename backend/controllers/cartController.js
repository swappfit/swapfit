import * as cartService from '../services/cartService.js';
import catchAsync from '../utils/catchAsync.js';

const getUserId = (req) => {
  return req.auth.payload.sub;
}

const getUserEmail = (req) => {
  return req.auth.payload.email || null;
}

export const getMyCart = catchAsync(async (req, res) => {
  const userId = getUserId(req);
  const userEmail = getUserEmail(req);
  console.log('[BACKEND] Getting cart for user:', userId);
  const cart = await cartService.getUserCart(userId, userEmail);
  console.log('[BACKEND] Retrieved cart:', cart);
  res.status(200).json({ success: true, data: cart });
});

export const addToCart = catchAsync(async (req, res) => {
  const userId = getUserId(req);
  const userEmail = getUserEmail(req);
  console.log('[BACKEND] --- Add To Cart Controller ---');
  console.log('[BACKEND] User ID from Token (sub):', userId);
  console.log('[BACKEND] User Email from Token:', userEmail);
  console.log('[BACKEND] Request Body:', req.body);

  if (!req.body || !req.body.productId) {
    console.error('[BACKEND] SERVER ERROR: Request body is empty or missing productId');
    return res.status(400).json({ 
      success: false, 
      message: 'Product ID is required' 
    });
  }

  if (!req.body.quantity || req.body.quantity < 1) {
    console.error('[BACKEND] SERVER ERROR: Invalid quantity');
    return res.status(400).json({ 
      success: false, 
      message: 'Quantity must be at least 1' 
    });
  }

  console.log(`[BACKEND] Calling cartService.addItemToCart for user ${userId}...`);
  
  try {
    const updatedItem = await cartService.addItemToCart(userId, req.body, userEmail);
    console.log('[BACKEND] ✅ Item successfully added/updated in service:', updatedItem);

    res.status(200).json({
      success: true,
      message: 'Item added to cart.',
      data: updatedItem
    });
  } catch (error) {
    console.error('[BACKEND] ❌ Error in addToCart controller:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to add item to cart',
      error: error.message
    });
  }
});

export const updateCartItem = catchAsync(async (req, res) => {
    const userId = getUserId(req);
    const userEmail = getUserEmail(req);
    const { cartItemId } = req.params;
    const { quantity } = req.body;
    console.log('[BACKEND] Updating cart item:', { userId, cartItemId, quantity });
    
    if (!quantity || quantity < 1) {
      return res.status(400).json({ 
        success: false, 
        message: 'Quantity must be at least 1' 
      });
    }
    
    const updatedItem = await cartService.updateCartItemQuantity(userId, cartItemId, quantity, userEmail);
    console.log('[BACKEND] Updated cart item:', updatedItem);
    res.status(200).json({ success: true, message: 'Cart updated.', data: updatedItem });
});

export const removeFromCart = catchAsync(async (req, res) => {
  const userId = getUserId(req);
  const userEmail = getUserEmail(req);
  const { cartItemId } = req.params;
  console.log('[BACKEND] Removing cart item:', { userId, cartItemId });
  await cartService.removeItemFromCart(userId, cartItemId, userEmail);
  console.log('[BACKEND] Cart item removed successfully');
  res.status(204).send();
});

export const createCheckout = catchAsync(async (req, res) => {
  const userId = getUserId(req);
  const userEmail = getUserEmail(req);
  console.log('[BACKEND] Creating checkout for user:', userId);
  
  try {
    const checkoutUrl = await cartService.createCartCheckout(userId, userEmail);
    console.log('[BACKEND] Checkout created:', checkoutUrl);
    
    res.status(200).json({ 
      success: true, 
      data: { checkoutUrl }
    });
  } catch (error) {
    console.error('[BACKEND] Error creating checkout:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to create checkout',
      error: error.message
    });
  }
});