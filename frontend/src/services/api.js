import axios from 'axios';

export const API_BASE_URL = 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Response interceptor to handle session expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, new_password) => api.post('/auth/reset-password', { token, new_password }),
};

export const employeesAPI = {
  getAll: (params) => api.get('/employees/', { params }),
  getById: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post('/employees/', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  delete: (id) => api.delete(`/employees/${id}`),
};

export const departmentsAPI = {
  getAll: () => api.get('/departments/'),
  getById: (id) => api.get(`/departments/${id}`),
  create: (data) => api.post('/departments/', data),
  update: (id, data) => api.put(`/departments/${id}`, data),
  delete: (id) => api.delete(`/departments/${id}`),
};

export const attendanceAPI = {
  getAll: (params) => api.get('/attendance/', { params }),
  getTodayStatus: () => api.get('/attendance/today-status'),
  checkIn: (data) => api.post('/attendance/check-in', data),
  checkOut: (data) => api.post('/attendance/check-out', data),
  assignShift: (employeeId, shiftType) => api.post('/attendance/assign-shift', { employee_id: employeeId, shift_type: shiftType }),
  updateShift: (attendanceId, shiftType) => api.put(`/attendance/${attendanceId}/shift?shift_type=${encodeURIComponent(shiftType)}`),
  resetToday: () => api.post('/attendance/reset-today'),
};

export const leavesAPI = {
  getAll: (params) => api.get('/leaves/', { params }),
  apply: (data) => api.post('/leaves/apply', data),
  review: (id, data) => api.put(`/leaves/${id}/review`, data),
  cancel: (id) => api.delete(`/leaves/${id}`),
  getBalance: (empId) => api.get(`/leaves/balance/${empId}`),
};

export const payrollAPI = {
  getAll: (params) => api.get('/payroll/', { params }),
  generate: (data) => api.post('/payroll/generate', data),
  markPaid: (id) => api.post(`/payroll/${id}/pay`),
  getPayslip: (id) => api.get(`/payroll/payslip/${id}`),
};

export const notificationsAPI = {
  getAll: () => api.get('/notifications/'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/mark-all-read'),
};

export const chatAPI = {
  getUsers: () => api.get('/chat/users'),
  getHistory: (userId) => api.get(`/chat/history/${userId}`),
  sendMessage: (receiver_id, message) => api.post('/chat/send', { receiver_id, message }),
};

export const documentsAPI = {
  getAll: (params) => api.get('/documents/', { params }),
  upload: (formData) => api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (id) => api.delete(`/documents/${id}`),
  downloadUrl: (id) => `${API_BASE_URL}/documents/download/${id}`,
};

export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
};

export const datasetsAPI = {
  getAll: () => api.get('/datasets/'),
  upload: (formData) => api.post('/datasets/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getPreview: (id) => api.get(`/datasets/${id}/preview`),
  delete: (id) => api.delete(`/datasets/${id}`),
};

export const aiAPI = {
  getModelInfo: () => api.get('/ai/model-info'),
  retrain: (datasetPath) => api.post('/ai/train', null, { params: { dataset_path: datasetPath } }),
  predict: (data) => api.post('/ai/predict', data),
  getOverview: () => api.get('/ai/overview'),
  getForecasting: () => api.get('/ai/forecasting'),
  getRiskHistory: (empId) => api.get(`/ai/risk-history/${empId}`),
  getRecommendations: () => api.get('/ai/recommendations/workforce'),
  getStability: () => api.get('/ai/stability'),
};

export const interventionsAPI = {
  getAll: (params) => api.get('/interventions/', { params }),
  create: (data) => api.post('/interventions/', data),
  updateStatus: (id, data) => api.put(`/interventions/${id}/status`, data),
  getRecommendations: (empId) => api.get(`/interventions/recommendations/${empId}`),
};

export const monitoringAPI = {
  getFeed: () => api.get('/monitoring/feed'),
  getInstabilityStatus: () => api.get('/monitoring/instability-status'),
};

// --- PHASE 3 APIS ---

export const reportsAPI = {
  getSummary: () => api.get('/reports/summary'),
  getEmployees: (params) => api.get('/reports/employees', { params }),
  getAttrition: (params) => api.get('/reports/attrition', { params }),
  getPayroll: (params) => api.get('/reports/payroll', { params }),
  getAttendance: (params) => api.get('/reports/attendance', { params }),
  exportCsv: (reportType) => `${API_BASE_URL}/reports/export/csv?report_type=${reportType}`,
  exportExcel: (reportType) => `${API_BASE_URL}/reports/export/excel?report_type=${reportType}`,
  exportPdf: (reportType) => `${API_BASE_URL}/reports/export/pdf?report_type=${reportType}`,
};

export const auditAPI = {
  getLogs: (params) => api.get('/audit/logs', { params }),
  getStats: () => api.get('/audit/stats'),
  logEvent: (action, module, details) => api.post('/audit/log', null, { params: { action, module, details } }),
};

export const tasksAPI = {
  getAll: (params) => api.get('/tasks/', { params }),
  getStats: () => api.get('/tasks/stats'),
  create: (data) => api.post('/tasks/', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  updateStatus: (id, status) => api.patch(`/tasks/${id}/status`, { status }),
  delete: (id) => api.delete(`/tasks/${id}`),
};

export const performanceAPI = {
  getAll: (params) => api.get('/performance/reviews', { params }),
  getStats: () => api.get('/performance/stats'),
  getByEmployee: (empId) => api.get(`/performance/employee/${empId}`),
  create: (data) => api.post('/performance/reviews', data),
  update: (id, data) => api.put(`/performance/reviews/${id}`, data),
  delete: (id) => api.delete(`/performance/reviews/${id}`),
};

export const searchAPI = {
  globalSearch: (params) => api.get('/search/global', { params }),
};

export default api;

