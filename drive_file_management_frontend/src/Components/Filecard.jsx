import React from "react";
import "./Filecard.css";

const FileCard = ({ file, onDownload, onDelete, onRestore, isTrash, isSelected, onToggleSelect }) => {
  const getFileIcon = (fileName) => {
    const ext = fileName.split(".").pop().toLowerCase();
    const icons = {
      pdf: "https://cdn-icons-png.flaticon.com/512/337/337946.png",
      doc: "https://cdn-icons-png.flaticon.com/512/281/281760.png",
      docx: "https://cdn-icons-png.flaticon.com/512/10451/10451822.png",
      jpg: "https://cdn-icons-png.flaticon.com/512/136/136524.png",
      png: "https://cdn-icons-png.flaticon.com/512/11621/11621804.png",
      mp4: "https://cdn-icons-png.flaticon.com/512/29/29530.png",
      java: "https://cdn-icons-png.flaticon.com/512/5968/5968282.png"
    };
    return icons[ext] || "https://cdn-icons-png.flaticon.com/512/148/148946.png"; 
  };

  return (
    <div 
      className={`file-card ${isSelected ? 'selected' : ''}`} 
      onClick={(e) => { 
        if (!e.target.classList.contains("action-btn") && !e.target.classList.contains("file-checkbox")) {
          onDownload(file.id); 
        }
      }}
      style={{ position: 'relative' }}
    >
      <input 
        type="checkbox" 
        className="file-checkbox"
        checked={isSelected}
        onChange={() => onToggleSelect(file.id)}
        onClick={(e) => e.stopPropagation()} 
        style={{ position: 'absolute', top: '10px', left: '10px', cursor: 'pointer', transform: 'scale(1.2)' }}
      />

      <div className="card-top">
        <img src={getFileIcon(file.name)} alt="icon" className="file-icon" />
        <p className="file-name" title={file.name}>{file.name}</p>
      </div>
      
      <div className="card-bottom">
        <p className="file-size">{(file.size / 1024).toFixed(2)} KB</p>
        
        <div className="card-actions" style={{ display: 'flex', gap: '8px' }}>
          {isTrash ? (
            <>
              <button 
                className="action-btn" 
                onClick={(e) => { e.stopPropagation(); onRestore(); }}
                style={{ color: '#4CAF50', borderColor: '#4CAF50' }}
              >
                ↺ Restore
              </button>
              
              <button 
                className="action-btn" 
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                style={{ color: '#f44336', borderColor: '#f44336' }}
              >
                🗑️ Delete
              </button>
            </>
          ) : (
            <button className="action-btn" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
              🗑️ Trash
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileCard;