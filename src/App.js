import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useAuthState } from './hooks/useAuthState';
import { useUserProfile } from './context/UserProfileContext';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import LeaseAnalysis from './pages/LeaseAnalysis';
import NotFound from './pages/NotFound';
import Layout from './components/Layout';
import LeaseCalculator from './pages/LeaseCalculator';
import LeaseManager from './pages/LeaseManager';
import LandingPage from './pages/LandingPage';
import Profile from './pages/Profile';
import Pricing from './pages/Pricing';
import TrialPage from './pages/TrialPage';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

// Updated Protected route component
const ProtectedRoute = ({ children, requirePaid = false }) => {
  const { user, loading: authLoading } = useAuthState();
  const { profile, loadingProfile } = useUserProfile();

  if (authLoading || (requirePaid && loadingProfile)) {
    // Show loading indicator if auth is loading, OR
    // if paid is required and profile is still loading
    return <div>Loading...</div>;
  }

  if (!user) {
    // Not logged in, redirect to login
    return <Navigate to="/login" />;
  }

  if (requirePaid && (!profile || profile.subscriptionTier !== 'paid')) {
    // Logged in, but requires paid subscription and user doesn't have it
    console.log("Access denied: Paid subscription required.");
    // Redirect to pricing page or a specific "upgrade required" page
    return <Navigate to="/pricing" replace />;
  }

  // Logged in and meets subscription requirements (if any)
  return children;
};

// Component to handle conditional rendering/redirect for the /trial route
const TrialRouteHandler = () => {
  const { user, loading: authLoading } = useAuthState();
  const { profile, loadingProfile } = useUserProfile();

  if (authLoading || loadingProfile) {
    return <div>Loading...</div>; // Show loading while checking state
  }

  // If user is logged in OR has a paid plan, redirect away from /trial
  if (user || (profile && profile.subscriptionTier === 'paid')) { 
    console.log("Redirecting logged-in/paid user away from /trial page.");
    return <Navigate to="/dashboard" replace />; // Redirect to dashboard
  }
  
  // Otherwise (not logged in, no paid plan), show the TrialPage
  return (
    <Layout showAuthButtons={true}>
      <TrialPage />
    </Layout>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={
            <Layout showAuthButtons={true}>
              <LandingPage />
            </Layout>
          } />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/pricing" element={
             <Layout showAuthButtons={true}>
                <Pricing />
             </Layout>
          } />
          <Route path="/trial" element={<TrialRouteHandler />} />
          
          {/* Protected routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute requirePaid={true}>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/analysis" element={
            <ProtectedRoute requirePaid={true}>
              <Layout>
                <LeaseAnalysis />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/analysis/:leaseId" element={
            <ProtectedRoute>
              <Layout>
                <LeaseAnalysis />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/calculator" element={
            <ProtectedRoute requirePaid={true}>
              <Layout>
                <LeaseCalculator />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/manager" element={
            <ProtectedRoute requirePaid={true}>
              <Layout>
                <LeaseManager />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Layout>
                <Profile />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App; 