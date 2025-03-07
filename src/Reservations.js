import React, { useState } from 'react';
import { useReservations, useListings } from './api/hostawayHooks';
import './Reservations.css';

export const Reservations = () => {
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProperty, setSelectedProperty] = useState('all');
  const [selectedDateRange, setSelectedDateRange] = useState('upcoming');
  
  // Get listings/properties
  const { 
    data: properties, 
    loading: propertiesLoading 
  } = useListings();
  
  // Setup filters for reservations
  const getReservationFilters = () => {
    const filters = { limit: 10 };
    
    // Only get confirmed reservations (handled in the hook)
    // confirmed = true is default in useReservations
    
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
  
  // Get reservations with filters
  const {
    data: reservations,
    loading: reservationsLoading,
    error: reservationsError,
    meta: reservationsMeta,
    nextPage,
    prevPage,
    updateParams
  } = useReservations(true, getReservationFilters());

  console.log({ reservations, reservationsLoading })
  
  // Apply filters when changed
  const handleFilterChange = () => {
    updateParams(getReservationFilters());
  };
  
  // Helper to find property by ID
  const getPropertyById = (id) => {
    return properties.find(p => p.id === id) || { name: `Property #${id}` };
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  // Calculate nights
  const calculateNights = (checkIn, checkOut) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="reservations-container">
      <div className="page-header">
        <h1 className="page-title">Reservations</h1>
      </div>

      <div className="reservations-filters">
        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="Search by guest name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleFilterChange()}
          />
          <span className="search-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </span>
          <button className="search-button" onClick={handleFilterChange}>Search</button>
        </div>
        
        <div className="filter-group">
          <select
            value={selectedProperty}
            onChange={(e) => {
              setSelectedProperty(e.target.value);
              setTimeout(handleFilterChange, 0);
            }}
            className="filter-select"
            disabled={propertiesLoading}
          >
            <option value="all">All Properties</option>
            {properties.map(property => (
              <option key={property.id} value={property.id}>{property.name}</option>
            ))}
          </select>
          
          <select
            value={selectedDateRange}
            onChange={(e) => {
              setSelectedDateRange(e.target.value);
              setTimeout(handleFilterChange, 0);
            }}
            className="filter-select"
          >
            <option value="all">All Dates</option>
            <option value="upcoming">Upcoming</option>
            <option value="current">Current</option>
            <option value="past">Past</option>
          </select>
        </div>
        
        <button className="export-button">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Export
        </button>
      </div>

      {/* Reservations Table */}
      <div className="table-container">
        {reservationsLoading ? (
          <div className="loading-indicator">
            <div className="spinner"></div>
            <p>Loading reservations...</p>
          </div>
        ) : reservationsError ? (
          <div className="error-message">
            <p>Error loading reservations: {reservationsError.message}</p>
            <button onClick={handleFilterChange}>Retry</button>
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
                  const property = getPropertyById(reservation.listingId);
                  const nights = calculateNights(reservation.checkInDate, reservation.checkOutDate);
                  
                  // Calculate various price components (note: actual fields depend on Hostaway API response)
                  // These calculations are estimates based on typical short-term rental breakdowns
                  const nightlyTotal = reservation.basePrice * nights;
                  const cleaningFee = reservation.cleaningFee || 0;
                  const bookingFee = reservation.serviceFee || (reservation.totalPrice * 0.03); // Estimate if not provided
                  const taxes = reservation.taxAmount || (reservation.totalPrice * 0.12); // Estimate if not provided
                  const extraFees = reservation.extraFees || 0;
                  const amenitiesFee = reservation.amenitiesFee || 0;
                  
                  // Management fee is typically a percentage of booking total
                  const managementFeePercent = 0.15; // 15% is common
                  const managementFee = (nightlyTotal + cleaningFee) * managementFeePercent;
                  
                  // Calculate owner payout
                  const ownerPayout = nightlyTotal + cleaningFee + amenitiesFee + extraFees - managementFee;
                  
                  return (
                    <tr key={reservation.id}>
                      <td>
                        <div className="guest-cell">
                          <div className="guest-name">{reservation.guestName}</div>
                          <div className="booking-source">{reservation.source || 'Direct'}</div>
                        </div>
                      </td>
                      <td>
                        <div className="property-cell">
                          <div className="property-name">{property.name}</div>
                          <div className="dates">
                            {formatDate(reservation.checkInDate)} to {formatDate(reservation.checkOutDate)}
                          </div>
                          <div className="nights">{nights} nights</div>
                        </div>
                      </td>
                      <td>
                        <div className="price-cell">
                          <div className="price-detail">
                            <span className="price-label">Per Night:</span>
                            <span className="price-value">{formatCurrency(reservation.basePrice)}</span>
                          </div>
                          <div className="price-detail">
                            <span className="price-label">Total:</span>
                            <span className="price-value">{formatCurrency(nightlyTotal)}</span>
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
                        <span className="status-badge confirmed">
                          {reservation.status || 'Confirmed'}
                        </span>
                      </td>
                      <td className="table-actions">
                        <button className="action-button">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="1"></circle>
                            <circle cx="19" cy="12" r="1"></circle>
                            <circle cx="5" cy="12" r="1"></circle>
                          </svg>
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
      {!reservationsLoading && !reservationsError && reservations.length > 0 && (
        <div className="pagination">
          <button 
            className="pagination-button" 
            onClick={prevPage}
            disabled={reservationsMeta.offset === 0}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            Previous
          </button>
          <div className="pagination-info">
            Showing {reservationsMeta.offset + 1}-{Math.min(
              reservationsMeta.offset + reservations.length,
              reservationsMeta.total
            )} of {reservationsMeta.total} reservations
          </div>
          <button 
            className="pagination-button" 
            onClick={nextPage}
            disabled={!reservationsMeta.hasMore}
          >
            Next
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};
