import React, { useState, useEffect } from 'react';
import api from './api/api';
import './FinancialOverview.css';

export const FinancialOverview = () => {
  // State management
  const [properties, setProperties] = useState([]);
  const [listingFinancials, setListingFinancials] = useState({ columns: [], rows: [], totals: [] });
  const [stats, setStats] = useState([]);
  const [totalStats, setTotalStats] = useState({
    totalPayout: 0
  });
  const [loading, setLoading] = useState(true);
  const [loadingFinancials, setLoadingFinancials] = useState(false);
  const [error, setError] = useState(null);
  
  // Fetch properties on component mount
  useEffect(() => {
    fetchProperties();
  }, []);
  
  // Fetch financial data when properties are loaded
  useEffect(() => {
    if (properties.length > 0) {
      fetchListingFinancials();
    }
  }, [properties]);
  
  // Calculate stats when financial data changes
  useEffect(() => {
    if (properties.length > 0 && listingFinancials.rows.length > 0) {
      calculateStats();
    }
  }, [properties, listingFinancials]);
  
  // Function to fetch all properties
  const fetchProperties = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await api.getListings();
      setProperties(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching properties:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Setup date params for all-time - very wide date range
  const getDateParams = () => {
    // Use a very wide date range for "all time" data
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 10); // Go back 10 years
    
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 2); // Include future reservations
    
    return {
      fromDate: startDate.toISOString().split('T')[0],
      toDate: endDate.toISOString().split('T')[0]
    };
  };
  
  // Fetch listing financials data directly
  const fetchListingFinancials = async () => {
    if (properties.length === 0) return;
    
    setLoadingFinancials(true);
    
    try {
      // Get date range parameters
      const dateParams = getDateParams();
      
      // Create parameters for the financial report
      const financialParams = {
        listingMapIds: properties.map(p => p.id), // Include all properties
        fromDate: dateParams.fromDate,
        toDate: dateParams.toDate,
        dateType: 'arrivalDate', // Filter by arrival date
        statuses: ['confirmed'] // Only confirmed reservations
      };
      
      
      // Call the listingFinancials endpoint
      const response = await api.getListingFinancials(financialParams);
      
      if (response.result) {
        // Store the complete result including columns, rows, and totals
        setListingFinancials({
          columns: response.result.columns || [],
          rows: response.result.rows || [],
          totals: response.result.totals || []
        });
        
      } else {
        console.warn("No result data in listing financials response");
        setListingFinancials({ columns: [], rows: [], totals: [] });
      }
    } catch (err) {
      console.error("Error fetching listing financials:", err);
      // Don't set error state as it's supplementary data
    } finally {
      setLoadingFinancials(false);
    }
  };
  
  // Calculate stats directly from the listing financials data
  const calculateStats = () => { 
    
    // Find column indexes for the data we need
    const columns = listingFinancials.columns;
    const getColumnIndex = (name) => columns.findIndex(col => col.name === name);
    
    const listingNameIndex = getColumnIndex('listingName');
    const ownerPayoutIndex = getColumnIndex('ownerPayout');
    
    // Create property stats from the financial data
    const propertyStats = listingFinancials.rows.map((row, rowIndex) => {
      // Extract property name from the listing name
      const listingNameRaw = row[listingNameIndex] || '';
      
      // Extract the actual name, removing the ID prefix if present
      const listingNameMatch = listingNameRaw.match(/^\([\d]+\)\s+(.*)/);
      const listingName = listingNameMatch ? listingNameMatch[1].trim() : listingNameRaw;
      
      // Extract property ID from the listing name if present
      const listingIdMatch = listingNameRaw.match(/^\((\d+)\)/);
      const listingId = listingIdMatch ? listingIdMatch[1] : null;
      
      // Get the ownerPayout directly from the financial data
      const ownerPayout = parseFloat(row[ownerPayoutIndex]) || 0;
      
      // Find the property from our properties list that matches this listing
      const matchingProperty = properties.find(p => {
        // Try to match by name or ID
        return (p.internalListingName && p.internalListingName.toLowerCase() === listingName.toLowerCase()) || 
               String(p.id) === listingId || 
               listingNameRaw.includes(String(p.id)) || 
               (p.name && listingNameRaw.toLowerCase().includes(p.name.toLowerCase()));
      });
      
      console.log({matchingProperty})
      // Get bedrooms and bathrooms from matching property
      const bedrooms = matchingProperty?.bedroomsNumber || 0;
      const bathrooms = matchingProperty?.bathroomsNumber || 0;
      
      return {
        id: matchingProperty?.id || listingId || `row-${rowIndex}`,
        name: listingName,
        address: matchingProperty?.address,
        bedrooms,
        bathrooms,
        ownerPayout
      };
    });
    
    setStats(propertyStats);
    
    // Calculate total payout only
    if (propertyStats.length > 0) {
      const totalPayout = propertyStats.reduce((acc, curr) => acc + curr.ownerPayout, 0);      
      setTotalStats({ totalPayout });
    }
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="financial-overview">
      <div className="page-header">
        <h1 className="page-title">All-Time Financial Overview</h1>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading financial data...</p>
        </div>
      )}
      
      {/* Financial data loading state */}
      {!loading && loadingFinancials && (
        <div className="loading-container financial-loading">
          <div className="spinner"></div>
          <p>Loading accurate financial data...</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="error-container">
          <p>Error loading data: {error.message}</p>
          <button onClick={fetchProperties} className="retry-button">Retry</button>
        </div>
      )}

      {/* Summary Cards */}
      {!loading && !loadingFinancials && !error && (
        <div className="summary-cards">
          <div className="summary-card">
            <div className="card-content">
              <dl>
                <dt className="card-label">Total Owner Payout</dt>
                <dd className="card-value">{formatCurrency(totalStats.totalPayout)}</dd>
              </dl>
            </div>
          </div>
        </div>
      )}

      {/* Property Performance */}
      {!loading && !loadingFinancials && !error && (
        <div className="property-section">
          <h2 className="section-title">All-Time Property Performance</h2>
          {stats.length === 0 ? (
            <div className="no-data">
              <p>No properties or financial data available.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Property</th>
                    <th>Bedrooms</th>
                    <th>Bathrooms</th>
                    <th>Owner Payout</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((property) => (
                    <tr key={property.id}>
                      <td>
                        <div className="property-cell">
                          <div className="property-name">{property.name}</div>
                          <div className="property-address">{property.address}</div>
                        </div>
                      </td>
                      <td className="bedrooms-cell">{property.bedrooms}</td>
                      <td className="bathrooms-cell">{property.bathrooms}</td>
                      <td className="payout-cell">{formatCurrency(property.ownerPayout)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FinancialOverview;