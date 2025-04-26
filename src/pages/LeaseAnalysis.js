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
  Stack,
  Container
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
  const [loading, setLoading] = useState(!!leaseId);
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
  
  // Fetch lease data ONLY if leaseId is provided
  useEffect(() => {
    if (leaseId) {
      setLoading(true); // Set loading true when starting fetch
      fetchLeaseData();
    } else {
        // Reset state when navigating to the 'new analysis' page
        setLease(null);
        setAnalysisResult(null);
        setScore(0);
        setError(null);
        setAnalyzing(false);
        setAnalysisProgress(0);
        setFile(null);
        setTextContent('');
        setLoading(false); // Ensure loading is false if no leaseId
    }
  }, [leaseId]);
  
  const fetchLeaseData = async () => {
    try {
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

  // --- Helper function defined BEFORE AnalysisResultsDisplay ---
  const renderOverviewItem = (label, value) => (
      value && value !== 'Not Found' && (
          <ListItem sx={{ py: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 30 }}><Check fontSize="small" color="action"/></ListItemIcon>
              <ListItemText 
                  primaryTypographyProps={{ variant: 'body2' }} 
                  secondaryTypographyProps={{ variant: 'body2', color: 'text.primary', fontWeight: 'medium' }} 
                  primary={label}
                  secondary={value}
              />
          </ListItem>
      )
  );

  // --- Helper Component for Displaying Results --- 
  // (Moved the complex result rendering logic here for clarity)
  const AnalysisResultsDisplay = ({ analysisResult, score, fileName, leaseId, generateEmailDraft, handleDownloadJson, handleAnalyzeAnother }) => {
      if (!analysisResult) return null;

      // Destructure analysisResult for easier access
      const { extracted_data = {}, clause_summaries = {}, risks = [] } = analysisResult;

      return (
          <Paper elevation={3} sx={{ p: { xs: 2, sm: 3, md: 4 }, borderRadius: 2 }}>
              <Grid container spacing={3} alignItems="center" sx={{ mb: 3 }}>
                  <Grid item xs={12} md={8}>
                      <Typography variant="h4" component="h2" gutterBottom>
                         Analysis Complete: {fileName || 'Pasted Text'}
                      </Typography>
                  </Grid>
                  <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                     {/* Action buttons only make sense for saved analysis */}
                     {leaseId && (
                         <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
                            <Button variant="outlined" size="small" startIcon={<Email />} onClick={generateEmailDraft}>Draft Email</Button>
                            <Button variant="outlined" size="small" startIcon={<FileDownload />} onClick={handleDownloadJson}>Download JSON</Button>
                            <Button variant="text" size="small" startIcon={<ReplayIcon/>} onClick={handleAnalyzeAnother}>Analyze Another</Button>
                         </Stack>
                     )}
                  </Grid>
              </Grid>
              
              <Divider sx={{ mb: 3 }}/>

              {/* Overview Section */}
              <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>Overview</Typography>
              <Card variant="outlined" sx={{ mb: 3 }}>
                  <CardContent>
                      <Grid container spacing={2}>
                           {/* Score */} 
                           <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
                              <Typography variant="subtitle1" color="text.secondary">Overall Score</Typography>
                              <Typography variant="h2" component="div" sx={{ fontWeight: 'bold', color: `${getScoreColor(score)}.main` }}>
                                  {score}
                              </Typography>
                              <Box sx={{ width: '80%', mx: 'auto' }}>
                                  <LinearProgress variant="determinate" value={score} color={getScoreColor(score)} sx={{ height: 10, borderRadius: 5 }} />
                              </Box>
                           </Grid>
                           {/* Extracted Data */}
                           <Grid item xs={12} md={8}>
                              <List dense disablePadding>
                                  {renderOverviewItem('Landlord', extracted_data.Landlord_Name)}
                                  {renderOverviewItem('Tenant', extracted_data.Tenant_Name)}
                                  {renderOverviewItem('Address', extracted_data.Property_Address)}
                                  {renderOverviewItem('Term', `${extracted_data.Lease_Start_Date || 'N/A'} to ${extracted_data.Lease_End_Date || 'N/A'} (${extracted_data.Lease_Term || 'N/A'} months)`)}
                                  {renderOverviewItem('Rent', `${extracted_data.Monthly_Rent_Amount || 'N/A'} (Due ${extracted_data.Rent_Due_Date || 'N/A'})`)}
                                  {renderOverviewItem('Deposit', extracted_data.Security_Deposit_Amount)}
                              </List>
                           </Grid>
                      </Grid>
                  </CardContent>
              </Card>

              {/* Risks Section */}
              {risks.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                      <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>Potential Issues Found ({risks.length})</Typography>
                      <List sx={{ bgcolor: 'background.paper', borderRadius: 1, p: 0 }}>
                          {risks.map((risk, index) => (
                              <React.Fragment key={index}>
                                  <ListItem alignItems="flex-start">
                                      <ListItemIcon sx={{ minWidth: 35, mt: 0.5 }}>
                                          <Warning color="warning" />
                                      </ListItemIcon>
                                      <ListItemText primary={`Issue ${index + 1}`} secondary={risk} />
                                  </ListItem>
                                  {index < risks.length - 1 && <Divider variant="inset" component="li" />}
                              </React.Fragment>
                          ))}
                      </List>
                  </Box>
              )}
              {risks.length === 0 && (
                  <Alert severity="success" icon={<Check />} sx={{ mb: 3 }}>No major unfavorable clauses detected based on common patterns.</Alert>
              )}

              {/* Clause Summaries Section */}
              <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>Clause Summaries</Typography>
              <Grid container spacing={2}>
                  {Object.entries(clause_summaries).map(([key, value]) => (
                      <Grid item xs={12} md={6} key={key}>
                          <Accordion variant="outlined" sx={{ '&:before': { display: 'none' }, borderRadius: 1, overflow: 'hidden' }}>
                              <AccordionSummary expandIcon={<ExpandMore />}>
                                  <Typography sx={{ fontWeight: 'medium' }}>
                                      {key.replace(/_/g, ' ')}
                                  </Typography>
                              </AccordionSummary>
                              <AccordionDetails sx={{ bgcolor: 'action.hover' }}>
                                  <Typography variant="body2" color="text.secondary">
                                      {value || 'Not Found'}
                                  </Typography>
                              </AccordionDetails>
                          </Accordion>
                      </Grid>
                  ))}
                  {Object.keys(clause_summaries).length === 0 && (
                      <Grid item xs={12}>
                          <Typography color="text.secondary">No specific clause summaries were extracted.</Typography>
                      </Grid>
                  )}
              </Grid>
              
              {/* Disclaimer */}
              <Alert severity="info" icon={<InfoOutlined />} sx={{ mt: 4 }}>
                  Disclaimer: This AI analysis provides a summary and identifies potential issues based on common patterns. It is not a substitute for professional legal advice. Always consult with a qualified attorney before signing any lease agreement.
              </Alert>

          </Paper>
      );
  };

  // --- Loading state for existing lease fetch ---
  if (loading && leaseId) { // Only show full page loading when fetching existing lease
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading analysis...</Typography>
      </Box>
    );
  }

  // --- Error state for existing lease fetch ---
  if (error && leaseId && !lease) { // Show error only if loading existing lease failed
      return <Alert severity="error">{error}</Alert>;
  }

  // --- Display Existing Lease Analysis Results ---
  if (leaseId && lease && analysisResult) {
    return (
        <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
             {/* Back Button */} 
             <Button 
                 startIcon={<ArrowBack />} 
                 onClick={() => navigate('/dashboard')} 
                 sx={{ mb: 2 }}
             >
                 Back to Dashboard
             </Button>
            
             {/* --- Existing Analysis Display UI --- */}
             {/* Reuse the existing complex UI for displaying fetched results */}
             {/* It relies on 'analysisResult' and 'score' state variables */}
             <AnalysisResultsDisplay 
                analysisResult={analysisResult} 
                score={score} 
                fileName={lease.fileName}
                leaseId={leaseId}
                generateEmailDraft={generateEmailDraft}
                handleDownloadJson={handleDownloadJson}
                handleAnalyzeAnother={handleAnalyzeAnother}
             />
             {/* ... Email Dialog ... */}
             <Dialog open={emailDialogOpen} onClose={() => setEmailDialogOpen(false)} maxWidth="md" fullWidth>
                {/* ... existing Dialog content ... */}
             </Dialog>
         </Container>
    );
  }

  // --- Default View: New Lease Analysis Form (No leaseId) ---
  // This should always render if not loading existing lease and no existing lease is loaded
  return (
    <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
        <Helmet>
            <title>Lease Analysis - Lease Shield AI</title>
            <meta name="description" content="Upload or paste your lease document for AI-powered analysis." />
        </Helmet>
        <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
          Analyze New Lease
        </Typography>
        
        {/* Display general errors for analysis submission */}
        {error && !leaseId && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Grid container spacing={4}>
          {/* Upload Section */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>Option 1: Upload File</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Upload your lease document (PDF or TXT).
              </Typography>
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUpload />}
                fullWidth
                sx={{ mb: 1 }}
              >
                Choose File
                <input type="file" hidden onChange={handleFileChange} accept=".pdf,.txt" />
              </Button>
              {file && <Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic' }}>Selected: {file.name}</Typography>}
              <Button 
                variant="contained" 
                onClick={handleUpload} 
                disabled={!file || analyzing} 
                fullWidth
                startIcon={analyzing && file ? <CircularProgress size={20} color="inherit"/> : <Send />}
              >
                {analyzing && file ? 'Analyzing Upload...' : 'Upload & Analyze'}
              </Button>
            </Paper>
          </Grid>

          {/* Text Input Section */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>Option 2: Paste Text</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Paste the text content of your lease below.
              </Typography>
              <TextField
                multiline
                rows={8}
                fullWidth
                variant="outlined"
                placeholder="Paste your lease text here..."
                value={textContent}
                onChange={handleTextChange}
                disabled={analyzing}
                sx={{ mb: 2 }}
              />
              <Button 
                variant="contained" 
                onClick={handleAnalyzeText} 
                disabled={!textContent.trim() || analyzing} 
                fullWidth
                startIcon={analyzing && textContent ? <CircularProgress size={20} color="inherit"/> : <Send />}
              >
                {analyzing && textContent ? 'Analyzing Text...' : 'Analyze Text'}
              </Button>
            </Paper>
          </Grid>
        </Grid>

        {/* Analysis Progress */}
        {analyzing && (
          <Box sx={{ mt: 4 }}>
            <Typography sx={{ mb: 1 }}>Analysis in progress...</Typography>
            <LinearProgress variant="determinate" value={analysisProgress} />
          </Box>
        )}

        {/* Display NEW Analysis Results (Before Saving/Navigation) */}
        {/* This section shows results immediately after analysis, before redirecting */}
        {!analyzing && analysisResult && !leaseId && (
            <Box sx={{mt: 4}}>
                <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>Analysis Results</Typography>
                <AnalysisResultsDisplay 
                    analysisResult={analysisResult} 
                    score={score} 
                    // Pass minimal props needed before save/navigation
                />
            </Box>
        )}

    </Container>
  );
};

export default LeaseAnalysis; 