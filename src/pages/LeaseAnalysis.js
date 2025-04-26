import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  Typography, 
  Box, 
  Paper, 
  Grid, 
  CircularProgress,
  Chip,
  Card,
  CardContent,
  Divider,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  TextField,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Rating,
  Stack
} from '@mui/material';
import { 
  ExpandMore,
  Description,
  Warning,
  InfoOutlined,
  ArrowBack,
  CloudUpload,
  Send,
  SaveAlt,
  ThumbUp,
  ThumbDown,
  Check,
  ErrorOutline,
  Email,
  FileDownload,
  Replay as ReplayIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { doc, getDoc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase/config';

// Helper function for score bar color
const getScoreColor = (score) => {
  if (score < 40) return 'error';
  if (score < 70) return 'warning';
  return 'success';
};

const LeaseAnalysis = ({ showSnackbar }) => {
  const { leaseId } = useParams();
  const navigate = useNavigate();
  const [lease, setLease] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [file, setFile] = useState(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [score, setScore] = useState(0);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailDraft, setEmailDraft] = useState('');
  const [textContent, setTextContent] = useState('');
  
  // Use Snackbar
  const displayError = (message) => {
    setError(message); // Keep Alert for prominent errors
    if (showSnackbar) showSnackbar(message, 'error'); // Also show snackbar
  };

  const displaySuccess = (message) => {
    if (showSnackbar) showSnackbar(message, 'success');
  };

  const displayInfo = (message) => {
     if (showSnackbar) showSnackbar(message, 'info');
  };
  
  // Fetch lease data if leaseId is provided
  useEffect(() => {
    if (leaseId) {
      fetchLeaseData();
    }
  }, [leaseId]);
  
  const fetchLeaseData = async () => {
    try {
      setLoading(true);
      const leaseDoc = await getDoc(doc(db, 'leases', leaseId));
      
      if (leaseDoc.exists()) {
        const leaseData = {
          id: leaseDoc.id,
          ...leaseDoc.data()
        };
        setLease(leaseData);
        setAnalysisResult(leaseData.analysis || null);
        
        // Calculate score based on risks or direct score from analysis
        if (leaseData.analysis) {
          if (leaseData.analysis.score !== undefined) {
            setScore(leaseData.analysis.score);
          } else if (leaseData.analysis.risks) { // Fallback if score not present
            const riskCount = leaseData.analysis.risks.length;
            const calculatedScore = Math.max(0, 100 - (riskCount * 10)); 
            setScore(calculatedScore);
          }
        }
      } else {
        setError('Lease not found');
      }
    } catch (err) {
      console.error('Error fetching lease:', err);
      setError('Error loading lease data');
    } finally {
      setLoading(false);
    }
  };
  
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };
  
  const handleTextChange = (e) => {
    setTextContent(e.target.value);
  };
  
  const handleAnalyzeText = async () => {
    if (!textContent.trim()) {
      displayError('Please enter lease text to analyze');
      return;
    }
    
    try {
      setAnalyzing(true);
      setAnalysisProgress(10);
      setError(null);
      setAnalysisResult(null);
      setScore(0);
      displayInfo('Starting analysis...');
      
      // Simulate progress for analysis (optional, can be removed if backend is fast)
      const progressTimer = setInterval(() => {
        setAnalysisProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressTimer);
            return 90;
          }
          return prev + 10;
        });
      }, 500);
      
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8081';
      const token = await user.getIdToken();
      
      const response = await fetch(`${apiUrl}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: textContent })
      });
      
      clearInterval(progressTimer);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Analysis failed with status: ' + response.status }));
        // Check for specific upgrade required error
        if (response.status === 402 && errorData.upgradeRequired) { 
           setError(errorData.error); // Keep error state for potential Alert display
           // Optionally show snackbar, but main action is prompting upgrade
            if (showSnackbar) showSnackbar(errorData.error, 'warning');
           // Redirect or show modal prompting upgrade
           navigate('/pricing'); // Simple redirect for now
           // Alternative: setModalOpen(true); 
        } else {
          throw new Error(errorData.error || 'Failed to analyze lease text');
        }
        return; // Stop processing if upgrade needed or other error
      }
      
      const result = await response.json();
      
      if (!result.success || !result.analysis) {
         throw new Error(result.error || 'Analysis failed to return expected data.');
      }
      
      setAnalysisResult(result.analysis);
      
      // Calculate score based on returned analysis
      if (result.analysis.score !== undefined) {
        setScore(result.analysis.score);
      } else if (result.analysis.risks) { // Fallback if score not present
        const riskCount = result.analysis.risks.length;
        const calculatedScore = Math.max(0, 100 - (riskCount * 10));
        setScore(calculatedScore);
      }
      
      setAnalysisProgress(100);

      // Navigate or notify about save status
      if (result.leaseId) {
        displaySuccess('Analysis complete and saved!');
        navigate(`/analysis/${result.leaseId}`);
      } else {
         // Notify user that analysis is complete but wasn't saved to their dashboard
         console.warn("Analysis complete but no new lease ID returned from backend (save likely failed).");
         displayInfo('Analysis complete, but failed to save to your dashboard.');
         // Keep the user on the current page to view results without navigating
      }
      
    } catch (err) {
      console.error('Error analyzing text:', err);
      displayError('Failed to analyze lease text: ' + err.message);
      setAnalysisProgress(0); // Reset progress on error
    } finally {
      setAnalyzing(false);
    }
  };
  
  const handleUpload = async () => {
    if (!file) {
      displayError('Please select a file to upload');
      return;
    }
    
    if (file.type !== 'application/pdf' && file.type !== 'text/plain') {
      displayError('Please select a PDF or text file');
      return;
    }
    
    setAnalyzing(true);
    setAnalysisProgress(10);
    setError(null);
    setAnalysisResult(null);
    setScore(0);
    displayInfo('Starting file processing and analysis...');
    
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8081';
      const token = await user.getIdToken();
      
      const formData = new FormData();
      formData.append('leaseFile', file);
      
      // Simulate progress during analysis (optional)
      const progressTimer = setInterval(() => {
        setAnalysisProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressTimer);
            return 90;
          }
          return prev + 10;
        });
      }, 500);
      
      const response = await fetch(`${apiUrl}/api/analyze`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
      
      clearInterval(progressTimer);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Upload/Analysis failed with status: ' + response.status }));
        // Check for specific upgrade required error
        if (response.status === 402 && errorData.upgradeRequired) {
           setError(errorData.error);
           if (showSnackbar) showSnackbar(errorData.error, 'warning');
           navigate('/pricing');
        } else {
           throw new Error(errorData.error || 'Failed to upload and analyze file');
        }
        return; // Stop processing
      }
      
      const result = await response.json();
      
      if (!result.success || !result.analysis) {
         throw new Error(result.error || 'Analysis failed to return expected data.');
      }
      
      setAnalysisResult(result.analysis);
      
      // Calculate score based on returned analysis
      if (result.analysis.score !== undefined) {
        setScore(result.analysis.score);
      } else if (result.analysis.risks) { // Fallback if score not present
        const riskCount = result.analysis.risks.length;
        const calculatedScore = Math.max(0, 100 - (riskCount * 10));
        setScore(calculatedScore);
      }
      
      setAnalysisProgress(100);

      // Navigate or notify about save status
      if (result.leaseId) {
         displaySuccess('Analysis complete and saved!');
         navigate(`/analysis/${result.leaseId}`);
      } else {
          // Notify user that analysis is complete but wasn't saved to their dashboard
         console.warn("Analysis complete but no new lease ID returned from backend (save likely failed).");
         displayInfo('Analysis complete, but failed to save to your dashboard.');
          // Keep the user on the current page to view results without navigating
      }
      
    } catch (err) {
      console.error('Upload/Analysis error:', err);
      displayError('Failed to process file: ' + err.message);
      setAnalysisProgress(0); // Reset progress on error
    } finally {
      setAnalyzing(false);
    }
  };
  
  const generateEmailDraft = async () => {
    if (!analysisResult) return;
    
    try {
      // Create a draft email based on the analysis result
      const risks = analysisResult.risks || [];
      const extractedData = analysisResult.extracted_data || {};
      const landlordName = extractedData.Landlord_Name || 'Landlord';
      
      let draft = `Dear ${landlordName},\n\n`;
      draft += `I hope this email finds you well. I am writing regarding the lease agreement for ${extractedData.Property_Address || 'the property'}.\n\n`;
      
      if (risks.length > 0) {
        draft += `After reviewing the lease, I would like to discuss the following concerns:\n\n`;
        risks.forEach((risk, index) => {
          draft += `${index + 1}. ${risk}\n`;
        });
        draft += `\n`;
      }
      
      draft += `I would appreciate the opportunity to discuss these points before finalizing the agreement. `;
      draft += `Please let me know when you would be available for a conversation.\n\n`;
      draft += `Thank you for your consideration.\n\n`;
      draft += `Sincerely,\n[Your Name]`;
      
      setEmailDraft(draft);
      setEmailDialogOpen(true);
    } catch (error) {
      console.error('Error generating email draft:', error);
      setError('Failed to generate email draft: ' + error.message);
    }
  };
  
  const handleCopyEmail = () => {
    navigator.clipboard.writeText(emailDraft);
    displaySuccess('Email draft copied to clipboard!');
  };

  // --- Download JSON Handler --- 
  const handleDownloadJson = () => {
    if (!analysisResult) {
      displayError('No analysis result available to download.');
      return;
    }
    try {
      const jsonString = JSON.stringify(analysisResult, null, 2); // Pretty print JSON
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const fileName = lease?.fileName ? `analysis_${lease.fileName.split('.')[0]}.json` : 'lease_analysis.json';
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      displaySuccess('Analysis JSON downloaded.');
    } catch (err) {
      console.error('Error creating download:', err);
      displayError('Failed to create download file.');
    }
  };
  // --- End Download JSON Handler --- 

  // --- Reset Function --- 
  const handleAnalyzeAnother = () => {
    setAnalysisResult(null);
    setScore(0);
    setError(null);
    setFile(null);
    setTextContent('');
    setAnalysisProgress(0);
    // Clear the specific lease ID if we navigated here from dashboard
    if (leaseId) {
        navigate('/analysis', { replace: true }); // Navigate to base analysis route
    }
  };
  // --- End Reset Function --- 

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box>
      <Helmet>
        <title>{lease ? `Analysis: ${lease.fileName}` : 'Analyze Your Lease'} - Lease Shield AI</title>
        <meta name="description" content="Upload or paste your lease agreement text to analyze potential risks, understand key clauses, check for fairness, and get a tenant-friendliness score with Lease Shield AI." />
        <meta name="keywords" content="lease analysis, lease scanner, rental agreement review, tenant rights, landlord negotiation, lease risk assessment, lease agreement checker, apartment lease review, contract analysis" />
      </Helmet>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Lease Analyzer {lease ? `- ${lease.fileName}` : ''}
        </Typography>
        
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/')}
        >
          Back to Dashboard
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {!analysisResult && !analyzing && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Analyze Your Lease
          </Typography>
          
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            Paste Lease Text
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={10}
            variant="outlined"
            placeholder="Paste the full text of your lease agreement here..."
            value={textContent}
            onChange={handleTextChange}
            sx={{ mb: 2 }}
          />
          <Button
            variant="contained"
            onClick={handleAnalyzeText}
            disabled={analyzing || !textContent.trim()}
            startIcon={<Send />}
          >
            Analyze Text
          </Button>
          
          <Divider sx={{ my: 3 }}>
            <Chip label="OR" />
          </Divider>
          
          <Typography variant="h6" gutterBottom>
            Upload File (PDF or TXT)
          </Typography>
          <input
            type="file"
            accept=".pdf,.txt"
            id="lease-file-input"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <label htmlFor="lease-file-input">
            <Button variant="contained" component="span" startIcon={<CloudUpload />}>
              Choose File
            </Button>
          </label>
          {file && <Typography sx={{ ml: 2, display: 'inline' }}>{file.name}</Typography>}
          
          {file && (
            <Button
              variant="contained"
              color="primary"
              sx={{ ml: 2 }}
              onClick={handleUpload}
              disabled={analyzing}
              startIcon={<Send />}
            >
              Upload & Analyze
            </Button>
          )}
        </Paper>
      )}
      
      {analyzing && (
        <Paper sx={{ p: 3, mb: 3, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>Analyzing Document...</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
            <CircularProgress size={50} sx={{ mb: 2 }} />
            <LinearProgress variant="determinate" value={analysisProgress} sx={{ width: '80%', height: 10, borderRadius: 5 }} />
            <Typography variant="body1" sx={{ mt: 1 }}>{`${Math.round(analysisProgress)}%`}</Typography>
          </Box>
        </Paper>
      )}
      
      {analysisResult && !analyzing && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5 }}
        >
          <Paper sx={{ p: 3, mb: 4 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={8}>
                <Typography variant="h5" gutterBottom>
                  Lease Friendliness Score
                </Typography>
                <Box sx={{ width: '100%', mb: 1 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={score} 
                    color={getScoreColor(score)}
                    sx={{ height: 20, borderRadius: 5 }} 
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">0 (High Risk)</Typography>
                  <Typography variant="h5" component="div" fontWeight="bold" color={`${getScoreColor(score)}.main`}>
                    {score}/100
                  </Typography>
                  <Typography variant="body2" color="text.secondary">100 (Good)</Typography>
                </Box>
                <Typography variant="body1" fontWeight="bold" sx={{ mt: 1 }}>
                  {score < 40 ? 'High Risk' : score < 70 ? 'Moderate Concerns' : 'Good Lease'}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1, justifyContent: { xs: 'flex-start', md: 'flex-end' }, mt: { xs: 2, md: 0 } }}>
                  <Button
                    variant="outlined"
                    startIcon={<Email />}
                    onClick={generateEmailDraft}
                  >
                    Draft Email
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<FileDownload />}
                    onClick={handleDownloadJson}
                    color="secondary"
                  >
                    Download JSON
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>
          
          {analysisResult.risks && analysisResult.risks.length > 0 && (
            <Paper sx={{ p: 3, mb: 4, borderLeft: 4, borderColor: 'error.main' }}>
              <Typography variant="h5" component="h2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Warning color="error" sx={{ mr: 1 }} />
                Potential Issues Found
              </Typography>
              <List dense>
                {analysisResult.risks.map((risk, index) => (
                  <ListItem key={index} disableGutters>
                    <ListItemIcon sx={{ minWidth: 'auto', mr: 1.5 }}>
                      <ErrorOutline color="error" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={risk} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}
          
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              Overview
            </Typography>
            <Grid container spacing={2}>
              {(() => {
                const renderOverviewItem = (label, value) => {
                  const displayValue = (value && value !== "Not Found") ? value : 
                    <Typography component="span" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                      Not specified
                    </Typography>;
                  return (
                    <Grid item xs={12} sm={6}>
                      <Card variant="outlined" sx={{ height: '100%' }}>
                        <CardContent>
                          <Typography variant="body2" color="text.secondary" gutterBottom>{label}</Typography>
                          <Typography variant="body1" fontWeight="medium">{displayValue}</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                };

                const data = analysisResult.extracted_data || {};

                return (
                  <>
                    {renderOverviewItem("Landlord", data.Landlord_Name)}
                    {renderOverviewItem("Tenant", data.Tenant_Name)}
                    <Grid item xs={12}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="body2" color="text.secondary" gutterBottom>Property Address</Typography>
                          <Typography variant="body1" fontWeight="medium">
                             {(data.Property_Address && data.Property_Address !== "Not Found") ? data.Property_Address : 
                               <Typography component="span" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                                 Not specified
                               </Typography>
                             }
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    {renderOverviewItem("Lease Start Date", data.Lease_Start_Date)}
                    {renderOverviewItem("Lease End Date", data.Lease_End_Date)}
                    {renderOverviewItem("Monthly Rent Amount", data.Monthly_Rent_Amount)}
                    {renderOverviewItem("Rent Due Date", data.Rent_Due_Date)}
                    {renderOverviewItem("Security Deposit Amount", data.Security_Deposit_Amount)}
                    {renderOverviewItem("Lease Term (months)", data.Lease_Term)}
                  </>
                );
              })()}
            </Grid>
          </Paper>
          
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              Clause Summaries
            </Typography>
            
            {!analysisResult.clause_summaries || Object.keys(analysisResult.clause_summaries).length === 0 ? (
              <Typography color="text.secondary">
                No clause summaries available
              </Typography>
            ) : (
              Object.entries(analysisResult.clause_summaries).map(([clause, summary], index) => (
                <Accordion key={index} sx={{ '&:before': { display: 'none' } }} disableGutters elevation={0} square>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography fontWeight="medium">{clause.replace(/_/g, ' ')}</Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ pt: 0 }}>
                    <Typography variant="body2">{summary}</Typography>
                  </AccordionDetails>
                </Accordion>
              ))
            )}
          </Paper>

          <Box sx={{ mb: 3, textAlign: 'right' }}>
            <Button 
              variant="outlined" 
              startIcon={<ReplayIcon />} 
              onClick={handleAnalyzeAnother}
            >
              Analyze Another Lease
            </Button>
          </Box>

          {analysisResult.error_message && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="h6">Partial Analysis</Typography>
              <Typography variant="body2">The AI analysis could not be fully structured ({analysisResult.error_message}). Raw output:</Typography>
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: '200px', overflowY: 'auto', background: '#eee', padding: '8px', borderRadius: '4px' }}>
                {analysisResult.raw_analysis || 'No raw output available.'}
              </pre>
            </Alert>
          )}
        </motion.div>
      )}
      
      <Dialog open={emailDialogOpen} onClose={() => setEmailDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Email Draft to Landlord</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Below is a draft email you can use to address concerns with your landlord. Feel free to edit it before sending.
          </DialogContentText>
          <TextField
            fullWidth
            multiline
            rows={12}
            variant="outlined"
            value={emailDraft}
            onChange={(e) => setEmailDraft(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmailDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCopyEmail} startIcon={<SaveAlt />}>Copy to Clipboard</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LeaseAnalysis; 