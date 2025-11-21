// src/controllers/merchantController.js

import * as productService from '../services/productService.js';
import * as authService from '../services/authService.js';
import { generateInternalToken } from '../utils/tokenUtils.js';
import catchAsync from '../utils/catchAsync.js';

// --- Product Management ---

export const createMyProduct = catchAsync(async (req, res) => {
  console.log("✅ [MerchantController] createMyProduct: Entered controller.");

  try {
    const userId = req.user.id;
    console.log("✅ [MerchantController] createMyProduct: userId:", userId);
    
    if (!userId) {
        console.error("❌ [MerchantController] createMyProduct: req.user.id is missing!");
        throw new Error("User ID not found in request.");
    }

    console.log("✅ [MerchantController] createMyProduct: About to call productService.createProductForMerchant...");
    const newProduct = await productService.createProductForMerchant(userId, req.body);
    console.log("✅ [MerchantController] createMyProduct: Service call completed successfully.");

    console.log("✅ [MerchantController] createMyProduct: About to call authService.getFullUserById...");
    const updatedUser = await authService.getFullUserById(userId);
    console.log("✅ [MerchantController] createMyProduct: getFullUserById completed.");

    console.log("✅ [MerchantController] createMyProduct: About to generate new token...");
    const newToken = generateInternalToken(updatedUser);
    console.log("✅ [MerchantController] createMyProduct: Token generated.");

    console.log("✅ [MerchantController] createMyProduct: Sending 201 response.");
    res.status(201).json({
      success: true,
      data: { 
        token: newToken, 
        user: updatedUser,
        product: newProduct
      },
    });

  } catch (error) {
    // This will catch any error and log it with a stack trace
    console.error("❌ [MerchantController] createMyProduct: An error was caught inside the controller:");
    console.error(error); // This will print the full error object and stack trace

    // Re-throw the error so catchAsync can send the proper error response to the client
    throw error;
  }
});

export const getMyProducts = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const products = await productService.getProductsForMerchant(userId);
  res.status(200).json({ success: true, data: products });
});

export const updateMyProduct = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.params;
  await productService.updateProductForMerchant(userId, productId, req.body);

  const updatedUser = await authService.getFullUserById(userId);
  const newToken = generateInternalToken(updatedUser);

  res.status(200).json({
    success: true,
    data: { token: newToken, user: updatedUser },
  });
});

export const deleteMyProduct = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.params;
  await productService.deleteProductForMerchant(userId, productId);

  const updatedUser = await authService.getFullUserById(userId);
  const newToken = generateInternalToken(updatedUser);
  
  res.status(200).json({
    success: true,
    data: { token: newToken, user: updatedUser },
  });
});
// --------------------------------------------------------
// GET ALL ORDERS FOR MERCHANT
// --------------------------------------------------------
export const getMyOrders = catchAsync(async (req, res) => {
  const merchantId = req.user.id;

  const orders = await merchantService.getMyOrders(merchantId);

  const updatedUser = await authService.getFullUserById(merchantId);
  const newToken = generateInternalToken(updatedUser);

  res.status(200).json({
    success: true,
    data: { token: newToken, user: updatedUser, orders },
  });
});

// --------------------------------------------------------
// GET AN ORDER BY ID
// --------------------------------------------------------
export const getOrderById = catchAsync(async (req, res) => {
  const merchantId = req.user.id;
  const { orderId } = req.params;

  const order = await merchantService.getOrderById(merchantId, orderId);

  const updatedUser = await authService.getFullUserById(merchantId);
  const newToken = generateInternalToken(updatedUser);

  res.status(200).json({
    success: true,
    data: { token: newToken, user: updatedUser, order },
  });
});

// --------------------------------------------------------
// UPDATE ORDER STATUS
// --------------------------------------------------------
export const updateOrderStatus = catchAsync(async (req, res) => {
  const merchantId = req.user.id;
  const { orderId } = req.params;
  const { status } = req.body;

  const updatedOrder = await merchantService.updateOrderStatus(
    merchantId,
    orderId,
    status
  );

  const updatedUser = await authService.getFullUserById(merchantId);
  const newToken = generateInternalToken(updatedUser);

  res.status(200).json({
    success: true,
    data: { token: newToken, user: updatedUser, order: updatedOrder },
  });
});

