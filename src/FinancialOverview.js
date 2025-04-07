import React, { useState, useEffect } from 'react';
import api from './api/api';
import './FinancialOverview.css';

export const FinancialOverview = () => {
  // State management
  const [properties, setProperties] = useState([]);
  const [listingFinancials, setListingFinancials] = useState({ columns: [], rows: [], totals: [] });
  const [lastMonthFinancials, setLastMonthFinancials] = useState({ columns: [], rows: [], totals: [] });
  const [stats, setStats] = useState([]);
  const [totalStats, setTotalStats] = useState({
    totalPayout: 5908083.51,
    totalPartnership: 1181616.70,
    propertyCount: 70,
    lastMonthPayout: 23450,
    topProperties: [
      { name: "Compound", revenue: 1183095.00 },
      { name: "Rogers", revenue: 667039.88 },
      { name: "Spring St/Danielle Dr", revenue: 421828.67 }
    ]
  });
  const [loading, setLoading] = useState(true);
  const [loadingFinancials, setLoadingFinancials] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    propertyIds: [], // Selected property IDs
    dateRange: null
  });
  // Add sorting state
  const [sortConfig, setSortConfig] = useState({
    key: 'lastMonthPayout', // Default sort by last month payout
    direction: 'desc' // Default descending order (highest first)
  });
  
  // Fetch properties on component mount
  useEffect(() => {
    fetchProperties();
  }, []);
  
  // Fetch financial data when properties are loaded
  useEffect(() => {
    if (properties.length > 0) {
      fetchListingFinancials();
      fetchLastMonthFinancials();
    } else {
      // If no properties, reset financial data and set loading to false
      setListingFinancials({ columns: [], rows: [], totals: [] });
      setLastMonthFinancials({ columns: [], rows: [], totals: [] });
      setTotalStats({
        totalPayout: 0,
        totalPartnership: 0,
        propertyCount: 0,
        lastMonthPayout: 0,
        topProperties: []
      });
      setLoadingFinancials(false);
    }
  }, [properties]);
  
  // Clear financial data when filters change
  useEffect(() => {
    // Reset financial data when filters change
    if (filters.propertyIds.length > 0 || filters.dateRange) {
      // Keep the structure but clear the rows
      setListingFinancials(prev => ({
        ...prev,
        rows: []
      }));
      setLastMonthFinancials(prev => ({
        ...prev,
        rows: []
      }));
      setStats([]);
      // Set loading to indicate that new data is being fetched
      setLoadingFinancials(true);
      
      // Fetch new data with filters
      fetchListingFinancials();
      fetchLastMonthFinancials();
    }
  }, [filters]);
  
  // Calculate stats when financial data changes
  useEffect(() => {
    if (properties.length > 0 && listingFinancials.rows.length > 0) {
      calculateStats();
    } else if (properties.length > 0 && listingFinancials.rows.length === 0) {
      // If we have properties but no financial rows, clear stats
      setStats([]);
      // Update total stats with zeros or defaults
      setTotalStats(prev => ({
        ...prev,
        totalPayout: 0,
        totalPartnership: 0,
        lastMonthPayout: 0,
        topProperties: []
      }));
      setLoadingFinancials(false);
    }
  }, [properties, listingFinancials, lastMonthFinancials]);
  
  // Function to fetch all properties
  const fetchProperties = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await api.getListings();
      setProperties(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching properties:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Setup date params for all-time - very wide date range
  const getDateParams = () => {
    // If date range filter exists, use it
    if (filters.dateRange) {
      return {
        fromDate: filters.dateRange.start,
        toDate: filters.dateRange.end
      };
    }
    
    // Otherwise use a very wide date range for "all time" data
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 10); // Go back 10 years
    
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 2); // Include future reservations
    
    return {
      fromDate: startDate.toISOString().split('T')[0],
      toDate: endDate.toISOString().split('T')[0]
    };
  };
  
  // Get last month date range
  const getLastMonthDateParams = () => {
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
    
    return {
      fromDate: lastMonth.toISOString().split('T')[0],
      toDate: lastMonthEnd.toISOString().split('T')[0]
    };
  };
  
  // Fetch listing financials data directly
  const fetchListingFinancials = async () => {
    // Skip if no properties
    if (properties.length === 0) {
      setLoadingFinancials(false);
      return;
    }
    
    setLoadingFinancials(true);
    
    try {
      // Get date range parameters
      const dateParams = getDateParams();
      
      // Create parameters for the financial report
      const financialParams = {
        // Filter by selected property IDs if filters exist, otherwise use all properties
        listingMapIds: filters.propertyIds.length > 0 
          ? filters.propertyIds 
          : properties.map(p => p.id),
        fromDate: dateParams.fromDate,
        toDate: dateParams.toDate,
        dateType: 'arrivalDate', // Filter by arrival date
        statuses: ['confirmed'] // Only confirmed reservations
      };
      
      // Call the listingFinancials endpoint
      const response = await api.getListingFinancials(financialParams);
      
      if (response.result) {
        // Store the complete result including columns, rows, and totals
        setListingFinancials({
          columns: response.result.columns || [],
          rows: response.result.rows || [],
          totals: response.result.totals || []
        });
      } else {
        console.warn("No result data in listing financials response");
        setListingFinancials({ columns: [], rows: [], totals: [] });
      }
    } catch (err) {
      console.error("Error fetching listing financials:", err);
      // Don't set error state as it's supplementary data
      // But clear rows to ensure old data isn't displayed
      setListingFinancials(prev => ({
        ...prev,
        rows: []
      }));
    } finally {
      setLoadingFinancials(false);
    }
  };
  
  // Fetch last month financials data
  const fetchLastMonthFinancials = async () => {
    // Skip if no properties
    if (properties.length === 0) {
      return;
    }
    
    try {
      // Get last month date range parameters
      const lastMonthParams = getLastMonthDateParams();
      
      // Create parameters for the financial report
      const financialParams = {
        // Filter by selected property IDs if filters exist, otherwise use all properties
        listingMapIds: filters.propertyIds.length > 0 
          ? filters.propertyIds 
          : properties.map(p => p.id),
        fromDate: lastMonthParams.fromDate,
        toDate: lastMonthParams.toDate,
        dateType: 'arrivalDate', // Filter by arrival date
        statuses: ['confirmed'] // Only confirmed reservations
      };
      
      // Call the reports endpoint for last month data
      const response = await api.getListingFinancials(financialParams);
      
      if (response.result) {
        // Store the complete result including columns, rows, and totals
        setLastMonthFinancials({
          columns: response.result.columns || [],
          rows: response.result.rows || [],
          totals: response.result.totals || []
        });
      } else {
        console.warn("No result data in last month financials response");
        setLastMonthFinancials({ columns: [], rows: [], totals: [] });
      }
    } catch (err) {
      console.error("Error fetching last month financials:", err);
      // Clear rows to ensure old data isn't displayed
      setLastMonthFinancials(prev => ({
        ...prev,
        rows: []
      }));
    }
  };
  
  // Calculate stats directly from the listing financials data
  const calculateStats = () => { 
    // If no rows, clear stats and return
    if (listingFinancials.rows.length === 0) {
      setStats([]);
      return;
    }
    
    // Find column indexes for the data we need
    const columns = listingFinancials.columns;
    const getColumnIndex = (name) => columns.findIndex(col => col.name === name);
    
    const listingNameIndex = getColumnIndex('listingName');
    const ownerPayoutIndex = getColumnIndex('ownerPayout');
    
    // Get last month data indices if available
    const lastMonthColumns = lastMonthFinancials.columns;
    const getLastMonthColumnIndex = (name) => lastMonthColumns.findIndex(col => col.name === name);
    const lastMonthPayoutIndex = getLastMonthColumnIndex('ownerPayout');
    
    // Create property stats from the financial data
    const propertyStats = listingFinancials.rows.map((row, rowIndex) => {
      // Extract property name from the listing name
      const listingNameRaw = row[listingNameIndex] || '';
      
      // Extract the actual name, removing the ID prefix if present
      const listingNameMatch = listingNameRaw.match(/^\([\d]+\)\s+(.*)/);
      const listingName = listingNameMatch ? listingNameMatch[1].trim() : listingNameRaw;
      
      // Extract property ID from the listing name if present
      const listingIdMatch = listingNameRaw.match(/^\((\d+)\)/);
      const listingId = listingIdMatch ? listingIdMatch[1] : null;
      
      // Get the ownerPayout directly from the financial data
      const ownerPayout = parseFloat(row[ownerPayoutIndex]) || 0;
      
      // Find the property from our properties list that matches this listing
      const matchingProperty = properties.find(p => {
        // Try to match by name or ID
        return (p.internalListingName && p.internalListingName.toLowerCase() === listingName.toLowerCase()) || 
               String(p.id) === listingId || 
               listingNameRaw.includes(String(p.id)) || 
               (p.name && listingNameRaw.toLowerCase().includes(p.name.toLowerCase()));
      });
      
      // Get bedrooms and bathrooms from matching property
      const bedrooms = matchingProperty?.bedroomsNumber || 0;
      const bathrooms = matchingProperty?.bathroomsNumber || 0;
      
      // Find last month data for this property
      let lastMonthPayout = 0;
      if (lastMonthPayoutIndex >= 0) {
        const lastMonthPropertyRow = lastMonthFinancials.rows.find(lmRow => {
          const lmNameRaw = lmRow[getLastMonthColumnIndex('listingName')] || '';
          return lmNameRaw === listingNameRaw;
        });
        
        if (lastMonthPropertyRow) {
          lastMonthPayout = parseFloat(lastMonthPropertyRow[lastMonthPayoutIndex]) || 0;
        }
      }
      
      return {
        id: matchingProperty?.id || listingId || `row-${rowIndex}`,
        name: listingName,
        address: matchingProperty?.address,
        bedrooms,
        bathrooms,
        ownerPayout,
        lastMonthPayout
      };
    });
    
    setStats(propertyStats);
    
    // Calculate total payout and estimated partnership income (20% of total payout)
    if (propertyStats.length > 0) {
      const totalPayout = propertyStats.reduce((acc, curr) => acc + curr.ownerPayout, 0);
      const totalPartnership = totalPayout * 0.2; // Estimate partnership at 20% of total payout
      
      // Calculate total last month payout if we have last month data
      let lastMonthPayout = 0;
      if (lastMonthFinancials.totals.length > 0 && lastMonthPayoutIndex >= 0) {
        lastMonthPayout = parseFloat(lastMonthFinancials.totals[lastMonthPayoutIndex]) || 0;
      } else {
        // Fallback to the sum of lastMonthPayout from propertyStats
        lastMonthPayout = propertyStats.reduce((acc, curr) => acc + curr.lastMonthPayout, 0);
      }
      
      // Sort properties by payout for top performers
      const sortedProperties = [...propertyStats].sort((a, b) => b.ownerPayout - a.ownerPayout);
      const topProperties = sortedProperties.slice(0, 3).map(p => ({
        name: p.name,
        revenue: p.ownerPayout
      }));
      
      setTotalStats({ 
        totalPayout: totalPayout || 0,
        totalPartnership: totalPartnership || 0,
        propertyCount: propertyStats.length,
        lastMonthPayout: lastMonthPayout || 0,
        topProperties: topProperties.length > 0 ? topProperties : []
      });
    } else {
      // No properties matched, reset stats
      setTotalStats({
        totalPayout: 0,
        totalPartnership: 0,
        propertyCount: 0,
        lastMonthPayout: 0,
        topProperties: []
      });
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

  // Format currency without the dollar sign
  const formatCurrencyValue = (amount) => {
    return formatCurrency(amount).substring(1);
  };

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };
  
  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    // Reset to first page when filters change
    setCurrentPage(1);
  };

  // Sort the property data
  const sortedProperties = React.useMemo(() => {
    let sortableProperties = [...stats];
    if (sortConfig.key) {
      sortableProperties.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableProperties;
  }, [stats, sortConfig]);

  // Request a sort
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Get sort direction class
  const getSortDirectionClass = (key) => {
    if (sortConfig.key !== key) return 'sortable';
    return sortConfig.direction === 'asc' ? 'sort-asc' : 'sort-desc';
  };

  // Calculate pagination values
  const totalPages = Math.ceil(sortedProperties.length / itemsPerPage);
  const indexOfLastProperty = currentPage * itemsPerPage;
  const indexOfFirstProperty = indexOfLastProperty - itemsPerPage;
  const currentProperties = sortedProperties.slice(indexOfFirstProperty, indexOfLastProperty);

  // Generate page numbers for pagination
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  // Card components with updated designs
  const MetricCard = ({ title, value, lastMonth, isGold }) => (
    <div className={`metric-card ${isGold ? 'gold' : 'primary'}`}>
      <div className="metric-content">
        {!isGold ? (
          <div className="payout-wrapper">
            <div className="metric-header">
              <span className="metric-label">{title}</span>
            </div>
            <div className="metric-amount-container">
              <div className="metric-amount">
                <div className="amount-label">Total</div>
                <div className="amount-value">
                  ${formatCurrencyValue(value)}
                </div>
              </div>
              <div className="metric-amount last-month">
                <div className="amount-label">Last Month</div>
                <div className="amount-value">
                  ${formatCurrencyValue(lastMonth)}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="partnership-wrapper">
            <div className="metric-header">
              <span className="metric-label">{title}</span>
            </div>
            <div className="metric-amount-container">
              <div className="metric-amount">
                <div className="amount-label">Total Revenue</div>
                <div className="amount-value gold-value">
                  ${formatCurrencyValue(value)}
                </div>
              </div>
            </div>
            <div className="metrics-additional">
              <div className="metric-additional-item">
                <div className="icon-container">
                  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </div>
                <div className="metric-additional-content">
                  <div className="metric-additional-label">Commission Rate</div>
                  <div className="metric-additional-value">20%</div>
                </div>
              </div>
              <div className="metric-additional-item">
                <div className="icon-container">
                  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                  </svg>
                </div>
                <div className="metric-additional-content">
                  <div className="metric-additional-label">Avg. Per Property</div>
                  <div className="metric-additional-value">
                    ${formatCurrencyValue(totalStats.propertyCount > 0 ? value / totalStats.propertyCount : 0)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Top Properties Card with updated design
  const TopPropertiesCard = ({ properties }) => (
    <div className="metric-card data-card">
      <div className="metric-content">
        <div className="metric-header">
          <span className="metric-label">Top Performing Properties</span>
        </div>
        {properties.length > 0 ? (
          <div className="top-properties">
            {properties.map((property, index) => (
              <div className="top-property" key={index}>
                <div className="property-rank">{index + 1}</div>
                <div className="property-info">
                  <div className="property-name-small">{property.name}</div>
                  <div className="property-revenue">${formatCurrencyValue(property.revenue)}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-properties">
            <p>No properties data available</p>
          </div>
        )}
      </div>
    </div>
  );

  // Main render
  return (
    <div className="financial-overview">
      <div className="page-header">
        <h1 className="page-title">Financial Overview</h1>
        <div className="stats-chips">
          <div className="stats-chip">
            <div className="stats-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            </div>
            <div className="stats-info">
              <span className="stats-label">Properties</span>
              <span className="stats-value">{totalStats.propertyCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading financial data...</p>
        </div>
      )}
      
      {/* Financial data loading state */}
      {!loading && loadingFinancials && (
        <div className="loading-container financial-loading">
          <div className="spinner"></div>
          <p>Loading accurate financial data...</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="error-container">
          <p>Error loading data: {error.message}</p>
          <button onClick={fetchProperties} className="retry-button">Retry</button>
        </div>
      )}

      {/* Financial Dashboard */}
      {!loading && !loadingFinancials && !error && (
        <div className="financial-dashboard">
          {/* Key Metrics */}
          <div className="metrics-grid">
            <MetricCard 
              title="Total Owner Payout" 
              value={totalStats.totalPayout} 
              lastMonth={totalStats.lastMonthPayout} 
              isGold={false}
            />
            
            <TopPropertiesCard properties={totalStats.topProperties} />
            
            <MetricCard 
              title="Total Partnership Income" 
              value={totalStats.totalPartnership} 
              isGold={true}
            />
          </div>

          {/* Property Performance */}
          <div className="property-section">
            <div className="section-header">
              <h2 className="section-title">Property Performance</h2>
            </div>
            
            {stats.length === 0 ? (
              <div className="no-data">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <p>No properties or financial data available for the selected filters.</p>
                {filters.propertyIds.length > 0 && (
                  <button 
                    className="reset-filters-button"
                    onClick={() => setFilters({ propertyIds: [], dateRange: null })}
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="pagination-controls">
                  <div className="items-per-page">
                    <label htmlFor="items-per-page">Show</label>
                    <select 
                      id="items-per-page" 
                      value={itemsPerPage} 
                      onChange={handleItemsPerPageChange}
                      className="items-per-page-select"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={stats.length}>All</option>
                    </select>
                    <span>entries</span>
                  </div>
                  <div className="showing-entries">
                    Showing {indexOfFirstProperty + 1} to {Math.min(indexOfLastProperty, stats.length)} of {stats.length} properties
                  </div>
                </div>

                <div className="table-container">
                  <table className="data-table modern">
                    <thead>
                      <tr>
                        <th onClick={() => requestSort('name')} className={getSortDirectionClass('name')}>
                          Property
                          <span className="sort-icon"></span>
                        </th>
                        <th onClick={() => requestSort('bedrooms')} className={getSortDirectionClass('bedrooms')}>
                          Bedrooms
                          <span className="sort-icon"></span>
                        </th>
                        <th onClick={() => requestSort('bathrooms')} className={getSortDirectionClass('bathrooms')}>
                          Bathrooms
                          <span className="sort-icon"></span>
                        </th>
                        <th onClick={() => requestSort('lastMonthPayout')} className={getSortDirectionClass('lastMonthPayout')}>
                          Last Month Payout
                          <span className="sort-icon"></span>
                        </th>
                        <th onClick={() => requestSort('ownerPayout')} className={getSortDirectionClass('ownerPayout')}>
                          Owner Payout
                          <span className="sort-icon"></span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentProperties.map((property) => (
                        <tr key={property.id}>
                          <td>
                            <div className="property-cell">
                              <div className="property-name">{property.name}</div>
                              {property.address && <div className="property-address">{property.address}</div>}
                            </div>
                          </td>
                          <td className="bedrooms-cell">{property.bedrooms}</td>
                          <td className="bathrooms-cell">{property.bathrooms}</td>
                          <td className="payout-cell">{formatCurrency(property.lastMonthPayout)}</td>
                          <td className="payout-cell">{formatCurrency(property.ownerPayout)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="pagination">
                    <button 
                      className="pagination-button" 
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6"></polyline>
                      </svg>
                    </button>
                    
                    {pageNumbers.map(number => (
                      <button
                        key={number}
                        onClick={() => handlePageChange(number)}
                        className={`pagination-button ${currentPage === number ? 'active' : ''}`}
                      >
                        {number}
                      </button>
                    ))}
                    
                    <button 
                      className="pagination-button" 
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialOverview;