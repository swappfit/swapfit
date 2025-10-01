// src/controllers/ProductController.js

import * as productService from '../services/productService.js';
import catchAsync from '../utils/catchAsync.js';

export const getAllPublicProducts = catchAsync(async (req, res) => {
  // Pass pagination query params like { page, limit } to the service
  const result = await productService.getAllPublicProducts(req.query);
  res.status(200).json({ success: true, ...result });
});

export const getPublicProductById = catchAsync(async (req, res) => {
    const { productId } = req.params;
    const product = await productService.getPublicProductById(productId);
    res.status(200).json({ success: true, data: product });
});