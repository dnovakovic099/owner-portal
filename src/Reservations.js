import React, { useState, useEffect } from 'react';
import api from './api/api';
import './Reservations.css';
import './ModernizedFilters.css';
import './ReservationsDashboard.css'; // Import dashboard styles
import { ReservationsDashboard } from './ReservationsDashboard';

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
          // Make sure to use correct property name, not generic fallback
          const name = property.name || 
                      property.title || 
                      property.propertyName || 
                      `Property #${property.id}`;
          nameMap[property.id] = name;
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
  
  // Format channel names
  const formatChannelName = (platform) => {
    if (!platform) return "Luxury Lodging Direct";
    
    const platformLower = platform.toLowerCase();
    
    if (platformLower.includes('airbnb')) {
      return "Airbnb";
    } else if (platformLower.includes('vrbo') || platformLower.includes('homeaway')) {
      return "Vrbo";
    } else if (platformLower.includes('booking.com')) {
      return "Booking.com";
    } else {
      return "Luxury Lodging Direct";
    }
  };
  
  // Check if platform is Airbnb
  const isAirbnb = (platform) => {
    if (!platform) return false;
    return platform.toLowerCase().includes('airbnb');
  };
  
  // Get channel class for styling
  const getChannelClass = (platform) => {
    if (!platform) return "channel-luxury";
    
    const platformLower = platform.toLowerCase();
    
    if (platformLower.includes('airbnb')) {
      return "channel-airbnb";
    } else if (platformLower.includes('vrbo') || platformLower.includes('homeaway')) {
      return "channel-vrbo";
    } else if (platformLower.includes('booking.comg')) {
      return "channel-booking";
    } else {
      return "channel-luxury";
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
  
  // Get value class based on amount
  const getValueClass = (amount, isFee = false) => {
    const numericAmount = parseFloat(amount) || 0;
    if (numericAmount === 0) return '';
    
    // Positive values are green, except fees which are red
    return isFee ? 'negative-value' : 'positive-value';
  };

  return (
    <div className="reservations-container wider-page">
      <div className="page-header">
        <h1 className="page-title">Reservations</h1>
      </div>
      
      <div className="reservations-filters">
        <div className="filter-row">
          <div className="filter-item">
            <label htmlFor="property-select">Select Property</label>
            <select
              id="property-select"
              value={selectedProperty}
              onChange={handlePropertyChange}
              className="filter-input"
              disabled={loading && properties.length === 0}
            >
              {properties.length === 0 ? (
                <option value="">Loading properties...</option>
              ) : (
                properties.map(property => {
                  // Use consistent property name from our map
                  const propertyName = property.internalListingName || property.name || `Property #${property.id}`;
                  return (
                    <option key={property.id} value={property.id}>
                      {propertyName}
                    </option>
                  );
                })
              )}
            </select>
          </div>
          
          <div className="filter-item">
            <label htmlFor="startDate">Check-in From</label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={handleStartDateChange}
              className="filter-input"
            />
          </div>
          
          <div className="filter-item">
            <label htmlFor="endDate">Check-in To</label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={handleEndDateChange}
              className="filter-input"
            />
          </div>
        </div>
      </div>
      
      {/* Dashboard Summary Section */}
      <ReservationsDashboard 
        reservations={filteredReservations.map(res => {
          // Merge in financial data if available
          const finData = financialData[res.id] || {};
          // Subtract claims protection from base rate
          const baseRateValue = parseFloat(finData.baseRate || res.baseRate || 0);
          const claimsProtectionValue = parseFloat(finData.claimsProtection || 0);
          const adjustedBaseRate = baseRateValue + claimsProtectionValue;
          
          return { 
            ...res, 
            ownerPayout: finData.ownerPayout || res.ownerPayout || 0,
            baseRate: adjustedBaseRate,
            cleaningFeeValue: finData.TotalCleaningFee || res.cleaningFee || 0,
            weeklyDiscount: finData.weeklyDiscount || finData['weekly Discount'] || 0,
            couponDiscount: finData.couponDiscount || finData['coupon Discount'] || 0,
            monthlyDiscount: finData.monthlyDiscount || finData['monthly Discount'] || 0,
            cancellationPayout: finData.cancellationPayout || finData['cancellation Payout'] || 0,
            otherFees: finData.otherFees || finData['other Fees'] || 0,
            claimsProtection: claimsProtectionValue
          };
        })}
        loading={loading || loadingFinancials}
        selectedProperty={selectedProperty}
      />

      {/* Reservations Table */}
      <div className="table-container wider-table">
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
                <th>Booking Information</th>
                <th>Base Rate</th>
                <th>Cleaning Fee</th>
                <th>Tourism Tax</th>
                <th>Pet Fee</th>
                <th>Fees</th>
                <th>Total Payout</th>
              </tr>
            </thead>
            <tbody>
              {filteredReservations.length === 0 ? (
                <tr>
                  <td colSpan="7" className="no-data-cell">
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
                  
                  // Get base rate from financial report with all components
                  const baseRate = (
                    parseFloat(finData.baseRate || 0) +
                    parseFloat(finData.weeklyDiscount || finData['weekly Discount'] || 0) +
                    parseFloat(finData.couponDiscount || finData['coupon Discount'] || 0) +
                    parseFloat(finData.monthlyDiscount || finData['monthly Discount'] || 0) +
                    parseFloat(finData.cancellationPayout || finData['cancellation Payout'] || 0) +
                    parseFloat(finData.otherFees || finData['other Fees'] || 0) +
                    parseFloat(finData.claimsProtection || 0) // Add claims protection since it's a negative value
                  ) || (parseFloat(reservation.totalPrice) - parseFloat(reservation.cleaningFee || 0)) / nights;
                  
                  // Get cleaning fee from financial report or reservation
                  const cleaningFee = parseFloat(finData.TotalCleaningFee) || 
                                     parseFloat(reservation.cleaningFee) || 0;
                  
                  // Tourism tax from financial report
                  const tourismTax = parseFloat(finData.totalTax) || 0;
                  
                  // Get platform/channel name
                  const platform = finData.channelName || 
                                  reservation.source || 
                                  reservation.channelName || 'Direct';
                  
                  // Get payment processing fee from financial report instead of calculating it
                  const paymentProcessingFee = parseFloat(finData['PaymentProcessing']) || 0;
                  
                  // Pet fee might be in different fields, try to locate it
                  // In reality, this might be in a custom fee field or part of extraFees
                  const petFee = parseFloat(finData.petFee) || 0;; // Add logic to extract pet fee when available
                  
                  // Get host channel fee only
                  const hostChannelFee = parseFloat(finData.hostChannelFee) || 0;
                  
                  // Get management fee from financial report
                  const pmFee = parseFloat(finData.pmCommission) || 0;
                  
                  // Get owner payout directly from financial report
                  const ownerPayout = parseFloat(finData.ownerPayout) || 0;
                  
                  // Check if we have financial report data
                  const hasFinancialData = !!finData.id;
                  
                  // Get channel class for styling
                  const channelClass = getChannelClass(platform);
                  
                  // Get guest name
                  const guestName = getGuestName(reservation);
                  
                  return (
                    <tr key={reservation.id} className={loadingFinancials ? "loading-financial-data" : ""}>
                      <td className="booking-info-cell">
                        <div className="booking-info">
                          <div className={`platform-name ${channelClass}`}>
                            {formatChannelName(platform)}
                          </div>
                          <div className="guest-name-reso">
                            {guestName}
                          </div>
                          <div className="dates">
                            {formatDate(finData.arrivalDate || reservation.arrivalDate || reservation.checkInDate)} to {formatDate(finData.departureDate || reservation.departureDate || reservation.checkOutDate)}
                          </div>
                          <div className="nights">{nights} nights</div>
                        </div>
                      </td>
                      <td className="rate-cell">
                        <span className={getValueClass(baseRate)}>
                          {formatCurrency(baseRate)}
                        </span>
                      </td>
                      <td className="fee-cell">
                        <span className={getValueClass(cleaningFee)}>
                          {formatCurrency(cleaningFee)}
                        </span>
                      </td>
                      <td className="tax-cell">
                        <span className={getValueClass(tourismTax)}>
                          {formatCurrency(tourismTax)}
                        </span>
                      </td>
                      <td className="pet-fee-cell">
                        <span className={getValueClass(petFee)}>
                          {formatCurrency(petFee)}
                        </span>
                      </td>
                      <td className="combined-fees-cell">
                        <div className="fee-breakdown">
                          <div className="fee-item">
                            <span className="fee-label">Processing Fee:</span>
                            <span className={`fee-value ${getValueClass(paymentProcessingFee, true)}`}>
                              {formatCurrency(paymentProcessingFee)}
                            </span>
                          </div>
                          <div className="fee-item">
                            <span className="fee-label">Channel Fee:</span>
                            <span className={`fee-value ${getValueClass(hostChannelFee, true)}`}>
                              {formatCurrency(hostChannelFee)}
                            </span>
                          </div>
                          <div className="fee-item">
                            <span className="fee-label">PM Fee:</span>
                            <span className={`fee-value ${getValueClass(pmFee, true)}`}>
                              {formatCurrency(pmFee)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="owner-payout-cell">
                        <div className={`payout-value ${hasFinancialData ? 'from-report' : ''} ${getValueClass(ownerPayout)}`}>
                          {formatCurrency(ownerPayout)}
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