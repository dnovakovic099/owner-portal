import React, { useState, useEffect } from 'react';
import api from './api/api';
import './Reservations.css';

export const Reservations = () => {
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProperty, setSelectedProperty] = useState('all');
  const [selectedDateRange, setSelectedDateRange] = useState('upcoming');
  const [properties, setProperties] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [meta, setMeta] = useState({
    total: 0,
    limit: 10,
    offset: 0,
    hasMore: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch properties on component mount
  useEffect(() => {
    fetchProperties();
  }, []);
  
  // Fetch reservations when properties are loaded
  useEffect(() => {
    if (properties.length > 0) {
      fetchReservations();
    }
  }, [properties]);
  
  // Function to fetch all properties
  const fetchProperties = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await api.getListings();
      console.log("Properties loaded:", data);
      setProperties(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching properties:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to fetch reservations with filters
  const fetchReservations = async (offset = 0) => {
    setLoading(true);
    setError(null);
    
    try {
      // Build filter params
      const filters = { ...getReservationFilters(), offset };
      
      // Fetch reservations with safer handling
      const result = await api.getReservations(filters);
      console.log("Raw reservations data:", result);
      
      // Safely extract data with defaults
      const data = result?.reservations || [];
      const metaData = result?.meta || { 
        total: 0, 
        limit: 10, 
        offset: 0, 
        hasMore: false 
      };
      
      setReservations(data);
      setMeta(metaData);
    } catch (err) {
      console.error("Error fetching reservations:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Build reservation filter parameters
  const getReservationFilters = () => {
    const filters = { limit: 10 };
    
    // Filter by property if selected
    if (selectedProperty !== 'all') {
      filters.listingId = selectedProperty;
    }
    
    // Filter by date range
    const now = new Date();
    if (selectedDateRange === 'upcoming') {
      filters.arrivalStartDate = now.toISOString().split('T')[0];
    } else if (selectedDateRange === 'past') {
      filters.departureEndDate = now.toISOString().split('T')[0];
    } else if (selectedDateRange === 'current') {
      filters.arrivalEndDate = now.toISOString().split('T')[0];
      filters.departureStartDate = now.toISOString().split('T')[0];
    }
    
    // Add search query if present
    if (searchQuery) {
      filters.search = searchQuery;
    }
    
    return filters;
  };
  
  // Apply filters when search is executed
  const handleFilterChange = () => {
    fetchReservations(0); // Reset to first page
  };
  
  // Handle property change
  const handlePropertyChange = (e) => {
    setSelectedProperty(e.target.value);
    setTimeout(handleFilterChange, 0);
  };
  
  // Handle date range change
  const handleDateRangeChange = (e) => {
    setSelectedDateRange(e.target.value);
    setTimeout(handleFilterChange, 0);
  };
  
  // Pagination: go to next page
  const nextPage = () => {
    if (meta.hasMore) {
      fetchReservations(meta.offset + meta.limit);
    }
  };
  
  // Pagination: go to previous page
  const prevPage = () => {
    if (meta.offset > 0) {
      fetchReservations(Math.max(0, meta.offset - meta.limit));
    }
  };
  
  // Helper to find property by ID
  const getPropertyById = (id) => {
    // First check listingMapId match
    let property = properties.find(p => p.id === id || p.listingMapId === id);
    
    if (!property) {
      // If no matching property, create a fallback with the name from reservation
      return { 
        id: id, 
        name: reservations.find(r => r.listingId === id || r.listingMapId === id)?.listingName || `Property #${id}` 
      };
    }
    
    return property;
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(parseFloat(amount) || 0);
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  // Calculate nights
  const calculateNights = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 0;
  };

  // Icon components for better readability
  const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  );

  const ExportIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7 10 12 15 17 10"></polyline>
      <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
  );

  const MoreIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1"></circle>
      <circle cx="19" cy="12" r="1"></circle>
      <circle cx="5" cy="12" r="1"></circle>
    </svg>
  );

  const PrevIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"></polyline>
    </svg>
  );

  const NextIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  );

  return (
    <div className="reservations-container">
      <div className="page-header">
        <h1 className="page-title">Reservations</h1>
      </div>

      <div className="reservations-filters">
        <div className="search-container">
          <span className="search-icon">
            <SearchIcon />
          </span>
          <input
            type="text"
            className="search-input"
            placeholder="Search by guest name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleFilterChange()}
          />
          <button className="search-button" onClick={handleFilterChange}>
            Search
          </button>
        </div>
        
        <div className="filter-group">
          <select
            value={selectedProperty}
            onChange={handlePropertyChange}
            className="filter-select"
            disabled={loading && properties.length === 0}
          >
            <option value="all">All Properties</option>
            {properties.map(property => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            ))}
          </select>
          
          <select
            value={selectedDateRange}
            onChange={handleDateRangeChange}
            className="filter-select"
          >
            <option value="all">All Dates</option>
            <option value="upcoming">Upcoming</option>
            <option value="current">Current</option>
            <option value="past">Past</option>
          </select>
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
            <button onClick={handleFilterChange} className="retry-button">Retry</button>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Guest</th>
                <th>Property & Dates</th>
                <th>Price Details</th>
                <th>Fees</th>
                <th>Owner Payout</th>
                <th>Status</th>
                <th className="table-actions"></th>
              </tr>
            </thead>
            <tbody>
              {reservations.length === 0 ? (
                <tr>
                  <td colSpan="7" className="no-data-cell">
                    <p>No reservations found with the current filters.</p>
                  </td>
                </tr>
              ) : (
                reservations.map(reservation => {
                  // Skip rendering if missing critical data
                  if (!reservation || !reservation.id) return null;
                  
                  // Extract property details - improve matching by using both ID fields
                  const propertyId = reservation.listingId || reservation.listingMapId;
                  const property = getPropertyById(propertyId);
                  
                  // Get proper nights value - use reservation.nights if available
                  const nights = reservation.nights || calculateNights(reservation.arrivalDate || reservation.checkInDate, 
                                                              reservation.departureDate || reservation.checkOutDate);
                  
                  // Calculate per night rate
                  const totalPrice = parseFloat(reservation.totalPrice) || 0;
                  const basePrice = totalPrice > 0 && nights > 0 
                    ? (totalPrice - (parseFloat(reservation.cleaningFee) || 0)) / nights 
                    : parseFloat(reservation.basePrice) || 0;
                  
                  // Calculate various price components with fallbacks
                  const cleaningFee = parseFloat(reservation.cleaningFee) || 0;
                  const bookingFee = parseFloat(reservation.airbnbListingHostFee) || 
                                    parseFloat(reservation.serviceFee) || 
                                    (totalPrice * 0.03); // Estimate if not provided
                  
                  const taxes = parseFloat(reservation.taxAmount) || 
                              parseFloat(reservation.airbnbTransientOccupancyTaxPaidAmount) || 
                              (totalPrice * 0.12); // Estimate if not provided
                  
                  const extraFees = parseFloat(reservation.extraFees) || 0;
                  const amenitiesFee = parseFloat(reservation.amenitiesFee) || 0;
                  
                  // Management fee calculation (adjust percentage based on your business model)
                  const managementFeePercent = 0.15;
                  const managementFee = (basePrice * nights + cleaningFee) * managementFeePercent;
                  
                  // Owner payout - use airbnbExpectedPayoutAmount if available
                  const ownerPayout = parseFloat(reservation.airbnbExpectedPayoutAmount) || 
                                    (basePrice * nights + cleaningFee + amenitiesFee + extraFees - managementFee);
                  
                  // Format reservation status
                  const status = reservation.status || 'confirmed';
                  
                  return (
                    <tr key={reservation.id}>
                      <td>
                        <div className="guest-cell">
                          <div className="guest-name">{reservation.guestName || 'Guest'}</div>
                          <div className="booking-source">{reservation.source || reservation.channelName || 'Direct'}</div>
                        </div>
                      </td>
                      <td>
                        <div className="property-cell">
                          <div className="property-name">{reservation.listingName || property.name}</div>
                          <div className="dates">
                            {formatDate(reservation.arrivalDate || reservation.checkInDate)} to {formatDate(reservation.departureDate || reservation.checkOutDate)}
                          </div>
                          <div className="nights">{nights} nights</div>
                        </div>
                      </td>
                      <td>
                        <div className="price-cell">
                          <div className="price-detail">
                            <span className="price-label">Per Night:</span>
                            <span className="price-value">{formatCurrency(basePrice)}</span>
                          </div>
                          <div className="price-detail">
                            <span className="price-label">Total:</span>
                            <span className="price-value">{formatCurrency(totalPrice)}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="fees-cell">
                          <div className="fee-detail">
                            <span className="fee-label">Booking:</span>
                            <span className="fee-value">{formatCurrency(bookingFee)}</span>
                          </div>
                          <div className="fee-detail">
                            <span className="fee-label">Taxes:</span>
                            <span className="fee-value">{formatCurrency(taxes)}</span>
                          </div>
                          <div className="fee-detail">
                            <span className="fee-label">Cleaning:</span>
                            <span className="fee-value">{formatCurrency(cleaningFee)}</span>
                          </div>
                          <div className="fee-detail">
                            <span className="fee-label">Amenities:</span>
                            <span className="fee-value">{formatCurrency(amenitiesFee)}</span>
                          </div>
                          <div className="fee-detail">
                            <span className="fee-label">Extra:</span>
                            <span className="fee-value">{formatCurrency(extraFees)}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="payout-cell">
                          <div className="payout-detail">
                            <span className="payout-label">PM Fee:</span>
                            <span className="payout-value">{formatCurrency(managementFee)}</span>
                          </div>
                          <div className="payout-detail owner-payout">
                            <span className="payout-label">Owner:</span>
                            <span className="payout-value">{formatCurrency(ownerPayout)}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${status.toLowerCase()}`}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                      </td>
                      <td className="table-actions">
                        <button className="action-button">
                          <MoreIcon />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>
      
      {/* Pagination */}
      {!loading && !error && reservations.length > 0 && (
        <div className="pagination">
          <button 
            className="pagination-button" 
            onClick={prevPage}
            disabled={meta.offset === 0}
          >
            <PrevIcon />
            Previous
          </button>
          <div className="pagination-info">
            Showing {meta.offset + 1}-{Math.min(
              meta.offset + reservations.length,
              meta.total
            )} of {meta.total} reservations
          </div>
          <button 
            className="pagination-button" 
            onClick={nextPage}
            disabled={!meta.hasMore}
          >
            Next
            <NextIcon />
          </button>
        </div>
      )}
    </div>
  );
};

export default Reservations;