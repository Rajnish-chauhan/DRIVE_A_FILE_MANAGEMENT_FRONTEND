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

      // --- FIX: Ensure 'Recent' tab sorts newest files to the top ---
      if (tab === 'recent') {
        fetchedData = fetchedData.sort((a, b) => {
          // Checks common date fields. Update 'createdAt' if your Spring Boot uses a different name like 'uploadDate'
          const dateA = new Date(a.createdAt || a.uploadDate || a.updatedAt || 0);
          const dateB = new Date(b.createdAt || b.uploadDate || b.updatedAt || 0);
          return dateB - dateA; // Descending order (Newest first)
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

  // --- DRAG AND DROP LOGIC ---
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

    try {
      const fetchPromises = selectedFiles.map(async (fileId) => {
        const fileMeta = files.find(f => f.id === fileId);
        const fileName = fileMeta ? fileMeta.name : `shared_file_${fileId}`;

        const response = await axios.get(`https://drive-file-manager.onrender.com/api/files/download/${fileId}`, {
          responseType: 'blob',
          withCredentials: true
        });

        const mimeType = response.data.type || 'application/octet-stream';
        return {
          id: fileId,
          name: fileName,
          fileObj: new File([response.data], fileName, { type: mimeType })
        };
      });

      const fileDataArray = await Promise.all(fetchPromises);
      const fileObjects = fileDataArray.map(fd => fd.fileObj);

      if (navigator.canShare && navigator.canShare({ files: fileObjects })) {
        try {
          await navigator.share({
            title: 'Shared Files',
            text: `Here are ${fileObjects.length} file(s) for you.`,
            files: fileObjects,
          });
          setSelectedFiles([]);
          setIsSharing(false);
          return; 
        } catch (error) {
          console.log("Native share failed. Triggering PC fallback...");
        }
      }

      let linkText = `Hey, I am sharing ${fileDataArray.length} file(s) with you:\n\n`;

      for (const fd of fileDataArray) {
        const res = await axios.put(`https://drive-file-manager.onrender.com/api/files/generate-share-link/${fd.id}`, {}, { withCredentials: true });
        const shareToken = res.data;
        const shareLink = `https://drive.rajnishsystems.in/shared/${shareToken}`;
        linkText += `- ${fd.name}: ${shareLink}\n`;
      }

      navigator.clipboard.writeText(linkText);
      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(linkText)}`;
      window.open(whatsappUrl, '_blank');
      setSelectedFiles([]);

    } catch (err) {
      console.error("Critical Share Error:", err);
      alert("Files server se laane mein dikkat aayi. Check console.");
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
        style={{ height: "100%" }} 
      >
        <Header onSearch={setSearchTerm} user={user} />

        <div className="content-padding">
          {selectedFiles.length > 0 && currentTab !== 'trash' && (
            <div style={{
              background: '#e8f0fe', padding: '10px 20px', borderRadius: '8px',
              marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap'
            }}>
              <span style={{ color: '#1a73e8', fontWeight: '500' }}>{selectedFiles.length} item(s) selected</span>

              <button
                onClick={handleShare} disabled={isSharing}
                style={{
                  background: isSharing ? '#a0c3ff' : '#1a73e8', color: 'white', border: 'none',
                  padding: '8px 16px', borderRadius: '4px', cursor: isSharing ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: '5px'
                }}
              >
                {isSharing ? '⏳ Preparing...' : '🔗 Share File(s)'}
              </button>

              <button onClick={() => setSelectedFiles([])} style={{ background: 'transparent', border: '1px solid #1a73e8', color: '#1a73e8', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          )}

          {/* ----- FIX: Renamed My Drive to Home, and Capitalizes other tabs natively ----- */}
          <h2 className="tab-title">
            {currentTab === 'home' ? 'Home' : currentTab.charAt(0).toUpperCase() + currentTab.slice(1)}
          </h2>

          {filteredFiles.length === 0 ? (
            currentTab === 'home' ? (
              <div 
                className="empty-state" 
                style={{ 
                  display: 'flex', flexDirection: 'column', alignItems: 'center', 
                  marginTop: '50px', textAlign: 'center', 
                  position: 'relative', 
                  padding: '40px',      
                  borderRadius: '16px' 
                }}
              >
                
                {isDragging && (
                  <div style={{
                    position: "absolute",
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: "rgba(26, 115, 232, 0.15)",
                    border: "4px dashed #1a73e8",
                    borderRadius: "16px",
                    zIndex: 9999,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    fontSize: "24px",
                    fontWeight: "bold",
                    color: "#1a73e8",
                    backdropFilter: "blur(4px)",
                    pointerEvents: "none" 
                  }}>
                    Drop files here to upload
                  </div>
                )}

                <img src="https://ssl.gstatic.com/docs/doclist/images/empty_state_my_drive_v2.svg" alt="No Files" style={{ width: "250px", marginBottom: "20px" }} />
                <h3 style={{ color: '#e8eaed', fontWeight: '400', fontSize: '22px', marginBottom: '8px' }}>
                  A place for all of your files
                </h3>
                <p style={{ color: '#9aa0a6', fontSize: '15px' }}>
                  Drag and drop files here, or click "New" to upload.
                </p>
                
                <label style={{ 
                  marginTop: '25px', background: '#1a73e8', color: 'white', padding: '10px 24px', 
                  borderRadius: '24px', cursor: 'pointer', fontWeight: '500', fontSize: '14px',
                  boxShadow: '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)'
                }}>
                  Upload File
                  <input 
                    type="file" 
                    multiple 
                    style={{ display: 'none' }} 
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        Array.from(e.target.files).forEach(file => handleUploadFromSidebar(file));
                      }
                    }} 
                  />
                </label>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '80px', textAlign: 'center' }}>
                <img src="https://ssl.gstatic.com/docs/doclist/images/empty_state_details_v2.svg" alt="No Files" style={{ width: "180px", marginBottom: "20px", opacity: 0.8 }} />
                <h3 style={{ color: '#e8eaed', fontWeight: '400', fontSize: '20px' }}>
                  {currentTab === 'trash' ? 'Trash is empty' : 
                   currentTab === 'recent' ? 'No recent files found' : 
                   'No shared files found'}
                </h3>
              </div>
            )
          ) : (
            <div style={{ position: 'relative', minHeight: '300px' }}>
              
              {isDragging && currentTab === 'home' && (
                <div style={{
                  position: "absolute",
                  top: -10, left: -10, right: -10, bottom: -10,
                  backgroundColor: "rgba(26, 115, 232, 0.1)",
                  border: "4px dashed #1a73e8",
                  borderRadius: "12px",
                  zIndex: 9999,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "#1a73e8",
                  backdropFilter: "blur(2px)",
                  pointerEvents: "none" 
                }}>
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