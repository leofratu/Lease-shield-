import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ArrowBack } from '@mui/icons-material';

const LeaseManager = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Lease Manager
        </Typography>
        
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/')}
        >
          Back to Dashboard
        </Button>
      </Box>
      
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          This feature has been moved
        </Typography>
        <Typography variant="body1" paragraph>
          Lease management functionality has been integrated into the Lease Analyzer.
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => navigate('/analysis')}
          sx={{ mt: 2 }}
        >
          Go to Lease Analyzer
        </Button>
      </Paper>
    </Box>
  );
};

export default LeaseManager; 