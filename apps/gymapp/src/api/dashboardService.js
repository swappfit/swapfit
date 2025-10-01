// src/api/dashboardService.js
import apiClient from './apiClient';

/**
 * Fetches the dashboard data for the currently authenticated user.
 * The backend will automatically determine the user's role and return the
 * appropriate dashboard data (Admin, Trainer, Gym Owner, or Member).
 * @returns {Promise<object>} The data for the user's dashboard.
 */
export const getDashboardData = async () => {
  const response = await apiClient.get('/dashboard');
  return response.data; // The backend returns { success: true, data: { ... } }
};