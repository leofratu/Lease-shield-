import React from 'react';
import BlogPostLayout from './BlogPostLayout';
import { Typography, List, ListItem, ListItemText, ListItemIcon } from '@mui/material';
import GavelIcon from '@mui/icons-material/Gavel';

const LeaseRedFlags = () => {
  const title = 'Red Flags to Watch For in a Lease Agreement';
  const description = 'Learn to identify potential red flags and concerning clauses in a rental lease before you sign.';

  return (
    <BlogPostLayout title={title} description={description}>
      <Typography paragraph>
        A lease is a legally binding contract. While most landlords are fair, some leases contain clauses that are overly restrictive, vague, or potentially illegal. Being able to spot these red flags can save you significant trouble and expense down the line.
      </Typography>

      <Typography variant="h2">1. Vague or Ambiguous Language</Typography>
      <Typography paragraph>
        Be wary of clauses that aren't clear. Terms regarding repairs, property access, fees, or move-out procedures should be specific. If you don't understand something, ask for clarification in writing or have it revised. "Reasonable" is often a red flag word unless clearly defined.
      </Typography>

      <Typography variant="h2">2. Automatic Renewals with Short Notice Periods</Typography>
      <Typography paragraph>
        Some leases automatically renew unless you give notice months in advance (e.g., 60 or 90 days). This can trap you if you forget. Look for reasonable notice periods (e.g., 30 days) or month-to-month options after the initial term.
      </Typography>

      <Typography variant="h2">3. Waiving Your Rights</Typography>
      <Typography paragraph>
        Clauses attempting to waive fundamental tenant rights – like the right to a habitable dwelling, the right to sue the landlord, or the right to proper eviction procedures – are often illegal and unenforceable, but their presence is a major red flag about the landlord.
      </Typography>

      <Typography variant="h2">4. Unrestricted Landlord Access</Typography>
      <Typography paragraph>
        Your lease should specify how and when the landlord can enter your unit, usually requiring reasonable advance notice except for emergencies. Clauses allowing entry at any time without notice are problematic and potentially illegal.
      </Typography>

      <Typography variant="h2">5. Excessive Fees or Unclear Fee Structures</Typography>
      <Typography paragraph>
        Watch out for numerous add-on fees beyond rent and security deposit (e.g., non-refundable "redecorating fees," vague "administrative fees"). All potential fees (late fees, returned check fees, etc.) should be clearly listed and reasonable.
      </Typography>

      <Typography variant="h2">6. "As-Is" Clauses Regarding Condition</Typography>
      <Typography paragraph>
        Accepting a property "as-is" might seem standard, but it shouldn't negate the landlord's responsibility to provide a habitable home. Document the property's condition thoroughly upon move-in, regardless of such clauses.
      </Typography>
      
      <Typography variant="h2">7. Joint and Several Liability (Roommate Situations)</Typography>
      <Typography paragraph>
        This common clause means each tenant is fully responsible for the entire rent and any damages, even if caused by a roommate. Understand the implications before signing with others.
      </Typography>

      <Typography paragraph>
        <strong>Tip:</strong> If you encounter red flags, don't be afraid to ask questions, request changes, or walk away. Using a tool like Lease Shield AI can help automatically flag many of these potential issues.
      </Typography>

    </BlogPostLayout>
  );
};

export default LeaseRedFlags; 