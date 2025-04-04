import React, { useState, useEffect } from 'react';
import api from './api/api';
import './Reservations.css';

export const Reservations = () => {
  // Today's date as YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];
  
  // State management
  const [selectedProperty, setSelectedProperty] = useState(''); // Will be set to first available property
  const [startDate, setStartDate] = useState(today); // Default to today
  const [endDate, setEndDate] = useState(''); // Default to no end date
  const [properties, setProperties] = useState([]);
  const [propertyNameMap, setPropertyNameMap] = useState({});
  const [allReservations, setAllReservations] = useState([]); // All fetched reservations
  const [filteredReservations, setFilteredReservations] = useState([]); // Filtered reservations for display
  const [financialData, setFinancialData] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingFinancials, setLoadingFinancials] = useState(false);
  const [error, setError] = useState(null);
  
  // Fetch properties on component mount
  useEffect(() => {
    fetchProperties();
  }, []);
  
  // Fetch all reservations when properties change or property filter changes
  useEffect(() => {
    if (properties.length > 0 && selectedProperty) {
      fetchAllReservations();
    }
  }, [properties, selectedProperty]);
  
  // Apply client-side filtering when filter criteria or all reservations change
  useEffect(() => {
    applyClientSideFilters();
  }, [allReservations, startDate, endDate]);
  
  // Fetch financial data when filtered reservations change and property is selected
  useEffect(() => {
    if (filteredReservations.length > 0 && selectedProperty) {
      fetchFinancialData();
      
      // Update the property name map with names from reservations
      updatePropertyNameMap();
    }
  }, [filteredReservations, selectedProperty]);
  
  // Function to fetch all properties
  const fetchProperties = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await api.getListings();
      console.log("Properties loaded:", data);
      
      const propertiesList = Array.isArray(data) ? data : [];
      
      // Store original properties as received from API
      setProperties(propertiesList);
      
      // Initialize property name map
      const nameMap = {};
      if (propertiesList.length > 0) {
        propertiesList.forEach(property => {
          nameMap[property.id] = property.name || `Property #${property.id}`;
        });
        
        // Set first property as default if no property is selected
        if (!selectedProperty && propertiesList.length > 0) {
          setSelectedProperty(propertiesList[0].id);
        }
      }
      setPropertyNameMap(nameMap);
      
    } catch (err) {
      console.error("Error fetching properties:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Update property name map with names from reservations
  const updatePropertyNameMap = () => {
    const updatedMap = { ...propertyNameMap };
    
    // First update from reservations
    filteredReservations.forEach(reservation => {
      const propertyId = reservation.listingId || reservation.listingMapId;
      if (propertyId && reservation.listingName) {
        updatedMap[propertyId] = reservation.listingName;
      }
    });
    
    // Then update from financial data (takes precedence)
    Object.values(financialData).forEach(finData => {
      if (finData.id && finData.listingName) {
        const propertyId = finData.listingId || finData.listingMapId || 
                         filteredReservations.find(r => r.id === finData.id)?.listingId;
        
        if (propertyId) {
          updatedMap[propertyId] = finData.listingName;
        }
      }
    });
    
    setPropertyNameMap(updatedMap);
  };
  
  // Function to fetch all reservations (with only property filter)
  const fetchAllReservations = async () => {
    if (!selectedProperty) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Only filter by property, get as many reservations as possible
      const filters = {
        limit: 100, // Get more reservations at once
        listingId: selectedProperty
      };
      
      // Fetch reservations with safer handling
      const result = await api.getReservations(filters);
      console.log("Raw reservations data:", result);
      
      // Safely extract data with defaults
      const data = result?.reservations || [];
      
      setAllReservations(data);
    } catch (err) {
      console.error("Error fetching reservations:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Apply client-side filtering
  const applyClientSideFilters = () => {
    if (!allReservations.length) return;
    
    // Start with all reservations
    let filtered = [...allReservations];
    
    // Apply date range filter for arrival date
    if (startDate) {
      const startDateObj = new Date(startDate);
      filtered = filtered.filter(reservation => {
        const arrivalDate = new Date(reservation.arrivalDate || reservation.checkInDate);
        return arrivalDate >= startDateObj;
      });
    }
    
    if (endDate) {
      const endDateObj = new Date(endDate);
      filtered = filtered.filter(reservation => {
        const arrivalDate = new Date(reservation.arrivalDate || reservation.checkInDate);
        return arrivalDate <= endDateObj;
      });
    }
    
    // Sort by arrival date (ascending)
    filtered.sort((a, b) => {
      const dateA = new Date(a.arrivalDate || a.checkInDate);
      const dateB = new Date(b.arrivalDate || b.checkInDate);
      return dateA - dateB;
    });
    
    setFilteredReservations(filtered);
  };
  
  // Function to fetch financial data optimized for a single property and date range
  const fetchFinancialData = async () => {
    if (filteredReservations.length === 0 || !selectedProperty) return;
    
    setLoadingFinancials(true);
    
    try {
      // Determine the date range to fetch
      // Use the filter dates if provided, otherwise determine from reservations
      let fromDate = startDate;
      let toDate = endDate;
      
      // If either date is missing, calculate from reservations
      if (!fromDate || !toDate) {
        // Find earliest and latest dates from filtered reservations
        let earliestDate = null;
        let latestDate = null;
        
        filteredReservations.forEach(reservation => {
          const arrivalDate = new Date(reservation.arrivalDate || reservation.checkInDate);
          const departureDate = new Date(reservation.departureDate || reservation.checkOutDate);
          
          if (!earliestDate || arrivalDate < earliestDate) {
            earliestDate = arrivalDate;
          }
          
          if (!latestDate || departureDate > latestDate) {
            latestDate = departureDate;
          }
        });
        
        // Format dates to YYYY-MM-DD
        if (earliestDate && !fromDate) {
          fromDate = earliestDate.toISOString().split('T')[0];
        }
        
        if (latestDate && !toDate) {
          toDate = latestDate.toISOString().split('T')[0];
        }
      }
      
      // Use the API's getFinancialReport method with optimized parameters
      const financialParams = {
        listingMapIds: [selectedProperty], // Send only the selected property
        fromDate: fromDate,
        toDate: toDate,
        dateType: 'arrivalDate' // Filter by arrival date
      };
      
      console.log("Fetching financial data with params:", financialParams);
      
      const response = await api.getFinancialReport(financialParams);
      
      // Process the financial data
      const financialMap = {};
      
      if (response.result && response.result.rows && Array.isArray(response.result.rows)) {
        const columns = response.result.columns || [];
        
        response.result.rows.forEach(row => {
          const processedRow = {};
          
          // Map each value to its column name
          columns.forEach((column, index) => {
            processedRow[column.name] = row[index];
          });
          
          // Use the reservation ID as the key in our map
          // Convert to string to ensure it matches
          if (processedRow.id) {
            const reservationId = String(processedRow.id);
            financialMap[reservationId] = processedRow;
          }
        });
      }
      
      console.log("Financial data processed:", financialMap);
      setFinancialData(financialMap);
    } catch (err) {
      console.error("Error fetching financial data:", err);
      // Don't set error state here as it's supplementary data
    } finally {
      setLoadingFinancials(false);
    }
  };
  
  // Helper function to get guest name from various fields
  const getGuestName = (reservation) => {
    // First try to get the guestName directly
    if (reservation.guestName) {
      return reservation.guestName;
    }
    
    // Then check for first name and last name separately
    const firstName = reservation.guestFirstName || '';
    const lastName = reservation.guestLastName || '';
    
    // If we have either first or last name, combine them
    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim();
    }
    
    // Final fallback
    return 'No guest name';
  };
  
  // Handle property change
  const handlePropertyChange = (e) => {
    setSelectedProperty(e.target.value);
    // Clear financial data when changing property
    setFinancialData({});
    // Property changes require re-fetching from API
  };
  
  // Handle start date change
  const handleStartDateChange = (e) => {
    setStartDate(e.target.value);
    // Client-side filtering will be applied via useEffect
  };
  
  // Handle end date change
  const handleEndDateChange = (e) => {
    setEndDate(e.target.value);
    // Client-side filtering will be applied via useEffect
  };
  
  // Get property name from consistent source
  const getPropertyName = (propertyId, reservation, finData) => {
    // First check financial data
    if (finData && finData.listingName) {
      return finData.listingName;
    }
    
    // Then check reservation
    if (reservation && reservation.listingName) {
      return reservation.listingName;
    }
    
    // Then check our property name map
    if (propertyId && propertyNameMap[propertyId]) {
      return propertyNameMap[propertyId];
    }
    
    // Finally, fall back to a generic name
    return `Property #${propertyId || 'Unknown'}`;
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(parseFloat(amount) || 0);
  };
  
  // Format date - FIXED to handle timezone issue
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    // Create date and add a day to fix off-by-one issue
    const date = new Date(dateString);
    date.setDate(date.getDate() + 1);
    
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };
  
  // Calculate nights
  const calculateNights = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 0;
  };

  // Icon component for export
  const ExportIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7 10 12 15 17 10"></polyline>
      <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
  );

  // Positive and negative indicator components
  const PlusIndicator = () => (
    <div className="report-data-indicator positive">+</div>
  );

  const MinusIndicator = () => (
    <div className="report-data-indicator negative">−</div>
  );

  return (
    <div className="reservations-container">
      <div className="page-header">
        <h1 className="page-title">Reservations</h1>
      </div>

      <div className="reservations-filters">
        <div className="filter-group">
          <select
            value={selectedProperty}
            onChange={handlePropertyChange}
            className="filter-select"
            disabled={loading && properties.length === 0}
          >
            {properties.length === 0 ? (
              <option value="">Loading properties...</option>
            ) : (
              properties.map(property => {
                // Use consistent property name from our map
                const propertyName = propertyNameMap[property.id] || property.name || `Property #${property.id}`;
                return (
                  <option key={property.id} value={property.id}>
                    {propertyName}
                  </option>
                );
              })
            )}
          </select>
          
          {/* Date range filters for check-in */}
          <div className="date-range-filters">
            <div className="date-filter">
              <label htmlFor="startDate">Check-in From:</label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={handleStartDateChange}
                className="date-input"
              />
            </div>
            
            <div className="date-filter">
              <label htmlFor="endDate">Check-in To:</label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={handleEndDateChange}
                className="date-input"
              />
            </div>
          </div>
        </div>
        
        <button className="export-button">
          <ExportIcon />
          Export
        </button>
      </div>

      {/* Reservations Table */}
      <div className="table-container">
        {loading ? (
          <div className="loading-indicator">
            <div className="spinner"></div>
            <p>Loading reservations...</p>
          </div>
        ) : error ? (
          <div className="error-message">
            <p>Error loading reservations: {error.message}</p>
            <button onClick={fetchAllReservations} className="retry-button">Retry</button>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Platform</th>
                <th>Guest</th>
                <th>Property & Dates</th>
                <th>Base Rate</th>
                <th>Cleaning Fee</th>
                <th>Pet Fee</th>
                <th>Channel Fee</th>
                <th>PM Fee</th>
                <th>Total Payout</th>
              </tr>
            </thead>
            <tbody>
              {filteredReservations.length === 0 ? (
                <tr>
                  <td colSpan="9" className="no-data-cell">
                    <p>No reservations found with the current filters.</p>
                  </td>
                </tr>
              ) : (
                filteredReservations.map(reservation => {
                  // Skip rendering if missing critical data
                  if (!reservation || !reservation.id) return null;
                  
                  // Look up financial data from report
                  const finData = financialData[reservation.id] || {};
                  
                  // Extract property details - improve matching by using both ID fields
                  const propertyId = reservation.listingId || reservation.listingMapId;
                  
                  // Get property name using our consistent naming function
                  const propertyName = getPropertyName(propertyId, reservation, finData);
                  
                  // Get proper nights value - use reservation.nights if available
                  const nights = reservation.nights || calculateNights(reservation.arrivalDate || reservation.checkInDate, 
                                                              reservation.departureDate || reservation.checkOutDate);
                  
                  // Get base rate from financial report (preferred) or calculate
                  const baseRate = parseFloat(finData.baseRate) || 
                                 (parseFloat(reservation.totalPrice) - parseFloat(reservation.cleaningFee || 0)) / nights;
                  
                  // Get cleaning fee from financial report or reservation
                  const cleaningFee = parseFloat(finData.cleaningFeeValue) || 
                                     parseFloat(reservation.cleaningFee) || 0;
                  
                  // Pet fee might be in different fields, try to locate it
                  // In reality, this might be in a custom fee field or part of extraFees
                  const petFee = 0; // Add logic to extract pet fee when available
                  
                  // Get host channel fee only
                  const hostChannelFee = parseFloat(finData.hostChannelFee) || 0;
                  
                  // Get management fee from financial report
                  const pmFee = parseFloat(finData.pmCommission) || 0;
                  
                  // Get owner payout directly from financial report
                  const ownerPayout = parseFloat(finData.ownerPayout) || 0;
                  
                  // Check if we have financial report data
                  const hasFinancialData = !!finData.id;
                  
                  // Get platform/channel name
                  const platform = finData.channelName || 
                                  reservation.source || 
                                  reservation.channelName || 'Direct';
                  
                  return (
                    <tr key={reservation.id} className={loadingFinancials ? "loading-financial-data" : ""}>
                      <td className="platform-cell">
                        <div className="platform-name">{platform}</div>
                      </td>
                      <td className="guest-cell">
                        <div className="guest-name">
                          {getGuestName(reservation)}
                        </div>
                      </td>
                      <td>
                        <div className="property-cell">
                          <div className="property-name">{propertyName}</div>
                          <div className="dates">
                            {formatDate(finData.arrivalDate || reservation.arrivalDate || reservation.checkInDate)} to {formatDate(finData.departureDate || reservation.departureDate || reservation.checkOutDate)}
                          </div>
                          <div className="nights">{nights} nights</div>
                        </div>
                      </td>
                      <td className="rate-cell">
                        {formatCurrency(baseRate)}
                        {hasFinancialData && baseRate > 0 && <PlusIndicator />}
                      </td>
                      <td className="fee-cell">
                        {formatCurrency(cleaningFee)}
                        {hasFinancialData && cleaningFee > 0 && <PlusIndicator />}
                      </td>
                      <td className="pet-fee-cell">
                        {formatCurrency(petFee)}
                        {hasFinancialData && petFee > 0 && <PlusIndicator />}
                      </td>
                      <td className="channel-fee-cell">
                        {formatCurrency(hostChannelFee)}
                        {hasFinancialData && hostChannelFee > 0 && <MinusIndicator />}
                      </td>
                      <td className="pm-fee-cell">
                        {formatCurrency(pmFee)}
                        {hasFinancialData && pmFee > 0 && <MinusIndicator />}
                      </td>
                      <td className="owner-payout-cell">
                        <div className={`payout-value ${hasFinancialData ? 'from-report' : ''}`}>
                          {formatCurrency(ownerPayout)}
                          {hasFinancialData && ownerPayout > 0 && <PlusIndicator />}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>
      
      {/* Results info */}
      <div className="results-info">
        {!loading && !error && (
          <p>Showing {filteredReservations.length} reservations</p>
        )}
      </div>
    </div>
  );
};

export default Reservations;