import React from 'react';

export const PayoutsInstructions = () => {
  return (
    <div className="payouts-instructions">
      <div className="instructions-container">
        <h2>Generate Owner Payout Reports</h2>
        <div className="instructions-grid">
          <div className="instruction-card">
            <div className="instruction-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            <h3>Select Date Range</h3>
            <p>Choose a start and end date to define the reporting period for your payout report.</p>
          </div>
          
          <div className="instruction-card">
            <div className="instruction-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="8.5" cy="7" r="4"></circle>
                <line x1="20" y1="8" x2="20" y2="14"></line>
                <line x1="23" y1="11" x2="17" y2="11"></line>
              </svg>
            </div>
            <h3>Pick Your Property</h3>
            <p>Select the specific property you want to generate a payout report for from the dropdown.</p>
          </div>
          
          <div className="instruction-card">
            <div className="instruction-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            </div>
            <h3>Generate Report</h3>
            <p>Click "Generate Report" to create a detailed PDF with all financial information.</p>
          </div>
        </div>
        
        <div className="instructions-details">
          <h3>What's Included in Your Payout Report</h3>
          <ul>
            <li>Comprehensive breakdown of all reservations in the selected period</li>
            <li>Detailed financial information including base rates, cleaning fees, and taxes</li>
            <li>Total owner payout calculation</li>
            <li>Breakdown by booking channel (Airbnb, VRBO, Direct, etc.)</li>
          </ul>
        </div>
        
        <div className="instructions-tips">
          <h3>Pro Tips</h3>
          <div className="tips-grid">
            <div className="tip-card">
              <div className="tip-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
              </div>
              <p>Reports can span multiple months for comprehensive financial tracking</p>
            </div>
            <div className="tip-card">
              <div className="tip-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <p>PDF reports include a complete breakdown of revenues and fees</p>
            </div>
            <div className="tip-card">
              <div className="tip-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              <p>All financial data is securely stored and easily accessible</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayoutsInstructions;