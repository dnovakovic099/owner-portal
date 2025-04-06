import React from 'react';
import './Navigation.css';
import { useAuth } from './context/AuthContext';

export const Navigation = ({ currentPage, navigateTo }) => {
  const { user, logout } = useAuth();
  
  const handleLogout = () => {
    logout();
  };
  
  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-left">
          <div className="nav-brand">
            <h1 className="brand-title">Owner Portal</h1>
          </div>
          <div className="nav-links">
            <button
              onClick={() => navigateTo('financial')}
              className={`nav-link ${currentPage === 'financial' ? 'active' : ''}`}
            >
              Financial Overview
            </button>
            <button
              onClick={() => navigateTo('reservations')}
              className={`nav-link ${currentPage === 'reservations' ? 'active' : ''}`}
            >
              Reservations
            </button>
            <button
              onClick={() => navigateTo('calendar')}
              className={`nav-link ${currentPage === 'calendar' ? 'active' : ''}`}
            >
              Calendar
            </button>
            <button
              onClick={() => navigateTo('payouts')}
              className={`nav-link ${currentPage === 'payouts' ? 'active' : ''}`}
            >
              Payouts
            </button>
          </div>
        </div>
        <div className="nav-right">
          <div className="user-info">
            {user && <span className="user-email">{user.email}</span>}
          </div>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};