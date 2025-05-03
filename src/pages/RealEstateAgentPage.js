import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { auth } from '../firebase/config'; // Import Firebase auth
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  CircularProgress,
  TextField,
  Switch,
  FormControlLabel,
  Slider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Divider,
  Alert
} from '@mui/material';
import { 
    FileUpload as FileUploadIcon, 
    Clear as ClearIcon, 
    Pets as PetsIcon, 
    AttachMoney as AttachMoneyIcon,
    SmokingRooms as SmokingRoomsIcon,
    NoSmoking as NoSmokingIcon,
    Description as DescriptionIcon, // For non-image files
    Image as ImageIcon // For image files
} from '@mui/icons-material';

// Helper function to format currency (optional, but nice)
const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
};

const RealEstateAgentPage = () => {
  // File Upload State
  const [files, setFiles] = useState([]);
  
  // Structured Preferences State
  const [preferences, setPreferences] = useState({
    petFriendly: false,
    smokingAllowed: false,
    incomeRange: [30000, 80000], // Example range [min, max]
    notes: '', // Add a general notes field if needed
  });
  
  // API/UI State
  const [extractedInfo, setExtractedInfo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // --- File Upload Logic (react-dropzone) ---
  const onDrop = useCallback((acceptedFiles, fileRejections) => {
    setError(''); // Clear previous errors
    
    const newFiles = acceptedFiles.map(file => Object.assign(file, {
        preview: URL.createObjectURL(file) // Create preview URL for images
    }));
    
    setFiles(prevFiles => {
        // Combine, check limit, and remove duplicates by name
        const combined = [...prevFiles, ...newFiles];
        const uniqueFiles = combined.filter((file, index, self) => 
            index === self.findIndex((f) => f.name === file.name)
        );
        const limitedFiles = uniqueFiles.slice(0, 5); 
        
        if (uniqueFiles.length > 5) {
            setError('Maximum 5 files allowed. Some files were not added.');
        }
        // Revoke URLs for files that are *not* in the final limited list to prevent memory leaks
        combined.forEach(file => {
            if (!limitedFiles.some(lf => lf.name === file.name)) {
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
    accept: { // More specific using MIME types
        'image/jpeg': [],
        'image/png': [],
        'application/pdf': [],
        'application/msword': [],
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [],
        'text/plain': []
    },
    maxSize: 10 * 1024 * 1024, // Example: 10MB limit per file
    maxFiles: 5, // Though we handle limit in onDrop, this adds native validation
  });
  
  const handleRemoveFile = (fileName) => {
    setFiles((prevFiles) => {
        const updatedFiles = prevFiles.filter(file => {
             if (file.name === fileName) {
                 URL.revokeObjectURL(file.preview); // Revoke URL when removing
                 return false;
             }
             return true;
        });
        return updatedFiles;
    });
  };

  // Revoke object URLs on component unmount
  useEffect(() => {
    return () => files.forEach(file => URL.revokeObjectURL(file.preview));
  }, [files]);
  // --- End File Upload Logic ---

  // --- Preferences Form Logic ---
  const handlePreferenceChange = (event) => {
    const { name, value, type, checked } = event.target;
    setPreferences(prev => ({
      ...prev,
      [name]: type === 'checkbox' || type === 'switch' ? checked : value,
    }));
  };

  const handleSliderChange = (event, newValue) => {
     setPreferences(prev => ({
         ...prev,
         incomeRange: newValue,
     }));
  };
  // --- End Preferences Form Logic ---

  // --- API Submission Logic ---
  const handleSubmit = async () => {
    // Basic validation (can be enhanced)
    if (files.length === 0 && !preferences.notes?.trim() && preferences.incomeRange[0] === 30000 && preferences.incomeRange[1] === 80000) {
      setError('Please upload relevant files or specify some tenant preferences.');
      return;
    }
    setIsLoading(true);
    setError('');
    setExtractedInfo('');

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated. Please log in.');
      }
      const token = await user.getIdToken();

      const formData = new FormData();
      
      // Append structured preferences as a JSON string
      formData.append('tenantPreferences', JSON.stringify(preferences));

      // Append files
      files.forEach((file) => {
        formData.append('documents', file, file.name);
      });

      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8081'; 
      const response = await fetch(`${apiUrl}/api/real-estate/analyze`, { 
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
             error: `Request failed with status: ${response.status}` 
        }));
        throw new Error(errorData.error || 'Failed to process request');
      }

      const result = await response.json();

      if (!result.success || !result.extractedInfo) {
          throw new Error(result.error || 'API did not return the expected information.');
      }

      setExtractedInfo(result.extractedInfo); 

    } catch (apiError) {
      console.error("Error processing request:", apiError);
      if (apiError.message.includes('User not authenticated')) {
           setError('Authentication error. Please log in again.');
      } else {
           setError(`Failed to process the request: ${apiError.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };
  // --- End API Submission Logic ---

  // --- Render Logic ---
  const renderFilePreview = (file) => {
      const isImage = file.type.startsWith('image/');
      return (
          <ListItem 
            key={file.name}
            secondaryAction={
              <IconButton edge="end" aria-label="delete" onClick={() => handleRemoveFile(file.name)} disabled={isLoading}>
                <ClearIcon />
              </IconButton>
            }
          >
            <ListItemIcon>
              {isImage ? (
                <img src={file.preview} alt={file.name} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: '4px' }} />
              ) : (
                 // Could use different icons based on file.type
                 <DescriptionIcon /> 
              )}
            </ListItemIcon>
            <ListItemText 
                primary={file.name} 
                secondary={`${(file.size / 1024).toFixed(1)} KB`} 
            />
          </ListItem>
      );
  };

  return (
    // Use Box with paddingBottom to prevent content from being hidden by sticky footer
    <Box sx={{ pb: 10 /* Adjust padding to accommodate footer height */ }}> 
      <Typography variant="h4" component="h1" gutterBottom>
        Real Estate Agent Portal (Landlord)
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Define your ideal tenant preferences and upload relevant property documents or images.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        {/* Preferences Form Section */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Tenant Preferences</Typography>
            <Grid container spacing={2} alignItems="center">
                 <Grid item xs={6}>
                    <FormControlLabel 
                        control={
                            <Switch 
                                checked={preferences.petFriendly} 
                                onChange={handlePreferenceChange} 
                                name="petFriendly" 
                                disabled={isLoading}
                            />
                        } 
                        label="Pet Friendly" 
                    />
                 </Grid>
                 <Grid item xs={6}>
                    <FormControlLabel 
                        control={
                            <Switch 
                                checked={preferences.smokingAllowed} 
                                onChange={handlePreferenceChange} 
                                name="smokingAllowed" 
                                color="warning"
                                disabled={isLoading}
                            />
                        } 
                        label="Smoking Allowed" 
                    />
                 </Grid>
                 <Grid item xs={12}>
                     <Typography gutterBottom>Desired Monthly Income Range</Typography>
                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                         <Typography sx={{ minWidth: '80px' }}>{formatCurrency(preferences.incomeRange[0])}</Typography>
                         <Slider
                            value={preferences.incomeRange}
                            onChange={handleSliderChange}
                            valueLabelDisplay="auto"
                            getAriaLabel={() => 'Income range slider'}
                            valueLabelFormat={formatCurrency}
                            min={10000}
                            max={200000}
                            step={5000}
                            marks={[ { value: 100000, label: formatCurrency(100000) } ]}
                            disabled={isLoading}
                            sx={{ mx: 1 }}
                         />
                         <Typography sx={{ minWidth: '80px' }}>{formatCurrency(preferences.incomeRange[1])}</Typography>
                     </Box>
                 </Grid>
                 <Grid item xs={12}>
                     <TextField
                        fullWidth
                        multiline
                        rows={4}
                        variant="outlined"
                        label="Additional Notes / Preferences"
                        name="notes"
                        value={preferences.notes}
                        onChange={handlePreferenceChange}
                        placeholder="e.g., Minimum credit score, lease duration preference, specific background checks..."
                        disabled={isLoading}
                    />
                 </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* File Upload Section */}
        <Grid item xs={12} md={6}>
          <Paper 
            {...getRootProps()} 
            elevation={0} 
            sx={{ 
                p: 3, 
                border: '2px dashed', 
                borderColor: isDragActive ? 'primary.main' : 'grey.400', 
                textAlign: 'center', 
                cursor: 'pointer',
                backgroundColor: isDragActive ? 'action.hover' : 'background.default',
                minHeight: '200px', // Ensure dropzone has some height
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
            }}
          >
            <input {...getInputProps()} />
            <FileUploadIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }}/>
            {isDragActive ? (
              <Typography>Drop the files here ...</Typography>
            ) : (
              <Typography>Drag 'n' drop files here, or click to select (Max 5)</Typography>
            )}
             <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                (Images, PDF, DOCX, TXT accepted, max 10MB each)
             </Typography>
          </Paper>
          {/* File Preview List */}
          {files.length > 0 && (
              <Paper elevation={1} sx={{ mt: 2, p: 1 }}>
                 <List dense>
                     {files.map(renderFilePreview)}
                 </List>
              </Paper>
          )}
        </Grid>

        {/* Results Section */}
        {extractedInfo && (
           <Grid item xs={12}>
              <Paper elevation={1} sx={{ mt: 3, p: 3, bgcolor: 'grey.50' }}>
                <Typography variant="h6" gutterBottom>Analysis Results</Typography>
                <Box component="pre" sx={{ 
                    whiteSpace: 'pre-wrap', 
                    wordWrap: 'break-word', 
                    fontFamily: 'monospace', 
                    bgcolor: '#eee', 
                    p: 2, 
                    borderRadius: 1,
                    maxHeight: '400px', // Limit result height
                    overflowY: 'auto' 
                }}>
                    {extractedInfo}
                </Box>
              </Paper>
            </Grid>
        )}
      </Grid>

      {/* Sticky Footer for Action Button */}
      <Paper 
        elevation={3} 
        sx={{ 
            position: 'fixed', // Changed to fixed for consistent behavior
            bottom: 0, 
            left: 0, 
            right: 0, 
            p: 2, 
            bgcolor: 'background.paper', 
            zIndex: 1100, // Ensure it's above other content, adjust if needed
            borderTop: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'flex-end' // Align button to the right
        }}
      >
        <Button
          variant="contained"
          size="large"
          onClick={handleSubmit}
          disabled={isLoading || (files.length === 0 && !preferences.notes?.trim())} // Adjust condition based on minimum required input
          startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {isLoading ? 'Processing...' : 'Analyze Preferences'}
        </Button>
        {/* Add "Save Draft" button here if needed later */}
      </Paper>
    </Box>
  );
};

export default RealEstateAgentPage; 