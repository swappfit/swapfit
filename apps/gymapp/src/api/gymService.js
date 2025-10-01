// src/api/gymService.js
import apiClient from './apiClient';
const unwrapResponse = (response) => {
  if (!response) return null;

  // response is the axios response object usually
  const payload = response.data ?? response;

  // Common pattern: { success: true, data: { ... } }
  if (payload && typeof payload === 'object') {
    if ('data' in payload && payload.data !== undefined) {
      return payload.data;
    }
  }

  // fallback: payload itself (maybe the API already returned the gym)
  return payload;
};

export const getMyGymProfile = async () => {
  const response = await apiClient.get('/gyms/owner/my-profile');
  const gym = unwrapResponse(response);
  return gym;
};
/**
 * @description Fetches the list of a gym's active members.
 * @param {string} gymId - The ID of the gym.
 * @returns {Promise<object>} The backend response with the list of members.
 */
export const getMyGymMembers = async () => {
    // This now calls the simpler, more secure backend route: GET /api/gyms/owner/members
    const response = await apiClient.get('/gyms/owner/members');
    return response.data;
};

// Send notification to all members of a gym
export const sendNotificationToGym = async (gymId, payload) => {
  const resp = await apiClient.post(`/notifications/gym/${gymId}`, payload);
  return resp.data;
};

// Send notification to a single user
export const sendNotificationToUser = async (userId, payload) => {
  const resp = await apiClient.post(`/notifications/user/${userId}`, payload); // you may need to create this backend route
  return resp.data;
};