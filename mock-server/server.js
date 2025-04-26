const express = require('express');
const cors = require('cors');
const app = express();
const port = 8081;

app.use(cors());
app.use(express.json());

app.post('/api/analyze', (req, res) => {
  console.log('Received analysis request:', req.body);
  
  // Mock response - just returning success
  res.status(200).json({ 
    success: true,
    message: 'Analysis request received' 
  });
  
  // In a real implementation, you would process this asynchronously
  // and update the status in Firestore
});

app.listen(port, () => {
  console.log(`Mock server running at http://localhost:${port}`);
}); 