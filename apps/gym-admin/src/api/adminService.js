// src/services/adminService.js
import apiClient from '../api/apiClient';

// Fetch gyms that have opted in for multi-gym access
export const getGymsForBadging = async () => {
  console.log('🏋️ [Admin Service] Fetching gyms for badging...');
  try {
    const response = await apiClient.get('/admin/gyms-for-badging');
    console.log('🏋️ [Admin Service] Gyms for badging fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('🏋️ [Admin Service] Error fetching gyms for badging:', error);
    throw error;
  }
};

// Fetch available multi-gym tiers
export const getMultiGymTiers = async () => {
  console.log('🏆 [Admin Service] Fetching multi-gym tiers...');
  try {
    const response = await apiClient.get('/admin/multi-gym-tiers');
    console.log('🏆 [Admin Service] Multi-gym tiers fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('🏆 [Admin Service] Error fetching multi-gym tiers:', error);
    throw error;
  }
};

// Assign tier to gym
export const assignGymToTier = async (gymId, tierName) => {
  console.log('🏷️ [Admin Service] Assigning tier to gym:', { gymId, tierName });
  try {
    const response = await apiClient.patch(`/admin/gyms/${gymId}/assign-tier`, { tierName });
    console.log('🏷️ [Admin Service] Tier assigned successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('🏷️ [Admin Service] Error assigning tier to gym:', error);
    throw error;
  }
};