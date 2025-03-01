import axios from 'axios';

axios.defaults.withCredentials = true;

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000'
});

// Add request interceptor to include auth token
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  response => response,
  error => Promise.reject(error.response?.data || error)
);

export default instance;