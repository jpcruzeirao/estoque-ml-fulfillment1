import axios from 'axios';

// Configuração da API base
const api = axios.create({
  baseURL: 'https://5000-ititb1c80yor6utn94o91-cfed0658.manus.computer/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('ml_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Funções de API

// Autenticação
export const login = (code) => api.post('/auth/login', { code });
export const logout = () => api.post('/auth/logout');
export const checkAuth = () => api.get('/auth/check');

// Produtos
export const getProducts = () => api.get('/products');
export const getProduct = (id) => api.get(`/products/${id}`);
export const syncProducts = () => api.post('/products/sync');

// Estoque
export const getStock = () => api.get('/stock');
export const syncStock = () => api.post('/stock/sync');
export const adjustStock = (data) => api.post('/stock/adjust', data);

// Vendas
export const getSales = (period = 'month') => api.get(`/sales?period=${period}`);
export const getSalesByProduct = (productId, period = 'month') => api.get(`/sales/product/${productId}?period=${period}`);

// Atividades
export const getActivities = (type = 'all', period = 'week') => api.get(`/activities?type=${type}&period=${period}`);

// Gráficos
export const getSalesChart = () => api.get('/charts/sales');
export const getStockChart = () => api.get('/charts/stock');

// Alertas
export const getAlerts = () => api.get('/alerts');
export const getAlertSettings = () => api.get('/alerts/settings');
export const updateAlertSettings = (settings) => api.post('/alerts/settings', settings);

// Envios
export const getShipments = (status = 'all') => api.get(`/shipments?status=${status}`);
export const getShipment = (id) => api.get(`/shipments/${id}`);
export const createShipment = (data) => api.post('/shipments', data);
export const updateShipment = (id, data) => api.put(`/shipments/${id}`, data);

export default api;
