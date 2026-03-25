import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL + "/api",
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('rhms_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('rhms_token');
      localStorage.removeItem('rhms_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// Dashboard
export const dashboardAPI = {
  get: () => api.get('/dashboard'),
};

// Properties
export const propertiesAPI = {
  getAll: (params) => api.get('/properties', { params }),
  getPublic: (params) => api.get('/properties/public', { params }),
  getOne: (id) => api.get(`/properties/${id}`),
  create: (data) => api.post('/properties', data),
  update: (id, data) => api.put(`/properties/${id}`, data),
  approve: (id) => api.put(`/properties/${id}/approve`),
  reject: (id) => api.put(`/properties/${id}/reject`),
  blacklist: (id) => api.put(`/properties/${id}/blacklist`),
  delete: (id) => api.delete(`/properties/${id}`),
};



// Units
export const unitsAPI = {
  getAll: (params) => api.get('/units', { params }),
  getOne: (id) => api.get(`/units/${id}`),
  create: (data) => api.post('/units', data),
  update: (id, data) => api.put(`/units/${id}`, data),
  delete: (id) => api.delete(`/units/${id}`),
};

// Leases
export const leasesAPI = {
  getAll: (params) => api.get('/leases', { params }),
  getOne: (id) => api.get(`/leases/${id}`),
  create: (data) => api.post('/leases', data),
  terminate: (id) => api.put(`/leases/${id}/terminate`),
};

// Payments
export const paymentsAPI = {
  getAll: (params) => api.get('/payments', { params }),
  getSummary: (params) => api.get('/payments/summary', { params }),
  getArrears: () => api.get('/payments/arrears'),
  create: (data) => api.post('/payments', data),
  initializePaystack: (data) => api.post('/payments/paystack/initialize', data),
  initializeDaraja: (data) => api.post('/payments/daraja/initialize', data),
  sendReminder: (data) => api.post('/payments/remind', data),
  sendBulkReminders: () => api.post('/payments/remind-bulk'),
  downloadReceipt: (id) => api.get(`/payments/${id}/receipt`, { responseType: 'blob' }),
};

// Maintenance
export const maintenanceAPI = {
  getAll: (params) => api.get('/maintenance', { params }),
  getStats: () => api.get('/maintenance/stats'),
  create: (data) => api.post('/maintenance', data),
  update: (id, data) => api.put(`/maintenance/${id}`, data),
};

// Users
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getOne: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  approveLandlord: (id) => api.put(`/users/landlord/${id}/approve`),
  blacklistLandlord: (id) => api.put(`/users/landlord/${id}/blacklist`),
  delete: (id) => api.delete(`/users/${id}`),
};


// Reviews
export const reviewsAPI = {
  getByProperty: (propertyId) => api.get(`/reviews/${propertyId}`),
  create: (data) => api.post('/reviews', data),
  delete: (id) => api.delete(`/reviews/${id}`),
};

// Lease Requests
export const leaseRequestsAPI = {
  getAll: () => api.get('/lease-requests'),
  create: (data) => api.post('/lease-requests', data),
  updateStatus: (id, status) => api.put(`/lease-requests/${id}/status`, { status }),
};

// Complaints
export const complaintsAPI = {
  getAll: (params) => api.get('/complaints', { params }),
  create: (data) => api.post('/complaints', data),
  resolve: (id, resolution) => api.put(`/complaints/${id}/resolve`, { resolution }),
};

// Relocations
export const relocationsAPI = {
  getAll: (params) => api.get('/relocations', { params }),
  create: (data) => api.post('/relocations', data),
  updateStatus: (id, data) => api.put(`/relocations/${id}/status`, data),
  refund: (id, data) => api.post(`/relocations/${id}/refund`, data),
};

// Upload
export const uploadAPI = {
  video: (formData) => api.post('/upload/video', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

export default api;




