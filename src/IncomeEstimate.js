import React, { useState, useEffect } from 'react';
import api from './api/api';
import './IncomeEstimate.css';

const IncomeEstimate = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [estimateData, setEstimateData] = useState(null);
  const [formData, setFormData] = useState({
    address: '',
    city: '',
    state: '',
    zipCode: '',
    bedrooms: 1,
    bathrooms: 1,
    accommodates: 2
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // Helper function to format currency
  const formatCurrency = (amount) => {
    // Handle string values like "$219K"
    if (typeof amount === 'string') {
      // If the amount already has $ sign, just return it
      if (amount.startsWith('$')) {
        return amount;
      }
      // Otherwise format it
      return '$' + amount;
    }
    
    // Handle numeric values
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Function to parse currency string to number
  const parseCurrency = (currencyStr) => {
    if (!currencyStr || typeof currencyStr !== 'string') return 0;
    
    // Remove $ and any commas
    let cleanStr = currencyStr.replace(/[$,]/g, '');
    
    // Handle K (thousands)
    if (cleanStr.includes('K')) {
      cleanStr = cleanStr.replace('K', '');
      return parseFloat(cleanStr) * 1000;
    }
    
    // Handle M (millions)
    if (cleanStr.includes('M')) {
      cleanStr = cleanStr.replace('M', '');
      return parseFloat(cleanStr) * 1000000;
    }
    
    return parseFloat(cleanStr);
  };
  
  // Check for URL parameters on component mount
  useEffect(() => {
    // Get URL parameters if they exist
    const urlParams = new URLSearchParams(window.location.search);
    
    // If we have parameters in the URL, use them to populate the form and auto-submit
    if (urlParams.has('address') || urlParams.has('bedrooms')) {
      const paramsFromUrl = {
        address: urlParams.get('address') || '',
        city: urlParams.get('city') || '',
        state: urlParams.get('state') || '',
        zipCode: urlParams.get('zipCode') || '',
        bedrooms: Number(urlParams.get('bedrooms')) || 1,
        bathrooms: Number(urlParams.get('bathrooms')) || 1,
        accommodates: Number(urlParams.get('accommodates')) || 2
      };
      
      // Update form data with URL parameters
      setFormData(paramsFromUrl);
      
      // Auto-submit if we have the required parameters
      if (paramsFromUrl.address && paramsFromUrl.city && paramsFromUrl.state) {
        fetchIncomeEstimate(paramsFromUrl);
      }
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.getIncomeEstimate(formData);
      console.log('API Response:', response); // Log the response for debugging
      setEstimateData(response.data || response);
      setIsSubmitted(true);
    } catch (err) {
      console.error('Error fetching income estimate:', err);
      setError('Failed to fetch income estimate. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Helper to update the URL with form parameters
  const updateUrlWithParams = (params) => {
    const queryParams = new URLSearchParams();
    
    // Add each parameter to the URL if it has a value
    if (params.address) queryParams.set('address', params.address);
    if (params.city) queryParams.set('city', params.city);
    if (params.state) queryParams.set('state', params.state);
    if (params.zipCode) queryParams.set('zipCode', params.zipCode);
    if (params.bedrooms) queryParams.set('bedrooms', params.bedrooms);
    if (params.bathrooms) queryParams.set('bathrooms', params.bathrooms);
    if (params.accommodates) queryParams.set('accommodates', params.accommodates);
    
    // Update the URL without reloading the page
    const newUrl = `${window.location.pathname}?${queryParams.toString()}`;
    window.history.replaceState({}, '', newUrl);
  };

  const fetchIncomeEstimate = async (paramData) => {
    setLoading(true);
    setError(null);
    setIsSubmitted(true);

    try {
      // Use the API client method with form data
      const response = await api.getIncomeEstimate(paramData);
      console.log('API Response:', response);
      
      // Server returns data in a nested result object
      const data = response?.result || response;

      console.log('Data:', data);
      
      setEstimateData(data);
    } catch (err) {
      console.error('Error fetching income estimate:', err);
      setError(err.message || 'Failed to load income estimate data');
    } finally {
      setLoading(false);
    }
  };
  
  // Reset form and clear results
  const handleReset = () => {
    // Clear URL parameters
    window.history.replaceState({}, '', window.location.pathname);
    
    // Reset state
    setIsSubmitted(false);
    setEstimateData(null);
    setError(null);
  };

  // Property Information Form
  const renderPropertyForm = () => (
    <div className="property-form-container">
      <h2>Income Estimate Calculator</h2>
      <p className="form-intro">
        Find out how much your property could earn as a vacation rental. Enter your property details below to get a personalized income estimate based on local market data.
      </p>
      
      <form onSubmit={handleSubmit} className="property-form">
        <div className="form-section">
          <h3 className="form-section-title">Property Location</h3>
          
          <div className="form-group">
            <label htmlFor="address">STREET ADDRESS</label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="123 Main St"
              required
              autoFocus
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="city">CITY</label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="City"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="state">STATE</label>
              <input
                type="text"
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="State"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="zipCode">ZIP CODE</label>
              <input
                type="text"
                id="zipCode"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleChange}
                placeholder="ZIP Code"
                required
              />
            </div>
          </div>
        </div>
        
        <div className="form-section">
          <h3 className="form-section-title">Property Details</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="bedrooms">BEDROOMS</label>
              <div className="select-wrapper">
                <select
                  id="bedrooms"
                  name="bedrooms"
                  value={formData.bedrooms}
                  onChange={handleChange}
                  required
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="bathrooms">BATHROOMS</label>
              <div className="select-wrapper">
                <select
                  id="bathrooms"
                  name="bathrooms"
                  value={formData.bathrooms}
                  onChange={handleChange}
                  required
                >
                  {[1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="accommodates">ACCOMMODATES</label>
              <div className="select-wrapper">
                <select
                  id="accommodates"
                  name="accommodates"
                  value={formData.accommodates}
                  onChange={handleChange}
                  required
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 18, 20].map(num => (
                    <option key={num} value={num}>{num} guests</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
        
        <div className="form-actions">
          <button type="submit" className="submit-button">
            CALCULATE INCOME ESTIMATE
          </button>
        </div>
      </form>
    </div>
  );

  // Results display component
  const renderResults = (data) => {
    console.log('Render Results:', data);    
    // Access the result object
    const result = data;
    
    // Parse confidence score
    let confidenceLevel = 'medium';
    let confidenceScore = 65;
    
    if (typeof result.confidenceScore === 'string') {
      if (result.confidenceScore.toLowerCase() === 'high') {
        confidenceLevel = 'high';
        confidenceScore = 85;
      } else if (result.confidenceScore.toLowerCase() === 'low') {
        confidenceLevel = 'low';
        confidenceScore = 40;
      }
    } else if (typeof result.confidenceScore === 'number') {
      confidenceScore = result.confidenceScore;
      confidenceLevel = confidenceScore >= 80 ? 'high' : confidenceScore < 50 ? 'low' : 'medium';
    }
    
    // Generate confidence message based on level
    const confidenceMessage = {
      high: 'Our estimate has high reliability based on comprehensive market data.',
      medium: 'Our estimate has moderate reliability based on available data.',
      low: 'Our estimate has lower reliability due to limited available data in this area.'
    }[confidenceLevel];

    // Get property details
    const propertyDetails = result.propertyDetails || {};
    const address = result.address || '';
    const [street, cityStateZip] = address.split(', ');
    
    // Create property details string
    const detailsText = [
      propertyDetails.bedrooms && `${propertyDetails.bedrooms} bed`,
      propertyDetails.bathrooms && `${propertyDetails.bathrooms} bath`,
      propertyDetails.accommodates && propertyDetails.accommodates !== 'Not specified' && 
        `Sleeps ${propertyDetails.accommodates}`
    ].filter(Boolean).join(' • ');
    
    // Format rates and revenue
    const annualRevenue = result.annualRevenue || '';
    const monthlyRevenue = calculateMonthlyFromAnnual(annualRevenue);
    const avgDailyRate = result.averageDailyRate || '';
    const occupancy = result.averageOccupancy || '';
    
    // Calculate peak and low season rates
    const dailyRateNumber = parseCurrency(avgDailyRate);
    const peakSeasonRate = formatCurrency(dailyRateNumber * 1.4);
    const lowSeasonRate = formatCurrency(dailyRateNumber * 0.7);
    
    return (
      <div className="results-container">
        <div className="result-card">
          <div className="results-header">
            <h2>Rental Income Estimate</h2>
            <button className="new-estimate-btn" onClick={handleReset}>
              New Estimate
            </button>
          </div>
          
          <div className="property-details">
            <div className="address-block">
              <h3>{street}</h3>
              <p>{cityStateZip}</p>
              {detailsText && <p>{detailsText}</p>}
            </div>
          </div>
          
          <div className="revenue-showcase">
            <div className="annual-revenue">
              <div className="revenue-badge">ESTIMATED ANNUAL INCOME</div>
              <div className="revenue-amount">{annualRevenue}</div>
              <p className="revenue-caption">Based on comparable properties and market conditions</p>
            </div>
            
            <div className="monthly-revenue">
              <div className="monthly-card">
                <div className="monthly-label">AVG. MONTHLY INCOME</div>
                <div className="monthly-amount">{monthlyRevenue}</div>
              </div>
            </div>
          </div>
          
          <div className="performance-metrics">
            <div className="metric-card">
              <div className="metric-icon">
                <i className="fas fa-calendar"></i>
              </div>
              <div className="metric-content">
                <div className="metric-label">OCCUPANCY RATE</div>
                <div className="metric-value">{occupancy}</div>
              </div>
            </div>
            
            <div className="metric-card">
              <div className="metric-icon">
                <i className="fas fa-chart-line"></i>
              </div>
              <div className="metric-content">
                <div className="metric-label">AVG. DAILY RATE</div>
                <div className="metric-value">{avgDailyRate}</div>
              </div>
            </div>
          </div>
          
          <div className="confidence-wrapper">
            <div className="confidence-header">
              <h4>Estimate Confidence</h4>
              <span className={`confidence-badge ${confidenceLevel}`}>
                {result.confidenceScore || confidenceLevel.toUpperCase()}
              </span>
            </div>
            <p className="confidence-description">{confidenceMessage}</p>
            <div className="confidence-bar">
              <div 
                className={`confidence-fill ${confidenceLevel}`} 
                style={{ width: `${confidenceScore}%` }}
              ></div>
            </div>
          </div>
          
          <div className="estimate-notes">
            <h4>About This Estimate</h4>
            <p>
              This rental income estimate is based on the performance of comparable properties in your area, 
              current market trends, and seasonal demand. {result.note && result.note}
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Helper function to calculate monthly revenue from annual
  const calculateMonthlyFromAnnual = (annualStr) => {
    if (!annualStr) return '$0';
    const annual = parseCurrency(annualStr);
    const monthly = Math.round(annual / 12);
    return formatCurrency(monthly);
  };

  // Main component render
  return (
    <div className="income-estimate-container">
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Calculating your rental income estimate...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <h3>Error</h3>
          <p>{error}</p>
          <button className="retry-button" onClick={() => setError(null)}>Try Again</button>
        </div>
      ) : isSubmitted && estimateData ? (
        renderResults(estimateData)
      ) : (
        <div className="property-form-container">
          {renderPropertyForm()}
        </div>
      )}
    </div>
  );
};

export default IncomeEstimate; 