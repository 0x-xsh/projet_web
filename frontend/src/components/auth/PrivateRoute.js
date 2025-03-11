import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';

const PrivateRoute = () => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  // Check if token exists and is valid
  const isAuthenticated = () => {
    try {
      const tokenData = JSON.parse(localStorage.getItem('access_token'));
      if (!tokenData) return false;
      
      // Check if token is expired
      return tokenData && Date.now() < tokenData.expires;
    } catch (e) {
      // If there's any error parsing or checking the token, consider user not authenticated
      return false;
    }
  };

  // If user is not authenticated, redirect to login
  useEffect(() => {
    if (!loading && !currentUser && !isAuthenticated()) {
      // We'll let the Navigate component handle the redirect
      console.log('User not authenticated, redirecting to login');
    }
  }, [currentUser, loading]);

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  // If not authenticated, redirect to login and pass the current location
  // so we can redirect back after successful login
  return currentUser ? (
    <Outlet />
  ) : (
    <Navigate 
      to="/login" 
      state={{ from: location.pathname }} 
      replace 
    />
  );
};

export default PrivateRoute; 