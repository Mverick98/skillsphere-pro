import axios, { AxiosError } from 'axios';

// API base URL - use relative URL for production (ngrok), absolute for dev
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear auth data and redirect to login
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('user_type');
      sessionStorage.removeItem('user_data');

      // Determine which login page to redirect to
      const userType = sessionStorage.getItem('user_type');
      if (userType === 'admin') {
        window.location.href = '/admin/login';
      } else {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Helper to handle API errors consistently
const handleApiError = (error: unknown, defaultMessage: string) => {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.detail || error.response?.data?.error || defaultMessage;
    return { success: false, error: message };
  }
  return { success: false, error: defaultMessage };
};

export const api = {
  // ============ ADMIN ENDPOINTS ============
  admin: {
    login: async (email: string, password: string) => {
      try {
        const { data } = await apiClient.post('/admin/login', { email, password });
        return data;
      } catch (error) {
        return handleApiError(error, 'Invalid credentials');
      }
    },

    getDashboardStats: async () => {
      try {
        const { data } = await apiClient.get('/admin/dashboard/stats');
        return data;
      } catch (error) {
        console.error('Failed to get dashboard stats:', error);
        throw error;
      }
    },

    getTemplates: async () => {
      try {
        const { data } = await apiClient.get('/admin/templates');
        return data;
      } catch (error) {
        console.error('Failed to get templates:', error);
        return [];
      }
    },

    getTemplate: async (id: string) => {
      try {
        const { data } = await apiClient.get(`/admin/templates/${id}`);
        return data;
      } catch (error) {
        console.error('Failed to get template:', error);
        throw error;
      }
    },

    getTemplateDetails: async (id: string) => {
      try {
        const { data } = await apiClient.get(`/admin/templates/${id}/details`);
        return data;
      } catch (error) {
        console.error('Failed to get template details:', error);
        throw error;
      }
    },

    createTemplate: async (templateData: {
      name: string;
      description: string;
      role_id: string;
      skill_ids: string[];
      task_ids: string[];
    }) => {
      try {
        const { data } = await apiClient.post('/admin/templates', templateData);
        return { success: true, ...data };
      } catch (error) {
        return handleApiError(error, 'Failed to create template');
      }
    },

    updateTemplate: async (
      id: string,
      templateData: {
        name: string;
        description: string;
        role_id: string;
        skill_ids: string[];
        task_ids: string[];
      }
    ) => {
      try {
        const { data } = await apiClient.put(`/admin/templates/${id}`, templateData);
        return { success: true, ...data };
      } catch (error) {
        return handleApiError(error, 'Failed to update template');
      }
    },

    deleteTemplate: async (id: string) => {
      try {
        await apiClient.delete(`/admin/templates/${id}`);
        return { success: true };
      } catch (error) {
        return handleApiError(error, 'Failed to delete template');
      }
    },

    duplicateTemplate: async (id: string) => {
      try {
        const { data } = await apiClient.post(`/admin/templates/${id}/duplicate`);
        return { success: true, ...data };
      } catch (error) {
        return handleApiError(error, 'Failed to duplicate template');
      }
    },

    inviteCandidates: async (templateId: string, emails: string[]) => {
      try {
        const { data } = await apiClient.post(`/admin/templates/${templateId}/invite`, { emails });
        return { success: true, ...data };
      } catch (error) {
        return handleApiError(error, 'Failed to invite candidates');
      }
    },

    getCandidates: async (filters?: { template_id?: string; status?: string; search?: string }) => {
      try {
        const params = new URLSearchParams();
        if (filters?.template_id && filters.template_id !== 'all') {
          params.append('template_id', filters.template_id);
        }
        if (filters?.status && filters.status !== 'all') {
          params.append('status', filters.status);
        }
        if (filters?.search) {
          params.append('search', filters.search);
        }

        const { data } = await apiClient.get(`/admin/candidates?${params.toString()}`);
        return data;
      } catch (error) {
        console.error('Failed to get candidates:', error);
        return [];
      }
    },

    getCandidateReport: async (inviteId: string) => {
      try {
        const { data } = await apiClient.get(`/admin/candidates/${inviteId}/report`);
        return data;
      } catch (error) {
        console.error('Failed to get candidate report:', error);
        throw error;
      }
    },

    resendInvite: async (inviteId: string) => {
      try {
        await apiClient.post(`/admin/candidates/${inviteId}/resend-invite`);
        return { success: true };
      } catch (error) {
        return handleApiError(error, 'Failed to resend invite');
      }
    },

    deleteInvite: async (inviteId: string) => {
      try {
        await apiClient.delete(`/admin/invites/${inviteId}`);
        return { success: true };
      } catch (error) {
        return handleApiError(error, 'Failed to delete invite');
      }
    },

    downloadReportPdf: async (inviteId: string) => {
      try {
        const response = await apiClient.get(`/admin/candidates/${inviteId}/report/pdf`, {
          responseType: 'blob',
        });
        return response.data;
      } catch (error) {
        console.error('Failed to download PDF:', error);
        throw error;
      }
    },

    sendReportEmail: async (inviteId: string, email?: string) => {
      try {
        await apiClient.post(`/admin/candidates/${inviteId}/report/send`, { email });
        return { success: true };
      } catch (error) {
        return handleApiError(error, 'Failed to send email');
      }
    },

    getUsers: async (filters?: { search?: string; role_id?: string }) => {
      try {
        const params = new URLSearchParams();
        if (filters?.search) {
          params.append('search', filters.search);
        }
        if (filters?.role_id && filters.role_id !== 'all') {
          params.append('role_id', filters.role_id);
        }
        const { data } = await apiClient.get(`/admin/users?${params.toString()}`);
        return data;
      } catch (error) {
        console.error('Failed to get users:', error);
        return [];
      }
    },

    getProctoringViolations: async (assessmentId: string) => {
      try {
        const { data } = await apiClient.get(`/admin/assessments/${assessmentId}/proctoring/violations`);
        return data;
      } catch (error) {
        console.error('Failed to get proctoring violations:', error);
        return { post_hoc_violations: [], real_time_events: [], summary: {} };
      }
    },
  },

  // ============ CANDIDATE ENDPOINTS ============
  candidate: {
    login: async (email: string, password: string) => {
      try {
        const { data } = await apiClient.post('/candidate/login', { email, password });
        return data;
      } catch (error) {
        return handleApiError(error, 'Invalid credentials');
      }
    },

    register: async (name: string, email: string, password: string, job_role_id: string) => {
      try {
        const { data } = await apiClient.post('/candidate/register', {
          name,
          email,
          password,
          job_role_id,
        });
        return data;
      } catch (error) {
        return handleApiError(error, 'Failed to register');
      }
    },

    getProfile: async () => {
      try {
        const { data } = await apiClient.get('/candidate/profile');
        return data;
      } catch (error) {
        console.error('Failed to get profile:', error);
        throw error;
      }
    },

    updateProfile: async (job_role_id: string) => {
      try {
        const { data } = await apiClient.patch('/candidate/profile', { job_role_id });
        return data;
      } catch (error) {
        return handleApiError(error, 'Failed to update profile');
      }
    },

    getDashboard: async () => {
      try {
        const { data } = await apiClient.get('/candidate/dashboard');
        return data;
      } catch (error) {
        console.error('Failed to get dashboard:', error);
        throw error;
      }
    },

    getTests: async () => {
      try {
        const { data } = await apiClient.get('/candidate/tests');
        return data;
      } catch (error) {
        console.error('Failed to get tests:', error);
        return [];
      }
    },

    getTestDetails: async (inviteId: string) => {
      try {
        const { data } = await apiClient.get(`/candidate/tests/${inviteId}`);
        return data;
      } catch (error) {
        console.error('Failed to get test details:', error);
        throw error;
      }
    },

    startAssignedTest: async (inviteId: string) => {
      try {
        const { data } = await apiClient.post(`/candidate/tests/${inviteId}/start`);
        return { success: true, ...data };
      } catch (error) {
        return handleApiError(error, 'Failed to start test');
      }
    },

    getAvailableRoles: async () => {
      try {
        const { data } = await apiClient.get('/candidate/available-roles');
        return data;
      } catch (error) {
        console.error('Failed to get available roles:', error);
        return [];
      }
    },

    getRoleRequests: async () => {
      try {
        const { data } = await apiClient.get('/candidate/role-requests');
        return data;
      } catch (error) {
        console.error('Failed to get role requests:', error);
        return [];
      }
    },

    createRoleRequest: async (role_id: string) => {
      try {
        const { data } = await apiClient.post('/candidate/role-requests', { role_id });
        return { success: true, ...data };
      } catch (error) {
        return handleApiError(error, 'Failed to create role request');
      }
    },

    searchSkills: async (query: string = '') => {
      try {
        const { data } = await apiClient.get('/candidate/search-skills', {
          params: { q: query }
        });
        return data;
      } catch (error) {
        console.error('Failed to search skills:', error);
        return [];
      }
    },

    getProctoringViolations: async (assessmentId: string) => {
      try {
        const { data } = await apiClient.get(`/assessments/${assessmentId}/proctoring/my-violations`);
        return data;
      } catch (error) {
        console.error('Failed to get proctoring violations:', error);
        return { violations: [], events: [], summary: {} };
      }
    },
  },

  // ============ SHARED ENDPOINTS ============
  roles: {
    getAll: async () => {
      try {
        const { data } = await apiClient.get('/roles');
        return data;
      } catch (error) {
        console.error('Failed to get roles:', error);
        return [];
      }
    },

    getById: async (roleId: string) => {
      try {
        const { data } = await apiClient.get(`/roles/${roleId}`);
        return data;
      } catch (error) {
        console.error('Failed to get role:', error);
        throw error;
      }
    },

    getSkills: async (roleId: string) => {
      try {
        const { data } = await apiClient.get(`/roles/${roleId}/skills`);
        // Map backend response to frontend expected format
        return data.map((skill: {
          id: string;
          display_name?: string;
          name: string;
          description: string;
          importance: string;
          tasks?: { id: string; name: string }[];
        }) => ({
          ...skill,
          name: skill.display_name || skill.name,
          tasks: skill.tasks || [],
        }));
      } catch (error) {
        console.error('Failed to get skills:', error);
        return [];
      }
    },
  },

  skills: {
    getDetails: async (skillId: string) => {
      try {
        const { data } = await apiClient.get(`/skills/${skillId}/details`);
        return data;
      } catch (error) {
        console.error('Failed to get skill details:', error);
        return null;
      }
    },

    getTasks: async (skillId: string) => {
      try {
        const { data } = await apiClient.get(`/skills/${skillId}/tasks`);
        return data;
      } catch (error) {
        console.error('Failed to get tasks:', error);
        return [];
      }
    },
  },

  assessments: {
    start: async (assessmentData: {
      role_id: string;
      skill_ids: string[];
      task_ids: string[];
      assessment_type: 'skill' | 'persona';
    }) => {
      try {
        const { data } = await apiClient.post('/assessments/start', assessmentData);
        return { success: true, ...data };
      } catch (error) {
        return handleApiError(error, 'Failed to start assessment');
      }
    },

    submitAnswer: async (
      assessmentId: string,
      answerData: {
        question_id: string;
        selected_option: string;
        time_taken_seconds: number;
      }
    ) => {
      try {
        const { data } = await apiClient.post(
          `/assessments/${assessmentId}/submit-answer`,
          answerData
        );
        return { success: true, ...data };
      } catch (error) {
        return handleApiError(error, 'Failed to submit answer');
      }
    },

    complete: async (assessmentId: string) => {
      try {
        const { data } = await apiClient.post(`/assessments/${assessmentId}/complete`);
        return { success: true, ...data };
      } catch (error) {
        return handleApiError(error, 'Failed to complete assessment');
      }
    },

    getResults: async (assessmentId: string) => {
      try {
        const { data } = await apiClient.get(`/assessments/${assessmentId}/results`);
        return data;
      } catch (error) {
        console.error('Failed to get results:', error);
        throw error;
      }
    },
  },

  proctoring: {
    recordEvent: async (
      assessmentId: string,
      eventType: string,
      metadata?: Record<string, unknown>
    ) => {
      try {
        // Backend requires timestamp as separate field
        const { timestamp, ...restMetadata } = metadata || {};
        await apiClient.post(`/assessments/${assessmentId}/proctoring/event`, {
          event_type: eventType,
          timestamp: timestamp || new Date().toISOString(),
          metadata: Object.keys(restMetadata).length > 0 ? restMetadata : null,
        });
        return { success: true };
      } catch (error) {
        // Silent fail for proctoring events - don't interrupt assessment
        console.warn('Failed to record proctoring event:', error);
        return { success: false };
      }
    },

    uploadSnapshot: async (assessmentId: string, imageData: string) => {
      try {
        await apiClient.post(`/assessments/${assessmentId}/proctoring/snapshot`, {
          image_data: imageData,
        });
        return { success: true };
      } catch (error) {
        console.warn('Failed to upload snapshot:', error);
        return { success: false };
      }
    },

    getSummary: async (assessmentId: string) => {
      try {
        const { data } = await apiClient.get(`/assessments/${assessmentId}/proctoring/summary`);
        return data;
      } catch (error) {
        console.error('Failed to get proctoring summary:', error);
        throw error;
      }
    },

    uploadVideoChunk: async (assessmentId: string, blob: Blob, chunkIndex: number) => {
      try {
        const formData = new FormData();
        formData.append('video', blob, `chunk_${chunkIndex}.webm`);
        formData.append('chunk_index', chunkIndex.toString());

        await apiClient.post(`/assessments/${assessmentId}/proctoring/upload-chunk`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return { success: true };
      } catch (error) {
        console.warn('Failed to upload video chunk:', error);
        return { success: false };
      }
    },

    finalizeRecording: async (assessmentId: string) => {
      try {
        const { data } = await apiClient.post(`/assessments/${assessmentId}/proctoring/finalize-recording`);
        return { success: true, ...data };
      } catch (error) {
        console.warn('Failed to finalize recording:', error);
        return { success: false };
      }
    },
  },

  invite: {
    validate: async (token: string) => {
      try {
        const { data } = await apiClient.get(`/invite/${token}`);
        return { valid: true, ...data };
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          return { valid: false, error: 'Invalid or expired invite' };
        }
        return { valid: false, error: 'Failed to validate invite' };
      }
    },
  },
};

export default api;
