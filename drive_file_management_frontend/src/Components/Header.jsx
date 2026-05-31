import React from "react";
import "./Header.css";

function Header({ onSearch, user }) {
  const handleLogout = () => {
    window.location.href = "https://drive.backend.rajnishsystems.in/logout";
  };

  //set user avtar if its not have any avtar
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
            <img src={user.avatar} alt="Profile" className="user-avatar" />
          </div>
        )}
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>
    </div>
  );
}
export default Header;