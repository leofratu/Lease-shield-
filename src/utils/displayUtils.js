import { Chip } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';

// Color based on score (0-100)
export const getScoreColor = (score) => {
  if (score === null || score === undefined) return 'grey.400';
  if (score < 40) return 'error.main';
  if (score < 70) return 'warning.main';
  return 'success.main';
};

// Severity text based on score
export const getScoreSeverityText = (score) => {
  if (score === null || score === undefined) return 'N/A';
  if (score < 40) return 'High Risk';
  if (score < 70) return 'Moderate';
  return 'Good';
};

// Color based on analysis status string
export const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'pending':
    case 'processing':
      return 'info.main';
    case 'complete':
      return 'success.main';
    case 'error':
      return 'error.main';
    default:
      return 'grey.400';
  }
};

// Status chip component based on status string
export const getStatusChip = (status) => {
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

// Chip component specifically for displaying score severity
export const getScoreSeverityChip = (score) => {
   const severity = getScoreSeverityText(score);
   const color = getScoreColor(score).split('.')[0]; // Get base color (error, warning, success)
   
   if (severity === 'N/A') {
     return null; // Or return a default chip if preferred
   }

   return (
     <Chip 
       label={severity} 
       color={color === 'grey' ? 'default' : color} // Map grey to default chip color
       size="small" 
       variant="outlined"
       icon={<InfoIcon fontSize="inherit" />}
     />
   );
}; 