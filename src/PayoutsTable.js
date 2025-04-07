import React, { useState, useMemo } from 'react';
import { formatCurrency, formatDate, calculateNights } from './utils/formatters';

export const PayoutsTable = ({ reservations, financialData }) => {
  const [sortConfig, setSortConfig] = useState({ 
    key: 'checkInDate', 
    direction: 'desc' 
  });

  // Enhance reservations with financial data
  const enhanceReservations = () => {
    if (!financialData || !financialData.rows || !financialData.columns) {
      return reservations;
    }
    
    const columns = financialData.columns;
    const idIndex = columns.findIndex(col => col.name === 'id');
    
    return reservations.map(reservation => {
      // Find matching financial data row
      const matchingRow = financialData.rows.find(row => 
        String(row[idIndex]) === String(reservation.id)
      );
      
      if (matchingRow) {
        // Create a mapping of column names to values
        const financialDetails = {};
        columns.forEach((column, index) => {
          financialDetails[column.name] = matchingRow[index];
        });
        
        return {
          ...reservation,
          ...financialDetails
        };
      }
      
      return reservation;
    });
  };

  // Sorting function
  const sortedReservations = useMemo(() => {
    let sortableReservations = [...enhanceReservations()];
    
    sortableReservations.sort((a, b) => {
      const getValue = (item) => {
        switch(sortConfig.key) {
          case 'guestName':
            return item.guestName || 'Unknown';
          case 'checkInDate':
            return new Date(item.checkInDate || item.arrivalDate);
          case 'nights':
            return calculateNights(item.checkInDate, item.checkOutDate);
          case 'ownerPayout':
            return parseFloat(item.ownerPayout) || 0;
          case 'baseRate':
            return parseFloat(item.baseRate) || 0;
          default:
            return item[sortConfig.key] || 0;
        }
      };

      const valueA = getValue(a);
      const valueB = getValue(b);

      if (valueA < valueB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return sortableReservations;
  }, [reservations, financialData, sortConfig]);

  // Sorting handler
  const requestSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  // Determine sort indicator
  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? '▲' : '▼';
  };

  // Format channel name
  const formatChannelName = (channel) => {
    if (!channel) return 'Direct';
    const channelLower = channel.toLowerCase();
    if (channelLower.includes('airbnb')) return 'Airbnb';
    if (channelLower.includes('vrbo') || channelLower.includes('homeaway')) return 'Vrbo';
    if (channelLower.includes('booking')) return 'Booking.com';
    return 'Direct';
  };

  // Render table
  return (
    <div className="payouts-table-container">
      <div className="table-responsive">
        <table className="payouts-table">
          <thead>
            <tr>
              <th onClick={() => requestSort('guestName')}>
                Guest Name {getSortIndicator('guestName')}
              </th>
              <th onClick={() => requestSort('checkInDate')}>
                Check-in Date {getSortIndicator('checkInDate')}
              </th>
              <th onClick={() => requestSort('nights')}>
                Nights {getSortIndicator('nights')}
              </th>
              <th>Channel</th>
              <th onClick={() => requestSort('baseRate')}>
                Base Rate {getSortIndicator('baseRate')}
              </th>
              <th>Cleaning Fee</th>
              <th>Taxes</th>
              <th onClick={() => requestSort('ownerPayout')}>
                Owner Payout {getSortIndicator('ownerPayout')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedReservations.length === 0 ? (
              <tr>
                <td colSpan="8" className="no-data-cell">
                  No reservations found
                </td>
              </tr>
            ) : (
              sortedReservations.map((reservation, index) => {
                const checkInDate = reservation.checkInDate || reservation.arrivalDate;
                const nights = calculateNights(
                  checkInDate, 
                  reservation.checkOutDate || reservation.departureDate
                );
                
                return (
                  <tr key={reservation.id || index}>
                    <td>{reservation.guestName || 'Unknown Guest'}</td>
                    <td>{formatDate(checkInDate)}</td>
                    <td>{nights}</td>
                    <td>
                      <span className={`channel-badge ${formatChannelName(reservation.source)}`}>
                        {formatChannelName(reservation.source)}
                      </span>
                    </td>
                    <td>
                      {formatCurrency(
                        (parseFloat(reservation.baseRate) || 0) + 
                        (parseFloat(reservation.claimsProtection) || 0)
                      )}
                    </td>
                    <td>{formatCurrency(reservation.cleaningFeeValue || reservation.cleaningFee || 0)}</td>
                    <td>{formatCurrency(reservation.totalTax || 0)}</td>
                    <td className="owner-payout">
                      {formatCurrency(reservation.ownerPayout || 0)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PayoutsTable;