import React, { useState } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Container,
  Tooltip,
  Fade,
  useScrollTrigger,
  Tab,
  Tabs
} from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import HomeIcon from '@mui/icons-material/Home';
import { useAuth } from '../../contexts/AuthContext';

// Scroll behavior for header
function ElevationScroll(props) {
  const { children } = props;
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 0,
  });

  return React.cloneElement(children, {
    elevation: trigger ? 4 : 0,
    sx: {
      bgcolor: trigger ? 'background.paper' : 'transparent',
      color: trigger ? 'text.primary' : 'white',
      backdropFilter: trigger ? 'blur(10px)' : 'none',
      borderBottom: trigger ? 1 : 0,
      borderColor: 'divider',
      transition: 'all 0.3s ease',
    }
  });
}

const Header = (props) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
    navigate('/login');
  };

  const handleProfile = () => {
    handleClose();
    navigate('/profile');
  };

  const handleHome = () => {
    navigate('/');
  };

  return (
    <ElevationScroll {...props}>
      <AppBar position="sticky" color="transparent">
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ py: 1 }}>
            {/* Logo & Title - Desktop */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, flexGrow: 1, alignItems: 'center' }}>
              <Typography
                variant="h5"
                component={RouterLink}
                to="/"
                sx={{
                  fontWeight: 700,
                  color: 'inherit',
                  textDecoration: 'none',
                  background: 'linear-gradient(45deg, #3f51b5 30%, #7986cb 90%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontSize: '1.7rem',
                  letterSpacing: '0.5px',
                }}
              >
                SocialSphere
              </Typography>
            </Box>

            {/* Home Icon - Mobile */}
            <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
              <IconButton
                size="large"
                color="inherit"
                component={RouterLink}
                to="/"
              >
                <HomeRoundedIcon />
              </IconButton>
            </Box>

            {/* Logo & Title - Mobile */}
            <Typography
              variant="h6"
              component={RouterLink}
              to="/"
              sx={{
                flexGrow: 1,
                display: { xs: 'flex', md: 'none' },
                fontWeight: 700,
                color: 'inherit',
                textDecoration: 'none',
                background: 'linear-gradient(45deg, #3f51b5 30%, #7986cb 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              SocialSphere
            </Typography>

            {/* Authentication Buttons & Profile */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
              {currentUser ? (
                // User is logged in - Show profile icon
                <Tooltip title="Account">
                  <IconButton
                    onClick={handleMenu}
                    color="inherit"
                    aria-label="account of current user"
                    aria-controls="menu-appbar"
                    aria-haspopup="true"
                    sx={{ 
                      ml: { xs: 0, sm: 1 },
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'scale(1.1)',
                      },
                    }}
                  >
                    {currentUser.username ? (
                      <Avatar 
                        sx={{ 
                          width: 40, 
                          height: 40, 
                          bgcolor: 'secondary.main',
                          border: '2px solid',
                          borderColor: 'background.paper',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                        }}
                      >
                        {currentUser.username.charAt(0).toUpperCase()}
                      </Avatar>
                    ) : (
                      <AccountCircleIcon />
                    )}
                  </IconButton>
                </Tooltip>
              ) : (
                // User is not logged in - Show login/register buttons
                <>
                  <Button 
                    color="inherit" 
                    component={RouterLink} 
                    to="/login"
                    startIcon={<LoginIcon />}
                    sx={{ 
                      display: { xs: 'none', sm: 'flex' },
                      fontWeight: 600,
                    }}
                  >
                    Login
                  </Button>
                  <IconButton 
                    color="inherit"
                    component={RouterLink}
                    to="/login"
                    sx={{ display: { xs: 'flex', sm: 'none' } }}
                  >
                    <LoginIcon />
                  </IconButton>
                  
                  <Button 
                    variant="contained" 
                    color="primary" 
                    component={RouterLink} 
                    to="/register"
                    startIcon={<PersonAddIcon />}
                    sx={{ 
                      display: { xs: 'none', sm: 'flex' },
                      fontWeight: 600,
                    }}
                  >
                    Register
                  </Button>
                  <IconButton 
                    color="primary"
                    component={RouterLink}
                    to="/register"
                    sx={{ display: { xs: 'flex', sm: 'none' } }}
                  >
                    <PersonAddIcon />
                  </IconButton>
                </>
              )}
              
              {/* User Menu */}
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                TransitionComponent={Fade}
                sx={{ 
                  '& .MuiPaper-root': { 
                    borderRadius: 2,
                    minWidth: 180,
                    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
                  } 
                }}
              >
                <MenuItem 
                  onClick={handleProfile} 
                  sx={{ py: 1.5, fontWeight: 500 }}
                >
                  My Profile
                </MenuItem>
                <MenuItem 
                  onClick={handleLogout} 
                  sx={{ py: 1.5, fontWeight: 500, color: 'error.main' }}
                >
                  Logout
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
    </ElevationScroll>
  );
};

export default Header; 