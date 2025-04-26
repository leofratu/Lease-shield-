import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { 
  AppBar, 
  Box, 
  Toolbar, 
  Typography, 
  Button, 
  Container,
  IconButton,
  Avatar,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useMediaQuery,
  useTheme,
  Link,
  Menu,
  MenuItem,
  Snackbar,
  Alert
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  Dashboard, 
  Description, 
  Calculate, 
  FolderShared,
  ChevronRight
} from '@mui/icons-material';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import { useAuthState } from '../hooks/useAuthState';

const Layout = ({ children, showAuthButtons = false }) => {
  const navigate = useNavigate();
  const { user } = useAuthState();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  
  // --- Snackbar State --- 
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success'); // 'success' | 'error' | 'warning' | 'info'

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  // Function to show snackbar (will be passed down)
  const showSnackbar = (message, severity = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };
  // --- End Snackbar State ---

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      showSnackbar('Successfully signed out', 'info');
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      showSnackbar('Error signing out', 'error');
    }
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { text: 'Lease Analysis', icon: <Description />, path: '/analysis' },
    { text: 'Lease Calculator', icon: <Calculate />, path: '/calculator' },
  ];

  const drawer = (
    <Box sx={{ width: 250 }} role="presentation">
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" component="div">
          Lease Shield AI
        </Typography>
        <IconButton onClick={() => setDrawerOpen(false)}>
          <ChevronRight />
        </IconButton>
      </Box>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem 
            button 
            key={item.text} 
            onClick={() => {
              navigate(item.path);
              setDrawerOpen(false);
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </Box>
  );
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          {user && (
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="menu"
              sx={{ mr: 2 }}
              onClick={() => setDrawerOpen(true)}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ flexGrow: 1, cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            Lease Shield AI
          </Typography>
          
          {user ? (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton 
                onClick={handleProfileMenuOpen}
                sx={{ marginRight: 1 }}
              >
                <Avatar 
                  alt={user.displayName || user.email} 
                  src={user.photoURL || ''} 
                  sx={{ width: 32, height: 32 }}
                />
              </IconButton>
              
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                <MenuItem onClick={() => {
                  handleMenuClose();
                  navigate('/profile');
                }}>
                  Profile
                </MenuItem>
                <MenuItem onClick={() => {
                  handleMenuClose();
                  navigate('/dashboard');
                }}>
                  Dashboard
                </MenuItem>
                <MenuItem onClick={() => {
                  handleMenuClose();
                  handleSignOut();
                }}>
                  Sign Out
                </MenuItem>
              </Menu>
            </Box>
          ) : showAuthButtons && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                color="inherit" 
                component={RouterLink} 
                to="/login"
                sx={{ 
                  borderRadius: 2,
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' } 
                }}
              >
                Sign In
              </Button>
              <Button 
                variant="contained"
                color="secondary"
                component={RouterLink} 
                to="/register"
                sx={{ 
                  color: 'white',
                  borderRadius: 2
                }}
              >
                Get Started
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>
      
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        {drawer}
      </Drawer>
      
      <Container component="main" sx={{ flexGrow: 1, py: 4 }}>
        {/* Pass showSnackbar down to children */}
        {/* Use React.cloneElement to add props to children */}
        {React.Children.map(children, child => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, { showSnackbar: showSnackbar });
          }
          return child;
        })}
      </Container>
      
      <Box 
        component="footer" 
        sx={{ 
          py: 3, 
          bgcolor: 'background.paper', 
          borderTop: '1px solid', 
          borderColor: 'divider' 
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: { xs: 2, md: 0 } }}>
              © {new Date().getFullYear()} Lease Shield AI
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 3 }}>
              <Link href="#" color="inherit" underline="hover">Privacy</Link>
              <Link href="#" color="inherit" underline="hover">Terms</Link>
              <Link href="#" color="inherit" underline="hover">Contact</Link>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Snackbar Component */}
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={6000} 
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} // Position at bottom-center
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Layout; 