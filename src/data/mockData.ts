export type Complexity = 'HC' | 'MC' | 'LC';

export interface Task {
  id: string;
  name: string;
  complexity: Complexity;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  isImportant: boolean;
  tasks: Task[];
}

export interface Role {
  id: string;
  name: string;
  description: string;
  skills: Skill[];
}

export interface Question {
  id: string;
  skillId: string;
  skillName: string;
  taskId: string;
  taskName: string;
  difficulty: 1 | 2 | 3;
  text: string;
  options: { id: string; text: string }[];
  correctAnswer: string;
}

export const roles: Role[] = [
  {
    id: 'backend-dev',
    name: 'Backend Developer',
    description: 'Designs and builds server-side applications, APIs, and database systems. Focuses on scalability, security, and performance.',
    skills: [
      {
        id: 'api-design',
        name: 'API Design',
        description: 'Creating RESTful and GraphQL APIs with proper documentation',
        isImportant: true,
        tasks: [
          { id: 'rest-endpoints', name: 'REST Endpoint Design', complexity: 'MC' },
          { id: 'api-versioning', name: 'API Versioning Strategies', complexity: 'LC' },
          { id: 'graphql-schema', name: 'GraphQL Schema Design', complexity: 'HC' },
          { id: 'api-security', name: 'API Security Implementation', complexity: 'HC' },
        ],
      },
      {
        id: 'database',
        name: 'Database Management',
        description: 'SQL and NoSQL database design, optimization, and management',
        isImportant: true,
        tasks: [
          { id: 'sql-queries', name: 'Complex SQL Queries', complexity: 'MC' },
          { id: 'db-indexing', name: 'Database Indexing', complexity: 'HC' },
          { id: 'data-modeling', name: 'Data Modeling', complexity: 'MC' },
          { id: 'nosql-design', name: 'NoSQL Schema Design', complexity: 'LC' },
        ],
      },
      {
        id: 'microservices',
        name: 'Microservices Architecture',
        description: 'Designing and implementing distributed systems',
        isImportant: false,
        tasks: [
          { id: 'service-decomp', name: 'Service Decomposition', complexity: 'HC' },
          { id: 'service-comm', name: 'Inter-service Communication', complexity: 'MC' },
          { id: 'event-driven', name: 'Event-Driven Architecture', complexity: 'HC' },
        ],
      },
      {
        id: 'testing',
        name: 'Testing & Quality',
        description: 'Unit testing, integration testing, and test automation',
        isImportant: true,
        tasks: [
          { id: 'unit-testing', name: 'Unit Testing', complexity: 'LC' },
          { id: 'integration-testing', name: 'Integration Testing', complexity: 'MC' },
          { id: 'mocking', name: 'Mocking & Stubbing', complexity: 'MC' },
        ],
      },
      {
        id: 'performance',
        name: 'Performance Optimization',
        description: 'Profiling, caching, and system optimization',
        isImportant: false,
        tasks: [
          { id: 'caching', name: 'Caching Strategies', complexity: 'MC' },
          { id: 'profiling', name: 'Performance Profiling', complexity: 'HC' },
          { id: 'load-balancing', name: 'Load Balancing', complexity: 'MC' },
        ],
      },
      {
        id: 'security',
        name: 'Security Best Practices',
        description: 'Authentication, authorization, and secure coding',
        isImportant: false,
        tasks: [
          { id: 'auth-impl', name: 'Authentication Implementation', complexity: 'MC' },
          { id: 'oauth', name: 'OAuth/OIDC Integration', complexity: 'HC' },
          { id: 'encryption', name: 'Data Encryption', complexity: 'MC' },
        ],
      },
    ],
  },
  {
    id: 'cloud-architect',
    name: 'Cloud Architect',
    description: 'Designs cloud infrastructure and migration strategies. Expert in AWS, Azure, or GCP services.',
    skills: [
      {
        id: 'cloud-design',
        name: 'Cloud Architecture Design',
        description: 'Designing scalable and resilient cloud solutions',
        isImportant: true,
        tasks: [
          { id: 'multi-region', name: 'Multi-Region Architecture', complexity: 'HC' },
          { id: 'hybrid-cloud', name: 'Hybrid Cloud Design', complexity: 'HC' },
          { id: 'serverless', name: 'Serverless Architecture', complexity: 'MC' },
        ],
      },
      {
        id: 'infrastructure',
        name: 'Infrastructure as Code',
        description: 'Terraform, CloudFormation, and automation',
        isImportant: true,
        tasks: [
          { id: 'terraform', name: 'Terraform Modules', complexity: 'MC' },
          { id: 'cicd-infra', name: 'CI/CD for Infrastructure', complexity: 'MC' },
          { id: 'state-mgmt', name: 'State Management', complexity: 'LC' },
        ],
      },
      {
        id: 'containers',
        name: 'Container Orchestration',
        description: 'Kubernetes and container management',
        isImportant: true,
        tasks: [
          { id: 'k8s-deploy', name: 'Kubernetes Deployments', complexity: 'MC' },
          { id: 'helm-charts', name: 'Helm Chart Development', complexity: 'MC' },
          { id: 'service-mesh', name: 'Service Mesh Implementation', complexity: 'HC' },
        ],
      },
      {
        id: 'cost-optimization',
        name: 'Cost Optimization',
        description: 'Cloud cost management and optimization',
        isImportant: false,
        tasks: [
          { id: 'reserved-instances', name: 'Reserved Instance Planning', complexity: 'LC' },
          { id: 'spot-instances', name: 'Spot Instance Strategy', complexity: 'MC' },
          { id: 'cost-analysis', name: 'Cost Analysis & Reporting', complexity: 'LC' },
        ],
      },
      {
        id: 'cloud-security',
        name: 'Cloud Security',
        description: 'Security groups, IAM, and compliance',
        isImportant: false,
        tasks: [
          { id: 'iam-policies', name: 'IAM Policy Design', complexity: 'MC' },
          { id: 'network-security', name: 'Network Security', complexity: 'HC' },
          { id: 'compliance', name: 'Compliance Implementation', complexity: 'HC' },
        ],
      },
    ],
  },
  {
    id: 'data-scientist',
    name: 'Data Scientist',
    description: 'Applies statistical analysis and machine learning to extract insights from data.',
    skills: [
      {
        id: 'ml-modeling',
        name: 'Machine Learning',
        description: 'Building and deploying ML models',
        isImportant: true,
        tasks: [
          { id: 'model-selection', name: 'Model Selection', complexity: 'MC' },
          { id: 'feature-eng', name: 'Feature Engineering', complexity: 'HC' },
          { id: 'hyperparameter', name: 'Hyperparameter Tuning', complexity: 'MC' },
        ],
      },
      {
        id: 'statistics',
        name: 'Statistical Analysis',
        description: 'Hypothesis testing and statistical modeling',
        isImportant: true,
        tasks: [
          { id: 'hypothesis', name: 'Hypothesis Testing', complexity: 'MC' },
          { id: 'regression', name: 'Regression Analysis', complexity: 'MC' },
          { id: 'ab-testing', name: 'A/B Testing', complexity: 'LC' },
        ],
      },
      {
        id: 'data-viz',
        name: 'Data Visualization',
        description: 'Creating insightful visualizations',
        isImportant: false,
        tasks: [
          { id: 'dashboards', name: 'Dashboard Design', complexity: 'LC' },
          { id: 'storytelling', name: 'Data Storytelling', complexity: 'MC' },
          { id: 'interactive-viz', name: 'Interactive Visualizations', complexity: 'MC' },
        ],
      },
      {
        id: 'deep-learning',
        name: 'Deep Learning',
        description: 'Neural networks and deep learning frameworks',
        isImportant: false,
        tasks: [
          { id: 'cnn', name: 'CNN Implementation', complexity: 'HC' },
          { id: 'rnn', name: 'RNN/LSTM Models', complexity: 'HC' },
          { id: 'transfer-learning', name: 'Transfer Learning', complexity: 'MC' },
        ],
      },
    ],
  },
  {
    id: 'qa-engineer',
    name: 'QA Engineer',
    description: 'Ensures software quality through testing strategies, automation, and quality processes.',
    skills: [
      {
        id: 'test-automation',
        name: 'Test Automation',
        description: 'Automated testing frameworks and strategies',
        isImportant: true,
        tasks: [
          { id: 'selenium', name: 'Selenium/WebDriver', complexity: 'MC' },
          { id: 'api-testing', name: 'API Test Automation', complexity: 'MC' },
          { id: 'mobile-testing', name: 'Mobile Test Automation', complexity: 'HC' },
        ],
      },
      {
        id: 'test-strategy',
        name: 'Test Strategy',
        description: 'Test planning and coverage analysis',
        isImportant: true,
        tasks: [
          { id: 'test-planning', name: 'Test Plan Development', complexity: 'MC' },
          { id: 'risk-analysis', name: 'Risk-Based Testing', complexity: 'MC' },
          { id: 'coverage', name: 'Coverage Analysis', complexity: 'LC' },
        ],
      },
      {
        id: 'performance-testing',
        name: 'Performance Testing',
        description: 'Load testing and performance analysis',
        isImportant: false,
        tasks: [
          { id: 'load-testing', name: 'Load Testing', complexity: 'MC' },
          { id: 'stress-testing', name: 'Stress Testing', complexity: 'HC' },
          { id: 'perf-analysis', name: 'Performance Analysis', complexity: 'MC' },
        ],
      },
      {
        id: 'security-testing',
        name: 'Security Testing',
        description: 'Vulnerability assessment and security testing',
        isImportant: false,
        tasks: [
          { id: 'vuln-scanning', name: 'Vulnerability Scanning', complexity: 'MC' },
          { id: 'pen-testing', name: 'Penetration Testing Basics', complexity: 'HC' },
          { id: 'owasp', name: 'OWASP Compliance', complexity: 'MC' },
        ],
      },
    ],
  },
  {
    id: 'project-manager',
    name: 'Software Project Manager',
    description: 'Leads software development projects using agile methodologies and stakeholder management.',
    skills: [
      {
        id: 'agile',
        name: 'Agile Methodologies',
        description: 'Scrum, Kanban, and agile practices',
        isImportant: true,
        tasks: [
          { id: 'scrum-master', name: 'Scrum Facilitation', complexity: 'MC' },
          { id: 'sprint-planning', name: 'Sprint Planning', complexity: 'LC' },
          { id: 'retrospectives', name: 'Retrospective Facilitation', complexity: 'LC' },
        ],
      },
      {
        id: 'stakeholder',
        name: 'Stakeholder Management',
        description: 'Communication and expectation management',
        isImportant: true,
        tasks: [
          { id: 'comm-plan', name: 'Communication Planning', complexity: 'MC' },
          { id: 'conflict-res', name: 'Conflict Resolution', complexity: 'HC' },
          { id: 'reporting', name: 'Status Reporting', complexity: 'LC' },
        ],
      },
      {
        id: 'risk-mgmt',
        name: 'Risk Management',
        description: 'Identifying and mitigating project risks',
        isImportant: false,
        tasks: [
          { id: 'risk-identification', name: 'Risk Identification', complexity: 'MC' },
          { id: 'mitigation', name: 'Mitigation Strategies', complexity: 'MC' },
          { id: 'risk-monitoring', name: 'Risk Monitoring', complexity: 'LC' },
        ],
      },
      {
        id: 'resource-mgmt',
        name: 'Resource Management',
        description: 'Team capacity and resource planning',
        isImportant: false,
        tasks: [
          { id: 'capacity', name: 'Capacity Planning', complexity: 'MC' },
          { id: 'team-building', name: 'Team Building', complexity: 'LC' },
          { id: 'budget', name: 'Budget Management', complexity: 'MC' },
        ],
      },
    ],
  },
];

