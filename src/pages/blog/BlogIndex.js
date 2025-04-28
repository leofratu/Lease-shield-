import React from 'react';
import { Container, Typography, Grid, Card, CardContent, CardActionArea, Box, Link as MuiLink } from '@mui/material';
import { Link } from 'react-router-dom';
import { AutoAwesome, Eco, Star } from '@mui/icons-material'; // Icons for each post

const blogPosts = [
  {
    title: 'AI-Powered Lease Management Software for Small Multifamily Properties',
    description: 'Discover how AI-driven lease management software can transform small-scale multifamily property operations...',
    path: '/blog/ai-lease-management-small-multifamily',
    icon: <AutoAwesome color="primary" sx={{ fontSize: 40 }} />,
  },
  {
    title: 'Green Lease Agreements: Sustainable Commercial Property Management Tips',
    description: 'Learn how green lease agreements can drive energy savings, attract eco-conscious tenants, and boost property values...',
    path: '/blog/green-lease-agreements',
    icon: <Eco color="success" sx={{ fontSize: 40 }} />,
  },
  {
    title: 'Maximizing Revenue with Niche Short-Term Rental Lease Management',
    description: 'Unlock higher profits by catering to niche short-term rental markets like corporate housing, medical stays...',
    path: '/blog/niche-short-term-rental-management',
    icon: <Star color="warning" sx={{ fontSize: 40 }} />,
  },
  // Add more blog posts here as they are created
];

const BlogIndex = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h2" component="h1" gutterBottom align="center">
        LeaseShield Blog
      </Typography>
      <Typography variant="h6" component="p" color="text.secondary" align="center" paragraph>
        Insights and advice on lease management, property technology, and real estate trends.
      </Typography>

      <Grid container spacing={4} sx={{ mt: 4 }}>
        {blogPosts.map((post) => (
          <Grid item key={post.path} xs={12} md={6} lg={4}>
            <Card elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <MuiLink component={Link} to={post.path} underline="none" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <CardActionArea sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
                  <Box sx={{ p: 2, textAlign: 'center' }}>
                    {post.icon}
                  </Box>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography gutterBottom variant="h6" component="div">
                      {post.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {post.description}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </MuiLink>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default BlogIndex; 