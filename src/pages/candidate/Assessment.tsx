import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  Clock, 
  ChevronRight, 
  SkipForward, 
  Shield, 
  Check, 
  AlertTriangle,
  Camera
} from 'lucide-react';
import { api } from '@/services/api';

interface Question {
  id: string;
  text: string;
  skillName: string;
  taskName: string;
  options: { id: string; text: string }[];
}

interface AssessmentState {
  assessmentId: string;
  questions: Question[];
  currentQuestionIndex: number;
  answers: Map<string, { answer: string; timeSpent: number }>;
  startTime: number;
  timeLimit: number; // in seconds
  tabSwitches: number;
  proctoringEnabled: boolean;
}

export const CandidateAssessment = () => {
  const { inviteId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [state, setState] = useState<AssessmentState | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [showTabWarning, setShowTabWarning] = useState(false);
  const [tabAwayTime, setTabAwayTime] = useState(0);
  const [bonusProgress, setBonusProgress] = useState(100);
  const [isLoading, setIsLoading] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const tabAwayStartRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Get assessment config from state (skill assessment)
  const assessmentConfig = location.state as {
    roleId?: string;
    skillId?: string;
    taskIds?: string[];
    assessmentType?: 'skill' | 'persona';
  } | null;

  // Initialize assessment
  useEffect(() => {
    const initAssessment = async () => {
      try {
        let result;
        
        if (assessmentConfig?.assessmentType === 'skill') {
          // Self-service skill assessment
          result = await api.assessments.start({
            role_id: assessmentConfig.roleId || '',
            skill_ids: [assessmentConfig.skillId || ''],
            task_ids: assessmentConfig.taskIds || [],
            assessment_type: 'skill',
          });
        } else if (inviteId && inviteId !== 'skill') {
          // Assigned test
          result = await api.candidate.startAssignedTest(inviteId);
        } else {
          navigate('/dashboard');
          return;
        }

        setState({
          assessmentId: result.assessment_id,
          questions: result.questions,
          currentQuestionIndex: 0,
          answers: new Map(),
          startTime: Date.now(),
          timeLimit: result.time_limit_minutes * 60,
          tabSwitches: 0,
          proctoringEnabled: true,
        });
        setTimeRemaining(result.time_limit_minutes * 60);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to start assessment:', error);
        navigate('/dashboard');
      }
    };

    initAssessment();
  }, [inviteId, assessmentConfig, navigate]);

  // Setup camera for proctoring
  useEffect(() => {
    if (!state?.proctoringEnabled) return;

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user', width: 160, height: 120 } })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(console.error);

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [state?.proctoringEnabled]);

  // Timer
  useEffect(() => {
    if (!state) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
      const remaining = Math.max(0, state.timeLimit - elapsed);
      setTimeRemaining(remaining);

      if (remaining === 0) {
        finishAssessment();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [state]);

  // Speed bonus drain
  useEffect(() => {
    if (!state) return;
    setQuestionStartTime(Date.now());
    setBonusProgress(100);
    setSelectedOption(null);

    const interval = setInterval(() => {
      const elapsed = (Date.now() - questionStartTime) / 1000;
      const progress = Math.max(0, 100 - (elapsed / 15) * 100);
      setBonusProgress(progress);
    }, 100);

    return () => clearInterval(interval);
  }, [state?.currentQuestionIndex]);

  // Tab visibility detection
  useEffect(() => {
    if (!state) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        tabAwayStartRef.current = Date.now();
      } else if (tabAwayStartRef.current) {
        const awayDuration = Math.floor((Date.now() - tabAwayStartRef.current) / 1000);
        setTabAwayTime(awayDuration);
        setShowTabWarning(true);
        setState(prev => prev ? { ...prev, tabSwitches: prev.tabSwitches + 1 } : prev);
        // Record the event
        if (state.assessmentId) {
          api.proctoring.recordEvent(state.assessmentId, 'tab_switch', { duration: awayDuration });
        }
        tabAwayStartRef.current = null;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [state]);

  const currentQuestion = state?.questions[state.currentQuestionIndex];
  const isLastQuestion = state ? state.currentQuestionIndex === state.questions.length - 1 : false;

  const handleSelectOption = (optionId: string) => {
    setSelectedOption(optionId);
  };

  const finishAssessment = useCallback(async () => {
    if (!state) return;
    
    // Stop camera
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    // Complete assessment
    await api.assessments.complete(state.assessmentId);
    
    // Navigate to results
    navigate(`/results/${state.assessmentId}`);
  }, [state, navigate]);

  const handleSubmitAndNext = async () => {
    if (!selectedOption || !currentQuestion || !state) return;

    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
    
    // Submit answer to API
    await api.assessments.submitAnswer(state.assessmentId, {
      question_id: currentQuestion.id,
      selected_option: selectedOption,
      time_taken_seconds: timeSpent,
    });

    // Update local state
    const newAnswers = new Map(state.answers);
    newAnswers.set(currentQuestion.id, { answer: selectedOption, timeSpent });

    if (isLastQuestion) {
      await finishAssessment();
    } else {
      setState({
        ...state,
        answers: newAnswers,
        currentQuestionIndex: state.currentQuestionIndex + 1,
      });
    }
  };

  const handleSkip = () => {
    if (!state) return;
    
    if (isLastQuestion) {
      finishAssessment();
    } else {
      setState({
        ...state,
        currentQuestionIndex: state.currentQuestionIndex + 1,
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading || !state || !currentQuestion) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading assessment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Bar */}
      <header className="border-b bg-card sticky top-0 z-20">
        <div className="container max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="text-sm font-medium text-foreground">
            Question {state.currentQuestionIndex + 1} of {state.questions.length}
          </div>

          <div className="flex-1 max-w-md mx-8">
            <Progress
              value={((state.currentQuestionIndex + 1) / state.questions.length) * 100}
              className="h-2"
            />
          </div>

          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
              timeRemaining < 60
                ? 'bg-destructive/10 text-destructive'
                : 'bg-muted text-foreground'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span className="font-mono font-semibold">{formatTime(timeRemaining)}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container max-w-5xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            {/* Question Metadata */}
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="secondary">{currentQuestion.skillName}</Badge>
              <Badge variant="outline">{currentQuestion.taskName}</Badge>
            </div>

            {/* Question */}
            <Card className="border shadow-sm">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-foreground leading-relaxed">
                  {currentQuestion.text}
                </h2>
              </CardContent>
            </Card>

            {/* Options */}
            <div className="space-y-3">
              {currentQuestion.options.map((option) => {
                const isSelected = selectedOption === option.id;
                return (
                  <Card
                    key={option.id}
                    className={`cursor-pointer transition-all hover:border-primary/50 ${
                      isSelected ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => handleSelectOption(option.id)}
                  >
                    <CardContent className="p-4 flex items-start gap-4">
                      <div
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          isSelected
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-muted-foreground/30 text-muted-foreground'
                        }`}
                      >
                        {isSelected ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <span className="text-sm font-medium">{option.id}</span>
                        )}
                      </div>
                      <p className="text-foreground pt-1">{option.text}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Speed Bonus */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Quick Answer Bonus</span>
                <span className="text-primary font-medium">
                  {bonusProgress > 50 ? '+' + Math.round(bonusProgress / 10) : '0'} points
                </span>
              </div>
              <Progress value={bonusProgress} className="h-2" />
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="text-muted-foreground"
              >
                <SkipForward className="w-4 h-4 mr-2" />
                Skip
              </Button>
              <Button
                onClick={handleSubmitAndNext}
                disabled={!selectedOption}
              >
                {isLastQuestion ? 'Finish Assessment' : 'Next'}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* Proctoring Sidebar */}
          {state.proctoringEnabled && (
            <div className="lg:col-span-1">
              <Card className="sticky top-20 overflow-hidden">
                <div className="aspect-video bg-muted relative border-2 border-success">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-success" />
                    <span className="text-xs font-medium text-success">Proctoring Active</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* Tab Switch Warning Modal */}
      <Dialog open={showTabWarning} onOpenChange={setShowTabWarning}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-warning/10">
                <AlertTriangle className="w-5 h-5 text-warning" />
              </div>
              <DialogTitle>Tab Switch Detected</DialogTitle>
            </div>
            <DialogDescription>
              You left the assessment tab for {tabAwayTime} seconds. This event has been recorded and will be included in your integrity report.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setShowTabWarning(false)} className="w-full mt-4">
            Continue Assessment
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CandidateAssessment;
