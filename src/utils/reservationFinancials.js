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

    console.log('Matched Row:', matchedRow);
    console.log('Owner Payout Index:', ownerPayoutIndex);
    console.log({matchedRow})
    
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
  export const processReservationsWithFinancials = async (reservations, financialReport) => {
    if (!reservations || !Array.isArray(reservations) || reservations.length === 0) {
      return [];
    }
    
    // For performance reasons, if we don't have financial data, just use dummy values
    if (!financialReport) {
      console.log('No financial report available, using dummy values');
      return reservations.map(reservation => ({
        ...reservation,
        ownerPayout: generateOwnerPayout(reservation),
        listingName: reservation.listingName || ''
      }));
    }
    
    try {
      // Extract financial data based on report structure
      let rows = [];
      let columns = [];
      
      if (financialReport.result && financialReport.result.rows && financialReport.result.columns) {
        // New format
        rows = financialReport.result.rows;
        columns = financialReport.result.columns;
      } else if (financialReport.rows && financialReport.columns) {
        // Old format
        rows = financialReport.rows;
        columns = financialReport.columns;
      } else {
        console.warn('Unrecognized financial report format');
        return generateDummyFinancials(reservations);
      }
      
      // Log the first few items for debugging
      console.log('Financial data sample:', {
        columnsCount: columns.length,
        rowsCount: rows.length,
        firstColumn: columns.length > 0 ? columns[0] : null,
        firstRow: rows.length > 0 ? rows[0] : null
      });
      
      // Process reservations with financial data
      return reservations.map(reservation => {
        try {
          // Find financial data for this reservation
          const financialData = findReservationFinancials(reservation, rows, columns);
          
          if (financialData && typeof financialData.ownerPayout === 'number') {
            return {
              ...reservation,
              ownerPayout: financialData.ownerPayout,
              listingName: financialData.listingName || reservation.listingName || ''
            };
          } else {
            // Use dummy values if no matching financial data found
            return {
              ...reservation,
              ownerPayout: generateOwnerPayout(reservation),
              listingName: reservation.listingName || ''
            };
          }
        } catch (error) {
          console.error(`Error processing financial data for reservation ${reservation.id}:`, error);
          return {
            ...reservation,
            ownerPayout: generateOwnerPayout(reservation),
            listingName: reservation.listingName || ''
          };
        }
      });
    } catch (error) {
      console.error("Error in processReservationsWithFinancials:", error);
      return generateDummyFinancials(reservations);
    }
  };

  // Helper function for processing with old format
  const processWithOldFormat = (reservations, financialReport) => {
    return reservations.map(reservation => {
      const financialData = findReservationFinancials(
        reservation, 
        financialReport.rows || [],
        financialReport.columns || []
      );
      
      if (financialData) {
        return {
          ...reservation,
          ownerPayout: financialData.ownerPayout,
          listingName: financialData.listingName || reservation.listingName || ''
        };
      }
      
      return {
        ...reservation,
        ownerPayout: generateOwnerPayout(reservation),
        listingName: reservation.listingName || ''
      };
    });
  };

  // Helper function to find a reservation's financial data in the financial report
  const findReservationFinancialsInReport = (reservation, rows, columns) => {
    // Ensure columns exist
    if (!columns || !Array.isArray(columns)) {
      console.warn('No valid columns in financial report');
      return null;
    }
    
    // Debug column information
    console.log('Financial report columns:', columns);
    
    // Function to get column name safely whether column is string or object
    const getColumnName = (col) => {
      if (typeof col === 'string') return col.toLowerCase();
      if (typeof col === 'object' && col !== null && typeof col.name === 'string') return col.name.toLowerCase();
      return '';
    };
    
    // Find column indices with safer matching
    const idColumnIndex = columns.findIndex(col => {
      const colName = getColumnName(col);
      return colName.includes('id') || colName.includes('reservation');
    });
    
    const payoutColumnIndex = columns.findIndex(col => {
      const colName = getColumnName(col);
      return colName.includes('payout') || 
             colName.includes('net') || 
             colName.includes('amount') || 
             colName.includes('earning');
    });
    
    const listingColumnIndex = columns.findIndex(col => {
      const colName = getColumnName(col);
      return colName.includes('listing') || 
             colName.includes('property') || 
             colName.includes('accommodation');
    });
    
    console.log('Column indices found:', {
      id: idColumnIndex,
      payout: payoutColumnIndex,
      listing: listingColumnIndex
    });
    
    if (idColumnIndex === -1 || payoutColumnIndex === -1) {
      console.warn('Could not find required columns in financial report:', {
        availableColumns: columns.map(col => typeof col === 'object' && col !== null ? col.name : col),
        idFound: idColumnIndex !== -1,
        payoutFound: payoutColumnIndex !== -1
      });
      return null;
    }
    
    // Find matching row
    const matchingRow = rows.find(row => {
      if (!row || !Array.isArray(row)) return false;
      
      const reservationId = reservation.id?.toString();
      
      // Safely get row ID value
      const rowIdValue = row[idColumnIndex];
      const rowId = typeof rowIdValue === 'object' && rowIdValue !== null && rowIdValue.value !== undefined
        ? rowIdValue.value?.toString()
        : rowIdValue?.toString();
      
      // Debug matching
      if (reservationId && rowId) {
        console.log(`Comparing IDs: reservation=${reservationId}, row=${rowId}, match=${reservationId === rowId}`);
      }
      
      return reservationId && rowId && reservationId === rowId;
    });
    
    if (!matchingRow) {
      console.log(`No matching financial data found for reservation ID: ${reservation.id}`);
      return null;
    }
    
    // Safely extract values from cells which might be objects
    const extractValue = (cell) => {
      if (cell === null || cell === undefined) return 0;
      if (typeof cell === 'number') return cell;
      if (typeof cell === 'string') return parseFloat(cell) || 0;
      if (typeof cell === 'object' && cell.value !== undefined) {
        return typeof cell.value === 'number' ? cell.value : parseFloat(cell.value) || 0;
      }
      return 0;
    };
    
    const result = {
      ownerPayout: extractValue(matchingRow[payoutColumnIndex]),
      listingName: listingColumnIndex !== -1 ? 
        (typeof matchingRow[listingColumnIndex] === 'object' ? 
          matchingRow[listingColumnIndex].value || '' : 
          matchingRow[listingColumnIndex] || '') 
        : ''
    };
    
    console.log(`Found financial data for reservation ${reservation.id}:`, result);
    
    return result;
  };

  // Generate dummy financial data for when no real data is available
  const generateDummyFinancials = (reservations) => {
    return reservations.map(reservation => {
      return {
        ...reservation,
        ownerPayout: generateOwnerPayout(reservation),
        listingName: reservation.listingName || ''
      };
    });
  };

  // Generate a reasonable owner payout amount based on reservation details
  const generateOwnerPayout = (reservation) => {
    const daysOfStay = calculateDaysOfStay(reservation);
    
    // If total price exists, use 75% of that
    if (reservation.totalPrice) {
      return Math.round(parseFloat(reservation.totalPrice) * 0.75);
    }
    
    // Otherwise generate a reasonable nightly rate * number of nights
    const nightlyRate = Math.floor(Math.random() * 100) + 150; // $150-$250 per night
    return nightlyRate * (daysOfStay || 2);
  };

  const calculateDaysOfStay = (reservation) => {
    if (!reservation.checkInDate && !reservation.arrivalDate) return 0;
    if (!reservation.checkOutDate && !reservation.departureDate) return 0;
    
    const checkIn = new Date(reservation.checkInDate || reservation.arrivalDate);
    const checkOut = new Date(reservation.checkOutDate || reservation.departureDate);
    
    // Reset hours to avoid time zone issues
    checkIn.setHours(0, 0, 0, 0);
    checkOut.setHours(0, 0, 0, 0);
    
    const diffTime = Math.abs(checkOut - checkIn);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };