import React, { useState, useEffect } from 'react';
import api from './api/api';
import './Calendar.css';

export const Calendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedView, setSelectedView] = useState('month');
  const [showPrices, setShowPrices] = useState(true);
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState('');
  const [calendarData, setCalendarData] = useState([]);
  const [processedReservations, setProcessedReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoverReservation, setHoverReservation] = useState(null);
  
  // Fetch properties on component mount
  useEffect(() => {
    fetchProperties();
  }, []);
  
  // Fetch calendar data when property or month changes
  useEffect(() => {
    if (selectedProperty) {
      fetchCalendarData();
    }
  }, [selectedProperty, currentMonth]);
  
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
    if (!selectedProperty) return;
    
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
      
      // Fetch reservations for this date range
      const { reservations } = await api.getReservations({
        listingId: selectedProperty,
        checkInDateFrom: formattedStartDate,
        checkOutDateTo: formattedEndDate,
        limit: 100
      });
      
      // Generate calendar grid
      const grid = generateCalendarGrid(startDate, endDate);
      setCalendarData(grid);
      
      // Process reservations for display
      const processed = processReservationsForDisplay(reservations || [], grid);
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
    
    return rawReservations.map(reservation => {
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
      } else if (source.includes('booking')) {
        color = '#003580'; // Booking.com blue
      } else if (source.includes('direct')) {
        color = '#008489'; // Teal for direct bookings
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
      
      // End date is exclusive in reservations, so subtract one day
      const lastDay = new Date(checkOut);
      lastDay.setDate(lastDay.getDate() - 1);
      const endIndex = dateToIndexMap[lastDay.toISOString().split('T')[0]];
      
      // Calculate row based on other reservations
      const row = 0; // We'll implement row calculations later
      
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
        nights: calculateNights(checkIn, checkOut),
        // Grid placement
        startIndex,
        endIndex,
        row
      };
    });
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
      setHoverReservation(null);
    }
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
        
        <div className="view-tabs">
          <button className="view-tab active">Calendar</button>
          <button className="view-tab">Booking Report</button>
        </div>
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
                {property.name || `Property #${property.id}`}
              </option>
            ))}
          </select>
          <span className="select-arrow">▼</span>
        </div>
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
                <button 
                  className={`view-btn ${selectedView === 'week' ? 'active' : ''}`}
                  onClick={() => setSelectedView('week')}
                >
                  Week
                </button>
              </div>
              
              <div className="price-toggle">
                <span>Prices</span>
                <label className="toggle">
                  <input 
                    type="checkbox" 
                    checked={showPrices} 
                    onChange={() => setShowPrices(!showPrices)}
                  />
                  <span className="toggle-slider"></span>
                </label>
                <button className="add-btn" aria-label="Add">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
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
                    <div className="day-price">{formatCurrency(day.price)}</div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Overlay for reservations - this is the key change */}
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
                  
                  // First row - from start to end of row
                  const firstRowCellsLeft = 7 - (reservation.startIndex % 7);
                  const firstRowWidth = firstRowCellsLeft * 100 / 7;
                  segments.push({
                    row: rowStart,
                    startCol: reservation.startIndex % 7,
                    width: firstRowWidth,
                    type: 'start'
                  });
                  
                  // Middle rows - full width
                  for (let r = rowStart + 1; r < rowEnd; r++) {
                    segments.push({
                      row: r,
                      startCol: 0,
                      width: 100,
                      type: 'middle'
                    });
                  }
                  
                  // Last row - from start of row to end
                  const lastRowCells = (reservation.endIndex % 7) + 1;
                  const lastRowWidth = lastRowCells * 100 / 7;
                  segments.push({
                    row: rowEnd,
                    startCol: 0,
                    width: lastRowWidth,
                    type: 'end'
                  });
                  
                  return segments.map((segment, segIndex) => (
                    <div
                      key={`${reservation.id}-segment-${segIndex}`}
                      className={`reservation-bar ${segment.type}`}
                      style={{
                        backgroundColor: reservation.color,
                        top: `calc(${segment.row} * (100% / 6) + 30px)`, // 6 rows total
                        left: `calc(${segment.startCol} * (100% / 7))`,
                        width: `calc(${segment.width}% - ${segment.type === 'end' ? 8 : 0}px)`,
                        height: '32px'
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
                            <div className="guest-name">{reservation.guestName}</div>
                            <div className="guest-count">
                              {reservation.guestCount} guest{reservation.guestCount !== 1 ? 's' : ''}
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
                    className={`reservation-bar ${rowStart === rowEnd ? 'single-row' : ''}`}
                    style={{
                      backgroundColor: reservation.color,
                      top: `calc(${rowStart} * (100% / 6) + 30px)`, // 6 rows total
                      left: `calc(${reservation.startIndex % 7} * (100% / 7))`,
                      width: `calc(${width}% - 8px)`,
                      height: '32px'
                    }}
                    onMouseEnter={(e) => handleReservationHover(reservation, e)}
                    onMouseLeave={() => handleReservationHover(null)}
                  >
                    <div className="guest-info">
                      <div className="initial-circle">
                        {reservation.initial}
                      </div>
                      <div className="reservation-info">
                        <div className="guest-name">{reservation.guestName}</div>
                        <div className="guest-count">
                          {reservation.guestCount} guest{reservation.guestCount !== 1 ? 's' : ''}
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
            top: `${hoverReservation.position.top + 40}px`,
            left: `${hoverReservation.position.left}px`
          }}
        >
          <div className="card-header">
            <div className="guest-profile">
              <div className="initial-circle" style={{ backgroundColor: hoverReservation.color }}>
                {hoverReservation.initial}
              </div>
              <div className="guest-name-container">
                <h4>{hoverReservation.guestName}</h4>
                <span className="booking-source">{hoverReservation.source || hoverReservation.channelName || 'Direct Booking'}</span>
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
                <span className="detail-label">Total</span>
                <span className="total-price">{formatCurrency(hoverReservation.totalPrice)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;