// src/lib/api.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Helper function to get auth headers
const authHeaders = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('No authentication token found');
    // Redirect to login or handle authentication error
    window.location.href = '/login';
    return {};
  }
  return { Authorization: `Bearer ${token}` };
};

// Get predefined multi-gym tiers
export const getMultiGymTiers = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/multi-gym-tiers`, {
      headers: authHeaders()
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        // Handle unauthorized error
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('Authentication required');
      }
      throw new Error('Failed to fetch multi-gym tiers');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching multi-gym tiers:', error);
    throw error;
  }
};

// Create checkout session for subscription purchase
export const createCheckoutSession = async ({ planId, planType }) => {
  try {
    const response = await fetch(`${API_BASE_URL}/subscriptions/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders()
      },
      body: JSON.stringify({ planId, planType })
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('Authentication required');
      }
      const error = await response.json();
      throw new Error(error.message || 'Failed to create checkout session');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
};

// Get user profile
export const getUserProfile = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      headers: authHeaders()
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('Authentication required');
      }
      throw new Error('Failed to fetch user profile');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

// Get user check-ins
export const getUserCheckIns = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/check-ins`, {
      headers: authHeaders()
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('Authentication required');
      }
      throw new Error('Failed to fetch check-ins');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching check-ins:', error);
    throw error;
  }
};

// Check in to a gym
export const checkIn = async (gymId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/gyms/${gymId}/check-in`, {
      method: 'POST',
      headers: authHeaders()
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('Authentication required');
      }
      const error = await response.json();
      throw new Error(error.message || 'Failed to check in');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error checking in:', error);
    throw error;
  }
};

// Check out from a gym
export const checkOut = async (checkInId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/check-ins/${checkInId}/check-out`, {
      method: 'PATCH',
      headers: authHeaders()
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('Authentication required');
      }
      const error = await response.json();
      throw new Error(error.message || 'Failed to check out');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error checking out:', error);
    throw error;
  }
};

// Get gym plans
export const getGymPlans = async (gymId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/gyms/${gymId}/plans`, {
      headers: authHeaders()
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('Authentication required');
      }
      throw new Error('Failed to fetch gym plans');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching gym plans:', error);
    throw error;
  }
};

// Get user transactions
export const getMyTransactions = async ({ page = 1, limit = 20 } = {}) => {
  try {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    const response = await fetch(`${API_BASE_URL}/transactions/me?${params.toString()}`, {
      headers: authHeaders()
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('Authentication required');
      }
      throw new Error('Failed to fetch transactions');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
};

// Create portal session for managing subscriptions
export const createPortalSession = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/subscriptions/portal-session`, {
      method: 'POST',
      headers: authHeaders()
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('Authentication required');
      }
      const error = await response.json();
      throw new Error(error.message || 'Failed to create portal session');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating portal session:', error);
    throw error;
  }
};