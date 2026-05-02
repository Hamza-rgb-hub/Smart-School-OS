import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = 'https://smart-school-os.onrender.com';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sso_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'Something went wrong';
    const status = error.response?.status;

    if (status === 401) {
      localStorage.removeItem('sso_token');
      localStorage.removeItem('sso_user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    } else if (status !== 400 && status !== 404) {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default api;
