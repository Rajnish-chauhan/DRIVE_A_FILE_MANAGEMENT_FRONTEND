import api from './axiosConfig';

export const fetchFilesApi = (tab) => api.get(`/api/files/${tab}`);
export const uploadFileApi = (formData) => api.post('/api/files/upload', formData, {
  headers: { "Content-Type": "multipart/form-data" }
});
export const downloadFileApi = (id) => api.get(`/api/files/download/${id}`, {
     responseType: 'blob' 
    });
export const deleteFileApi = (id) => api.delete(`/api/files/delete/${id}`);
export const trashFileApi = (id) => api.put(`/api/files/trash/${id}`);
export const restoreFileApi = (id) => api.put(`/api/files/restore/${id}`);
export const shareFileApi = (id) => api.put(`/api/files/share/${id}`);
export const getStorageApi = () => api.get('/api/files/storage');