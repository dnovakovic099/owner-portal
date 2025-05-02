/**
 * Authentication API functions
 */

// API base URL - using local proxy server
const API_BASE_URL = process.env.REACT_APP_API_URL;
/**
 * Get the stored auth token
 * @returns {string|null} The stored auth token or null if not found
 */
export const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

/**
 * Check if the user is authenticated
 * @returns {boolean} True if authenticated, false otherwise
 */
export const isAuthenticated = () => {
  return !!getAuthToken();
};

/**
 * Get the current user from localStorage
 * @returns {Object|null} The user object or null if not found
 */
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch (e) {
    console.error('Error parsing user data from localStorage', e);
    return null;
  }
};

/**
 * Logout the user by removing auth token and user data
 */
export const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
};

/**
 * Login with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} Login response with token and user data
 */
export const login = async (email, password) => {
  console.log('API login attempt for:', email);
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Login API error:', errorData);
      throw new Error(errorData.error?.message || 'Login failed. Please check your credentials.');
    }
    
    const data = await response.json();
    console.log('Login API response:', data);
    
    // Store token and user data immediately
    if (data.accessToken) {
      localStorage.setItem('authToken', data.accessToken);
    }
    
    return data;
  } catch (error) {
    console.error('Login error in API:', error);
    throw error;
  }
};

/**
 * Request headers with authentication
 * @returns {Object} Headers object with Authorization if token exists
 */
export const getAuthHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

/**
 * Make an authenticated API request
 * @param {string} endpoint - API endpoint path
 * @param {Object} options - Fetch options
 * @returns {Promise} Promise resolving to API response data
 */
export const authFetch = async (endpoint, options = {}) => {
  try {
    // Add timestamp to prevent caching
    const separator = endpoint.includes('?') ? '&' : '?';
    const url = `${API_BASE_URL}${endpoint}${separator}_t=${Date.now()}`;
    
    // Add auth headers to existing headers
    const headers = {
      ...getAuthHeaders(),
      ...(options.headers || {})
    };
    
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    // Handle 401 Unauthorized - automatic logout
    if (response.status === 401) {
      logout();
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

export default {
  isAuthenticated,
  getAuthToken,
  getCurrentUser,
  logout,
  getAuthHeaders,
  login,
  authFetch
};