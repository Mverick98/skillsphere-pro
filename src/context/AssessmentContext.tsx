import React, { createContext, useContext, useState, useCallback } from 'react';
import { Role, Skill, Task, Question, AssessmentResult, generateQuestions, generateMockResults, Complexity } from '@/data/mockData';

interface SelectedTask {
  skillId: string;
  skillName: string;
  taskId: string;
  taskName: string;
  complexity: Complexity;
}

interface AssessmentState {
  isAuthenticated: boolean;
  currentStep: 'login' | 'config' | 'proctoring' | 'assessment' | 'loading' | 'results';
  selectedRole: Role | null;
  selectedSkills: Skill[];
  selectedTasks: SelectedTask[];
  questions: Question[];
  currentQuestionIndex: number;
  answers: Map<string, { answer: string; timeSpent: number }>;
  startTime: number | null;
  timeLimit: number;
  tabSwitches: number;
  proctoringEnabled: boolean;
  cameraActive: boolean;
  result: AssessmentResult | null;
}

interface AssessmentContextType extends AssessmentState {
  login: (username: string, password: string) => boolean;
  logout: () => void;
  setStep: (step: AssessmentState['currentStep']) => void;
  selectRole: (role: Role) => void;
  toggleSkill: (skill: Skill) => void;
  toggleTask: (skillId: string, task: Task) => void;
  selectAllTasks: (skill: Skill) => void;
  deselectAllTasks: (skillId: string) => void;
  startAssessment: () => void;
  submitAnswer: (questionId: string, answer: string, timeSpent: number) => void;
  skipQuestion: () => void;
  nextQuestion: () => void;
  recordTabSwitch: () => void;
  enableProctoring: () => void;
  setCameraActive: (active: boolean) => void;
  finishAssessment: () => void;
  resetAssessment: () => void;
  getEstimatedTime: () => number;
  canStartAssessment: () => boolean;
}

const AssessmentContext = createContext<AssessmentContextType | undefined>(undefined);

export const useAssessment = () => {
  const context = useContext(AssessmentContext);
  if (!context) {
    throw new Error('useAssessment must be used within an AssessmentProvider');
  }
  return context;
};

