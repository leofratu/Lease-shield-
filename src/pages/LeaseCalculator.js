import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Divider,
  Card,
  CardContent,
  Alert
} from '@mui/material';
import { CalculateOutlined } from '@mui/icons-material';

const LeaseCalculator = () => {
  const [calculatorType, setCalculatorType] = useState('rent');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [securityDeposit, setSecurityDeposit] = useState('');
  const [leaseTermMonths, setLeaseTermMonths] = useState('12');
  const [moveInDate, setMoveInDate] = useState('');
  const [calculationResult, setCalculationResult] = useState(null);
  const [showResult, setShowResult] = useState(false);

  const handleCalculate = () => {
    let result = {};
    
    switch (calculatorType) {
      case 'rent':
        const annualRent = parseFloat(monthlyRent) * 12;
        const totalLeaseTerm = parseFloat(monthlyRent) * parseInt(leaseTermMonths);
        
        result = {
          monthlyRent: parseFloat(monthlyRent).toFixed(2),
          annualRent: annualRent.toFixed(2),
          totalLeaseTerm: totalLeaseTerm.toFixed(2)
        };
        break;
        
      case 'prorated':
        if (moveInDate) {
          const date = new Date(moveInDate);
          const month = date.getMonth();
          const day = date.getDate();
          
          // Get days in month
          const daysInMonth = new Date(date.getFullYear(), month + 1, 0).getDate();
          const remainingDays = daysInMonth - day + 1;
          
          const proratedRent = (parseFloat(monthlyRent) / daysInMonth) * remainingDays;
          
          result = {
            fullMonthlyRent: parseFloat(monthlyRent).toFixed(2),
            moveInDate: moveInDate,
            daysInMonth: daysInMonth,
            remainingDays: remainingDays,
            proratedRent: proratedRent.toFixed(2)
          };
        }
        break;
        
      case 'deposit':
        const depositPercentage = (parseFloat(securityDeposit) / parseFloat(monthlyRent) * 100).toFixed(1);
        result = {
          monthlyRent: parseFloat(monthlyRent).toFixed(2),
          securityDeposit: parseFloat(securityDeposit).toFixed(2),
          depositPercentage: depositPercentage
        };
        break;
        
      default:
        break;
    }
    
    setCalculationResult(result);
    setShowResult(true);
  };

  const renderCalculator = () => {
    switch (calculatorType) {
      case 'rent':
        return (
          <Box>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Monthly Rent"
                  type="number"
                  value={monthlyRent}
                  onChange={(e) => setMonthlyRent(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Lease Term</InputLabel>
                  <Select
                    value={leaseTermMonths}
                    label="Lease Term"
                    onChange={(e) => setLeaseTermMonths(e.target.value)}
                  >
                    <MenuItem value={6}>6 Months</MenuItem>
                    <MenuItem value={12}>12 Months</MenuItem>
                    <MenuItem value={18}>18 Months</MenuItem>
                    <MenuItem value={24}>24 Months</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        );
        
      case 'prorated':
        return (
          <Box>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Monthly Rent"
                  type="number"
                  value={monthlyRent}
                  onChange={(e) => setMonthlyRent(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Move-in Date"
                  type="date"
                  value={moveInDate}
                  onChange={(e) => setMoveInDate(e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        );
        
      case 'deposit':
        return (
          <Box>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Monthly Rent"
                  type="number"
                  value={monthlyRent}
                  onChange={(e) => setMonthlyRent(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Security Deposit"
                  type="number"
                  value={securityDeposit}
                  onChange={(e) => setSecurityDeposit(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        );
        
      default:
        return null;
    }
  };

  const renderResults = () => {
    if (!showResult || !calculationResult) return null;
    
    switch (calculatorType) {
      case 'rent':
        return (
          <Card sx={{ mt: 4, borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Rent Calculation Results</Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Monthly Rent:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body1">${calculationResult.monthlyRent}</Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Annual Rent:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body1">${calculationResult.annualRent}</Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Total for Lease Term:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body1">${calculationResult.totalLeaseTerm}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        );
        
      case 'prorated':
        return (
          <Card sx={{ mt: 4, borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Prorated Rent Results</Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Full Monthly Rent:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body1">${calculationResult.fullMonthlyRent}</Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Move-in Date:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body1">{new Date(calculationResult.moveInDate).toLocaleDateString()}</Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Days in Month:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body1">{calculationResult.daysInMonth}</Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Remaining Days:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body1">{calculationResult.remainingDays}</Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Prorated Rent:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body1" fontWeight="bold" color="primary">
                    ${calculationResult.proratedRent}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        );
        
      case 'deposit':
        return (
          <Card sx={{ mt: 4, borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Security Deposit Analysis</Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Monthly Rent:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body1">${calculationResult.monthlyRent}</Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Security Deposit:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body1">${calculationResult.securityDeposit}</Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Percentage of Monthly Rent:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body1">{calculationResult.depositPercentage}%</Typography>
                </Grid>
                
                <Grid item xs={12}>
                  {parseFloat(calculationResult.depositPercentage) > 200 ? (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                      This security deposit is more than twice the monthly rent, which may be excessive in some jurisdictions.
                    </Alert>
                  ) : parseFloat(calculationResult.depositPercentage) < 100 ? (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      This security deposit is less than one month's rent, which is lower than the typical amount.
                    </Alert>
                  ) : (
                    <Alert severity="success" sx={{ mt: 2 }}>
                      This security deposit is within the typical range (1-2 months' rent).
                    </Alert>
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        );
        
      default:
        return null;
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Lease Calculator
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Use our lease calculators to help understand the financial aspects of your lease agreement.
      </Typography>
      
      <Paper sx={{ p: 4, borderRadius: 2, mb: 4 }}>
        <Box sx={{ mb: 4 }}>
          <FormControl fullWidth>
            <InputLabel>Calculator Type</InputLabel>
            <Select
              value={calculatorType}
              label="Calculator Type"
              onChange={(e) => {
                setCalculatorType(e.target.value);
                setShowResult(false);
              }}
            >
              <MenuItem value="rent">Rent Calculator</MenuItem>
              <MenuItem value="prorated">Prorated Rent Calculator</MenuItem>
              <MenuItem value="deposit">Security Deposit Calculator</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        {renderCalculator()}
        
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <Button 
            variant="contained" 
            color="primary" 
            size="large"
            startIcon={<CalculateOutlined />}
            onClick={handleCalculate}
            disabled={
              (calculatorType === 'rent' && !monthlyRent) ||
              (calculatorType === 'prorated' && (!monthlyRent || !moveInDate)) ||
              (calculatorType === 'deposit' && (!monthlyRent || !securityDeposit))
            }
          >
            Calculate
          </Button>
        </Box>
      </Paper>
      
      {renderResults()}
    </Box>
  );
};

export default LeaseCalculator; 