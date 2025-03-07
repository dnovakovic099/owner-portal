import React, { useState, useEffect } from 'react';
import { useListings, useReservations } from './api/hostawayHooks';
import './FinancialOverview.css';

export const FinancialOverview = () => {
  // Period selection
  const [selectedPeriod, setSelectedPeriod] = useState('lastMonth');
  
  // Get all properties
  const { 
    data: properties, 
    loading: propertiesLoading 
  } = useListings();
  
  // Setup date params based on period
  const getDateParams = () => {
    const now = new Date();
    let startDate, endDate;
    
    if (selectedPeriod === 'lastMonth') {
      // Last month
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      startDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
      endDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);
    } else if (selectedPeriod === 'lastQuarter') {
      // Last quarter
      const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
      startDate = new Date(now.getFullYear(), quarterMonth - 3, 1);
      endDate = new Date(now.getFullYear(), quarterMonth, 0);
    } else if (selectedPeriod === 'lastYear') {
      // Last year
      startDate = new Date(now.getFullYear() - 1, 0, 1);
      endDate = new Date(now.getFullYear() - 1, 11, 31);
    } else {
      // All time - use last 2 years as a practical limit
      startDate = new Date(now.getFullYear() - 2, 0, 1);
      endDate = new Date();
    }
    
    return {
      checkInDateFrom: startDate.toISOString().split('T')[0],
      checkOutDateTo: endDate.toISOString().split('T')[0]
    };
  };
  
  // Get confirmed reservations with date filtering
  const { 
    data: reservations, 
    loading: reservationsLoading,
    updateParams
  } = useReservations(true, { 
    ...getDateParams(),
    limit: 100 // Get more reservations for accurate stats
  });
  
  // Update date filters when period changes
  useEffect(() => {
    updateParams(getDateParams());
  }, [selectedPeriod, updateParams]);
  
  // Stats for all properties and individual properties
  const [stats, setStats] = useState([]);
  const [totalStats, setTotalStats] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    totalNights: 0,
    totalPayout: 0,
    occupancyRate: 0,
    avgNightlyRate: 0
  });
  
  // Calculate stats when properties or reservations change
  useEffect(() => {
    if (propertiesLoading || reservationsLoading) return;
    
    // Calculate stats for each property
    const propertyStats = properties.map(property => {
      // Filter reservations for this property
      const propertyReservations = reservations.filter(r => 
        r.listingId === property.id
      );
      
      // Calculate total revenue
      let totalRevenue = 0;
      let totalNights = 0;
      
      propertyReservations.forEach(reservation => {
        // Calculate nights
        const checkIn = new Date(reservation.checkInDate);
        const checkOut = new Date(reservation.checkOutDate);
        const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        
        totalNights += nights;
        
        // Add to total revenue
        totalRevenue += parseFloat(reservation.totalPrice) || 0;
      });
      
      // Calculate property management fee (estimate at 15%)
      const managementFeePercent = 0.15;
      const propertyManagementFee = totalRevenue * managementFeePercent;
      
      // Calculate owner payout
      const ownerPayout = totalRevenue - propertyManagementFee;
      
      // Calculate average nightly rate
      const avgNightlyRate = propertyReservations.length > 0 
        ? propertyReservations.reduce((sum, r) => sum + (parseFloat(r.basePrice) || 0), 0) / propertyReservations.length
        : 0;
      
      // Calculate occupancy rate
      const totalDays = calculateTotalDaysInPeriod(selectedPeriod);
      const occupancyRate = totalDays > 0 ? (totalNights / totalDays) * 100 : 0;
      
      return {
        id: property.id,
        name: property.name,
        address: property.address?.full || `${property.address?.city || ''}, ${property.address?.country || ''}`,
        totalRevenue,
        ownerPayout,
        bookings: propertyReservations.length,
        nights: totalNights,
        avgNightlyRate,
        occupancyRate: Math.min(occupancyRate, 100) // Cap at 100%
      };
    });
    
    setStats(propertyStats);
    
    // Calculate totals for all properties
    if (propertyStats.length > 0) {
      const totals = propertyStats.reduce((acc, curr) => {
        return {
          totalRevenue: acc.totalRevenue + curr.totalRevenue,
          totalBookings: acc.totalBookings + curr.bookings,
          totalNights: acc.totalNights + curr.nights,
          totalPayout: acc.totalPayout + curr.ownerPayout,
          occupancyRate: acc.occupancyRate + curr.occupancyRate,
          avgNightlyRate: acc.avgNightlyRate + curr.avgNightlyRate,
        };
      }, { 
        totalRevenue: 0, 
        totalBookings: 0, 
        totalNights: 0, 
        totalPayout: 0,
        occupancyRate: 0,
        avgNightlyRate: 0,
      });
      
      // Calculate averages for rate fields
      totals.occupancyRate = totals.occupancyRate / propertyStats.length;
      totals.avgNightlyRate = totals.avgNightlyRate / propertyStats.length;
      
      setTotalStats(totals);
    }
  }, [properties, reservations, selectedPeriod, propertiesLoading, reservationsLoading]);
  
  // Helper to calculate total days in the selected period
  const calculateTotalDaysInPeriod = (period) => {
    const now = new Date();
    let days = 0;
    
    if (period === 'lastMonth') {
      // Get days in last month
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      days = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0).getDate();
    } else if (period === 'lastQuarter') {
      days = 90; // Approximate
    } else if (period === 'lastYear') {
      days = 365;
    } else {
      // All time - use 365 days as a standard metric
      days = 365;
    }
    
    return days;
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="financial-overview">
      <div className="page-header">
        <h1 className="page-title">Financial Overview</h1>
        <div className="period-selector">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="period-select"
          >
            <option value="lastMonth">Last Month</option>
            <option value="lastQuarter">Last Quarter</option>
            <option value="lastYear">Last Year</option>
            <option value="allTime">All Time</option>
          </select>
        </div>
      </div>

      {/* Loading state */}
      {(propertiesLoading || reservationsLoading) && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading financial data...</p>
        </div>
      )}

      {/* Summary Cards */}
      {!propertiesLoading && !reservationsLoading && (
        <div className="summary-cards">
          <div className="summary-card">
            <div className="card-content">
              <dl>
                <dt className="card-label">Total Revenue</dt>
                <dd className="card-value">{formatCurrency(totalStats.totalRevenue)}</dd>
              </dl>
            </div>
          </div>
          
          <div className="summary-card">
            <div className="card-content">
              <dl>
                <dt className="card-label">Owner Payout</dt>
                <dd className="card-value">{formatCurrency(totalStats.totalPayout)}</dd>
              </dl>
            </div>
          </div>
          
          <div className="summary-card">
            <div className="card-content">
              <dl>
                <dt className="card-label">Bookings</dt>
                <dd className="card-value">{totalStats.totalBookings}</dd>
              </dl>
            </div>
          </div>
          
          <div className="summary-card">
            <div className="card-content">
              <dl>
                <dt className="card-label">Average Occupancy</dt>
                <dd className="card-value">{totalStats.occupancyRate.toFixed(1)}%</dd>
              </dl>
            </div>
          </div>
        </div>
      )}

      {/* Property Performance */}
      {!propertiesLoading && !reservationsLoading && (
        <div className="property-section">
          <h2 className="section-title">Property Performance</h2>
          {stats.length === 0 ? (
            <div className="no-data">
              <p>No properties or reservation data available for the selected period.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Property</th>
                    <th>Revenue</th>
                    <th>Bookings</th>
                    <th>Nights</th>
                    <th>Avg. Rate</th>
                    <th>Occupancy</th>
                    <th>Owner Payout</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((property) => (
                    <tr key={property.id}>
                      <td>
                        <div className="property-cell">
                          <div className="property-name">{property.name}</div>
                          <div className="property-address">{property.address}</div>
                        </div>
                      </td>
                      <td>{formatCurrency(property.totalRevenue)}</td>
                      <td>{property.bookings}</td>
                      <td>{property.nights}</td>
                      <td>{formatCurrency(property.avgNightlyRate)}</td>
                      <td>{property.occupancyRate.toFixed(1)}%</td>
                      <td>{formatCurrency(property.ownerPayout)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
