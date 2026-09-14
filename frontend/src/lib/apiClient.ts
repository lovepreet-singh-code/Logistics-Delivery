import axios from 'axios';

// Base API Client configured for the API Gateway
const apiClient = axios.create({
  baseURL: 'http://localhost:8080/api', // Pointing to NGINX API Gateway
});

// Request interceptor to attach Bearer token
apiClient.interceptors.request.use((config) => {
  // Try adminToken first, fallback to standard token
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') || localStorage.getItem('token') : null;
  if (token) {
    if (config.headers && typeof config.headers.set === 'function') {
      config.headers.set('Authorization', `Bearer ${token}`);
    } else {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default apiClient;
