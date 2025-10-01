// src/api/authService.js
import apiClient from './apiClient';

export const verifyAuth0User = async (auth0Token) => {
    const response = await apiClient.post('/auth/verify-user', {}, {
        headers: { Authorization: `Bearer ${auth0Token}` }
    });
    return response.data;
};

export const selectRole = async (role) => {
    const response = await apiClient.post('/auth/select-role', { role });
    return response.data;
};

export const createGymProfile = async (profileData) => {
    // This now calls the generic backend route with a specific payload structure
    const payload = {
        profileType: 'GYM_OWNER',
        data: profileData
    };
    const response = await apiClient.post('/auth/create-gym-profile', payload);
    return response.data;
};

export const createTrainerProfile = async (profileData) => {
    // This also calls the generic backend route with a specific payload structure
    const payload = {
        profileType: 'TRAINER',
        data: profileData
    };
    const response = await apiClient.post('/auth/create-trainer-profile', payload);
    return response.data;
};

// ✅ NEW, SPECIFIC FUNCTION FOR MERCHANTS
/**
 * @description Sends the details for a new Merchant's profile to the backend.
 * @param {object} profileData - The merchant profile data (e.g., { storeName, ... }).
 * @returns {Promise<object>} The backend response.
 */
export const createMerchantProfile = async (profileData) => {
    const payload = {
        profileType: 'MERCHANT',
        data: profileData
    };
    const response = await apiClient.post('/auth/create-merchant-profile', payload);
    return response.data;
};