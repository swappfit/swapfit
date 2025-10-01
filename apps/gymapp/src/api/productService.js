// src/api/productService.js

// ✅ Import your central, pre-configured Axios instance
import apiClient from './apiClient'; 

const API_URL = '/merchant/products';

// GET /merchant/products
// No need for headers; apiClient has them automatically.
export const getMyProducts = async () => {
  const response = await apiClient.get(API_URL);
  return response.data;
};

// POST /api/merchant/products
export const addMyProduct = async (productData) => {
  const response = await apiClient.post(API_URL, productData);
  return response.data;
};

// PUT /api/merchant/products/:productId
export const updateMyProduct = async (productId, updateData) => {
  const response = await apiClient.put(`${API_URL}/${productId}`, updateData);
  return response.data;
};

// DELETE /api/merchant/products/:productId
export const deleteMyProduct = async (productId) => {
  const response = await apiClient.delete(`${API_URL}/${productId}`);
  return response.data;
};