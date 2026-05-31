import React, { useRef, useState, useEffect } from "react";
import axios from "axios";
import "./Sidebar.css";

function Sidebar({ onFileSelect, currentTab, setCurrentTab }) {
  const hiddenFileInput = useRef(null);
  const [storageUsed, setStorageUsed] = useState(0);
  const MAX_STORAGE = 2 * 1024 * 1024 * 1024; // 50 GB

  useEffect(() => {
    axios.get("https://drive.backend.rajnishsystems.in/api/files/storage").then((res) => {
      setStorageUsed(res.data);
    });
  }, [currentTab]);

  const handleChange = (event) => {
    if (event.target.files[0]) onFileSelect(event.target.files[0]);
    event.target.value = null; 
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024, dm = 2, sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const storagePercentage = (storageUsed / MAX_STORAGE) * 100;

  return (
    <div className="sidebar">
      <div className="logo-container">
        <img src="https://cdn-icons-png.flaticon.com/512/414/414825.png" alt="Drive" className="drive-logo" />
        <span className="logo-text">Drive</span>
      </div>

      <button className="new-btn" onClick={() => hiddenFileInput.current.click()}>
        <span className="plus-icon">+</span> New
      </button>
      <input type="file" ref={hiddenFileInput} onChange={handleChange} style={{ display: "none" }} />
      
      <ul className="nav-links">
        <li className={currentTab === 'home' ? 'active' : ''} onClick={() => setCurrentTab('home')}>🏠 My Drive</li>
        <li className={currentTab === 'recents' ? 'active' : ''} onClick={() => setCurrentTab('recents')}>🕒 Recent</li>
      <li className={currentTab === 'share' ? 'active' : ''} onClick={() => setCurrentTab('share')}>🔗 My Shared Files</li>
        <li className={currentTab === 'trash' ? 'active' : ''} onClick={() => setCurrentTab('trash')}>🗑️ Trash</li>
      </ul>

      <div className="storage-section">
        <p className="storage-title">☁️ Storage</p>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${storagePercentage}%`, background: storagePercentage > 90 ? '#d93025' : '#1a73e8' }}></div>
        </div>
        <p className="storage-text">{formatBytes(storageUsed)} of 2 GB used</p>
      </div>
    </div>
  );
}
export default Sidebar;