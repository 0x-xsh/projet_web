import React from 'react';
import { Box, Container, CssBaseline } from '@mui/material';
import Header from './Header';
import Footer from './Footer';

const Layout = ({ children }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}
    >
      <CssBaseline />
      <Header />
      <Container 
        component="main" 
        maxWidth="lg" 
        sx={{ mt: 4, mb: 4, flexGrow: 1 }}
      >
        {children}
      </Container>
      <Footer />
    </Box>
  );
};

export default Layout; 