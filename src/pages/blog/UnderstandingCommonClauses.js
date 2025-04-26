import React from 'react';
import BlogPostLayout from './BlogPostLayout';
import { Typography, List, ListItem, ListItemText, ListItemIcon } from '@mui/material';
import GavelIcon from '@mui/icons-material/Gavel';

const UnderstandingCommonClauses = () => {
  const title = 'Decoding Your Lease: Understanding Common Clauses';
  const description = 'A breakdown of common rental lease clauses like maintenance, pets, subletting, and termination, and what they mean for you.';

  return (
    <BlogPostLayout title={title} description={description}>
      <Typography paragraph>
        Rental agreements are full of legal jargon. Understanding common clauses helps you know your rights and responsibilities. Here's a look at some frequently encountered terms:
      </Typography>

      <Typography variant="h2">1. Lease Term & Renewal</Typography>
      <Typography paragraph>
        This defines the duration of your lease (e.g., 12 months) and specifies the start and end dates. Pay close attention to renewal terms: Does it renew automatically? How much notice is required to terminate or renew? 
      </Typography>

      <Typography variant="h2">2. Rent & Fees</Typography>
      <Typography paragraph>
        Clearly outlines the monthly rent amount, due date, acceptable payment methods, and consequences for late payments (late fees). It should also detail any other fees (pets, parking, returned checks).
      </Typography>

      <Typography variant="h2">3. Security Deposit</Typography>
      <Typography paragraph>
        Specifies the deposit amount, conditions under which the landlord can deduct from it (usually damages beyond normal wear and tear, unpaid rent), and the timeframe for its return after you move out.
      </Typography>

      <Typography variant="h2">4. Maintenance & Repairs</Typography>
      <Typography paragraph>
        Crucial section detailing who is responsible for what repairs. Landlords are generally responsible for major systems (plumbing, heating, structural issues), while tenants might be responsible for minor upkeep or damages they cause. It should also outline the process for reporting repair needs.
      </Typography>

      <Typography variant="h2">5. Landlord Entry</Typography>
      <Typography paragraph>
        Defines when and how the landlord can enter your rental unit. Usually requires reasonable notice (e.g., 24 hours) for non-emergency situations like repairs, inspections, or showing the unit.
      </Typography>

      <Typography variant="h2">6. Pet Policy</Typography>
      <Typography paragraph>
        Outlines rules regarding pets, including whether they are allowed, size/breed restrictions, pet fees or deposits, and tenant responsibilities.
      </Typography>

      <Typography variant="h2">7. Subletting & Assignment</Typography>
      <Typography paragraph>
        Explains whether you can rent out your unit to someone else (sublet) or transfer your lease entirely (assignment), and the procedures/conditions required (often landlord approval).
      </Typography>

      <Typography variant="h2">8. Termination Clause</Typography>
      <Typography paragraph>
        Details the conditions under which either the tenant or landlord can end the lease early, including required notice periods and potential penalties.
      </Typography>

      <Typography paragraph>
        <strong>Tip:</strong> Use Lease Shield AI to automatically get summaries of these key clauses in plain language, helping you quickly grasp the essentials.
      </Typography>
    </BlogPostLayout>
  );
};

export default UnderstandingCommonClauses; 