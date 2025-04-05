import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/api';

// Create context
const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Provider component
export const AuthProvider = ({ children }) => {
  // State to hold current user data
  const [user, setUser] = useState(null);
  // Loading state while we check local storage
  const [loading, setLoading] = useState(true);
  // Authentication status
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check for existing auth on mount
  useEffect(() => {
    // Check if user is already logged in (token in localStorage)
    const checkAuth = () => {
      console.log('Checking auth state...');
      const isLoggedIn = api.isAuthenticated();
      console.log('Is logged in?', isLoggedIn);
      
      if (isLoggedIn) {
        // Get user data from localStorage
        const userData = api.getCurrentUser();
        console.log('Current user:', userData);
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      console.log('AuthContext: Attempting login for', email);
      const response = await api.login(email, password);
      console.log('AuthContext: Login response:', response);
      
      // If login successful, set user state
      if (response && response.token) {
        console.log('AuthContext: Setting authenticated state');
        setUser(response.user || { email });
        setIsAuthenticated(true);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error in AuthContext:', error);
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    console.log('AuthContext: Logging out');
    api.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  // Create context value object
  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;