import React, { createContext, useState, useEffect, useContext } from 'react';
import { AuthService, UserService } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// Secure token storage with expiration handling
const setSecureToken = (name, token) => {
  if (!token) return;
  
  try {
    // Parse the JWT to get the expiration
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(window.atob(base64));
    
    // Store the token with its expiration time
    const tokenData = {
      token,
      expires: payload.exp * 1000, // Convert to milliseconds
    };
    
    localStorage.setItem(name, JSON.stringify(tokenData));
  } catch (e) {
    console.error('Error storing token:', e);
  }
};

const getSecureToken = (name) => {
  try {
    const tokenData = JSON.parse(localStorage.getItem(name));
    
    if (!tokenData) return null;
    
    // Check if token is expired
    if (Date.now() >= tokenData.expires) {
      localStorage.removeItem(name);
      return null;
    }
    
    return tokenData.token;
  } catch (e) {
    console.error('Error retrieving token:', e);
    localStorage.removeItem(name);
    return null;
  }
};

const clearTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Clear stored auth data completely
  const clearAuthData = () => {
    clearTokens();
    setCurrentUser(null);
  };

  useEffect(() => {
    // Check if user is already logged in
    const checkAuthStatus = async () => {
      setLoading(true);
      const token = getSecureToken('access_token');
      
      if (!token) {
        // No token found, user is not logged in
        setLoading(false);
        return;
      }
      
      try {
        // Fetch current user data
        const response = await UserService.getCurrentUser();
        setCurrentUser(response.data);
      } catch (error) {
        console.error('Auth check failed:', error);
        // Clear all auth data if token is invalid
        clearAuthData();
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const register = async (userData) => {
    setError(null);
    
    // Always clear existing auth data before registration
    clearAuthData();
    
    try {
      // Register new user
      const response = await AuthService.register(userData);
      const { access, refresh } = response.data;
      
      // Save tokens securely
      setSecureToken('access_token', access);
      setSecureToken('refresh_token', refresh);
      
      // Fetch current user data
      try {
        const userResponse = await UserService.getCurrentUser();
        setCurrentUser(userResponse.data);
      } catch (userError) {
        console.error('Error fetching user data after registration:', userError);
        clearAuthData();
        throw new Error('Registration successful but unable to fetch user data');
      }
      
      return response.data;
    } catch (error) {
      clearAuthData();
      setError(error.response?.data?.detail || 'Registration failed. Please try again.');
      throw error;
    }
  };

  const login = async (credentials) => {
    setError(null);
    
    // Always clear existing auth data before login
    clearAuthData();
    
    try {
      console.log('Attempting login with credentials:', { ...credentials, password: '***' });
      
      // Attempt login
      const response = await AuthService.login(credentials);
      console.log('Login response:', response.data);
      
      const { access, refresh } = response.data;
      
      // Save tokens securely
      setSecureToken('access_token', access);
      setSecureToken('refresh_token', refresh);
      
      console.log('Tokens saved securely');
      
      // Fetch current user data with a slight delay to ensure token is properly saved
      try {
        // Small timeout to ensure token is available for the next request
        await new Promise(resolve => setTimeout(resolve, 100));
        console.log('Fetching user data with token...');
        
        const userResponse = await UserService.getCurrentUser();
        console.log('User data received:', userResponse.data);
        
        setCurrentUser(userResponse.data);
      } catch (userError) {
        console.error('Error fetching user data after login:', userError);
        console.error('Response from server:', userError.response?.data);
        console.error('Request that failed:', userError.config);
        
        clearAuthData();
        throw new Error('Login successful but unable to fetch user data');
      }
      
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      console.error('Response from server:', error.response?.data);
      console.error('Request that failed:', error.config);
      
      clearAuthData();
      setError(error.response?.data?.detail || 'Login failed. Please check your credentials.');
      throw error;
    }
  };

  const logout = () => {
    clearAuthData();
  };

  const updateProfile = async (userData) => {
    setError(null);
    try {
      const response = await UserService.updateUser(userData);
      setCurrentUser(response.data);
      return response.data;
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to update profile.');
      throw error;
    }
  };

  const value = {
    currentUser,
    loading,
    error,
    register,
    login,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext; 