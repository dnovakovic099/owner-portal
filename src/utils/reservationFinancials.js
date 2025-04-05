/**
 * Utility functions for matching reservations with financial data
 */

/**
 * Find the matching financial data for a reservation
 * @param {Object} reservation - Reservation object
 * @param {Array} financialData - Array of financial data rows
 * @param {Array} columns - Column definitions from financial report
 * @returns {Object|null} Matching financial data or null
 */
export const findReservationFinancials = (reservation, financialData, columns) => {
    // Extensive logging to understand the matching process
    console.log('Finding financials for reservation:', {
      id: reservation.id,
      guestName: reservation.guestName,
      checkIn: reservation.checkInDate,
      checkOut: reservation.checkOutDate
    });
  
    console.log('Financial Data Columns:', columns);
    console.log('Financial Data Rows Count:', financialData ? financialData.length : 'No data');
  
    // If no financial data or columns, return null
    if (!financialData || !columns || financialData.length === 0) {
      console.warn('No financial data available');
      return null;
    }
  
    // Find column indexes with error handling
    const idColumnIndex = columns.findIndex(col => col.name === 'id');
    const ownerPayoutIndex = columns.findIndex(col => col.name === 'ownerPayout');
    const listingNameIndex = columns.findIndex(col => col.name === 'listingName');
    const checkInDateIndex = columns.findIndex(col => col.name === 'arrivalDate');
    const checkOutDateIndex = columns.findIndex(col => col.name === 'departureDate');
  
    console.log('Column Indexes:', {
      idColumnIndex,
      ownerPayoutIndex,
      listingNameIndex,
      checkInDateIndex,
      checkOutDateIndex
    });
  
    // If required columns are missing, return null
    if (ownerPayoutIndex === -1) {
      console.warn('Owner payout column not found');
      return null;
    }
  
    // Attempt to match by multiple methods
    const matchedRow = financialData.find(row => {
      // If ID column exists and matches
      if (idColumnIndex !== -1) {
        const rowId = String(row[idColumnIndex]);
        const reservationId = String(reservation.id);
        if (rowId === reservationId) {
          console.log('Matched by ID:', rowId);
          return true;
        }
      }
  
      // If date columns exist, try date matching
      if (checkInDateIndex !== -1 && checkOutDateIndex !== -1) {
        const rowCheckIn = new Date(row[checkInDateIndex]);
        const rowCheckOut = new Date(row[checkOutDateIndex]);
        const reservationCheckIn = new Date(reservation.checkInDate);
        const reservationCheckOut = new Date(reservation.checkOutDate);
  
        const isDateClose = 
          Math.abs(rowCheckIn - reservationCheckIn) < 24 * 60 * 60 * 1000 &&
          Math.abs(rowCheckOut - reservationCheckOut) < 24 * 60 * 60 * 1000;
  
        if (isDateClose) {
          console.log('Matched by dates');
          return true;
        }
      }
  
      return false;
    });
  
    if (matchedRow) {
      const ownerPayout = parseFloat(matchedRow[ownerPayoutIndex]) || 0;
      const listingName = listingNameIndex !== -1 ? matchedRow[listingNameIndex] : '';
  
      console.log('Found Financial Data:', {
        ownerPayout,
        listingName
      });
  
      return {
        ownerPayout,
        listingName
      };
    }
  
    console.warn('No matching financial data found for reservation');
    return null;
  };
  
  /**
   * Process reservations with financial data
   * @param {Array} reservations - Array of reservations
   * @param {Object} financialReport - Financial report from API
   * @returns {Array} Reservations with added financial information
   */
  export const processReservationsWithFinancials = (reservations, financialReport) => {
    console.log('Processing reservations with financial data');
    
    // If no financial report or no rows, return original reservations
    if (!financialReport?.result?.rows || !financialReport.result.columns) {
      console.warn('No financial report data available');
      return reservations;
    }
  
    // Extract columns and rows from financial report
    const { columns, rows } = financialReport.result;
  
    // Process each reservation
    return reservations.map(reservation => {
      const financialData = findReservationFinancials(reservation, rows, columns);
  
      // Merge financial data if found
      return financialData 
        ? { 
            ...reservation, 
            ownerPayout: financialData.ownerPayout,
            listingName: financialData.listingName 
          } 
        : {
            ...reservation,
            ownerPayout: 0, // Explicitly set to 0 if no match
            listingName: reservation.listingName || ''
          };
    });
  };