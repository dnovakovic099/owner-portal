#!/bin/bash

# Extract token from localStorage by running a small JS script
TOKEN=$(node -e "
  try {
    // Try to read from localStorage in browser context first (won't work in Node)
    const token = localStorage.getItem('authToken');
    if (token) {
      console.log(token);
      process.exit(0);
    }
  } catch (e) {
    // If that fails, try to read from the file system
    try {
      const fs = require('fs');
      const homedir = require('os').homedir();
      const tokenPath = homedir + '/.config/owner-portal/token.txt';
      
      if (fs.existsSync(tokenPath)) {
        console.log(fs.readFileSync(tokenPath, 'utf8').trim());
      } else {
        console.error('No token found. Please log in to the app first.');
        process.exit(1);
      }
    } catch (fsError) {
      console.error('Error reading token:', fsError);
      process.exit(1);
    }
  }
")

if [ -z "$TOKEN" ]; then
  echo "No authentication token found. Please log in to the app first."
  exit 1
fi

API_URL="${REACT_APP_API_URL:-https://api.hostaway.com}"
echo "Using API URL: $API_URL"
echo "Fetching users from Hostaway API..."

curl -X GET \
  "$API_URL/v1/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Cache-Control: no-cache" \
  | json_pp

echo ""
echo "Done!" 