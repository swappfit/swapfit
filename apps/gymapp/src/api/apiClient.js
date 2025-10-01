// // src/api/apiClient.js
// import axios from 'axios';
// import config from '../config';
// const apiClient = axios.create({
//   // Use a proxy in package.json during development to avoid CORS issues
//   baseURL: config.api.baseURL,
// });

// // Request Interceptor: Attaches the JWT to every outgoing request
// apiClient.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('authToken');
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// // Response Interceptor: Centralizes error handling
// apiClient.interceptors.response.use(
//   (response) => response, // Pass through successful responses
//   (error) => {
//     // This is the ideal place to handle universal errors like 401 Unauthorized
//     if (error.response && error.response.status === 401) {
//       // Example: Automatically log the user out if their token is expired/invalid
//       // You would call a logout function from your auth context here
//       console.error("Authentication Error: Token is invalid or expired.");
//       localStorage.removeItem('authToken');
//       // Force a reload to clear all state and redirect to login
//       window.location.href = '/';
//     }
//     // Reject the promise so the component's `catch` block can handle it
//     return Promise.reject(error);
//   }
// );

// export default apiClient;

import axios from 'axios';
import config from '../config';

console.log('API Base URL:', config.api.baseURL);

const apiClient = axios.create({
  baseURL: config.api.baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 seconds timeout for ngrok
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Adding auth token to request');
    } else {
      console.warn('No auth token found in localStorage');
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log('Response received:', response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error('Response error:', error.config?.url, error.message);
    if (error.response) {
      console.error('Error status:', error.response.status);
      console.error('Error data:', error.response.data);
    } else if (error.request) {
      console.error('No response received');
    }
    
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;