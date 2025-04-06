import React, { useState, useEffect } from 'react';
import api from './api/api';
import './Referrals.css';

export const Referrals = () => {
  // State variables
  const [referrals, setReferrals] = useState([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [pendingEarnings, setPendingEarnings] = useState(0);
  const [activeTab, setActiveTab] = useState('refer'); // 'refer' or 'estimate'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  
  // Income estimation states
  const [address, setAddress] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [estimatedIncome, setEstimatedIncome] = useState(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [estimateError, setEstimateError] = useState(null);
  
  // Contact form states
  const [referName, setReferName] = useState('');
  const [referEmail, setReferEmail] = useState('');
  const [referPhone, setReferPhone] = useState('');
  const [referMessage, setReferMessage] = useState('');
  const [referSubmitted, setReferSubmitted] = useState(false);

  // Fetch referrals on component mount
  useEffect(() => {
    fetchReferrals();
  }, []);

  // Reset copied state after 3 seconds
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => {
        setCopied(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  // Fetch referrals function
  const fetchReferrals = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // This would be your actual API call in production
      // const data = await api.getReferrals();
      
      // For demo/development, using mock data
      const mockReferrals = [
        { id: 1, name: 'John Smith', propertyAddress: '123 Beach Ave, Miami, FL', status: 'Active', date: '2023-12-10', earnings: 450, propertyIncome: 4500 },
        { id: 2, name: 'Lisa Johnson', propertyAddress: '456 Palm St, Orlando, FL', status: 'Pending', date: '2024-02-15', earnings: 350, propertyIncome: 3500 },
        { id: 3, name: 'Robert Davis', propertyAddress: '789 Ocean Blvd, Tampa, FL', status: 'Active', date: '2024-03-05', earnings: 380, propertyIncome: 3800 },
        { id: 4, name: 'Emily Wilson', propertyAddress: '567 Bay View, Key West, FL', status: 'Active', date: '2024-01-20', earnings: 520, propertyIncome: 5200 }
      ];
      
      setReferrals(mockReferrals);
      
      // Calculate totals
      const total = mockReferrals.reduce((sum, ref) => sum + ref.earnings, 0);
      setTotalEarnings(total);
      
      const pending = mockReferrals
        .filter(ref => ref.status === 'Pending')
        .reduce((sum, ref) => sum + ref.earnings, 0);
      setPendingEarnings(pending);
      
    } catch (err) {
      console.error("Error fetching referrals:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate income estimate
  const calculateEstimate = async (e) => {
    e.preventDefault();
    
    if (!address || !bedrooms || !bathrooms) {
      setEstimateError('Please fill in all fields');
      return;
    }
    
    setEstimateLoading(true);
    setEstimateError(null);
    setEstimatedIncome(null);
    
    try {
      // This would be your actual API call in production
      // const data = await api.getIncomeEstimate({ address, bedrooms, bathrooms });
      
      // For demo/development, generate a realistic estimate
      const baseAmount = 2500;
      const bedroomMultiplier = parseInt(bedrooms) * 500;
      const bathroomMultiplier = parseFloat(bathrooms) * 300;
      
      // Add some randomness for realism
      const randomFactor = 0.9 + (Math.random() * 0.3); // Random between 0.9 and 1.2
      
      const monthlyEstimate = Math.round((baseAmount + bedroomMultiplier + bathroomMultiplier) * randomFactor);
      const yearlyEstimate = monthlyEstimate * 12;
      
      // Simulate API delay
      setTimeout(() => {
        setEstimatedIncome({
          monthly: monthlyEstimate,
          yearly: yearlyEstimate,
          occupancyRate: Math.round(65 + Math.random() * 20), // Random occupancy between 65-85%
          potentialReferralEarnings: Math.round(yearlyEstimate * 0.1) // 10% of yearly income
        });
        setEstimateLoading(false);
      }, 1500);
      
    } catch (err) {
      console.error("Error getting income estimate:", err);
      setEstimateError(err.message || 'Error calculating estimate');
      setEstimateLoading(false);
    }
  };

  // Submit referral contact
  const submitReferralContact = (e) => {
    e.preventDefault();
    
    // Simulate API call
    setTimeout(() => {
      setReferSubmitted(true);
      
      // Reset form
      setTimeout(() => {
        setReferName('');
        setReferEmail('');
        setReferPhone('');
        setReferMessage('');
        setReferSubmitted(false);
      }, 5000);
    }, 1000);
  };

  // Copy referral link to clipboard
  const copyReferralLink = () => {
    const referralLink = "https://yourwebsite.com/refer?id=12345";
    navigator.clipboard.writeText(referralLink)
      .then(() => {
        setCopied(true);
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
      });
  };

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
    <div className="referrals-container">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <h1 className="page-title">Referral Dashboard</h1>
      </div>
      
      {/* Small Card Dashboard */}
      <div className="mini-card-dashboard">
        <div className="mini-card total-card">
          <div className="mini-card-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
          <div className="mini-card-content">
            <h3>Total Earnings</h3>
            <div className="mini-amount">{formatCurrency(totalEarnings)}</div>
          </div>
        </div>
        
        <div className="mini-card pending-card">
          <div className="mini-card-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <div className="mini-card-content">
            <h3>Pending</h3>
            <div className="mini-amount">{formatCurrency(pendingEarnings)}</div>
          </div>
        </div>
        
        <div className="mini-card referrals-card">
          <div className="mini-card-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <div className="mini-card-content">
            <h3>Active Referrals</h3>
            <div className="mini-amount">{referrals.filter(r => r.status === 'Active').length}</div>
          </div>
        </div>
        
        <div className="mini-card projection-card">
          <div className="mini-card-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <div className="mini-card-content">
            <h3>Annual Projection</h3>
            <div className="mini-amount">{formatCurrency(totalEarnings * 3)}</div>
          </div>
        </div>
      </div>
      
      {/* Enhanced Tab Navigation */}
      <div className="enhanced-tabs-container">
        <div className="enhanced-tabs">
          <button 
            className={`enhanced-tab ${activeTab === 'refer' ? 'active' : ''}`}
            onClick={() => setActiveTab('refer')}
          >
            <div className="tab-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13"></path>
                <path d="M22 2l-7 20-4-9-9-4 20-7z"></path>
              </svg>
            </div>
            <div className="tab-text">
              <span className="tab-title">Refer & Earn</span>
              <span className="tab-subtitle">Earn 10% of monthly income</span>
            </div>
          </button>
          
          <button 
            className={`enhanced-tab ${activeTab === 'estimate' ? 'active' : ''}`}
            onClick={() => setActiveTab('estimate')}
          >
            <div className="tab-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6"></line>
                <line x1="8" y1="12" x2="21" y2="12"></line>
                <line x1="8" y1="18" x2="21" y2="18"></line>
                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                <line x1="3" y1="18" x2="3.01" y2="18"></line>
              </svg>
            </div>
            <div className="tab-text">
              <span className="tab-title">Income Estimator</span>
              <span className="tab-subtitle">Calculate potential earnings</span>
            </div>
          </button>
        </div>
      </div>
      
      <div className="referrals-content">
        {activeTab === 'refer' && (
          <div className="main-content">
            <div className="how-it-works">
              <h2 className="section-title">How Your Referral Commission Works</h2>
              <div className="commission-explainer">
                <p>You earn <strong>10% of the monthly rental income</strong> for as long as both you and your referred owner stay with us. The more properties you refer, the more passive income you'll generate!</p>
              </div>
              <div className="steps-container">
                <div className="step">
                  <div className="step-number">1</div>
                  <h3>Share Your Link</h3>
                  <p>Share your unique referral link with property owners interested in our management services.</p>
                </div>
                <div className="step">
                  <div className="step-number">2</div>
                  <h3>Owner Lists Property</h3>
                  <p>When they sign up with us, we professionally manage their rental to maximize income.</p>
                </div>
                <div className="step">
                  <div className="step-number">3</div>
                  <h3>Earn Ongoing 10%</h3>
                  <p>You receive 10% of the property's monthly income for as long as they stay with us.</p>
                </div>
              </div>
            </div>
            
            <div className="referral-options">
              <div className="referral-option">
                <h3>Share Your Referral Link</h3>
                <div className="referral-link-container">
                  <input 
                    type="text" 
                    readOnly 
                    value="https://yourwebsite.com/refer?id=12345"
                    className="referral-link-input"
                  />
                  <button className="copy-link-btn" onClick={copyReferralLink}>
                    {copied ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                          <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                        Copy Link
                      </>
                    )}
                  </button>
                </div>
                <div className="social-sharing">
                  <p>Or share directly:</p>
                  <div className="social-buttons">
                    <button className="social-btn email">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                        <polyline points="22,6 12,13 2,6"></polyline>
                      </svg>
                    </button>
                    <button className="social-btn facebook">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                      </svg>
                    </button>
                    <button className="social-btn twitter">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                      </svg>
                    </button>
                    <button className="social-btn whatsapp">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="referral-option">
                <h3>Refer Someone Directly</h3>
                {referSubmitted ? (
                  <div className="success-message">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    <h4>Thank you!</h4>
                    <p>Your referral has been submitted. We'll reach out to them within 1-2 business days.</p>
                  </div>
                ) : (
                  <form className="referral-form" onSubmit={submitReferralContact}>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="referName">Owner's Name</label>
                        <input
                          type="text"
                          id="referName"
                          value={referName}
                          onChange={(e) => setReferName(e.target.value)}
                          placeholder="Property owner's name"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group half">
                        <label htmlFor="referEmail">Email</label>
                        <input
                          type="email"
                          id="referEmail"
                          value={referEmail}
                          onChange={(e) => setReferEmail(e.target.value)}
                          placeholder="Their email address"
                          required
                        />
                      </div>
                      
                      <div className="form-group half">
                        <label htmlFor="referPhone">Phone (Optional)</label>
                        <input
                          type="tel"
                          id="referPhone"
                          value={referPhone}
                          onChange={(e) => setReferPhone(e.target.value)}
                          placeholder="Their phone number"
                        />
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="referMessage">Property Details (Optional)</label>
                      <textarea
                        id="referMessage"
                        value={referMessage}
                        onChange={(e) => setReferMessage(e.target.value)}
                        placeholder="Any information about the property location, size, etc."
                        rows="3"
                      ></textarea>
                    </div>
                    
                    <button type="submit" className="submit-btn">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 2L11 13"></path>
                        <path d="M22 2l-7 20-4-9-9-4 20-7z"></path>
                      </svg>
                      Submit Referral
                    </button>
                  </form>
                )}
              </div>
            </div>
            
            {referrals.length > 0 && (
              <div className="referrals-activity">
                <h2 className="section-title">Your Referral Activity</h2>
                {loading ? (
                  <div className="loading">
                    <div className="spinner"></div>
                    <p>Loading referral data...</p>
                  </div>
                ) : error ? (
                  <div className="error-message">
                    <p>Error: {error.message}</p>
                    <button onClick={fetchReferrals} className="retry-button">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                      </svg>
                      Retry
                    </button>
                  </div>
                ) : (
                  <div className="referrals-table-container">
                    <table className="referrals-table">
                      <thead>
                        <tr>
                          <th>Referred Owner</th>
                          <th>Property</th>
                          <th>Date</th>
                          <th>Status</th>
                          <th>Monthly Income</th>
                          <th>Your Commission</th>
                        </tr>
                      </thead>
                      <tbody>
                        {referrals.map(referral => (
                          <tr key={referral.id}>
                            <td>{referral.name}</td>
                            <td>{referral.propertyAddress}</td>
                            <td>{new Date(referral.date).toLocaleDateString()}</td>
                            <td>
                              <span className={`status-badge ${referral.status.toLowerCase()}`}>
                                {referral.status}
                              </span>
                            </td>
                            <td>{formatCurrency(referral.propertyIncome)}</td>
                            <td>{formatCurrency(referral.earnings)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'estimate' && (
          <div className="main-content">
            <div className="income-potential">
              <h2 className="section-title">Estimate Rental Income Potential</h2>
              <p className="section-description">
                See what a property could earn and what your referral commission would be.
              </p>
              
              <div className="estimate-columns">
                <div className="estimate-column">
                  <form className="estimate-form" onSubmit={calculateEstimate}>
                    <div className="form-group">
                      <label htmlFor="address">Property Address</label>
                      <input
                        type="text"
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Enter full property address"
                        required
                      />
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group half">
                        <label htmlFor="bedrooms">Bedrooms</label>
                        <select
                          id="bedrooms"
                          value={bedrooms}
                          onChange={(e) => setBedrooms(e.target.value)}
                          required
                        >
                          <option value="">Select</option>
                          <option value="1">1</option>
                          <option value="2">2</option>
                          <option value="3">3</option>
                          <option value="4">4</option>
                          <option value="5">5</option>
                          <option value="6+">6+</option>
                        </select>
                      </div>
                      
                      <div className="form-group half">
                        <label htmlFor="bathrooms">Bathrooms</label>
                        <select
                          id="bathrooms"
                          value={bathrooms}
                          onChange={(e) => setBathrooms(e.target.value)}
                          required
                        >
                          <option value="">Select</option>
                          <option value="1">1</option>
                          <option value="1.5">1.5</option>
                          <option value="2">2</option>
                          <option value="2.5">2.5</option>
                          <option value="3">3</option>
                          <option value="3.5">3.5</option>
                          <option value="4+">4+</option>
                        </select>
                      </div>
                    </div>
                    
                    {estimateError && (
                      <div className="estimate-error">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="8" x2="12" y2="12"></line>
                          <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        {estimateError}
                      </div>
                    )}
                    
                    <button 
                      type="submit" 
                      className="calculate-btn"
                      disabled={estimateLoading}
                    >
                      {estimateLoading ? (
                        <>
                          <div className="spinner" style={{ width: '20px', height: '20px', margin: '0 10px 0 0' }}></div>
                          Calculating...
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="8" y1="6" x2="21" y2="6"></line>
                            <line x1="8" y1="12" x2="21" y2="12"></line>
                            <line x1="8" y1="18" x2="21" y2="18"></line>
                            <line x1="3" y1="6" x2="3.01" y2="6"></line>
                            <line x1="3" y1="12" x2="3.01" y2="12"></line>
                            <line x1="3" y1="18" x2="3.01" y2="18"></line>
                          </svg>
                          Calculate Estimate
                        </>
                      )}
                    </button>
                  </form>
                </div>
                
                <div className="estimate-column">
                  {estimateLoading ? (
                    <div className="estimate-loading">
                      <div className="spinner"></div>
                      <p>Calculating your estimate...</p>
                    </div>
                  ) : estimatedIncome ? (
                    <div className="estimate-results">
                      <h3>Estimated Income</h3>
                      
                      <div className="estimate-cards">
                        <div className="estimate-card">
                          <div className="estimate-label">Property Monthly</div>
                          <div className="estimate-value">{formatCurrency(estimatedIncome.monthly)}</div>
                        </div>
                        
                        <div className="estimate-card">
                          <div className="estimate-label">Property Annual</div>
                          <div className="estimate-value">{formatCurrency(estimatedIncome.yearly)}</div>
                        </div>
                        
                        <div className="estimate-card highlight-card">
                          <div className="estimate-label">Your Annual Commission</div>
                          <div className="estimate-value">{formatCurrency(estimatedIncome.potentialReferralEarnings)}</div>
                        </div>
                      </div>
                      
                      <div className="referral-opportunity">
                        <h4>Earn {formatCurrency(Math.round(estimatedIncome.monthly * 0.1))} monthly!</h4>
                        <p>You'll earn 10% of the monthly rental income for as long as the property stays with us.</p>
                        <button className="refer-property-btn" onClick={() => setActiveTab('refer')}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 2L11 13"></path>
                            <path d="M22 2l-7 20-4-9-9-4 20-7z"></path>
                          </svg>
                          Refer This Property
                        </button>
                      </div>
                      
                      <div className="estimate-note">
                        <p>
                          Estimates based on similar properties in the area. Actual results may vary based on location, amenities, and market conditions.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="estimate-placeholder">
                      <div className="estimate-placeholder-text">
                        <h3>See Your Earning Potential</h3>
                        <p>Enter property details to calculate both the property's rental income and your 10% commission.</p>
                        <ul className="benefit-list">
                          <li>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            Earn 10% of monthly rental income
                          </li>
                          <li>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            Commission continues as long as they stay with us
                          </li>
                          <li>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            No limit to how many properties you can refer
                          </li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="faq-section compact">
              <h2 className="section-title">Common Questions</h2>
              <div className="faq-grid">
                <div className="faq-item">
                  <h3>How is the 10% commission calculated?</h3>
                  <p>Your commission is 10% of what the property earns in rental income each month. For example, if a property earns $4,000 monthly, you earn $400 each month.</p>
                </div>
                <div className="faq-item">
                  <h3>How long do I receive commissions?</h3>
                  <p>You'll receive the 10% commission for as long as both you and the property owner remain with our service. It's truly passive income!</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Call to Action */}
      <div className="cta-section">
        <div className="cta-content">
          <h2>Start Earning Passive Income Today</h2>
          <p>Share your referral link, earn 10% commission, and build ongoing passive income with each property you refer.</p>
          <button className="cta-button" onClick={() => setActiveTab('refer')}>
            Start Referring
          </button>
        </div>
      </div>
    </div>
  );
};

export default Referrals; 