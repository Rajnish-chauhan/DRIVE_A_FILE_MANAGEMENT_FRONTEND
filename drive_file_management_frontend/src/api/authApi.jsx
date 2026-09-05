import api from './axiosConfig';

export const loginApi = (data) => api.post('/api/auth/login', data);
export const registerApi = (data) => api.post('/api/auth/register', data);
export const verifyOtpApi = (data) => api.post('/api/auth/verify-otp', data);
export const fetchUserApi = () => api.get('/api/auth/me');
export const logoutApi = () => api.post('/api/auth/logout');