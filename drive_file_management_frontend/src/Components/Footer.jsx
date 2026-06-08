import React from 'react';
import API_URL_TEST from '../jsconfig';
import './Footer.css'; 

const Footer = () => {
  const currentYear = new Date().getFullYear();
const api=import.meta.env.VITE_API_URL_TEST;
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Upar aayega Copyright */}
        <p className="footer-text">
          &copy; {currentYear}{' '}
          <a 
            href={API_URL_TEST}
            target="_blank" 
            rel="noopener noreferrer" 
            className="footer-main-link"
          >
            rajnishsystems.in
          </a>
          . All rights reserved.
        </p>

        {/* Theek uske niche aayenge Links */}
        <div className="footer-links">
          <a href="/privacy.html" target="_blank" rel="noopener noreferrer" className="footer-policy-link">
            Privacy Policy
          </a>
          <span className="footer-separator">|</span>
          <a href="/terms.html" target="_blank" rel="noopener noreferrer" className="footer-policy-link">
            Terms & Conditions
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;