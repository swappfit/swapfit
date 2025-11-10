// src/api/apiClient.js
import axios from 'axios';

// The baseURL is now just the path that the proxy is listening for.
// Vite will forward this to your ngrok URL.
const apiClient = axios.create({
    baseURL: 'http://localhost:5000/api', // ✅ SIMPLIFIED BASE URL
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
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error("Authentication Error: Token is invalid or expired.");
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser'); // Also clear the user
      window.location.href = '/'; // Redirect to login page
    }
    return Promise.reject(error);
  }
);

export default apiClient;