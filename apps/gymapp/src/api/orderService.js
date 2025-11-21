// src/api/orderService.js
import apiClient from './apiClient';

const API_URL = '/merchant/orders';

// GET /merchant/orders
export const getMyOrders = async () => {
  const res = await apiClient.get(API_URL);
  return res.data;
};

// PUT /merchant/orders/:orderId/status
export const updateOrderStatus = async (orderId, status) => {
  const res = await apiClient.put(`${API_URL}/${orderId}/status`, { status });
  return res.data;
};

// POST /merchant/orders/bulk
export const bulkUpdateOrders = async (orderIds, action) => {
  const res = await apiClient.post(`${API_URL}/bulk`, {
    orderIds,
    action,
  });
  return res.data;
};
