import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Typography, 
  Box, 
  Button, 
  Paper, 
  Grid, 
  CircularProgress,
  Chip,
  Card,
  CardContent,
  CardActions,
  Container,
  Divider,
  Fade,
  Zoom,
  Slide,
  Alert,
  Tooltip,
  Skeleton,
  IconButton,
  Stack,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { 
  Add, 
  Description, 
  Analytics,
  Calculate,
  Warning,
  Info as InfoIcon,
  Delete as DeleteIcon,
  AccountCircle as AccountIcon,
  HelpOutline as HelpIcon,
  Check as CheckIcon,
  Star as StarIcon,
  Upgrade as UpgradeIcon
} from '@mui/icons-material';
import { collection, query, where, orderBy, getDocs, Timestamp, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { useAuthState } from '../hooks/useAuthState';
import { useUserProfile } from '../context/UserProfileContext';
import { format, formatDistanceToNow } from 'date-fns';
import { getScoreColor, getStatusColor, getStatusChip, getScoreSeverityChip } from '../utils/displayUtils';

const Dashboard = ({ showSnackbar }) => {
  const navigate = useNavigate();
  const { user } = useAuthState();
  const { profile, loadingProfile } = useUserProfile();
  const [leases, setLeases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTip, setShowTip] = useState(true);

  const [stats, setStats] = useState({
    totalAnalyses: 0,
    lastAnalysisDate: null,
  });

  useEffect(() => {
    const fetchLeasesAndCalcStats = async () => {
      if (!user) {
        setLoading(false);
        setLeases([]);
        setStats({ totalAnalyses: 0, lastAnalysisDate: null });
        return;
      }
      
      setLoading(true);
      setError(null);
      try {
        const leasesRef = collection(db, 'leases');
        const q = query(
          leasesRef,
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const leaseList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setLeases(leaseList);

        const totalAnalyses = leaseList.length;
        let lastAnalysisDate = null;
        if (leaseList.length > 0 && leaseList[0].createdAt) {
            const mostRecentLease = leaseList.reduce((latest, current) => {
                const latestTime = latest.createdAt instanceof Timestamp ? latest.createdAt.toMillis() : (latest.createdAt ? new Date(latest.createdAt).getTime() : 0);
                const currentTime = current.createdAt instanceof Timestamp ? current.createdAt.toMillis() : (current.createdAt ? new Date(current.createdAt).getTime() : 0);
                return currentTime > latestTime ? current : latest;
            });
            if (mostRecentLease.createdAt instanceof Timestamp) {
                lastAnalysisDate = mostRecentLease.createdAt.toDate();
            } else if (mostRecentLease.createdAt) {
                lastAnalysisDate = new Date(mostRecentLease.createdAt);
            }
        }
        setStats({ totalAnalyses, lastAnalysisDate });

      } catch (err) {
        console.error('Error fetching leases:', err);
        setError('Failed to load your lease analyses. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchLeasesAndCalcStats();

  }, [user]);
  
  const getStatusChip = (status) => {
    let color = 'default';
    let label = status || 'Unknown';
    
    switch (status?.toLowerCase()) {
      case 'pending':
      case 'processing':
        color = 'info';
        label = 'Analyzing...';
        break;
      case 'complete':
        color = 'success';
        label = 'Complete';
        break;
      case 'error':
        color = 'error';
        label = 'Analysis Failed';
        break;
      default:
        color = 'default';
        label = 'Unknown Status';
    }
    
    return <Chip label={label} color={color} size="small" />;
  };

  const handleDeleteLease = async (leaseId) => {
     if (!user || !leaseId) return;
     if (!window.confirm('Are you sure you want to delete this analysis? This cannot be undone.')) {
        return;
     }

     try {
        const leaseToDeleteRef = doc(db, 'leases', leaseId);
        
        await deleteDoc(leaseToDeleteRef); 

        setLeases(prevLeases => {
            const updatedLeases = prevLeases.filter(lease => lease.id !== leaseId);
            const totalAnalyses = updatedLeases.length;
            let lastAnalysisDate = null;
             if (updatedLeases.length > 0 && updatedLeases[0].createdAt) {
                 if (updatedLeases[0].createdAt instanceof Timestamp) {
                     lastAnalysisDate = updatedLeases[0].createdAt.toDate();
                 } else if (updatedLeases[0].createdAt) {
                     lastAnalysisDate = new Date(updatedLeases[0].createdAt);
                 }
            }
            setStats({ totalAnalyses, lastAnalysisDate });
            return updatedLeases;
        });
        
        if (showSnackbar) showSnackbar('Analysis deleted successfully', 'success');

     } catch (err) {
        console.error("Error deleting lease:", err);
        if (showSnackbar) showSnackbar(err.message || 'Error deleting analysis', 'error');
     }
  };

  const formatLastAnalysisDate = (date) => {
     if (!date) return 'N/A';
     try {
         const now = new Date();
         if (now.getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000) {
            return formatDistanceToNow(date, { addSuffix: true });
         } else {
            return format(date, 'PP');
         }
     } catch (e) {
         console.error("Error formatting last analysis date:", e);
         return 'Invalid Date';
     }
  };

  if (loading || loadingProfile) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={0} sx={{ p: { xs: 2, md: 4 }, mb: 4, bgcolor: 'grey.100', borderRadius: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <Skeleton variant="text" width="60%" height={40} />
              <Skeleton variant="text" width="80%" height={20} />
            </Grid>
            <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
              <Skeleton variant="rectangular" width={180} height={50} sx={{ borderRadius: '8px' }} />
            </Grid>
          </Grid>
        </Paper>
        <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={4}>
               <Skeleton variant="rounded" height={80} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
               <Skeleton variant="rounded" height={80} />
            </Grid>
        </Grid>
        <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
           My Lease Analyses
         </Typography>
        <Grid container spacing={3}>
          {[...Array(3)].map((_, index) => (
            <Grid item xs={12} md={6} lg={4} key={index}>
              <Card variant="outlined" sx={{ borderLeft: `4px solid grey.300` }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                    <Skeleton variant="text" width="70%" height={30} />
                    <Skeleton variant="circular" width={24} height={24} />
                  </Box>
                  <Skeleton variant="text" width="50%" height={20} />
                </CardContent>
                <Divider />
                <CardActions sx={{ justifyContent: 'flex-end' }}>
                  <Skeleton variant="rectangular" width={120} height={30} sx={{ borderRadius: '4px' }}/>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }
  
  if (profile && profile.subscriptionTier === 'free') {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
          <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
             <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700, mb: 2 }}>
               Upgrade to Pro
             </Typography>
             <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                You are currently on the Free Trial. Upgrade to Pro to unlock unlimited analyses and all features.
             </Typography>
             
             <Paper 
                 elevation={0} 
                 variant="outlined"
                 sx={{ 
                    p: 3, 
                    borderRadius: 3, 
                    border: '1px solid',
                    borderColor: 'primary.main',
                    maxWidth: 400,
                    mx: 'auto',
                    mb: 4
                 }}
              >
                 <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
                    Pro Monthly
                 </Typography>
                 <Typography variant="h4" gutterBottom>
                    $5 <Typography component="span" variant="body1" color="text.secondary">/ month</Typography>
                 </Typography>
                 <List dense sx={{ mb: 3, textAlign: 'left' }}>
                    <ListItem disableGutters>
                       <ListItemIcon sx={{ minWidth: 30 }}><CheckIcon color="success" fontSize="small" /></ListItemIcon>
                       <ListItemText primary="Unlimited Lease Analysis Scans" />
                    </ListItem>
                    <ListItem disableGutters>
                       <ListItemIcon sx={{ minWidth: 30 }}><CheckIcon color="success" fontSize="small" /></ListItemIcon>
                       <ListItemText primary="Detailed Clause Summaries" />
                    </ListItem>
                    <ListItem disableGutters>
                       <ListItemIcon sx={{ minWidth: 30 }}><CheckIcon color="success" fontSize="small" /></ListItemIcon>
                       <ListItemText primary="Risk Level Scoring" />
                    </ListItem>
                 </List>
                 <Button 
                    variant="contained" 
                    size="large"
                    startIcon={<UpgradeIcon />}
                    onClick={() => navigate('/pricing')}
                    fullWidth
                 >
                    View Full Pricing & Subscribe
                 </Button>
             </Paper>

             <Button 
                variant="text"
                onClick={() => navigate('/analysis')}
             >
                Continue with Free Trial ({Math.max(0, 3 - (profile.freeScansUsed || 0))} scans left)
             </Button>
             
          </Paper>
      </Container>
    );
  }

  if (!profile || profile.subscriptionTier === 'paid') {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: { xs: 2, md: 3 },
            mb: 4, 
            bgcolor: 'primary.lighter',
            borderRadius: 2,
            border: '1px solid', 
            borderColor: 'divider'
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm>
              <Typography variant="h4" component="h1" gutterBottom>
                Welcome, {user?.email || 'User'}! 
              </Typography>
              {showTip && (
                <Slide direction="down" in={showTip} mountOnEnter unmountOnExit>
                   <Alert severity="info" onClose={() => setShowTip(false)} sx={{ mb: 2 }}>
                     Tip: Click 'Analyze New Lease' to upload or paste text for analysis.
                   </Alert>
                </Slide>
              )}
            </Grid>
            <Grid item xs={12} sm="auto" sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
              <Button 
                variant="contained" 
                size="large"
                startIcon={<Add />}
                onClick={() => navigate('/analysis')}
                sx={{ borderRadius: 8 }}
              >
                Analyze New Lease
              </Button>
            </Grid>
          </Grid>
        </Paper>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={4}>
              <Card variant="outlined">
                  <CardContent>
                      <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                         Total Analyses
                      </Typography>
                      <Typography variant="h5" component="div">
                         {stats.totalAnalyses}
                      </Typography>
                  </CardContent>
              </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
               <Card variant="outlined">
                  <CardContent>
                      <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                         Last Analysis
                      </Typography>
                      <Typography variant="h5" component="div">
                         {formatLastAnalysisDate(stats.lastAnalysisDate)}
                      </Typography>
                  </CardContent>
              </Card>
          </Grid>
          
        </Grid>

        <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
          My Lease Analyses
        </Typography>
        
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {leases.length === 0 && !error && (
           <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>No analyses yet!</Typography>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                Click "Analyze New Lease" to get started.
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<Add />}
                onClick={() => navigate('/analysis')}
              >
                Analyze New Lease
              </Button>
           </Paper>
        )}
        
        {leases.length > 0 && (
          <Grid container spacing={3}>
            {leases.map((lease) => (
              <Fade in timeout={500} key={lease.id}>
                <Grid item xs={12} md={6} lg={4}>
                  <Card 
                    variant="outlined"
                    sx={{
                      borderLeft: `4px solid ${lease.status === 'complete' ? getScoreColor(lease.analysis?.score) : 'grey.300'}`
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                         <Tooltip title={lease.fileName || 'No Filename'} placement="top-start">
                           <Typography 
                              variant="h6" 
                              noWrap
                              sx={{ fontWeight: 500, maxWidth: '80%' }}
                           >
                             {lease.fileName || 'Untitled Analysis'}
                           </Typography>
                         </Tooltip>
                          {lease.status === 'complete' && lease.analysis?.score !== undefined && (
                              <Tooltip title={`Risk Score: ${lease.analysis.score}/100`}>
                                 {getScoreSeverityChip(lease.analysis.score)}
                              </Tooltip>
                          )}
                          {lease.status === 'error' && (
                              <Tooltip title="Analysis encountered an error">
                                  <Chip icon={<Warning />} label="Error" color="error" size="small" />
                              </Tooltip>
                          )}
                           {lease.status === 'pending' && (
                              <Tooltip title="Analysis in progress...">
                                   <Chip icon={<CircularProgress size={14}/>} label="Processing" color="info" size="small" />
                              </Tooltip>
                          )}
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          {lease.createdAt instanceof Timestamp ? formatDistanceToNow(lease.createdAt.toDate(), { addSuffix: true }) : (lease.createdAt ? formatDistanceToNow(new Date(lease.createdAt), { addSuffix: true }) : 'Unknown date')}
                        </Typography>
                         {getStatusChip(lease.status)}
                      </Box>
                    </CardContent>
                    <Divider />
                    <CardActions sx={{ justifyContent: 'space-between' }}>
                       <Tooltip title="Delete Analysis">
                         <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDeleteLease(lease.id)} 
                         >
                            <DeleteIcon fontSize="small" />
                         </IconButton>
                       </Tooltip>
                      <Button 
                        size="small" 
                        variant="contained"
                        onClick={() => navigate(`/analysis/${lease.id}`)}
                        disabled={lease.status !== 'complete'}
                      >
                        View Analysis
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              </Fade>
            ))}
          </Grid>
        )}
      </Container>
    );
  }

  return <Typography>Loading dashboard...</Typography>; 
};

export default Dashboard; 