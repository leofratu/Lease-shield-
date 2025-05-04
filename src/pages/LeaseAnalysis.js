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
  Container,
  Switch,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme
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
import { Link } from 'react-router-dom';
import jsPDF from 'jspdf'; // Added for PDF generation

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
  const [files, setFiles] = useState([]);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [score, setScore] = useState(0);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailDraft, setEmailDraft] = useState('');
  const [textContent, setTextContent] = useState('');
  
  // State for multi-analysis mode
  const [isMultiMode, setIsMultiMode] = useState(false);
  const [multiAnalysisResults, setMultiAnalysisResults] = useState([]);
  const [multiAnalysisProgress, setMultiAnalysisProgress] = useState({});
  const [currentMultiAnalysisIndex, setCurrentMultiAnalysisIndex] = useState(0);

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
        setFiles([]);
        setTextContent('');
        setIsMultiMode(false);
        setMultiAnalysisResults([]);
        setMultiAnalysisProgress({});
        setCurrentMultiAnalysisIndex(0);
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
    setError(null); // Clear previous errors
    const selectedFiles = e.target.files;

    if (!selectedFiles || selectedFiles.length === 0) {
      setFiles([]);
      return;
    }

    if (isMultiMode) {
      let fileList = Array.from(selectedFiles);

      if (fileList.length > 5) {
        displayError('You can upload a maximum of 5 files at a time.');
        fileList = fileList.slice(0, 5); // Limit to 5 files
      }

      const validFiles = fileList.filter(file => {
        const isValid = file.type === 'application/pdf' || file.type === 'text/plain';
        if (!isValid) {
          displayError(`Invalid file type: ${file.name}. Only PDF and TXT are allowed.`);
        }
        return isValid;
      });

      setFiles(validFiles);
      if (validFiles.length < fileList.length) {
         displayInfo(`Removed ${fileList.length - validFiles.length} unsupported files.`);
      }

    } else {
      // Single file mode
      const selectedFile = selectedFiles[0];
      if (selectedFile) {
        if (selectedFile.type !== 'application/pdf' && selectedFile.type !== 'text/plain') {
           displayError('Invalid file type. Only PDF and TXT are allowed.');
           setFiles([]); // Clear selection
        } else {
           setFiles([selectedFile]); // Store as an array with one element
        }
      } else {
        setFiles([]);
      }
    }
  };
  
  const handleTextChange = (e) => {
    setTextContent(e.target.value);
  };
  
  // Refactored: Processes a single analysis task (file or text)
  // Returns: { success: true, analysis: object, score: number, leaseId: string | null } or { success: false, error: string }
  const runSingleAnalysis = async (type, data, fileName = null) => {
    // Reset single-analysis specific states
    setAnalysisProgress(0); 
    setError(null);
    // Clear previous results depending on mode
    if (isMultiMode) {
        // Keep multiAnalysisResults, handled by caller
    } else {
        setAnalysisResult(null); 
        setScore(0);          
    }

    let progress = 0;
    let progressTimer = null; // Declare timer variable

    const targetDurationSeconds = 50; // Target ~50 seconds simulation before backend likely responds
    const maxSimulatedProgress = 95; // Simulate up to 95%
    const intervalTimeMs = Math.max(100, (targetDurationSeconds * 1000) / maxSimulatedProgress); // Calculate interval, ensure minimum delay

    // Start the smoother progress interval
    progressTimer = setInterval(() => {
      progress = Math.min(progress + 1, maxSimulatedProgress); // Increment by 1
      setAnalysisProgress(progress);
      if (progress >= maxSimulatedProgress) {
        clearInterval(progressTimer); // Stop simulation at max %%
      }
    }, intervalTimeMs); // Use calculated interval

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8081';
      const token = await user.getIdToken();
      let response;

      if (type === 'text') {
        response = await fetch(`${apiUrl}/api/analyze`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ text: data }),
        });
      } else if (type === 'file') {
        const formData = new FormData();
        formData.append('leaseFile', data, fileName); // Pass filename
        response = await fetch(`${apiUrl}/api/analyze`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
      } else {
        throw new Error('Invalid analysis type');
      }

      clearInterval(progressTimer); // Ensure timer stops just before final state updates

      if (!response.ok) {
        setAnalysisProgress(0); // Reset progress on fetch error
        const errorData = await response.json().catch(() => ({ error: `Analysis failed with status: ${response.status}` }));
         if (response.status === 402 && errorData.upgradeRequired) {
            return { success: false, error: errorData.error, upgradeRequired: true }; 
         } else {
           return { success: false, error: errorData.error || 'Failed to analyze lease' }; 
         }
      }

      const result = await response.json();

      if (!result.success || !result.analysis) {
        setAnalysisProgress(0); // Reset progress on result error
        throw new Error(result.error || 'Analysis failed to return expected data.');
      }

      // Calculate score
      let calculatedScore = 0;
      if (result.analysis.score !== undefined) {
        calculatedScore = result.analysis.score;
      } else if (result.analysis.risks) {
        const riskCount = result.analysis.risks.length;
        calculatedScore = Math.max(0, 100 - (riskCount * 10));
      }
      
      setAnalysisProgress(100); // Set to 100 ONLY on final success
      
      // Return success object
      return {
         success: true,
         analysis: result.analysis,
         score: calculatedScore,
         leaseId: result.leaseId || null // Include leaseId if returned
      };

    } catch (err) {
      if (progressTimer) clearInterval(progressTimer); // Ensure timer stops on any catch
      setAnalysisProgress(0); // Reset progress on error
      console.error('Analysis error:', err);
      // Return error object
      return { success: false, error: err.message };
    }
  };

  const handleAnalyzeText = async () => {
    if (!textContent.trim()) {
      displayError('Please enter lease text to analyze');
      return;
    }
    setAnalyzing(true);
    setError(null);
    displayInfo('Starting text analysis...');
    
    const result = await runSingleAnalysis('text', textContent);
    
    if (result.success) {
       setAnalysisResult(result.analysis);
       setScore(result.score);
       displaySuccess('Text analysis complete!');
       if (result.leaseId) {
          // Navigate only if a leaseId was successfully returned (meaning it was saved)
          navigate(`/analysis/${result.leaseId}`);
       } else {
          displayInfo('Analysis complete. Consider saving manually if needed.'); // Or implement save button
       }
    } else {
      displayError(`Text analysis failed: ${result.error}`);
      if (result.upgradeRequired) {
         navigate('/pricing'); // Navigate if upgrade required
      }
    }
    setAnalyzing(false);
  };

  // Handles single file upload button click
  const handleSingleUpload = async () => {
    if (!files.length) {
      displayError('Please select a file to upload');
      return;
    }
    const fileToUpload = files[0];
    
    setAnalyzing(true);
    setError(null);
    displayInfo(`Starting analysis for ${fileToUpload.name}...`);
    
    const result = await runSingleAnalysis('file', fileToUpload, fileToUpload.name);
    
    if (result.success) {
      setAnalysisResult(result.analysis);
      setScore(result.score);
      displaySuccess(`Analysis complete for ${fileToUpload.name}!`);
      if (result.leaseId) {
         navigate(`/analysis/${result.leaseId}`);
      } else {
         displayInfo('Analysis complete. Consider saving manually if needed.');
      }
    } else {
      displayError(`Analysis failed for ${fileToUpload.name}: ${result.error}`);
      if (result.upgradeRequired) {
         navigate('/pricing'); 
      }
    }
    setAnalyzing(false);
  };
  
  // Handles multi-file upload button click
  const handleMultiUpload = async () => {
     if (!files.length) {
        displayError('Please select files to upload');
        return;
     }
     
     setAnalyzing(true);
     setError(null);
     setMultiAnalysisResults([]); // Clear previous multi results
     setMultiAnalysisProgress({}); // Clear previous progress
     setCurrentMultiAnalysisIndex(0);
     displayInfo(`Starting analysis for ${files.length} files...`);
     
     const results = [];
     for (let i = 0; i < files.length; i++) {
        const fileToUpload = files[i];
        setCurrentMultiAnalysisIndex(i);
        setMultiAnalysisProgress(prev => ({ ...prev, [fileToUpload.name]: 0 })); // Initialize progress for file
        displayInfo(`Analyzing file ${i + 1} of ${files.length}: ${fileToUpload.name}`);
        
        // Run analysis for the current file
        // We pass a callback to update progress specifically for this file
        const result = await runSingleAnalysis('file', fileToUpload, fileToUpload.name);

        // Store result (success or failure)
        results.push({ 
           fileName: fileToUpload.name, 
           ...(result.success 
              ? { status: 'Complete', analysis: result.analysis, score: result.score, leaseId: result.leaseId } 
              : { status: 'Error', error: result.error, upgradeRequired: result.upgradeRequired })
        });

        // Update overall state with the results accumulated so far
        setMultiAnalysisResults([...results]);

        // Optional: Handle upgrade required immediately
        if (!result.success && result.upgradeRequired) {
           displayError(`Analysis stopped: ${result.error}. Please upgrade your plan.`);
           navigate('/pricing');
           setAnalyzing(false); // Stop the loop
           return; 
        }
        
         // Stop if a non-upgrade error occurred (optional, could continue)
         // if (!result.success) {
         //    displayError(`Error analyzing ${fileToUpload.name}. Stopping further analysis.`);
         //    break; 
         // }
     }
     
     displaySuccess(`Finished analyzing ${files.length} files.`);
     setAnalyzing(false);
     setCurrentMultiAnalysisIndex(0); // Reset index
  };
  
  const handleCopyEmail = () => {
    if (!emailDraft) return;
    navigator.clipboard.writeText(emailDraft);
    displaySuccess('Email draft copied to clipboard!');
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
    setFiles([]);
    setTextContent('');
    setAnalysisProgress(0);
    setIsMultiMode(false);
    setMultiAnalysisResults([]);
    setMultiAnalysisProgress({});
    setCurrentMultiAnalysisIndex(0);
    // Clear the specific lease ID if we navigated here from dashboard
    if (leaseId) {
        navigate('/analysis', { replace: true }); // Navigate to base analysis route
    }
  };
  // --- End Reset Function --- 

  // --- NEW: PDF Generation (Moved Inside Component) --- 
  const handleGeneratePdf = () => {
    if (!analysisResult) return;

    const doc = new jsPDF();
    const margin = 15;
    let yPos = margin;
    const pageHeight = doc.internal.pageSize.height;
    const contentWidth = doc.internal.pageSize.width - margin * 2;

    // Function to add text and handle page breaks
    const addText = (text, options, isTitle = false) => {
      const fontSize = options.fontSize || 10;
      doc.setFontSize(fontSize);
      if (isTitle) {
         doc.setFont(undefined, 'bold');
      }
      const lines = doc.splitTextToSize(text, contentWidth);
      const textHeight = doc.getTextDimensions(lines).h;
      
      if (yPos + textHeight > pageHeight - margin) {
        doc.addPage();
        yPos = margin;
      }
      doc.text(lines, margin, yPos);
      yPos += textHeight + (isTitle ? 3 : 1.5); // Add spacing
      if (isTitle) {
         doc.setFont(undefined, 'normal');
      }
    };

    // Title
    doc.setFontSize(18);
    doc.text('Lease Shield AI - Analysis Report', margin, yPos);
    yPos += 10;

    // Overview
    addText('Overview', { fontSize: 14 }, true);
    if (analysisResult.extracted_data) {
      Object.entries(analysisResult.extracted_data).forEach(([key, value]) => {
        const formattedKey = key.replace(/_/g, ' '); // Replace underscores
        addText(`${formattedKey}: ${value || 'Not Found'}`, { fontSize: 10 });
      });
    }
    addText(`Overall Score: ${score}/100`, { fontSize: 12 });
    yPos += 5; // Extra space after overview

    // Clause Summaries
    if (analysisResult.clause_summaries && Object.keys(analysisResult.clause_summaries).length > 0) {
      addText('Clause Summaries', { fontSize: 14 }, true);
      Object.entries(analysisResult.clause_summaries).forEach(([key, value]) => {
         const formattedKey = key.replace(/_/g, ' ');
         addText(formattedKey, { fontSize: 11 }, true);
         addText(value || 'Not Found', { fontSize: 10 });
         yPos += 2; // Space between clauses
      });
      yPos += 3; // Extra space after section
    }

    // Identified Risks
    if (analysisResult.risks && analysisResult.risks.length > 0) {
      addText('Identified Risks / Considerations', { fontSize: 14 }, true);
      analysisResult.risks.forEach((risk, index) => {
        addText(`${index + 1}. ${risk}`, { fontSize: 10 });
      });
      yPos += 3; // Extra space after section
    }
    
    // Add Raw Analysis if present (e.g., if JSON parsing failed)
    if (analysisResult.raw_analysis) {
       addText('Raw Analysis Output (Parsing Error)', { fontSize: 14 }, true);
       addText(analysisResult.raw_analysis, { fontSize: 8 });
       yPos += 3;
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width / 2, pageHeight - 10, { align: 'center' });
      doc.text(`Generated by Lease Shield AI on ${new Date().toLocaleDateString()}`, margin, pageHeight - 10);
    }

    // Save the PDF
    const currentLease = lease || (analysisResult ? { fileName: analysisResult.fileName } : {}); // Get lease info from state or analysisResult
    const fileName = currentLease?.fileName ? `LeaseAnalysis_${currentLease.fileName.split('.')[0]}.pdf` : 'LeaseAnalysisReport.pdf';
    doc.save(fileName);
    displaySuccess('PDF report generated successfully!');
  };
  // --- End PDF Generation ---

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
  const AnalysisResultsDisplay = ({ analysisResult, score, fileName, leaseId, generateEmailDraft, handleDownloadJson, handleAnalyzeAnother, handleGeneratePdf }) => {
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
                            <Button variant="outlined" size="small" startIcon={<FileDownload />} onClick={handleGeneratePdf} sx={{ mr: 1 }}>Download PDF</Button>
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
                handleGeneratePdf={handleGeneratePdf}
             />
             {/* ... Email Dialog ... */}
             <Dialog open={emailDialogOpen} onClose={() => setEmailDialogOpen(false)} fullWidth maxWidth="md">
                <DialogTitle>Generated Email Draft</DialogTitle>
                <DialogContent>
                   <DialogContentText sx={{ mb: 2 }}>
                      Review and copy the draft email below to send to your landlord. Remember to replace '[Your Name]' and customize as needed.
                   </DialogContentText>
                   <TextField
                      fullWidth
                      multiline
                      rows={15}
                      value={emailDraft}
                      onChange={(e) => setEmailDraft(e.target.value)}
                      variant="outlined"
                   />
                </DialogContent>
                <DialogActions>
                   <Button onClick={() => setEmailDialogOpen(false)}>Cancel</Button>
                   <Button onClick={handleCopyEmail} variant="contained" startIcon={<Email />}>
                      Copy Draft
                   </Button>
                </DialogActions>
             </Dialog>
         </Container>
    );
  }

  // --- Default View: New Lease Analysis Form (No leaseId) ---
  // This should always render if not loading existing lease and no existing lease is loaded
  return (
    <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
        <Helmet>
            <title>{leaseId ? `Lease Analysis - ${lease?.fileName || leaseId}` : 'New Lease Analysis'} | Lease Shield AI</title>
            <meta name="description" content={leaseId ? `Review the AI analysis results for lease ${lease?.fileName || leaseId}.` : "Upload or paste your lease document for AI analysis."} />
        </Helmet>
      
      {/* Back Button */} 
      {!leaseId && (
         <Button 
            startIcon={<ArrowBack />} 
            onClick={() => navigate('/dashboard')} 
            sx={{ mb: 2 }}
         > 
            Back to Dashboard
         </Button>
       )}
       
       {/* --- Main Content Area --- */}
      <Container maxWidth="lg" sx={{ py: 3 }}>
       {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Loading Analysis...</Typography>
        </Box>
      ) : analysisResult ? (
        // Display Existing Single Analysis Result
        <AnalysisResultsDisplay
          analysisResult={analysisResult}
          score={score}
          fileName={lease?.fileName || 'Uploaded Lease'}
          leaseId={leaseId}
          generateEmailDraft={generateEmailDraft}
          handleDownloadJson={handleDownloadJson}
          handleAnalyzeAnother={handleAnalyzeAnother}
          handleGeneratePdf={handleGeneratePdf}
        />
      ) : isMultiMode && multiAnalysisResults.length > 0 ? (
        // Display Multi-Analysis Results Table (Placeholder for now)
        <MultiAnalysisResultsTable results={multiAnalysisResults} />
      ) : (
        // Show Upload / Input Form
        <Grid container spacing={4} justifyContent="center">
          {/* Left Side: Upload or Text Input */}
          <Grid item xs={12} md={6}>
             <Typography variant="h4" gutterBottom component="h1">
                Analyze Your Lease
             </Typography>
            <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
               {/* Multi-mode Toggle */}
               <FormControlLabel 
                  control={<Switch checked={isMultiMode} onChange={(e) => setIsMultiMode(e.target.checked)} />}
                  label="Analyze Multiple Leases (up to 5)"
                  sx={{ mb: 2 }}
               />
               
               {/* Conditional Input Area */} 
               {isMultiMode ? (
                 // Multi-File Upload Area
                 <Box>
                    <Typography variant="h6" gutterBottom>Upload Files</Typography>
                    <Button 
                        variant="outlined" 
                        component="label" 
                        startIcon={<CloudUpload />} 
                        fullWidth
                        sx={{ mb: 1 }}
                    > 
                        {files.length > 0 ? `${files.length} files selected` : 'Select Files (.pdf, .txt)'}
                        <input 
                           type="file" 
                           hidden 
                           multiple // Enable multi-select
                           onChange={handleFileChange} 
                           accept=".pdf,.txt" 
                        />
                    </Button>
                    {files.length > 0 && (
                        <List dense>
                           {files.map((f, index) => (
                              <ListItem key={index} disablePadding>
                                 <ListItemIcon sx={{minWidth: '30px'}}><Description fontSize="small"/></ListItemIcon>
                                 <ListItemText primary={f.name} secondary={`${(f.size / 1024).toFixed(1)} KB`} />
                              </ListItem>
                           ))}
                        </List>
                    )}
                    <Button 
                      variant="contained" 
                      onClick={handleMultiUpload} // Use new handler for multi-upload
                      disabled={!files.length || analyzing} 
                      fullWidth
                      startIcon={analyzing ? <CircularProgress size={20} color="inherit"/> : <Send />}
                      sx={{ mt: 2 }}
                    >
                       {analyzing ? `Analyzing ${currentMultiAnalysisIndex + 1} of ${files.length}...` : `Analyze ${files.length} Files`}
                    </Button>
                 </Box>
               ) : (
                  // Single File / Text Input Area
                  <Box>
                     <Typography variant="h6" gutterBottom>Option 1: Upload Document</Typography>
                     <Button 
                        variant="outlined" 
                        component="label" 
                        startIcon={<CloudUpload />} 
                        fullWidth
                        sx={{ mb: 1 }}
                     > 
                        {files.length > 0 ? files[0].name : 'Select File (.pdf, .txt)'}
                        <input 
                           type="file" 
                           hidden 
                           onChange={handleFileChange} 
                           accept=".pdf,.txt" 
                        />
                     </Button>
                      <Button 
                        variant="contained" 
                        onClick={handleSingleUpload} // Use specific handler for single upload
                        disabled={!files.length || analyzing} 
                        fullWidth
                        startIcon={analyzing ? <CircularProgress size={20} color="inherit"/> : <Send />}
                      >
                        {analyzing ? 'Analyzing Upload...' : 'Upload & Analyze'}
                      </Button>
                
                      <Divider sx={{ my: 3 }}>OR</Divider>
                
                      <Typography variant="h6" gutterBottom>Option 2: Paste Text</Typography>
                      <TextField
                        fullWidth
                        multiline
                        rows={8}
                        variant="outlined"
                        label="Paste Lease Text Here"
                        value={textContent}
                        onChange={handleTextChange}
                        sx={{ mb: 2 }}
                      />
                      <Button 
                         variant="contained" 
                         onClick={handleAnalyzeText} 
                         disabled={!textContent.trim() || analyzing} 
                         fullWidth
                         startIcon={analyzing ? <CircularProgress size={20} color="inherit"/> : <Send />}
                       >
                         {analyzing ? 'Analyzing Text...' : 'Analyze Text'}
                      </Button>
                   </Box>
               )}
               
               {/* Progress Bar */}
               {analyzing && (
                  <Box sx={{ width: '100%', mt: 3 }}>
                     <LinearProgress variant="determinate" value={analysisProgress} />
                     <Typography variant="caption" display="block" gutterBottom align="center">
                        {isMultiMode ? `Analyzing file ${currentMultiAnalysisIndex + 1} of ${files.length}: ${files[currentMultiAnalysisIndex]?.name || ''}... ${analysisProgress}%` : `Analysis in progress... ${analysisProgress}%`}
                     </Typography>
                  </Box>
                )}
                
               {/* Error Display */} 
               {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            </Paper>
          </Grid>

          {/* Right Side: Placeholder/Info */}
          <Grid item xs={12} md={6}>
             <Paper sx={{ p: 3, borderRadius: 2, height: '100%', bgcolor: 'grey.100' }}>
                <Typography variant="h6" gutterBottom>How it Works</Typography>
                <List>
                  <ListItem>
                    <ListItemIcon><Check color="primary" /></ListItemIcon>
                    <ListItemText primary={isMultiMode ? "Upload up to 5 PDF or TXT lease files." : "Upload your lease document (PDF or TXT) or paste the text."} />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Check color="primary" /></ListItemIcon>
                    <ListItemText primary="Our AI analyzes the content for key terms, dates, and potential risks." />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Check color="primary" /></ListItemIcon>
                    <ListItemText primary={isMultiMode ? "Review a summary table comparing the key results for each lease." : "Receive a detailed report with summaries and highlighted issues."} />
                  </ListItem>
                </List>
                <Alert severity="info" icon={<InfoOutlined />} sx={{ mt: 2 }}>
                  Your documents are processed securely and are not stored long-term unless you explicitly save the analysis.
                </Alert>
             </Paper>
           </Grid>
        </Grid>
      )}

      {/* Email Generation Dialog */}
      <Dialog open={emailDialogOpen} onClose={() => setEmailDialogOpen(false)} fullWidth maxWidth="md">
         <DialogTitle>Generated Email Draft</DialogTitle>
         <DialogContent>
            <DialogContentText sx={{ mb: 2 }}>
               Review and copy the draft email below to send to your landlord. Remember to replace '[Your Name]' and customize as needed.
            </DialogContentText>
            <TextField
               fullWidth
               multiline
               rows={15}
               value={emailDraft}
               onChange={(e) => setEmailDraft(e.target.value)}
               variant="outlined"
            />
         </DialogContent>
         <DialogActions>
            <Button onClick={() => setEmailDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCopyEmail} variant="contained" startIcon={<Email />}>
               Copy Draft
            </Button>
         </DialogActions>
      </Dialog>
     </Container>
     </Container>
   );
 };
 
 // Define MultiAnalysisResultsTable component (Implementation)
 const MultiAnalysisResultsTable = ({ results }) => {
 
  const formatValue = (value) => value || 'N/A';

  if (!results || results.length === 0) {
    return (
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h5" gutterBottom>Multi-Lease Analysis Summary</Typography>
        <Typography color="text.secondary">No analysis results to display.</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ mt: 3, overflowX: 'auto' }}> {/* Use TableContainer for scroll */}
      <Typography variant="h5" gutterBottom sx={{ p: 2 }}>Multi-Lease Analysis Summary</Typography>
      <TableContainer>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Filename</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="center">Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="center">Score</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Landlord</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Rent</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="center">Risks</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Details</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {results.map((result, index) => {
              const isComplete = result.status === 'Complete';
              const extractedData = result.analysis?.extracted_data || {};
              const risks = result.analysis?.risks || [];

              return (
                <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell component="th" scope="row">
                    <Typography variant="body2" noWrap title={result.fileName}>{result.fileName}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip 
                      label={result.status}
                      color={isComplete ? 'success' : 'error'}
                      size="small"
                      icon={isComplete ? <Check fontSize="small"/> : <ErrorOutline fontSize="small"/>}
                     />
                  </TableCell>
                  <TableCell align="center">
                     {isComplete ? (
                         <Typography variant="body2" sx={{ color: `${getScoreColor(result.score)}.main`, fontWeight: 'bold' }}>
                           {result.score}
                         </Typography>
                      ) : '-'}
                  </TableCell>
                  <TableCell>{formatValue(extractedData.Landlord_Name)}</TableCell>
                  <TableCell>{formatValue(extractedData.Monthly_Rent_Amount)}</TableCell>
                  <TableCell align="center">{isComplete ? risks.length : '-'}</TableCell>
                  <TableCell>
                    {result.status === 'Error' ? (
                       <Typography variant="caption" color="error">{result.error}</Typography>
                     ) : (
                       <Typography variant="caption" color="text.secondary">Analysis Complete</Typography>
                     )}
                  </TableCell>
                   <TableCell>
                    {result.leaseId ? (
                       <Button 
                          component={Link} 
                          to={`/analysis/${result.leaseId}`} 
                          size="small" 
                          variant="outlined"
                       >
                          View
                       </Button>
                     ) : (
                        <Typography variant="caption" color="text.disabled">No Link</Typography>
                     )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
 };

 export default LeaseAnalysis; 