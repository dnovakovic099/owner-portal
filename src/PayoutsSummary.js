import React from 'react';
import { formatCurrency } from './utils/formatters';

export const PayoutsSummary = ({ reservations, financialData }) => {
  // Calculate summary statistics
  const calculateSummary = () => {
    // If no financial data, return zeros
    if (!financialData || !financialData.rows || !financialData.columns) {
      return {
        totalPayout: 0,
        totalBaseRate: 0,
        totalCleaningFees: 0,
        totalTaxes: 0,
        totalChannelFees: 0
      };
    }
    
    const columns = financialData.columns;
    
    // Find column indexes
    const ownerPayoutIndex = columns.findIndex(col => col.name === 'ownerPayout');
    const baseRateIndex = columns.findIndex(col => col.name === 'baseRate');
    const cleaningFeeIndex = columns.findIndex(col => col.name === 'cleaningFeeValue');
    const taxIndex = columns.findIndex(col => col.name === 'totalTax');
    const channelFeeIndex = columns.findIndex(col => col.name === 'hostChannelFee');
    
    // Sum up values
    const summary = financialData.rows.reduce((acc, row) => {
      return {
        totalPayout: acc.totalPayout + parseFloat(row[ownerPayoutIndex] || 0),
        totalBaseRate: acc.totalBaseRate + parseFloat(row[baseRateIndex] || 0),
        totalCleaningFees: acc.totalCleaningFees + parseFloat(row[cleaningFeeIndex] || 0),
        totalTaxes: acc.totalTaxes + parseFloat(row[taxIndex] || 0),
        totalChannelFees: acc.totalChannelFees + parseFloat(row[channelFeeIndex] || 0)
      };
    }, {
      totalPayout: 0,
      totalBaseRate: 0,
      totalCleaningFees: 0,
      totalTaxes: 0,
      totalChannelFees: 0
    });
    
    return summary;
  };
  
  const summary = calculateSummary();
  
  return (
    <div className="payouts-summary">
      <div className="summary-cards">
        <div className="summary-card">
          <div className="card-label">Total Bookings</div>
          <div className="card-value">{reservations.length}</div>
        </div>
        
        <div className="summary-card">
          <div className="card-label">Total Owner Payout</div>
          <div className="card-value">{formatCurrency(summary.totalPayout)}</div>
        </div>
        
        <div className="summary-card">
          <div className="card-label">Base Rate</div>
          <div className="card-value">{formatCurrency(summary.totalBaseRate)}</div>
        </div>
        
        <div className="summary-card">
          <div className="card-label">Cleaning Fees</div>
          <div className="card-value">{formatCurrency(summary.totalCleaningFees)}</div>
        </div>
        
        <div className="summary-card">
          <div className="card-label">Taxes</div>
          <div className="card-value">{formatCurrency(summary.totalTaxes)}</div>
        </div>
        
        <div className="summary-card">
          <div className="card-label">Channel Fees</div>
          <div className="card-value">{formatCurrency(summary.totalChannelFees)}</div>
        </div>
      </div>
    </div>
  );
};

export default PayoutsSummary;