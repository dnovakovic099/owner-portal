import React, { useState, useEffect } from 'react';
import api from './api/api';

export const ReservationsDashboard = ({ reservations, loading, selectedProperty }) => {
  const [futurePayouts, setFuturePayouts] = useState(0);
  const [loadingFuture, setLoadingFuture] = useState(false);
  
  // Fetch future reservations for future payouts calculation
  useEffect(() => {
    if (selectedProperty) {
      fetchFutureReservations();
    }
  }, [selectedProperty]);
  
  const fetchFutureReservations = async () => {
    if (!selectedProperty) return;
    
    setLoadingFuture(true);
    
    try {
      // Get today's date
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];
      
      // Get a date far in the future (1 year)
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const futureDateStr = futureDate.toISOString().split('T')[0];
      
      // Fetch reservations with arrival date from today onwards
      const filters = {
        limit: 100,
        listingId: selectedProperty,
        checkInDateFrom: todayStr,
        checkInDateTo: futureDateStr
      };
      
      const result = await api.getReservations(filters);
      const futureReservations = result?.reservations || [];
      
      // Calculate total future payouts
      let totalFuturePayouts = 0;
      
      if (futureReservations.length > 0) {
        // Fetch financial data for these reservations
        const financialParams = {
          listingMapIds: [selectedProperty],
          fromDate: todayStr,
          toDate: futureDateStr,
          dateType: 'arrivalDate'
        };
        
        const financialResponse = await api.getFinancialReport(financialParams);
        
        // Process financial data
        if (financialResponse.result && financialResponse.result.rows && financialResponse.result.columns) {
          const columns = financialResponse.result.columns;
          const rows = financialResponse.result.rows;
          
          // Find the owner payout column index
          const ownerPayoutIndex = columns.findIndex(col => col.name === 'ownerPayout');
          
          if (ownerPayoutIndex !== -1) {
            // Sum up owner payouts
            totalFuturePayouts = rows.reduce((sum, row) => {
              return sum + (parseFloat(row[ownerPayoutIndex]) || 0);
            }, 0);
          }
        } else {
          // Fallback calculation if financial report isn't available
          totalFuturePayouts = futureReservations.reduce((sum, res) => {
            return sum + (parseFloat(res.ownerPayout) || 0);
          }, 0);
        }
      }
      
      setFuturePayouts(totalFuturePayouts);
    } catch (err) {
      console.error("Error fetching future reservations:", err);
    } finally {
      setLoadingFuture(false);
    }
  };
  
  // Skip calculations if loading or no reservations
  if (loading || !reservations || reservations.length === 0) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-cards">
          {loading ? (
            // Show skeleton cards while loading
            Array(5).fill().map((_, index) => (
              <div key={index} className="dashboard-card loading">
                <div className="dashboard-card-label-skeleton"></div>
                <div className="dashboard-card-value-skeleton"></div>
              </div>
            ))
          ) : (
            <div className="no-data-message">
              Select a property and date range to view summary
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Calculate totals from reservations
  const totalBookings = reservations.length;
  
  // Calculate total base rate with all the required components
  const totalBaseRate = reservations.reduce((sum, res) => {
    // Base rate already has claims protection subtracted in the Reservations component
    const baseRate = parseFloat(res.baseRate) || 0;
    const weeklyDiscount = parseFloat(res.weeklyDiscount) || parseFloat(res['weekly Discount']) || 0;
    const couponDiscount = parseFloat(res.couponDiscount) || parseFloat(res['coupon Discount']) || 0;
    const monthlyDiscount = parseFloat(res.monthlyDiscount) || parseFloat(res['monthly Discount']) || 0;
    const cancellationPayout = parseFloat(res.cancellationPayout) || parseFloat(res['cancellation Payout']) || 0;
    const otherFees = parseFloat(res.otherFees) || parseFloat(res['other Fees']) || 0;
    
    // Sum up all components
    return sum + baseRate + weeklyDiscount + couponDiscount + monthlyDiscount + cancellationPayout + otherFees;
  }, 0);
  
  // Calculate total cleaning fee
  const totalCleaningFee = reservations.reduce((sum, res) => {
    return sum + (parseFloat(res.cleaningFee) || parseFloat(res.cleaningFeeValue) || 0);
  }, 0);
  
  // Calculate owner payouts
  const totalOwnerPayouts = reservations.reduce((sum, res) => {
    return sum + (parseFloat(res.ownerPayout) || 0);
  }, 0);
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  return (
    <div className="dashboard-container">
      <div className="dashboard-cards">
        {/* Total Bookings */}
        <div className="dashboard-card">
          <div className="dashboard-card-label">Bookings</div>
          <div className="dashboard-card-value">{totalBookings}</div>
        </div>
        
        {/* Total Base Rate */}
        <div className="dashboard-card">
          <div className="dashboard-card-label">Base Rate</div>
          <div className="dashboard-card-value">{formatCurrency(totalBaseRate)}</div>
        </div>
        
        {/* Total Cleaning Fee */}
        <div className="dashboard-card">
          <div className="dashboard-card-label">Cleaning Fee</div>
          <div className="dashboard-card-value">{formatCurrency(totalCleaningFee)}</div>
        </div>
        
        {/* Total Owner Payouts */}
        <div className="dashboard-card">
          <div className="dashboard-card-label">Owner Payout</div>
          <div className="dashboard-card-value">{formatCurrency(totalOwnerPayouts)}</div>
        </div>
        
        {/* Future Payouts */}
        <div className="dashboard-card future">
          <div className="dashboard-card-label">Future Payouts</div>
          <div className="dashboard-card-value">
            {loadingFuture ? (
              <span className="loading-indicator-small"></span>
            ) : (
              formatCurrency(futurePayouts)
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservationsDashboard;