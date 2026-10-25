import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://civicfix-t3mx.onrender.com';

const API = axios.create({
  baseURL: API_BASE_URL,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;