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
            <div className="app-logo"></div>
          </div>
          <div className="nav-links">
            <button
              onClick={() => navigateTo('financial')}
              className={`nav-link ${currentPage === 'financial' ? 'active' : ''}`}
            >
              FINANCIAL OVERVIEW
            </button>
            <button
              onClick={() => navigateTo('reservations')}
              className={`nav-link ${currentPage === 'reservations' ? 'active' : ''}`}
            >
              RESERVATIONS
            </button>
            <button
              onClick={() => navigateTo('calendar')}
              className={`nav-link ${currentPage === 'calendar' ? 'active' : ''}`}
            >
              CALENDAR
            </button>
            <button
              onClick={() => navigateTo('payouts')}
              className={`nav-link ${currentPage === 'payouts' ? 'active' : ''}`}
            >
              PAYOUTS
            </button>
            <button
              onClick={() => navigateTo('referrals')}
              className={`nav-link ${currentPage === 'referrals' ? 'active' : ''}`}
            >
              REFERRALS
            </button>
          </div>
        </div>
        <div className="nav-right">
          <div className="user-info">
            {user && <span className="user-email">{user.email}</span>}
          </div>
          <button onClick={handleLogout} className="logout-button">
            LOGOUT
          </button>
        </div>
      </div>
    </nav>
  );
};