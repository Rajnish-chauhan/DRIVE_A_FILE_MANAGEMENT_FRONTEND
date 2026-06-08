import React, { useState, useEffect } from "react";
import Sidebar from "./Components/Sidebar";
import Header from "./Components/Header";
import FileCard from "./Components/Filecard";
import "./DriveApp.css";
import URL_TEST from "./jsconfig";
import axios from "axios";

// Ensure headers contain cookie metadata across cross-origin contexts
axios.defaults.withCredentials = true;

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
    // CRITICAL FIX: Bypass standard file list aggregation arrays if the state handles storage metadata strings
    if (tab === "storage") return;

    try {
      let backendTab = tab;
      if (tab === "recent") backendTab = "recents";
      if (tab === "shared") backendTab = "share";

      const res = await axios.get(`${URL_TEST}/api/files/${backendTab}`);
      let fetchedData = res.data;

      if (tab === 'recent' || tab === 'recents') {
        fetchedData = fetchedData.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return dateB - dateA;
        });
      }

      // Defensive Fallback Rule Check: Always enforce an array structure fallback configuration
      setFiles(Array.isArray(fetchedData) ? fetchedData : []);
    } catch (err) {
      console.error("Fetch Error:", err);
      setFiles([]); // Safe state fallback recovery parameters rule to block system runtime issues
    }
  };

  const handleUploadFromSidebar = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      await axios.post(`${URL_TEST}/api/files/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
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
      // FIX: Added missing '/api' path mapping to prevent 404 errors
      const response = await axios.get(`${URL_TEST}/api/files/download/${file.id}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.name);
      document.body.appendChild(link);
      link.click();

      // Memory cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download Error:", error);
      alert("Download failed! This might be an old file or missing from Google Drive.");
    }
  };

  const handleDelete = async (id, fileName) => {
    const confirmed = window.confirm(
      currentTab === 'trash' ? `Delete "${fileName}" permanently?` : `Move "${fileName}" to Trash?`
    );
    if (!confirmed) return;

    try {
      if (currentTab === 'trash') {
        await axios.delete(`${URL_TEST}/api/files/delete/${id}`);
      } else {
        await axios.put(`${URL_TEST}/api/files/trash/${id}`, {});
      }
      fetchFiles(currentTab);
      setSelectedFiles(prev => prev.filter(fileId => fileId !== id));
    } catch (error) {
      console.error("Delete Error:", error);
      alert("Delete failed! Check terminal log for stacktrace.");
    }
  };

  const handleRestore = async (id, fileName) => {
    const confirmed = window.confirm(`Restore "${fileName}" from Trash?`);
    if (!confirmed) return;

    try {
      await axios.put(`${URL_TEST}/api/files/restore/${id}`, {});
      fetchFiles(currentTab);
      setSelectedFiles(prev => prev.filter(fileId => fileId !== id));
    } catch (error) {
      console.error("Restore Error:", error);
      alert("Restore failed! Check terminal log for stacktrace.");
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

      for (const fileId of selectedFiles) {
        // 🔴 NEW: Tell the backend database to mark this file as "Shared"
        try {
          await axios.put(`${URL_TEST}/api/files/share/${fileId}`);
        } catch (dbError) {
          console.warn(`Failed to update share status in DB for file ${fileId}`, dbError);
        }

        const fileMeta = files.find(f => f.id === fileId);
        const fileName = fileMeta ? fileMeta.name : `shared_file_${fileId}`;

        const response = await axios.get(`${URL_TEST}/api/files/download/${fileId}`, {
          responseType: 'blob'
        });

        const mimeType = getMimeType(fileName);
        const fileObj = new File([response.data], fileName, { type: mimeType });
        fileObjects.push(fileObj);
      }

      // 🔴 NEW: Refresh the file list so the UI knows about the new share status
      fetchFiles(currentTab);

      // Try Mobile Native Web Share API if supported
      if (navigator.canShare && navigator.canShare({ files: fileObjects })) {
        try {
          await navigator.share({
            title: 'Shared Files from My Cloud Drive',
            files: fileObjects,
          });
          setSelectedFiles([]);
          setIsSharing(false);
          return;
        } catch (error) {
          console.warn("Native share menu call aborted or blocked:", error);
        }
      }

      // Fallback strategy
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (isMobile) {
        alert("Mobile security blocked background direct stream sharing. Files will download locally so you can pass them manually.");
      } else {
        alert("Desktop systems do not support native application share injection. Triggering browser multi-download.");
      }

      fileObjects.forEach(fileObj => {
        const url = window.URL.createObjectURL(fileObj);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileObj.name);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      });

      setSelectedFiles([]);
    } catch (err) {
      console.error("Critical Share Processing Error:", err);
      alert("Failed to build file payload data arrays for delivery.");
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
                    onRestore={() => handleRestore(file.id, file.name)} // <-- NAYA PROP 
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