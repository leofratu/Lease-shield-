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
  ListItemButton,
  Divider,
  useMediaQuery,
  useTheme,
  Link,
  Menu,
  MenuItem,
  Snackbar,
  Alert,
  CircularProgress,
  Link as MuiLink
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
  const { user, loading } = useAuthState();
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

  const handleLogout = async () => {
    try {
      await signOut(auth);
      showSnackbar('Successfully signed out', 'info');
      navigate('/login');
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
          <ListItem key={item.text} disablePadding>
            <ListItemButton 
              component={RouterLink} 
              to={item.path} 
              onClick={() => setDrawerOpen(false)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
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
          
          {/* Add Blog link here */}
          <Button 
            color="inherit" 
            component={RouterLink} 
            to="/blog"
            sx={{ 
              mx: 1, // Add some margin
              borderRadius: 2,
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' } 
            }}
          >
            Blog
          </Button>
          
          {loading ? (
            <CircularProgress color="inherit" size={24} />
          ) : user ? (
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
                  handleLogout();
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
              <MuiLink component={RouterLink} to="/blog" color="inherit" underline="hover">Blog</MuiLink>
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