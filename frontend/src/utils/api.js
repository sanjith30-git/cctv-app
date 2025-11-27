import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// IMPORTANT: For physical devices, replace localhost with your computer's IP address
// Find your IP: Windows (ipconfig) | macOS/Linux (ifconfig or ip addr)
// For emulator/simulator: use 'http://localhost:8000/api' or 'http://10.0.2.2:8000/api' (Android)
// For physical device: use 'http://YOUR_COMPUTER_IP:8000/api'
// 
// Updated with your computer's IP address: 192.168.0.107
// If this doesn't work, check your IP address and update it here
export const API_BASE_URL = 'http://192.168.0.107:8000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests (except login endpoint)
api.interceptors.request.use(
  async (config) => {
    // Don't add token to login requests
    if (config.url === '/login' || config.url?.endsWith('/login')) {
      // Remove any existing authorization header for login
      delete config.headers.Authorization;
      return config;
    }
    
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // Remove authorization header if no token
      delete config.headers.Authorization;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 errors (unauthorized)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Don't clear storage on login errors (401 from login endpoint)
    if (error.config?.url === '/login' || error.config?.url?.endsWith('/login')) {
      return Promise.reject(error);
    }
    
    if (error.response?.status === 401) {
      // Clear storage on unauthorized errors (except login)
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      // Navigation will be handled by AuthContext
    }
    return Promise.reject(error);
  }
);

export default api;
