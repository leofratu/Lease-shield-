import React from 'react';
import BlogPostLayout from './BlogPostLayout';
import { Typography, List, ListItem, ListItemText, ListItemIcon, Box, Divider } from '@mui/material';
import { 
  CalendarToday, 
  AttachMoney, 
  Security, 
  Build, 
  VpnKey, 
  Pets, 
  People, 
  ExitToApp,
  Gavel as GavelIcon 
} from '@mui/icons-material';

const UnderstandingCommonClauses = () => {
  const title = 'Understanding Common Lease Clauses | Lease Agreement Explained';
  const description = 'Decode your rental contract. Learn about key lease clauses like rent, security deposit, maintenance, termination, pets, subletting, and more.';

  return (
    <BlogPostLayout title={title} description={description}>
      <Typography paragraph sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
        Rental agreements can be dense legal documents. Understanding the common clauses empowers you as a tenant or landlord. This guide breaks down frequently encountered terms in your lease contract.
      </Typography>

      <Box component="figure" sx={{ textAlign: 'center', my: 3 }}>
         <Box sx={{ width: '100%', height: 200, bgcolor: 'grey.200', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 1 }}>
            <Typography color="text.secondary">(Placeholder: Lease Document Image)</Typography>
         </Box>
         <Typography component="figcaption" variant="caption" color="text.secondary">Understanding your lease is the first step.</Typography>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h2" component="h3" gutterBottom>1. Lease Term & Renewal</Typography>
      <ListItemIcon sx={{ minWidth: 35, color: 'primary.main' }}><CalendarToday /></ListItemIcon>
      <Typography paragraph>
        This critical section defines the duration of your lease (e.g., 12 months, month-to-month) and specifies the exact start and end dates. Pay close attention to renewal terms: Does it renew automatically (auto-renewal)? If so, under what conditions? How much notice must you give if you don't want to renew? Understanding this prevents unexpected obligations or move-out dates.
      </Typography>

      <Typography variant="h2" component="h3" gutterBottom>2. Rent, Due Dates & Fees</Typography>
      <ListItemIcon sx={{ minWidth: 35, color: 'primary.main' }}><AttachMoney /></ListItemIcon>
      <Typography paragraph>
        This outlines the core financial obligation: the monthly rent amount and the precise due date (e.g., "the 1st of each month"). It should also specify acceptable payment methods (check, online portal, etc.) and the consequences for late payments, typically including the late fee amount and any grace period. Look out for other potential fees mentioned here, such as parking fees, pet fees, or penalties for returned checks (NSF fees).
      </Typography>

      <Typography variant="h2" component="h3" gutterBottom>3. Security Deposit</Typography>
      <ListItemIcon sx={{ minWidth: 35, color: 'primary.main' }}><Security /></ListItemIcon>
      <Typography paragraph>
        Details the security deposit amount, its purpose (usually to cover damages beyond normal wear and tear or unpaid rent), and the legal conditions under which the landlord can make deductions. Crucially, it should state the timeframe within which the landlord must return the deposit (or an itemized list of deductions) after you vacate the property. Laws regarding security deposits vary significantly by location, so be aware of your local regulations.
      </Typography>

      <Typography variant="h2" component="h3" gutterBottom>4. Maintenance & Repairs</Typography>
      <ListItemIcon sx={{ minWidth: 35, color: 'primary.main' }}><Build /></ListItemIcon>
      <Typography paragraph>
        A vital section detailing responsibilities. Generally, landlords are responsible for maintaining the structural integrity of the property and major systems (plumbing, heating/cooling, electrical). Tenants are usually responsible for minor upkeep, keeping the unit clean, and damages caused by negligence or misuse. The clause should specify the process for reporting repair needs and the expected response time from the landlord.
      </Typography>

      <Typography variant="h2" component="h3" gutterBottom>5. Landlord's Right to Enter</Typography>
      <ListItemIcon sx={{ minWidth: 35, color: 'primary.main' }}><VpnKey /></ListItemIcon>
      <Typography paragraph>
        This clause defines when and how your landlord can legally enter your rental unit. Most jurisdictions require landlords to provide reasonable notice (often 24-48 hours) before entering for non-emergency reasons like routine inspections, repairs, or showing the unit to prospective tenants or buyers. Emergency entry (like for fire or flood) usually does not require advance notice.
      </Typography>

      <Box component="figure" sx={{ textAlign: 'center', my: 3 }}>
         <Box sx={{ width: '100%', height: 150, bgcolor: 'grey.200', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 1 }}>
            <Typography color="text.secondary">(Placeholder: Lease Clause Icons)</Typography>
         </Box>
       </Box>
       <Divider sx={{ my: 3 }} />

      <Typography variant="h2" component="h3" gutterBottom>6. Pet Policy</Typography>
      <ListItemIcon sx={{ minWidth: 35, color: 'primary.main' }}><Pets /></ListItemIcon>
      <Typography paragraph>
        If applicable, this outlines the rules regarding pets. It specifies whether pets are allowed at all, any restrictions on type, breed, or size, and details regarding pet fees (one-time or monthly) or additional pet deposits. It also clarifies tenant responsibilities regarding pet behavior, waste cleanup, and potential damages caused by pets.
      </Typography>

      <Typography variant="h2" component="h3" gutterBottom>7. Subletting & Assignment</Typography>
      <ListItemIcon sx={{ minWidth: 35, color: 'primary.main' }}><People /></ListItemIcon>
      <Typography paragraph>
        Addresses whether you can have someone else live in the unit and pay you rent (subletting) or completely transfer your lease obligations to another person (assignment). Landlords often prohibit these or require explicit written consent. The clause will detail the procedure and conditions for seeking approval if it's allowed.
      </Typography>

      <Typography variant="h2" component="h3" gutterBottom>8. Termination Clause</Typography>
      <ListItemIcon sx={{ minWidth: 35, color: 'primary.main' }}><ExitToApp /></ListItemIcon>
      <Typography paragraph>
        Explains the specific conditions under which either the tenant or the landlord can legally terminate the lease agreement before the end date. This often involves specific violations of the lease (by either party), required written notice periods, and potential financial penalties (e.g., forfeiting the security deposit or owing remaining rent).
      </Typography>

      <Divider sx={{ my: 3 }} />

      <Typography paragraph sx={{ fontWeight: 'bold' }}>
        Don't Get Lost in the Fine Print!
      </Typography>
      <Typography paragraph>
        This covers some of the most common clauses, but every lease is unique. Carefully reading your entire agreement is essential. 
        <strong>Tip:</strong> Use Lease Shield AI to get automated, plain-language summaries of these clauses and identify potential risks specific to *your* lease document.
      </Typography>
      <Typography paragraph>
         (See also: <a href="/blog/lease-red-flags">Red Flags to Watch For in a Lease Agreement</a>)
      </Typography>

    </BlogPostLayout>
  );
};

export default UnderstandingCommonClauses; 