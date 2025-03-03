import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Avatar,
  Box,
  Divider,
  CircularProgress,
  Card,
  CardContent,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  useTheme
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { PostService } from '../../services/api';
import QuickPostForm from '../posts/QuickPostForm';
import { 
  GridView as GridViewIcon,
  ViewList as ViewListIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';
import PostItem from '../posts/PostItem';

const Profile = () => {
  const { currentUser } = useAuth();
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [postsView, setPostsView] = useState('list');
  const theme = useTheme();

  useEffect(() => {
    const fetchUserPosts = async () => {
      try {
        setLoading(true);
        setError('');
        // Use the getPostsByUser API to fetch posts filtered by author
        const response = await PostService.getPostsByUser(currentUser.id);
        
        // Handle the paginated response format
        const posts = response.data.results || [];
        
        setUserPosts(posts);
      } catch (err) {
        console.error('Error fetching user posts:', err);
        setError('Failed to load your posts. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchUserPosts();
    }
  }, [currentUser]);

  const handlePostCreated = async () => {
    if (currentUser) {
      try {
        setLoading(true);
        const response = await PostService.getPostsByUser(currentUser.id);
        // Handle the paginated response format
        const posts = response.data.results || [];
        setUserPosts(posts);
      } catch (err) {
        console.error('Error refreshing posts:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleViewChange = (event, newView) => {
    if (newView !== null) {
      setPostsView(newView);
    }
  };

  if (!currentUser) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="60vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Profile Header with Cover Photo */}
      <Paper 
        elevation={1} 
        sx={{ 
          borderRadius: 3,
          overflow: 'hidden',
          background: theme.palette.background.paper,
          mb: 3
        }}
      >
        {/* Cover Photo */}
        <Box 
          sx={{ 
            height: 200, 
            width: '100%', 
            bgcolor: theme.palette.grey[200],
            backgroundImage: 'url(https://source.unsplash.com/random/1200x400/?abstract)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative',
          }}
        />
        
        {/* Profile Info Section */}
        <Box sx={{ px: 3, pb: 2 }}>
          {/* Profile Picture and Basic Info */}
          <Box 
            sx={{ 
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: { xs: 'center', md: 'flex-end' },
              mt: { xs: '-40px', md: '-60px' },
              mb: 2
            }}
          >
            <Avatar
              sx={{
                width: { xs: 120, md: 168 },
                height: { xs: 120, md: 168 },
                bgcolor: theme.palette.primary.main,
                fontSize: '4rem',
                border: '4px solid white',
                boxShadow: theme.shadows[3],
              }}
            >
              {currentUser.username?.charAt(0).toUpperCase()}
            </Avatar>
            
            <Box 
              sx={{ 
                ml: { xs: 0, md: 3 }, 
                mt: { xs: 2, md: 0 },
                mb: { xs: 1, md: 2 },
                textAlign: { xs: 'center', md: 'left' },
                flexGrow: 1
              }}
            >
              <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
                {currentUser.username}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>
                {currentUser.email}
              </Typography>
            </Box>
          </Box>
          
          <Divider sx={{ mt: 1 }} />
        </Box>
      </Paper>
      
      {/* Content Area */}
      <Grid container spacing={3}>
        {/* Main Content Area */}
        <Grid item xs={12}>
          {/* What's on your mind section */}
          <Card sx={{ mb: 3, borderRadius: 2 }}>
            <CardContent>
              <QuickPostForm onPostCreated={handlePostCreated} />
            </CardContent>
          </Card>
          
          {/* Posts filter and view toggle */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Your Posts</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                startIcon={<FilterListIcon />} 
                variant="outlined" 
                size="small"
                sx={{ borderRadius: 2 }}
              >
                Filters
              </Button>
              <ToggleButtonGroup
                value={postsView}
                exclusive
                onChange={handleViewChange}
                size="small"
              >
                <ToggleButton value="list" aria-label="list view">
                  <ViewListIcon />
                </ToggleButton>
                <ToggleButton value="grid" aria-label="grid view">
                  <GridViewIcon />
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Box>
          
          {error && (
            <Box sx={{ mb: 3, p: 2, bgcolor: 'error.lighter', borderRadius: 2, color: 'error.main' }}>
              <Typography>{error}</Typography>
            </Box>
          )}
          
          {loading ? (
            <Box display="flex" justifyContent="center" my={4}>
              <CircularProgress />
            </Box>
          ) : userPosts.length > 0 ? (
            <Grid container spacing={postsView === 'grid' ? 2 : 0}>
              {userPosts.map(post => (
                <Grid item xs={12} md={postsView === 'grid' ? 6 : 12} key={post.id}>
                  <PostItem post={post} showAuthor={false} forceAuthor={true} />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box py={6} textAlign="center">
              <Typography variant="body1" color="textSecondary" align="center" sx={{ mb: 2 }}>
                You haven't created any posts yet.
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic' }}>
                Share your thoughts with the world by creating your first post!
              </Typography>
            </Box>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default Profile; 