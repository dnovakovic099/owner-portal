/**
 * Utility for prorating reservation financials based on a date range
 * This handles reservations that span across a reporting period
 */

/**
 * Calculate days between two dates (inclusive)
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {number} - Number of days
 */
const getDaysBetweenDates = (startDate, endDate) => {
  // Clone dates to avoid modifying the originals
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Reset times to compare only dates
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  
  // Calculate difference in days
  const diffTime = Math.abs(end - start);
  return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // Add 1 to include both start and end days
};

/**
 * Match reservation with financial data
 * @param {Object} reservation - Reservation object
 * @param {Object} financialData - Financial data from API
 * @returns {Object} - Combined data
 */
const matchReservationWithFinancial = (reservation, financialData) => {
  // If no financial data, return original reservation
  console.log({reservation, financialData})
  if (!financialData || !financialData.rows || !financialData.columns) {
    return reservation;
  }
  
  // Find column indexes
  const columns = financialData.columns;
  const idIndex = columns.findIndex(col => col.name === 'id');
  
  // If we can't find the ID column, return original reservation
  if (idIndex === -1) {
    return reservation;
  }
  
  // Find matching row
  const matchingRow = financialData.rows.find(row => {
    return String(row[idIndex]) === String(reservation.id);
  });

  console.log({matchingRow})
  
  // If no matching row, return original reservation
  if (!matchingRow) {
    return reservation;
  }
  
  // Create a map of column names to values
  const financialMap = {};
  columns.forEach((column, index) => {
    financialMap[column.name] = matchingRow[index];
  });
  
  // Merge reservation and financial data
  return { ...reservation, ...financialMap };
};

/**
 * Prorate a financial value based on the number of days in the period
 * @param {number} value - The financial value to prorate
 * @param {number} totalDays - Total days in the reservation
 * @param {number} daysInPeriod - Days in the reporting period
 * @returns {number} - Prorated value
 */
const prorateValue = (value, totalDays, daysInPeriod) => {
  if (!value || totalDays === 0) return 0;
  
  // Ensure we're working with numbers
  const numericValue = parseFloat(value);
  
  // For safety, don't allow negative prorated values
  const result = (numericValue * daysInPeriod) / totalDays;
  return Math.max(0, result);
};

/**
 * Prorate reservations based on a date range
 * @param {Array} reservations - Array of reservations
 * @param {Object} financialData - Financial data from API
 * @param {Date} periodStart - Start date of reporting period
 * @param {Date} periodEnd - End date of reporting period
 * @returns {Array} - Array of prorated reservations
 */
export const prorateReservations = (reservations, financialData, periodStart, periodEnd) => {
  console.log("Prorating reservations:", {
    reservationCount: reservations?.length,
    periodStart,
    periodEnd
  });
  
  // Handle empty reservations
  if (!reservations || reservations.length === 0) {
    return [];
  }
  
  // Normalize dates to ensure we're dealing with Date objects
  const start = new Date(periodStart);
  const end = new Date(periodEnd);
  
  // Reset times to get consistent date comparisons
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999); // End of day
  
  // Process each reservation
  return reservations.map(reservation => {
    // First combine with financial data
    const combinedData = matchReservationWithFinancial(reservation, financialData);
    
    // Get check-in and check-out dates
    const checkIn = new Date(combinedData.arrivalDate || combinedData.checkInDate);
    const checkOut = new Date(combinedData.departureDate || combinedData.checkOutDate);
    
    // Reset times for consistent comparisons
    checkIn.setHours(0, 0, 0, 0);
    checkOut.setHours(0, 0, 0, 0);
    
    // Calculate total nights in reservation (checkout day doesn't count)
    const totalDays = Math.max(1, getDaysBetweenDates(checkIn, checkOut) - 1);
    
    // Calculate effective dates in reporting period
    const effectiveStart = checkIn < start ? start : checkIn;
    const effectiveEnd = checkOut > end ? end : checkOut;
    
    // Calculate days in the reporting period
    // Important: Don't subtract 1 day if checkout is within period
    let daysInPeriod = 0;
    
    // If reservation is entirely outside period, no days in period
    if (checkOut <= start || checkIn > end) {
      daysInPeriod = 0;
    } 
    // If checkout is after period end, count all days in period
    else if (checkOut > end) {
      daysInPeriod = getDaysBetweenDates(effectiveStart, effectiveEnd);
    } 
    // Otherwise, checkout is within period, but don't count checkout day
    else {
      daysInPeriod = getDaysBetweenDates(effectiveStart, effectiveEnd) - 1;
    }
    
    // Safety check - ensure daysInPeriod is not negative
    daysInPeriod = Math.max(0, daysInPeriod);
    console.log({daysInPeriod, combinedData: combinedData.ownerPayout, totalDays})
    
    // Log for any reservation that has days in this period
    if (daysInPeriod > 0) {
      console.log(`Reservation ${combinedData.id || 'unknown'} (${combinedData.guestName || 'Guest'}):`, {
        checkIn: checkIn.toISOString().split('T')[0],
        checkOut: checkOut.toISOString().split('T')[0],
        totalDays,
        daysInPeriod,
        prorationFactor: daysInPeriod / totalDays,
        totalPayout: combinedData.ownerPayout || 0,
        proratedPayout: prorateValue(combinedData.ownerPayout || 0, totalDays, daysInPeriod)
      });
    }
    
    // If no days in period, return null (will be filtered out)
    if (daysInPeriod <= 0) {
      return null;
    }
    
    // Calculate proration factor with safety check
    const prorationFactor = totalDays > 0 ? (daysInPeriod / totalDays) : 0;
    
    // Prorate financial values
    const proratedData = {
      ...combinedData,
      // Basic info remains the same
      id: combinedData.id,
      guestName: combinedData.guestName,
      checkInDate: combinedData.arrivalDate || combinedData.checkInDate,
      checkOutDate: combinedData.departureDate || combinedData.checkOutDate,
      channelName: combinedData.channelName || combinedData.source,
      // Update nights to be only the nights in this period
      nights: daysInPeriod,
      // Prorate financial values and adjust baseRate for claimsProtection
      baseRate: prorateValue(
        (parseFloat(combinedData.baseRate) || 0) + 
        (parseFloat(combinedData.claimsProtection) || 0) || 
        ((combinedData.totalPrice - (combinedData.cleaningFee || 0)) / totalDays * daysInPeriod), 
        totalDays, daysInPeriod
      ),
      claimsProtection: prorateValue(combinedData.claimsProtection || 0, totalDays, daysInPeriod),
      cleaningFeeValue: prorateValue(combinedData.cleaningFeeValue || combinedData.cleaningFee || 0, 
                                  totalDays, daysInPeriod),
      totalTax: prorateValue(combinedData.totalTax || 0, 
                          totalDays, daysInPeriod),
      hostChannelFee: prorateValue(combinedData.hostChannelFee || 0, 
                                totalDays, daysInPeriod),
      pmCommission: prorateValue(combinedData.pmCommission || 0, 
                              totalDays, daysInPeriod),
      ownerPayout: prorateValue(combinedData.ownerPayout || 0, 
                             totalDays, daysInPeriod),
      // Add proration info for transparency
      totalReservationNights: totalDays,
      prorationFactor: prorationFactor,
      // Add a flag to indicate if this reservation is prorated
      isProrated: prorationFactor < 1
    };
    
    return proratedData;
  }).filter(Boolean); // Filter out null entries
};