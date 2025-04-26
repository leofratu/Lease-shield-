import React from 'react';
import BlogPostLayout from './BlogPostLayout';
import { Typography, List, ListItem, ListItemText, ListItemIcon } from '@mui/material';
import GavelIcon from '@mui/icons-material/Gavel';

const NegotiatingLeaseTerms = () => {
  const title = 'Tips for Negotiating Your Lease Terms';
  const description = 'Learn effective strategies for negotiating specific terms in your rental lease before signing.';

  return (
    <BlogPostLayout title={title} description={description}>
      <Typography paragraph>
        Don't assume a lease is non-negotiable! While landlords might not budge on rent price (especially in competitive markets), many other clauses can potentially be adjusted if you ask politely and have reasonable justifications. Preparation is key.
      </Typography>

      <Typography variant="h2">1. Know What You Want to Change</Typography>
      <Typography paragraph>
        Before approaching your landlord, carefully review the lease (using tools like Lease Shield AI can help identify areas of concern). Decide which specific terms you want to modify. Focus on 1-3 key items rather than trying to rewrite the entire document.
      </Typography>

      <Typography variant="h2">2. Understand Market Norms</Typography>
      <Typography paragraph>
        Research typical lease terms in your area. Are pet fees standard? What are common notice periods for renewal? Knowing what's normal strengthens your position. If a clause seems unusual or overly strict compared to the market, point this out.
      </Typography>

      <Typography variant="h2">3. Negotiate Politely and Professionally</Typography>
      <Typography paragraph>
        Approach the negotiation as a conversation, not a confrontation. Explain *why* you're requesting a change. For example, if negotiating a pet clause, offer specifics like pet size, breed, training, and perhaps offer an additional pet deposit.
      </Typography>

      <Typography variant="h2">4. Focus on Reasonable Requests</Typography>
      <Typography paragraph>
        Asking for a slightly longer notice period for entry is more likely to succeed than demanding a significant rent reduction without cause. Focus on changes that address specific concerns you have.
      </Typography>

      <Typography variant="h2">5. Offer Compromises</Typography>
      <Typography paragraph>
        Negotiation is often about give-and-take. If you want the landlord to allow a small modification (like painting a room), perhaps you could offer to handle the touch-up painting upon move-out yourself.
      </Typography>

      <Typography variant="h2">6. Get Everything in Writing</Typography>
      <Typography paragraph>
        If the landlord agrees to changes, DO NOT rely on verbal promises. Ensure any modifications are documented in a written addendum (rider) to the lease, signed and dated by both you and the landlord. Each party should keep a copy.
      </Typography>

      <Typography paragraph>
        <strong>Remember:</strong> The worst they can say is no. It often doesn't hurt to ask, especially if you approach it respectfully and with clear reasoning.
      </Typography>

    </BlogPostLayout>
  );
};

export default NegotiatingLeaseTerms; 