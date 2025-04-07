import React, { useState, useEffect } from 'react';
import './Referrals.css';
import { formatCurrency } from './utils/formatters';

export const Partnership = () => {
  // State variables
  const [referrals, setReferrals] = useState([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [pendingEarnings, setPendingEarnings] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [referralLink, setReferralLink] = useState("https://yourwebsite.com/refer?id=12345");
  
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
      
      // Calculate management fee (typically 20-25% of rental income)
      const managementFee = Math.round(monthlyEstimate * 0.22);
      const yearlyManagementFee = managementFee * 12;
      
      // Calculate partner's 10% of management fee
      const partnerEarnings = Math.round(managementFee * 0.1);
      const yearlyPartnerEarnings = partnerEarnings * 12;
      
      // Simulate API delay
      setTimeout(() => {
        setEstimatedIncome({
          monthly: monthlyEstimate,
          yearly: yearlyEstimate,
          managementFee: managementFee,
          yearlyManagementFee: yearlyManagementFee,
          monthlyPartnerEarnings: partnerEarnings,
          yearlyPartnerEarnings: yearlyPartnerEarnings,
          occupancyRate: Math.round(65 + Math.random() * 20) // Random occupancy between 65-85%
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
    navigator.clipboard.writeText(referralLink)
      .then(() => {
        setCopied(true);
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
      });
  };

  // Format currency
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Render tab content based on activeTab
  const renderTabContent = () => {
    if (activeTab === 'overview') {
      return (
        <>
          <h2 className="section-title">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            Program Blueprint
          </h2>
          <p className="section-description">Engage with our simple 3-step process to activate your passive income source.</p>
          <div className="process-steps">
            <div className="process-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3 className="step-title">Share Your Holo-Link</h3>
                <p className="step-description">Distribute your unique partnership link to prospective property owners seeking elite management.</p>
              </div>
            </div>
            <div className="process-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3 className="step-title">Owner Integration</h3>
                <p className="step-description">Upon signup via your link, we seamlessly integrate their property into our high-performance management system.</p>
              </div>
            </div>
            <div className="process-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3 className="step-title">Continuous Commission Flow</h3>
                <p className="step-description">Secure 10% of our management fee perpetually, as long as the owner remains partnered.</p>
              </div>
            </div>
          </div>
        </>
      );
    }
    
    if (activeTab === 'share') {
      return (
        <>
          <h2 className="section-title">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
            Amplify Your Network
          </h2>
          <p className="section-description">Copy and deploy your personalized Holo-Link across your network to maximize earning potential.</p>
          <div className="share-options">
            <div className="partnership-link-card glass-card">
              <input
                type="text"
                value={referralLink}
                className="form-control"
                readOnly
              />
              <button className="calculate-button" onClick={copyReferralLink}>
                {copied ? "Copied!" : "Copy Holo-Link"}
              </button>
            </div>
          </div>
        </>
      );
    }
    
    if (activeTab === 'activity') {
      return (
        <>
          <h2 className="section-title">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
            Activity Stream
          </h2>
          {loading ? (
            <div className="loader-container">
              <div className="loader"></div>
              <p className="loading-text">Loading your partnership data...</p>
            </div>
          ) : error ? (
            <div className="error-state glass-card">
              <div className="error-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              </div>
              <h3 className="error-title">Connection Error</h3>
              <p className="error-message">
                Could not retrieve activity data: {typeof error === 'string' ? error : (error && error.message ? error.message : 'Unknown error')}
              </p>
              <button onClick={fetchReferrals} className="calculate-button" style={{ width: 'auto' }}>Retry Connection</button>
            </div>
          ) : referrals.length === 0 ? (
            <div className="empty-state glass-card">
              <div className="empty-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
              </div>
              <h3 className="empty-title">Stream Empty</h3>
              <p className="empty-message">No referral activity detected. Deploy your Holo-Link to populate the stream.</p>
            </div>
          ) : (
            <div className="activity-table-container">
              <table className="activity-table">
                <thead>
                  <tr>
                    <th>Partner Asset</th>
                    <th>Property ID</th>
                    <th>Integration Date</th>
                    <th>Status Grid</th>
                    <th>Projected Fee</th>
                    <th>Your Yield</th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.map(referral => (
                    <tr key={referral.id}>
                      <td>{referral.name}</td>
                      <td>{referral.propertyAddress}</td>
                      <td>{new Date(referral.date).toLocaleDateString()}</td>
                      <td>
                        <span className={`status-indicator status-${referral.status.toLowerCase()}`}>
                          {referral.status}
                        </span>
                      </td>
                      <td>{formatMoney(referral.earnings * 10)}</td>
                      <td>{formatMoney(referral.earnings)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      );
    }
    
    return null;
  };

  // Render calculator content
  const renderCalculator = () => {
    if (estimateLoading) {
      return (
        <div className="loader-container">
          <div className="loader"></div>
          <p className="loading-text">Calculating Future Values...</p>
        </div>
      );
    }
    
    if (estimatedIncome) {
      return (
        <div className="results-container">
          <h4 className="results-title">Forecast Results</h4>
          
          <div className="results-card">
            <span className="result-label">Est. Monthly Revenue</span>
            <span className="result-value">{formatMoney(estimatedIncome.monthly)}</span>
          </div>
          
          <div className="results-card">
            <span className="result-label">Est. Management Fee</span>
            <span className="result-value">{formatMoney(estimatedIncome.managementFee)}</span>
          </div>
          
          <div className="results-card highlight">
            <span className="result-label">Your Monthly Yield</span>
            <span className="result-value">{formatMoney(estimatedIncome.monthlyPartnerEarnings)}</span>
          </div>
          
          <div className="results-card highlight">
            <span className="result-label">Projected Annual Yield</span>
            <span className="result-value">{formatMoney(estimatedIncome.yearlyPartnerEarnings)}</span>
          </div>
          
          <p className="result-note">Forecasts are speculative, based on current market data and inputs. Actual yields may fluctuate.</p>
          
          <button 
            onClick={() => setEstimatedIncome(null)} 
            className="calculate-button" 
            style={{marginTop: 'var(--space-md)', background: 'var(--color-surface-elevated)'}}
          >
            Recalculate
          </button>
        </div>
      );
    }
    
    return (
      <div className="form-container">
        <p className="form-subtitle">Input property parameters to forecast potential income.</p>
        
        <form onSubmit={calculateEstimate}>
          <div className="form-group">
            <label className="form-label" htmlFor="address">Property Address / Zone</label>
            <input
              className="form-control"
              type="text"
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g., Sector 7G, Neo-London"
              required
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="bedrooms">Bedrooms</label>
              <select
                className="form-control"
                id="bedrooms"
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
                required
              >
                <option value="">Select Units</option>
                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                <option value="6+">6+</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label" htmlFor="bathrooms">Bathrooms</label>
              <select
                className="form-control"
                id="bathrooms"
                value={bathrooms}
                onChange={(e) => setBathrooms(e.target.value)}
                required
              >
                <option value="">Select Units</option>
                {[1, 1.5, 2, 2.5, 3, 3.5].map(n => <option key={n} value={n}>{n}</option>)}
                <option value="4+">4+</option>
              </select>
            </div>
          </div>
          
          {estimateError && (
            <p className="error-message-inline">{estimateError}</p>
          )}
          
          <button
            type="submit"
            className="calculate-button"
            disabled={estimateLoading}
          >
            {estimateLoading ? (
              <><div className="loader"></div> Calculating Forecast...</>
            ) : (
              <><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z"/><path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
              </svg> Forecast Income</>
            )}
          </button>
        </form>
      </div>
    );
  };

  return (
    <div className="referrals-container">
      {/* Accent Decorations */}
      <div className="accent-circle accent-circle-1"></div>
      <div className="accent-circle accent-circle-2"></div>
      
      <div className="dashboard-header">
        <h1 className="page-title">Nexus Partnership Portal</h1>
        <p className="page-subtitle">Unlock residual income streams. Partner with Luxury Lodging and earn by referring property owners.</p>
      </div>
      
      <div className="stats-grid">
        <div className="stat-card glass-card">
          <div className="stat-label">Total Earned</div>
          <div className="stat-value">{formatMoney(totalEarnings)}</div>
          <div className="stat-subtext">Lifetime Payouts</div>
        </div>
        
        <div className="stat-card glass-card">
          <div className="stat-label">Pending Commission</div>
          <div className="stat-value">{formatMoney(pendingEarnings)}</div>
          <div className="stat-subtext">Awaiting Confirmation</div>
        </div>
        
        <div className="stat-card glass-card">
          <div className="stat-label">Active Referrals</div>
          <div className="stat-value">{referrals.filter(r => r.status === 'Active').length}</div>
          <div className="stat-subtext">Currently Generating</div>
        </div>
        
        <div className="stat-card glass-card">
          <div className="stat-label">Est. Annual Income</div>
          <div className="stat-value">{formatMoney(totalEarnings * 12)}</div>
          <div className="stat-subtext">Yearly Projection</div>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="content-wrapper">
        {/* Left Panel (Tabs & Content) */}
        <div className="main-panel glass-card">
          {/* Tab Navigation */}
          <div className="tab-navigation" data-active-tab={activeTab}>
            <button 
              className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
              </svg>
              Program Nexus
            </button>
            <button 
              className={`tab-button ${activeTab === 'share' ? 'active' : ''}`}
              onClick={() => setActiveTab('share')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3"></circle>
                <circle cx="6" cy="12" r="3"></circle>
                <circle cx="18" cy="19" r="3"></circle>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
              </svg>
              Share & Amplify
            </button>
            <button 
              className={`tab-button ${activeTab === 'activity' ? 'active' : ''}`}
              onClick={() => setActiveTab('activity')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
              </svg>
              Activity Stream
            </button>
          </div>
          
          {/* Tab Content */}
          <div className="content-section">
            {renderTabContent()}
          </div>
        </div>
        
        {/* Right Sidebar (Calculator) */}
        <div className="side-panel">
          <div className="side-panel-section glass-card">
            <h3 className="side-panel-title">
              <svg className="side-panel-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20V10M18 20V4M6 20V16"/>
              </svg>
              Income Forecaster
            </h3>
            {renderCalculator()}
          </div>
        </div>
      </div>
      
      {/* Call to Action */}
      <div className="cta-container glass-card">
        <h2 className="cta-title">Activate Your Partnership Vector</h2>
        <p className="cta-text">Generate your unique Holo-Link now and begin transmitting it to potential property partners.</p>
        <button className="cta-button" onClick={() => setActiveTab('share')}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
          </svg>
          Generate Holo-Link
        </button>
      </div>
    </div>
  );
};

export default Partnership; 