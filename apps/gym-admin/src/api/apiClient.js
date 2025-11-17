// src/api/apiClient.js
import axios from 'axios';

// Create a map to track pending requests
const pendingRequests = new Map();

const apiClient = axios.create({
    baseURL: 'http://localhost:5000/api', // Your ngrok URL
});

// Request Interceptor: Attaches the JWT to every outgoing request
apiClient.interceptors.request.use(
  (config) => {
    // Create a unique key for this request
    const requestKey = `${config.method}-${config.url}-${JSON.stringify(config.params)}-${JSON.stringify(config.data)}`;
    
    // Check if this request is already pending
    if (pendingRequests.has(requestKey)) {
      // Cancel this request
      config.cancelToken = new axios.CancelToken((cancel) => {
        cancel(`Duplicate request cancelled: ${requestKey}`);
      });
      
      console.log('🚫 [API Client] Duplicate request cancelled:', requestKey);
    } else {
      // Add this request to the pending requests map
      const controller = new AbortController();
      pendingRequests.set(requestKey, controller);
      
      // Add the abort signal to the config
      config.signal = controller.signal;
      
      console.log('🚀 [API Client] Making request:', {
        method: config.method?.toUpperCase(),
        fullUrl: config.baseURL + config.url,
        url: config.url,
        data: config.data,
        params: config.params,
        headers: {
          ...config.headers,
          Authorization: config.headers.Authorization ? '[REDACTED]' : 'None'
        },
        requestKey
      });
      
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    return config;
  },
  (error) => {
    console.error('❌ [API Client] Request error:', error);
    return Promise.reject(error);
  }
);

// Response Interceptor: Centralizes error handling
apiClient.interceptors.response.use(
  (response) => {
    // Remove this request from the pending requests map
    const requestKey = `${response.config.method}-${response.config.url}-${JSON.stringify(response.config.params)}-${JSON.stringify(response.config.data)}`;
    pendingRequests.delete(requestKey);
    
    console.log('✅ [API Client] Response received:', {
      status: response.status,
      statusText: response.statusText,
      url: response.config.url,
      requestKey
    });
    
    return response;
  },
  (error) => {
    // Remove this request from the pending requests map if it exists
    if (error.config) {
      const requestKey = `${error.config.method}-${error.config.url}-${JSON.stringify(error.config.params)}-${JSON.stringify(error.config.data)}`;
      pendingRequests.delete(requestKey);
    }
    
    console.error('❌ [API Client] Response error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      isCancelled: axios.isCancel(error)
    });
    
    // Check if we got an HTML response (like the ngrok error page)
    if (error.response && typeof error.response.data === 'string' && error.response.data.includes('<!DOCTYPE html>')) {
      console.error('❌ [API Client] Received HTML instead of JSON. This might be a redirect or proxy issue.');
      console.error('❌ [API Client] Request URL:', error.config.baseURL + error.config.url);
    }
    
    if (error.response && error.response.status === 401) {
      console.error("Authentication Error: Token is invalid or expired.");
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      window.location.href = '/';
    }
    
    // Don't reject cancelled requests
    if (axios.isCancel(error)) {
      return Promise.reject({ cancelled: true, message: error.message });
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;