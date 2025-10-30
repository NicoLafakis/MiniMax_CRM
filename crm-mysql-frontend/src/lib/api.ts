import axios from 'axios';

// API Configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Type definitions
export type Customer = {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  custom_fields?: Record<string, any>;
  tags?: string[];
  created_at: string;
  updated_at: string;
};

export type Deal = {
  id: string;
  user_id: string;
  customer_id?: string;
  title: string;
  description?: string;
  value: number;
  stage: string;
  expected_close_date?: string;
  probability: number;
  created_at: string;
  updated_at: string;
};

export type Ticket = {
  id: string;
  user_id: string;
  customer_id?: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
};

export type Activity = {
  id: string;
  user_id: string;
  customer_id?: string;
  deal_id?: string;
  ticket_id?: string;
  type: string;
  subject: string;
  description?: string;
  due_date?: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
};

export type Contract = {
  id: string;
  user_id: string;
  deal_id?: string;
  customer_id?: string;
  title: string;
  description?: string;
  value: number;
  start_date?: string;
  end_date?: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type WorkflowRule = {
  id: string;
  user_id: string;
  name: string;
  trigger_type: string;
  trigger_value: Record<string, any>;
  action_type: string;
  action_value: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Attachment = {
  id: string;
  user_id: string;
  related_type: string;
  related_id: string;
  file_name: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  created_at: string;
};

// Auth API
export const authAPI = {
  register: (email: string, password: string, full_name?: string) =>
    api.post('/auth/register', { email, password, full_name }),
  
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  getUser: () => api.get('/auth/me'),
};

// Customers API
export const customersAPI = {
  getAll: () => api.get<Customer[]>('/customers'),
  getOne: (id: string) => api.get<Customer>(`/customers/${id}`),
  create: (data: Partial<Customer>) => api.post<Customer>('/customers', data),
  update: (id: string, data: Partial<Customer>) => api.put<Customer>(`/customers/${id}`, data),
  delete: (id: string) => api.delete(`/customers/${id}`),
};

// Deals API
export const dealsAPI = {
  getAll: () => api.get<Deal[]>('/deals'),
  getOne: (id: string) => api.get<Deal>(`/deals/${id}`),
  create: (data: Partial<Deal>) => api.post<Deal>('/deals', data),
  update: (id: string, data: Partial<Deal>) => api.put<Deal>(`/deals/${id}`, data),
  delete: (id: string) => api.delete(`/deals/${id}`),
};

// Tickets API
export const ticketsAPI = {
  getAll: () => api.get<Ticket[]>('/tickets'),
  getOne: (id: string) => api.get<Ticket>(`/tickets/${id}`),
  create: (data: Partial<Ticket>) => api.post<Ticket>('/tickets', data),
  update: (id: string, data: Partial<Ticket>) => api.put<Ticket>(`/tickets/${id}`, data),
  delete: (id: string) => api.delete(`/tickets/${id}`),
};

// Activities API
export const activitiesAPI = {
  getAll: () => api.get<Activity[]>('/activities'),
  getOne: (id: string) => api.get<Activity>(`/activities/${id}`),
  create: (data: Partial<Activity>) => api.post<Activity>('/activities', data),
  update: (id: string, data: Partial<Activity>) => api.put<Activity>(`/activities/${id}`, data),
  delete: (id: string) => api.delete(`/activities/${id}`),
};

// Workflows API
export const workflowsAPI = {
  getAll: () => api.get<WorkflowRule[]>('/workflows'),
  getOne: (id: string) => api.get<WorkflowRule>(`/workflows/${id}`),
  create: (data: Partial<WorkflowRule>) => api.post<WorkflowRule>('/workflows', data),
  update: (id: string, data: Partial<WorkflowRule>) => api.put<WorkflowRule>(`/workflows/${id}`, data),
  delete: (id: string) => api.delete(`/workflows/${id}`),
};

// Attachments API
export const attachmentsAPI = {
  upload: (file: File, related_type: string, related_id: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('related_type', related_type);
    formData.append('related_id', related_id);
    return api.post<Attachment>('/attachments/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getAll: (related_type: string, related_id: string) =>
    api.get<Attachment[]>(`/attachments/${related_type}/${related_id}`),
  download: (id: string) => api.get(`/attachments/download/${id}`, { responseType: 'blob' }),
  delete: (id: string) => api.delete(`/attachments/${id}`),
};

export default api;
