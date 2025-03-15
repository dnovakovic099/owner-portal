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
      console.log("Properties loaded:", data);
      
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
      
      // Generate calendar days with reservations
      const days = generateCalendarDays(reservations || []);
      setCalendarData(days);
      
    } catch (err) {
      console.error("Error fetching calendar data:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Generate days for the calendar
  const generateCalendarDays = (reservations = []) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Get first day of month and last day of month
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    // Get the day of the week for the first day (0 = Sunday, 6 = Saturday)
    const firstDayOfWeek = firstDayOfMonth.getDay();
    
    // Calculate days from previous month to show
    const daysFromPreviousMonth = firstDayOfWeek;
    
    // Calculate total days to display (previous month days + current month days)
    const totalDaysToDisplay = daysFromPreviousMonth + lastDayOfMonth.getDate();
    
    // Calculate how many rows we need (each row has 7 days)
    const rows = Math.ceil(totalDaysToDisplay / 7);
    
    // Calculate total cells needed (rows * 7)
    const totalCells = rows * 7;
    
    const days = [];
    
    // Add days from previous month
    const previousMonth = new Date(year, month - 1, 0);
    const previousMonthLastDay = previousMonth.getDate();
    
    for (let i = 0; i < daysFromPreviousMonth; i++) {
      const currentDate = new Date(year, month - 1, previousMonthLastDay - daysFromPreviousMonth + i + 1);
      const dayReservations = getReservationsForDate(currentDate, reservations);
      days.push({
        date: currentDate,
        isCurrentMonth: false,
        reservations: dayReservations,
        dayPrice: 700 // Default price
      });
    }
    
    // Add days from current month
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      const currentDate = new Date(year, month, i);
      const dayReservations = getReservationsForDate(currentDate, reservations);
      days.push({
        date: currentDate,
        isCurrentMonth: true,
        reservations: dayReservations,
        dayPrice: 700 // Default price
      });
    }
    
    // Add days from next month
    const remainingCells = totalCells - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      const currentDate = new Date(year, month + 1, i);
      const dayReservations = getReservationsForDate(currentDate, reservations);
      days.push({
        date: currentDate,
        isCurrentMonth: false,
        reservations: dayReservations,
        dayPrice: 700 // Default price
      });
    }
    
    return days;
  };

  // Get reservations for a specific date
  const getReservationsForDate = (date, reservations) => {
    // Format the current date to midnight for comparison
    const currentDate = new Date(date);
    currentDate.setHours(0, 0, 0, 0);
    
    // Check if the date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isPast = currentDate < today;
    
    // Find all reservations that include this date
    return reservations.filter(reservation => {
      // Get the check-in and check-out dates
      const checkIn = new Date(reservation.arrivalDate || reservation.checkInDate);
      const checkOut = new Date(reservation.departureDate || reservation.checkOutDate);
      
      // Reset hours to compare dates properly
      checkIn.setHours(0, 0, 0, 0);
      checkOut.setHours(0, 0, 0, 0);
      
      // Check if the current date falls within the reservation period
      return currentDate >= checkIn && currentDate <= checkOut;
    }).map(reservation => {
      // Get the check-in and check-out dates
      const checkIn = new Date(reservation.arrivalDate || reservation.checkInDate);
      const checkOut = new Date(reservation.departureDate || reservation.checkOutDate);
      
      // Reset hours to compare dates properly
      checkIn.setHours(0, 0, 0, 0);
      checkOut.setHours(0, 0, 0, 0);
      
      // Calculate reservation position
      let position = 'middle';
      if (currentDate.getTime() === checkIn.getTime()) {
        position = 'start';
      }
      if (currentDate.getTime() === checkOut.getTime()) {
        position = 'end';
      }
      if (checkIn.getTime() === checkOut.getTime()) {
        position = 'single';
      }
      
      // Get initial from guest name
      const guestName = reservation.guestName || 'Guest';
      const initial = guestName.charAt(0).toUpperCase();
      
      return {
        ...reservation,
        position,
        isPast,
        initial,
        // Ensure these properties exist
        guestCount: reservation.guestsCount || reservation.guests || 1,
        amount: parseFloat(reservation.totalPrice) || 0,
        color: isPast ? '#767676' : '#5E9E9F'
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
              <button className="month-nav-button" onClick={goToPreviousMonth}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 19L8 12L15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <h2 className="month-display">{formatMonthYear(currentMonth)}</h2>
              <button className="month-nav-button" onClick={goToNextMonth}>
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
                <button className="add-btn">
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
            
            <div className="calendar-grid">
              {calendarData.map((day, index) => (
                <div 
                  key={index} 
                  className={`calendar-cell ${!day.isCurrentMonth ? 'outside-month' : ''}`}
                >
                  <div className="date-number">{day.date.getDate()}</div>
                  
                  {day.reservations.length > 0 && day.reservations.map((reservation, resIndex) => {
                    // Only render if this reservation has guest details
                    if (reservation.guestName) {
                      return (
                        <div 
                          key={`${reservation.id}-${resIndex}`}
                          className="reservation-bar"
                          style={{backgroundColor: reservation.color}}
                          onMouseEnter={(e) => handleReservationHover(reservation, e)}
                          onMouseLeave={() => handleReservationHover(null)}
                        >
                          <div className="guest-info">
                            <div className="initial-circle">
                              {reservation.initial}
                            </div>
                            <div className="reservation-info">
                              <div className="guest-name">{reservation.guestName}</div>
                              <div className="guest-count">{reservation.guestCount} guest{reservation.guestCount !== 1 ? 's' : ''}</div>
                              <div className="reservation-amount">{formatCurrency(reservation.amount)}</div>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    // If not a guest info cell but part of a reservation, render a bar
                    return (
                      <div 
                        key={`${reservation.id}-${resIndex}`}
                        className="reservation-bar"
                        style={{backgroundColor: reservation.color}}
                        onMouseEnter={(e) => handleReservationHover(reservation, e)}
                        onMouseLeave={() => handleReservationHover(null)}
                      />
                    );
                  })}
                  
                  {showPrices && day.isCurrentMonth && day.reservations.length === 0 && (
                    <div className="day-price">{formatCurrency(day.dayPrice)}</div>
                  )}
                </div>
              ))}
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
                <span className="booking-source">{hoverReservation.bookingSource || 'Direct Booking'}</span>
              </div>
            </div>
          </div>
          
          <div className="card-body">
            <div className="reservation-details">
              <div className="detail-row">
                <div className="detail-item">
                  <span className="detail-label">Check-in</span>
                  <span className="detail-value">
                    {new Date(hoverReservation.checkInDate || hoverReservation.arrivalDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Check-out</span>
                  <span className="detail-value">
                    {new Date(hoverReservation.checkOutDate || hoverReservation.departureDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Nights</span>
                  <span className="detail-value">
                    {calculateNights(
                      hoverReservation.checkInDate || hoverReservation.arrivalDate,
                      hoverReservation.checkOutDate || hoverReservation.departureDate
                    )}
                  </span>
                </div>
              </div>
              
              <div className="price-row">
                <span className="detail-label">Total</span>
                <span className="total-price">{formatCurrency(hoverReservation.amount)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};