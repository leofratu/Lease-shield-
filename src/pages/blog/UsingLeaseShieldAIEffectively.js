import React from 'react';
import BlogPostLayout from './BlogPostLayout'; // Assuming a layout component exists
import { Typography, List, ListItem, ListItemText, ListItemIcon, Box, Paper, Divider } from '@mui/material';
import {
  CloudUpload,
  Psychology,
  CheckCircleOutline,
  WarningAmber,
  FileCopyOutlined,
  TextSnippet,
  Gavel
} from '@mui/icons-material';

const UsingLeaseShieldAIEffectively = () => {
  // SEO Optimized Title and Description
  const title = 'How to Use Lease Shield AI Effectively | Lease Analysis Tips';
  const description = 'Get the most out of Lease Shield AI. Learn tips for uploading documents, interpreting the analysis report, understanding scores, and leveraging AI for lease review.';

  return (
    <BlogPostLayout title={title} description={description}>
      <Typography paragraph sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
        Lease Shield AI is a powerful tool for understanding your lease agreement, but like any tool, knowing how to use it effectively maximizes its benefits. Follow these tips to get the best possible analysis.
      </Typography>

      {/* TODO: Add relevant image here (e.g., screenshot of the Lease Shield AI upload interface) 
          alt="Lease Shield AI interface showing document upload options." */}
      <Box component="figure" sx={{ textAlign: 'center', my: 3 }}>
         <Box sx={{ width: '100%', height: 200, bgcolor: 'grey.200', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 1 }}>
            <Typography color="text.secondary">(Placeholder: Upload Interface Image)</Typography>
         </Box>
         <Typography component="figcaption" variant="caption" color="text.secondary">Start by uploading a clear copy of your lease.</Typography>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h2" component="h3" gutterBottom>1. Provide Clear Input</Typography>
      <ListItemIcon sx={{ minWidth: 35, color: 'primary.main' }}><CloudUpload /></ListItemIcon>
      <Typography paragraph>
        Garbage in, garbage out applies to AI too! For the best results, ensure the document you provide is clear and legible.
      </Typography>
      <List dense>
          <ListItem>
              <ListItemIcon sx={{minWidth: 30}}><CheckCircleOutline color="success"/></ListItemIcon>
              <ListItemText primary="PDF Files:" secondary="Ideally, use the original PDF document, not a scanned copy if possible. Ensure text is selectable (not just an image)." />
          </ListItem>
          <ListItem>
              <ListItemIcon sx={{minWidth: 30}}><CheckCircleOutline color="success"/></ListItemIcon>
              <ListItemText primary="Pasted Text:" secondary="If pasting text, ensure all relevant sections are included and formatting is reasonably preserved. Avoid excessive line breaks or OCR errors." />
          </ListItem>
           <ListItem>
              <ListItemIcon sx={{minWidth: 30}}><WarningAmber color="warning"/></ListItemIcon>
              <ListItemText primary="Avoid Poor Scans:" secondary="Heavily skewed, blurry, or handwritten documents will significantly impact the AI's ability to extract information accurately." />
          </ListItem>
      </List>

      <Typography variant="h2" component="h3" gutterBottom>2. Understand the Report Sections</Typography>
      <ListItemIcon sx={{ minWidth: 35, color: 'primary.main' }}><TextSnippet /></ListItemIcon>
      <Typography paragraph>
        Your Lease Shield AI report is typically broken down into key sections. Familiarize yourself with them:
      </Typography>
      <List dense>
          <ListItem>
              <ListItemText primary="Extracted Data:" secondary="Key details like names, addresses, dates, and amounts. Verify these against your knowledge." />
          </ListItem>
          <ListItem>
              <ListItemText primary="Clause Summaries:" secondary="Plain-language explanations of important clauses (Maintenance, Pets, Termination, etc.). Focus on understanding your rights and obligations." />
          </ListItem>
          <ListItem>
              <ListItemText primary="Risks / Red Flags:" secondary="Potentially unfavorable or unusual clauses flagged by the AI. Pay close attention to these!" />
          </ListItem>
          <ListItem>
              <ListItemText primary="Overall Score:" secondary="A general indicator of how tenant-friendly the lease appears. Use it as a guide, not a definitive judgment." />
          </ListItem>
      </List>

      {/* TODO: Add relevant image here (e.g., sample report section with annotations) 
          alt="Example Lease Shield AI report showing clause summaries and risk flags." */}
       <Box component="figure" sx={{ textAlign: 'center', my: 3 }}>
         <Box sx={{ width: '100%', height: 150, bgcolor: 'grey.200', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 1 }}>
            <Typography color="text.secondary">(Placeholder: Sample Report Snippet)</Typography>
         </Box>
       </Box>
       <Divider sx={{ my: 3 }} />

      <Typography variant="h2" component="h3" gutterBottom>3. Focus on the Risks</Typography>
      <ListItemIcon sx={{ minWidth: 35, color: 'primary.main' }}><WarningAmber /></ListItemIcon>
      <Typography paragraph>
        The 'Risks' or 'Red Flags' section is often the most valuable. These are areas the AI identified as potentially problematic or non-standard. Don't just glance at them; read the corresponding clause in your actual lease document to understand the full context. These are excellent points to bring up for negotiation or clarification with your landlord or a legal advisor.
      </Typography>

       <Typography variant="h2" component="h3" gutterBottom>4. Use Summaries as a Starting Point</Typography>
       <ListItemIcon sx={{ minWidth: 35, color: 'primary.main' }}><Psychology /></ListItemIcon>
       <Typography paragraph>
         The AI summaries provide a quick understanding, but they condense complex information. If a summary seems particularly important or confusing, always refer back to the original lease language for the exact wording. The AI helps you know *where* to look more closely.
       </Typography>

       <Typography variant="h2" component="h3" gutterBottom>5. AI is a Tool, Not a Lawyer</Typography>
       <ListItemIcon sx={{ minWidth: 35, color: 'primary.main' }}><Gavel /></ListItemIcon>
       <Typography paragraph>
         Lease Shield AI provides powerful insights and significantly speeds up the review process. However, it does not constitute legal advice. For complex situations, high-stakes commercial leases, or if you have significant concerns after reviewing the AI report, always consult with a qualified attorney or legal professional licensed in your jurisdiction.
       </Typography>

        <Divider sx={{ my: 3 }} />

      <Typography paragraph sx={{ fontWeight: 'bold' }}>
        Leverage AI for Better Lease Understanding
      </Typography>
      <Typography paragraph>
        By providing clear documents and carefully reviewing the AI-generated report, focusing on the flagged risks, you can use Lease Shield AI effectively to gain confidence and clarity before signing any lease agreement.
      </Typography>
        {/* Suggest internal linking (implement with RouterLink if needed) */}
      <Typography paragraph>
         (Learn more about: <a href="/blog/understanding-common-clauses">Understanding Common Lease Clauses</a>)
      </Typography>

    </BlogPostLayout>
  );
};

export default UsingLeaseShieldAIEffectively; 