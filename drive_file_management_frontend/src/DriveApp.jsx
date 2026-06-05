import React, { useState, useEffect } from "react";
import Sidebar from "./Components/Sidebar";
import Header from "./Components/Header";
import FileCard from "./Components/Filecard";
import "./DriveApp.css";
import axios from "axios";

function DriveApp({ user }) {
  const [files, setFiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentTab, setCurrentTab] = useState("home");
  const [isSharing, setIsSharing] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    fetchFiles(currentTab);
    setSelectedFiles([]);
  }, [currentTab]);

  const fetchFiles = async (tab) => {
    try {
      const res = await axios.get(`https://drive-file-manager.onrender.com/api/files/${tab}`, {
        withCredentials: true 
      });
      
      let fetchedData = res.data;

      if (tab === 'recent' || tab === 'recents') {
        fetchedData = fetchedData.sort((a, b) => {
          const dateA = new Date(a.createdAt || a.uploadDate || a.updatedAt || 0);
          const dateB = new Date(b.createdAt || b.uploadDate || b.updatedAt || 0);
          return dateB - dateA;
        });
      }

      setFiles(fetchedData);
    } catch (err) {
      console.error("Fetch Error:", err);
    }
  };

  const handleUploadFromSidebar = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      await axios.post("https://drive-file-manager.onrender.com/api/files/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true 
      });
      fetchFiles(currentTab);
    } catch (error) {
      console.error("Upload Error:", error);
      alert(error.response?.data || "Upload failed. Check the console for details.");
    }
  };

  const handleDragOver = (e) => {
    if (currentTab !== 'home') return; 
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    if (currentTab !== 'home') return;
    e.preventDefault();
    if (!e.relatedTarget || !e.currentTarget.contains(e.relatedTarget)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e) => {
    if (currentTab !== 'home') return; 
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach((file) => {
        handleUploadFromSidebar(file); 
      });
    }
  };

  const handleDownload = async (file) => {
    try {
      const response = await axios.get(`https://drive-file-manager.onrender.com/api/files/download/${file.id}`, {
        responseType: 'blob',
        withCredentials: true
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.name);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error("Download Error:", error);
      alert("Download failed! Ye purani file ho sakti hai. Ek nayi file upload karke check karo.");
    }
  };

  const handleDelete = async (id, fileName) => {
    const confirmed = window.confirm(
      currentTab === 'trash' ? `Delete "${fileName}" permanently?` : `Move "${fileName}" to Trash?`
    );
    if (!confirmed) return;

    try {
      if (currentTab === 'trash') {
        await axios.delete(`https://drive-file-manager.onrender.com/api/files/delete/${id}`, { withCredentials: true });
      } else {
        await axios.put(`https://drive-file-manager.onrender.com/api/files/trash/${id}`, {}, { withCredentials: true });
      }
      fetchFiles(currentTab);
      setSelectedFiles(selectedFiles.filter(fileId => fileId !== id));
    } catch (error) {
      console.error("Delete Error:", error);
      alert("Delete failed! Console check karo.");
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedFiles((prev) =>
      prev.includes(id) ? prev.filter((fileId) => fileId !== id) : [...prev, id]
    );
  };
const handleShare = async () => {
    if (selectedFiles.length === 0) return;
    setIsSharing(true);

    // Helper: Phones will outright reject the file if it doesn't know the exact format
    const getMimeType = (filename) => {
      const ext = filename.split('.').pop().toLowerCase();
      const types = {
        'png': 'image/png', 'jpg': 'image/jpeg', 'jpeg': 'image/jpeg',
        'pdf': 'application/pdf', 'txt': 'text/plain', 'mp4': 'video/mp4',
        'zip': 'application/zip', 'csv': 'text/csv', 'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      };
      return types[ext] || 'application/octet-stream';
    };

    try {
      const fileObjects = [];
      
      // 1. Fetch files from the server
      for (const fileId of selectedFiles) {
        const fileMeta = files.find(f => f.id === fileId);
        const fileName = fileMeta ? fileMeta.name : `shared_file_${fileId}`;

        const response = await axios.get(`https://drive-file-manager.onrender.com/api/files/download/${fileId}`, {
          responseType: 'blob',
          withCredentials: true
        });

        const mimeType = getMimeType(fileName); // Force strict MIME type
        const fileObj = new File([response.data], fileName, { type: mimeType });
        fileObjects.push(fileObj);
      }

      // 2. ATTEMPT MOBILE NATIVE SHARE
      if (navigator.canShare && navigator.canShare({ files: fileObjects })) {
        try {
          await navigator.share({
            title: 'Shared from My Drive',
            files: fileObjects,
          });
          setSelectedFiles([]);
          setIsSharing(false);
          return; // Success! The phone's share menu opened.
        } catch (error) {
          console.warn("Native share aborted by user or blocked by browser timeout:", error);
          // If it fails here, it falls through to the download code below
        }
      } 

      // 3. FALLBACK: IF LAPTOP, OR IF PHONE BLOCKED IT
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      if (isMobile) {
          alert("Your phone's security blocked the share menu (the file took too long to fetch). It will be downloaded to your phone so you can share it manually.");
      } else {
          alert("Laptops/PCs do not allow websites to push files into apps. The file will be downloaded to your computer.");
      }
      
      // Force download the physical file
      fileObjects.forEach(fileObj => {
        const url = window.URL.createObjectURL(fileObj);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileObj.name);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url); // Clean up memory
      });

      setSelectedFiles([]);

    } catch (err) {
      console.error("Critical Share Error:", err);
      alert("Failed to prepare the file for sharing.");
    } finally {
      setIsSharing(false);
    }
  };
    

  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="main-layout">
      <Sidebar onFileSelect={handleUploadFromSidebar} currentTab={currentTab} setCurrentTab={setCurrentTab} />
      
      <div 
        className="content-area"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Header onSearch={setSearchTerm} user={user} />

        <div className="content-padding">
          {selectedFiles.length > 0 && currentTab !== 'trash' && (
            <div className="selection-action-bar">
              <span className="selection-text">{selectedFiles.length} item(s) selected</span>

              <button
                className="btn-share"
                onClick={handleShare} 
                disabled={isSharing}
              >
                {isSharing ? '⏳ Preparing...' : '🔗 Share File(s)'}
              </button>

              <button className="btn-cancel" onClick={() => setSelectedFiles([])}>
                Cancel
              </button>
            </div>
          )}

          <h2 className="tab-title">
            {currentTab === 'home' ? 'Home' : currentTab.charAt(0).toUpperCase() + currentTab.slice(1)}
          </h2>

          {filteredFiles.length === 0 ? (
            currentTab === 'home' ? (
              <div className="empty-state home-empty">
                
                {isDragging && (
                  <div className="drag-overlay">
                    Drop files here to upload
                  </div>
                )}

                <img className="empty-img-large" src="https://ssl.gstatic.com/docs/doclist/images/empty_state_my_drive_v2.svg" alt="No Files" />
                <h3 className="empty-title">A place for all of your files</h3>
                <p className="empty-subtitle">Drag and drop files here, or click "New" to upload.</p>
                
                <label className="btn-upload-label">
                  Upload File
                  <input 
                    type="file" 
                    multiple 
                    className="hidden-input"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        Array.from(e.target.files).forEach(file => handleUploadFromSidebar(file));
                      }
                    }} 
                  />
                </label>
              </div>
            ) : (
              <div className="empty-state generic-empty">
                <img className="empty-img-small" src="https://ssl.gstatic.com/docs/doclist/images/empty_state_details_v2.svg" alt="No Files" />
                
                {/* ---- FIX: Handles both 'recent', 'recents', 'share', 'shared' safely ---- */}
                <h3 className="empty-title" style={{ fontSize: '20px' }}>
                  {currentTab === 'trash' ? 'Trash is empty' : 
                   currentTab.includes('recent') ? 'No recent files found' : 
                   'No shared files found'}
                </h3>
              </div>
            )
          ) : (
            <div className="grid-wrapper">
              
              {isDragging && currentTab === 'home' && (
                <div className="drag-overlay grid-overlay">
                  Drop files here to upload
                </div>
              )}

              <div className="files-grid">
                {filteredFiles.map((file) => (
                  <FileCard
                    key={file.id}
                    file={file}
                    onDownload={() => handleDownload(file)}
                    onDelete={() => handleDelete(file.id, file.name)}
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