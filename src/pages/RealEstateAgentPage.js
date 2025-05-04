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
  Alert,
  FormGroup
} from '@mui/material';
import { 
    FileUpload as FileUploadIcon, 
    Clear as ClearIcon, 
    Description as DescriptionIcon // For non-image files
} from '@mui/icons-material';

// Helper function to format currency (optional, but nice)
const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
};

const RealEstateAgentPage = () => {
  // File Upload State
  const [files, setFiles] = useState([]);
  
  // Structured Preferences State
  const [structuredPreferences, setStructuredPreferences] = useState({
    petFriendly: false,
    smokingAllowed: false,
    rentRange: [1000, 3000], // Renamed from incomeRange, adjusted defaults
    leaseDurationMonths: 12, // Added
    maxOccupants: '',        // Added
    minCreditScore: '',      // Added
    parkingRequired: false,   // Added
    furnishedRequired: false, // Added
    utilitiesIncluded: { // Add new detailed preference
        water: false,
        gas: false,
        electricity: false,
        internet: false,
    },
    laundryType: 'none', // Add new preference: 'none', 'in_unit', 'shared'
    notes: '', 
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

    // Handle nested state for utilitiesIncluded
    if (name.startsWith('utilitiesIncluded.')) {
      const utilityName = name.split('.')[1];
      setStructuredPreferences(prev => ({
        ...prev,
        utilitiesIncluded: {
          ...prev.utilitiesIncluded,
          [utilityName]: checked
        }
      }));
    } else {
      setStructuredPreferences(prev => ({
        ...prev,
        [name]: type === 'checkbox' || type === 'switch' ? checked : value,
      }));
    }
  };

  const handleSliderChange = (event, newValue) => {
     setStructuredPreferences(prev => ({
         ...prev,
         rentRange: newValue,
     }));
  };
  // --- End Preferences Form Logic ---

  // --- API Submission Logic ---
  const handleSubmit = async () => {
    // Identify files for different analysis types
    const filesForTextAnalysis = files.filter(
        file => file.type === 'application/pdf' || file.type === 'text/plain'
    );
    const filesForImageAnalysis = files.filter(
        file => file.type === 'image/jpeg' || file.type === 'image/png'
    );

    // Determine primary file type for submission
    let analysisType = 'none';
    let fileToSubmit = null;

    if (filesForTextAnalysis.length > 0) {
        analysisType = 'text';
        fileToSubmit = filesForTextAnalysis[0];
    } else if (filesForImageAnalysis.length > 0) {
        analysisType = 'image';
        fileToSubmit = filesForImageAnalysis[0];
    }

    // Basic validation
    if (analysisType === 'none' && !structuredPreferences.notes?.trim()) {
        setError('Please upload a relevant property document (PDF/TXT), an image (JPG/PNG), or specify key tenant preferences.');
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

        // Append structured preferences (optional, but good practice if backend uses them)
        // formData.append('tenantPreferences', JSON.stringify(structuredPreferences));

        let endpoint = '';
        let fileKey = '';

        if (analysisType === 'text') {
            endpoint = '/api/analyze';
            fileKey = 'leaseFile'; // Key expected by the text analysis endpoint
            formData.append(fileKey, fileToSubmit, fileToSubmit.name);
            console.log(`Appending ${fileToSubmit.name} (${fileToSubmit.type}) for TEXT analysis.`);
        } else if (analysisType === 'image') {
            endpoint = '/api/analyze-image'; // Hypothetical endpoint for image analysis
            fileKey = 'imageFile'; // Choose a key for the image endpoint, e.g., 'imageFile'
            formData.append(fileKey, fileToSubmit, fileToSubmit.name);
            console.log(`Appending ${fileToSubmit.name} (${fileToSubmit.type}) for IMAGE analysis.`);
        } else {
            // Handle case where only preferences are submitted (if supported by backend)
            // For now, we assume an endpoint is needed if isLoading is true
            // Or, perhaps call a different endpoint like '/api/save-preferences'
            console.log("Submitting preferences only (no file analysis).");
             // If you have a dedicated endpoint for saving preferences without files:
             // endpoint = '/api/save-preferences';
             // Or adjust logic if submitting without files isn't intended to hit an API here.
             // Let's assume for now we only proceed if there's a file to analyze:
             if (!fileToSubmit) {
                 // Example: Save preferences locally or call a specific preferences endpoint
                 // For demo, let's just stop loading and show success message (needs backend alignment)
                 console.log("Simulating preference save without backend call.");
                 setExtractedInfo("Preferences noted (no document/image analyzed)."); // Placeholder feedback
                 setIsLoading(false);
                 return; // Exit early if only preferences and no dedicated endpoint call needed here
             }
        }

        if (!endpoint) {
             // Should not happen if logic above is correct, but safety check
              throw new Error("Could not determine the correct API endpoint.");
        }


        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8081';
        console.log(`Calling API URL: ${apiUrl}${endpoint}`);
        const response = await fetch(`${apiUrl}${endpoint}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                // Content-Type is set automatically by browser for FormData
            },
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({
                error: `Request failed with status: ${response.status}`
            }));
            // Try to get more specific error from backend if available
            const backendError = errorData.error || errorData.message || `Request failed with status: ${response.status}`;
            throw new Error(backendError);
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
        Define your ideal tenant preferences and upload relevant property documents or images. Our AI will analyze these to match potential tenants and highlight key lease points.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        {/* File Upload Section */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Upload Property Documents/Images</Typography>
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
                <Typography>Drag 'n' drop up to 5 files here (PDF, DOCX, JPG, PNG), or click to select</Typography>
              )}
              <Typography variant="caption" display="block" color="text.secondary">Max 10MB per file</Typography>
            </Box>
            {files.length > 0 && (
              <>
                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Uploaded Files:</Typography>
                <List dense>{files.map(renderFilePreview)}</List>
              </>
            )}
          </Paper>
        </Grid>

        {/* Tenant Preferences Section */}
        <Grid item xs={12} md={6}>
          {/* Wrap preferences in a Paper component */}
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Define Ideal Tenant Preferences</Typography>

            {/* Use FormGroup for better layout */}
            <FormGroup>
              {/* Rent Range Slider */}
              <Typography gutterBottom sx={{ mt: 2 }}>Desired Monthly Rent Range:</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                 <Typography sx={{ minWidth: '70px' }}>{formatCurrency(structuredPreferences.rentRange[0])}</Typography>
                 <Slider
                   name="rentRange" // Name isn't directly used by handler but good practice
                   value={structuredPreferences.rentRange}
                   onChange={handleSliderChange}
                   valueLabelDisplay="auto"
                   valueLabelFormat={formatCurrency}
                   min={500}
                   max={10000}
                   step={100}
                   sx={{ mx: 1 }}
                   disabled={isLoading}
                 />
                 <Typography sx={{ minWidth: '70px' }}>{formatCurrency(structuredPreferences.rentRange[1])}</Typography>
               </Box>

              {/* Switches for Boolean Preferences */}
              <FormControlLabel
                control={<Switch checked={structuredPreferences.petFriendly} onChange={handlePreferenceChange} name="petFriendly" disabled={isLoading} />}
                label="Pets Allowed"
                sx={{ mt: 1 }}
              />
              <FormControlLabel
                control={<Switch checked={structuredPreferences.smokingAllowed} onChange={handlePreferenceChange} name="smokingAllowed" disabled={isLoading} />}
                label="Smoking Allowed"
              />
               <FormControlLabel
                control={<Switch checked={structuredPreferences.parkingRequired} onChange={handlePreferenceChange} name="parkingRequired" disabled={isLoading} />}
                label="Requires Parking"
              />
               <FormControlLabel
                control={<Switch checked={structuredPreferences.furnishedRequired} onChange={handlePreferenceChange} name="furnishedRequired" disabled={isLoading} />}
                label="Requires Furnished"
              />

              {/* Text Fields for Numeric/String Preferences */}
               <TextField
                  label="Minimum Lease Duration (Months)"
                  name="leaseDurationMonths"
                  type="number"
                  value={structuredPreferences.leaseDurationMonths}
                  onChange={handlePreferenceChange}
                  variant="outlined"
                  size="small"
                  fullWidth
                  margin="normal"
                  disabled={isLoading}
                  inputProps={{ min: "1" }} // Basic validation
               />
               <TextField
                 label="Maximum Occupants"
                 name="maxOccupants"
                 type="number"
                 value={structuredPreferences.maxOccupants}
                 onChange={handlePreferenceChange}
                 variant="outlined"
                 size="small"
                 fullWidth
                 margin="normal"
                 disabled={isLoading}
                 inputProps={{ min: "1" }} // Basic validation
               />
               <TextField
                 label="Minimum Credit Score (Optional)"
                 name="minCreditScore"
                 type="number"
                 value={structuredPreferences.minCreditScore}
                 onChange={handlePreferenceChange}
                 variant="outlined"
                 size="small"
                 fullWidth
                 margin="normal"
                 disabled={isLoading}
                 inputProps={{ min: "300", max: "850" }} // Basic validation
               />

              {/* Utilities Section */}
              <Typography gutterBottom sx={{ mt: 2 }}>Utilities Included:</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                 <FormControlLabel control={<Switch size="small" checked={structuredPreferences.utilitiesIncluded.water} onChange={handlePreferenceChange} name="utilitiesIncluded.water" />} label="Water" />
                 <FormControlLabel control={<Switch size="small" checked={structuredPreferences.utilitiesIncluded.gas} onChange={handlePreferenceChange} name="utilitiesIncluded.gas" />} label="Gas" />
                 <FormControlLabel control={<Switch size="small" checked={structuredPreferences.utilitiesIncluded.electricity} onChange={handlePreferenceChange} name="utilitiesIncluded.electricity" />} label="Electricity" />
                 <FormControlLabel control={<Switch size="small" checked={structuredPreferences.utilitiesIncluded.internet} onChange={handlePreferenceChange} name="utilitiesIncluded.internet" />} label="Internet" />
              </Box>

              {/* Laundry Type - Example using Radio or Select, here simplified with TextField for now */}
               <TextField
                 label="Laundry Availability (e.g., In-Unit, Shared, None)"
                 name="laundryType" // Consider changing to a Select or Radio group later
                 value={structuredPreferences.laundryType}
                 onChange={handlePreferenceChange}
                 variant="outlined"
                 size="small"
                 fullWidth
                 margin="normal"
                 disabled={isLoading}
                 helperText="Specify laundry situation"
               />

              {/* Notes Text Field */}
              <TextField
                label="Other Preferences/Notes"
                name="notes"
                value={structuredPreferences.notes}
                onChange={handlePreferenceChange}
                multiline
                rows={3}
                variant="outlined"
                fullWidth
                margin="normal"
                disabled={isLoading}
                placeholder="e.g., No loud parties, specific move-in date requirements..."
              />
            </FormGroup> {/* End FormGroup */}
          </Paper> {/* End Preferences Paper */}
        </Grid>

        {/* Submission and Results Section */}
        <Grid item xs={12}>
           <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
             <Button
               variant="contained"
               color="primary"
               size="large"
               onClick={handleSubmit}
               disabled={isLoading || (files.length === 0 && !structuredPreferences.notes?.trim())} // Disable if loading or nothing to submit
               startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
             >
               {isLoading ? 'Processing...' : (files.length > 0 ? 'Analyze Document/Image' : 'Save Preferences')}
             </Button>
           </Box>
        </Grid>

        {extractedInfo && (
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 3, mt: 3 }}>
              <Typography variant="h6" gutterBottom>Analysis Results</Typography>
              <Typography component="pre" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', backgroundColor: '#f5f5f5', p: 2, borderRadius: 1 }}>
                {/* Check if it's an image summary or structured JSON */}
                {typeof extractedInfo?.image_summary === 'string' 
                  ? extractedInfo.image_summary 
                  : JSON.stringify(extractedInfo, null, 2)}
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default RealEstateAgentPage; 