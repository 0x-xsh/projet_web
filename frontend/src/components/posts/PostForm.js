import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Alert,
  Paper,
  CircularProgress,
} from '@mui/material';
import { PostService } from '../../services/api';

// Validation schema
const PostSchema = Yup.object().shape({
  title: Yup.string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be less than 200 characters')
    .required('Title is required'),
  content: Yup.string()
    .min(10, 'Content must be at least 10 characters')
    .required('Content is required'),
});

const PostForm = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // post id for editing, undefined for creating
  const isEditMode = !!id;
  
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(isEditMode);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch post data if we're editing an existing post
    if (isEditMode) {
      const fetchPost = async () => {
        try {
          setLoading(true);
          const response = await PostService.getPost(id);
          setPost(response.data);
          setLoading(false);
        } catch (err) {
          setError('Failed to load post. Please try again.');
          setLoading(false);
        }
      };

      fetchPost();
    }
  }, [id, isEditMode]);

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setError('');
      
      if (isEditMode) {
        await PostService.updatePost(id, values);
      } else {
        await PostService.createPost(values);
      }
      
      // Redirect to home page after successful submission
      navigate('/');
    } catch (err) {
      setError(
        err.response?.data?.detail || 
        `Failed to ${isEditMode ? 'update' : 'create'} post. Please try again.`
      );
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" my={4}>
        <CircularProgress />
      </Box>
    );
  }

  const initialValues = isEditMode && post
    ? { title: post.title, content: post.content }
    : { title: '', content: '' };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography component="h1" variant="h4" align="center" gutterBottom>
          {isEditMode ? 'Edit Post' : 'Create New Post'}
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Formik
          initialValues={initialValues}
          validationSchema={PostSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ errors, touched, isSubmitting }) => (
            <Form>
              <Field
                as={TextField}
                margin="normal"
                fullWidth
                label="Title"
                name="title"
                error={touched.title && Boolean(errors.title)}
                helperText={touched.title && errors.title}
              />
              <Field
                as={TextField}
                margin="normal"
                fullWidth
                label="Content"
                name="content"
                multiline
                rows={6}
                error={touched.content && Boolean(errors.content)}
                helperText={touched.content && errors.content}
              />
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate(-1)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={isSubmitting}
                >
                  {isEditMode ? 'Update Post' : 'Create Post'}
                </Button>
              </Box>
            </Form>
          )}
        </Formik>
      </Paper>
    </Container>
  );
};

export default PostForm; 