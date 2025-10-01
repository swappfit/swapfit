// src/api/userService.js
import apiClient from './apiClient';

export const getMyProfile = async () => {
  const response = await apiClient.get('/users/me/profile');
  return response.data;
};
/**
 * @description Sends a request to update the logged-in user's role-specific profile.
 * @param {object} profileData - An object containing the fields to update.
 * @returns {Promise<object>} The backend response with the updated profile data.
 */
export const updateMyProfile = async (profileData) => {
  const response = await apiClient.patch('/users/me/profile', profileData);
  return response.data;
};