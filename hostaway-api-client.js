/**
 * Direct API test using the app's API client
 */

// Import the API client from the app
const api = require('./src/api/api').default;
const auth = require('./src/api/auth').default;

/**
 * Test function to get Hostaway users using the app's API client
 */
async function testHostawayUsersAPI() {
  try {
    // Check if we have authentication
    const token = auth.getAuthToken();
    if (!token) {
      console.error('No authentication token found. Please log in to the app first.');
      return;
    }
    
    console.log('Using token:', token.substring(0, 10) + '...');
    console.log('Auth headers:', auth.getAuthHeaders());
    
    // Create direct request to users endpoint using authFetch
    const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';
    console.log(`Making request to ${API_BASE_URL}/v1/users`);
    
    // Use the auth.authFetch method for the request
    const data = await auth.authFetch('/v1/users');
    
    console.log('API Response:');
    console.log(JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('API request error:', error.message);
  }
}

// Execute the function
testHostawayUsersAPI();

// To run: node hostaway-api-client.js 