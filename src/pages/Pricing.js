import React, { useState } from 'react';
import { Box, Typography, Paper, Button, Grid, Container, CircularProgress, Chip, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import StarIcon from '@mui/icons-material/Star';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from '../hooks/useAuthState';
import { Helmet } from 'react-helmet-async';
import { initiateCheckout } from '../utils/paymentUtils';

const Pricing = ({ showSnackbar }) => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthState();
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  
  const handleSubscribeClick = async () => {
    if (!user) {
      if (showSnackbar) showSnackbar('Please log in or register to subscribe', 'info');
      navigate('/login'); // Redirect to login if not authenticated
      return;
    }
    
    setLoadingCheckout(true);
    try {
      const token = await user.getIdToken();
      const checkoutUrl = await initiateCheckout(token);
      // Redirect the user to the payment gateway
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error("Checkout initiation failed:", error);
      if (showSnackbar) showSnackbar(error.message || 'Could not start subscription process. Please try again.', 'error');
      setLoadingCheckout(false);
    }
    // No need to setLoadingCheckout(false) on success because we redirect
  };

  const handleFreeTierClick = () => {
     if (user) {
        navigate('/dashboard'); // Go to dashboard if logged in
     } else {
        navigate('/register'); // Go to register if not logged in
     }
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <Helmet>
        <title>Pricing Plans | Lease Shield AI Lease Analyzer</title>
        <meta 
          name="description" 
          content="Choose the right Lease Shield AI plan. Analyze leases with our Free Trial or upgrade to Pro for unlimited analysis and advanced features." 
        />
      </Helmet>

      <Typography variant="h2" component="h1" gutterBottom sx={{ textAlign: 'center', mb: 6 }}>
        Choose Your Plan
      </Typography>
      
      <Grid container spacing={4} justifyContent="center" alignItems="stretch"> {/* Use alignItems stretch */}
        {/* Free Tier Card */}
        <Grid item xs={12} sm={6} md={5}>
          <Paper 
             variant="outlined" 
             sx={{ 
                p: 4, 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderRadius: 3
             }}
          >
            <Box>
              <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
                Free Trial
              </Typography>
              <Typography variant="h4" gutterBottom>
                $0 <Typography component="span" variant="body1" color="text.secondary">/ forever</Typography>
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Perfect for trying out the core analysis feature.
              </Typography>
              <List dense sx={{ mb: 3 }}>
                <ListItem disableGutters>
                  <ListItemIcon sx={{ minWidth: 30 }}><CheckIcon color="success" fontSize="small" /></ListItemIcon>
                  <ListItemText primary="1 Free Lease Analysis Scan" />
                </ListItem>
                 <ListItem disableGutters>
                  <ListItemIcon sx={{ minWidth: 30 }}><CheckIcon color="success" fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Basic Clause Identification" />
                </ListItem>
              </List>
            </Box>
            <Button 
              variant="outlined" 
              fullWidth 
              size="large"
              onClick={handleFreeTierClick}
              disabled={authLoading}
            >
              {user ? 'Go to Dashboard' : 'Get Started Free'}
            </Button>
          </Paper>
        </Grid>

        {/* Paid Tier Card */}
        <Grid item xs={12} sm={6} md={5}>
          <Paper 
             elevation={3} 
             sx={{ 
                p: 4, 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between',
                borderRadius: 3, 
                position: 'relative',
                border: '2px solid',
                borderColor: 'primary.main'
             }}
          >
             <Chip 
                label="Recommended" 
                color="primary" 
                size="small" 
                icon={<StarIcon />} 
                sx={{ position: 'absolute', top: 16, right: 16 }}
             />
            <Box>
              <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
                Pro Monthly
              </Typography>
              <Typography variant="h4" gutterBottom>
                $5 <Typography component="span" variant="body1" color="text.secondary">/ month</Typography>
              </Typography>
               <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Unlimited access to all analysis features.
              </Typography>
              <List dense sx={{ mb: 3 }}>
                 <ListItem disableGutters>
                  <ListItemIcon sx={{ minWidth: 30 }}><CheckIcon color="success" fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Unlimited Lease Analysis Scans" />
                </ListItem>
                 <ListItem disableGutters>
                  <ListItemIcon sx={{ minWidth: 30 }}><CheckIcon color="success" fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Detailed Clause Summaries" />
                </ListItem>
                 <ListItem disableGutters>
                  <ListItemIcon sx={{ minWidth: 30 }}><CheckIcon color="success" fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Risk Level Scoring" />
                </ListItem>
                 <ListItem disableGutters>
                  <ListItemIcon sx={{ minWidth: 30 }}><CheckIcon color="success" fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Email Draft Generation" />
                </ListItem>
                {/* Add more paid features here */}
              </List>
            </Box>
            <Button 
              variant="contained" 
              fullWidth 
              size="large"
              onClick={handleSubscribeClick}
              disabled={loadingCheckout || authLoading}
              startIcon={loadingCheckout ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {loadingCheckout ? 'Processing...' : 'Subscribe Now'}
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Pricing; 