import React from 'react';
import { Container, Typography, Grid, Card, CardContent, CardActionArea, Box, Link as MuiLink, Button, useTheme } from '@mui/material';
import { Link } from 'react-router-dom';
import { AutoAwesome, Eco, Star, ArrowBack as ArrowBackIcon, ArrowForward as ArrowForwardIcon } from '@mui/icons-material'; // Icons for each post & back button

const blogPosts = [
  {
    title: 'AI-Powered Lease Management Software for Small Multifamily Properties',
    description: '🤖 Discover how AI-driven lease management software can transform small-scale multifamily property operations...',
    path: '/blog/ai-lease-management-small-multifamily',
    icon: <AutoAwesome color="primary" sx={{ fontSize: 40 }} />,
  },
  {
    title: 'Green Lease Agreements: Sustainable Commercial Property Management Tips',
    description: '🌱 Learn how green lease agreements can drive energy savings, attract eco-conscious tenants, and boost property values...',
    path: '/blog/green-lease-agreements',
    icon: <Eco color="success" sx={{ fontSize: 40 }} />,
  },
  {
    title: 'Maximizing Revenue with Niche Short-Term Rental Lease Management',
    description: '🎯 Unlock higher profits by catering to niche short-term rental markets like corporate housing, medical stays...',
    path: '/blog/niche-short-term-rental-management',
    icon: <Star color="warning" sx={{ fontSize: 40 }} />,
  },
  // Add more blog posts here as they are created
];

const BlogIndex = () => {
  const theme = useTheme(); // Access theme for colors

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}> {/* Wrap header for spacing */}
        {/* Back to Home Button */}
        <Button 
          component={Link} 
          to="/" 
          startIcon={<ArrowBackIcon />} 
          sx={{ mb: 3 }}
        >
          Back to Home
        </Button>

        <Typography variant="h2" component="h1" gutterBottom align="center">
          LeaseShield Blog
        </Typography>
        <Typography variant="h6" component="p" color="text.secondary" align="center" paragraph>
          Insights and advice on lease management, property technology, and real estate trends.
        </Typography>
      </Box>

      <Grid container spacing={4} sx={{ mt: 6 }}> {/* Increased top margin */}
        {blogPosts.map((post) => (
          <Grid item key={post.path} xs={12} md={6} lg={4}>
            <Card 
              elevation={2} // Slightly reduced elevation for a flatter look
              sx={{
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                borderRadius: 3, // Softer corners (adjust as needed, e.g., theme.shape.borderRadius * 2)
                bgcolor: theme.palette.mode === 'light' ? theme.palette.grey[50] : theme.palette.grey[900], // Subtle background
                transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: theme.shadows[4], // Adjusted hover shadow
                }
              }}
            >
              <MuiLink component={Link} to={post.path} underline="none" color="inherit" sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                <CardActionArea sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', p: 2.5 }}> {/* Increased padding */} 
                  <Box sx={{ textAlign: 'center', mb: 2 }}> {/* Added margin bottom to icon */}
                    {post.icon}
                  </Box>
                  <CardContent sx={{ flexGrow: 1, textAlign: 'center', p: 0, display: 'flex', flexDirection: 'column' }}> {/* Removed padding here, added flex */}
                    <Typography gutterBottom variant="h6" component="div" sx={{ minHeight: '3.5em', mb: 1.5 }}> {/* Adjusted minHeight and margin */}
                      {post.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph sx={{ flexGrow: 1, minHeight: '4.5em' }}> {/* Added flexGrow */}
                      {post.description}
                    </Typography>
                    <Box sx={{ mt: 2, alignSelf: 'center' }}> {/* Box for Read More */} 
                      <Typography 
                        variant="button" 
                        color="primary" 
                        sx={{
                          display: 'inline-flex', 
                          alignItems: 'center',
                          fontWeight: 'bold'
                        }}
                      >
                        Read More
                        <ArrowForwardIcon sx={{ ml: 0.5, fontSize: '1rem' }} />
                      </Typography>
                    </Box>
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