// Generate questions based on selected tasks
export const generateQuestions = (
  selectedTasks: { skillId: string; skillName: string; taskId: string; taskName: string; complexity: Complexity }[]
): Question[] => {
  const questionTemplates: Record<string, string[]> = {
    'rest-endpoints': [
      'Which HTTP method should be used for a partial update to a resource?',
      'What is the most appropriate status code for a successful resource creation?',
      'Which design pattern is recommended for handling API errors consistently?',
    ],
    'api-versioning': [
      'What is the recommended approach for API versioning in enterprise applications?',
      'When should you deprecate an API version?',
    ],
    'graphql-schema': [
      'What is the primary advantage of GraphQL over REST for complex data requirements?',
      'How should you handle N+1 query problems in GraphQL?',
    ],
    'api-security': [
      'Which authentication method is most suitable for machine-to-machine API communication?',
      'What is the best practice for storing API keys in client applications?',
    ],
    'sql-queries': [
      'Which JOIN type returns all rows from both tables regardless of matches?',
      'What is the purpose of a CTE (Common Table Expression)?',
    ],
    'db-indexing': [
      'When should you use a composite index over multiple single-column indexes?',
      'What is the impact of too many indexes on write performance?',
    ],
    'data-modeling': [
      'Which normalization form eliminates transitive dependencies?',
      'When is denormalization appropriate in database design?',
    ],
    'unit-testing': [
      'What is the primary purpose of unit testing?',
      'Which testing pattern follows Arrange-Act-Assert?',
    ],
    'integration-testing': [
      'What distinguishes integration tests from unit tests?',
      'When should you use test containers?',
    ],
    default: [
      'Which approach is considered best practice for this task?',
      'What is the primary consideration when implementing this feature?',
      'How should you handle edge cases in this scenario?',
    ],
  };

  const optionSets: Record<string, { options: { id: string; text: string }[]; correctAnswer: string }[]> = {
    'rest-endpoints': [
      {
        options: [
          { id: 'A', text: 'PUT - Replace the entire resource' },
          { id: 'B', text: 'PATCH - Partial update of resource' },
          { id: 'C', text: 'POST - Create new resource' },
          { id: 'D', text: 'DELETE - Remove the resource' },
        ],
        correctAnswer: 'B',
      },
      {
        options: [
          { id: 'A', text: '200 OK' },
          { id: 'B', text: '201 Created' },
          { id: 'C', text: '204 No Content' },
          { id: 'D', text: '202 Accepted' },
        ],
        correctAnswer: 'B',
      },
    ],
    default: [
      {
        options: [
          { id: 'A', text: 'Option A - Standard approach with moderate complexity' },
          { id: 'B', text: 'Option B - Optimized approach with better performance' },
          { id: 'C', text: 'Option C - Legacy approach for compatibility' },
          { id: 'D', text: 'Option D - Experimental approach for specific use cases' },
        ],
        correctAnswer: 'B',
      },
    ],
  };

  return selectedTasks.map((task, index) => {
    const templates = questionTemplates[task.taskId] || questionTemplates.default;
    const questionText = templates[index % templates.length];
    const optionSet = (optionSets[task.taskId] || optionSets.default)[index % (optionSets[task.taskId] || optionSets.default).length];

    return {
      id: `q-${index + 1}`,
      skillId: task.skillId,
      skillName: task.skillName,
      taskId: task.taskId,
      taskName: task.taskName,
      difficulty: task.complexity === 'HC' ? 3 : task.complexity === 'MC' ? 2 : 1,
      text: questionText,
      options: optionSet.options,
      correctAnswer: optionSet.correctAnswer,
    };
  });
};

