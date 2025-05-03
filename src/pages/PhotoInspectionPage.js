import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { auth } from '../firebase/config'; // For potential future authentication needs
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Alert,
  Divider,
  Card,
  CardMedia,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Container,
  LinearProgress
} from '@mui/material';
import { 
    FileUpload as FileUploadIcon, 
    Clear as ClearIcon, 
    Image as ImageIcon, // Specific icon for image files
    CameraAlt as CameraAltIcon, // Icon for the page/action
    Construction as ConstructionIcon, // Icon for repairs
    ReportProblem as ReportProblemIcon, // Icon for issues
    PriceCheck as PriceCheckIcon // Icon for estimates
} from '@mui/icons-material';

// Placeholder function for API call - replace with actual logic later
const fetchInspectionData = async (formData, token) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2500)); 

    // Simulate API response - NEEDS TO BE REPLACED with actual backend response
    const mockResponse = {
        success: true,
        results: [
            {
                fileName: "wall_crack.jpg",
                imageUrl: "https://via.placeholder.com/300x200.png?text=Wall+Crack", // Placeholder image URL
                issues: [
                    { 
                        id: 'issue-1', 
                        label: "Hairline Crack", 
                        severity: "Low", 
                        location: "Living room, near window", 
                        // annotationBox: { x: 50, y: 100, width: 150, height: 20 } // Example coordinates
                    },
                     { 
                        id: 'issue-2', 
                        label: "Water Stain", 
                        severity: "Medium", 
                        location: "Living room, ceiling corner", 
                        // annotationBox: { x: 200, y: 30, width: 40, height: 40 } 
                    },
                ]
            },
            {
                fileName: "rusty_faucet.png",
                imageUrl: "https://via.placeholder.com/300x200.png?text=Rusty+Faucet", // Placeholder image URL
                issues: [
                    { 
                        id: 'issue-3', 
                        label: "Rust/Corrosion", 
                        severity: "Medium", 
                        location: "Kitchen Sink Faucet", 
                    }
                ]
            }
        ],
        repairEstimate: {
            lineItems: [
                { issueId: 'issue-1', task: "Patch & Paint Crack (Minor)", estimatedCost: 75 },
                { issueId: 'issue-2', task: "Investigate & Treat Stain", estimatedCost: 150 },
                { issueId: 'issue-3', task: "Replace Kitchen Faucet", estimatedCost: 200 },
            ],
            totalEstimatedCost: 425,
            notes: "Estimates based on standard rates. Actual costs may vary."
        }
    };
    
    // Simulate failure occasionally
    if (Math.random() < 0.1) { 
        return { success: false, error: "Image analysis failed. Please ensure photos are clear." };
    }
    
    return mockResponse;
};


