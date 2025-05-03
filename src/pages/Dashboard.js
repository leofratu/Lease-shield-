import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
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
  Upgrade as UpgradeIcon,
  Article as ArticleIcon,
  HomeWork as HomeWorkIcon
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

  if (!profile) {
    console.warn("Dashboard: Profile not available after loading.");
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
        <Alert severity="warning">Could not load user profile data. Please try refreshing.</Alert>
      </Container>
    );
  }

  // Determine Greeting
  const currentHour = new Date().getHours();
  let greeting = "Welcome";
  if (currentHour < 12) {
    greeting = "Good morning";
  } else if (currentHour < 18) {
    greeting = "Good afternoon";
  } else {
    greeting = "Good evening";
  }
  const userName = profile?.name || user?.displayName || 'there';

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Welcome and Stats Section */}
        <Paper elevation={0} sx={{ p: { xs: 2, md: 4 }, mb: 4, bgcolor: 'primary.lighter', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={8}>
                    <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
                        {greeting}, {userName}!
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                        Manage your lease analyses, review scores, and explore helpful tools.
                    </Typography>
                </Grid>
                <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                    <Stack direction="row" spacing={2} justifyContent={{ xs: 'flex-start', md: 'flex-end' }} alignItems="center">
                      <Box>
                          <Typography variant="body2" color="text.secondary">Total Analyses</Typography>
                          <Typography variant="h5" component="p" sx={{ fontWeight: 'medium' }}>{stats.totalAnalyses}</Typography>
                      </Box>
                      <Divider orientation="vertical" flexItem />
                      <Box>
                          <Typography variant="body2" color="text.secondary">Last Analysis</Typography>
                          <Typography variant="h5" component="p" sx={{ fontWeight: 'medium' }}>{formatLastAnalysisDate(stats.lastAnalysisDate)}</Typography>
                      </Box>
                    </Stack>
                </Grid>
            </Grid>
        </Paper>

        {/* Quick Actions / Feature Highlight Grid */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
             {/* Lease Analysis Card */}
            <Grid item xs={12} sm={6} md={4}>
                <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-5px)' } }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                        <Description sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                        <Typography variant="h6" component="h2" gutterBottom>New Lease Analysis</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Upload a lease document (PDF/TXT) or paste text to get an AI-powered breakdown of clauses, risks, and key terms.
                        </Typography>
                    </CardContent>
                    <CardActions sx={{ justifyContent: 'flex-end' }}>
                        <Button 
                          variant="contained"
                          startIcon={<Add />}
                          onClick={() => navigate('/analysis')}
                          sx={{ m: 1 }}
                        >
                            Analyze Lease
                        </Button>
                    </CardActions>
                </Card>
            </Grid>

            {/* Add the NEW Real Estate Agent Feature Card HERE */}
            <Grid item xs={12} sm={6} md={4}>
                <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-5px)' } }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                        <HomeWorkIcon sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
                        <Typography variant="h6" component="h2" gutterBottom>Real Estate Agent Tool (Landlord)</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Upload property details or tenant preferences (files/text) to automatically identify matching criteria and streamline your tenant search.
                        </Typography>
                    </CardContent>
                    <CardActions sx={{ justifyContent: 'flex-end' }}>
                        <Button 
                          variant="contained"
                          color="secondary"
                          startIcon={<Analytics />}
                          onClick={() => navigate('/real-estate-agent')}
                          sx={{ m: 1 }}
                        >
                            Analyze Preferences
                        </Button>
                    </CardActions>
                </Card>
            </Grid>

            {/* Lease Calculator Card */}
            <Grid item xs={12} sm={6} md={4}>
                <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-5px)' } }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                        <Calculate sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                        <Typography variant="h6" component="h2" gutterBottom>Lease Calculator</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Estimate potential costs, compare scenarios, and understand the financial implications of different lease terms.
                        </Typography>
                    </CardContent>
                    <CardActions sx={{ justifyContent: 'flex-end' }}>
                        <Button 
                          variant="contained"
                          color="success"
                          startIcon={<Calculate />}
                          onClick={() => navigate('/calculator')}
                          sx={{ m: 1, color: 'white' }}
                        >
                            Use Calculator
                        </Button>
                    </CardActions>
                </Card>
            </Grid>
        </Grid>

        {/* Recent Analyses Section */}
        <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 5, mb: 3 }}>
            Recent Analyses
        </Typography>

        {/* ... rest of the component for displaying leases ... */}
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

         {leases.length === 0 && !loading && (
          <Paper elevation={1} sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50' }}>
            <InfoIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
            <Typography variant="h6" gutterBottom>No analyses yet!</Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
                Start by analyzing your first lease document.
            </Typography>
            <Button 
                variant="contained"
                startIcon={<Add />}
                onClick={() => navigate('/analysis')}
            >
                Analyze First Lease
            </Button>
          </Paper>
        )}

        {leases.length > 0 && (
            <Grid container spacing={3}>
                {leases.map((lease) => (
                    <Grid item xs={12} sm={6} md={4} key={lease.id}>
                        <Fade in={true} timeout={500}>
                            <Card 
                                elevation={2} 
                                sx={{ 
                                    height: '100%', 
                                    display: 'flex', 
                                    flexDirection: 'column',
                                    cursor: 'pointer',
                                    transition: 'box-shadow 0.2s',
                                    '&:hover': {
                                        boxShadow: 6, // Increase shadow on hover
                                    }
                                }}
                                onClick={() => navigate(`/analysis/${lease.id}`)}
                            >
                                <CardContent sx={{ flexGrow: 1 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                        <Typography variant="h6" component="h3" noWrap sx={{ maxWidth: '80%' }}>
                                            {lease.fileName || lease.title || 'Untitled Analysis'}
                                        </Typography>
                                        {getStatusChip(lease.status)}
                                    </Box>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Analyzed: {lease.createdAt ? formatDistanceToNow(lease.createdAt.toDate(), { addSuffix: true }) : 'N/A'}
                                    </Typography>
                                    {lease.analysis?.score !== undefined && (
                                        <Tooltip title={`Overall Score: ${lease.analysis.score}/100`}>
                                            <Chip 
                                              icon={<StarIcon />} 
                                              label={`${lease.analysis.score}/100`} 
                                              size="small" 
                                              color={getScoreColor(lease.analysis.score)}
                                              variant="outlined"
                                              sx={{ mr: 1, mb: 1 }}
                                            />
                                        </Tooltip>
                                    )}
                                     {lease.analysis?.risks && lease.analysis.risks.length > 0 && (
                                        <Tooltip title={`${lease.analysis.risks.length} Potential Risks Identified`}>
                                           <Chip 
                                              icon={<Warning />} 
                                              label={`${lease.analysis.risks.length} Risks`} 
                                              size="small" 
                                              color="warning"
                                              variant="outlined"
                                              sx={{ mr: 1, mb: 1 }}
                                            />
                                        </Tooltip>
                                    )}
                                </CardContent>
                                <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
                                    <Tooltip title="Delete Analysis">
                                        <span> {/* Span needed for disabled button tooltip */}
                                            <IconButton 
                                                size="small" 
                                                color="error"
                                                onClick={(e) => {
                                                    e.stopPropagation(); // Prevent card click
                                                    handleDeleteLease(lease.id);
                                                }} 
                                                // disabled={deletingId === lease.id} // If adding delete loading state
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                    <Button 
                                        size="small" 
                                        onClick={(e) => {
                                            e.stopPropagation(); // Prevent card click
                                            navigate(`/analysis/${lease.id}`)
                                        }}
                                    >
                                        View Details
                                    </Button>
                                </CardActions>
                            </Card>
                        </Fade>
                    </Grid>
                ))}
            </Grid>
        )}
    </Container>
  );
};

export default Dashboard; 