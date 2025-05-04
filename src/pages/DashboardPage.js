import React, { useState, useEffect } from 'react';
import { useAuthState } from '../hooks/useAuthState'; // Assuming useAuthState provides user object
import { db } from '../firebase/config';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button
} from '@mui/material';
import { 
    Dashboard as DashboardIcon,
    Description as DescriptionIcon, // Lease
    CameraAlt as CameraAltIcon, // Inspection
    ReceiptLong as ReceiptLongIcon, // Expense
    Calculate as CalculateIcon, // Calculator
    PersonSearch as PersonSearchIcon // Tenant Matcher
} from '@mui/icons-material';
import { Link } from 'react-router-dom';

const DashboardPage = () => {
  const { user } = useAuthState(); // Get user from your auth hook
  const [leases, setLeases] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false);
        // setError('Please log in to view the dashboard.'); // Optional: prompt login
        return; 
      }

      setLoading(true);
      setError('');

      try {
        // Fetch Leases
        const leasesQuery = query(
          collection(db, 'leases'), 
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc') // Sort by most recent
        );
        const leaseSnapshot = await getDocs(leasesQuery);
        const leaseData = leaseSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setLeases(leaseData);

        // Fetch Inspections
        const inspectionsQuery = query(
          collection(db, 'inspections'), 
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const inspectionSnapshot = await getDocs(inspectionsQuery);
        const inspectionData = inspectionSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setInspections(inspectionData);

        // Fetch Expenses
        const expensesQuery = query(
          collection(db, 'expenses'), 
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const expenseSnapshot = await getDocs(expensesQuery);
        const expenseData = expenseSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setExpenses(expenseData);

      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        // setError('Failed to load dashboard data. Please try again later.'); // Commented out as requested
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]); // Re-fetch if user changes

  // --- Render Helper Functions (Optional) ---
  const renderLeaseSummary = (lease) => (
    <ListItem key={lease.id} secondaryAction={<span>{lease.analysis?.score || 'N/A'}</span>}>
        <ListItemText 
            primary={lease.fileName || 'Lease Analysis'}
            secondary={`Analyzed: ${lease.createdAt?.toDate().toLocaleDateString() || 'Unknown'}`}
        />
    </ListItem>
  );

  const renderInspectionSummary = (inspection) => (
     <ListItem key={inspection.id} secondaryAction={<span>{inspection.repairEstimate?.totalEstimatedCost ? `$${inspection.repairEstimate.totalEstimatedCost.toFixed(2)}` : 'N/A'}</span>}>
        <ListItemText 
            primary={`Inspection (${inspection.results?.length || 0} photos)`}
            secondary={`Inspected: ${inspection.createdAt?.toDate().toLocaleDateString() || 'Unknown'}`}
        />
    </ListItem>
  );

  const renderExpenseSummary = (expense) => (
    <ListItem key={expense.id} secondaryAction={<span>{expense.extractedData?.amount ? `$${expense.extractedData.amount.toFixed(2)}` : 'N/A'}</span>}>
        <ListItemText 
            primary={expense.extractedData?.vendor || expense.fileName || 'Expense'}
            secondary={`Date: ${expense.extractedData?.date || expense.createdAt?.toDate().toLocaleDateString() || 'Unknown'}`}
        />
    </ListItem>
  );

  // --- Main Render --- 
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
     return (
        <Container maxWidth="md" sx={{ textAlign: 'center', mt: 5 }}>
             <Alert severity="info">Please log in to view your dashboard.</Alert>
         </Container>
     );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <DashboardIcon sx={{ mr: 1 }} /> Dashboard Overview
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Action Buttons */}
      <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <Button 
          variant="contained" 
          component={Link} 
          to="/analysis" 
          startIcon={<DescriptionIcon />}
        >
          Analyze New Lease
        </Button>
        <Button 
          variant="contained" 
          component={Link} 
          to="/photo-inspection" 
          startIcon={<CameraAltIcon />}
        >
          Start New Inspection
        </Button>
        <Button 
          variant="contained" 
          component={Link} 
          to="/expense-scanner" 
          startIcon={<ReceiptLongIcon />}
        >
          Scan New Expense
        </Button>
        <Button 
          variant="contained" 
          component={Link} 
          to="/calculator" 
          startIcon={<CalculateIcon />}
        >
          Lease Calculator
        </Button>
        <Button 
          variant="contained" 
          component={Link} 
          to="/tenant-matcher"
          startIcon={<PersonSearchIcon />}
        >
          Tenant Matcher
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Leases Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader 
                avatar={<DescriptionIcon />} 
                title="Recent Lease Analyses" 
            />
            <CardContent>
              {leases.length > 0 ? (
                <List dense>
                  {leases.slice(0, 5).map(renderLeaseSummary)} {/* Show latest 5 */}
                  {leases.length > 5 && <ListItem><ListItemText primary="...and more" /></ListItem>}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">No lease analyses found.</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Inspections Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader avatar={<CameraAltIcon />} title="Recent Inspections" />
            <CardContent>
              {inspections.length > 0 ? (
                 <List dense>
                    {inspections.slice(0, 5).map(renderInspectionSummary)}
                    {inspections.length > 5 && <ListItem><ListItemText primary="...and more" /></ListItem>}
                 </List>
              ) : (
                <Typography variant="body2" color="text.secondary">No inspections found.</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Expenses Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader avatar={<ReceiptLongIcon />} title="Recent Expenses" />
            <CardContent>
               {expenses.length > 0 ? (
                 <List dense>
                   {expenses.slice(0, 5).map(renderExpenseSummary)}
                   {expenses.length > 5 && <ListItem><ListItemText primary="...and more" /></ListItem>}
                 </List>
              ) : (
                <Typography variant="body2" color="text.secondary">No expenses found.</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Add more detailed sections or links here if needed */}

      </Grid>
    </Container>
  );
};

export default DashboardPage; 