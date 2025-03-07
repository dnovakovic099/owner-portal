/**
 * Hostaway API integration service
 * Updated to use local proxy server
 */

// Configuration - Use local proxy server
const API_BASE_URL = 'http://localhost:3001/api';

/**
 * Make API request to the local proxy server
 */
const apiRequest = async (endpoint, method = 'GET', data = null) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };
  
  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(data);
  }

  console.log({ url, options })
  
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};

/**
 * Hostaway API client
 */
const hostawayApi = {
  /**
   * Get all listings/properties
   * @param {Object} params - Optional query parameters
   * @returns {Promise<Object>} Listings response
   */
  getListings: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const endpoint = `/listings${queryParams ? `?${queryParams}` : ''}`;
    return apiRequest(endpoint);
  },
  
  /**
   * Get a single listing by ID
   * @param {number} listingId - Listing ID
   * @returns {Promise<Object>} Listing data
   */
  getListingById: async (listingId) => {
    return apiRequest(`/listings/${listingId}`);
  },
  
  /**
   * Get all reservations
   * @param {Object} params - Optional query parameters
   * @returns {Promise<Object>} Reservations response
   */
  getReservations: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const endpoint = `/reservations${queryParams ? `?${queryParams}` : ''}`;
    return apiRequest(endpoint);
  },
  
  /**
   * Get confirmed reservations
   * @param {Object} params - Additional query parameters
   * @returns {Promise<Object>} Confirmed reservations
   */
  getConfirmedReservations: async (params = {}) => {
    // Add status=confirmed to the query parameters
    const queryParams = new URLSearchParams({
      ...params,
    }).toString();
    
    const endpoint = `/reservations?${queryParams}`;
    return apiRequest(endpoint);
  },
  
  /**
   * Get a single reservation by ID
   * @param {number} reservationId - Reservation ID
   * @returns {Promise<Object>} Reservation data
   */
  getReservationById: async (reservationId) => {
    return apiRequest(`/reservations/${reservationId}`);
  },
  
  /**
   * Get calendar availability for a listing
   * @param {number} listingId - Listing ID
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {Promise<Object>} Calendar data
   */
  getCalendar: async (listingId, startDate, endDate) => {
    const queryParams = new URLSearchParams({
      listingId,
      startDate,
      endDate
    }).toString();
    
    const endpoint = `/calendar?${queryParams}`;
    return apiRequest(endpoint);
  },
  
  /**
   * Initialize the API
   * Check server health
   */
  initialize: async () => {
    try {
      // Check if server is running
      const response = await fetch(`${API_BASE_URL.split('/api')[0]}/health`);
      if (!response.ok) {
        throw new Error(`Server status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Successfully connected to local proxy server');
      return true;
    } catch (error) {
      console.error('❌ Failed to connect to local proxy server:', error);
      console.log('Make sure the server is running on http://localhost:3001');
      return false;
    }
  }
};

export default hostawayApi;