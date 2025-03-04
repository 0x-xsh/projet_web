import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Container,
  Grid,
  Box,
  Paper,
  CircularProgress,
  Typography,
  IconButton,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  Divider
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { PostService } from '../services/api';
import PostList from './posts/PostList';
import QuickPostForm from './posts/QuickPostForm';
import {
  FilterList as FilterIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  Add as AddIcon
} from '@mui/icons-material';

const COOKIE_EXPIRATION = 30; // days
const FILTER_COOKIE_NAME = 'post_filters';

const Home = () => {
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // Load initial filter states from cookies
  const loadFiltersFromCookies = () => {
    try {
      const filtersCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith(FILTER_COOKIE_NAME + '='));
      
      if (filtersCookie) {
        const filtersData = JSON.parse(decodeURIComponent(filtersCookie.split('=')[1]));
        return {
          includeWords: filtersData.includeWords || [],
          excludeWords: filtersData.excludeWords || [],
          searchTerm: filtersData.searchTerm || '',
          caseSensitive: filtersData.caseSensitive || false
        };
      }
    } catch (error) {
      console.error('Error loading filters from cookies:', error);
    }
    return {
      includeWords: [],
      excludeWords: [],
      searchTerm: '',
      caseSensitive: false
    };
  };

  const initialFilters = loadFiltersFromCookies();
  
  // Filter states
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [includeWords, setIncludeWords] = useState(initialFilters.includeWords);
  const [excludeWords, setExcludeWords] = useState(initialFilters.excludeWords);
  const [currentIncludeWord, setCurrentIncludeWord] = useState('');
  const [currentExcludeWord, setCurrentExcludeWord] = useState('');
  const [searchActive, setSearchActive] = useState(false);
  const [searchTerm, setSearchTerm] = useState(initialFilters.searchTerm);
  const [caseSensitive, setCaseSensitive] = useState(initialFilters.caseSensitive);
  const [filteredPosts, setFilteredPosts] = useState([]);

  // Save filters to cookies
  const saveFiltersToCookies = useCallback(() => {
    const filtersData = {
      includeWords,
      excludeWords,
      searchTerm,
      caseSensitive
    };
    
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + COOKIE_EXPIRATION);
    
    document.cookie = `${FILTER_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(filtersData))}; expires=${expirationDate.toUTCString()}; path=/`;
  }, [includeWords, excludeWords, searchTerm, caseSensitive]);

  // Apply filters with debouncing
  const applyFilters = useCallback((postsToFilter) => {
    if (!postsToFilter) return;
    
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
        return !excludeWords.some(word => {
          const searchWord = caseSensitive ? word : word.toLowerCase();
          return title.includes(searchWord) || content.includes(searchWord);
        });
      });
    }
    
    setFilteredPosts(filtered);
    saveFiltersToCookies();
  }, [includeWords, excludeWords, searchTerm, caseSensitive, saveFiltersToCookies]);

  // Add debouncing for search
  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      applyFilters(posts);
    }, 300); // 300ms delay

    return () => clearTimeout(debounceTimeout);
  }, [searchTerm, includeWords, excludeWords, caseSensitive, posts, applyFilters]);

  // Add a ref to track if data is already loaded
  const dataFetchedRef = useRef(false);

  const fetchPosts = useCallback(async (pageToFetch = 1) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await PostService.getAllPosts(pageToFetch);
      const responseData = response.data;
      const fetchedPosts = responseData.results || [];
      
      if (pageToFetch === 1) {
        setPosts(fetchedPosts);
        applyFilters(fetchedPosts);
      } else {
        const updatedPosts = [...posts, ...fetchedPosts];
        setPosts(updatedPosts);
        applyFilters(updatedPosts);
      }
      
      setHasMore(!!responseData.next);
      setPage(pageToFetch);
    } catch (err) {
      setError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, [applyFilters, posts]);

  useEffect(() => {
    if (!dataFetchedRef.current) {
      fetchPosts();
      dataFetchedRef.current = true;
    }
  }, [fetchPosts]);

  const fetchMoreData = () => {
    if (!hasMore) return;
    fetchPosts(page + 1);
  };

  const handlePostCreated = () => {
    dataFetchedRef.current = false;
    fetchPosts(1);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Grid container spacing={3}>
        {/* Left Sidebar */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, position: 'sticky', top: '80px' }}>
            <Typography variant="h6" gutterBottom>
              Filters
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  )
                }}
              />
              <Box sx={{ mt: 1 }}>
                <Button
                  size="small"
                  onClick={() => setCaseSensitive(!caseSensitive)}
                  variant={caseSensitive ? "contained" : "outlined"}
                  color="primary"
                >
                  {caseSensitive ? "Case Sensitive" : "Case Insensitive"}
                </Button>
              </Box>
              {(includeWords.length > 0 || excludeWords.length > 0) && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Active Filters:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {includeWords.map(word => (
                      <Chip
                        key={`include-${word}`}
                        label={`Include: ${word}`}
                        size="small"
                        onDelete={() => {
                          setIncludeWords(includeWords.filter(w => w !== word));
                        }}
                        color="primary"
                      />
                    ))}
                    {excludeWords.map(word => (
                      <Chip
                        key={`exclude-${word}`}
                        label={`Exclude: ${word}`}
                        size="small"
                        onDelete={() => {
                          setExcludeWords(excludeWords.filter(w => w !== word));
                        }}
                        color="error"
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Main Content */}
        <Grid item xs={12} md={6}>
          {currentUser && (
            <QuickPostForm onPostCreated={handlePostCreated} />
          )}

          {error && (
            <Paper sx={{ p: 2, mb: 3, bgcolor: 'error.light', color: 'error.contrastText' }}>
              <Typography>{error}</Typography>
            </Paper>
          )}

          {loading && posts.length === 0 ? (
            <Box display="flex" justifyContent="center" my={4}>
              <CircularProgress />
            </Box>
          ) : (
            <PostList
              posts={filteredPosts.length > 0 || searchTerm || includeWords.length > 0 || excludeWords.length > 0 ? filteredPosts : posts}
              fetchMoreData={fetchMoreData}
              hasMore={hasMore}
              showAuthor={true}
              onPostsChange={(updatedPosts) => {
                setPosts(updatedPosts);
                applyFilters(updatedPosts);
              }}
            />
          )}
        </Grid>

        {/* Right Sidebar */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, position: 'sticky', top: '80px' }}>
            <Typography variant="h6" gutterBottom>
              Advanced Filters
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                size="small"
                label="Include word"
                value={currentIncludeWord}
                onChange={(e) => setCurrentIncludeWord(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && currentIncludeWord.trim()) {
                    setIncludeWords([...includeWords, currentIncludeWord.trim()]);
                    setCurrentIncludeWord('');
                  }
                }}
                helperText="Press Enter to add"
              />
              <TextField
                size="small"
                label="Exclude word"
                value={currentExcludeWord}
                onChange={(e) => setCurrentExcludeWord(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && currentExcludeWord.trim()) {
                    setExcludeWords([...excludeWords, currentExcludeWord.trim()]);
                    setCurrentExcludeWord('');
                  }
                }}
                helperText="Press Enter to add"
              />
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => {
                  setIncludeWords([]);
                  setExcludeWords([]);
                  setSearchTerm('');
                  setCaseSensitive(false);
                }}
                startIcon={<CloseIcon />}
              >
                Clear All Filters
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Home; 