/**
 * Simplified API client for Hostaway API
 */

import auth from './auth';

// API base URL - using local proxy server
const API_BASE_URL = process.env.REACT_APP_API_URL;

/**
 * Generic API request function
 * @param {string} endpoint - API endpoint path
 * @param {Object} queryParams - Optional query parameters
 * @returns {Promise} - Promise resolving to API response data
 */
const apiRequest = async (endpoint, queryParams = {}) => {
  try {
    // Add timestamp to prevent caching
    queryParams._t = Date.now();
    
    // Build query string from params
    const queryString = new URLSearchParams(queryParams).toString();
    
    const url = `${API_BASE_URL}${endpoint}?${queryString}`;
    
    const response = await fetch(url, {
      headers: auth.getAuthHeaders()
    });
    
    // Handle 401 Unauthorized
    if (response.status === 401) {
      auth.logout();
      throw new Error('Your session has expired. Please login again.');
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API request error for ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Generic POST API request function
 * @param {string} endpoint - API endpoint path
 * @param {Object} data - Request body data
 * @returns {Promise} - Promise resolving to API response data
 */
const apiPostRequest = async (endpoint, data = {}) => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...auth.getAuthHeaders(),
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    // Handle 401 Unauthorized
    if (response.status === 401) {
      auth.logout();
      throw new Error('Your session has expired. Please login again.');
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API POST request error for ${endpoint}:`, error);
    throw error;
  }
};

/**
 * API service with methods for different endpoints
 */
const api = {
  /**
   * Login with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Login response
   */
  login: (email, password) => auth.login(email, password),
  
  /**
   * Check if the user is authenticated
   * @returns {boolean} Whether the user is authenticated
   */
  isAuthenticated: () => auth.isAuthenticated(),
  
  /**
   * Logout the user
   */
  logout: () => auth.logout(),
  
  /**
   * Get the current user
   * @returns {Object|null} Current user or null
   */
  getCurrentUser: () => auth.getCurrentUser(),
  
  /**
   * Check API health
   * @returns {Promise<Object>} Health check response
   */
  checkHealth: async () => {
    try {
      console.log(API_BASE_URL + 'check');
      
      const response = await fetch(`${API_BASE_URL.split('/api')[0]}/health?_t=${Date.now()}`);
      if (!response.ok) {
        throw new Error(`Server status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Health check error:', error);
      throw error;
    }
  },
  
  /**
   * Get all listings/properties
   * @param {Object} params - Optional query parameters
   * @returns {Promise<Array>} Properties array
   */
  getListings: async (params = {}) => {
    try {
      const response = await apiRequest('/listings', params);
      
      // Handle different possible response structures
      if (response.result?.listings) {
        return response.result.listings;
      } else if (Array.isArray(response.result)) {
        return response.result;
      } else if (Array.isArray(response)) {
        return response;
      } else {
        console.warn('Unexpected listings response structure:', response);
        return [];
      }
    } catch (error) {
      console.error('Failed to fetch listings:', error);
      return []; // Return empty array instead of throwing
    }
  },
  
  /**
   * Get a single listing by ID
   * @param {string|number} id - Listing ID
   * @returns {Promise<Object>} Listing data
   */
  getListingById: async (id) => {
    try {
      const response = await apiRequest(`/listings/${id}`);
      return response.result || null;
    } catch (error) {
      console.error(`Failed to fetch listing ${id}:`, error);
      return null;
    }
  },
  
  /**
   * Get reservations - Fixed version that handles all response structures
   * @param {Object} params - Query parameters
   * @param {boolean} confirmedOnly - Whether to get only confirmed reservations
   * @returns {Promise<Object>} Reservations data with metadata
   */
  getReservations: async (params = {}, confirmedOnly = true) => {
    try {
      // Add status=confirmed for confirmed-only queries
      const queryParams = confirmedOnly ? { ...params, status: 'confirmed' } : params;
      
      const response = await apiRequest('/reservations', queryParams);
      
      // Handle various possible response structures
      let reservations = [];
      let meta = { 
        total: 0, 
        limit: params.limit || 10, 
        offset: params.offset || 0, 
        hasMore: false 
      };
      
      if (response.result?.reservations) {
        // Standard nested structure
        reservations = response.result.reservations;
        meta = response.result.meta || meta;
      } else if (Array.isArray(response.result)) {
        // Array in result property
        reservations = response.result;
        meta.total = response.count || reservations.length;
        meta.limit = response.limit || 10;
        meta.offset = response.offset || 0;
        meta.hasMore = (reservations.length < meta.total);
      } else if (Array.isArray(response)) {
        // Direct array response
        reservations = response;
        meta.total = reservations.length;
      }
      
      // Always return in the expected format
      return { reservations, meta };
    } catch (error) {
      console.error('Error fetching reservations:', error);
      // Return empty results instead of throwing
      return { 
        reservations: [], 
        meta: { 
          total: 0, 
          limit: params.limit || 10, 
          offset: params.offset || 0, 
          hasMore: false 
        } 
      };
    }
  },
  
  /**
   * Get a single reservation by ID
   * @param {string|number} id - Reservation ID
   * @returns {Promise<Object>} Reservation data
   */
  getReservationById: async (id) => {
    try {
      const response = await apiRequest(`/reservations/${id}`);
      return response.result || null;
    } catch (error) {
      console.error(`Failed to fetch reservation ${id}:`, error);
      return null;
    }
  },
  
  /**
   * Get calendar data for a property
   * @param {string|number} listingId - Listing ID
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {Promise<Array>} Calendar data
   */
  getCalendar: async (listingId, startDate, endDate) => {
    try {
      const response = await apiRequest('/calendar', { listingId, startDate, endDate });
      return response.result?.calendar || [];
    } catch (error) {
      console.error('Failed to fetch calendar data:', error);
      return [];
    }
  },

  /**
   * Get consolidated financial report with proper form encoding
   * @param {Object} params - Query parameters
   * @param {Array} params.listingMapIds - Array of listing IDs to filter by
   * @param {string} params.fromDate - Start date in YYYY-MM-DD format
   * @param {string} params.toDate - End date in YYYY-MM-DD format
   * @param {string} params.dateType - Type of date to filter by (arrivalDate, departureDate, etc.)
   * @returns {Promise<Object>} Financial report data
   */
  getFinancialReport: async (params = {}) => {
    try {
      console.log("Calling consolidated financial report endpoint with params:", params);
      const response = await fetch(`${API_BASE_URL}/finance/report/consolidated`, {
        method: 'POST',
        headers: {
          ...auth.getAuthHeaders(),
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(params)
      });
      
      // Handle 401 Unauthorized
      if (response.status === 401) {
        auth.logout();
        throw new Error('Your session has expired. Please login again.');
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching financial report:', error);
      // Return empty results instead of throwing
      return { 
        result: {
          rows: [],
          columns: [] 
        }
      };
    }
  },

  /**
   * Get listing financials report with property-level stats
   * @param {Object} params - Query parameters
   * @param {Array|string} params.listingMapIds - Array of listing IDs to filter by
   * @param {string} params.fromDate - Start date in YYYY-MM-DD format
   * @param {string} params.toDate - End date in YYYY-MM-DD format
   * @param {string} params.dateType - Type of date to filter by (arrivalDate, departureDate, etc.)
   * @returns {Promise<Object>} Financial report data
   */
  getListingFinancials: async (params = {}) => {
    try {
      console.log("Calling listing financials endpoint with params:", params);
      
      // Use POST request to the listing financials endpoint
      const response = await fetch(`${API_BASE_URL}/finance/report/listingFinancials`, {
        method: 'POST',
        headers: {
          ...auth.getAuthHeaders(),
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(params)
      });
      
      // Handle 401 Unauthorized
      if (response.status === 401) {
        auth.logout();
        throw new Error('Your session has expired. Please login again.');
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Received listing financials data:", data);
      return data;
    } catch (error) {
      console.error('Error fetching listing financials report:', error);
      // Return empty results instead of throwing
      return { 
        result: {
          rows: [],
          columns: [] 
        }
      };
    }
  },

  /**
   * Get income estimates for properties
   * @param {Object} params - Query parameters
   * @param {string} params.address - Property street address
   * @param {string} params.city - Property city
   * @param {string} params.state - Property state
   * @param {string} params.zipCode - Property ZIP code
   * @param {number} params.bedrooms - Number of bedrooms
   * @param {number} params.bathrooms - Number of bathrooms
   * @returns {Promise<Object>} Income estimate data
   */
  getIncomeEstimate: async (params = {}) => {
    try {
      console.log("Fetching income estimate with params:", params);
      
      // Build query parameters for GET request
      const queryParams = new URLSearchParams({
        address: params.address || '',
        city: params.city || '',
        state: params.state || '',
        zipCode: params.zipCode || '',
        bedrooms: Number(params.bedrooms) || 1,
        bathrooms: Number(params.bathrooms) || 1,
        _t: Date.now() // Add timestamp to prevent caching
      }).toString();
      
      // Use GET request with query parameters
      const response = await fetch(`${API_BASE_URL}/income-estimate?${queryParams}`, {
        method: 'GET',
        headers: auth.getAuthHeaders()
      });

      console.log({response});
      
      // Handle 401 Unauthorized
      if (response.status === 401) {
        auth.logout();
        throw new Error('Your session has expired. Please login again.');
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
      }
      
      const data = await response.json();

      console.log({data});
      
      // If the server is unavailable, return mock data for demo purposes
      if (!data || (Object.keys(data).length === 0)) {
        console.warn("No data received from server, using mock data");
        return getMockIncomeEstimate(params);
      }
      
      // Handle different possible response structures
      if (data.result) {
        return data.result;
      } else {
        return data;
      }
    } catch (error) {
      console.error('Failed to fetch income estimate:', error);
      
      // For demo purposes, return mock data if the server fails
      console.log("Returning mock data due to API error");
      return getMockIncomeEstimate(params);
    }
  }
};

/**
 * Generate mock income estimate data for demo purposes
 * This function is used when the server is unavailable
 * @param {Object} params - Property parameters
 * @returns {Object} Mock income estimate data
 */
const getMockIncomeEstimate = (params) => {
  // Base values that scale with bedrooms/bathrooms
  const baseAnnual = 24000;
  const bedroomValue = 12000;
  const bathroomValue = 6000;
  
  // Calculate estimated values based on property details
  const bedrooms = Number(params.bedrooms) || 1;
  const bathrooms = Number(params.bathrooms) || 1;
  
  // Apply multipliers based on location (simple demo logic)
  let locationMultiplier = 1.0;
  if (params.state) {
    const state = params.state.toUpperCase();
    if (['CA', 'NY', 'FL', 'HI'].includes(state)) {
      locationMultiplier = 1.5;
    } else if (['TX', 'TN', 'AZ', 'NC'].includes(state)) {
      locationMultiplier = 1.2;
    }
  }
  
  // Calculate annual estimate
  const annualEstimate = Math.round((baseAnnual + (bedroomValue * bedrooms) + (bathroomValue * bathrooms)) * locationMultiplier);
  
  // Calculate monthly average
  const monthlyAverage = Math.round(annualEstimate / 12);
  
  // Generate monthly breakdown with seasonal variation
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const seasonalFactors = {
    // Summer peak for most locations
    'January': 0.7, 'February': 0.8, 'March': 0.9, 'April': 1.0,
    'May': 1.1, 'June': 1.3, 'July': 1.5, 'August': 1.4,
    'September': 1.1, 'October': 0.9, 'November': 0.7, 'December': 0.8
  };
  
  // Create monthly breakdown
  const monthlyBreakdown = months.map(month => {
    const factor = seasonalFactors[month];
    const estimate = Math.round(monthlyAverage * factor);
    
    return {
      name: month,
      estimate: estimate,
      occupancyRate: Math.min(95, Math.round(factor * 70)) // Occupancy rate between 40-95%
    };
  });
  
  return {
    annualEstimate,
    monthlyAverage,
    monthlyBreakdown,
    propertyDetails: {
      address: params.address,
      city: params.city,
      state: params.state,
      zipCode: params.zipCode,
      bedrooms,
      bathrooms
    }
  };
};

export default api;