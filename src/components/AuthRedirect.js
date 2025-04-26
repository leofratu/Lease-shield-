import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthState } from '../hooks/useAuthState';
import Dashboard from '../pages/Dashboard';
import LandingPage from '../pages/LandingPage';
import Layout from './Layout'; // Import Layout to wrap the content

const AuthRedirect = () => {
  const { user, loading } = useAuthState();

  if (loading) {
    // You might want a more sophisticated loading indicator here
    return <div>Loading...</div>; 
  }

  // Render Dashboard within Layout if user is logged in
  if (user) {
    return (
      <Layout> 
        <Dashboard />
      </Layout>
    );
  }

  // Render LandingPage within Layout if user is not logged in
  return (
    <Layout showAuthButtons={true}> 
      <LandingPage />
    </Layout>
  );
};

export default AuthRedirect; 