import React from 'react';
import './CalendarPopup.css';

export const CalendarPopup = ({ booking, onClose }) => {
  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short',
      day: 'numeric', 
      year: 'numeric' 
    });
  };
  
  return (
    <div className="calendar-popup-overlay" onClick={onClose}>
      <div className="calendar-popup" onClick={(e) => e.stopPropagation()}>
        {booking.type === 'booking' && (
          <>
            <div className="popup-header">
              <h3>{booking.guestName}</h3>
              <button className="popup-close" onClick={onClose}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="popup-content">
              {booking.nights && booking.checkIn && booking.checkOut && (
                <div className="popup-detail">
                  <span className="detail-label">Stay:</span>
                  <span className="detail-value">{booking.nights} nights, {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}</span>
                </div>
              )}
              
              {booking.guests && (
                <div className="popup-detail">
                  <span className="detail-label">Guests:</span>
                  <span className="detail-value">{booking.guests} guests</span>
                </div>
              )}
              
              <div className="popup-detail">
                <span className="detail-label">Amount:</span>
                <span className="detail-value">${booking.amount.toFixed(2)}</span>
              </div>
              
              <div className="popup-actions">
                <button className="popup-action-button">View details</button>
              </div>
            </div>
          </>
        )}
        
        {booking.type === 'ownerBlock' && (
          <>
            <div className="popup-header owner-block-header">
              <h3>Owner Block</h3>
              <button className="popup-close" onClick={onClose}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="popup-content">
              <div className="popup-detail">
                <span className="detail-label">Block ID:</span>
                <span className="detail-value">#{booking.blockId}</span>
              </div>
              
              <div className="popup-detail">
                <span className="detail-label">Period:</span>
                <span className="detail-value">{formatDate(booking.startDate)} - {formatDate(booking.endDate)}</span>
              </div>
              
              <div className="popup-actions">
                <button className="popup-action-button">View details</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
