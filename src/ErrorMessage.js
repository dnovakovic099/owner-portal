import React from 'react';

/**
 * Error message component for displaying API and other errors
 * @param {Object} props - Component props
 * @param {Error|Object} props.error - Error object with message property
 * @param {Function} props.retry - Optional retry function
 * @param {string} props.className - Optional additional CSS classes
 * @returns {JSX.Element} Error component
 */
export const ErrorMessage = ({ error, retry, className = '' }) => {
  const errorMessage = error?.message || 'An unknown error occurred';
  
  return (
    <div className={`error-container ${className}`}>
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        className="error-icon"
      >
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <p className="error-message">{errorMessage}</p>
      {retry && (
        <button 
          onClick={retry} 
          className="retry-button"
          aria-label="Retry"
        >
          Retry
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;