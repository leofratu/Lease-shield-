import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Container,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Divider
} from '@mui/material';

// Define blog posts data (replace with dynamic fetching later if needed)
const blogPosts = [
  {
    slug: 'how-to-spot-lease-scams',
    title: 'How to Spot Common Rental Lease Scams',
    excerpt: 'Protect yourself from rental scams by learning common tactics scammers use...',
  },
  {
    slug: 'understanding-common-clauses',
    title: 'Decoding Your Lease: Understanding Common Clauses',
    excerpt: 'A breakdown of common rental lease clauses like maintenance, pets, subletting...',
  },
  {
    slug: 'negotiating-lease-terms',
    title: 'Tips for Negotiating Your Lease Terms',
    excerpt: 'Learn effective strategies for negotiating specific terms in your rental lease before signing...',
  },
  {
    slug: 'lease-red-flags',
    title: 'Red Flags to Watch For in a Lease Agreement',
    excerpt: 'Learn to identify potential red flags and concerning clauses in a rental lease...',
  },
  {
    slug: 'tenant-rights-overview',
    title: 'Know Your Rights: A Basic Overview for Tenants',
    excerpt: 'Understand fundamental tenant rights related to privacy, repairs, security deposits...',
  },
];

const BlogIndexPage = () => {
  return (
    <Container maxWidth="md" sx={{ my: 4 }}>
      <Helmet>
        <title>Lease Shield AI Blog | Tips for Tenants & Lease Analysis</title>
        <meta 
          name="description" 
          content="Read articles on understanding leases, spotting scams, negotiating terms, and tenant rights from Lease Shield AI."
        />
      </Helmet>
      <Typography variant="h1" component="h1" gutterBottom sx={{ mb: 4, fontSize: { xs: '2.5rem', md: '3rem' }, fontWeight: 'bold' }}>
        Lease Shield AI Blog
      </Typography>
      
      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden'}}>
        <List disablePadding>
          {blogPosts.map((post, index) => (
            <React.Fragment key={post.slug}>
              <ListItem disablePadding>
                <ListItemButton component={RouterLink} to={`/blog/${post.slug}`}>
                  <ListItemText 
                    primary={post.title}
                    secondary={post.excerpt}
                    primaryTypographyProps={{ variant: 'h6', component: 'h2', mb: 0.5 }}
                  />
                </ListItemButton>
              </ListItem>
              {index < blogPosts.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </Paper>
    </Container>
  );
};

export default BlogIndexPage; 