/**
 * React hooks for using Hostaway API
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import hostawayApi from './hostawayApi';

/**
 * Hook for fetching listings from Hostaway API
 * @param {Object} initialParams - Initial query parameters
 * @param {boolean} immediate - Whether to fetch immediately
 * @returns {Object} Listings data, loading state, error, and refresh function
 */
export const useListings = (initialParams = {}, immediate = true) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);
  const [params, setParams] = useState(initialParams);
  const isMounted = useRef(true);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  const fetchListings = useCallback(async (queryParams = params) => {
    if (!isMounted.current) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await hostawayApi.getListings(queryParams);
      if (isMounted.current) {
        // Extract listings array from the response
        const listings = response?.result?.listings || [];
        setData(listings);
      }
      return response;
    } catch (err) {
      if (isMounted.current) {
        setError(err);
      }
      console.error('Error fetching listings:', err.message);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [params]);
  
  // Fetch on mount or when params change
  useEffect(() => {
    if (immediate) {
      fetchListings();
    }
  }, [immediate, fetchListings]);
  
  // Update params and optionally refetch
  const updateParams = useCallback((newParams, refetch = true) => {
    setParams(prev => {
      const updatedParams = { ...prev, ...newParams };
      
      if (refetch && isMounted.current) {
        fetchListings(updatedParams);
      }
      
      return updatedParams;
    });
  }, [fetchListings]);
  
  return {
    data,
    meta: {
      total: 0, // Add proper meta handling if needed
      limit: 10,
      offset: 0
    },
    loading,
    error,
    fetchListings,
    updateParams
  };
};

/**
 * Hook for fetching a single listing by ID
 * @param {number} listingId - Listing ID
 * @param {boolean} immediate - Whether to fetch immediately
 * @returns {Object} Listing data, loading state, error, and refresh function
 */
export const useListing = (listingId, immediate = true) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  const fetchListing = useCallback(async (id = listingId) => {
    if (!id || !isMounted.current) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await hostawayApi.getListingById(id);
      if (isMounted.current) {
        setData(response?.result || null);
      }
      return response;
    } catch (err) {
      if (isMounted.current) {
        setError(err);
      }
      console.error('Error fetching listing:', err.message);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [listingId]);
  
  // Fetch on mount or when listingId changes
  useEffect(() => {
    if (immediate && listingId) {
      fetchListing();
    }
  }, [immediate, listingId, fetchListing]);
  
  return {
    data,
    loading,
    error,
    fetchListing
  };
};

/**
 * Hook for fetching reservations from Hostaway API
 * @param {boolean} confirmedOnly - Whether to fetch only confirmed reservations
 * @param {Object} initialParams - Initial query parameters
 * @param {boolean} immediate - Whether to fetch immediately
 * @returns {Object} Reservations data, loading state, error, and functions
 */
