// src/controllers/merchantController.js

import * as productService from '../services/productService.js';
import * as authService from '../services/authService.js';
import { generateInternalToken } from '../utils/tokenUtils.js';
import catchAsync from '../utils/catchAsync.js';

// --- Product Management ---

export const createMyProduct = catchAsync(async (req, res) => {
  const userId = req.user.id;
  await productService.createProductForMerchant(userId, req.body);
  
  const updatedUser = await authService.getFullUserById(userId);
  const newToken = generateInternalToken(updatedUser);

  res.status(201).json({
    success: true,
    data: { token: newToken, user: updatedUser },
  });
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