export const AssessmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AssessmentState>({
    isAuthenticated: false,
    currentStep: 'login',
    selectedRole: null,
    selectedSkills: [],
    selectedTasks: [],
    questions: [],
    currentQuestionIndex: 0,
    answers: new Map(),
    startTime: null,
    timeLimit: 0,
    tabSwitches: 0,
    proctoringEnabled: false,
    cameraActive: false,
    result: null,
  });

  const login = useCallback((username: string, password: string) => {
    // Hardcoded auth for demo
    if (username === 'demo' && password === 'demo123') {
      setState(prev => ({ ...prev, isAuthenticated: true, currentStep: 'config' }));
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setState({
      isAuthenticated: false,
      currentStep: 'login',
      selectedRole: null,
      selectedSkills: [],
      selectedTasks: [],
      questions: [],
      currentQuestionIndex: 0,
      answers: new Map(),
      startTime: null,
      timeLimit: 0,
      tabSwitches: 0,
      proctoringEnabled: false,
      cameraActive: false,
      result: null,
    });
  }, []);

  const setStep = useCallback((step: AssessmentState['currentStep']) => {
    setState(prev => ({ ...prev, currentStep: step }));
  }, []);

  const selectRole = useCallback((role: Role) => {
    setState(prev => ({
      ...prev,
      selectedRole: role,
      selectedSkills: [],
      selectedTasks: [],
    }));
  }, []);

  const toggleSkill = useCallback((skill: Skill) => {
    setState(prev => {
      const isSelected = prev.selectedSkills.some(s => s.id === skill.id);
      
      if (isSelected) {
        return {
          ...prev,
          selectedSkills: prev.selectedSkills.filter(s => s.id !== skill.id),
          selectedTasks: prev.selectedTasks.filter(t => t.skillId !== skill.id),
        };
      } else if (prev.selectedSkills.length < 5) {
        return {
          ...prev,
          selectedSkills: [...prev.selectedSkills, skill],
        };
      }
      return prev;
    });
  }, []);

  const toggleTask = useCallback((skillId: string, task: Task) => {
    setState(prev => {
      const skill = prev.selectedSkills.find(s => s.id === skillId);
      if (!skill) return prev;

      const isSelected = prev.selectedTasks.some(t => t.taskId === task.id);
      
      if (isSelected) {
        return {
          ...prev,
          selectedTasks: prev.selectedTasks.filter(t => t.taskId !== task.id),
        };
      } else {
        return {
          ...prev,
          selectedTasks: [...prev.selectedTasks, {
            skillId,
            skillName: skill.name,
            taskId: task.id,
            taskName: task.name,
            complexity: task.complexity,
          }],
        };
      }
    });
  }, []);

  const selectAllTasks = useCallback((skill: Skill) => {
    setState(prev => {
      const existingTaskIds = new Set(prev.selectedTasks.map(t => t.taskId));
      const newTasks = skill.tasks
        .filter(t => !existingTaskIds.has(t.id))
        .map(t => ({
          skillId: skill.id,
          skillName: skill.name,
          taskId: t.id,
          taskName: t.name,
          complexity: t.complexity,
        }));
      
      return {
        ...prev,
        selectedTasks: [...prev.selectedTasks, ...newTasks],
      };
    });
  }, []);

  const deselectAllTasks = useCallback((skillId: string) => {
    setState(prev => ({
      ...prev,
      selectedTasks: prev.selectedTasks.filter(t => t.skillId !== skillId),
    }));
  }, []);

  const getEstimatedTime = useCallback(() => {
    const baseTime = 5;
    const additionalTime = Math.min(state.selectedSkills.length - 1, 5) * 3;
    return Math.min(baseTime + additionalTime, 20);
  }, [state.selectedSkills.length]);

  const canStartAssessment = useCallback(() => {
    if (state.selectedSkills.length === 0) return false;
    
    // Check each selected skill has at least one task
    for (const skill of state.selectedSkills) {
      const hasTasks = state.selectedTasks.some(t => t.skillId === skill.id);
      if (!hasTasks) return false;
    }
    
    return true;
  }, [state.selectedSkills, state.selectedTasks]);

  const startAssessment = useCallback(() => {
    const questions = generateQuestions(state.selectedTasks);
    const timeLimit = getEstimatedTime() * 60; // Convert to seconds
    
    setState(prev => ({
      ...prev,
      questions,
      currentQuestionIndex: 0,
      startTime: Date.now(),
      timeLimit,
      currentStep: 'assessment',
    }));
  }, [state.selectedTasks, getEstimatedTime]);

  const submitAnswer = useCallback((questionId: string, answer: string, timeSpent: number) => {
    setState(prev => {
      const newAnswers = new Map(prev.answers);
      newAnswers.set(questionId, { answer, timeSpent });
      return { ...prev, answers: newAnswers };
    });
  }, []);

  const skipQuestion = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentQuestionIndex: Math.min(prev.currentQuestionIndex + 1, prev.questions.length - 1),
    }));
  }, []);

  const nextQuestion = useCallback(() => {
    setState(prev => {
      if (prev.currentQuestionIndex >= prev.questions.length - 1) {
        return prev;
      }
      return {
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
      };
    });
  }, []);

  const recordTabSwitch = useCallback(() => {
    setState(prev => ({ ...prev, tabSwitches: prev.tabSwitches + 1 }));
  }, []);

  const enableProctoring = useCallback(() => {
    setState(prev => ({ ...prev, proctoringEnabled: true }));
  }, []);

  const setCameraActive = useCallback((active: boolean) => {
    setState(prev => ({ ...prev, cameraActive: active }));
  }, []);

  const finishAssessment = useCallback(() => {
    setState(prev => ({ ...prev, currentStep: 'loading' }));
    
    // Simulate processing time
    setTimeout(() => {
      setState(prev => {
        const result = generateMockResults(prev.answers, prev.questions, prev.tabSwitches);
        return { ...prev, result, currentStep: 'results' };
      });
    }, 2500);
  }, []);

  const resetAssessment = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: 'config',
      selectedRole: null,
      selectedSkills: [],
      selectedTasks: [],
      questions: [],
      currentQuestionIndex: 0,
      answers: new Map(),
      startTime: null,
      timeLimit: 0,
      tabSwitches: 0,
      cameraActive: false,
      result: null,
    }));
  }, []);

  return (
    <AssessmentContext.Provider
      value={{
        ...state,
        login,
        logout,
        setStep,
        selectRole,
        toggleSkill,
        toggleTask,
        selectAllTasks,
        deselectAllTasks,
        startAssessment,
        submitAnswer,
        skipQuestion,
        nextQuestion,
        recordTabSwitch,
        enableProctoring,
        setCameraActive,
        finishAssessment,
        resetAssessment,
        getEstimatedTime,
        canStartAssessment,
      }}
    >
      {children}
    </AssessmentContext.Provider>
  );
};
