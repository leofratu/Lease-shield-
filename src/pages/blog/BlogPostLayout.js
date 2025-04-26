import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Box, Typography, Paper, Container, Breadcrumbs, Link as MuiLink } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const BlogPostLayout = ({ children, title, description }) => {
  return (
    <Container maxWidth="md" sx={{ my: 4 }}>
      <Helmet>
        <title>{title} | Lease Shield AI Blog</title>
        <meta name="description" content={description} />
      </Helmet>
      
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
        <MuiLink component={RouterLink} underline="hover" color="inherit" to="/">
          Home
        </MuiLink>
        <MuiLink component={RouterLink} underline="hover" color="inherit" to="/blog">
          Blog
        </MuiLink>
        <Typography color="text.primary">{title}</Typography>
      </Breadcrumbs>
      
      <Paper sx={{ p: { xs: 2, sm: 3, md: 4 }, borderRadius: 2 }}>
        <Typography variant="h1" component="h1" gutterBottom sx={{ fontSize: { xs: '2rem', md: '2.5rem' }, fontWeight: 'bold' }}>
          {title}
        </Typography>
        
        {/* Optional: Add author/date here */}
        {/* <Typography variant="caption" color="text.secondary" sx={{ mb: 3, display: 'block' }}>
          By Lease Shield AI Team • [Date]
        </Typography> */}
        
        <Box sx={{ '& h2': { mt: 4, mb: 2, fontSize: '1.75rem', fontWeight: '600' }, '& p': { mb: 2, lineHeight: 1.7 }, '& strong': { fontWeight: 'bold' } }}>
          {children}
        </Box>
      </Paper>
    </Container>
  );
};

export default BlogPostLayout; 