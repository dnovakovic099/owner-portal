import React, { useState, useEffect } from 'react';
import { Navigation } from './Navigation';
import { FinancialOverview } from './FinancialOverview';
import { Reservations } from './Reservations';
import { Calendar } from './Calendar';
import { Payouts } from './Payouts';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import api from './api/api';
import './App.css';

// Loading component
const Loading = () => (
  <div className="api-loading">
    <div className="spinner"></div>
    <p>Connecting to API server...</p>
  </div>
);

// Error component
const ApiError = ({ error, retry }) => (
  <div className="api-error">
    <h2>Connection Error</h2>
    <p>{error?.message || 'Failed to connect to API server'}</p>
    <p>Make sure the local server is running on http://localhost:3001</p>
    <button onClick={retry} className="retry-button">Retry Connection</button>
  </div>
);

// Main App content
const AppContent = () => {
  const [currentPage, setCurrentPage] = useState('financial');
  const [apiReady, setApiReady] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState(null);
  
  // Initialize API on mount
  useEffect(() => {
    checkApiHealth();
  }, []);
  
  // Function to check API health
  const checkApiHealth = async () => {
    setInitializing(true);
    setError(null);
    
    try {
      console.log('Checking API health...');
      await api.checkHealth();
      console.log('API health check passed');
      setApiReady(true);
    } catch (err) {
      console.error('API health check failed:', err);
      setError(err);
      setApiReady(false);
    } finally {
      setInitializing(false);
    }
  };
  
  // Function to change the current page
  const navigateTo = (page) => {
    setCurrentPage(page);
  };
  
  // Show loading while API initializes
  if (initializing) {
    return <Loading />;
  }
  
  // Show error if API initialization failed
  if (!apiReady) {
    return <ApiError error={error} retry={checkApiHealth} />;
  }

  return (
    <div className="app-container">
      <Navigation currentPage={currentPage} navigateTo={navigateTo} />
      <main className="main-content">
        {currentPage === 'financial' && <FinancialOverview />}
        {currentPage === 'reservations' && <Reservations />}
        {currentPage === 'calendar' && <Calendar />}
        {currentPage === 'payouts' && <Payouts />}
      </main>
    </div>
  );
};

// Wrap the app with auth provider and protected route
const App = () => {
  console.log('App rendering');
  return (
    <AuthProvider>
      <ProtectedRoute>
        <AppContent />
      </ProtectedRoute>
    </AuthProvider>
  );
};

export default App;