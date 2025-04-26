import React from 'react';
import { Box, Typography, Paper, Avatar, Button, CircularProgress, Alert, Divider } from '@mui/material';
import { useAuthState } from '../hooks/useAuthState';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import { useNavigate } from 'react-router-dom';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import StarIcon from '@mui/icons-material/Star';
import UpgradeIcon from '@mui/icons-material/Upgrade';
import { useUserProfile } from '../context/UserProfileContext';

const Profile = ({ showSnackbar }) => {
  const { user } = useAuthState();
  const { profile, loadingProfile } = useUserProfile() || { profile: null, loadingProfile: true };
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      if (showSnackbar) showSnackbar('Successfully logged out', 'info');
      navigate('/login');
    } catch (error) {
      console.error("Error signing out: ", error);
      if (showSnackbar) showSnackbar('Error logging out. Please try again.', 'error');
    }
  };

  if (!user) {
    return <Typography>Please log in to view your profile.</Typography>;
  }

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 } }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Avatar sx={{ width: 80, height: 80, margin: 'auto', mb: 2, bgcolor: 'primary.main' }}>
            {user?.email ? user.email[0].toUpperCase() : <PersonIcon fontSize="large" />}
          </Avatar>
          <Typography variant="h5" gutterBottom>
            My Account
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {user?.email}
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }}/>

        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>Subscription Status</Typography>
        
        {loadingProfile ? (
           <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}><CircularProgress /></Box>
        ) : profile ? (
          <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'action.hover' }}>
             {profile.subscriptionTier === 'paid' ? (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                   <StarIcon color="primary" sx={{ mr: 1 }} />
                   <Typography variant="body1" sx={{ fontWeight: 'bold' }}>Pro Monthly Subscriber</Typography>
                </Box>
             ) : profile.subscriptionTier === 'free' ? (
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>Free Trial</Typography>
                  <Typography variant="body2" color="text.secondary">
                     Free analyses remaining: {Math.max(0, 3 - (profile.freeScansUsed || 0))}
                  </Typography>
                   <Button 
                      variant="contained" 
                      size="small"
                      startIcon={<UpgradeIcon />} 
                      onClick={() => navigate('/pricing')}
                      sx={{ mt: 1.5 }}
                   >
                      Upgrade to Pro
                   </Button>
                </Box>
             ) : (
                <Typography variant="body1" color="text.secondary">
                  Could not determine subscription status.
                </Typography>
             )}
          </Paper>
        ) : (
          <Alert severity="error">Could not load profile information. Please try again later.</Alert>
        )}

         <Button 
          variant="contained" 
          color="secondary" 
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          fullWidth
          sx={{ mt: 1 }}
        >
          Logout
        </Button>
      </Paper>
    </Box>
  );
};

export default Profile; 