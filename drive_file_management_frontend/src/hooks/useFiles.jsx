import { useState, useCallback } from 'react';
import { fetchFilesApi, uploadFileApi, downloadFileApi, trashFileApi, deleteFileApi, restoreFileApi, shareFileApi, getStorageApi } from '../api/fileApi';

export const useFiles = (currentTab) => {
  const [files, setFiles] = useState([]);
  const [storageUsed, setStorageUsed] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const fetchFiles = useCallback(async () => {
    if (currentTab === "storage") return;
    try {
      setIsLoading(true);
      let backendTab = currentTab;
      if (currentTab === "recent") backendTab = "recents";
      if (currentTab === "shared") backendTab = "share";

      const res = await fetchFilesApi(backendTab);
      let fetchedData = res.data;

      if (backendTab === 'recents') {
        fetchedData = fetchedData.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      }
      setFiles(Array.isArray(fetchedData) ? fetchedData : []);
    } catch (err) {
      console.error("Fetch Error:", err);
      setFiles([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentTab]);

  const fetchStorage = useCallback(async () => {
    try {
      const res = await getStorageApi();
      setStorageUsed(Number(res.data) || 0);
    } catch (err) {
      console.error("Storage Error:", err);
    }
  }, []);

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      await uploadFileApi(formData);
      fetchFiles();
      fetchStorage();
    } catch (error) {
      alert(error.response?.data || "Upload failed.");
    }
  };

  const downloadFile = async (file) => {
    try {
      const response = await downloadFileApi(file.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.name);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert("Download failed! Missing from Google Drive.");
    }
  };

  const removeFile = async (id, fileName) => {
    const confirmed = window.confirm(currentTab === 'trash' ? `Delete "${fileName}" permanently?` : `Move "${fileName}" to Trash?`);
    if (!confirmed) return false;
    try {
      if (currentTab === 'trash') await deleteFileApi(id);
      else await trashFileApi(id);
      fetchFiles();
      return true; // Success
    } catch (error) {
      alert("Delete failed!");
      return false;
    }
  };

  const restoreFile = async (id, fileName) => {
    const confirmed = window.confirm(`Restore "${fileName}" from Trash?`);
    if (!confirmed) return false;
    try {
      await restoreFileApi(id);
      fetchFiles();
      return true;
    } catch (error) {
      alert("Restore failed!");
      return false;
    }
  };

  const shareSelectedFiles = async (selectedFiles, setSelectedFiles) => {
    if (selectedFiles.length === 0) return;
    setIsSharing(true);
    const getMimeType = (filename) => {
      const ext = filename.split('.').pop().toLowerCase();
      const types = { 'png': 'image/png', 'jpg': 'image/jpeg', 'pdf': 'application/pdf', 'mp4': 'video/mp4' };
      return types[ext] || 'application/octet-stream';
    };

    try {
      const fileObjects = [];
      for (const fileId of selectedFiles) {
        try { await shareFileApi(fileId); } catch (e) { console.warn("DB share update failed", e); }
        const fileMeta = files.find(f => f.id === fileId);
        const fileName = fileMeta ? fileMeta.name : `shared_file_${fileId}`;
        const response = await downloadFileApi(fileId);
        fileObjects.push(new File([response.data], fileName, { type: getMimeType(fileName) }));
      }

      fetchFiles(); // Refresh UI
      if (navigator.canShare && navigator.canShare({ files: fileObjects })) {
        await navigator.share({ title: 'Shared Files', files: fileObjects });
        setSelectedFiles([]);
        return;
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
      alert("Share failed.");
    } finally {
      setIsSharing(false);
    }
  };

  return { 
    files, storageUsed, isLoading, isSharing, 
    fetchFiles, fetchStorage, uploadFile, downloadFile, removeFile, restoreFile, shareSelectedFiles 
  };
};