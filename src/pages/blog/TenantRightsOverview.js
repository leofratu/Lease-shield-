import React from 'react';
import BlogPostLayout from './BlogPostLayout';
import { Typography, List, ListItem, ListItemText, ListItemIcon } from '@mui/material';
import GavelIcon from '@mui/icons-material/Gavel';

const TenantRightsOverview = () => {
  const title = 'Know Your Rights: A Basic Overview for Tenants';
  const description = 'Understand fundamental tenant rights related to privacy, repairs, security deposits, discrimination, and eviction.';

  return (
    <BlogPostLayout title={title} description={description}>
      <Typography paragraph>
        As a tenant, you have legal rights designed to protect you. While laws vary significantly by state and city, some fundamental rights are common across many jurisdictions. Understanding these basics empowers you to ensure fair treatment.
      </Typography>

      <Typography variant="h2">1. Right to a Habitable Home</Typography>
      <Typography paragraph>
        Your landlord has a responsibility (often called the "implied warranty of habitability") to keep the property safe and livable. This typically includes working plumbing, heating, electricity, clean water, and ensuring the structure is sound and reasonably free of pests.
      </Typography>

      <Typography variant="h2">2. Right to Privacy & Quiet Enjoyment</Typography>
      <Typography paragraph>
        Landlords generally cannot enter your unit whenever they please. Laws usually require "reasonable notice" (often 24 hours, except for emergencies) before entry for repairs, showings, or inspections. You also have the right to live peacefully without excessive disturbance from your landlord or neighbors.
      </Typography>

      <Typography variant="h2">3. Right to Non-Discrimination</Typography>
      <Typography paragraph>
        Federal and state Fair Housing Acts prohibit landlords from discriminating against tenants based on race, color, religion, national origin, sex, familial status (having children), or disability. Many local laws offer additional protections (e.g., sexual orientation, source of income).
      </Typography>

      <Typography variant="h2">4. Rights Regarding Security Deposits</Typography>
      <Typography paragraph>
        Laws often limit the maximum amount a landlord can charge for a security deposit. They also dictate how the deposit must be handled (e.g., placed in escrow) and specify allowable deductions (usually unpaid rent and damages beyond normal wear and tear). Strict timelines usually apply for returning the deposit after you move out.
      </Typography>

      <Typography variant="h2">5. Rights During Eviction</Typography>
      <Typography paragraph>
        A landlord cannot simply lock you out. They must follow a specific legal process for eviction, which typically involves providing written notice and obtaining a court order. You have the right to respond and appear in court. Retaliatory eviction (evicting you for legally exercising your rights, like requesting repairs) is illegal.
      </Typography>
      
      <Typography paragraph>
        <strong>Disclaimer:</strong> This is a very general overview. Tenant rights are complex and location-specific. Consult your local tenant's rights organization or a legal professional for advice specific to your situation. Reading your lease carefully is also crucial, as it outlines your specific contractual obligations.
      </Typography>

    </BlogPostLayout>
  );
};

export default TenantRightsOverview; 