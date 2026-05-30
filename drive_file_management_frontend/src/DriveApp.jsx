import React, { useState, useEffect } from "react";
import Sidebar from "./component/Sidebar";
import Header from "./component/Header";
import FileCard from "./component/FileCard";
import "./DriveApp.css";
import axios from "axios";

function DriveApp({ user }) {
  const [files, setFiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentTab, setCurrentTab] = useState("home");
  const [isSharing, setIsSharing] = useState(false);

  // NAYA: Checkbox click pe select hui files ko track karne ke liye
  const [selectedFiles, setSelectedFiles] = useState([]);

  
  useEffect(() => {
    fetchFiles(currentTab);
    // Tab change hone par selection clear kar do
    setSelectedFiles([]);
  }, [currentTab]);

  const fetchFiles = async (tab) => {
    try {
      const res = await axios.get(`http://localhost:8080/api/files/${tab}`);
      setFiles(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUploadFromSidebar = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      await axios.post("http://localhost:8080/api/files/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      fetchFiles(currentTab);
    } catch (error) {
      alert("Upload failed.");
    }
  };

  const handleDownload = async (file) => {
    try {
      const response = await axios.get(`http://localhost:8080/api/files/download/${file.id}`, {
        responseType: 'blob', // IMPORTANT: binary data formats handle karne ke liye
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.name);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link); // memory cleanup
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
        await axios.delete(`http://localhost:8080/api/files/delete/${id}`);
      } else {
        await axios.put(`http://localhost:8080/api/files/trash/${id}`);
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

        // 1. File data fetch 
        const response = await axios.get(`http://localhost:8080/api/files/download/${fileId}`, {
          responseType: 'blob', 
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

      // 2. Pehle check agar Mobile/Native File Share support karta hai
      if (navigator.canShare && navigator.canShare({ files: fileObjects })) {
        try {
          await navigator.share({
            title: 'Shared Files',
            text: `Here are ${fileObjects.length} file(s) for you.`,
            files: fileObjects, 
          });
          console.log("Mobile native share popup opened successfully");
          setSelectedFiles([]);
          setIsSharing(false);
          return; // Agar native share chal gaya, toh yahi ruk jao
        } catch (error) {
          console.log("Native share failed or was cancelled. Triggering PC fallback...");
        }
      }

      // 3. PC FALLBACK (Jab direct file share fail ho jaye)
      console.log("PC detected. Generating share links instead of direct files...");
      
      let linkText = `Hey, I am sharing ${fileDataArray.length} file(s) with you:\n\n`;
      
      // Har select ki hui file ka backend se share link generate 
      for (const fd of fileDataArray) {
         const res = await axios.put(`http://localhost:8080/api/files/generate-share-link/${fd.id}`);
         const shareToken = res.data;
         const shareLink = `http://localhost:5173/shared/${shareToken}`;
         linkText += `- ${fd.name}: ${shareLink}\n`;
      }

      // Link automatically copied
      navigator.clipboard.writeText(linkText);

      // open whatsapp
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
      <div className="content-area">
        <Header onSearch={setSearchTerm} user={user} />

        <div className="content-padding">
          {/* Action Bar */}
          {selectedFiles.length > 0 && currentTab !== 'trash' && (
            <div style={{ background: '#e8f0fe', padding: '10px 20px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ color: '#1a73e8', fontWeight: '500' }}>{selectedFiles.length} item(s) selected</span>
              
              <button 
                onClick={handleShare} 
                disabled={isSharing}
                style={{ 
                  background: isSharing ? '#a0c3ff' : '#1a73e8', 
                  color: 'white', 
                  border: 'none', 
                  padding: '8px 16px', 
                  borderRadius: '4px', 
                  cursor: isSharing ? 'not-allowed' : 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '5px' 
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