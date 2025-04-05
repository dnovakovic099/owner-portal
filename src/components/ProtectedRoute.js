import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Login from '../Login';

/**
 * ProtectedRoute component that redirects to Login if user is not authenticated
 * @param {Object} props - Component props
 * @param {JSX.Element} props.children - Child components to render when authenticated
 * @returns {JSX.Element} Rendered component
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, login } = useAuth();
  const [loginAttempt, setLoginAttempt] = useState(0);
  
  console.log('ProtectedRoute: Authentication state -', { isAuthenticated, loading });
  
  // Handle successful login
  const handleLoginSuccess = (response) => {
    console.log('ProtectedRoute: Login successful, response:', response);
    
    // Force refresh of authentication state
    setLoginAttempt(prev => prev + 1);
    
    // Since we're already storing the token in localStorage in the Login component,
    // and the AuthContext checks localStorage on mount, we can just force a re-render
    window.location.reload();
  };
  
  // Show loading state
  if (loading) {
    return (
      <div className="api-loading">
        <div className="spinner"></div>
        <p>Loading your account...</p>
      </div>
    );
  }
  
  // If not authenticated, show login page
  if (!isAuthenticated) {
    console.log('ProtectedRoute: Not authenticated, showing login');
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }
  
  // If authenticated, render the protected content
  console.log('ProtectedRoute: Authenticated, rendering children');
  return children;
};

export default ProtectedRoute;