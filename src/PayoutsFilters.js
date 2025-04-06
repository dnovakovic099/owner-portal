import React, { useState } from 'react';

export const PayoutsFilters = ({
  properties,
  selectedProperty,
  setSelectedProperty,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onGenerateReport,
  loading,
  prorationMethod,
  setProrationMethod
}) => {
  // State for advanced filters toggle
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Validate form - all fields must be filled
  const isFormValid = selectedProperty && startDate && endDate;
  
  return (
    <div className="payouts-controls">
      <div className="filter-row">
        <div className="filter-item">
          <label htmlFor="property-select">Select Property</label>
          <select
            id="property-select"
            value={selectedProperty}
            onChange={(e) => setSelectedProperty(e.target.value)}
            className="filter-input"
            disabled={loading}
          >
            <option value="">Select a property</option>
            {properties.map(property => {
              const propertyName = property.name || 
                                   property.title || 
                                   property.propertyName || 
                                   `Property #${property.id}`;
              return (
                <option key={property.id} value={property.id}>
                  {propertyName}
                </option>
              );
            })}
          </select>
        </div>
        
        <div className="filter-item">
          <label htmlFor="startDate">Start Date</label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="filter-input"
            disabled={loading}
          />
        </div>
        
        <div className="filter-item">
          <label htmlFor="endDate">End Date</label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="filter-input"
            min={startDate}
            disabled={loading}
          />
        </div>
        
        <div className="filter-actions">
          <button
            className={`generate-report-btn ${!isFormValid ? 'disabled' : ''}`}
            onClick={onGenerateReport}
            disabled={!isFormValid || loading}
          >
            {loading ? 'Generating...' : 'Generate Statement'}
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </button>
        </div>
      </div>

      <div className="advanced-filters-toggle">
        <button 
          className="toggle-btn" 
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
        >
          {showAdvancedFilters ? 'Hide Advanced Filters' : 'Show Advanced Filters'}
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            style={{ transform: showAdvancedFilters ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
      </div>

      {showAdvancedFilters && (
        <div className="advanced-filters">
          <div className="filter-item">
            <label htmlFor="proration-method">Proration Method</label>
            <select
              id="proration-method"
              value={prorationMethod}
              onChange={(e) => setProrationMethod(e.target.value)}
              className="filter-input"
              disabled={loading}
            >
              <option value="calendar">Calendar (Default)</option>
              <option value="checkout">Check-Out</option>
              <option value="checkin">Check-In</option>
            </select>
            <div className="filter-hint">
              <small>
                Calendar: Prorates reservations that overlap with date range.<br/>
                Check-Out: Includes only reservations that checked out on or before end date.<br/>
                Check-In: Includes only reservations that checked in on or before end date.
              </small>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayoutsFilters;