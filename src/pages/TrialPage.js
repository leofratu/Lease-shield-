import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Container, Paper, Grid, Card, CardContent, CardActions, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

// Define Plan Details (could be moved to a config file later)
const plans = [
    {
        title: 'Free / Trial',
        description: 'Get started and analyze your first few leases.',
        features: [
            '3 Lease Analyses Total',
            'Basic Clause Identification',
            'Risk Score',
            'Email Support'
        ],
        actionText: 'Current Plan (Free)',
        actionDisabled: true,
    },
    {
        title: 'Commercial',
        price: '$5 / month',
        originalPrice: '$10',
        description: 'Ideal for frequent users needing more analyses.',
        features: [
            '50 Lease Analyses per Month',
            '3 Lease Analyses per Day',
            'Detailed Clause Summaries',
            'Priority Email Support'
        ],
        actionText: 'Upgrade to Commercial',
        planId: 'commercial', // Identifier for checkout
        actionVariant: 'contained',
    },
    {
        title: 'Pro',
        price: '$10 / month', 
        originalPrice: '$20',
        description: 'Unlimited access for professionals.',
        features: [
            'Unlimited Lease Analyses',
            'All Commercial Features',
            'Dedicated Support Channel (Soon)',
            'Early Access to New Features (Soon)'
        ],
        actionText: 'Upgrade to Pro',
        planId: 'pro', // Identifier for checkout
        actionVariant: 'outlined',
    }
];

const TrialPage = () => {
  const navigate = useNavigate();

  const handleUpgradeClick = (planId) => {
    // Navigate to pricing page, potentially passing the selected plan
    // The pricing page should handle the actual checkout logic
    console.log(`Navigating to pricing page, selected plan: ${planId}`);
    navigate(`/pricing?plan=${planId}`); 
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
         <Typography variant="h4" component="h1" align="center" gutterBottom sx={{ mb: 4 }}>
          Upgrade Your Experience
        </Typography>
        <Typography variant="body1" align="center" sx={{ mb: 6, maxWidth: '700px', mx: 'auto' }} color="text.secondary">
          You're currently on the Free plan. Choose a plan below to unlock more features and analyze more leases.
        </Typography>

        <Grid container spacing={4} justifyContent="center">
            {plans.map((plan) => (
                <Grid item key={plan.title} xs={12} sm={6} md={4}>
                    <Card 
                        sx={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            height: '100%', 
                            border: plan.actionVariant === 'contained' ? '2px solid' : '1px solid',
                            borderColor: plan.actionVariant === 'contained' ? 'primary.main' : 'divider',
                            borderRadius: 3,
                            transition: 'box-shadow 0.3s ease-in-out',
                            '&:hover': {
                                boxShadow: 6,
                            }
                        }}
                    >
                        <CardContent sx={{ flexGrow: 1 }}>
                            <Typography variant="h5" component="h2" gutterBottom align="center">
                                {plan.title}
                            </Typography>
                             {plan.price && (
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', mb: 2 }}>
                                    <Typography variant="h4" component="p">
                                        {plan.price.split(' ')[0]} 
                                    </Typography>
                                    <Typography variant="subtitle1" color="text.secondary">
                                        {plan.price.substring(plan.price.indexOf(' '))}
                                    </Typography>
                                    {plan.originalPrice && (
                                        <Typography variant="body2" color="text.disabled" sx={{ textDecoration: 'line-through', ml: 1 }}>
                                            {plan.originalPrice}
                                        </Typography>
                                    )}
                                </Box>
                            )}
                            <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
                                {plan.description}
                            </Typography>
                            <List dense>
                                {plan.features.map((feature) => (
                                    <ListItem key={feature} disableGutters>
                                        <ListItemIcon sx={{ minWidth: 'auto', mr: 1, color: 'success.main' }}>
                                            <CheckCircleOutlineIcon fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText primary={feature} />
                                    </ListItem>
                                ))}
                            </List>
                        </CardContent>
                        <CardActions sx={{ p: 2, pt: 0 }}>
                            <Button 
                                fullWidth 
                                variant={plan.actionVariant || 'text'} 
                                color="primary"
                                disabled={plan.actionDisabled}
                                onClick={() => plan.planId && handleUpgradeClick(plan.planId)}
                                sx={{ borderRadius: 2 }}
                            >
                                {plan.actionText}
                            </Button>
                        </CardActions>
                    </Card>
                </Grid>
            ))}
        </Grid>
    </Container>
  );
};

export default TrialPage; 