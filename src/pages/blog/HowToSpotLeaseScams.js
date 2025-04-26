import React from 'react';
import BlogPostLayout from './BlogPostLayout';
import { Typography, List, ListItem, ListItemText, ListItemIcon } from '@mui/material';
import WarningIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const HowToSpotLeaseScams = () => {
  const title = 'How to Spot Common Rental Lease Scams';
  const description = 'Protect yourself from rental scams by learning common tactics scammers use and how to verify listings and leases.';

  return (
    <BlogPostLayout title={title} description={description}>
      <Typography paragraph>
        Finding a rental can be stressful, and scammers unfortunately prey on this. Being aware of common rental scams can help you avoid losing money and compromising your personal information. Here are key things to watch out for:
      </Typography>

      <Typography variant="h2">1. Deals That Are Too Good To Be True</Typography>
      <Typography paragraph>
        Extremely low rent for a prime location or luxury amenities is a major red flag. Scammers lure victims with unrealistic prices. Compare the listing to similar properties in the area.
      </Typography>

      <Typography variant="h2">2. Pressure to Act Immediately & Sight-Unseen Rentals</Typography>
      <Typography paragraph>
        Scammers often create a false sense of urgency, pressuring you to send money before you've even seen the property. Never rent a place sight-unseen (unless through a highly reputable, verified source). Insist on viewing the property in person or via a live video tour.
      </Typography>

      <Typography variant="h2">3. Requests for Wire Transfers or Large Upfront Payments</Typography>
      <Typography paragraph>
        Be extremely wary of requests for payment via wire transfer, gift cards, or cryptocurrency. These methods are difficult to trace and recover. Also, be suspicious if asked for a security deposit and first/last month's rent before you've even signed a lease or verified the landlord's identity.
      </Typography>

      <Typography variant="h2">4. Copied or Fake Listings</Typography>
      <Typography paragraph>
        Scammers often copy photos and descriptions from legitimate listings, changing only the contact information. Do a reverse image search of the property photos. Look for watermarks that don't match the supposed source.
      </Typography>

      <Typography variant="h2">5. Refusal to Meet in Person</Typography>
      <Typography paragraph>
        A common excuse is that the "landlord" is out of the country, sick, or otherwise unavailable to meet or show the property. This is a huge red flag.
      </Typography>

      <Typography variant="h2">6. Poorly Written Communication & Vague Lease</Typography>
      <Typography paragraph>
        Emails or messages filled with grammatical errors and typos can be a sign of a scam. Additionally, if the provided lease agreement is overly simple, missing key clauses, or looks unprofessional, be cautious.
      </Typography>

      <Typography variant="h2">How to Protect Yourself:</Typography>
      <List dense>
        <ListItem>
          <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
          <ListItemText primary="Verify the listing: Search the address online to see if it's listed elsewhere with different contact info." />
        </ListItem>
        <ListItem>
          <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
          <ListItemText primary="Meet the landlord/agent in person and see the property." />
        </ListItem>
        <ListItem>
          <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
          <ListItemText primary="Never pay via wire transfer, gift cards, or crypto." />
        </ListItem>
        <ListItem>
          <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
          <ListItemText primary="Don't provide sensitive personal info (like SSN) until you've verified the listing and landlord." />
        </ListItem>
         <ListItem>
          <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
          <ListItemText primary="Read the lease carefully BEFORE signing. Use tools like Lease Shield AI to help analyze it." />
        </ListItem>
      </List>

    </BlogPostLayout>
  );
};

export default HowToSpotLeaseScams; 