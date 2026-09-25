const API_BASE = '/api';

function getHeaders() {
  const token = localStorage.getItem('sangam_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request(endpoint, options = {}) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...getHeaders(),
      ...(options.headers || {})
    }
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg = data.error || `HTTP error ${res.status}`;
    const error = new Error(errorMsg);
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

export const api = {
  // Auth
  auth: {
    login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    register: (details) => request('/auth/register', { method: 'POST', body: JSON.stringify(details) }),
    me: () => request('/auth/me'),
    updateLanguage: (preferredLanguage) => request('/auth/language', { method: 'PATCH', body: JSON.stringify({ preferredLanguage }) })
  },

  // Citizens
  citizens: {
    me: () => request('/citizens/me'),
    list: (search) => request(`/citizens${search ? `?search=${encodeURIComponent(search)}` : ''}`),
    getCitizen360: (id) => request(`/citizens/${id}/360`)
  },

  // Applications
  applications: {
    create: (data) => request('/applications', { method: 'POST', body: JSON.stringify(data) }),
    list: (params = {}) => {
      const q = new URLSearchParams();
      if (params.status) q.append('status', params.status);
      if (params.department) q.append('department', params.department);
      if (params.search) q.append('search', params.search);
      return request(`/applications?${q.toString()}`);
    },
    getById: (id) => request(`/applications/${id}`),
    updateStatus: (id, status, remarks) => request(`/applications/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, remarks })
    })
  },

  // Consents
  consents: {
    list: () => request('/consents'),
    approve: (id) => request(`/consents/${id}/approve`, { method: 'POST' }),
    reject: (id, reason) => request(`/consents/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
    revoke: (id) => request(`/consents/${id}/revoke`, { method: 'POST' })
  },

  // Integrations
  integrations: {
    sync: (payload) => request('/integrations/sync', { method: 'POST', body: JSON.stringify(payload) }),
    getEvents: (params = {}) => {
      const q = new URLSearchParams();
      if (params.status) q.append('status', params.status);
      if (params.department) q.append('department', params.department);
      if (params.search) q.append('search', params.search);
      return request(`/integrations/events?${q.toString()}`);
    },
    getEventById: (id) => request(`/integrations/events/${id}`),
    retry: (id) => request(`/integrations/events/${id}/retry`, { method: 'POST' }),
    toggleFailure: (failureMode) => request('/integrations/toggle-failure', { method: 'POST', body: JSON.stringify({ failureMode }) })
  },

  // Admin
  admin: {
    getStats: () => request('/admin/stats'),
    getConnectors: () => request('/admin/connectors'),
    toggleConnector: (id, enabled) => request(`/admin/connectors/${id}`, { method: 'PATCH', body: JSON.stringify({ enabled }) }),
    testConnector: (id) => request(`/admin/connectors/${id}/test`, { method: 'POST' }),
    getAuditLogs: (params = {}) => {
      const q = new URLSearchParams();
      if (params.limit) q.append('limit', params.limit);
      if (params.action) q.append('action', params.action);
      return request(`/admin/audit-logs?${q.toString()}`);
    },
    getDataQualityIssues: (resolved) => request(`/admin/data-quality${resolved !== undefined ? `?resolved=${resolved}` : ''}`),
    resolveDataQualityIssue: (id) => request(`/admin/data-quality/${id}/resolve`, { method: 'PATCH' }),
    resetData: () => request('/admin/reset', { method: 'POST' })
  },

  // Notifications
  notifications: {
    list: () => request('/notifications'),
    markRead: (id) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
    markAllRead: () => request('/notifications/read-all', { method: 'POST' })
  },

  // AI Assistant
  ai: {
    chat: (message, language) => request('/ai/chat', { method: 'POST', body: JSON.stringify({ message, language }) })
  }
};
