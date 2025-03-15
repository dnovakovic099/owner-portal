import React, { useState, useEffect } from 'react';
import { CalendarPopup } from './CalendarPopup';
import api from './api/api';
import './Calendar.css';

export const Calendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedView, setSelectedView] = useState('month');
  const [showPrices, setShowPrices] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [calendarData, setCalendarData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
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
      setProperties(data);
      
      // Set first property as selected by default
      if (data.length > 0 && !selectedProperty) {
        setSelectedProperty(data[0].id);
      }
      
      setLoading(false);
    } catch (err) {
      setError(err);
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
      
      // Extend dates to include days from previous/next month
      const startDate = new Date(firstDayOfMonth);
      startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());
      
      const endDate = new Date(lastDayOfMonth);
      const daysToAdd = 6 - lastDayOfMonth.getDay();
      endDate.setDate(endDate.getDate() + daysToAdd);
      
      // Format dates as YYYY-MM-DD
      const formattedStartDate = startDate.toISOString().split('T')[0];
      const formattedEndDate = endDate.toISOString().split('T')[0];
      
      // In a real app, we'd fetch this data from the API
      // const data = await api.getCalendar(selectedProperty, formattedStartDate, formattedEndDate);
      
      // For now, we'll use the sample data function
      const days = generateCalendarDays();
      setCalendarData(days);
      
      setLoading(false);
    } catch (err) {
      setError(err);
      setLoading(false);
    }
  };
  
  // Generate days for the calendar
  const generateCalendarDays = () => {
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
      days.push({
        date: new Date(year, month - 1, previousMonthLastDay - daysFromPreviousMonth + i + 1),
        isCurrentMonth: false,
        bookings: []
      });
    }
    
    // Add days from current month
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
        bookings: getSampleBookings(year, month, i)
      });
    }
    
    // Add days from next month
    const remainingCells = totalCells - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
        bookings: []
      });
    }
    
    return days;
  };
  
  // Sample data for bookings
  const getSampleBookings = (year, month, day) => {
    // Add some bookings for demonstration
    const bookings = [];
    
    // Specific sample bookings for April 2025
    if (year === 2025 && month === 3) { // April is month 3 (0-indexed)
      if (day === 8) {
        bookings.push({
          id: 'booking-1',
          guestName: 'Jean Marie C.',
          amount: 2160.01,
          checkIn: new Date(2025, 3, 7),
          checkOut: new Date(2025, 3, 10),
          nights: 3,
          guests: 10,
          type: 'booking'
        });
      }
      
      if (day === 11) {
        bookings.push({
          id: 'booking-2',
          guestName: 'Dan S.',
          amount: 2332.06,
          type: 'booking'
        });
      }
      
      if (day === 3) {
        bookings.push({
          id: 'booking-3',
          guestName: 'Brad H.',
          amount: 2791.98,
          type: 'booking'
        });
      }
      
      if (day === 25) {
        bookings.push({
          id: 'booking-4',
          guestName: 'Kevin H.',
          amount: 2161.56,
          type: 'booking'
        });
      }
      
      // Owner blocks
      if (day === 9) {
        bookings.push({
          id: 'block-1',
          type: 'ownerBlock',
          blockId: 9071,
          startDate: new Date(2025, 2, 2), // Mar 2, 2025
          endDate: new Date(2050, 0, 1), // Jan 1, 2050
          notes: 'Owner Block'
        });
      }
      
      if (day === 15) {
        bookings.push({
          id: 'block-2',
          type: 'ownerBlock',
          blockId: 9433,
          startDate: new Date(2025, 3, 4), // Apr 4, 2025
          endDate: new Date(2050, 11, 31), // Dec 31, 2050
          notes: 'Owner Block'
        });
      }
    }
    
    return bookings;
  };

  // Format month and year
  const formatMonthYear = (date) => {
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
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
  
  // Handle booking click
  const handleBookingClick = (booking) => {
    setSelectedBooking(booking);
  };
  
  // Close booking popup
  const closeBookingPopup = () => {
    setSelectedBooking(null);
  };
  
  return (
    <div className="calendar-container">
      <div className="page-header">
        <h1 className="page-title">Calendar</h1>
        <div className="calendar-tabs">
          <button className="calendar-tab active">Calendar</button>
          <button className="calendar-tab">Booking Report</button>
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

      {!loading && !error && (
        <>
          <div className="calendar-controls">
            <div className="calendar-navigation">
              <button className="nav-button" onClick={goToPreviousMonth}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
              <span className="current-month">{formatMonthYear(currentMonth)}</span>
              <button className="nav-button" onClick={goToNextMonth}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
            
            <div className="view-controls">
              <button 
                className="view-control-button" 
                onClick={goToToday}
              >
                Today
              </button>
              <div className="view-toggle">
                <button 
                  className={`view-toggle-button ${selectedView === 'month' ? 'active' : ''}`}
                  onClick={() => setSelectedView('month')}
                >
                  Month
                </button>
                <button 
                  className={`view-toggle-button ${selectedView === 'week' ? 'active' : ''}`}
                  onClick={() => setSelectedView('week')}
                >
                  Week
                </button>
              </div>
            </div>
            
            <div className="price-toggle">
              <label className="toggle-label">
                Prices
                <div className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={showPrices} 
                    onChange={() => setShowPrices(!showPrices)}
                  />
                  <span className="toggle-slider"></span>
                </div>
              </label>
              <button className="calendar-add-button">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
            </div>
          </div>
          
          <div className="calendar-grid">
            <div className="calendar-header">
              <div className="calendar-day-header">Sun</div>
              <div className="calendar-day-header">Mon</div>
              <div className="calendar-day-header">Tue</div>
              <div className="calendar-day-header">Wed</div>
              <div className="calendar-day-header">Thu</div>
              <div className="calendar-day-header">Fri</div>
              <div className="calendar-day-header">Sat</div>
            </div>
            
            <div className="calendar-body">
              {calendarData.map((day, index) => (
                <div 
                  key={index} 
                  className={`calendar-cell ${!day.isCurrentMonth ? 'outside-month' : ''}`}
                >
                  <div className="calendar-date">{day.date.getDate()}</div>
                  
                  {day.bookings.length > 0 && (
                    <div className="calendar-events">
                      {day.bookings.map((booking) => (
                        <div 
                          key={booking.id}
                          onClick={() => handleBookingClick(booking)}
                          className={`calendar-event ${booking.type === 'ownerBlock' ? 'owner-block' : 'booking'}`}
                        >
                          {booking.type === 'booking' && (
                            <div className="booking-info">
                              <div className="guest-name">{booking.guestName}</div>
                              <div className="booking-amount">${booking.amount.toFixed(2)}</div>
                            </div>
                          )}
                          
                          {booking.type === 'ownerBlock' && (
                            <div className="owner-block-info">
                              <div className="block-title">Owner Block</div>
                              <div className="block-id">#{booking.blockId}</div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {showPrices && day.isCurrentMonth && (
                    <div className="calendar-price">$700</div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="calendar-legend">
            <div className="legend-item">
              <div className="legend-color blocked"></div>
              <div className="legend-label">Blocked</div>
            </div>
            <div className="legend-item">
              <div className="legend-color booked"></div>
              <div className="legend-label">Booked</div>
            </div>
          </div>
        </>
      )}
      
      {selectedBooking && (
        <CalendarPopup 
          booking={selectedBooking} 
          onClose={closeBookingPopup} 
        />
      )}
    </div>
  );
};