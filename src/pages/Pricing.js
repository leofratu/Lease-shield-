import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, Grid, Container, CircularProgress, Chip, List, ListItem, ListItemIcon, ListItemText, Card, CardContent, CardActions } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import StarIcon from '@mui/icons-material/Star';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthState } from '../hooks/useAuthState';
import { Helmet } from 'react-helmet-async';
import { initiateCheckout } from '../utils/paymentUtils';

// Define Plan Details (centralized)
const pricingPlans = [
  {
    id: 'free',
    title: 'Free',
    price: '$0',
    priceDetail: '/ forever',
    description: 'Get started and analyze your first few leases.',
    features: [
      '3 Lease Analyses Total',
      'Basic Clause Identification',
      'Risk Score',
      'Email Support'
    ],
    buttonText: (user) => user ? 'Go to Dashboard' : 'Get Started Free',
    buttonVariant: 'outlined',
    isPopular: false,
  },
  {
    id: 'commercial',
    title: 'Commercial',
    price: '$5',
    priceDetail: '/ month',
    originalPrice: '$10', // Optional original price for display
    description: 'Ideal for frequent users needing more analyses.',
    features: [
      '50 Lease Analyses per Month',
      '3 Lease Analyses per Day',
      'Detailed Clause Summaries',
      'Priority Email Support'
    ],
    buttonText: () => 'Subscribe Commercial',
    buttonVariant: 'contained',
    isPopular: true, // Mark as popular
  },
  {
    id: 'pro',
    title: 'Pro',
    price: '$10',
    priceDetail: '/ month',
    originalPrice: '$20',
    description: 'Unlimited access for professionals and power users.',
    features: [
      'Unlimited Lease Analyses',
      'All Commercial Features',
      'Dedicated Support Channel (Soon)',
      'Early Access to New Features (Soon)'
    ],
    buttonText: () => 'Subscribe Pro',
    buttonVariant: 'outlined',
    isPopular: false,
  },
];

const Pricing = ({ showSnackbar }) => {
  const navigate = useNavigate();
  const location = useLocation(); // For reading query params
  const { user, loading: authLoading } = useAuthState();
  const [loadingPlanId, setLoadingPlanId] = useState(null); // Track loading state per plan
  const [highlightPlanId, setHighlightPlanId] = useState('');

  // Check for plan query parameter on mount
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const plan = queryParams.get('plan');
    if (plan && pricingPlans.some(p => p.id === plan)) {
      setHighlightPlanId(plan);
    }
  }, [location.search]);

  const handleSubscribeClick = async (planId) => {
    if (!user) {
      if (showSnackbar) showSnackbar('Please log in or register to subscribe', 'info');
      // Store intended plan in session storage before redirecting?
      sessionStorage.setItem('intendedPlan', planId);
      navigate('/login?redirect=/pricing'); // Redirect to login, then back to pricing
      return;
    }
    
    setLoadingPlanId(planId);
    try {
      const token = await user.getIdToken();
      // Pass the selected planId to initiateCheckout
      const checkoutUrl = await initiateCheckout(token, planId); 
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error(`Checkout initiation failed for ${planId}:`, error);
      if (showSnackbar) showSnackbar(error.message || 'Could not start subscription process. Please try again.', 'error');
      setLoadingPlanId(null);
    }
  };

  const handleFreeTierClick = () => {
     if (user) {
        navigate('/dashboard'); 
     } else {
        navigate('/register'); 
     }
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <Helmet>
        <title>Pricing Plans | Lease Shield AI Lease Analyzer</title>
        <meta 
          name="description" 
          content="Choose the right Lease Shield AI plan. Start Free, upgrade to Commercial for more scans, or Pro for unlimited analysis and advanced features." 
        />
      </Helmet>

      <Typography variant="h2" component="h1" gutterBottom sx={{ textAlign: 'center', mb: 2 }}>
        Choose Your Plan
      </Typography>
       <Typography variant="h6" color="text.secondary" gutterBottom sx={{ textAlign: 'center', mb: 6 }}>
         Select the plan that best fits your lease analysis needs.
       </Typography>
      
      <Grid container spacing={4} justifyContent="center" alignItems="stretch"> 
        {pricingPlans.map((plan) => (
          <Grid item key={plan.id} xs={12} md={6} lg={4}> {/* Adjust grid sizing */} 
            <Card 
               elevation={plan.isPopular || highlightPlanId === plan.id ? 6 : 2} // More elevation for popular/highlighted
               sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  borderRadius: 3, 
                  position: 'relative',
                  border: plan.isPopular || highlightPlanId === plan.id ? '2px solid' : '1px solid',
                  borderColor: plan.isPopular || highlightPlanId === plan.id ? 'primary.main' : 'divider',
                  transition: 'box-shadow 0.3s, border-color 0.3s', // Add transitions
                   '&:hover': {
                      boxShadow: 8,
                  }
               }}
            >
               {plan.isPopular && (
                 <Chip 
                    label="Most Popular" 
                    color="primary" 
                    size="small" 
                    icon={<StarIcon />} 
                    sx={{ position: 'absolute', top: 16, right: 16, zIndex: 1 }}
                 />
               )}
              <CardContent sx={{ flexGrow: 1, p: 3 }}> {/* Consistent padding */} 
                <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
                  {plan.title}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 2 }}>
                  <Typography variant="h4" component="p" sx={{ mr: 0.5 }}>
                    {plan.price}
                  </Typography>
                  <Typography component="span" variant="body1" color="text.secondary">
                    {plan.priceDetail}
                  </Typography>
                   {plan.originalPrice && (
                        <Typography variant="body2" color="text.disabled" sx={{ textDecoration: 'line-through', ml: 1 }}>
                            {plan.originalPrice}
                        </Typography>
                    )}
                 </Box>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3, minHeight: '4em' /* Ensure description area has consistent height */ }}>
                  {plan.description}
                </Typography>
                <List dense sx={{ mb: 3 }}>
                  {plan.features.map((feature) => (
                     <ListItem key={feature} disableGutters>
                       <ListItemIcon sx={{ minWidth: 30, color: 'success.main' }}>
                           <CheckIcon fontSize="small" />
                       </ListItemIcon>
                       <ListItemText primary={feature} />
                     </ListItem>
                  ))}
                </List>
              </CardContent>
              <CardActions sx={{ p: 3, pt: 0 }}> { /* Consistent padding */}
                <Button 
                  variant={plan.buttonVariant} 
                  fullWidth 
                  size="large"
                  onClick={() => plan.id === 'free' ? handleFreeTierClick() : handleSubscribeClick(plan.id)}
                  disabled={loadingPlanId === plan.id || authLoading} // Disable specific button when loading
                  startIcon={loadingPlanId === plan.id ? <CircularProgress size={20} color="inherit" /> : null}
                  sx={{ borderRadius: 2 }} // Consistent button radius
                >
                  {loadingPlanId === plan.id ? 'Processing...' : plan.buttonText(user)}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default Pricing; 