const PhotoInspectionPage = () => {
  // File Upload State
  const [files, setFiles] = useState([]); // Store file objects { file: File, preview: string }
  
  // API/UI State
  const [inspectionResults, setInspectionResults] = useState(null); // Store analysis results per image
  const [repairEstimate, setRepairEstimate] = useState(null); // Store overall cost estimate
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysisProgress, setAnalysisProgress] = useState(0); // Added state for progress

  // --- File Upload Logic (react-dropzone) ---
  const onDrop = useCallback((acceptedFiles, fileRejections) => {
    setError(''); 
    setInspectionResults(null); 
    setRepairEstimate(null);
    
    const newFiles = acceptedFiles.map(file => ({
        file: file,
        preview: URL.createObjectURL(file) // Create preview URL for images
    }));
    
    setFiles(prevFiles => {
        const combined = [...prevFiles, ...newFiles];
        // Prevent duplicates based on file name AND size (more robust)
        const uniqueFiles = combined.filter((fileObj, index, self) => 
            index === self.findIndex((f) => f.file.name === fileObj.file.name && f.file.size === fileObj.file.size)
        );
        const limitedFiles = uniqueFiles.slice(0, 10); // Allow more images, e.g., 10
        
        if (uniqueFiles.length > 10) {
            setError('Maximum 10 photos allowed per inspection. Some photos were not added.');
        }
        // Revoke URLs for files that are *not* in the final limited list
        combined.forEach(fileObj => {
            if (!limitedFiles.some(lf => lf.file.name === fileObj.file.name && lf.file.size === fileObj.file.size)) {
                URL.revokeObjectURL(fileObj.preview);
            }
        });
        
        return limitedFiles;
    });

    if (fileRejections.length > 0) {
        const rejectionError = fileRejections.map(({ file, errors }) => 
            `${file.name}: ${errors.map(e => e.message).join(', ')}`
        ).join('\n');
        setError(`File validation errors:\n${rejectionError}`);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { // Focus on common image types
        'image/jpeg': [],
        'image/png': [],
        'image/webp': [],
        'image/heic': [], 
        'image/heif': []
    },
    maxSize: 20 * 1024 * 1024, // Example: 20MB limit per photo
    maxFiles: 10, 
  });
  
  const handleRemoveFile = (fileName, fileSize) => {
    setFiles((prevFiles) => {
        const updatedFiles = prevFiles.filter(fileObj => {
             if (fileObj.file.name === fileName && fileObj.file.size === fileSize) {
                 URL.revokeObjectURL(fileObj.preview); // Revoke URL when removing
                 return false;
             }
             return true;
        });
        return updatedFiles;
    });
  };

  // Revoke object URLs on component unmount
  useEffect(() => {
    return () => files.forEach(fileObj => URL.revokeObjectURL(fileObj.preview));
  }, [files]);
  // --- End File Upload Logic ---

  // --- API Submission Logic ---
  const handleSubmit = async () => {
    if (files.length === 0) {
      setError('Please upload photos for inspection.');
      return;
    }
    setIsLoading(true);
    setError('');
    setInspectionResults(null);
    setRepairEstimate(null);
    setAnalysisProgress(0); // Reset progress
    let progressTimer = null; // Timer for simulation

    // Start progress simulation
    const targetDurationSeconds = 30; // Shorter target for potentially faster vision API
    const maxSimulatedProgress = 95;
    const intervalTimeMs = Math.max(100, (targetDurationSeconds * 1000) / maxSimulatedProgress);

    progressTimer = setInterval(() => {
      setAnalysisProgress(prev => {
        const newProgress = Math.min(prev + 1, maxSimulatedProgress);
        if (newProgress >= maxSimulatedProgress) {
          clearInterval(progressTimer);
        }
        return newProgress;
      });
    }, intervalTimeMs);

    try {
      const user = auth.currentUser;
      let token = null;
      if (user) {
           token = await user.getIdToken();
      } 
      // Add error handling if login is mandatory for this feature

      const formData = new FormData();
      files.forEach((fileObj) => {
        formData.append('photos', fileObj.file, fileObj.file.name); // Use 'photos' as field name
      });

      // --- IMPORTANT: Replace with actual API call to your backend ---
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8081'; 
      const inspectEndpoint = `${apiUrl}/api/inspect-photos`; // NEW ENDPOINT
      console.log('Photo Inspection Endpoint:', inspectEndpoint);

      const response = await fetch(inspectEndpoint, {
          method: 'POST',
          headers: {
              ...(token && { 'Authorization': `Bearer ${token}` }), 
          },
          body: formData,
      });

      // const result = await fetchInspectionData(formData, token); // Using placeholder for now

       if (!response.ok) {
           const errorText = await response.text(); 
           throw new Error(errorText || `Request failed with status: ${response.status}`);
       }
      
       const result = await response.json(); // Expecting JSON with { success: bool, results: [], repairEstimate: {} }

      // --- End IMPORTANT Section ---

      // Stop simulation and jump to 100 on success/expected response format
      clearInterval(progressTimer);
      setAnalysisProgress(100); 

      if (!result.success) {
          throw new Error(result.error || 'API indicated an error during inspection.');
      }
      if (!result.results || !result.repairEstimate) {
           console.warn("API response missing 'results' or 'repairEstimate' field:", result);
           throw new Error('API response format is incorrect.');
      }

      setInspectionResults(result.results); // Store the array of image results
      setRepairEstimate(result.repairEstimate); // Store the cost estimate object

    } catch (apiError) {
      console.error("Error processing photo inspection request:", apiError);
      setError(`Failed to process inspection: ${apiError.message}`);
      // Stop simulation and reset progress on error
      clearInterval(progressTimer);
      setAnalysisProgress(0);
    } finally {
      setIsLoading(false);
      // Ensure timer is cleared even if API call fails before reaching explicit clear points
      if (progressTimer) {
          clearInterval(progressTimer);
      }
    }
  };
  // --- End API Submission Logic ---

  // --- Render Logic ---
  const renderFilePreview = (fileObj) => {
      return (
          <ListItem 
            key={`${fileObj.file.name}-${fileObj.file.size}`} // Use combined key for uniqueness
            sx={{ p: 0.5 }}
            secondaryAction={
              <IconButton 
                  edge="end" 
                  aria-label="delete" 
                  onClick={() => handleRemoveFile(fileObj.file.name, fileObj.file.size)} 
                  disabled={isLoading}
                  size="small"
              >
                <ClearIcon fontSize='small'/>
              </IconButton>
            }
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
                 <ImageIcon fontSize='small' /> 
            </ListItemIcon>
            <ListItemText 
                primary={fileObj.file.name} 
                secondary={`${(fileObj.file.size / (1024 * 1024)).toFixed(2)} MB`} 
                primaryTypographyProps={{ variant: 'body2', noWrap: true }}
                secondaryTypographyProps={{ variant: 'caption' }}
            />
          </ListItem>
      );
  };

  // Helper to get severity color
  const getSeverityColor = (severity) => {
      switch (severity?.toLowerCase()) {
          case 'low': return 'success';
          case 'medium': return 'warning';
          case 'high': return 'error';
          default: return 'info';
      }
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4, pb: 10 }}> {/* Use wider container */}
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
        AI Photo Inspection & Repair Estimator
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Upload property photos (walls, fixtures, roof, etc.). The AI will detect potential issues, annotate them, and estimate repair costs.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Grid container spacing={4}>
        {/* Upload & Controls Column */}
        <Grid item xs={12} md={4}>
           {/* File Upload */}
           <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>1. Upload Photos</Typography>
              <Box
                {...getRootProps()}
                sx={{
                  border: `2px dashed ${isDragActive ? 'primary.main' : 'grey.400'}`,
                  borderRadius: 1,
                  p: 3,
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
                  mb: 2,
                  '&:hover': { borderColor: 'primary.light' }
                }}
              >
                <input {...getInputProps()} />
                <FileUploadIcon sx={{ fontSize: 40, color: 'grey.500', mb: 1 }} />
                {isDragActive ? (
                  <Typography>Drop the photos here ...</Typography>
                ) : (
                  <Typography>Drag & drop photos, or click to select (Max 10 files)</Typography>
                )}
                <Typography variant="caption" display="block" color="text.secondary">Images accepted (JPG, PNG, WEBP, HEIC). Max 20MB each.</Typography>
              </Box>
              {files.length > 0 && (
                <>
                  <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Photos Queued ({files.length}):</Typography>
                  {/* Use a denser list display */}
                  <Paper variant='outlined' sx={{ maxHeight: '250px', overflowY: 'auto' }}>
                      <List dense>{files.map(renderFilePreview)}</List>
                  </Paper>
                </>
              )}
           </Paper>

            {/* Action Button */}
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
               <Button
                 variant="contained"
                 color="primary"
                 size="large"
                 onClick={handleSubmit}
                 disabled={isLoading || files.length === 0} 
                 startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <CameraAltIcon />}
                 sx={{ minWidth: '200px', py: 1.5 }}
               >
                 {isLoading ? 'Inspecting...' : 'Inspect Photos'}
               </Button>
            </Box>
        </Grid>

        {/* Results Column */}
        <Grid item xs={12} md={8}>
           <Typography variant="h6" gutterBottom>2. Inspection Results & Estimates</Typography>
           
           {isLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300, flexDirection: 'column' }}>
                  <CircularProgress size={50}/>
                  <Typography sx={{ mt: 2 }}>Analyzing photos for issues...</Typography>
              </Box>
           )}

           {!isLoading && !inspectionResults && !error && (
                 <Paper elevation={1} sx={{ p: 3, textAlign: 'center', minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', bgcolor: 'grey.50' }}>
                    <ReportProblemIcon sx={{ fontSize: 50, color: 'text.secondary', mb: 2 }}/>
                     <Typography variant='h6' color="text.secondary">
                         Inspection results and repair estimates will appear here after you upload photos and click "Inspect Photos".
                     </Typography>
                 </Paper>
           )}
           
           {/* Display Results if available */}
           {inspectionResults && repairEstimate && (
               <Grid container spacing={3}>
                   {/* Issue Summary / Image Display */}
                   <Grid item xs={12} lg={7}>
                       <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                           <Typography variant="h6" gutterBottom>Detected Issues Summary</Typography>
                            {/* Display images and their issues */}
                            {inspectionResults.map((result, index) => (
                                <Card key={index} variant="outlined" sx={{ mb: 2 }}>
                                     <CardMedia
                                        component="img"
                                        height="160" // Adjust height as needed
                                        // Use actual image URL from backend when available, fallback to preview or placeholder
                                        image={result.imageUrl || files.find(f => f.file.name === result.fileName)?.preview || 'https://via.placeholder.com/300x160?text=Image+Preview'} 
                                        alt={result.fileName}
                                        sx={{ objectFit: 'contain', bgcolor: 'grey.100' }} // contain ensures whole image is visible
                                    />
                                    {/* TODO: Add annotation overlay logic here if needed */}
                                    <CardContent sx={{ pt: 1, pb: '8px !important' }}> {/* Reduce padding */}
                                        <Typography variant="subtitle2" gutterBottom noWrap>
                                            {result.fileName}
                                        </Typography>
                                         {result.issues && result.issues.length > 0 ? (
                                            result.issues.map(issue => (
                                                 <Chip 
                                                     key={issue.id}
                                                     icon={<ReportProblemIcon fontSize="small" />}
                                                     label={`${issue.label} (${issue.severity || 'N/A'})`} 
                                                     size="small" 
                                                     color={getSeverityColor(issue.severity)}
                                                     variant="outlined"
                                                     sx={{ mr: 0.5, mb: 0.5 }}
                                                     title={`Location: ${issue.location || 'N/A'}`} // Tooltip for location
                                                 />
                                            ))
                                         ) : (
                                             <Typography variant="body2" color="text.secondary">No issues detected in this photo.</Typography>
                                         )}
                                    </CardContent>
                                </Card>
                            ))}
                           {/* Add button to generate PDF report */}
                            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                <Button variant="outlined" size="small">Generate Report (PDF)</Button> {/* Placeholder */}
                            </Box>
                       </Paper>
                   </Grid>
                   
                   {/* Repair Estimate */}
                    <Grid item xs={12} lg={5}>
                       <Paper elevation={2} sx={{ p: 3 }}>
                           <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                              <PriceCheckIcon sx={{ mr: 1, color: 'success.main' }}/>
                              <Typography variant="h6">Repair Cost Estimate</Typography>
                           </Box>
                            {repairEstimate.lineItems && repairEstimate.lineItems.length > 0 ? (
                               <TableContainer component={Paper} variant="outlined" sx={{ mb: 2, maxHeight: 400 }}>
                                   <Table size="small" stickyHeader>
                                       <TableHead>
                                           <TableRow>
                                               <TableCell>Task</TableCell>
                                               <TableCell align="right">Est. Cost</TableCell>
                                           </TableRow>
                                       </TableHead>
                                       <TableBody>
                                           {repairEstimate.lineItems.map((item, index) => (
                                               <TableRow key={item.issueId || index}>
                                                   <TableCell>{item.task}</TableCell>
                                                   <TableCell align="right">${item.estimatedCost?.toFixed(2)}</TableCell>
                                               </TableRow>
                                           ))}
                                       </TableBody>
                                   </Table>
                               </TableContainer>
                           ) : (
                               <Typography color="text.secondary" sx={{ mb: 2 }}>No repair tasks estimated.</Typography>
                           )}
                           
                           <Divider sx={{ my: 2 }}/>
                           
                           <Typography variant="h6" align="right" sx={{ mb: 1 }}>
                               Total Estimated Cost: ${repairEstimate.totalEstimatedCost?.toFixed(2) || '0.00'}
                           </Typography>
                            {repairEstimate.notes && (
                               <Typography variant="caption" color="text.secondary" display="block" align="right">
                                   {repairEstimate.notes}
                               </Typography>
                           )}
                           {/* Add button to export/save estimate */}
                           <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                <Button variant="outlined" size="small">Save Estimate</Button> {/* Placeholder */}
                            </Box>
                       </Paper>
                   </Grid>
               </Grid>
           )}

           {/* Progress Bar */} 
           {isLoading && (
             <Box sx={{ width: '100%', my: 2 }}>
               <LinearProgress variant="determinate" value={analysisProgress} />
               <Typography variant="caption" display="block" align="center" sx={{ mt: 0.5 }}>
                 Analyzing photos... {analysisProgress}%
               </Typography>
             </Box>
           )}

           {error && (
             <Alert severity="error" sx={{ mt: 2 }}>
               {error}
             </Alert>
           )}

           {/* Analysis Results Section */}
           {inspectionResults && (
             <Box sx={{ mt: 4 }}>
               <Typography variant="h5" gutterBottom component="h2" sx={{ display: 'flex', alignItems: 'center' }}>
                 <ReportProblemIcon sx={{ mr: 1 }} /> Inspection Report
               </Typography>
               <Grid container spacing={3}>
                 {/* Issues per image */}
                 {inspectionResults.map((result, index) => (
                   <Grid item xs={12} md={6} key={index}>
                     <Card elevation={2}>
                       <CardMedia
                         component="img"
                         height="200"
                         // Use result.imageUrl if available from backend, else placeholder or omit
                         // image={result.imageUrl && result.imageUrl !== 'placeholder' ? result.imageUrl : `https://via.placeholder.com/300x200.png?text=${encodeURIComponent(result.fileName)}`}
                         image={`https://via.placeholder.com/300x200.png?text=${encodeURIComponent(result.fileName)}`} // TEMP Placeholder
                         alt={result.fileName}
                         sx={{ objectFit: 'contain' }} 
                       />
                       <CardContent>
                         <Typography gutterBottom variant="h6" component="div">
                           {result.fileName}
                         </Typography>
                         {result.analysis_error && <Alert severity="warning" sx={{ mb: 1}}>Analysis failed for this image: {result.analysis_error}</Alert>}
                         {result.processing_error && <Alert severity="error" sx={{ mb: 1}}>Could not process this image: {result.processing_error}</Alert>}
                         {result.issues && result.issues.length > 0 ? (
                           <List dense>
                             {result.issues.map((issue) => (
                               <ListItem key={issue.id} disablePadding>
                                 <ListItemIcon sx={{ minWidth: 35 }}>
                                    <Chip label={issue.severity} size="small" color={getSeverityColor(issue.severity)} sx={{ mr: 1 }} />
                                 </ListItemIcon>
                                 <ListItemText 
                                   primary={issue.label}
                                   secondary={issue.location}
                                 />
                               </ListItem>
                             ))}
                           </List>
                         ) : (
                           !result.analysis_error && !result.processing_error && <Typography variant="body2" color="text.secondary">No issues detected.</Typography>
                         )}
                       </CardContent>
                     </Card>
                   </Grid>
                 ))}
               </Grid>
             </Box>
           )}

           {/* Repair Estimate Section */}
           {repairEstimate && (
             <Box sx={{ mt: 4 }}>
               <Typography variant="h5" gutterBottom component="h2" sx={{ display: 'flex', alignItems: 'center' }}>
                   <PriceCheckIcon sx={{ mr: 1 }} /> Estimated Repair Costs (Placeholders)
               </Typography>
               <Paper elevation={2} sx={{ p: 2 }}>
                    <TableContainer>
                       <Table size="small">
                           <TableHead>
                               <TableRow>
                                   <TableCell>Task</TableCell>
                                   <TableCell align="right">Estimated Cost</TableCell>
                               </TableRow>
                           </TableHead>
                           <TableBody>
                               {repairEstimate.lineItems && repairEstimate.lineItems.map((item) => (
                                   <TableRow key={item.issueId}>
                                       <TableCell component="th" scope="row">
                                           {item.task}
                                       </TableCell>
                                       <TableCell align="right">${item.estimatedCost.toFixed(2)}</TableCell>
                                   </TableRow>
                               ))}
                                <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
                                   <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                                       Total Estimated Cost
                                   </TableCell>
                                   <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                        ${repairEstimate.totalEstimatedCost ? repairEstimate.totalEstimatedCost.toFixed(2) : '0.00'}
                                   </TableCell>
                               </TableRow>
                           </TableBody>
                       </Table>
                   </TableContainer>
                   {repairEstimate.notes && (
                       <Typography variant="caption" display="block" sx={{ mt: 1.5, fontStyle: 'italic', color: 'text.secondary' }}>
                           Note: {repairEstimate.notes}
                       </Typography>
                   )}
               </Paper>
             </Box>
           )}

        </Grid>
      </Grid>
    </Container>
  );
};

export default PhotoInspectionPage; 