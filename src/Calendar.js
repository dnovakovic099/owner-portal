import React, { useState, useEffect, useRef } from 'react';
import { processReservationsWithFinancials } from './utils/reservationFinancials';
import api from './api/api';
import './Calendar.css';

export const Calendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedView, setSelectedView] = useState('month');
  const [showPrices, setShowPrices] = useState(false);
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState('');
  const [calendarData, setCalendarData] = useState([]);
  const [processedReservations, setProcessedReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoverReservation, setHoverReservation] = useState(null);
  const [financialData, setFinancialData] = useState(null);
  const hoverTimeoutRef = useRef(null);
  
  // Fetch properties on component mount
  useEffect(() => {
    fetchProperties();
  }, []);
  
  // Fetch calendar data when property or month changes
  useEffect(() => {
    if (selectedProperty) {
      console.log('Fetching calendar data for property:', selectedProperty);
      fetchCalendarData();
    }
  }, [selectedProperty, currentMonth.getMonth(), currentMonth.getFullYear()]); // Only re-run when these specific values change
  
  // Function to fetch properties
  const fetchProperties = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await api.getListings();
      
      // Make sure we have valid properties array
      const propertiesList = Array.isArray(data) ? data : [];
      setProperties(propertiesList);
      
      // Set first property as selected by default if available
      if (propertiesList.length > 0 && !selectedProperty) {
        setSelectedProperty(propertiesList[0].id);
      }
      
    } catch (err) {
      console.error("Error fetching properties:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to fetch calendar data
  const fetchCalendarData = async () => {
    if (!selectedProperty) {
      console.warn("No property selected, cannot fetch calendar data");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Calculate start and end date for the current month view
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      
      // Get first day of month
      const firstDayOfMonth = new Date(year, month, 1);
      
      // Get last day of month
      const lastDayOfMonth = new Date(year, month + 1, 0);
      
      // Extend dates to include days from previous/next month to fill calendar grid
      const startDate = new Date(firstDayOfMonth);
      startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());
      
      const endDate = new Date(lastDayOfMonth);
      const daysToAdd = 6 - lastDayOfMonth.getDay();
      endDate.setDate(endDate.getDate() + daysToAdd);
      
      // Format dates as YYYY-MM-DD
      const formattedStartDate = startDate.toISOString().split('T')[0];
      const formattedEndDate = endDate.toISOString().split('T')[0];
      
      console.log(`Fetching data for property ID: ${selectedProperty} from ${formattedStartDate} to ${formattedEndDate}`);
      
      // Fetch reservations for this date range
      const { reservations } = await api.getReservations({
        listingId: selectedProperty,
        checkInDateFrom: formattedStartDate,
        checkOutDateTo: formattedEndDate,
        limit: 100
      });
      
      // Fetch financial report data for proper owner payout info
      let financialReport = null;
      try {
        financialReport = await api.getFinancialReport({
          listingMapIds: [selectedProperty],
          startDate: formattedStartDate,
          endDate: formattedEndDate
        });
        
        console.log('Financial report fetched successfully');
      } catch (financialError) {
        console.error("Error fetching financial report:", financialError);
        // Continue without financial data
      }
      
      // Process reservation financials with the financial report data
      const reservationsWithFinancials = await processReservationsWithFinancials(reservations || [], financialReport);
      
      // Generate calendar grid
      const grid = generateCalendarGrid(startDate, endDate);
      setCalendarData(grid);
      
      // Process reservations for display
      const processed = processReservationsForDisplay(reservationsWithFinancials, grid);
      setProcessedReservations(processed);
      
    } catch (err) {
      console.error("Error fetching calendar data:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Generate calendar grid
  const generateCalendarGrid = (startDate, endDate) => {
    const grid = [];
    const currentDate = new Date(startDate);
    const month = currentMonth.getMonth();
    
    while (currentDate <= endDate) {
      const date = new Date(currentDate);
      grid.push({
        date,
        day: date.getDate(),
        isCurrentMonth: date.getMonth() === month,
        price: Math.floor(Math.random() * 100) + 200 // Random price for demo
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return grid;
  };

  // Process reservations for display
  const processReservationsForDisplay = (rawReservations, grid) => {
    // Create a map of dates to grid indexes
    const dateToIndexMap = {};
    grid.forEach((day, index) => {
      const dateStr = day.date.toISOString().split('T')[0];
      dateToIndexMap[dateStr] = index;
    });
    
    // Process each reservation with basic info first
    const processedWithBasicInfo = rawReservations.map(reservation => {
      // Get check-in and check-out dates
      const checkIn = new Date(reservation.arrivalDate || reservation.checkInDate);
      const checkOut = new Date(reservation.departureDate || reservation.checkOutDate);
      
      // Reset hours for proper comparison
      checkIn.setHours(0, 0, 0, 0);
      checkOut.setHours(0, 0, 0, 0);
      
      // Check if reservation is in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isPast = checkOut < today;
      
      // Choose color based on booking source
      let color = '#ff385c'; // Default Airbnb red
      const source = (reservation.source || reservation.channelName || '').toLowerCase();
      
      if (source.includes('vrbo') || source.includes('homeaway')) {
        color = '#3662d8'; // VRBO blue
      } else if (source.includes('booking.com')) {
        color = '#003580'; // Booking.com blue
      } else if (source.includes('direct') || source.includes('luxury') || source.includes('luxurylodging')) {
        color = '#b39149'; // Gold for Luxury Lodging (direct bookings and luxurylodging)
      }
      
      // If it's a past reservation, use gray
      if (isPast) {
        color = '#767676';
      }
      
      // Get guest initial
      const guestName = reservation.guestName || 'Guest';
      const initial = guestName.charAt(0).toUpperCase();
      
      // Find calendar grid indexes for this reservation
      const startIndex = dateToIndexMap[checkIn.toISOString().split('T')[0]];
      
      // Use the actual checkout date for visual representation
      const endIndex = dateToIndexMap[checkOut.toISOString().split('T')[0]];
      
      // Ensure we have the owner payout
      const ownerPayout = reservation.ownerPayout || reservation.payout || reservation.netAmount || 0;
      
      return {
        ...reservation,
        id: reservation.id || `res-${Math.random().toString(36).substr(2, 9)}`,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        isPast,
        color,
        initial,
        guestCount: reservation.guestsCount || reservation.guests || 1,
        totalPrice: parseFloat(reservation.totalPrice) || 0,
        ownerPayout: typeof ownerPayout === 'string' ? parseFloat(ownerPayout) : (ownerPayout || 0),
        nights: calculateNights(checkIn, checkOut),
        // Grid placement
        startIndex,
        endIndex,
        verticalPosition: 0 // Default position
      };
    }).filter(res => res.startIndex !== undefined && res.endIndex !== undefined);
    
    // Create a position assigner to track overlapping reservations
    const positionAssigner = {};
    
    // First sort by check-in date and duration (shorter reservations first to optimize vertical space)
    processedWithBasicInfo.sort((a, b) => {
      // First by check-in date
      if (a.startIndex !== b.startIndex) {
        return a.startIndex - b.startIndex;
      }
      // Then by duration (shorter first)
      return (a.endIndex - a.startIndex) - (b.endIndex - b.startIndex);
    });
    
    // Assign positions
    const processedWithPositions = processedWithBasicInfo.map(reservation => {
      // Initialize position trackers for all days of this reservation
      for (let day = reservation.startIndex; day <= reservation.endIndex; day++) {
        if (!positionAssigner[day]) {
          positionAssigner[day] = [];
        }
      }
      
      // Find the first available position
      let position = 0;
      let foundPosition = false;
      
      while (!foundPosition) {
        foundPosition = true;
        
        // Check if this position is available for all days of this reservation
        for (let day = reservation.startIndex; day <= reservation.endIndex; day++) {
          if (positionAssigner[day].includes(position)) {
            foundPosition = false;
            position++;
            break;
          }
        }
      }
      
      // Mark this position as occupied for all days of this reservation
      for (let day = reservation.startIndex; day <= reservation.endIndex; day++) {
        positionAssigner[day].push(position);
      }
      
      // Calculate vertical offset (20px per position)
      const verticalOffset = position * 20;
      
      return {
        ...reservation,
        verticalPosition: verticalOffset
      };
    });
    
    return processedWithPositions;
  };
  
  // Calculate nights between two dates
  const calculateNights = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 0;
    
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Format month and year
  const formatMonthYear = (date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };
  
  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  
  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };
  
  // Navigate to today
  const goToToday = () => {
    setCurrentMonth(new Date());
  };
  
  // Handle property change
  const handlePropertyChange = (e) => {
    setSelectedProperty(e.target.value);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Handle reservation hover
  const handleReservationHover = (reservation, event) => {
    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    if (reservation) {
      // Calculate position for hover card
      const rect = event.currentTarget.getBoundingClientRect();
      
      // Calculate position relative to viewport
      const hoverData = {
        ...reservation,
        position: {
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width
        }
      };
      setHoverReservation(hoverData);
    } else {
      // Set a delay before hiding the card to allow moving to the card
      hoverTimeoutRef.current = setTimeout(() => {
        setHoverReservation(null);
        hoverTimeoutRef.current = null;
      }, 150);
    }
  };

  // Handle hover card mouse events
  const handleHoverCardMouseEnter = () => {
    // Clear any hide timeout when entering the card
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  const handleHoverCardMouseLeave = () => {
    // Hide the card when the mouse leaves
    setHoverReservation(null);
  };

  // Check if a day has reservations
  const dayHasReservation = (index) => {
    return processedReservations.some(
      res => index >= res.startIndex && index <= res.endIndex
    );
  };

  return (
    <div className="calendar-container">
      <div className="page-header">
        <h1 className="page-title">Calendar</h1>
      </div>

      {/* Property selector */}
      <div className="property-selector">
        <div className="property-select-wrapper">
          <select
            value={selectedProperty}
            onChange={handlePropertyChange}
            className="property-select"
          >
            <option value="" disabled>Select a property</option>
            {properties.map(property => (
              <option key={property.id} value={property.id}>
                {property.internalListingName || property.name || `Property #${property.id}`}
              </option>
            ))}
          </select>
          <span className="select-arrow">▼</span>
        </div>
        
        {/* Total Owner Payout Summary - moved to be on same line as dropdown */}
        {!loading && selectedProperty && processedReservations.length > 0 && (
          <div className="inline-payout-summary">
            <span className="payout-amount">
              {formatCurrency(
                processedReservations
                  .filter(res => {
                    // Only include reservations that start in the current month
                    const resMonth = res.checkInDate.getMonth();
                    const resYear = res.checkInDate.getFullYear();
                    return resMonth === currentMonth.getMonth() && resYear === currentMonth.getFullYear();
                  })
                  .reduce((sum, res) => sum + (res.ownerPayout || 0), 0)
              )}
            </span>
          </div>
        )}
      </div>

      {loading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading calendar data...</p>
        </div>
      )}

      {error && (
        <div className="error-container">
          <p>Error loading data: {error.message}</p>
          <button onClick={fetchCalendarData} className="retry-button">Retry</button>
        </div>
      )}

      {!loading && !error && selectedProperty && (
        <div className="calendar-view">
          <div className="calendar-header-bar">
            <div className="month-nav">
              <button className="month-nav-button" onClick={goToPreviousMonth} aria-label="Previous month">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 19L8 12L15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <h2 className="month-display">{formatMonthYear(currentMonth)}</h2>
              <button className="month-nav-button" onClick={goToNextMonth} aria-label="Next month">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 5L16 12L9 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            
            <div className="calendar-actions">
              <button className="today-btn" onClick={goToToday}>Today</button>
              
              <div className="view-selector">
                <button 
                  className={`view-btn ${selectedView === 'month' ? 'active' : ''}`}
                  onClick={() => setSelectedView('month')}
                >
                  Month
                </button>
              </div>
            </div>
          </div>
          
          <div className="airbnb-calendar">
            <div className="weekday-header">
              <div className="weekday">Su</div>
              <div className="weekday">Mo</div>
              <div className="weekday">Tu</div>
              <div className="weekday">We</div>
              <div className="weekday">Th</div>
              <div className="weekday">Fr</div>
              <div className="weekday">Sa</div>
            </div>
            
            {/* Calendar grid - simplified layout */}
            <div className="calendar-grid">
              {calendarData.map((day, index) => (
                <div 
                  key={index} 
                  className={`calendar-cell ${!day.isCurrentMonth ? 'outside-month' : ''}`}
                  data-index={index}
                >
                  <div className="date-number">{day.day}</div>
                  
                  {/* Show prices for available dates only */}
                  {showPrices && day.isCurrentMonth && !dayHasReservation(index) && (
                    <div className="day-price">
                      {formatCurrency(
                        processedReservations
                          .filter(res => 
                            res.startIndex <= index && 
                            res.endIndex >= index && 
                            res.ownerPayout
                          )
                          .reduce((sum, res) => sum + res.ownerPayout, 0) || 0
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Reservations overlay */}
            <div className="reservations-overlay">
              {processedReservations.map((reservation, index) => {
                // Only render if we have valid start and end indexes
                if (typeof reservation.startIndex !== 'number' || typeof reservation.endIndex !== 'number') {
                  return null;
                }
                
                // Calculate the width based on days
                const width = (reservation.endIndex - reservation.startIndex + 1) * 100 / 7; // 7 days per row
                
                // Calculate which row this reservation is in (0-indexed)
                const rowStart = Math.floor(reservation.startIndex / 7);
                const rowEnd = Math.floor(reservation.endIndex / 7);
                
                // Multi-row reservation handling
                if (rowStart !== rowEnd) {
                  // For multi-row reservations, render separate segments
                  const segments = [];
                  
                  // Check if the reservation ends on the first day of a row (Sunday)
                  const endsOnFirstDayOfRow = reservation.endIndex % 7 === 0;
                  
                  // Check if reservation ends on the last day of a row (Saturday)
                  const endsOnLastDayOfRow = reservation.endIndex % 7 === 6;
                  
                  // First row - from start to end of row
                  const firstRowCellsLeft = 7 - (reservation.startIndex % 7);
                  const firstRowWidth = firstRowCellsLeft * 100 / 7;
                  
                  // Add first row segment
                  segments.push({
                    row: rowStart,
                    startCol: reservation.startIndex % 7,
                    width: firstRowWidth,
                    type: 'start'
                  });
                  
                  // Add middle rows (if any) - full width
                  for (let r = rowStart + 1; r < rowEnd; r++) {
                    segments.push({
                      row: r,
                      startCol: 0,
                      width: 100,
                      type: 'middle'
                    });
                  }
                  
                  // Last row handling depends on where it ends
                  if (endsOnFirstDayOfRow) {
                    // Ends on Sunday (first day of row)
                    segments.push({
                      row: rowEnd,
                      startCol: 0,
                      width: (100 / 7) * 0.45, // End at 45% of Sunday cell width
                      type: 'end'
                    });
                  } else if (endsOnLastDayOfRow) {
                    // Ends on Saturday (last day of row)
                    segments.push({
                      row: rowEnd,
                      startCol: 0,
                      width: 100 - (100 / 7) * 0.55, // End at 45% into the last cell
                      type: 'end'
                    });
                  } else {
                    // Ends on a day in the middle of the row
                    const lastRowCells = (reservation.endIndex % 7) + 1;
                    // Adjust width to end at 45% into the last cell
                    const lastRowWidth = ((lastRowCells - 1) * (100 / 7)) + ((100 / 7) * 0.45);
                    
                    segments.push({
                      row: rowEnd,
                      startCol: 0,
                      width: lastRowWidth,
                      type: 'end'
                    });
                  }
                  
                  return segments.map((segment, segIndex) => (
                    <div
                      key={`${reservation.id}-segment-${segIndex}`}
                      className={`reservation-bar ${segment.type}`}
                      style={{
                        backgroundColor: reservation.color,
                        top: `calc(${segment.row} * (100% / 6) + (55px / 2) - (36px / 2) + 25px)`,
                        left: segment.type === 'start' 
                          ? `calc(${segment.startCol} * (100% / 7) + (100% / 7) * 0.55)` 
                          : `calc(${segment.startCol} * (100% / 7))`,
                        width: segment.type === 'middle' 
                          ? '100%' 
                          : segment.type === 'start' 
                            ? `calc(${segment.width}% - (100% / 7) * 0.55)` 
                            : `calc(${segment.width}%)`,
                        height: '36px'
                      }}
                      onMouseEnter={(e) => handleReservationHover(reservation, e)}
                      onMouseLeave={() => handleReservationHover(null)}
                    >
                      {segment.type === 'start' && (
                        <div className="guest-info">
                          <div className="initial-circle">
                            {reservation.initial}
                          </div>
                          <div className="reservation-info">
                            <div className="guest-name">
                              {reservation.guestName}
                              <span className="owner-payout">{formatCurrency(reservation.ownerPayout || 0)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ));
                }
                
                // Single row reservation
                return (
                  <div
                    key={`${reservation.id}-single-row`}
                    className="reservation-bar single-row"
                    style={{
                      backgroundColor: reservation.color,
                      top: `calc(${rowStart} * (100% / 6) + (55px / 2) - (36px / 2) + 25px)`,
                      left: `calc(${reservation.startIndex % 7} * (100% / 7) + (100% / 7) * 0.55)`,
                      width: reservation.startIndex === reservation.endIndex 
                        ? `calc((100% / 7) * 0.45)` 
                        : `calc((${reservation.endIndex - reservation.startIndex}) * (100% / 7) + (100% / 7) * 0.45 - (100% / 7) * 0.55)`,
                      height: '36px'
                    }}
                    onMouseEnter={(e) => handleReservationHover(reservation, e)}
                    onMouseLeave={() => handleReservationHover(null)}
                  >
                    <div className="guest-info">
                      <div className="initial-circle">
                        {reservation.initial}
                      </div>
                      <div className="reservation-info">
                        <div className="guest-name">
                          {reservation.guestName}
                          <span className="owner-payout">{formatCurrency(reservation.ownerPayout || 0)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {!selectedProperty && !loading && (
        <div className="empty-state">
          <h3>Please select a property</h3>
          <p>Select a property from the dropdown to view its calendar.</p>
        </div>
      )}
      
      {/* Reservation hover card */}
      {hoverReservation && (
        <div 
          className="reservation-details-card"
          style={{
            top: hoverReservation.position.top < window.innerHeight / 2 
              ? `${hoverReservation.position.top + 30}px` 
              : `${hoverReservation.position.top - 180}px`,
            left: `${Math.min(hoverReservation.position.left, window.innerWidth - 300)}px`
          }}
          onMouseEnter={handleHoverCardMouseEnter}
          onMouseLeave={handleHoverCardMouseLeave}
        >
          <div className="card-header">
            <div className="guest-profile">
              <div className="initial-circle" style={{ backgroundColor: hoverReservation.color }}>
                {hoverReservation.initial}
              </div>
              <div className="guest-name-container">
                <h4>{hoverReservation.guestName}</h4>
                <span className="booking-source">
                  {(() => {
                    const source = (hoverReservation.source || hoverReservation.channelName || '').toLowerCase();
                    if (source.includes('airbnb')) return 'Airbnb';
                    if (source.includes('vrbo') || source.includes('homeaway')) return 'Vrbo';
                    if (source.includes('booking.com')) return 'Booking.com';
                    // Both direct and luxury should show as Luxury Lodging
                    return 'Luxury Lodging';
                  })()}
                </span>
              </div>
            </div>
          </div>
          
          <div className="card-body">
            <div className="reservation-details">
              <div className="detail-row">
                <div className="detail-item">
                  <span className="detail-label">Check-in</span>
                  <span className="detail-value">
                    {hoverReservation.checkInDate.toLocaleDateString()}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Check-out</span>
                  <span className="detail-value">
                    {hoverReservation.checkOutDate.toLocaleDateString()}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Nights</span>
                  <span className="detail-value">{hoverReservation.nights}</span>
                </div>
              </div>
              
              <div className="price-row">
                <span className="detail-label">Owner Payout</span>
                <span className="total-price">
                  {formatCurrency(hoverReservation.ownerPayout || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;