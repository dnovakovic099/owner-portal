// Format currency to USD
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};

// Format date to readable format
export const formatDate = (dateString) => {
  const options = { month: 'short', day: 'numeric', year: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

// Calculate property statistics based on reservations
export const calculatePropertyStats = (property, reservations, period) => {
  // Filter reservations for this property
  const propertyReservations = reservations.filter(r => r.propertyId === property.id);
  
  // Filter by period
  const now = new Date();
  const filteredReservations = propertyReservations.filter(r => {
    const checkOutDate = new Date(r.checkOut);
    
    if (period === 'lastMonth') {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const startOfLastMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
      const endOfLastMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);
      return checkOutDate >= startOfLastMonth && checkOutDate <= endOfLastMonth;
    } else if (period === 'lastQuarter') {
      const lastQuarterStart = new Date(now.getFullYear(), Math.floor((now.getMonth() - 3) / 3) * 3, 1);
      const lastQuarterEnd = new Date(lastQuarterStart.getFullYear(), lastQuarterStart.getMonth() + 3, 0);
      return checkOutDate >= lastQuarterStart && checkOutDate <= lastQuarterEnd;
    } else if (period === 'lastYear') {
      const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
      const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31);
      return checkOutDate >= lastYearStart && checkOutDate <= lastYearEnd;
    }
    
    // Default to all time
    return true;
  });
  
  // Calculate total revenue
  const totalRevenue = filteredReservations.reduce((sum, r) => {
    // Calculate nights
    const nights = calculateNights(r.checkIn, r.checkOut);
    return sum + (r.pricePerNight * nights) + r.cleaningFee + r.amenities + r.extraFees;
  }, 0);
  
  // Calculate owner payout
  const ownerPayout = filteredReservations.reduce((sum, r) => sum + r.ownerPayout, 0);
  
  // Count bookings
  const bookings = filteredReservations.length;
  
  // Calculate total nights
  const nights = filteredReservations.reduce((sum, r) => {
    return sum + calculateNights(r.checkIn, r.checkOut);
  }, 0);
  
  // Calculate average nightly rate
  const avgNightlyRate = nights > 0 ? 
    filteredReservations.reduce((sum, r) => sum + r.pricePerNight, 0) / filteredReservations.length : 0;
  
  // Calculate occupancy rate
  // For simplicity, we'll use a fixed number of days based on the period
  let totalDaysInPeriod = 0;
  if (period === 'lastMonth') {
    totalDaysInPeriod = 30;
  } else if (period === 'lastQuarter') {
    totalDaysInPeriod = 90;
  } else if (period === 'lastYear') {
    totalDaysInPeriod = 365;
  } else {
    // All time, use 365 days per year since property creation
    const creationDate = new Date(property.createdAt);
    const daysSinceCreation = Math.ceil((now - creationDate) / (1000 * 60 * 60 * 24));
    totalDaysInPeriod = Math.max(daysSinceCreation, 1); // Avoid division by zero
  }
  
  const occupancyRate = (nights / totalDaysInPeriod) * 100;
  
  return {
    id: property.id,
    name: property.name,
    address: property.address,
    totalRevenue,
    ownerPayout,
    bookings,
    nights,
    avgNightlyRate,
    occupancyRate: Math.min(occupancyRate, 100) // Cap at 100%
  };
};

// Calculate nights between two dates
export const calculateNights = (checkIn, checkOut) => {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};