import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import FileCard from "./components/Filecard";
import { useFiles } from "./hooks/useFiles"; 
import "./DriveApp.css";

function DriveApp({ user }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentTab, setCurrentTab] = useState("home");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  // Enterprise Custom Hook Action!
  const { 
    files, storageUsed, isSharing,
    fetchFiles, fetchStorage, uploadFile, downloadFile, 
    removeFile, restoreFile, shareSelectedFiles 
  } = useFiles(currentTab);

  useEffect(() => {
    fetchFiles();
    fetchStorage();
    setSelectedFiles([]);
  }, [currentTab, fetchFiles, fetchStorage]);

  const handleDragOver = (e) => { if (currentTab === 'home') { e.preventDefault(); setIsDragging(true); }};
  const handleDragLeave = (e) => { if (currentTab === 'home') { e.preventDefault(); if (!e.currentTarget.contains(e.relatedTarget)) setIsDragging(false); }};
  const handleDrop = (e) => {
    if (currentTab !== 'home') return;
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) Array.from(e.dataTransfer.files).forEach(file => uploadFile(file));
  };

  const handleToggleSelect = (id) => setSelectedFiles(prev => prev.includes(id) ? prev.filter(fId => fId !== id) : [...prev, id]);
  const handleActionRemove = async (id, name) => {
    const success = await removeFile(id, name);
    if (success) setSelectedFiles(prev => prev.filter(fId => fId !== id));
  };
  const handleActionRestore = async (id, name) => {
    const success = await restoreFile(id, name);
    if (success) setSelectedFiles(prev => prev.filter(fId => fId !== id));
  };

  const filteredFiles = files.filter(file => file.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="main-layout">
      <Sidebar onFileSelect={uploadFile} currentTab={currentTab} setCurrentTab={setCurrentTab} storageUsed={storageUsed} />
      
      <div className="content-area" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
        <Header onSearch={setSearchTerm} user={user} />
        
        <div className="content-padding">
          {selectedFiles.length > 0 && currentTab !== 'trash' && (
            <div className="selection-action-bar">
              <span className="selection-text">{selectedFiles.length} item(s) selected</span>
              <button className="btn-share" onClick={() => shareSelectedFiles(selectedFiles, setSelectedFiles)} disabled={isSharing}>
                {isSharing ? '⏳ Preparing...' : '🔗 Share File(s)'}
              </button>
              <button className="btn-cancel" onClick={() => setSelectedFiles([])}>Cancel</button>
            </div>
          )}

          <h2 className="tab-title">{currentTab === 'home' ? 'Home' : currentTab.charAt(0).toUpperCase() + currentTab.slice(1)}</h2>

          {filteredFiles.length === 0 ? (
            currentTab === 'home' ? (
              <div className="empty-state home-empty">
                {isDragging && <div className="drag-overlay">Drop files here to upload</div>}
                <img className="empty-img-large" src="https://ssl.gstatic.com/docs/doclist/images/empty_state_my_drive_v2.svg" alt="No Files" />
                <h3 className="empty-title">A place for all of your files</h3>
                <label className="btn-upload-label">
                  Upload File
                  <input type="file" multiple className="hidden-input" onChange={(e) => {
                    if (e.target.files) Array.from(e.target.files).forEach(f => uploadFile(f));
                  }} />
                </label>
              </div>
            ) : (
              <div className="empty-state generic-empty">
                <img className="empty-img-small" src="https://ssl.gstatic.com/docs/doclist/images/empty_state_details_v2.svg" alt="Empty" />
                <h3 className="empty-title" style={{ fontSize: '20px' }}>
                  {currentTab === 'trash' ? 'Trash is empty' : currentTab.includes('recent') ? 'No recent files found' : 'No shared files found'}
                </h3>
              </div>
            )
          ) : (
            <div className="grid-wrapper">
              {isDragging && currentTab === 'home' && <div className="drag-overlay grid-overlay">Drop files here to upload</div>}
              <div className="files-grid">
                {filteredFiles.map((file) => (
                  <FileCard
                    key={file.id} file={file}
                    onDownload={() => downloadFile(file)}
                    onDelete={() => handleActionRemove(file.id, file.name)}
                    onRestore={() => handleActionRestore(file.id, file.name)}
                    isTrash={currentTab === 'trash'}
                    isSelected={selectedFiles.includes(file.id)}
                    onToggleSelect={handleToggleSelect}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default DriveApp;