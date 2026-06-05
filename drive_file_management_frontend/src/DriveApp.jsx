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
      setFiles(res.data);
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
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    // Safety check so the drag box doesn't flicker wildly
    if (!e.relatedTarget || !e.currentTarget.contains(e.relatedTarget)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach((file) => {
        handleUploadFromSidebar(file); // Reuses your working upload logic
      });
    }
  };

  // --- FILE ACTION LOGIC ---
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
    <div 
      className="main-layout"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* DRAG AND DROP VISUAL BOX */}
      {isDragging && (
        <div style={{
          position: "fixed", 
          top: 0, left: 0, width: "100vw", height: "100vh",
          backgroundColor: "rgba(26, 115, 232, 0.1)",
          border: "4px dashed #1a73e8",
          zIndex: 9999,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: "28px",
          fontWeight: "bold",
          color: "#1a73e8",
          backdropFilter: "blur(2px)",
          pointerEvents: "none" 
        }}>
          Drop files here to upload
        </div>
      )}

      <Sidebar onFileSelect={handleUploadFromSidebar} currentTab={currentTab} setCurrentTab={setCurrentTab} />
      <div className="content-area">
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

          <h2 className="tab-title">{currentTab === 'home' ? 'My Drive' : currentTab}</h2>

          {filteredFiles.length === 0 ? (
            <div className="empty-state">
              <img src="https://ssl.gstatic.com/docs/doclist/images/empty_state_my_drive_v2.svg" alt="No Files" style={{ width: "250px" }} />
              <p>Not Found</p>
            </div>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
}

export default DriveApp;