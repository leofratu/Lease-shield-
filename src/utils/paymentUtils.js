// Utility functions related to payment processing

// Function that calls the backend to start Maxelpay checkout
export const initiateCheckout = async (token, planId) => {
  console.log(`Attempting to initiate Maxelpay checkout for plan: ${planId}...`);
  
  // Get API URL from environment variable, default to localhost
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8081'; 
  const endpoint = `${apiUrl}/api/payid/create-checkout-session`;

  // Basic validation
  if (!planId) {
      throw new Error('Plan ID is required to initiate checkout.');
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      // Send planId in the request body
      body: JSON.stringify({ planId: planId }) 
    });

    const responseData = await response.json();

    if (!response.ok) {
      // Use error message from backend if available
      throw new Error(responseData.error || `Checkout failed with status: ${response.status}`);
    }

    if (!responseData.checkoutUrl) {
      console.error("Backend response missing checkoutUrl:", responseData);
      throw new Error('Failed to retrieve checkout URL from server.');
    }

    console.log("Received checkout URL:", responseData.checkoutUrl);
    return responseData.checkoutUrl; // Return the URL received from the backend

  } catch (error) {
    console.error("Error during fetch to create checkout session:", error);
    // Re-throw the error so it can be caught by handleSubscribeClick
    throw error; 
  }
};

// Add other payment-related utility functions here if needed 