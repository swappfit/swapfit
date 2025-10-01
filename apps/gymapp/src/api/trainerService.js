// src/api/trainerService.js
import apiClient from './apiClient';

/**
 * @description Fetches the list of a trainer's active subscribers.
 * @returns {Promise<object>} The backend response with the list of subscribers.
 */
export const getMyClients = async () => { // ✅ RENAMED FOR CLARITY IN THE FRONTEND
    const response = await apiClient.get('/trainers/subscribers'); // Calls the existing subscribers route
    return response.data;
};
/**
 * @description Fetches the trainer's own detailed profile data.
 * @param {string} userId - The user ID of the trainer.
 * @returns {Promise<object>} The backend response with the profile data.
 */
export const getMyProfile = async (userId) => {
    // Uses the public profile route, but for the logged-in user
    const response = await apiClient.get(`/trainers/profile/${userId}`);
    return response.data;
};