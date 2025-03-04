import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardHeader, 
  CardContent, 
  CardActions, 
  Avatar, 
  IconButton, 
  Typography, 
  Box,
  Collapse,
  Divider,
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  CircularProgress,
  Fade,
  Tooltip,
  Badge,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button
} from '@mui/material';
import { 
  Favorite, 
  FavoriteBorder, 
  Comment, 
  ExpandMore, 
  Delete,
  Send,
  BookmarkBorderOutlined,
  ShareOutlined,
  WarningAmber
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useAuth } from '../../contexts/AuthContext';
import { PostService, UserService } from '../../services/api';
import { formatDistanceToNow } from 'date-fns';

const ExpandButton = styled((props) => {
  const { expand, ...other } = props;
  return <IconButton {...other} />;
})(({ theme, expand }) => ({
  transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
  marginLeft: 'auto',
  transition: theme.transitions.create('transform', {
    duration: theme.transitions.duration.shortest,
  }),
}));

const PostItem = ({ post, showAuthor = true, forceAuthor = false, onPostDeleted }) => {
  const { currentUser } = useAuth();
  
  // Simple direct check - compare IDs directly
  const canDelete = forceAuthor || (currentUser && currentUser.id === post.author);
  
  const [expanded, setExpanded] = useState(false);
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [liked, setLiked] = useState(post.is_liked || false);
  const [likeCount, setLikeCount] = useState(post.like_count || 0);
  const [authorData, setAuthorData] = useState(null);
  const [authorLoading, setAuthorLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [commentError, setCommentError] = useState('');
  const [error, setError] = useState('');
  
  // Determine if current user is the author immediately - more direct comparison
  // This adds a more explicit check based on IDs only
  const postAuthorId = typeof post.author === 'object' ? post.author.id : post.author;
  const currentUserId = currentUser ? currentUser.id : null;
  const isAuthorByIds = currentUserId && postAuthorId && 
                       (currentUserId.toString() === postAuthorId.toString());

  // Fetch author data if needed
  useEffect(() => {
    const fetchAuthorData = async () => {
      try {
        const response = await UserService.getUserById(post.author);
        setAuthorData(response.data);
      } catch (err) {
        // Try one more time after a short delay
        try {
          await new Promise(resolve => setTimeout(resolve, 1000));
          const retryResponse = await UserService.getUserById(post.author);
          setAuthorData(retryResponse.data);
        } catch (retryErr) {
          setAuthorData(null);
        }
      }
    };

    if (showAuthor && !forceAuthor) {
      fetchAuthorData();
    }
  }, [post.author, showAuthor, forceAuthor]);

  // After the useEffect for author data
  // If forceAuthor is true (in Profile page), or direct ID comparison matches,
  // then always consider the user is the author
  const isAuthor = forceAuthor || isAuthorByIds || (currentUser && (
    (typeof post.author === 'number' && post.author === currentUser.id) || 
    (typeof post.author === 'string' && post.author === currentUser.username) ||
    (typeof post.author === 'object' && post.author && post.author.id === currentUser.id) ||
    (currentUser.id && post.author && post.author.toString() === currentUser.id.toString())
  ));
  
  // Add a simple useEffect to immediately check author status when component mounts
  useEffect(() => {
    if (currentUser && post) {
      const postAuthorId = typeof post.author === 'object' ? post.author.id : post.author;
      const currentUserId = currentUser.id;
      
      if (postAuthorId && currentUserId) {
        const isPostAuthor = postAuthorId.toString() === currentUserId.toString();
        console.log(`Post #${post.id} authorship check:`, { 
          postAuthorId, 
          currentUserId, 
          isAuthor: isPostAuthor,
          forceAuthor
        });
      }
    }
  }, [currentUser, post, forceAuthor]);

  const handleExpandClick = () => {
    if (!expanded) {
      fetchComments();
    }
    setExpanded(!expanded);
  };

  const handleLike = async () => {
    try {
      if (liked) {
        await PostService.unlikePost(post.id);
      } else {
        await PostService.likePost(post.id);
      }
      setLiked(!liked);
      setLikeCount(liked ? likeCount - 1 : likeCount + 1);
    } catch (error) {
      setCommentError('Failed to update like status');
    }
  };

  const fetchComments = async () => {
    try {
      const response = await PostService.getPostComments(post.id);
      setComments(response.data);
    } catch (err) {
      setError('Failed to load comments');
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setCommentError(''); // Clear previous errors
    try {
      await PostService.addComment(post.id, { content: comment });
      setComment('');
      await fetchComments();
    } catch (err) {
      setError('Failed to add comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await PostService.deleteComment(post.id, commentId);
      await fetchComments();
    } catch (err) {
      setError('Failed to delete comment');
    }
  };

  const handleDeletePost = async () => {
    try {
      await PostService.deletePost(post.id);
      if (onPostDeleted) {
        onPostDeleted(post.id);
      }
    } catch (err) {
      setError('Failed to delete post');
    }
  };
  
  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };
  
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };
  
  const handleDeleteConfirm = () => {
    handleDeletePost();
    setDeleteDialogOpen(false);
  };

  // Format date
  const formatDate = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'some time ago';
    }
  };

  // Get author name from state
  const getAuthorName = () => {
    if (authorLoading) return 'Loading...';
    if (authorData && authorData.username) return authorData.username;
    return 'Unknown';
  };

  // Get author initial for avatar
  const getAuthorInitial = () => {
    const name = getAuthorName();
    if (name === 'Loading...') return '...';
    return typeof name === 'string' ? name.charAt(0).toUpperCase() : 'U';
  };

  // Get comment author name handling different formats
  const getCommentAuthorName = (comment) => {
    if (typeof comment.author === 'object' && comment.author !== null) {
      return comment.author.username || 'Unknown';
    }
    // Handle cases where we get author_username
    if (comment.author_username) {
      return comment.author_username;
    }
    return comment.author || 'Unknown';
  };

  // Get comment author initial for avatar
  const getCommentAuthorInitial = (comment) => {
    const name = getCommentAuthorName(comment);
    return typeof name === 'string' ? name.charAt(0).toUpperCase() : 'U';
  };

  return (
    <>
      <Fade in={true} timeout={300}>
        <Card
          elevation={2}
          sx={{
            mb: 3,
            overflow: 'visible',
            borderRadius: 3,
            transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
            },
            ...(isAuthor && {
              borderLeft: '4px solid',
              borderColor: 'primary.main',
            })
          }}
        >
          <CardHeader
            avatar={
              <Avatar 
                sx={{ 
                  bgcolor: 'secondary.main', 
                  fontWeight: 'bold',
                  border: '2px solid white',
                  boxShadow: '0 3px 5px rgba(0, 0, 0, 0.1)'
                }}
              >
                {getAuthorInitial()}
              </Avatar>
            }
            action={
              canDelete ? (
                <Tooltip title="Delete Post">
                  <IconButton 
                    aria-label="delete post"
                    onClick={handleDeleteClick}
                    size="large"
                    sx={{ 
                      color: 'error.main',
                      '&:hover': { 
                        bgcolor: 'error.lighter',
                        transform: 'scale(1.1)'
                      },
                      transition: 'transform 0.2s ease'
                    }}
                  >
                    <Delete />
                  </IconButton>
                </Tooltip>
              ) : null
            }
            title={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                  {post.title}
                </Typography>
                {isAuthor && (
                  <Chip 
                    size="small" 
                    label="Your post" 
                    color="primary" 
                    variant="outlined" 
                    sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} 
                  />
                )}
              </Box>
            }
            subheader={
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                {showAuthor && (
                  <Typography variant="body2" sx={{ fontWeight: 500, mr: 1 }}>
                    {getAuthorName()}
                  </Typography>
                )}
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{ 
                    display: 'inline-flex',
                    alignItems: 'center',
                  }}
                >
                  • {formatDate(post.created_at)}
                </Typography>
              </Box>
            }
            sx={{ pt: 2.5, pb: 1.5 }}
          />
          
          <CardContent sx={{ pt: 0, pb: 1 }}>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
              {post.content}
            </Typography>
          </CardContent>
          
          <Divider sx={{ mx: 2 }} />
          
          <CardActions disableSpacing>
            <Tooltip title={liked ? "Unlike" : "Like"}>
              <IconButton 
                aria-label="like" 
                onClick={handleLike}
              >
                {liked ? 
                  <Badge badgeContent={likeCount} color="error">
                    <Favorite color="error" />
                  </Badge> : 
                  <Badge badgeContent={likeCount} color="primary">
                    <FavoriteBorder />
                  </Badge>
                }
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Comment">
              <IconButton 
                aria-label="comment"
                onClick={handleExpandClick}
              >
                <Badge 
                  badgeContent={post.comments ? post.comments.length : 0} 
                  color="primary"
                >
                  <Comment />
                </Badge>
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Save">
              <IconButton aria-label="save">
                <BookmarkBorderOutlined />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Share">
              <IconButton aria-label="share">
                <ShareOutlined />
              </IconButton>
            </Tooltip>
            
            <ExpandButton
              expand={expanded}
              onClick={handleExpandClick}
              aria-expanded={expanded}
              aria-label="show comments"
            >
              <ExpandMore />
            </ExpandButton>
          </CardActions>
          
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Divider sx={{ mx: 2, mb: 2 }} />
            <Box sx={{ px: 2, pb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, fontSize: '1rem' }}>
                Comments
              </Typography>
              
              {loadingComments ? (
                <Box display="flex" justifyContent="center" my={2}>
                  <CircularProgress size={30} />
                </Box>
              ) : comments.length > 0 ? (
                <List>
                  {comments.map((comment) => (
                    <Paper
                      key={comment.id}
                      elevation={0}
                      sx={{ 
                        mb: 2, 
                        borderRadius: 2,
                        backgroundColor: 'rgba(0, 0, 0, 0.02)',
                      }}
                    >
                      <ListItem
                        alignItems="flex-start"
                        secondaryAction={
                          (currentUser && comment.author === currentUser.id) && (
                            <IconButton 
                              edge="end" 
                              aria-label="delete" 
                              onClick={() => handleDeleteComment(comment.id)}
                              size="small"
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          )
                        }
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                            {getCommentAuthorInitial(comment)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="subtitle2">
                                {getCommentAuthorName(comment)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                • {formatDate(comment.created_at)}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Typography 
                              variant="body2" 
                              color="text.primary"
                              sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}
                            >
                              {comment.content}
                            </Typography>
                          }
                        />
                      </ListItem>
                    </Paper>
                  ))}
                </List>
              ) : (
                <Typography color="textSecondary" sx={{ my: 2, textAlign: 'center' }}>
                  No comments yet. Be the first to comment!
                </Typography>
              )}
              
              {currentUser && (
                <Box component="form" onSubmit={handleCommentSubmit} sx={{ mt: 3 }}>
                  <TextField
                    fullWidth
                    placeholder="Write a comment..."
                    variant="outlined"
                    size="small"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    InputProps={{
                      endAdornment: (
                        <IconButton 
                          color="primary" 
                          edge="end" 
                          type="submit"
                          disabled={!comment.trim()}
                        >
                          <Send />
                        </IconButton>
                      ),
                      sx: { borderRadius: 3 }
                    }}
                  />
                  {commentError && (
                    <Typography 
                      color="error" 
                      variant="caption" 
                      sx={{ mt: 1, display: 'block' }}
                    >
                      {commentError}
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          </Collapse>
        </Card>
      </Fade>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
        TransitionComponent={Fade}
        transitionDuration={400}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            border: '1px solid',
            borderColor: 'divider',
            maxWidth: 450
          }
        }}
      >
        <DialogTitle 
          id="delete-dialog-title"
          sx={{ 
            pb: 1, 
            display: 'flex', 
            alignItems: 'center',
            gap: 1
          }}
        >
          <WarningAmber color="error" />
          <Typography variant="h6" component="span" fontWeight={600}>
            Confirm Deletion
          </Typography>
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description" sx={{ mb: 2 }}>
            Are you sure you want to delete the post <strong>"{post.title}"</strong>? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={handleDeleteCancel} 
            variant="outlined"
            sx={{ fontWeight: 500 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            variant="contained" 
            color="error"
            sx={{ fontWeight: 500 }}
            autoFocus
          >
            Delete Post
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PostItem; 