export const useReservations = (confirmedOnly = true, initialParams = {}, immediate = true) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);
  const [params, setParams] = useState(initialParams);
  const [meta, setMeta] = useState({
    total: 0,
    limit: 10,
    offset: 0,
    hasMore: false
  });
  const isMounted = useRef(true);
  const fetchAttempts = useRef(0);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  const fetchReservations = useCallback(async (queryParams = params) => {
    if (!isMounted.current) return;
    if (fetchAttempts.current > 2) {
      console.warn('Excessive fetch attempts, limiting API calls');
      setLoading(false);
      return;
    }
    
    fetchAttempts.current += 1;
    setLoading(true);
    setError(null);
    
    try {
      let response;
      if (confirmedOnly) {
        response = await hostawayApi.getConfirmedReservations(queryParams);
      } else {
        response = await hostawayApi.getReservations(queryParams);
      }
      
      if (isMounted.current) {
        // Extract reservations array and meta from the response
        const reservations = response?.result?.reservations || [];
        setData(reservations);
        
        // Extract and set meta information
        const responseMeta = response?.result?.meta || {};
        setMeta({
          total: responseMeta.total || 0,
          limit: responseMeta.limit || 10,
          offset: responseMeta.offset || 0,
          hasMore: responseMeta.hasMore || false
        });
      }
      
      // Reset fetch attempts counter after successful fetch
      fetchAttempts.current = 0;
      return response;
    } catch (err) {
      if (isMounted.current) {
        setError(err);
      }
      console.error('Error fetching reservations:', err.message);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [params, confirmedOnly]);
  
  // Fetch on mount or when params change
  useEffect(() => {
    if (immediate) {
      fetchReservations();
    }
    
    // We're using a dependency on a stringified version of params to avoid re-fetching
    // when params object identity changes but the actual values are the same
  }, [immediate, fetchReservations, confirmedOnly]);
  
  // Update params and optionally refetch
  const updateParams = useCallback((newParams, refetch = true) => {
    setParams(prev => {
      const updatedParams = { ...prev, ...newParams };
      
      if (refetch && isMounted.current) {
        // Reset fetch attempts when deliberately updating params
        fetchAttempts.current = 0;
        fetchReservations(updatedParams);
      }
      
      return updatedParams;
    });
  }, [fetchReservations]);
  
  // Pagination helpers
  const nextPage = useCallback(() => {
    if (!meta.hasMore) return;
    
    const currentOffset = meta.offset || 0;
    const limit = meta.limit || 10;
    updateParams({ offset: currentOffset + limit });
  }, [meta, updateParams]);
  
  const prevPage = useCallback(() => {
    const currentOffset = meta.offset || 0;
    const limit = meta.limit || 10;
    const newOffset = Math.max(0, currentOffset - limit);
    
    if (newOffset === currentOffset) return;
    
    updateParams({ offset: newOffset });
  }, [meta, updateParams]);
  
  return {
    data,
    meta,
    loading,
    error,
    fetchReservations,
    updateParams,
    nextPage,
    prevPage
  };
};

/**
 * Hook for fetching a single reservation by ID
 * @param {number} reservationId - Reservation ID
 * @param {boolean} immediate - Whether to fetch immediately
 * @returns {Object} Reservation data, loading state, error, and refresh function
 */
export const useReservation = (reservationId, immediate = true) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  const fetchReservation = useCallback(async (id = reservationId) => {
    if (!id || !isMounted.current) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await hostawayApi.getReservationById(id);
      if (isMounted.current) {
        setData(response?.result || null);
      }
      return response;
    } catch (err) {
      if (isMounted.current) {
        setError(err);
      }
      console.error('Error fetching reservation:', err.message);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [reservationId]);
  
  // Fetch on mount or when reservationId changes
  useEffect(() => {
    if (immediate && reservationId) {
      fetchReservation();
    }
  }, [immediate, reservationId, fetchReservation]);
  
  return {
    data,
    loading,
    error,
    fetchReservation
  };
};

/**
 * Hook for fetching calendar availability
 * @param {number} listingId - Listing ID
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @param {boolean} immediate - Whether to fetch immediately
 * @returns {Object} Calendar data, loading state, error, and refresh function
 */
export const useCalendar = (listingId, startDate, endDate, immediate = true) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  const fetchCalendar = useCallback(async (
    id = listingId,
    start = startDate,
    end = endDate
  ) => {
    if (!id || !start || !end || !isMounted.current) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await hostawayApi.getCalendar(id, start, end);
      if (isMounted.current) {
        // Extract calendar array from the response
        const calendar = response?.result?.calendar || [];
        setData(calendar);
      }
      return response;
    } catch (err) {
      if (isMounted.current) {
        setError(err);
      }
      console.error('Error fetching calendar:', err.message);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [listingId, startDate, endDate]);
  
  // Fetch on mount or when params change
  useEffect(() => {
    if (immediate && listingId && startDate && endDate) {
      fetchCalendar();
    }
  }, [immediate, listingId, startDate, endDate, fetchCalendar]);
  
  return {
    data,
    loading,
    error,
    fetchCalendar
  };
};

/**
 * Hook for initializing the Hostaway API and checking auth status
 * @returns {Object} Initialization status
 */
export const useHostawayInit = () => {
  const [initialized, setInitialized] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState(null);
  const initAttempted = useRef(false);
  
  useEffect(() => {
    const initApi = async () => {
      if (initAttempted.current) return;
      
      initAttempted.current = true;
      setInitializing(true);
      
      try {
        const success = await hostawayApi.initialize();
        setInitialized(success);
        if (!success) {
          setError(new Error('Could not connect to API server'));
        }
      } catch (err) {
        setError(err);
        setInitialized(false);
      } finally {
        setInitializing(false);
      }
    };
    
    initApi();
  }, []);
  
  return { initialized, initializing, error };
};

export default {
  useListings,
  useListing,
  useReservations,
  useReservation,
  useCalendar,
  useHostawayInit
};