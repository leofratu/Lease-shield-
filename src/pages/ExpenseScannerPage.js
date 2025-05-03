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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Container
} from '@mui/material';
import { 
    FileUpload as FileUploadIcon, 
    Clear as ClearIcon, 
    Description as DescriptionIcon,
    ReceiptLong as ReceiptIcon, // Icon for receipts/invoices
    BarChart as BarChartIcon, // Icon for charts
    Calculate as CalculateIcon // Icon for calculations
} from '@mui/icons-material';

// Placeholder function - replace with actual API call logic
const fetchScannedData = async (formData, token) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500)); 

    // Simulate API response
    // In a real scenario, this would come from your backend after processing
    const mockExtractedData = {
        vendor: "Example Hardware Store",
        date: "2024-03-10",
        items: [
            { description: "Paint", amount: 45.50, category: "Repairs" },
            { description: "Light Fixture", amount: 89.99, category: "Repairs" },
        ],
        subtotal: 135.49,
        tax: 10.84,
        total: 146.33,
        category: "Repairs & Maintenance" // Overall category guess
    };
    
    // Simulate success or failure randomly for testing
    if (Math.random() > 0.1) { // 90% success rate
        return { success: true, extractedData: mockExtractedData };
    } else {
        return { success: false, error: "Failed to parse the document. Please try a clearer image or PDF." };
    }
};


