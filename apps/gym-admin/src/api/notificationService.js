// src/services/notificationService.js
import apiClient from '../api/apiClient';

// Fetches all notifications for the admin dashboard
export const getAllNotifications = async () => {
  const response = await apiClient.get('/notifications');
  return response.data;
};

// --- Admin Sending Functions ---
export const sendToAll = async (data) => {
  const response = await apiClient.post('/notifications/send-to-all', data);
  return response.data;
};

export const sendToRole = async (data) => {
  const response = await apiClient.post('/notifications/send-to-role', data);
  return response.data;
};

export const sendToUser = async (data) => {
  const response = await apiClient.post('/notifications/send-to-user', data);
  return response.data;
};

export const sendToGym = async (data) => {
  const response = await apiClient.post('/notifications/send-to-gym', data);
  return response.data;
};

// Deletes a notification
export const deleteNotification = async (notificationId) => {
  const response = await apiClient.delete(`/notifications/${notificationId}`);
  return response.data;
};

// Note: getMyNotifications and registerFcmToken are for member-facing apps
// and are not used in this admin component.