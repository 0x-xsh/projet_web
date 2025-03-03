import axios from 'axios';

// API base URLs
const AUTH_API_URL = 'http://localhost:9000';
const USERS_API_URL = 'http://localhost:9002';
const POSTS_API_URL = 'http://localhost:9001';

// Secure token retrieval function
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

// Create axios instances for each service
const authApi = axios.create({
  baseURL: AUTH_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: false, // Important for CORS
});

const usersApi = axios.create({
  baseURL: USERS_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: false, // Important for CORS
});

const postsApi = axios.create({
  baseURL: POSTS_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: false, // Important for CORS
});

// No interceptors for auth API - we'll manually add tokens when needed
// This prevents invalid token errors on login/register/etc.

// Add interceptors only to services that require authentication
const setupAuthInterceptors = (instance) => {
  instance.interceptors.request.use(
    (config) => {
      const token = getSecureToken('access_token');
      
      console.log('Interceptor running for URL:', config.url);
      console.log('Token available:', token ? 'Yes' : 'No');
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('Authorization header added');
      } else {
        // If no token is available, don't add Authorization header
        delete config.headers.Authorization;
        console.log('No Authorization header added (no token available)');
      }
      return config;
    },
    (error) => {
      console.error('Interceptor request error:', error);
      return Promise.reject(error);
    }
  );
  
  // Add response interceptor for debugging
  instance.interceptors.response.use(
    (response) => {
      console.log('API Response Success:', response.config.url);
      return response;
    },
    (error) => {
      console.error('API Response Error:', error.config?.url || 'Unknown URL');
      console.error('Error details:', error.response?.data || error.message);
      return Promise.reject(error);
    }
  );
};

// Apply auth interceptors only to protected APIs
setupAuthInterceptors(usersApi);
setupAuthInterceptors(postsApi);

// Auth service
const AuthService = {
  register: (userData) => {
    // Using authApi without token headers
    return authApi.post('/register/', userData);
  },
  login: (credentials) => {
    // Using authApi without token headers
    return authApi.post('/login/', credentials);
  },
  refreshToken: (refreshToken) => {
    // Using authApi without token headers
    return authApi.post('/token/refresh/', { refresh: refreshToken });
  },
  verifyToken: (token) => {
    // Manually add the token for verification
    return authApi.post('/verify-token/', { token });
  },
};

// User service
const UserService = {
  getCurrentUser: () => {
    return usersApi.get('/api/users/me/');
  },
  updateUser: (userData) => {
    return usersApi.put('/api/users/me/', userData);
  },
  deleteUser: () => {
    return usersApi.delete('/api/users/me/');
  },
  getUserById: (userId) => {
    return usersApi.get(`/api/users/${userId}/`);
  },
};

// Posts service
const PostService = {
  getAllPosts: (page = 1) => {
    return postsApi.get(`/api/posts/?page=${page}`);
  },
  getPostsByUser: (userId) => {
    return postsApi.get(`/api/posts/?author=${userId}&page=1`);
  },
  getPost: (id) => {
    return postsApi.get(`/api/posts/${id}/`);
  },
  createPost: (postData) => {
    return postsApi.post('/api/posts/', postData);
  },
  updatePost: (id, postData) => {
    return postsApi.put(`/api/posts/${id}/`, postData);
  },
  deletePost: (id) => {
    return postsApi.delete(`/api/posts/${id}/`);
  },
  likePost: (postId) => {
    return postsApi.post(`/api/posts/${postId}/like/`);
  },
  unlikePost: (postId) => {
    return postsApi.post(`/api/posts/${postId}/unlike/`);
  },
  getPostLikes: (postId) => {
    return postsApi.get(`/api/posts/${postId}/likes/`);
  },
  getPostComments: (postId) => {
    return postsApi.get(`/api/posts/${postId}/comments/`);
  },
  addComment: (postId, commentData) => {
    return postsApi.post(`/api/posts/${postId}/comment/`, commentData);
  },
  updateComment: (postId, commentId, commentData) => {
    return postsApi.put(`/api/posts/${postId}/comments/${commentId}/`, commentData);
  },
  deleteComment: (postId, commentId) => {
    return postsApi.delete(`/api/posts/${postId}/comments/${commentId}/`);
  },
};

export { AuthService, UserService, PostService }; 