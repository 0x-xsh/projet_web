import React from 'react';
import { 
  List, 
  Typography, 
  Box,
  CircularProgress,
  Paper
} from '@mui/material';
import PostItem from './PostItem';
import InfiniteScroll from 'react-infinite-scroll-component';

const PostList = ({ posts = [], showAuthor = true, fetchMoreData, hasMore = false, forceAuthor = false }) => {
  // If no fetchMoreData provided, we're showing a static list (like user's own posts)
  const isInfiniteScroll = !!fetchMoreData;

  if (!posts || posts.length === 0) {
    return (
      <Paper elevation={0} sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="textSecondary">
          No posts to display.
        </Typography>
      </Paper>
    );
  }

  const content = (
    <List sx={{ width: '100%', bgcolor: 'background.paper', p: 0 }}>
      {posts.map((post) => (
        <PostItem 
          key={post.id} 
          post={post} 
          showAuthor={showAuthor} 
          forceAuthor={forceAuthor} 
        />
      ))}
    </List>
  );

  if (!isInfiniteScroll) {
    return content;
  }

  return (
    <InfiniteScroll
      dataLength={posts.length}
      next={fetchMoreData}
      hasMore={hasMore}
      loader={
        <Box display="flex" justifyContent="center" my={2}>
          <CircularProgress size={30} />
        </Box>
      }
      endMessage={
        <Box textAlign="center" p={2}>
          <Typography variant="body2" color="textSecondary">
            You've seen all posts!
          </Typography>
        </Box>
      }
    >
      {content}
    </InfiniteScroll>
  );
};

export default PostList; 