const ExpenseScannerPage = () => {
  // File Upload State
  const [files, setFiles] = useState([]);
  
  // API/UI State
  const [extractedData, setExtractedData] = useState(null); // Store extracted invoice details
  const [isScanning, setIsScanning] = useState(false); // Renamed from isLoading for clarity
  const [isSaving, setIsSaving] = useState(false); // State for ledger saving
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState(''); // For success feedback

  // --- File Upload Logic (react-dropzone) ---
  const onDrop = useCallback((acceptedFiles, fileRejections) => {
    setError(''); 
    setSuccessMessage('');
    setExtractedData(null);
    
    const newFiles = acceptedFiles.map(file => Object.assign(file, {
        preview: URL.createObjectURL(file) // Create preview URL if needed (less relevant for non-images)
    }));
    
    setFiles(prevFiles => {
        // Combine, check limit, and remove duplicates by name
        const combined = [...prevFiles, ...newFiles];
        const uniqueFiles = combined.filter((file, index, self) => 
            index === self.findIndex((f) => f.name === file.name)
        );
        // Limit to a reasonable number, e.g., 5 for now
        const limitedFiles = uniqueFiles.slice(0, 5); 
        
        if (uniqueFiles.length > 5) {
            setError('Maximum 5 files allowed per scan. Some files were not added.');
        }
        // Revoke URLs if previews were generated and files are removed
        combined.forEach(file => {
            if (!limitedFiles.some(lf => lf.name === file.name) && file.preview) {
                URL.revokeObjectURL(file.preview);
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
    accept: { // Accept common document/image types for invoices/receipts
        'image/jpeg': [],
        'image/png': [],
        'application/pdf': [],
        // Add other relevant types if needed: 'image/tiff', 'image/heic' etc.
    },
    maxSize: 15 * 1024 * 1024, // Example: 15MB limit per file
    maxFiles: 5, 
  });
  
  const handleRemoveFile = (fileName) => {
    setFiles((prevFiles) => {
        const updatedFiles = prevFiles.filter(file => {
             if (file.name === fileName) {
                 if (file.preview) URL.revokeObjectURL(file.preview); // Revoke URL if exists
                 return false;
             }
             return true;
        });
        return updatedFiles;
    });
  };

  // Revoke object URLs on component unmount
  useEffect(() => {
    return () => files.forEach(file => {
        if (file.preview) URL.revokeObjectURL(file.preview)
    });
  }, [files]);
  // --- End File Upload Logic ---

  // --- API Submission Logic ---
  const handleSubmit = async () => {
    if (files.length === 0) {
      setError('Please upload at least one invoice or receipt file.');
      return;
    }
    setIsScanning(true); // Use specific state
    setError('');
    setSuccessMessage('');
    setExtractedData(null);

    try {
      // Optional: Get user token if API requires authentication
      const user = auth.currentUser;
      let token = null;
      if (user) {
           token = await user.getIdToken();
      }
      // else {
      //   // Handle case where user is not logged in if endpoint is protected
      //   throw new Error('User not authenticated.');
      // }

      const formData = new FormData();
      
      // Append files
      files.forEach((file) => {
        // Use a consistent field name for the backend
        formData.append('documents', file, file.name); 
      });

      // --- IMPORTANT: Replace with actual API call ---
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8081'; 
      // Define the SPECIFIC endpoint for expense scanning
      const scanEndpoint = `${apiUrl}/api/scan-expense`; 
      console.log('Scanning Endpoint:', scanEndpoint);

      const response = await fetch(scanEndpoint, {
          method: 'POST',
          headers: {
              // Include auth token if required by the backend
              ...(token && { 'Authorization': `Bearer ${token}` }), 
              // No 'Content-Type': 'multipart/form-data', Fetch API sets it automatically for FormData
          },
          body: formData,
      });

      // const result = await fetchScannedData(formData, token); // Using placeholder for now

       if (!response.ok) {
           const errorText = await response.text(); // Get error text from backend if possible
           throw new Error(errorText || `Request failed with status: ${response.status}`);
       }
      
       const result = await response.json(); // Assuming backend sends JSON

      // --- End IMPORTANT Section ---

      if (!result.success || !result.extractedData) {
          throw new Error(result.error || 'API did not return the expected scan data.');
      }

      setExtractedData(result.extractedData); // Store the successful result

    } catch (apiError) {
      console.error("Error processing scan request:", apiError);
      setError(`Failed to process scan: ${apiError.message}`);
    } finally {
      setIsScanning(false); // Use specific state
    }
  };
  // --- End API Submission Logic ---

  // --- Add to Ledger Logic (Placeholder) ---
  const handleAddToLedger = async () => {
      if (!extractedData) {
          setError('No extracted data to save.');
          return;
      }
      setIsSaving(true);
      setError('');
      setSuccessMessage('');
      console.log("Attempting to save to ledger:", extractedData);

      try {
          // ** TODO: Implement actual API call to backend endpoint **
          // Example: 
          // const ledgerEndpoint = `${apiUrl}/api/add-expense-to-ledger`;
          // const response = await fetch(ledgerEndpoint, { 
          //     method: 'POST', 
          //     headers: { 'Content-Type': 'application/json', ...(token && { 'Authorization': `Bearer ${token}` }) },
          //     body: JSON.stringify(extractedData) 
          // });
          // if (!response.ok) throw new Error('Failed to save to ledger');
          // const saveResult = await response.json();
          // if (!saveResult.success) throw new Error(saveResult.error || 'Backend error saving to ledger');

          // Simulate API call success
          await new Promise(resolve => setTimeout(resolve, 800)); 
          setSuccessMessage('Expense successfully added to ledger!');
          console.log("Expense added to ledger (Simulated).");
          // Optionally clear the form/results after successful save
          // setExtractedData(null);
          // setFiles([]); 

      } catch (saveError) {
          console.error("Error saving to ledger:", saveError);
          setError(`Failed to save to ledger: ${saveError.message}`);
      } finally {
          setIsSaving(false);
      }
  };
  // --- End Add to Ledger Logic ---

  // --- Render Logic ---
  const renderFilePreview = (file) => {
      return (
          <ListItem 
            key={file.name}
            secondaryAction={
              <IconButton edge="end" aria-label="delete" onClick={() => handleRemoveFile(file.name)} disabled={isScanning || isSaving}>
                <ClearIcon />
              </IconButton>
            }
          >
            <ListItemIcon>
                 <DescriptionIcon /> 
            </ListItemIcon>
            <ListItemText 
                primary={file.name} 
                secondary={`${(file.size / 1024).toFixed(1)} KB`} 
            />
          </ListItem>
      );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4, pb: 10 }}> 
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
        AI-Powered Invoice & Expense Scanner
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Upload receipts or invoices (PDF, JPG, PNG). The AI will extract key details, categorize expenses, and prepare them for your ledger automatically.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {successMessage && <Alert severity="success" sx={{ mb: 3 }}>{successMessage}</Alert>}

      <Grid container spacing={4}>
        {/* File Upload & Action Column */}
        <Grid item xs={12} md={5}>
           {/* File Upload */}
           <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>1. Upload Documents</Typography>
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
                  <Typography>Drop the files here ...</Typography>
                ) : (
                  <Typography>Drag & drop invoices/receipts here, or click to select (Max 5 files)</Typography>
                )}
                <Typography variant="caption" display="block" color="text.secondary">PDF, JPG, PNG accepted. Max 15MB each.</Typography>
              </Box>
              {files.length > 0 && (
                <>
                  <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Files Queued:</Typography>
                  <List dense>{files.map(renderFilePreview)}</List>
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
                 disabled={isScanning || isSaving || files.length === 0} 
                 startIcon={isScanning ? <CircularProgress size={20} color="inherit" /> : <ReceiptIcon />}
                 sx={{ minWidth: '200px', py: 1.5 }}
               >
                 {isScanning ? 'Scanning...' : 'Scan Expenses'}
               </Button>
            </Box>
        </Grid>

        {/* Results & Dashboard Column */}
        <Grid item xs={12} md={7}>
           {/* Extracted Data Section */}
           <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>2. Extracted Information</Typography>
              {isScanning && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 150 }}>
                      <CircularProgress />
                      <Typography sx={{ ml: 2 }}>Analyzing document...</Typography>
                  </Box>
              )}
              {!isScanning && !extractedData && (
                 <Typography color="text.secondary" sx={{ textAlign: 'center', minHeight: 150, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     Scan results will appear here after processing.
                 </Typography>
              )}
              {extractedData && (
                 <Box>
                    {/* TODO: Consider adding Edit buttons here for user correction */}
                    <Typography variant="subtitle1"><strong>Vendor:</strong> {extractedData.vendor || 'N/A'}</Typography>
                    <Typography variant="subtitle1"><strong>Date:</strong> {extractedData.date || 'N/A'}</Typography>
                    <Typography variant="subtitle1"><strong>Category Guess:</strong> {extractedData.category || 'N/A'}</Typography>
                    <Divider sx={{ my: 2 }} />
                    
                    {extractedData.items && extractedData.items.length > 0 && (
                        <>
                         <Typography variant="subtitle2" sx={{ mb: 1 }}><strong>Line Items:</strong></Typography>
                         <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 200, overflowY: 'auto' }}>
                             <Table size="small" stickyHeader>
                                 <TableHead>
                                     <TableRow>
                                         <TableCell>Description</TableCell>
                                         <TableCell align="right">Amount</TableCell>
                                         <TableCell>Category</TableCell>
                                     </TableRow>
                                 </TableHead>
                                 <TableBody>
                                     {extractedData.items.map((item, index) => (
                                         <TableRow key={index}>
                                             <TableCell>{item.description}</TableCell>
                                             <TableCell align="right">${item.amount?.toFixed(2)}</TableCell>
                                             <TableCell>{item.category || 'Uncategorized'}</TableCell>
                                         </TableRow>
                                     ))}
                                 </TableBody>
                             </Table>
                         </TableContainer>
                        </>
                    )}

                     <Divider sx={{ my: 2 }} />
                     <Typography variant="body1" align="right"><strong>Subtotal:</strong> ${extractedData.subtotal?.toFixed(2) || '0.00'}</Typography>
                     <Typography variant="body1" align="right"><strong>Tax:</strong> ${extractedData.tax?.toFixed(2) || '0.00'}</Typography>
                     <Typography variant="h6" align="right"><strong>Total:</strong> ${extractedData.total?.toFixed(2) || '0.00'}</Typography>
                     {/* Add Payment Terms if extracted */}
                     {extractedData.paymentTerms && <Typography variant="body2" align="right" sx={{ mt: 1 }}>Payment Terms: {extractedData.paymentTerms}</Typography>}

                     <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button 
                           variant="contained" // Changed to contained for primary action
                           color="secondary" // Use secondary color 
                           size="small"
                           onClick={handleAddToLedger}
                           disabled={isSaving || isScanning || !extractedData}
                           startIcon={isSaving ? <CircularProgress size={14} color="inherit" /> : null}
                        >
                            {isSaving ? 'Saving...' : 'Add to Ledger'}
                         </Button> 
                     </Box>
                 </Box>
              )}
           </Paper>

           {/* Real-time Dashboard Placeholder */}
           <Paper elevation={2} sx={{ p: 3, opacity: extractedData ? 1 : 0.5 /* Fade out if no data */ }}>
             <Typography variant="h6" gutterBottom>3. Real-time Expense Dashboard (Placeholder)</Typography>
             <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                   <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <BarChartIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="subtitle1">Monthly Expenses</Typography>
                   </Box>
                   <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                       {/* TODO: Fetch historical expense data and render a chart (e.g., using Recharts BarChart) */}
                       Visual showing expense trends over the last 6-12 months.
                   </Typography>
                    <Box sx={{ height: 150, bgcolor: 'grey.200', borderRadius: 1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection: 'column' }}>
                        <BarChartIcon color="disabled"/>
                        <Typography variant="caption" color="text.secondary">Monthly Expense Chart Area</Typography>
                    </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                   <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <BarChartIcon sx={{ mr: 1, color: 'secondary.main' }} /> {/* Using BarChart temporarily, maybe PieChart later */}
                      <Typography variant="subtitle1">Expense Categories</Typography>
                   </Box>
                   <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {/* TODO: Aggregate expenses by category and render a chart (e.g., Recharts PieChart) */}
                      Breakdown of spending by category (Repairs, Utilities, Taxes, etc.).
                   </Typography>
                   <Box sx={{ height: 150, bgcolor: 'grey.200', borderRadius: 1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection: 'column' }}>
                      <BarChartIcon color="disabled" />{/* <PieChartIcon color="disabled"/> */}
                      <Typography variant="caption" color="text.secondary">Category Breakdown Chart Area</Typography>
                   </Box>
                </Grid>
                <Grid item xs={12}>
                   <Divider sx={{ my: 2 }} />
                   <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <CalculateIcon sx={{ mr: 1, color: 'success.main' }} />
                      <Typography variant="subtitle1">Key Metrics (Requires Ledger Data)</Typography>
                   </Box>
                   {/* TODO: Fetch income data and calculate these metrics */}
                   <Typography variant="body2" color="text.secondary"><strong>Net Operating Income (NOI):</strong> [Requires Rent Income - Total Expenses]</Typography>
                   <Typography variant="body2" color="text.secondary"><strong>Expense vs. Income Variance:</strong> [Requires Rent Income vs Total Expenses comparison]</Typography>
                   <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                       (These calculations depend on having both income and full expense data stored in your ledger.)
                   </Typography>
                </Grid>
             </Grid>
           </Paper>

        </Grid>
      </Grid>
    </Container>
  );
};

export default ExpenseScannerPage; 