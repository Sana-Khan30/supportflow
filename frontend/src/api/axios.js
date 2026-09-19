import axios from 'axios';

// In dev, Vite reads frontend/.env automatically. In production (Vercel), set
// VITE_API_URL in the project's Environment Variables settings.
const BASE_URL = import.meta.env.VITE_API_URL || 'https://supportflow-gray.vercel.app';

const api = axios.create({ baseURL: `${BASE_URL}/api` });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
