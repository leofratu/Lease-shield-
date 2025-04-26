import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Container, Paper } from '@mui/material';

const TrialPage = () => {
  const navigate = useNavigate();

  const handleProceedToPayment = () => {
    navigate('/pricing'); // Navigate to the pricing/payment page
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome to Your Trial!
        </Typography>
        <Typography variant="body1" sx={{ mb: 4 }}>
          Explore the basic features. Ready to unlock the full potential?
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          size="large"
          onClick={handleProceedToPayment}
        >
          Proceed to Payment Options
        </Button>
      </Paper>
    </Container>
  );
};

export default TrialPage; 