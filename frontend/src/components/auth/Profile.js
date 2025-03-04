import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Avatar,
  Grid,
  Button,
  Tabs,
  Tab,
  CircularProgress,
  Divider
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { PostService } from '../../services/api';
import PostList from '../posts/PostList';
import QuickPostForm from '../posts/QuickPostForm';
import EditIcon from '@mui/icons-material/Edit';

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const Profile = () => {
  const { currentUser } = useAuth();
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState('posts');

  useEffect(() => {
    if (currentUser) {
      fetchUserPosts();
    }
  }, [currentUser]);

  const fetchUserPosts = async () => {
    try {
      setLoading(true);
      const response = await PostService.getPostsByUser(currentUser.id);
      setUserPosts(response.data.results || []);
    } catch (err) {
      setError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handlePostCreated = async () => {
    await fetchUserPosts();
  };

  const handleViewChange = (event, newValue) => {
    setView(newValue);
  };

  if (!currentUser) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      {/* Cover Photo Area */}
      <Paper 
        sx={{ 
          height: 200, 
          mb: 3, 
          bgcolor: 'grey.200',
          position: 'relative',
          borderRadius: '8px 8px 0 0'
        }}
      >
        {/* Profile Picture */}
        <Avatar
          sx={{
            width: 168,
            height: 168,
            border: '4px solid white',
            position: 'absolute',
            bottom: -84,
            left: { xs: '50%', md: 32 },
            transform: { xs: 'translateX(-50%)', md: 'none' },
            bgcolor: 'primary.main',
            fontSize: '4rem'
          }}
        >
          {currentUser.username[0].toUpperCase()}
        </Avatar>
      </Paper>

      {/* Profile Info */}
      <Box sx={{ pl: { xs: 2, md: '200px' }, pr: 2, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              {currentUser.username}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            sx={{ mt: 1 }}
          >
            Edit Profile
          </Button>
        </Box>
      </Box>

      <Divider />

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={view} onChange={handleViewChange} aria-label="profile tabs">
          <Tab label="Posts" value="posts" />
          <Tab label="About" value="about" />
        </Tabs>
      </Box>

      {/* Content */}
      {view === 'posts' ? (
        <Grid container spacing={3}>
          <Grid item xs={12} md={5} lg={4}>
            {/* Profile Info Card */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Intro
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Member since {formatDate(currentUser?.date_joined)}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={7} lg={8}>
            <QuickPostForm onPostCreated={handlePostCreated} />

            {loading ? (
              <Box display="flex" justifyContent="center" my={4}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Paper sx={{ p: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
                <Typography>{error}</Typography>
              </Paper>
            ) : (
              <PostList 
                posts={userPosts} 
                showAuthor={false}
                forceAuthor={true}
              />
            )}
          </Grid>
        </Grid>
      ) : (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            About
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" gutterBottom>
              <strong>Username:</strong> {currentUser.username}
            </Typography>
            <Typography variant="body1">
              <strong>Member since:</strong> {formatDate(currentUser?.date_joined)}
            </Typography>
          </Box>
        </Paper>
      )}
    </Container>
  );
};

export default Profile; 