import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Error interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// ============================================
// HEALTH & MODELS
// ============================================
export const health = async () => apiClient.get('/health');
export const getModels = async () => apiClient.get('/models/huggingface');

// ============================================
// DASHBOARD
// ============================================
export const getDashboardOverview = async () => apiClient.get('/dashboard/overview');
export const getInsights = async () => apiClient.get('/insights');

// ============================================
// ASSETS
// ============================================
export const getAssets = async () => apiClient.get('/assets');
export const getAssetById = async (id: string) => apiClient.get(`/assets/${id}`);
export const createAsset = async (data: any) => apiClient.post('/assets', data);

// ============================================
// MISSIONS
// ============================================
export const getMissions = async () => apiClient.get('/missions');
export const createMission = async (data: any) => apiClient.post('/missions', data);
export const getSampleImages = async () => apiClient.get('/sample-images');
export const inspectSample = async (data: any) => apiClient.post('/inspect-sample', data);

// ============================================
// IMAGE INSPECTION & BATCH PROCESSING
// ============================================
export const inspectBatch = async (formData: FormData) =>
  apiClient.post('/inspect-batch', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const reanalyzeImage = async (data: any) =>
  apiClient.post('/inspect/reanalyze', data);

// ============================================
// REVIEWS & HUMAN-IN-THE-LOOP
// ============================================
export const verifySingleReview = async (data: any) =>
  apiClient.post('/reviews/verify', data);

export const verifyBatchReview = async (data: any) =>
  apiClient.post('/reviews/verify-batch', data);

// ============================================
// REPORTS
// ============================================
export const getReports = async () => apiClient.get('/reports');
export const getReportById = async (id: string) => apiClient.get(`/reports/${id}`);
export const createReport = async (data: any) => apiClient.post('/reports', data);
export const generateReportFromVideoAudit = async (data: any) =>
  apiClient.post('/reports/from-video-audit', data);

// ============================================
// MAINTENANCE & WORK ORDERS
// ============================================
export const getMaintenance = async () => apiClient.get('/maintenance');
export const createWorkOrder = async (data: any) => apiClient.post('/maintenance', data);
export const updateWorkOrder = async (id: string, data: any) =>
  apiClient.put(`/maintenance/${id}`, data);

// ============================================
// NOTIFICATIONS
// ============================================
export const getNotifications = async () => apiClient.get('/notifications');
export const markNotificationsAsRead = async () =>
  apiClient.post('/notifications/mark-read');

// ============================================
// SETTINGS
// ============================================
export const getSettings = async () => apiClient.get('/settings');
export const updateSettings = async (data: any) => apiClient.post('/settings', data);

// ============================================
// VIDEO INSPECTION & TELEMETRY
// ============================================
export const inspectVideoFrame = async (data: any) =>
  apiClient.post('/inspect-video-frame', data);

export const saveVideoAudit = async (data: any) =>
  apiClient.post('/video-audits', data);

export const getVideoAudits = async () => apiClient.get('/video-audits');
export const getVideoAuditById = async (id: string) =>
  apiClient.get(`/video-audits/${id}`);

// ============================================
// EXPORT ALL APIs
// ============================================
export default {
  health,
  getModels,
  getDashboardOverview,
  getInsights,
  getAssets,
  getAssetById,
  createAsset,
  getMissions,
  createMission,
  getSampleImages,
  inspectSample,
  inspectBatch,
  reanalyzeImage,
  verifySingleReview,
  verifyBatchReview,
  getReports,
  getReportById,
  createReport,
  generateReportFromVideoAudit,
  getMaintenance,
  createWorkOrder,
  updateWorkOrder,
  getNotifications,
  markNotificationsAsRead,
  getSettings,
  updateSettings,
  inspectVideoFrame,
  saveVideoAudit,
  getVideoAudits,
  getVideoAuditById,
};