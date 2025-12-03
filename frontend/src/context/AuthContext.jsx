import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const savedUser = await AsyncStorage.getItem('user');
      
      if (token && savedUser) {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        // Verify token is still valid
        try {
          await api.get('/me');
          setLoading(false);
        } catch (error) {
          // Token invalid, clear storage
          await logout();
        }
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setLoading(false);
    }
  };

  const login = async (username, password, role) => {
    try {
      // Clear any existing tokens before login
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      
      // Trim username to remove any whitespace
      const trimmedUsername = username.trim();
      const trimmedPassword = password.trim();
      
      // Use normal api instance - interceptor will handle not adding token to login
      const response = await api.post('/login', {
        username: trimmedUsername,
        password: trimmedPassword,
        role: role === 'Owner' ? 'owner' : 'control_room'
      });
      
      const { access_token } = response.data;
      if (!access_token) {
        return {
          success: false,
          error: 'No access token received from server'
        };
      }
      
      await AsyncStorage.setItem('token', access_token);
      
      // Decode token to get user info
      const tokenParts = access_token.split('.');
      const payload = JSON.parse(atob(tokenParts[1]));
      
      const userData = {
        id: payload.sub,
        username: payload.username,
        role: payload.role
      };
      
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        code: error.code
      });
      
      let errorMessage = 'Login failed';
      
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'NETWORK_ERROR') {
        errorMessage = 'Cannot connect to server. Make sure the backend is running and check your API URL in src/utils/api.js';
      } else if (error.response) {
        // Server responded with error
        errorMessage = error.response.data?.detail || error.response.data?.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        // Request made but no response
        errorMessage = 'No response from server. Check your network connection and API URL.';
      } else {
        errorMessage = error.message || 'An unexpected error occurred';
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  };

  const logout = async () => {
    try {
      // Clear all storage
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      // Clear user state
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear user state even if storage fails
      setUser(null);
    }
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
