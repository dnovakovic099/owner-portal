import React from 'react';

/**
 * Loading spinner component
 * @param {Object} props - Component props
 * @param {string} props.message - Optional loading message
 * @returns {JSX.Element} Loading component
 */
export const Loading = ({ message = 'Loading data...' }) => (
  <div className="loading-container">
    <div className="spinner"></div>
    <p>{message}</p>
  </div>
);

export default Loading;