
// src/api/apiClient.js
import axios from 'axios';

const apiClient = axios.create({
    baseURL: `${import.meta.env.VITE_API_BASE_URL}/api`,
});

// Request Interceptor: Attaches the JWT to every outgoing request
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Centralizes error handling
apiClient.interceptors.response.use(
  (response) => response, // Pass through successful responses
  (error) => {
    // This is the ideal place to handle universal errors like 401 Unauthorized
    if (error.response && error.response.status === 401) {
      // Example: Automatically log the user out if their token is expired/invalid
      // You would call a logout function from your auth context here
      console.error("Authentication Error: Token is invalid or expired.");
      localStorage.removeItem('authToken');
      // Force a reload to clear all state and redirect to login
      window.location.href = '/';
    }
    // Reject the promise so the component's `catch` block can handle it
    return Promise.reject(error);
  }
);

export default apiClient;
