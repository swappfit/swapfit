// src/api/gymService.js
import apiClient from './apiClient';

const unwrapResponse = (response) => {
  if (!response) return null;
  const payload = response.data ?? response;
  if (payload && typeof payload === 'object') {
    if ('data' in payload && payload.data !== undefined) {
      return payload.data;
    }
  }
  return payload;
};

export const getMyGymProfile = async () => {
  const response = await apiClient.get('/gyms/owner/my-profile');
  const gym = unwrapResponse(response);
  return gym;
};

export const getMyGymMembers = async () => {
  const response = await apiClient.get('/gyms/owner/members');
  return response.data;
};

export const sendNotificationToGym = async (gymId, payload) => {
  const resp = await apiClient.post(`/notifications/gym/${gymId}`, payload);
  return resp.data;
};

export const sendNotificationToUser = async (userId, payload) => {
  const resp = await apiClient.post(`/notifications/user/${userId}`, payload);
  return resp.data;
}

// New functions for unlimited gym management
export const createGym = async (gymData) => {
  const response = await apiClient.post('/gyms/owner/create', gymData);
  return unwrapResponse(response);
}

export const getMyGyms = async () => {
  const response = await apiClient.get('/gyms/owner/list');
  return unwrapResponse(response);
}

export const switchGym = async (gymId) => {
  const response = await apiClient.post(`/gyms/owner/switch/${gymId}`);
  return unwrapResponse(response);
}