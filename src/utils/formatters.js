/**
 * Utility functions for formatting data
 */

/**
 * Format currency to USD
 * @param {number} amount - The amount to format
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};

/**
 * Format date to a readable format
 * @param {string|Date} dateString - Date to format
 * @param {Object} options - Format options for toLocaleDateString
 * @returns {string} - Formatted date string
 */
export const formatDate = (dateString, options = { year: 'numeric', month: 'short', day: 'numeric' }) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', options);
};

/**
 * Calculate nights between two dates
 * @param {string|Date} checkIn - Check-in date
 * @param {string|Date} checkOut - Check-out date
 * @returns {number} - Number of nights
 */
export const calculateNights = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0;
  
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Format a month and year
 * @param {Date} date - Date to format
 * @returns {string} - Formatted month and year
 */
export const formatMonthYear = (date) => {
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

/**
 * Calculate date range parameters based on period selection
 * @param {string} period - Period selection ('lastMonth', 'lastQuarter', 'lastYear', 'allTime')
 * @returns {Object} - Object with formatted date strings
 */
export const getDateParamsForPeriod = (period) => {
  const now = new Date();
  let startDate, endDate;
  
  if (period === 'lastMonth') {
    // Last month
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    startDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
    endDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);
  } else if (period === 'lastQuarter') {
    // Last quarter
    const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
    startDate = new Date(now.getFullYear(), quarterMonth - 3, 1);
    endDate = new Date(now.getFullYear(), quarterMonth, 0);
  } else if (period === 'lastYear') {
    // Last year
    startDate = new Date(now.getFullYear() - 1, 0, 1);
    endDate = new Date(now.getFullYear() - 1, 11, 31);
  } else {
    // All time - use last 2 years as a practical limit
    startDate = new Date(now.getFullYear() - 2, 0, 1);
    endDate = new Date();
  }
  
  return {
    checkInDateFrom: startDate.toISOString().split('T')[0],
    checkOutDateTo: endDate.toISOString().split('T')[0]
  };
};

/**
 * Calculate total number of days in a given period
 * @param {string} period - Period selection ('lastMonth', 'lastQuarter', 'lastYear', 'allTime')
 * @returns {number} - Total days in period
 */
export const calculateTotalDaysInPeriod = (period) => {
  const now = new Date();
  let days = 0;
  
  if (period === 'lastMonth') {
    // Get days in last month
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    days = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0).getDate();
  } else if (period === 'lastQuarter') {
    days = 90; // Approximate
  } else if (period === 'lastYear') {
    days = 365;
  } else {
    // All time - use 365 days as a standard metric
    days = 365;
  }
  
  return days;
};