export interface AssessmentResult {
  overallScore: number;
  proficiencyLevel: 1 | 2 | 3 | 4 | 5;
  percentile: number;
  timeTaken: number;
  questionsAnswered: number;
  totalQuestions: number;
  accuracy: number;
  integrityScore: number;
  skillResults: SkillResult[];
  recommendations: string[];
  tabSwitches: number;
  faceDetectionIssues: number;
}

export interface SkillResult {
  skillId: string;
  skillName: string;
  proficiencyLevel: 1 | 2 | 3 | 4 | 5;
  isStrength: boolean;
  taskResults: TaskResult[];
  strengths: string[];
  weaknesses: string[];
}

export interface TaskResult {
  taskId: string;
  taskName: string;
  complexity: Complexity;
  correct: boolean;
  timeTaken: number;
  status: 'proficient' | 'needs-practice' | 'not-proficient';
}

export const generateMockResults = (
  answers: Map<string, { answer: string; timeSpent: number }>,
  questions: Question[],
  tabSwitches: number
): AssessmentResult => {
  const totalQuestions = questions.length;
  let correctCount = 0;
  let totalTime = 0;

  const skillMap = new Map<string, { correct: number; total: number; tasks: TaskResult[] }>();

  questions.forEach((q) => {
    const answer = answers.get(q.id);
    const isCorrect = answer?.answer === q.correctAnswer;
    const timeSpent = answer?.timeSpent || 30;
    
    if (isCorrect) correctCount++;
    totalTime += timeSpent;

    if (!skillMap.has(q.skillId)) {
      skillMap.set(q.skillId, { correct: 0, total: 0, tasks: [] });
    }
    
    const skill = skillMap.get(q.skillId)!;
    skill.total++;
    if (isCorrect) skill.correct++;

    const status: TaskResult['status'] = 
      isCorrect && timeSpent < 20 ? 'proficient' :
      isCorrect ? 'needs-practice' : 'not-proficient';

    skill.tasks.push({
      taskId: q.taskId,
      taskName: q.taskName,
      complexity: q.difficulty === 3 ? 'HC' : q.difficulty === 2 ? 'MC' : 'LC',
      correct: isCorrect,
      timeTaken: timeSpent,
      status,
    });
  });

  const accuracy = (correctCount / totalQuestions) * 100;
  const proficiencyLevel = accuracy >= 90 ? 5 : accuracy >= 75 ? 4 : accuracy >= 60 ? 3 : accuracy >= 40 ? 2 : 1;

  const skillResults: SkillResult[] = Array.from(skillMap.entries()).map(([skillId, data]) => {
    const skillAccuracy = (data.correct / data.total) * 100;
    const level = skillAccuracy >= 90 ? 5 : skillAccuracy >= 75 ? 4 : skillAccuracy >= 60 ? 3 : skillAccuracy >= 40 ? 2 : 1;
    
    return {
      skillId,
      skillName: questions.find(q => q.skillId === skillId)?.skillName || skillId,
      proficiencyLevel: level as 1 | 2 | 3 | 4 | 5,
      isStrength: level >= 4,
      taskResults: data.tasks,
      strengths: level >= 4 ? ['Strong understanding of core concepts', 'Quick problem solving'] : [],
      weaknesses: level < 3 ? ['Needs improvement in fundamental concepts', 'Review theoretical foundations'] : [],
    };
  });

  const integrityScore = Math.max(0, 100 - (tabSwitches * 10));

  return {
    overallScore: Math.round(accuracy),
    proficiencyLevel: proficiencyLevel as 1 | 2 | 3 | 4 | 5,
    percentile: Math.min(99, Math.round(accuracy * 0.9 + Math.random() * 10)),
    timeTaken: totalTime,
    questionsAnswered: answers.size,
    totalQuestions,
    accuracy: Math.round(accuracy),
    integrityScore,
    skillResults,
    recommendations: [
      'Review API design patterns documentation',
      'Practice database query optimization',
      'Study security best practices',
    ],
    tabSwitches,
    faceDetectionIssues: Math.floor(Math.random() * 3),
  };
};
