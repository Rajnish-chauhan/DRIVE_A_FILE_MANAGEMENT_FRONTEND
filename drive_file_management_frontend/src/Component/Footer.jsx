import React from 'react';
import './footer.css'; 

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Upar aayega Copyright */}
        <p className="footer-text">
          &copy; {currentYear}{' '}
          <a 
            href="https://rajnishsystems.in" 
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