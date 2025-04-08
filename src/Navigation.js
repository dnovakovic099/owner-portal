import React, { useState } from 'react';
import './Navigation.css';
import { useAuth } from './context/AuthContext';
import ContactForm from './components/ContactForm';

export const Navigation = ({ currentPage, navigateTo }) => {
  const { user, logout } = useAuth();
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  
  const handleLogout = () => {
    logout();
  };
  
  const openContactForm = () => {
    setIsContactFormOpen(true);
  };
  
  const closeContactForm = () => {
    setIsContactFormOpen(false);
  };
  
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };
  
  const handleNavClick = (page) => {
    navigateTo(page);
    setMenuOpen(false); // Close menu when a navigation item is clicked
  };
  
  return (
    <>
      <nav className="navigation">
        <div className="nav-container">
          <div className="nav-left">
            <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
              <button
                onClick={() => handleNavClick('financial')}
                className={`nav-link ${currentPage === 'financial' ? 'active' : ''}`}
              >
                FINANCIAL OVERVIEW
              </button>
              <button
                onClick={() => handleNavClick('reservations')}
                className={`nav-link ${currentPage === 'reservations' ? 'active' : ''}`}
              >
                RESERVATIONS
              </button>
              <button
                onClick={() => handleNavClick('calendar')}
                className={`nav-link ${currentPage === 'calendar' ? 'active' : ''}`}
              >
                CALENDAR
              </button>
              <button
                onClick={() => handleNavClick('payouts')}
                className={`nav-link ${currentPage === 'payouts' ? 'active' : ''}`}
              >
                PAYOUTS
              </button>
              <button
                onClick={() => handleNavClick('referrals')}
                className={`nav-link ${currentPage === 'referrals' ? 'active' : ''}`}
              >
                PARTNERSHIP
              </button>
              <button
                onClick={() => handleNavClick('income-estimate')}
                className={`nav-link ${currentPage === 'income-estimate' ? 'active' : ''}`}
              >
                INCOME ESTIMATE
              </button>
            </div>
            <div className="menu-toggle" onClick={toggleMenu}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
          <div className="nav-right">
            <button onClick={openContactForm} className="contact-button">
              CONTACT US
            </button>
            <button onClick={handleLogout} className="logout-button">
              LOGOUT
            </button>
          </div>
        </div>
      </nav>
      
      <ContactForm isOpen={isContactFormOpen} onClose={closeContactForm} />
    </>
  );
};