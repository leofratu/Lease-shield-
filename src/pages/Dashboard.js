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
  Stack
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
  HelpOutline as HelpIcon
} from '@mui/icons-material';
import { collection, query, where, orderBy, getDocs, Timestamp, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { useAuthState } from '../hooks/useAuthState';
import { format, formatDistanceToNow } from 'date-fns';
import { getScoreColor, getStatusColor, getStatusChip, getScoreSeverityChip } from '../utils/displayUtils';

const Dashboard = ({ showSnackbar }) => {
  const navigate = useNavigate();
  const { user } = useAuthState();
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

  if (loading) {
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
            <Typography variant="body1" color="text.secondary">
              Manage your lease analyses and get started quickly.
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm="auto"> 
             <Stack direction="row" spacing={1} alignItems="center" justifyContent={{ xs: 'flex-start', sm: 'flex-end' }}>
               <Tooltip title="Account Settings">
                 <IconButton size="small" onClick={() => navigate('/profile')}>
                   <AccountIcon />
                 </IconButton>
               </Tooltip>
               <Tooltip title="Help & Support">
                 <IconButton size="small" onClick={() => alert('Help/Support Link Placeholder')}>
                   <HelpIcon />
                 </IconButton>
               </Tooltip>
               <Button 
                variant="contained" 
                color="primary" 
                startIcon={<Analytics />}
                onClick={() => navigate('/analysis')} 
                sx={{ fontWeight: 'bold' }}
              >
                Analyze New Lease
              </Button>
             </Stack>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
           <Card elevation={0} variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
             <Typography variant="overline" color="text.secondary">Total Analyses</Typography>
             <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{stats.totalAnalyses}</Typography>
           </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
           <Card elevation={0} variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="overline" color="text.secondary">Last Analysis</Typography>
              <Typography variant="h6" sx={{ fontWeight: 'medium' }}>{formatLastAnalysisDate(stats.lastAnalysisDate)}</Typography>
           </Card>
        </Grid>
      </Grid>
      
      {showTip && (
         <Fade in={showTip}>
           <Alert 
             severity="info" 
             icon={<InfoIcon />} 
             onClose={() => setShowTip(false)} 
             sx={{ mb: 4 }}
           >
             **Tip:** Regularly review the "Potential Issues" in your analysis before discussing renewals with your landlord!
           </Alert>
         </Fade>
       )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
        Recent Lease Analyses
      </Typography>
      
      {leases.length === 0 && !error ? (
        <Paper 
          variant="outlined"
          sx={{ 
            p: { xs: 3, sm: 5 }, 
            textAlign: 'center', 
            borderRadius: 2,
            borderColor: 'divider',
            borderStyle: 'dashed',
            bgcolor: 'action.hover'
          }}
        >
          <Description sx={{ fontSize: 50, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No analyses found yet.
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 3 }}>
            Your analyzed leases will appear here.
          </Typography>
           <Button 
              variant="contained" 
              startIcon={<Analytics />}
              onClick={() => navigate('/analysis')} 
            >
              Analyze Your First Lease
            </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
           {leases.slice(0, 3).map((lease, index) => {
            const score = lease.analysis?.score;
            const isComplete = lease.status === 'complete';
            const scoreColor = getScoreColor(score);
            const statusColor = getStatusColor(lease.status);
            const cardBorderColor = isComplete && score !== undefined ? scoreColor : statusColor; 
            let formattedDate = 'Date unknown';
            try {
              if (lease.createdAt instanceof Timestamp) {
                formattedDate = format(lease.createdAt.toDate(), 'PP'); 
              } else if (lease.createdAt) {
                 formattedDate = format(new Date(lease.createdAt), 'PP'); 
              }
            } catch (e) { console.error("Error formatting date:", e); }

            return (
              <Grid item xs={12} md={6} lg={4} key={lease.id}>
                <Fade in={true} style={{ transitionDelay: `${50 * index}ms` }}>
                  <Card
                    elevation={0}
                    variant="outlined"
                    sx={{ 
                         height: '100%',
                         display: 'flex',
                         flexDirection: 'column',
                         transition: 'border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                         borderColor: 'divider',
                         borderRadius: 2,
                         '&:hover': { 
                            boxShadow: 3, 
                            borderColor: cardBorderColor
                         },
                         borderLeft: `4px solid ${cardBorderColor}`,
                    }}
                  >
                     <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                        <Typography variant="h6" component="div" sx={{ fontWeight: 'medium', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', pr: 1 }}>
                          {lease.fileName || 'Unnamed Analysis'}
                        </Typography>
                        {isComplete && score !== undefined ? (
                          <Tooltip title={`Score: ${score}/100`} arrow>
                            {getScoreSeverityChip(score)} 
                          </Tooltip>
                        ) : (
                          getStatusChip(lease.status)
                        )}
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                         Analyzed on: {formattedDate}
                      </Typography>
                       {isComplete && score !== undefined && (
                         <Typography variant="caption" display="block" sx={{ mt: 0.5, color: scoreColor, fontWeight: 'medium' }}>
                           Score: {score}
                         </Typography>
                       )}
                    </CardContent>
                    <Divider />
                    <CardActions sx={{ justifyContent: 'space-between', pl: 2, pr: 1 }}>
                       <IconButton 
                         aria-label="delete analysis"
                         size="small"
                         onClick={() => handleDeleteLease(lease.id)}
                         color="inherit"
                         sx={{ 
                            opacity: 0.5,
                            color: 'text.secondary',
                           '&:hover': { opacity: 1, color: 'error.main', backgroundColor: 'rgba(255, 0, 0, 0.08)' }
                         }}
                       >
                         <DeleteIcon fontSize="small" />
                       </IconButton>
                      <Button 
                        size="small" 
                        onClick={() => navigate(`/analysis/${lease.id}`)}
                      >
                        {lease.status === 'error' ? 'View Error' : 'View Details'}
                      </Button>
                    </CardActions>
                  </Card>
                </Fade>
              </Grid>
            );
          })}
        </Grid>
      )}
      {leases.length > 3 && (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
             <Button variant="outlined" onClick={() => alert('Implement view all page/functionality')}>
                View All Analyses ({leases.length})
             </Button>
          </Box>
       )}
    </Container>
  );
};

export default Dashboard; 