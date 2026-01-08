const API_BASE = 'http://localhost:8000/api';

// Helper to get auth token
const getAuthHeader = (): Record<string, string> => {
  const token = localStorage.getItem('auth_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Mock data for development - simulates API responses
const mockDelay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  // ============ ADMIN ENDPOINTS ============
  admin: {
    login: async (email: string, password: string) => {
      await mockDelay(800);
      // Mock auth - accept admin@example.com / admin123
      if (email === 'admin@example.com' && password === 'admin123') {
        const token = 'mock_admin_token_' + Date.now();
        return {
          success: true,
          token,
          user: { id: 'admin-1', name: 'Admin User', email, role: 'admin' }
        };
      }
      return { success: false, error: 'Invalid credentials' };
    },

    getDashboardStats: async () => {
      await mockDelay();
      return {
        total_templates: 5,
        total_candidates: 24,
        tests_completed: 18,
        average_score: 72,
        recent_activity: [
          { id: '1', candidate_name: 'John Smith', test_name: 'Backend Developer Assessment', status: 'completed', score: 85, date: '2025-01-07' },
          { id: '2', candidate_name: 'Sarah Johnson', test_name: 'Cloud Architect Test', status: 'in_progress', score: null, date: '2025-01-07' },
          { id: '3', candidate_name: 'Mike Williams', test_name: 'Backend Developer Assessment', status: 'pending', score: null, date: '2025-01-06' },
          { id: '4', candidate_name: 'Emily Brown', test_name: 'QA Engineer Test', status: 'completed', score: 78, date: '2025-01-06' },
          { id: '5', candidate_name: 'David Lee', test_name: 'Data Scientist Assessment', status: 'completed', score: 92, date: '2025-01-05' },
        ]
      };
    },

    getTemplates: async () => {
      await mockDelay();
      return [
        { id: 't1', name: 'Backend Developer Assessment', description: 'Full backend skills evaluation', role_name: 'Backend Developer', skills_count: 3, candidates_count: 12, created_at: '2025-01-01' },
        { id: 't2', name: 'Cloud Architect Test', description: 'Cloud infrastructure assessment', role_name: 'Cloud Architect', skills_count: 2, candidates_count: 8, created_at: '2025-01-02' },
        { id: 't3', name: 'QA Engineer Test', description: 'Quality assurance skills test', role_name: 'QA Engineer', skills_count: 4, candidates_count: 5, created_at: '2025-01-03' },
        { id: 't4', name: 'Data Scientist Assessment', description: 'ML and data analysis test', role_name: 'Data Scientist', skills_count: 3, candidates_count: 6, created_at: '2025-01-04' },
        { id: 't5', name: 'Project Manager Evaluation', description: 'PM skills assessment', role_name: 'Software Project Manager', skills_count: 2, candidates_count: 4, created_at: '2025-01-05' },
      ];
    },

    getTemplate: async (id: string) => {
      await mockDelay();
      return {
        id,
        name: 'Backend Developer Assessment',
        description: 'Comprehensive backend development skills evaluation',
        role_id: 'backend-dev',
        role_name: 'Backend Developer',
        skill_ids: ['api-design', 'database', 'testing'],
        task_ids: ['rest-endpoints', 'api-versioning', 'graphql-schema', 'api-security', 'sql-queries', 'db-indexing', 'data-modeling', 'nosql-design', 'unit-testing', 'integration-testing', 'mocking'],
      };
    },

    createTemplate: async (data: { name: string; description: string; role_id: string; skill_ids: string[]; task_ids: string[] }) => {
      await mockDelay(800);
      return { success: true, id: 'new-' + Date.now(), ...data };
    },

    updateTemplate: async (id: string, data: { name: string; description: string; role_id: string; skill_ids: string[]; task_ids: string[] }) => {
      await mockDelay(800);
      return { success: true, id, ...data };
    },

    deleteTemplate: async (id: string) => {
      await mockDelay();
      return { success: true };
    },

    inviteCandidates: async (templateId: string, emails: string[]) => {
      await mockDelay(1000);
      return { 
        success: true, 
        invited_count: emails.length, 
        emails_sent: emails 
      };
    },

    getCandidates: async (filters?: { template_id?: string; status?: string; search?: string }) => {
      await mockDelay();
      return [
        { id: 'c1', invite_id: 'inv1', name: 'John Smith', email: 'john@example.com', template_id: 't1', template_name: 'Backend Developer Assessment', status: 'completed', score: 85, invited_at: '2025-01-03', completed_at: '2025-01-07' },
        { id: 'c2', invite_id: 'inv2', name: 'Sarah Johnson', email: 'sarah@example.com', template_id: 't2', template_name: 'Cloud Architect Test', status: 'in_progress', score: null, invited_at: '2025-01-05', completed_at: null },
        { id: 'c3', invite_id: 'inv3', name: null, email: 'mike@example.com', template_id: 't1', template_name: 'Backend Developer Assessment', status: 'pending', score: null, invited_at: '2025-01-06', completed_at: null },
        { id: 'c4', invite_id: 'inv4', name: 'Emily Brown', email: 'emily@example.com', template_id: 't3', template_name: 'QA Engineer Test', status: 'completed', score: 78, invited_at: '2025-01-04', completed_at: '2025-01-06' },
        { id: 'c5', invite_id: 'inv5', name: 'David Lee', email: 'david@example.com', template_id: 't4', template_name: 'Data Scientist Assessment', status: 'completed', score: 92, invited_at: '2025-01-02', completed_at: '2025-01-05' },
      ].filter(c => {
        if (filters?.status && filters.status !== 'all' && c.status !== filters.status) return false;
        if (filters?.template_id && filters.template_id !== 'all' && c.template_id !== filters.template_id) return false;
        if (filters?.search) {
          const search = filters.search.toLowerCase();
          return (c.name?.toLowerCase().includes(search) || c.email.toLowerCase().includes(search));
        }
        return true;
      });
    },

    getCandidateReport: async (inviteId: string) => {
      await mockDelay();
      return {
        invite_id: inviteId,
        candidate: { name: 'John Smith', email: 'john@example.com' },
        template: { name: 'Backend Developer Assessment', role: 'Backend Developer' },
        invited_at: '2025-01-03T10:00:00Z',
        started_at: '2025-01-07T10:30:00Z',
        completed_at: '2025-01-07T10:52:00Z',
        duration_minutes: 22,
        overall_score: 85,
        proficiency_level: 4,
        percentile: 78,
        questions_answered: 12,
        total_questions: 12,
        accuracy: 83,
        integrity_score: 95,
        skill_results: [
          { skill_id: 'api-design', skill_name: 'API Design', proficiency_level: 4, is_strength: true, task_results: [
            { task_id: 'rest-endpoints', task_name: 'REST Endpoint Design', correct: true, time_taken: 12, status: 'proficient' },
            { task_id: 'api-versioning', task_name: 'API Versioning Strategies', correct: true, time_taken: 18, status: 'proficient' },
          ], strengths: ['Strong REST API design knowledge'], weaknesses: [] },
          { skill_id: 'database', skill_name: 'Database Management', proficiency_level: 3, is_strength: false, task_results: [
            { task_id: 'sql-queries', task_name: 'Complex SQL Queries', correct: true, time_taken: 25, status: 'needs-practice' },
            { task_id: 'db-indexing', task_name: 'Database Indexing', correct: false, time_taken: 45, status: 'not-proficient' },
          ], strengths: [], weaknesses: ['Review database indexing strategies'] },
        ],
        recommendations: ['Deepen knowledge of database optimization', 'Practice complex SQL queries'],
        tab_switches: 1,
        face_detection_issues: 0,
      };
    },

    resendInvite: async (inviteId: string) => {
      await mockDelay();
      return { success: true };
    },
  },

  // ============ CANDIDATE ENDPOINTS ============
  candidate: {
    login: async (email: string, password: string) => {
      await mockDelay(800);
      // Mock auth
      if (password === 'test123') {
        const token = 'mock_candidate_token_' + Date.now();
        return {
          success: true,
          token,
          user: { id: 'candidate-1', name: email.split('@')[0], email }
        };
      }
      return { success: false, error: 'Invalid credentials' };
    },

    register: async (name: string, email: string, password: string) => {
      await mockDelay(800);
      const token = 'mock_candidate_token_' + Date.now();
      return {
        success: true,
        token,
        user: { id: 'candidate-new', name, email }
      };
    },

    getDashboard: async () => {
      await mockDelay();
      return {
        pending_tests_count: 2,
        recent_results: [
          { assessment_id: 'a1', test_name: 'Cloud Architect Assessment', date: '2024-12-28', score: 85 },
          { assessment_id: 'a2', test_name: 'API Design Skill Test', date: '2024-12-20', score: 72 },
        ]
      };
    },

    getTests: async () => {
      await mockDelay();
      return [
        { invite_id: 'inv-1', template_name: 'Backend Developer Assessment', role_name: 'Backend Developer', skills: [{ id: 's1', name: 'API Design' }, { id: 's2', name: 'Database' }, { id: 's3', name: 'Testing' }], status: 'pending', score: null, invited_at: '2025-01-03', completed_at: null, task_count: 12, time_limit_minutes: 20 },
        { invite_id: 'inv-2', template_name: 'Cloud Architect Assessment', role_name: 'Cloud Architect', skills: [{ id: 's4', name: 'Cloud Design' }, { id: 's5', name: 'Infrastructure' }], status: 'completed', score: 85, invited_at: '2024-12-28', completed_at: '2024-12-28', task_count: 8, time_limit_minutes: 15 },
      ];
    },

    getTestDetails: async (inviteId: string) => {
      await mockDelay();
      return {
        invite_id: inviteId,
        template_name: 'Backend Developer Assessment',
        description: 'Comprehensive assessment of backend development skills',
        role_name: 'Backend Developer',
        role_id: 'backend-dev',
        skills: [{ id: 'api-design', name: 'API Design' }, { id: 'database', name: 'Database Management' }, { id: 'testing', name: 'Testing & Quality' }],
        task_count: 12,
        time_limit_minutes: 20,
        status: 'pending',
      };
    },

    startAssignedTest: async (inviteId: string) => {
      await mockDelay();
      return { 
        success: true, 
        assessment_id: 'assess-' + Date.now(),
      };
    },
  },

  // ============ SHARED ENDPOINTS ============
  roles: {
    getAll: async () => {
      await mockDelay(300);
      // Import from mock data
      const { roles } = await import('@/data/mockData');
      return roles.map(r => ({ id: r.id, name: r.name, description: r.description }));
    },

    getSkills: async (roleId: string) => {
      await mockDelay(300);
      const { roles } = await import('@/data/mockData');
      const role = roles.find(r => r.id === roleId);
      return role?.skills.map(s => ({
        id: s.id,
        name: s.name,
        description: s.description,
        importance: s.isImportant ? 'important' : 'optional',
        tasks: s.tasks.map(t => ({ id: t.id, name: t.name }))
      })) || [];
    },
  },

  skills: {
    getTasks: async (skillId: string) => {
      await mockDelay(200);
      const { roles } = await import('@/data/mockData');
      for (const role of roles) {
        const skill = role.skills.find(s => s.id === skillId);
        if (skill) {
          return skill.tasks.map(t => ({ id: t.id, name: t.name }));
        }
      }
      return [];
    },
  },

  assessments: {
    start: async (data: {
      role_id: string;
      skill_ids: string[];
      task_ids: string[];
      assessment_type: 'skill' | 'persona';
    }) => {
      await mockDelay();
      return {
        success: true,
        assessment_id: 'assess-' + Date.now(),
        questions_count: data.task_ids.length,
      };
    },

    submitAnswer: async (assessmentId: string, data: {
      question_id: string;
      selected_option: string;
      time_taken_seconds: number;
    }) => {
      await mockDelay(100);
      return { success: true };
    },

    complete: async (assessmentId: string) => {
      await mockDelay();
      return { success: true };
    },

    getResults: async (assessmentId: string) => {
      await mockDelay();
      return {
        assessment_id: assessmentId,
        overall_score: 78,
        proficiency_level: 4,
        percentile: 72,
        time_taken_minutes: 18,
        questions_answered: 12,
        total_questions: 12,
        accuracy: 83,
        integrity_score: 95,
        skill_results: [],
        recommendations: ['Review API security concepts', 'Practice database indexing'],
      };
    },
  },

  proctoring: {
    recordEvent: async (assessmentId: string, eventType: string, metadata?: Record<string, unknown>) => {
      // Silent - don't need mock delay for proctoring events
      return { success: true };
    },
  },

  invite: {
    validate: async (token: string) => {
      await mockDelay();
      return {
        valid: true,
        invite_id: 'inv-' + token.slice(0, 8),
        template_name: 'Backend Developer Assessment',
        requires_registration: false,
      };
    },
  },
};

export default api;
