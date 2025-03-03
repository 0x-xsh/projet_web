import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  CircularProgress,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormGroup,
  FormControlLabel,
  Switch,
  Divider,
  Chip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PostService } from '../services/api';
import PostList from './posts/PostList';
import QuickPostForm from './posts/QuickPostForm';
import {
  FilterList as FilterIcon,
  Close as CloseIcon,
  Add as AddIcon,
  Search as SearchIcon
} from '@mui/icons-material';

const Home = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [userPosts, setUserPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  
  // Filter states
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [includeWords, setIncludeWords] = useState([]);
  const [excludeWords, setExcludeWords] = useState([]);
  const [currentIncludeWord, setCurrentIncludeWord] = useState('');
  const [currentExcludeWord, setCurrentExcludeWord] = useState('');
  const [searchActive, setSearchActive] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);

  // Add a ref to track if data is already loaded
  const dataFetchedRef = useRef(false);
  const filterAppliedRef = useRef(false);

  // Define applyFilters before it's used in useCallback
  const applyFilters = useCallback((postsToFilter) => {
    if (!postsToFilter) return;
    
    console.log('Applying filters to', postsToFilter.length, 'posts'); // Keep the console log but make it more informative
    
    let filtered = [...postsToFilter];
    
    // Apply search term filter
    if (searchTerm) {
      const search = caseSensitive ? searchTerm : searchTerm.toLowerCase();
      filtered = filtered.filter(post => {
        const title = caseSensitive ? post.title : post.title.toLowerCase();
        const content = caseSensitive ? post.content : post.content.toLowerCase();
        return title.includes(search) || content.includes(search);
      });
    }
    
    // Apply include words filter
    if (includeWords.length > 0) {
      filtered = filtered.filter(post => {
        const title = caseSensitive ? post.title : post.title.toLowerCase();
        const content = caseSensitive ? post.content : post.content.toLowerCase();
        
        // Post should include ALL the words in includeWords array
        return includeWords.every(word => {
          const searchWord = caseSensitive ? word : word.toLowerCase();
          return title.includes(searchWord) || content.includes(searchWord);
        });
      });
    }
    
    // Apply exclude words filter
    if (excludeWords.length > 0) {
      filtered = filtered.filter(post => {
        const title = caseSensitive ? post.title : post.title.toLowerCase();
        const content = caseSensitive ? post.content : post.content.toLowerCase();
        
        // Post should NOT include ANY of the words in excludeWords array
        return !excludeWords.some(word => {
          const searchWord = caseSensitive ? word : word.toLowerCase();
          return title.includes(searchWord) || content.includes(searchWord);
        });
      });
    }
    
    // Set filterAppliedRef to true to avoid redundant filter applications
    filterAppliedRef.current = true;
    setFilteredPosts(filtered);
  }, [includeWords, excludeWords, searchTerm, caseSensitive]);

  const fetchUserPosts = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      console.log('Fetching user posts for user', currentUser.id);
      const response = await PostService.getPostsByUser(currentUser.id);
      // Handle paginated response
      const userPostsData = response.data.results || response.data;
      setUserPosts(userPostsData);
      
      // Apply filters to user posts if needed
      if (tabValue === 1) {
        applyFilters(userPostsData);
      }
    } catch (err) {
      console.error('Error fetching user posts:', err);
    }
  }, [currentUser, tabValue, applyFilters]);

  const fetchPosts = useCallback(async (pageToFetch = 1) => {
    try {
      console.log('Fetching posts page', pageToFetch);
      setLoading(true);
      setError('');
      
      // Use the new paginated API
      const response = await PostService.getAllPosts(pageToFetch);
      const responseData = response.data;
      
      // Use the results array from the paginated response
      const fetchedPosts = responseData.results || [];
      
      // If we're fetching page 1, reset the posts array
      if (pageToFetch === 1) {
        setPosts(fetchedPosts);
        // Also apply filters to the new posts
        applyFilters(fetchedPosts);
      } else {
        // Otherwise append to existing posts
        const updatedPosts = [...posts, ...fetchedPosts];
        setPosts(updatedPosts);
        // Apply filters to all posts
        applyFilters(updatedPosts);
      }
      
      // Check if we have more posts to load using the next property
      setHasMore(!!responseData.next);
      setPage(pageToFetch);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Failed to load posts. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [applyFilters, posts]);

  useEffect(() => {
    // Prevent multiple initial data fetches
    if (!dataFetchedRef.current) {
      console.log('Initial data fetch');
      fetchPosts();
      if (currentUser) {
        fetchUserPosts();
      }
      dataFetchedRef.current = true;
    }
  }, [currentUser, fetchUserPosts, fetchPosts]);
  
  // Effect to apply filters when filter conditions change
  useEffect(() => {
    // Only apply filters if we have posts and the filter conditions changed
    if ((tabValue === 0 && posts.length > 0) || (tabValue === 1 && userPosts.length > 0)) {
      console.log('Filter conditions changed, reapplying filters');
      filterAppliedRef.current = false;
      
      if (tabValue === 0) {
        applyFilters(posts);
      } else {
        applyFilters(userPosts);
      }
    }
  }, [tabValue, posts, userPosts, applyFilters]);

  const fetchMoreData = () => {
    if (!hasMore) return;
    fetchPosts(page + 1);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    // Apply filters to the correct set of posts when tab changes
    if (newValue === 0) {
      applyFilters(posts);
    } else {
      applyFilters(userPosts);
    }
  };

  const handlePostCreated = () => {
    // Refresh both post lists
    fetchPosts(1);
    if (currentUser) {
      fetchUserPosts();
    }
  };
  
  // Filter-related functions
  const handleOpenFilterDialog = () => {
    setFilterDialogOpen(true);
  };
  
  const handleCloseFilterDialog = () => {
    setFilterDialogOpen(false);
  };
  
  const handleIncludeWordKeyDown = (e) => {
    if (e.key === 'Enter' && currentIncludeWord.trim()) {
      addIncludeWord(currentIncludeWord.trim());
      setCurrentIncludeWord('');
    }
  };
  
  const handleExcludeWordKeyDown = (e) => {
    if (e.key === 'Enter' && currentExcludeWord.trim()) {
      addExcludeWord(currentExcludeWord.trim());
      setCurrentExcludeWord('');
    }
  };
  
  const addIncludeWord = (word) => {
    if (word && !includeWords.includes(word)) {
      setIncludeWords([...includeWords, word]);
    }
  };
  
  const addExcludeWord = (word) => {
    if (word && !excludeWords.includes(word)) {
      setExcludeWords([...excludeWords, word]);
    }
  };
  
  const removeIncludeWord = (word) => {
    setIncludeWords(includeWords.filter(w => w !== word));
  };
  
  const removeExcludeWord = (word) => {
    setExcludeWords(excludeWords.filter(w => w !== word));
  };
  
  const handleClearFilters = () => {
    setIncludeWords([]);
    setExcludeWords([]);
    setSearchTerm('');
    setCaseSensitive(false);
    
    // Reset filtered posts to all posts
    if (tabValue === 0) {
      setFilteredPosts(posts);
    } else {
      setFilteredPosts(userPosts);
    }
  };
  
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const handleSearchToggle = () => {
    setSearchActive(!searchActive);
    if (searchActive) {
      setSearchTerm('');
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Social Feed
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <IconButton 
              color={((includeWords.length > 0 || excludeWords.length > 0) ? "primary" : "default")}
              onClick={handleOpenFilterDialog}
              sx={{ border: '1px solid', borderColor: 'divider' }}
              aria-label="Filter posts"
            >
              <FilterIcon />
            </IconButton>
            <IconButton
              color={searchActive ? "primary" : "default"}
              onClick={handleSearchToggle}
              sx={{ border: '1px solid', borderColor: 'divider' }}
              aria-label="Search posts"
            >
              <SearchIcon />
            </IconButton>
            {currentUser && (
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate('/posts/new')}
              >
                Create Post
              </Button>
            )}
          </Box>
        </Box>
        
        {searchActive && (
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              placeholder="Search posts..."
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton
                      edge="end"
                      onClick={() => setSearchTerm('')}
                      size="small"
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Box>
        )}
        
        {(includeWords.length > 0 || excludeWords.length > 0) && (
          <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">Active filters:</Typography>
            
            {includeWords.map(word => (
              <Chip 
                key={`include-${word}`}
                label={`Include: ${word}`}
                onDelete={() => removeIncludeWord(word)}
                color="primary"
                variant="outlined"
                size="small"
              />
            ))}
            
            {excludeWords.map(word => (
              <Chip 
                key={`exclude-${word}`}
                label={`Exclude: ${word}`}
                onDelete={() => removeExcludeWord(word)}
                color="error"
                variant="outlined"
                size="small"
              />
            ))}
            
            <Button 
              variant="text" 
              size="small" 
              onClick={handleClearFilters}
              startIcon={<CloseIcon fontSize="small" />}
            >
              Clear filters
            </Button>
          </Box>
        )}

        {/* Facebook-style post creation section */}
        {currentUser && (
          <QuickPostForm onPostCreated={handlePostCreated} />
        )}

        {currentUser && (
          <Paper sx={{ mb: 4 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              centered
            >
              <Tab label="All Posts" />
              <Tab label="My Posts" />
            </Tabs>
          </Paper>
        )}

        {error && (
          <Paper sx={{ p: 2, mb: 3, bgcolor: 'error.light', color: 'error.contrastText' }}>
            <Typography>{error}</Typography>
          </Paper>
        )}

        {/* Filter dialog */}
        <Dialog open={filterDialogOpen} onClose={handleCloseFilterDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            Filter Posts
            <IconButton
              aria-label="close"
              onClick={handleCloseFilterDialog}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>Include words</Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Posts must contain these words
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Add word to include..."
                  value={currentIncludeWord}
                  onChange={(e) => setCurrentIncludeWord(e.target.value)}
                  onKeyDown={handleIncludeWordKeyDown}
                />
                <IconButton 
                  color="primary" 
                  onClick={() => {
                    if (currentIncludeWord.trim()) {
                      addIncludeWord(currentIncludeWord.trim());
                      setCurrentIncludeWord('');
                    }
                  }}
                  disabled={!currentIncludeWord.trim()}
                >
                  <AddIcon />
                </IconButton>
              </Box>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {includeWords.map(word => (
                  <Chip 
                    key={word}
                    label={word}
                    onDelete={() => removeIncludeWord(word)}
                    color="primary"
                    size="small"
                  />
                ))}
              </Box>
            </FormControl>
            
            <Divider sx={{ my: 2 }} />
            
            <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>Exclude words</Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Posts must NOT contain these words
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Add word to exclude..."
                  value={currentExcludeWord}
                  onChange={(e) => setCurrentExcludeWord(e.target.value)}
                  onKeyDown={handleExcludeWordKeyDown}
                />
                <IconButton 
                  color="primary" 
                  onClick={() => {
                    if (currentExcludeWord.trim()) {
                      addExcludeWord(currentExcludeWord.trim());
                      setCurrentExcludeWord('');
                    }
                  }}
                  disabled={!currentExcludeWord.trim()}
                >
                  <AddIcon />
                </IconButton>
              </Box>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {excludeWords.map(word => (
                  <Chip 
                    key={word}
                    label={word}
                    onDelete={() => removeExcludeWord(word)}
                    color="error"
                    size="small"
                  />
                ))}
              </Box>
            </FormControl>
            
            <Divider sx={{ my: 2 }} />
            
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch 
                    checked={caseSensitive}
                    onChange={(e) => setCaseSensitive(e.target.checked)}
                  />
                }
                label="Case sensitive matching"
              />
            </FormGroup>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClearFilters} color="inherit">
              Clear All Filters
            </Button>
            <Button onClick={handleCloseFilterDialog} color="primary">
              Apply Filters
            </Button>
          </DialogActions>
        </Dialog>

        {tabValue === 0 ? (
          // All Posts Tab
          loading && posts.length === 0 ? (
            <Box display="flex" justifyContent="center" my={4}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {/* Show filtered count if filtering is active */}
              {(includeWords.length > 0 || excludeWords.length > 0 || searchTerm) && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Showing {filteredPosts.length} of {posts.length} posts
                </Typography>
              )}
              <PostList 
                posts={filteredPosts.length > 0 || includeWords.length > 0 || excludeWords.length > 0 || searchTerm ? filteredPosts : posts} 
                fetchMoreData={!includeWords.length && !excludeWords.length && !searchTerm ? fetchMoreData : null} 
                hasMore={!includeWords.length && !excludeWords.length && !searchTerm ? hasMore : false} 
              />
            </>
          )
        ) : (
          // My Posts Tab
          <>
            {/* Show filtered count if filtering is active */}
            {(includeWords.length > 0 || excludeWords.length > 0 || searchTerm) && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Showing {filteredPosts.length} of {userPosts.length} posts
              </Typography>
            )}
            <PostList 
              posts={filteredPosts.length > 0 || includeWords.length > 0 || excludeWords.length > 0 || searchTerm ? filteredPosts : userPosts} 
              showAuthor={false}
            />
          </>
        )}
      </Box>
    </Container>
  );
};

export default Home; 