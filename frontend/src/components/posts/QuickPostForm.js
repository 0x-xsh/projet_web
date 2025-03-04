import React, { useState } from 'react';
import { 
  Paper, 
  TextField, 
  Button, 
  Box, 
  Avatar, 
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import { PostService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const QuickPostForm = ({ onPostCreated }) => {
  const { currentUser } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      await PostService.createPost({ title, content });
      
      // Clear form
      setTitle('');
      setContent('');
      
      // Notify parent component to refresh posts
      if (onPostCreated) {
        onPostCreated();
      }
    } catch (err) {
      setError(
        err.response?.data?.detail || 
        'Failed to create post. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
        <Avatar 
          src={currentUser?.avatar} 
          alt={currentUser?.username}
          sx={{ mr: 2 }}
        />
        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
          {currentUser?.username}
        </Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <form onSubmit={handleSubmit}>
        <TextField
          placeholder="Title"
          fullWidth
          variant="outlined"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          placeholder="What's on your mind?"
          fullWidth
          multiline
          rows={3}
          variant="outlined"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Post'}
          </Button>
        </Box>
      </form>
    </Paper>
  );
};

export default QuickPostForm; 