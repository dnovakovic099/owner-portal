import React from 'react';
import './Navigation.css';
import logoImage from './luxury-lodging-logo.png'; // Import the logo image


export const Navigation = ({ currentPage, navigateTo }) => {
  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-left">
          <div className="nav-brand">
            {/* <div className="logo-container">
              <img src={logoImage} alt="Luxury Lodging Host" className="logo" />
            </div> */}
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
          </div>
        </div>
        <div className="nav-right">
          <button className="profile-button">
            Profile
          </button>
        </div>
      </div>
    </nav>
  );
};