import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor to attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bt_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Response interceptor to handle 401 unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        localStorage.removeItem('bt_auth_token');
        localStorage.removeItem('bt_auth_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  async register(name, email, password) {
    const res = await api.post('/api/auth/register', { name, email, password });
    return res.data;
  },
  async login(email, password) {
    const res = await api.post('/api/auth/login', { email, password });
    return res.data;
  },
  async getMe() {
    const res = await api.get('/api/auth/me');
    return res.data;
  }
};

export const predictionService = {
  async runPrediction(file, modelName) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('model_name', modelName);
    const res = await api.post('/api/predictions', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return res.data;
  },
  async getHistory(params = {}) {
    const res = await api.get('/api/predictions', { params });
    return res.data;
  },
  async getById(id) {
    const res = await api.get(`/api/predictions/${id}`);
    return res.data;
  },
  async deleteById(id) {
    const res = await api.delete(`/api/predictions/${id}`);
    return res.data;
  },
  async getDashboardStats() {
    const res = await api.get('/api/predictions/dashboard-stats');
    return res.data;
  },
  async downloadReport(id) {
    const res = await api.get(`/api/predictions/${id}/report`, {
      responseType: 'blob'
    });
    return res.data;
  },
  getImageUrl(imageFilename) {
    return `${API_BASE_URL}/api/predictions/images/${imageFilename}`;
  }
};

export const analyticsService = {
  async getModelComparison() {
    const res = await api.get('/api/analytics/model-comparison');
    return res.data;
  },
  async getClassificationReport() {
    const res = await api.get('/api/analytics/classification-report');
    return res.data;
  },
  async getPcaData() {
    const res = await api.get('/api/analytics/pca');
    return res.data;
  },
  async getClustersData() {
    const res = await api.get('/api/analytics/clusters');
    return res.data;
  },
  async getAprioriData() {
    const res = await api.get('/api/analytics/apriori');
    return res.data;
  },
  getConfusionMatrixUrl() {
    return `${API_BASE_URL}/api/analytics/confusion-matrix`;
  },
  getPcaImageUrl() {
    return `${API_BASE_URL}/api/analytics/pca/image`;
  },
  getClusterImageUrl() {
    return `${API_BASE_URL}/api/analytics/clusters/image`;
  }
};

export default api;
