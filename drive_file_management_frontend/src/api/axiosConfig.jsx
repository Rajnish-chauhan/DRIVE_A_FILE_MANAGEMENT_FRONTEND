import axios from 'axios';
import URL_TEST from '../jsconfig';

const api = axios.create({
  baseURL: URL_TEST,
  withCredentials: true
});

export default api;