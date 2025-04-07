import React, { useState } from 'react';

// Simple function to calculate width and positioning for reservations
const calculateReservationPlacement = (reservation, gridStartDate) => {
  const checkIn = new Date(reservation.arrivalDate || reservation.checkInDate);
  const checkOut = new Date(reservation.departureDate || reservation.checkOutDate);
  
  // Calculate days from grid start to reservation start
  const daysFromStart = Math.floor((checkIn - gridStartDate) / (24 * 60 * 60 * 1000));
  
  // Calculate reservation width in days
  const nights = Math.ceil((checkOut - checkIn) / (24 * 60 * 60 * 1000));
  
  return {
    left: `calc(${daysFromStart} * (100% / 7))`,
    width: `calc(${nights} * (100% / 7))`,
    days: nights
  };
};

const ReservationBar = ({ reservation, gridStartDate }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Determine reservation color based on source
  const getReservationColor = () => {
    const source = (reservation.source || reservation.channelName || '').toLowerCase();
    
    if (source.includes('airbnb')) return '#ff385c';
    if (source.includes('vrbo') || source.includes('homeaway')) return '#3662d8';
    if (source.includes('booking')) return '#003580';
    // Use the same gold color for both direct and luxury bookings
    return '#b39149'; // Gold color for Luxury Lodging (direct and luxurylodging)
  };
  
  // Get first letter of guest name
  const getGuestInitial = () => {
    const guestName = reservation.guestName || 'Guest';
    return guestName.charAt(0).toUpperCase();
  };
  
  // Calculate placement
  const placement = calculateReservationPlacement(
    reservation, 
    new Date(gridStartDate)
  );
  
  return (
    <div 
      className="reservation-bar"
      style={{
        backgroundColor: getReservationColor(),
        left: placement.left,
        width: placement.width,
        position: 'absolute'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="guest-info">
        <div className="initial-circle">
          {getGuestInitial()}
        </div>
        <div className="reservation-info">
          <div className="guest-name">{reservation.guestName || 'Guest'}</div>
          <div className="guest-nights">{placement.days} nights</div>
        </div>
      </div>
      
      {isHovered && (
        <div className="reservation-hover-details">
          <div>Check-in: {new Date(reservation.arrivalDate).toLocaleDateString()}</div>
          <div>Check-out: {new Date(reservation.departureDate).toLocaleDateString()}</div>
          <div>Total Price: ${reservation.totalPrice || 0}</div>
        </div>
      )}
    </div>
  );
};

export default ReservationBar;