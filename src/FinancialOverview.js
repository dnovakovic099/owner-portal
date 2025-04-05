import React, { useState, useEffect } from 'react';
import api from './api/api';
import './FinancialOverview.css';

export const FinancialOverview = () => {
  // State management
  const [properties, setProperties] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [stats, setStats] = useState([]);
  const [totalStats, setTotalStats] = useState({
    totalBookings: 0,
    totalNights: 0,
    totalPayout: 0,
    occupancyRate: 0,
    avgNightlyRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch properties on component mount
  useEffect(() => {
    fetchProperties();
  }, []);
  
  // Fetch reservations when properties are loaded
  useEffect(() => {
    if (properties.length > 0) {
      fetchReservations();
    }
  }, [properties]);
  
  // Calculate stats when properties or reservations change
  useEffect(() => {
    if (properties.length > 0 && reservations.length > 0) {
      calculateStats();
    }
  }, [properties, reservations]);
  
  // Function to fetch all properties
  const fetchProperties = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await api.getListings();
      console.log("Properties loaded:", data);
      setProperties(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching properties:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to fetch reservations
  const fetchReservations = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch confirmed reservations for all properties
      const { reservations: data } = await api.getReservations({
        limit: 100,
        status: 'confirmed'
      });
      
      console.log("Reservations loaded:", data);
      setReservations(data || []);
    } catch (err) {
      console.error("Error fetching reservations:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Calculate stats for properties
  const calculateStats = async () => {
    console.log("Calculating stats with:", {
      propertiesCount: properties.length,
      reservationsCount: reservations.length
    });
    
    // Calculate stats for each property
    const propertyStats = await Promise.all(properties.map(async (property) => {
      try {
        // Get financial report for this specific property
        const financialParams = {
          listingMapIds: [property.id]
        };
        
        const financialReport = await api.getFinancialReport(financialParams);

        console.log({financialReport})
        
        // Process financial data
        const rows = financialReport.result?.rows || [];
        
        // Calculate totals from financial report
        const totalBookings = rows.length;
        const totalPayout = rows.reduce((sum, row) => {
          const payoutIndex = financialReport.result.columns.findIndex(
            col => col.name.toLowerCase().includes('ownerpayout')
          );
          console.log({row})
          return sum + (payoutIndex !== -1 ? parseFloat(row[payoutIndex]) : 0);
        }, 0);
        
        // Calculate total nights 
        const calculateNights = (reservation) => {
          const checkIn = new Date(reservation.checkInDate || reservation.arrivalDate);
          const checkOut = new Date(reservation.checkOutDate || reservation.departureDate);
          const diffTime = Math.abs(checkOut - checkIn);
          return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        };
        
        const totalNights = rows.reduce((sum, row) => {
          const checkInIndex = financialReport.result.columns.findIndex(
            col => col.name.toLowerCase().includes('checkin')
          );
          const checkOutIndex = financialReport.result.columns.findIndex(
            col => col.name.toLowerCase().includes('checkout')
          );
          
          if (checkInIndex !== -1 && checkOutIndex !== -1) {
            const checkIn = new Date(row[checkInIndex]);
            const checkOut = new Date(row[checkOutIndex]);
            const nights = calculateNights({ checkInDate: checkIn, checkOutDate: checkOut });
            return sum + nights;
          }
          return sum;
        }, 0);
        
        // Calculate occupancy rate (approximate)
        const totalDays = 365; // Using full year for simplicity
        const occupancyRate = (totalNights / totalDays) * 100;
        
        // Calculate average nightly rate
        const avgNightlyRate = totalPayout / totalNights || 0;

        console.log({property})
        
        return {
          id: property.id,
          name: property.internalListingName || `Property #${property.id}`,
          address: property.address,
          totalPayout,
          bookings: totalBookings,
          nights: totalNights,
          avgNightlyRate,
          occupancyRate: Math.min(occupancyRate, 100) // Cap at 100%
        };
      } catch (err) {
        console.error(`Error calculating stats for property ${property.id}:`, err);
        return null;
      }
    }));
    
    // Filter out any null results
    const validPropertyStats = propertyStats.filter(stat => stat !== null);
    
    console.log("Calculated property stats:", validPropertyStats);
    setStats(validPropertyStats);
    
    // Calculate totals
    if (validPropertyStats.length > 0) {
      const totals = validPropertyStats.reduce((acc, curr) => {
        return {
          totalBookings: acc.totalBookings + curr.bookings,
          totalNights: acc.totalNights + curr.nights,
          totalPayout: acc.totalPayout + curr.totalPayout,
          occupancyRate: acc.occupancyRate + curr.occupancyRate,
          avgNightlyRate: acc.avgNightlyRate + curr.avgNightlyRate,
        };
      }, { 
        totalBookings: 0, 
        totalNights: 0, 
        totalPayout: 0,
        occupancyRate: 0,
        avgNightlyRate: 0,
      });
      
      // Calculate averages for rate fields
      if (validPropertyStats.length > 0) {
        totals.occupancyRate = totals.occupancyRate / validPropertyStats.length;
        totals.avgNightlyRate = totals.avgNightlyRate / validPropertyStats.length;
      }
      
      console.log("Calculated total stats:", totals);
      setTotalStats(totals);
    }
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
      </div>

      {/* Loading state */}
      {loading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading financial data...</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="error-container">
          <p>Error loading data: {error.message}</p>
          <button onClick={fetchProperties} className="retry-button">Retry</button>
        </div>
      )}

      {/* Summary Cards */}
      {!loading && !error && (
        <div className="summary-cards">
          <div className="summary-card">
            <div className="card-content">
              <dl>
                <dt className="card-label">Total Payout</dt>
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
      {!loading && !error && (
        <div className="property-section">
          <h2 className="section-title">Property Performance</h2>
          {stats.length === 0 ? (
            <div className="no-data">
              <p>No properties or reservation data available.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Property</th>
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
                      <td>{property.bookings}</td>
                      <td>{property.nights}</td>
                      <td>{formatCurrency(property.avgNightlyRate)}</td>
                      <td>{property.occupancyRate.toFixed(1)}%</td>
                      <td>{formatCurrency(property.totalPayout)}</td>
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

export default FinancialOverview;