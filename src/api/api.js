/**
 * Simplified API client for Hostaway API
 */

// API base URL - using local proxy server
const API_BASE_URL = 'http://localhost:3001/api';

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
    
    const response = await fetch(url);
    
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
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
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
   * Check API health
   * @returns {Promise<Object>} Health check response
   */
  checkHealth: async () => {
    try {
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
    // Create a proper form-encoded request
    // In the browser environment, we'll use URLSearchParams to create form data
    // but still send it as JSON since our proxy server will handle the conversion
    
    // We'll send the parameters as-is to our proxy server
    // The server will convert them to the proper form-encoded format
    const response = await fetch(`${API_BASE_URL}/finance/report/consolidated`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(params)
    });
    
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
}}

export default api;