import React, { createContext, useState, useEffect, useContext } from 'react';
import { AuthService, UserService } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// Secure token storage with expiration handling
const setSecureToken = (name, token) => {
  if (!token) return;
  
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(window.atob(base64));
    
    const tokenData = {
      token,
      expires: payload.exp * 1000,
    };
    
    localStorage.setItem(name, JSON.stringify(tokenData));
  } catch (e) {
    // Silently fail and don't store the token
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
        clearAuthData();
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const register = async (userData) => {
    setError(null);
    clearAuthData();
    
    try {
      const response = await AuthService.register(userData);
      const { access, refresh } = response.data;
      
      setSecureToken('access_token', access);
      setSecureToken('refresh_token', refresh);
      
      try {
        const userResponse = await UserService.getCurrentUser();
        setCurrentUser(userResponse.data);
      } catch (userError) {
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
    clearAuthData();
    
    try {
      const response = await AuthService.login(credentials);
      const { access, refresh } = response.data;
      
      setSecureToken('access_token', access);
      setSecureToken('refresh_token', refresh);
      
      try {
        await new Promise(resolve => setTimeout(resolve, 100));
        const userResponse = await UserService.getCurrentUser();
        setCurrentUser(userResponse.data);
      } catch (userError) {
        clearAuthData();
        throw new Error('Login successful but unable to fetch user data');
      }
      
      return response.data;
    } catch (error) {
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