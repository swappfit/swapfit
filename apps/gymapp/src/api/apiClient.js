// src/api/apiClient.js
import axios from 'axios';
import config from '../config';

console.log('API Base URL:', config.api.baseURL);

// Function to format user ID to 25 characters
const formatUserId = (id) => {
  if (!id) return null;
  // Pad with zeros if necessary to make it 25 characters
  return id.padEnd(25, '0').substring(0, 25);
};

const apiClient = axios.create({
  baseURL: config.api.baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 150000, // 15 seconds timeout for ngrok
});

// Request interceptor to add auth token and format user ID in URLs
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Adding auth token to request');
    } else {
      console.warn('No auth token found in localStorage');
    }
    
    // Format user ID in URL parameters if present
    if (config.url && config.url.includes(':userId')) {
      const user = JSON.parse(localStorage.getItem('authUser') || '{}');
      if (user.id) {
        config.url = config.url.replace(':userId', formatUserId(user.id));
      }
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
      localStorage.removeItem('authUser');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;