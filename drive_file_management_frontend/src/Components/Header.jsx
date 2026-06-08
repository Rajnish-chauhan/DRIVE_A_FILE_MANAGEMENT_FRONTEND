import React from "react";
import "./Header.css";
import API_URL_TEST from "../jsconfig";

function Header({ onSearch, user }) {
  const handleLogout = () => {
   window.location.href = `${API_URL_TEST}/api/auth/logout`;
  };

  // Set user avatar if it doesn't have one
  const avatarUrl = user?.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png";
  
  return (
    <div className="header">
      <div className="search-container">
        <span className="search-icon"></span>
        <input type="text" className="search-input" placeholder="Search in Drive" onChange={(e) => onSearch(e.target.value)} />
      </div>
      <div className="profile-container">
        {user && (
          <div className="user-info">
            <span className="user-name">{user.name}</span>
            {/* 🔴 THE FIX IS RIGHT HERE */}
            <img 
              src={avatarUrl} 
              alt="Profile" 
              className="user-avatar" 
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.target.onerror = null; // Prevents infinite loop
                e.target.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
              }}
            />
          </div>
        )}
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>
    </div>
  );
}

export default Header;