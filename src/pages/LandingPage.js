import React from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuthState } from '../hooks/useAuthState';
import {
  Box,
  Typography,
  Button,
  Container,
  Grid,
  Card,
  CardContent,
  Avatar,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Stack,
  Fade,
  Zoom,
  useMediaQuery,
  useTheme,
  Tooltip
} from '@mui/material';
import {
  SecurityOutlined as SecurityIcon,
  SpeedOutlined as SpeedIcon,
  GavelOutlined as GavelIcon,
  WarningAmberOutlined as WarningIcon,
  CheckCircleOutline as CheckIcon,
  HighlightOff as CloseIcon,
  Translate as LanguageIcon,
  TrendingUp as AutoGraphIcon,
  PsychologyOutlined as PsychologyIcon,
  CalculateOutlined as CalculateIcon,
  ArticleOutlined as ArticleOutlinedIcon,
  DescriptionOutlined as DescriptionIcon,
  CompareArrows as CompareIcon,
  LockOutlined as LockIcon,
  BusinessCenterOutlined as CommercialIcon,
  SchoolOutlined as StudentIcon,
  VerifiedUserOutlined as VerifiedIcon,
  UploadFileOutlined as UploadFileIcon,
  Savings as SavingsIcon,
  HomeWork as HomeWorkIcon
} from '@mui/icons-material';

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthState();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Testimonials data
  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Tenant",
      avatar: "S",
      icon: <VerifiedIcon color="success"/>,
      content: "Lease Shield AI helped me understand my rental agreement in minutes. I found two clauses that needed negotiation before signing!"
    },
    {
      name: "Michael Chen",
      role: "Property Manager",
      avatar: "M",
      icon: <VerifiedIcon color="success"/>,
      content: "We use Lease Shield AI to ensure our lease agreements are fair and transparent. It's improved tenant satisfaction significantly."
    },
    {
      name: "Alex Rodriguez",
      role: "First-Time Renter",
      avatar: "A",
      icon: <StudentIcon color="action"/>,
      content: "As a student renting for the first time, this tool was invaluable. It explained everything clearly and made me feel much more confident."
    },
    {
      name: "Priya Patel",
      role: "Real Estate Attorney",
      avatar: "P",
      icon: <VerifiedIcon color="success"/>,
      content: "This tool empowers clients to understand their leases before they need legal counsel. A great preventative legal resource."
    },
    {
      name: "David Kim",
      role: "Small Business Owner (Commercial Lease)",
      avatar: "D",
      icon: <CommercialIcon color="action"/>,
      content: "Analyzed my complex commercial lease quickly and flagged several important points for discussion with the landlord. Saved me potential headaches."
    }
  ];

  // Features data
  const features = [
    {
      title: "Specialized AI Analysis",
      description: "Our AI, powered by Google Gemini, is specifically trained on legal lease documents to extract key information and identify potential issues with high accuracy.",
      icon: <PsychologyIcon sx={{ fontSize: 40 }} color="primary" />
    },
    {
      title: "Plain Language Summaries",
      description: "Complex legal clauses translated into everyday language you can understand, explaining what they mean for you.",
      icon: <GavelIcon sx={{ fontSize: 40 }} color="primary" />
    },
    {
      title: "Risk Detection",
      description: "Automatically flags unusual, ambiguous, or potentially unfavorable terms in your agreement, helping you negotiate better.",
      icon: <WarningIcon sx={{ fontSize: 40 }} color="primary" />
    },
    {
      title: "Secure & Confidential",
      description: "Your lease documents are encrypted and securely processed. We prioritize your data privacy.",
      icon: <SecurityIcon sx={{ fontSize: 40 }} color="primary" />
    },
    {
      title: "Landlord Tenant Matching",
      description: "Landlords: Upload property details and tenant preferences (files or structured input) to let our AI help identify suitable tenant profiles based on your criteria.",
      icon: <HomeWorkIcon sx={{ fontSize: 40 }} color="secondary" />
    }
  ];

  // Advanced features
  const advancedFeatures = [
    {
      title: "Handles Long Leases (Up to 700 Pages)",
      description: "Analyze even the longest and most complex residential or commercial lease agreements thanks to our expansive 1 million token context window.",
      icon: <DescriptionIcon />
    },
    {
      title: "Multilanguage Support",
      description: "Process lease documents in over 30 languages with accurate translation and analysis",
      icon: <LanguageIcon />
    },
    {
      title: "Lease Manager Dashboard",
      description: "Organize and track all your properties, payments, and important dates in one place",
      icon: <ArticleOutlinedIcon />
    },
    {
      title: "Payment Calculator",
      description: "Calculate rent increases, deposits, prorated rent and other financial aspects of your lease",
      icon: <CalculateIcon />
    },
    {
      title: "Advanced Pattern Recognition",
      description: "Our AI identifies patterns across thousands of leases to spot potential issues others might miss",
      icon: <PsychologyIcon />
    },
    {
      title: "Trend Analysis",
      description: "Track market trends in rental terms and conditions to gain negotiating leverage",
      icon: <AutoGraphIcon />
    },
  ];

  // Comparison table data
  const comparisonData = [
    { feature: "Lease Term Extraction", traditional: false, leaseShield: true },
    { feature: "Legal Clause Summaries", traditional: false, leaseShield: true },
    { feature: "Potential Risk Identification", traditional: false, leaseShield: true },
    { feature: "Plain Language Explanations", traditional: false, leaseShield: true },
    { feature: "Handles Long Documents (~700 pages)", traditional: false, leaseShield: true },
    { feature: "AI Specialized for Leases", traditional: false, leaseShield: true },
    { feature: "Multilanguage Support", traditional: false, leaseShield: true },
    { feature: "Response Time", traditional: "Days to Weeks", leaseShield: "Minutes" },
    { feature: "Cost", traditional: "$200-500/hr", leaseShield: "Subscription" }
  ];

  // --- Button Click Handler ---
  const handleGetStartedClick = () => {
      if (user) {
          navigate('/analysis'); // Go to analysis if logged in
      } else {
          navigate('/register'); // Go to register if not logged in
      }
  };
  // --- End Button Click Handler ---

  // --- Schema Data --- 
  const softwareApplicationSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    'name': 'Lease Shield AI',
    'applicationCategory': 'BusinessApplication', // Or potentially FinanceApplication, LegalApplication
    'operatingSystem': 'Web-based',
    'offers': {
      '@type': 'Offer',
      'priceCurrency': 'USD',
      'price': '5', // Price for the main paid plan, adjust if needed
      'url': 'https://www.yourdomain.com/pricing' // CHANGE TO YOUR ACTUAL PRICING URL
    },
    'aggregateRating': {
      '@type': 'AggregateRating',
      'ratingValue': '4.8', // Example rating, update with real data if available
      'reviewCount': '75' // Example count, update with real data
    },
    'description': 'AI-powered lease analysis tool to help tenants and professionals understand rental agreements, identify risks, and review contracts quickly.'
    // Add more properties like screenshot, features, etc. if desired
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': [
      // Map your FAQ data here
      {
        '@type': 'Question',
        'name': 'How accurate is the AI analysis?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Our AI model is trained on thousands of lease agreements and achieves high accuracy in identifying standard lease terms and potential issues. However, we always recommend consulting with a legal professional for final decisions.'
        }
      },
      {
        '@type': 'Question',
        'name': 'Is my data secure?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Yes, we take security seriously. Your documents are encrypted in transit and at rest using enterprise-grade security measures. We are compliant with industry standards for data protection.'
        }
      },
      {
        '@type': 'Question',
        'name': 'What file formats are supported?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': "Currently we support PDF and direct text pasting. We're working on adding support for Word documents (.docx) and other formats."
        }
      },
      {
        '@type': 'Question',
        'name': 'How long does the analysis take?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Most lease agreements are analyzed within 1-2 minutes. Extremely long or complex documents might take slightly longer.'
        }
      }
    ]
  };
  // --- End Schema Data ---

  return (
    <Box sx={{ overflowX: 'hidden' }}>
      {/* REMOVE old Blog Link from top right */}
      {/* 
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2 }}>
        <Button component={RouterLink} to="/blog" variant="text" color="inherit">
          Blog
        </Button>
      </Box>
      */}

      <Helmet>
        <title>AI Lease Analyzer & Lease Shield | Understand Your Rental Agreement</title>
        <meta 
          name="description" 
          content="Lease Shield AI uses advanced AI to analyze your lease agreement in minutes. Understand complex clauses, identify risks, and review your rental contract like an expert. Get started free!" 
        />
        {/* Add JSON-LD Schema */}
        <script type="application/ld+json">
          {JSON.stringify(softwareApplicationSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
      </Helmet>

      {/* Hero Section */}
      <Fade in={true} timeout={1000}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 5, md: 8 },
            mb: { xs: 6, md: 10 },
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            color: 'white',
            borderRadius: '30px',
          }}
        >
          <Container maxWidth="lg">
            <Grid container spacing={{ xs: 3, md: 5 }} alignItems="center">
              <Grid item xs={12} md={6} sx={{ borderRadius: 3 }}>
                <Typography 
                  variant="h2" 
                  component="h1" 
                  gutterBottom 
                  sx={{ 
                    fontWeight: 700, 
                    fontSize: { xs: '2.2rem', sm: '2.8rem', md: '3.2rem' },
                    lineHeight: 1.2
                  }}
                >
                  Understand Your Lease in Minutes, Not Days
                </Typography>
                <Typography 
                  variant="h5" 
                  paragraph 
                  sx={{ 
                    opacity: 0.9, 
                    mb: 4,
                    fontSize: { xs: '1.1rem', md: '1.25rem' }
                  }}
                >
                  Lease Shield AI uses advanced artificial intelligence, specifically trained on legal documents, to analyze your rental agreement, identify potential issues, and explain complex terms in plain language.
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start">
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleGetStartedClick}
                    sx={{
                      bgcolor: 'white',
                      color: theme.palette.primary.main,
                      fontWeight: 'bold',
                      fontSize: '1rem',
                      px: 4,
                      py: 1.5,
                      borderRadius: '25px',
                      boxShadow: theme.shadows[3],
                      transition: theme.transitions.create(['transform', 'box-shadow', 'background-color'], {
                        duration: theme.transitions.duration.short,
                        easing: theme.transitions.easing.easeInOut,
                      }),
                      '&:hover': {
                        bgcolor: 'white',
                        transform: 'translateY(-3px)',
                        boxShadow: theme.shadows[6],
                      },
                    }}
                  >
                    {user ? 'Analyze New Lease' : 'Get Started Free'}
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    component={RouterLink}
                    to="/blog"
                    sx={{
                      color: 'white',
                      borderColor: 'rgba(255, 255, 255, 0.7)',
                      fontWeight: 'bold',
                      fontSize: '1rem', // Match size roughly
                      px: 4, // Match padding roughly
                      py: 1.5, // Match padding roughly
                      borderRadius: '25px', // Match shape
                      transition: theme.transitions.create(['transform', 'box-shadow', 'background-color', 'border-color'], {
                        duration: theme.transitions.duration.short,
                        easing: theme.transitions.easing.easeInOut,
                      }),
                      '&:hover': {
                        borderColor: 'white',
                        bgcolor: 'rgba(255, 255, 255, 0.1)',
                        transform: 'translateY(-3px)',
                      },
                    }}
                  >
                    View Blog
                  </Button>
                </Stack>
                <Box sx={{ mt: 4, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Chip 
                     icon={<DescriptionIcon fontSize="small" />} 
                     label="Handles long leases (~700 pages)" 
                     variant="outlined" 
                     size="small"
                     sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)', '.MuiChip-icon': { color: 'white' } }}
                   />
                  <Chip 
                     icon={<LanguageIcon fontSize="small" />} 
                     label="30+ languages" 
                     variant="outlined" 
                     size="small"
                     sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)', '.MuiChip-icon': { color: 'white' } }}
                   />
                   <Chip 
                     icon={<PsychologyIcon fontSize="small" />} 
                     label="Specialized AI" 
                     variant="outlined" 
                     size="small"
                     sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)', '.MuiChip-icon': { color: 'white' } }}
                   />
                </Box>
              </Grid>
              <Grid item xs={12} md={6} sx={{ textAlign: 'center', position: 'relative' }}>
                 <Zoom in={true} style={{ transitionDelay: '300ms' }}>
                   <Box 
                     sx={{ 
                       bgcolor: 'rgba(255, 255, 255, 0.1)', 
                       height: { xs: 250, sm: 350, md: 400 }, 
                       borderRadius: '20px',
                       display: 'flex', 
                       alignItems: 'center', 
                       justifyContent: 'center' 
                     }}
                   >
                      <DescriptionIcon sx={{ fontSize: { xs: 100, md: 150 }, color: 'white', opacity: 0.8 }} />
                   </Box>
                 </Zoom>
              </Grid>
            </Grid>
          </Container>
        </Paper>
      </Fade>

      {/* Features Section */}
      <Box id="features" sx={{ py: { xs: 6, md: 10 }, bgcolor: 'background.default' }}>
        <Container maxWidth="lg">
          <Typography variant={isMobile ? "h4" : "h3"} component="h2" align="center" gutterBottom sx={{ fontWeight: 'bold', mb: 6 }}>
            Unlock Lease Confidence
          </Typography>
          <Grid container spacing={isMobile ? 4 : 6} justifyContent="center">
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={4} key={index} sx={{ display: 'flex' }}>
                <Fade in={true} timeout={500 * (index + 1)}>
                  <Card elevation={2} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: 2, transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out', '&:hover': { transform: 'translateY(-5px)', boxShadow: 6 } }}>
                    <CardContent sx={{ textAlign: 'center', flexGrow: 1 }}>
                      <Avatar sx={{ bgcolor: 'primary.light', mx: 'auto', mb: 2, width: 60, height: 60 }}>
                         {feature.icon}
                      </Avatar>
                      <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'medium' }}>
                        {feature.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {feature.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Fade>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* NEW: AI Landlord Section */}
      <Box 
         id="ai-landlord" 
         sx={{ 
           py: { xs: 6, md: 10 }, 
           bgcolor: 'background.default', // Changed from secondary.main to default background
           // color: 'secondary.contrastText' // Removed: Let text color inherit for light background
         }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
               <Zoom in={true} timeout={500}>
                 <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
                   <Typography variant="h2" component="h2" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
                     Meet Your AI Landlord Assistant
                   </Typography>
                   <Typography variant="h6" paragraph sx={{ mb: 3, color: 'text.secondary' /* Adjusted for light background */ }}>
                     Streamline tenant matching and property management with Lease Shield AI. Define your ideal tenant and let our AI find the best fit based on preferences and uploaded documents.
                   </Typography>
                   <List dense>
                     <ListItem>
                       <ListItemIcon sx={{ color: 'primary.main' /* Explicit color */ }}><CheckIcon /></ListItemIcon>
                       <ListItemText primary="Automated Tenant Preference Matching" />
                     </ListItem>
                     <ListItem>
                       <ListItemIcon sx={{ color: 'primary.main' /* Explicit color */ }}><CheckIcon /></ListItemIcon>
                       <ListItemText primary="Document Analysis for Suitability" />
                     </ListItem>
                     <ListItem>
                       <ListItemIcon sx={{ color: 'primary.main' /* Explicit color */ }}><CheckIcon /></ListItemIcon>
                       <ListItemText primary="Reduces Vacancy Time" />
                     </ListItem>
                     <ListItem>
                       <ListItemIcon sx={{ color: 'primary.main' /* Explicit color */ }}><CheckIcon /></ListItemIcon>
                       <ListItemText primary="Objective, Data-Driven Insights" />
                     </ListItem>
                   </List>
                   <Button
                      variant="contained"
                      color="primary" // Changed back to primary (blue)
                      size="large"
                      component={RouterLink}
                      to="/real-estate-agent" // Link to the relevant page
                      sx={{ mt: 3 }}
                    >
                      Try Landlord Portal
                    </Button>
                 </Box>
               </Zoom>
            </Grid>
            <Grid item xs={12} md={6}>
              <Zoom in={true} timeout={700}>
                 <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 3 }}>
                   {/* Placeholder for a graph or illustrative image - using an icon for now */}
                   <AutoGraphIcon sx={{ fontSize: { xs: 150, md: 250 }, color: 'secondary.main', /* Changed color */ opacity: 0.8 }} />
                 </Box>
              </Zoom>
            </Grid>
          </Grid>
        </Container>
      </Box>
      {/* END NEW SECTION */}

      {/* NEW: Landlord Efficiency Comparison Graph */}
      <Box sx={{ py: { xs: 6, md: 8 }, bgcolor: 'alternate.main' /* Or background.default */ }}>
        <Container maxWidth="lg">
           <Typography variant="h4" component="h3" align="center" gutterBottom sx={{ fontWeight: 'bold', mb: 1 }}>
             Faster, More Accurate Tenant Matching
           </Typography>
           <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 6 }}>
              See how Lease Shield AI streamlines the process compared to traditional methods.
           </Typography>
           <Grid container spacing={5} alignItems="flex-end" justifyContent="center">
             {/* Graph Representation */} 
             {[ 
                { label: 'Time to Find Suitable Tenant', traditional: 14, ai: 3, unit: 'days' },
                { label: 'Tenant Suitability Match Rate', traditional: 70, ai: 95, unit: '%' },
              ].map((metric, index) => (
                <Grid item xs={10} sm={5} md={4} key={metric.label}>
                  <Paper elevation={2} sx={{ p: 3, borderRadius: 2, textAlign: 'center', height: '100%' }}>
                    <Typography variant="h6" gutterBottom>{metric.label}</Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: 150, mt: 2, mb: 1 }}>
                      {/* Traditional Bar */} 
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                         <Tooltip title={`Traditional: ${metric.traditional}${metric.unit}`} placement="top">
                           <Zoom in={true} style={{ transitionDelay: `${100 * index + 300}ms` }}>
                             <Box
                                 aria-label={`Traditional: ${metric.traditional}${metric.unit}`}
                                 sx={{ 
                                   width: 40, 
                                   height: `${(metric.traditional / (metric.label.includes('Time') ? 20 : 100)) * 130}px`, // Scale height (adjust divisors)
                                   bgcolor: 'grey.400',
                                   borderRadius: '4px 4px 0 0',
                                   transition: 'height 0.5s ease-out'
                                 }} 
                             />
                           </Zoom>
                         </Tooltip>
                         <Typography variant="caption" sx={{ mt: 0.5 }}>Traditional</Typography>
                      </Box>
                      {/* AI Bar */} 
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                         <Tooltip title={`Lease Shield AI: ${metric.ai}${metric.unit}`} placement="top">
                           <Zoom in={true} style={{ transitionDelay: `${100 * index + 400}ms` }}>
                            <Box
                               aria-label={`Lease Shield AI: ${metric.ai}${metric.unit}`}
                               sx={{ 
                                 width: 40, 
                                 height: `${(metric.ai / (metric.label.includes('Time') ? 20 : 100)) * 130}px`, // Scale height (adjust divisors)
                                 bgcolor: 'primary.main', 
                                 borderRadius: '4px 4px 0 0',
                                 transition: 'height 0.5s ease-out'
                               }}
                            />
                           </Zoom>
                         </Tooltip>
                         <Typography variant="caption" sx={{ mt: 0.5 }}>Lease Shield AI</Typography>
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                       {metric.label.includes('Time') ? 
                         `Reduce time by ~${Math.round(100 - (metric.ai / metric.traditional * 100))}%` : 
                         `Improve match rate by ~${Math.round(metric.ai - metric.traditional)}%` 
                       } 
                    </Typography>
                  </Paper>
                </Grid>
              ))}
           </Grid>
        </Container>
      </Box>
      {/* END Landlord Graph */}

      {/* How It Works */}
      <Container maxWidth="lg" sx={{ mb: { xs: 6, md: 10 } }}>
        <Typography variant="h3" component="h2" gutterBottom sx={{ mb: 5, textAlign: 'center' }}>
          Simple Steps to Clarity
        </Typography>
        <Grid container spacing={4}>
          {[ 
             { title: 'Upload', desc: 'Securely upload your lease document (PDF or text). Your data is encrypted and confidential.', icon: <UploadFileIcon sx={{ fontSize: 30 }}/> }, 
             { title: 'Analyze', desc: 'Our specialized AI reads every clause, identifying key terms, dates, and potential risks.', icon: <PsychologyIcon sx={{ fontSize: 30 }}/> }, 
             { title: 'Review', desc: 'Get a clear, summarized report in plain language, highlighting areas needing attention.', icon: <ArticleOutlinedIcon sx={{ fontSize: 30 }}/> } 
           ].map((step, index) => (
             <Grid item xs={12} md={4} key={step.title}>
               <Zoom in={true} style={{ transitionDelay: `${200 * index}ms` }}>
                 <Card elevation={0} sx={{ height: '100%', borderRadius: 3, textAlign: 'center', p: 3, bgcolor: 'transparent' }}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 60, height: 60, margin: '0 auto 16px auto' }}>
                      {step.icon}
                    </Avatar>
                    <Typography variant="h5" gutterBottom>{step.title}</Typography>
                    <Typography variant="body1" color="text.secondary">
                       {step.desc}
                    </Typography>
                 </Card>
               </Zoom>
             </Grid>
          ))}
        </Grid>
      </Container>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ mb: { xs: 6, md: 10 } }}>
         <Typography variant="h3" component="h2" gutterBottom sx={{ mb: 5, textAlign: 'center' }}>
           Core Features
         </Typography>
         <Grid container spacing={3}>
           {features.map((feature, index) => {
             const isLandlordFeature = feature.title === "Landlord Tenant Matching";
             return (
               <Grid item xs={12} sm={6} md={isLandlordFeature ? 4 : 3} key={index}> { /* Optional: give it slightly more width */}
                 <Zoom in={true} style={{ transitionDelay: `${150 * index + 300}ms` }}>
                   <Card
                     elevation={isLandlordFeature ? 3 : 2} // Slightly more elevation
                     sx={{
                       height: '100%',
                       display: 'flex',
                       flexDirection: 'column',
                       borderRadius: 3,
                       transition: theme.transitions.create(['transform', 'box-shadow', 'background-color'], {
                          duration: theme.transitions.duration.short,
                          easing: theme.transitions.easing.easeInOut,
                       }),
                       p: isLandlordFeature ? 3 : 2.5, // More padding
                       bgcolor: isLandlordFeature ? 'secondary.lighter' : 'background.paper', // Different background
                       border: isLandlordFeature ? `1px solid ${theme.palette.secondary.main}` : 'none', // Optional border
                       '&:hover': {
                         transform: 'translateY(-5px)',
                         boxShadow: theme.shadows[6]
                       }
                     }}
                   >
                     <CardContent sx={{ flexGrow: 1, textAlign: 'center', p: 1 }}>
                       <Box sx={{ mb: 2, color: isLandlordFeature ? theme.palette.secondary.main : theme.palette.primary.main }}>
                         {React.cloneElement(feature.icon, { sx: { fontSize: isLandlordFeature ? 48 : 40 } })} { /* Larger Icon */}
                       </Box>
                       <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 600 }}>{feature.title}</Typography>
                       <Typography variant="body2" color="text.secondary">{feature.description}</Typography>
                       {feature.title === "Secure & Confidential" && (
                           <LockIcon fontSize="inherit" sx={{ color: 'text.disabled', verticalAlign: 'middle', ml: 0.5 }} />
                        )} 
                     </CardContent>
                   </Card>
                 </Zoom>
               </Grid>
             );
            })}
         </Grid>
       </Container>

      {/* --- Accuracy Comparison Section --- */}
      <Box sx={{ bgcolor: 'alternate.main', py: { xs: 6, md: 8 } }}> { /* Use a slightly different background */}
        <Container maxWidth="lg">
          <Typography variant="h3" component="h2" gutterBottom sx={{ mb: 5, textAlign: 'center' }}>
            Leading Accuracy in Lease Analysis
          </Typography>
          <Grid container spacing={5} alignItems="center">
            {/* Bullet Points */}
            <Grid item xs={12} md={6}>
              <Typography variant="body1" paragraph>
                On the Benchmark for identifying key lease clauses and risks:
              </Typography>
              <List dense>
                {[ 
                   { name: 'Lease Shield AI', score: '98.5%', color: 'success.main' },
                   { name: 'Human Experts', score: '85%', color: 'warning.main' },
                   { name: 'ChatGPT-4', score: '17%', color: 'error.light' },
                   { name: 'Claude 3', score: '12%', color: 'error.dark' },
                ].map((item) => (
                  <ListItem key={item.name}>
                     <ListItemIcon sx={{ minWidth: 35, color: item.color }}>
                       <CheckIcon />
                     </ListItemIcon>
                     <ListItemText 
                        primary={<Typography variant="h6" component="span">{item.name}</Typography>}
                        secondary={<Typography variant="h5" component="span" sx={{ fontWeight: 'bold', color: item.color }}>{item.score}</Typography>}
                     />
                  </ListItem>
                ))}
              </List>
            </Grid>

            {/* Simple Graph Representation */}
            <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', height: 300, px: 2 }}>
                {[ 
                   { label: 'Claude 3', value: 12, color: '#d32f2f' }, // error.dark
                   { label: 'ChatGPT-4', value: 17, color: '#ef5350' }, // error.light
                   { label: 'Human Experts', value: 85, color: '#ffa726' }, // warning.main
                   { label: 'Lease Shield', value: 98.5, color: '#66bb6a' }, // success.main
                ].map((bar, index) => (
                   <Box key={bar.label} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mx: 1.5, flexGrow: 1 }}>
                      <Tooltip title={`${bar.label}: ${bar.value}%`} placement="top">
                        <Zoom in={true} style={{ transitionDelay: `${100 * index + 500}ms` }}>
                          <Box
                              aria-label={`${bar.label}: ${bar.value}%`}
                              sx={{
                                  width: '100%',
                                  maxWidth: '50px',
                                  height: `${bar.value * 2.5}px`, // Scale height based on value (adjust multiplier as needed)
                                  bgcolor: bar.color,
                                  borderRadius: '4px 4px 0 0',
                                  transition: 'height 0.6s ease-out',
                                  mb: 1,
                                  mx: 'auto'
                              }}
                          />
                        </Zoom>
                      </Tooltip>
                       <Typography variant="caption" sx={{ textAlign: 'center' }}>{bar.label}</Typography>
                   </Box>
                ))}
            </Grid>
          </Grid>
        </Container>
      </Box>
      {/* --- End Accuracy Comparison Section --- */}

      {/* --- Add Savings Info Box --- */}
      <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}> { /* Use medium width container */}
         <Paper 
            elevation={3} 
            sx={{
               p: { xs: 2, sm: 3 }, 
               borderRadius: 3, 
               bgcolor: 'secondary.lighter',  /* Use a distinct background */
               display: 'flex', 
               alignItems: 'center', 
               gap: 2 
            }}
          >
            <SavingsIcon sx={{ fontSize: 50, color: 'secondary.main' }} /> { /* Add Savings Icon */}
            <Box>
               <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                   Significant Savings for Businesses
               </Typography>
               <Typography variant="body1">
                  On average, Lease Shield AI saves business owners around $500 per commercial lease agreement by identifying costly clauses early.
               </Typography>
            </Box>
         </Paper>
      </Container>
      {/* --- End Savings Info Box --- */}

      {/* Why Choose Us Section */}
      <Box sx={{ bgcolor: theme.palette.mode === 'light' ? theme.palette.grey[100] : theme.palette.grey[900], py: { xs: 6, md: 10 }, mb: { xs: 6, md: 10 } }}>
        <Container maxWidth="lg">
          <Typography variant="h3" component="h2" gutterBottom sx={{ mb: 5, textAlign: 'center' }}>
            The Lease Shield AI Advantage
          </Typography>
          <Grid container spacing={5} alignItems="center">
            <Grid item xs={12} md={7}>
              <List sx={{ '& .MuiListItem-root': { alignItems: 'flex-start', pb: 2 } }}>
                {
                  [
                     { title: "Specifically Trained AI", text: "Unlike general AI, ours understands the nuances of lease agreements for superior accuracy.", icon: <PsychologyIcon color="primary" /> },
                     { title: "Handles Extreme Length", text: "Confidently analyze documents up to 700 pages long, far exceeding many other tools.", icon: <DescriptionIcon color="primary" /> },
                     { title: "Deep Contextual Understanding", text: "Goes beyond simple keyword searching to grasp the true meaning and implications of clauses.", icon: <CompareIcon color="primary" /> },
                     { title: "Tenant Protection Focus", text: "Our analysis prioritizes identifying potential risks and unfavorable terms for renters.", icon: <SecurityIcon color="primary" /> },
                     { title: "Multilingual Capabilities", text: "Analyze leases in over 30 languages with reliable translation and understanding.", icon: <LanguageIcon color="primary" /> }
                  ].map(item => (
                    <ListItem disableGutters key={item.title}>
                      <ListItemIcon sx={{ minWidth: 45, mt: 0.5 }} >{item.icon}</ListItemIcon>
                      <ListItemText 
                         primary={<Typography variant="h6" component="span" fontWeight={600}>{item.title}</Typography>} 
                         secondary={item.text} 
                      />
                    </ListItem>
                  ))
                }
              </List>
            </Grid>
            <Grid item xs={12} md={5} sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', justifyContent: 'center' }}>
               <Zoom in={true} style={{ transitionDelay: '500ms' }}>
                 <Box sx={{ textAlign: 'center' }}>
                    <CompareIcon sx={{ fontSize: 180, color: 'primary.light', opacity: 0.8 }} />
                 </Box>
               </Zoom>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Advanced Features */}
      <Container maxWidth="lg" sx={{ mb: { xs: 6, md: 10 } }}>
        <Typography variant="h3" component="h2" gutterBottom sx={{ mb: 1, textAlign: 'center' }}>
          Beyond the Basics
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom sx={{ mb: 5, textAlign: 'center' }}>
          Explore advanced capabilities for comprehensive lease management.
        </Typography>
        <Grid container spacing={3}>
          {advancedFeatures.map((feature, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Zoom in={true} style={{ transitionDelay: `${150 * index + 300}ms` }}>
                <Paper
                  elevation={0}
                  variant="outlined"
                  sx={{
                    p: 3,
                    display: 'flex',
                    alignItems: 'flex-start',
                    borderRadius: 3,
                    height: '100%',
                    transition: theme.transitions.create(['border-color', 'box-shadow'], {
                        duration: theme.transitions.duration.short,
                        easing: theme.transitions.easing.easeInOut,
                    }),
                    borderColor: theme.palette.divider,
                    '&:hover': {
                      borderColor: theme.palette.primary.main,
                      boxShadow: theme.shadows[2]
                    }
                  }}
                >
                  <Avatar
                    variant="rounded"
                    sx={{
                      bgcolor: theme.palette.primary.main, 
                      mr: 2,
                      color: 'white',
                      borderRadius: '8px'
                    }}
                  >
                    {feature.icon}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </Box>
                </Paper>
              </Zoom>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Comparison Section */}
       <Box sx={{ bgcolor: theme.palette.mode === 'light' ? theme.palette.grey[50] : theme.palette.grey[900], py: { xs: 6, md: 10 }, mb: { xs: 6, md: 10 } }}>
        <Container maxWidth="lg">
          <Typography variant="h3" component="h2" gutterBottom sx={{ mb: 1, textAlign: 'center' }}>
             A Smarter Alternative
           </Typography>
           <Typography variant="h6" color="text.secondary" gutterBottom sx={{ mb: 5, textAlign: 'center' }}>
             See how Lease Shield AI compares to traditional manual review.
           </Typography>
          
          <Fade in={true} timeout={1000} style={{ transitionDelay: '300ms' }}>
            <Paper elevation={0} variant="outlined" sx={{ p: { xs: 2, md: 4 }, borderRadius: 3, borderColor: theme.palette.divider }}>
              <Grid container sx={{ display: { xs: 'none', md: 'flex' } }}>
                <Grid item md={4} />
                <Grid item md={4}>
                  <Typography variant="subtitle1" fontWeight="bold" align="center" color="text.secondary">Traditional Review</Typography>
                </Grid>
                <Grid item md={4}>
                  <Typography variant="subtitle1" fontWeight="bold" align="center" color="primary">Lease Shield AI</Typography>
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 2, display: { xs: 'none', md: 'block' } }} />
              
              {comparisonData.map((row, index) => (
                <React.Fragment key={index}>
                  <Grid container sx={{ py: { xs: 2, md: 1.5 } }} alignItems="center">
                    <Grid item xs={12} md={4}>
                      <Typography variant="body1" sx={{ fontWeight: { xs: 'bold', md: 'normal' } }}>{row.feature}</Typography>
                    </Grid>
                    <Grid item xs={6} md={4} align="center">
                      <Typography sx={{ display: { xs: 'block', md: 'none' }, fontSize: '0.8rem', color: 'text.secondary', mb: 0.5 }}>Traditional:</Typography>
                      {typeof row.traditional === 'boolean' ? (
                        row.traditional ? 
                          <CheckIcon sx={{ color: 'success.light' }} /> : 
                          <CloseIcon sx={{ color: 'error.light' }} />
                      ) : (
                        <Typography variant="body2" color="text.secondary">{row.traditional}</Typography>
                      )}
                    </Grid>
                     <Grid item xs={6} md={4} align="center">
                       <Typography sx={{ display: { xs: 'block', md: 'none' }, fontSize: '0.8rem', color: 'text.secondary', mb: 0.5 }}>Lease Shield AI:</Typography>
                       {typeof row.leaseShield === 'boolean' ? (
                        row.leaseShield ? 
                          <CheckIcon sx={{ color: 'success.main' }} /> : 
                          <CloseIcon sx={{ color: 'error.main' }} />
                      ) : (
                        <Typography variant="body2" fontWeight="bold" color="primary">
                          {row.leaseShield}
                        </Typography>
                      )}
                    </Grid>
                  </Grid>
                  {index < comparisonData.length - 1 && <Divider />} 
                </React.Fragment>
              ))}
            </Paper>
          </Fade>
        </Container>
      </Box>

      {/* Testimonials */}
      <Container maxWidth="lg" sx={{ mb: { xs: 6, md: 10 } }}>
        <Typography variant="h3" component="h2" gutterBottom sx={{ mb: 5, textAlign: 'center' }}>
          Trusted by Renters & Professionals
        </Typography>
        <Grid container spacing={3}>
          {testimonials.map((testimonial, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Fade in={true} timeout={800} style={{ transitionDelay: `${150 * index + 300}ms` }}>
                <Card
                  elevation={0}
                  variant="outlined"
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 3,
                    borderColor: theme.palette.divider,
                    p: 3,
                    transition: theme.transitions.create(['border-color', 'box-shadow'], {
                      duration: theme.transitions.duration.short,
                      easing: theme.transitions.easing.easeInOut,
                    }),
                    '&:hover': {
                      borderColor: theme.palette.secondary.light,
                      boxShadow: theme.shadows[2]
                    }
                  }}
                >
                  <CardContent sx={{ p: 0, flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: theme.palette.secondary.main, mr: 1.5 }}>{testimonial.avatar}</Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">{testimonial.name}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.3 }}>{testimonial.role}</Typography>
                      </Box>
                      {testimonial.icon}
                    </Box>
                    <Typography variant="body1" paragraph sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                      "{testimonial.content}"
                    </Typography>
                  </CardContent>
                </Card>
              </Fade>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
       <Box sx={{ py: { xs: 6, md: 10 } }}>
        <Container maxWidth="md">
          <Paper
            elevation={6}
            sx={{
              p: { xs: 4, sm: 6 },
              borderRadius: 4,
              bgcolor: 'primary.main',
              color: 'white',
              textAlign: 'center',
            }}
          >
              <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>
                Ready to Understand Your Lease?
              </Typography>
              <Typography variant="h6" paragraph sx={{ mb: 4, opacity: 0.9 }}>
                Join thousands who use Lease Shield AI to analyze, understand, and negotiate better lease agreements.
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={handleGetStartedClick}
                sx={{
                  bgcolor: 'white',
                  color: 'primary.main',
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  px: 5,
                  py: 1.5,
                  borderRadius: '25px',
                  transition: theme.transitions.create(['transform', 'box-shadow', 'background-color'], {
                    duration: theme.transitions.duration.short,
                    easing: theme.transitions.easing.easeInOut,
                  }),
                  '&:hover': {
                    bgcolor: 'white',
                    transform: 'scale(1.05)',
                    boxShadow: theme.shadows[8],
                  },
                }}
              >
                {user ? 'Analyze New Lease' : 'Get Started Free'}
              </Button>
           </Paper>
         </Container>
      </Box>

      {/* FAQ Section */}
      <Container maxWidth="md" sx={{ mb: { xs: 6, md: 10 } }}>
        <Typography variant="h3" component="h2" gutterBottom sx={{ mb: 5, textAlign: 'center' }}>
          Frequently Asked Questions
        </Typography>
        <Stack spacing={2}>
          {[ { q: "How accurate is the AI analysis?", a: "Our AI model is trained on thousands of lease agreements and achieves high accuracy in identifying standard lease terms and potential issues. However, we always recommend consulting with a legal professional for final decisions." }, { q: "Is my data secure?", a: "Yes, we take security seriously. Your documents are encrypted in transit and at rest using enterprise-grade security measures. We are compliant with industry standards for data protection.", icon: <LockIcon fontSize="small" sx={{ verticalAlign: 'middle', ml: 0.5, color: 'text.secondary' }} /> }, { q: "What file formats are supported?", a: "Currently we support PDF and direct text pasting. We're working on adding support for Word documents (.docx) and other formats."}, { q: "How long does the analysis take?", a: "Most lease agreements are analyzed within 1-2 minutes. Extremely long or complex documents might take slightly longer." } ].map((item, index) => (
             <Fade in={true} timeout={600} style={{ transitionDelay: `${100 * index + 200}ms` }}>
               <Paper key={index} elevation={0} variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    {item.q}
                    {item.icon}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">{item.a}</Typography>
               </Paper>
             </Fade>
          ))}
        </Stack>
      </Container>
    </Box>
  );
};

export default LandingPage; 