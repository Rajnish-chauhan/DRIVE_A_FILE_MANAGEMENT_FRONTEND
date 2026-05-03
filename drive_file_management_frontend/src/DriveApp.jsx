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

  useEffect(() => {
    fetchFiles(currentTab);
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

  const handleDownload = (id) => {
    window.location.href = `http://localhost:8080/api/files/download/${id}`;
  };

  const handleDelete = async (id, fileName) => {
    const confirmed = window.confirm(
      currentTab === 'trash' ? `Delete "${fileName}" permanently?` : `Move "${fileName}" to Trash?`
    );
    if (!confirmed) return;

    if (currentTab === 'trash') {
      await axios.delete(`http://localhost:8080/api/files/delete/${id}`);
    } else {
      await axios.put(`http://localhost:8080/api/files/trash/${id}`);
    }
    fetchFiles(currentTab);
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
          <h2 className="tab-title">{currentTab === 'home' ? 'My Drive' : currentTab}</h2>
          {filteredFiles.length === 0 ? (
            <div className="empty-state">
              <img src="https://ssl.gstatic.com/docs/doclist/images/empty_state_my_drive_v2.svg" alt="No Files" style={{ width: "250px" }} />
              <p>Not Found</p>
            </div>
          ) : (
            <div className="files-grid">
              {filteredFiles.map((file) => (
                <FileCard key={file.id} file={file} onDownload={handleDownload} onDelete={() => handleDelete(file.id, file.name)} isTrash={currentTab === 'trash'} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DriveApp;