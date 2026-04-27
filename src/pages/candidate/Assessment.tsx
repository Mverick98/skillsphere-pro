import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
  Clock,
  ChevronRight,
  ChevronDown,
  SkipForward,
  Shield,
  Check,
  X,
  AlertTriangle,
  BookOpen,
  Maximize2,
  FileText,
  BookMarked,
  Camera
} from 'lucide-react';
import { api } from '@/services/api';
import { useBrowserProctoring } from '@/hooks/useBrowserProctoring';
import { useProctoringRecorder } from '@/hooks/useProctoringRecorder';
import { useAssessmentBlocker } from '@/hooks/useAssessmentBlocker';
import { cn } from '@/lib/utils';

interface Question {
  id: string;
  text: string;
  skillName: string;
  taskName: string;
  bloomLevel: string;
  options: { id: string; text: string }[];
}

interface AssessmentState {
  assessmentId: string;
  currentQuestion: Question | null;
  currentQuestionNumber: number;
  totalQuestions: number;
  answeredCount: number;
  startTime: number;
  timeLimit: number; // in seconds
  tabSwitches: number;
  proctoringEnabled: boolean;
}

// Transform backend question response to frontend format
const transformQuestion = (q: {
  id: string;
  question_text: string;
  options: Record<string, string>;
  skill_name: string;
  task_name: string;
  bloom_level?: string;
}): Question => ({
  id: q.id,
  text: q.question_text,
  skillName: q.skill_name,
  taskName: q.task_name,
  bloomLevel: q.bloom_level || 'apply',
  options: Object.entries(q.options).map(([key, text]) => ({ id: key, text })),
});

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
  const [isLoading, setIsLoading] = useState(true);
  const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);
  const [fullscreenExitCount, setFullscreenExitCount] = useState(0);

  // New state for Submit/Next separation
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [readingTimeLeft, setReadingTimeLeft] = useState(45);
  const [sourceContext, setSourceContext] = useState<{
    book_name?: string;
    section?: string;
    chunk_id?: string;
  } | null>(null);
  const [isSourceExpanded, setIsSourceExpanded] = useState(false);
  const [showMediaBlockedWarning, setShowMediaBlockedWarning] = useState(false);
  const [mediaBlockedCount, setMediaBlockedCount] = useState(0);
  const [isMediaPaused, setIsMediaPaused] = useState(false);
  const [showNavigationWarning, setShowNavigationWarning] = useState(false);
  const [isAssessmentCompleted, setIsAssessmentCompleted] = useState(false);

  
  const videoRef = useRef<HTMLVideoElement>(null);
  const tabAwayStartRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const recordingStartedRef = useRef(false);
  const mediaBlockedAtRef = useRef<number | null>(null);

  // Browser proctoring hook
  const { requestFullscreen, isFullscreen, state: proctoringState } = useBrowserProctoring({
    assessmentId: state?.assessmentId || '',
    enabled: !!state?.proctoringEnabled,
    onFullscreenExit: () => {
      setFullscreenExitCount(prev => prev + 1);
      setShowFullscreenWarning(true);
    },
    onViolation: (type, metadata) => {
      console.log('[Proctoring] Violation recorded:', type, metadata);
    },
  });

  // Video/Audio recording hook
  const {
    startRecording,
    stopRecording,
    isRecording,
  } = useProctoringRecorder({
    assessmentId: state?.assessmentId || '',
    enabled: !!state?.proctoringEnabled,
    externalStream: mediaStream,
    onError: (error) => console.error('[Recording] Error:', error),
  });

  // Navigation blocker - prevents accidental back button during assessment
  const { unblock } = useAssessmentBlocker(
    !!state?.assessmentId && !isAssessmentCompleted,
    () => setShowNavigationWarning(true)
  );

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

        // Backend returns time_limit_seconds and first_question
        const timeLimit = result.time_limit_seconds || (result.time_limit_minutes ? result.time_limit_minutes * 60 : 600);
        const firstQuestion = result.first_question ? transformQuestion(result.first_question) : null;

        setState({
          assessmentId: result.assessment_id,
          currentQuestion: firstQuestion,
          currentQuestionNumber: 1,
          totalQuestions: result.total_questions,
          answeredCount: 0,
          startTime: Date.now(),
          timeLimit: timeLimit,
          tabSwitches: 0,
          proctoringEnabled: true,
        });
        setTimeRemaining(timeLimit);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to start assessment:', error);
        navigate('/dashboard');
      }
    };

    initAssessment();
  }, [inviteId, assessmentConfig, navigate]);

  // Handle track ended (user blocked camera/mic)
  const handleTrackEnded = useCallback((trackType: string) => {
    console.log(`[Proctoring] ${trackType} track ended - user blocked access`);
    mediaBlockedAtRef.current = Date.now();
    setIsMediaPaused(true);
    setIsTimerPaused(true);
    setShowMediaBlockedWarning(true);
    setMediaBlockedCount(prev => prev + 1);

    // Record violation
    if (state?.assessmentId) {
      api.proctoring.recordEvent(state.assessmentId, 'media_blocked', {
        track_type: trackType,
        block_count: mediaBlockedCount + 1,
        timestamp: new Date().toISOString(),
      });
    }
  }, [state?.assessmentId, mediaBlockedCount]);

  // Request media permission (initial or re-request after block)
  const requestMediaPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: true,
      });

      // Add ended listeners to detect future blocks
      stream.getTracks().forEach(track => {
        track.onended = () => handleTrackEnded(track.kind);
      });

      streamRef.current = stream;
      setMediaStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // If resuming from blocked state
      if (isMediaPaused && mediaBlockedAtRef.current) {
        const blockedDuration = Math.floor((Date.now() - mediaBlockedAtRef.current) / 1000);
        console.log(`[Proctoring] Media resumed after ${blockedDuration}s`);

        // Record resume event
        if (state?.assessmentId) {
          api.proctoring.recordEvent(state.assessmentId, 'media_resumed', {
            blocked_duration_seconds: blockedDuration,
            timestamp: new Date().toISOString(),
          });
        }

        setIsMediaPaused(false);
        setIsTimerPaused(false);
        setShowMediaBlockedWarning(false);
        mediaBlockedAtRef.current = null;

        // Restart recording with new stream
        if (recordingStartedRef.current) {
          recordingStartedRef.current = false; // Allow restart
        }
      }

      return true;
    } catch (error) {
      console.error('[Proctoring] Failed to get media permissions:', error);
      return false;
    }
  }, [handleTrackEnded, isMediaPaused, state?.assessmentId]);

  // Setup camera and microphone for proctoring
  useEffect(() => {
    if (!state?.proctoringEnabled) return;

    requestMediaPermission();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [state?.proctoringEnabled, requestMediaPermission]);

  // Connect stream to video element whenever stream or element changes
  useEffect(() => {
    if (mediaStream && videoRef.current) {
      videoRef.current.srcObject = mediaStream;
      console.log('[Proctoring] Video stream connected to element');
    }
  }, [mediaStream]);

  // Start recording when stream is ready
  useEffect(() => {
    if (mediaStream && state?.assessmentId && !recordingStartedRef.current) {
      recordingStartedRef.current = true;
      console.log('[Proctoring] Starting video recording...');
      startRecording();
    }
  }, [mediaStream, state?.assessmentId, startRecording]);

  // Request fullscreen when assessment starts
  useEffect(() => {
    if (state?.proctoringEnabled && !isLoading) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        requestFullscreen();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [state?.proctoringEnabled, isLoading, requestFullscreen]);

  // Main Timer - pauses when answer is submitted
  useEffect(() => {
    if (!state || isTimerPaused) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
      const remaining = Math.max(0, state.timeLimit - elapsed);
      setTimeRemaining(remaining);

      if (remaining === 0) {
        finishAssessment();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [state, isTimerPaused]);

  // Warn user before leaving/closing tab during assessment
  useEffect(() => {
    if (!state?.assessmentId) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Try to stop recording (may not complete before page closes)
      if (isRecording) {
        stopRecording();
      }
      // Show browser warning
      e.preventDefault();
      e.returnValue = 'You have an assessment in progress. Are you sure you want to leave?';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state?.assessmentId, isRecording, stopRecording]);

  // Reading timer - auto-advance after 60 seconds
  useEffect(() => {
    if (!isAnswerSubmitted) return;

    const interval = setInterval(() => {
      setReadingTimeLeft(prev => {
        if (prev <= 1) {
          handleNext();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isAnswerSubmitted]);

  // Reset selection and timer for each question
  useEffect(() => {
    if (!state) return;
    setQuestionStartTime(Date.now());
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setIsTimerPaused(false);
    setCorrectAnswer(null);
    setExplanations({});
    setReadingTimeLeft(45);
    setSourceContext(null);
    setIsSourceExpanded(false);
  }, [state?.currentQuestionNumber]);

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

  const currentQuestion = state?.currentQuestion;
  const isLastQuestion = state ? state.currentQuestionNumber >= state.totalQuestions : false;

  const handleSelectOption = (optionId: string) => {
    if (!isAnswerSubmitted) {
      setSelectedOption(optionId);
    }
  };

  const finishAssessment = useCallback(async () => {
    if (!state) return;

    // Mark assessment as completed to allow navigation
    setIsAssessmentCompleted(true);
    unblock();

    // Stop recording first (uploads remaining chunks and finalizes)
    console.log('[Proctoring] Stopping recording...');
    await stopRecording();

    // Stop camera
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    // Exit fullscreen
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(console.error);
    }

    // Complete assessment
    await api.assessments.complete(state.assessmentId);

    // Navigate to results with assessment type info
    const isSkillAssessment = assessmentConfig?.assessmentType === 'skill';
    navigate(`/results/${state.assessmentId}`, {
      state: {
        isSkillAssessment,
        skillName: isSkillAssessment ? currentQuestion?.skillName : null,
      }
    });
  }, [state, navigate, assessmentConfig, currentQuestion, stopRecording, unblock]);

  // Store next question from submit response
  const [nextQuestionData, setNextQuestionData] = useState<Question | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  // Submit answer - reveals correct answer and explanations
  const handleSubmit = async () => {
    if (!selectedOption || !currentQuestion || !state) return;

    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);

    // Submit answer to API - API returns correct answer, explanations, and next_question
    const response = await api.assessments.submitAnswer(state.assessmentId, {
      question_id: currentQuestion.id,
      selected_option: selectedOption,
      time_taken_seconds: timeSpent,
    });

    // Store next question for when user clicks "Next"
    if (response.next_question) {
      setNextQuestionData(transformQuestion(response.next_question));
    } else {
      setNextQuestionData(null);
    }
    setIsComplete(response.is_complete || false);

    // Update answered count
    setState(prev => prev ? {
      ...prev,
      answeredCount: prev.answeredCount + 1,
    } : prev);

    // Set revealed data
    setCorrectAnswer(response.correct_answer);
    setExplanations(response.explanations || {});
    setSourceContext(response.source_context || null);
    setIsAnswerSubmitted(true);
    setIsTimerPaused(true);
    setReadingTimeLeft(45);
  };

  // Move to next question
  const handleNext = useCallback(() => {
    if (!state) return;

    if (isComplete || !nextQuestionData) {
      finishAssessment();
    } else {
      setState(prev => prev ? {
        ...prev,
        currentQuestion: nextQuestionData,
        currentQuestionNumber: prev.currentQuestionNumber + 1,
      } : prev);
      setNextQuestionData(null);
    }
  }, [state, isComplete, nextQuestionData, finishAssessment]);

  const handleSkip = async () => {
    if (!state || !currentQuestion) return;

    // Submit skip to backend
    const response = await api.assessments.submitAnswer(state.assessmentId, {
      question_id: currentQuestion.id,
      selected_option: 'SKIP',
      time_taken_seconds: Math.floor((Date.now() - questionStartTime) / 1000),
    });

    if (response.is_complete || !response.next_question) {
      finishAssessment();
    } else {
      setState(prev => prev ? {
        ...prev,
        currentQuestion: transformQuestion(response.next_question),
        currentQuestionNumber: prev.currentQuestionNumber + 1,
      } : prev);
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
            Question {state.currentQuestionNumber}
          </div>

          <div className="flex-1 max-w-md mx-8">
            <Progress
              value={(timeRemaining / state.timeLimit) * 100}
              className="h-2"
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Reading Time Badge - shown when answer submitted */}
            {isAnswerSubmitted && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary">
                <BookOpen className="w-4 h-4" />
                <span className="font-mono font-semibold">{readingTimeLeft}s</span>
              </div>
            )}

            {/* Main Timer */}
            <div
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg',
                isTimerPaused
                  ? 'bg-muted text-muted-foreground'
                  : timeRemaining < 60
                    ? 'bg-destructive/10 text-destructive'
                    : 'bg-muted text-foreground'
              )}
            >
              <Clock className="w-4 h-4" />
              <span className="font-mono font-semibold">
                {formatTime(timeRemaining)}
                {isTimerPaused && ' (paused)'}
              </span>
            </div>
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
              <Badge
                variant="outline"
                className={cn(
                  "capitalize",
                  // Gaming-inspired progression: Bronze → Silver → Gold → Platinum → Diamond
                  currentQuestion.bloomLevel === 'remember' && "bg-amber-600/10 text-amber-700 border-amber-300", // Bronze
                  currentQuestion.bloomLevel === 'understand' && "bg-slate-400/10 text-slate-600 border-slate-300", // Silver
                  currentQuestion.bloomLevel === 'apply' && "bg-yellow-500/10 text-yellow-700 border-yellow-300", // Gold
                  currentQuestion.bloomLevel === 'analyze' && "bg-cyan-500/10 text-cyan-700 border-cyan-300", // Platinum
                  currentQuestion.bloomLevel === 'evaluate' && "bg-violet-500/10 text-violet-700 border-violet-300" // Diamond
                )}
              >
                {currentQuestion.bloomLevel}
              </Badge>
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
                const isCorrect = correctAnswer === option.id;
                const showResult = isAnswerSubmitted;

                return (
                  <Card
                    key={option.id}
                    className={cn(
                      'transition-all',
                      !showResult && 'cursor-pointer hover:border-primary/50',
                      !showResult && isSelected && 'border-primary bg-primary/5',
                      showResult && isCorrect && 'border-success bg-success/10',
                      showResult && isSelected && !isCorrect && 'border-destructive bg-destructive/10',
                      showResult && !isSelected && !isCorrect && 'opacity-60'
                    )}
                    onClick={() => handleSelectOption(option.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Option indicator */}
                        <div
                          className={cn(
                            'w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
                            showResult && isCorrect && 'border-success bg-success text-white',
                            showResult && isSelected && !isCorrect && 'border-destructive bg-destructive text-white',
                            !showResult && isSelected && 'border-primary bg-primary text-primary-foreground',
                            !showResult && !isSelected && 'border-muted-foreground/30 text-muted-foreground'
                          )}
                        >
                          {showResult ? (
                            isCorrect ? (
                              <Check className="w-4 h-4" />
                            ) : isSelected ? (
                              <X className="w-4 h-4" />
                            ) : (
                              <span className="text-sm font-medium">{option.id}</span>
                            )
                          ) : isSelected ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <span className="text-sm font-medium">{option.id}</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-foreground pt-1">{option.text}</p>
                          {/* Show explanation after submit */}
                          {showResult && explanations[option.id] && (
                            <p
                              className={cn(
                                'mt-2 text-sm',
                                isCorrect ? 'text-success' : 'text-muted-foreground'
                              )}
                            >
                              {explanations[option.id]}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4">
              {!isAnswerSubmitted ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSkip}
                    className="text-muted-foreground"
                  >
                    <SkipForward className="w-4 h-4 mr-2" />
                    Skip
                  </Button>
                  <Button onClick={handleSubmit} disabled={!selectedOption}>
                    Submit Answer
                    <Check className="w-4 h-4 ml-2" />
                  </Button>
                </>
              ) : (
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <BookOpen className="w-4 h-4" />
                    Review the explanation ({readingTimeLeft}s remaining)
                  </div>
                  <Button onClick={handleNext}>
                    {isLastQuestion ? 'Finish Assessment' : 'Next Question'}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}
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
                  {/* Fullscreen indicator overlay */}
                  {!isFullscreen && (
                    <div className="absolute inset-0 bg-destructive/20 flex items-center justify-center">
                      <div className="bg-background/90 px-2 py-1 rounded text-xs text-destructive font-medium">
                        Not Fullscreen
                      </div>
                    </div>
                  )}
                </div>
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Shield className={cn(
                      "w-4 h-4",
                      isFullscreen ? "text-success" : "text-warning"
                    )} />
                    <span className={cn(
                      "text-xs font-medium",
                      isFullscreen ? "text-success" : "text-warning"
                    )}>
                      {isFullscreen ? "Proctoring Active" : "Fullscreen Required"}
                    </span>
                  </div>
                  {/* Show violation counts if any */}
                  {(proctoringState.copyAttemptCount > 0 || proctoringState.blockedShortcutCount > 0 || state.tabSwitches > 0) && (
                    <div className="text-xs text-muted-foreground space-y-1 pt-1 border-t">
                      {state.tabSwitches > 0 && (
                        <div>Tab switches: {state.tabSwitches}</div>
                      )}
                      {proctoringState.copyAttemptCount > 0 && (
                        <div>Copy attempts: {proctoringState.copyAttemptCount}</div>
                      )}
                      {proctoringState.blockedShortcutCount > 0 && (
                        <div>Blocked shortcuts: {proctoringState.blockedShortcutCount}</div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Source Context - shown during reading time */}
              {isAnswerSubmitted && sourceContext && (sourceContext.book_name || sourceContext.section) && (
                <Card className="mt-3 overflow-hidden">
                  <button
                    onClick={() => setIsSourceExpanded(!isSourceExpanded)}
                    className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <BookMarked className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">Source Reference</span>
                    </div>
                    <ChevronDown
                      className={cn(
                        "w-4 h-4 text-muted-foreground transition-transform",
                        isSourceExpanded && "rotate-180"
                      )}
                    />
                  </button>
                  {isSourceExpanded && (
                    <CardContent className="pt-0 pb-3 px-3 border-t">
                      <div className="space-y-2 text-xs">
                        {sourceContext.book_name && (
                          <div className="flex items-start gap-2">
                            <FileText className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div>
                              <div className="text-muted-foreground">Book</div>
                              <div className="font-medium text-foreground">
                                {sourceContext.book_name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                              </div>
                            </div>
                          </div>
                        )}
                        {sourceContext.section && (
                          <div className="flex items-start gap-2">
                            <BookOpen className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div>
                              <div className="text-muted-foreground">Section</div>
                              <div className="font-medium text-foreground">{sourceContext.section}</div>
                            </div>
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-2 italic">
                        Review this section for deeper understanding
                      </p>
                    </CardContent>
                  )}
                </Card>
              )}
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

      {/* Fullscreen Warning Modal */}
      <Dialog open={showFullscreenWarning} onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-md"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-destructive/10">
                <Maximize2 className="w-5 h-5 text-destructive" />
              </div>
              <DialogTitle>Fullscreen Required</DialogTitle>
            </div>
            <DialogDescription>
              You exited fullscreen mode. This assessment requires fullscreen for proctoring purposes.
              {fullscreenExitCount > 1 && (
                <span className="block mt-2 text-destructive font-medium">
                  Warning: You have exited fullscreen {fullscreenExitCount} times. This will be flagged in your integrity report.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex-col gap-2">
            <Button
              onClick={async () => {
                const success = await requestFullscreen();
                if (success) {
                  setShowFullscreenWarning(false);
                }
              }}
              className="w-full"
            >
              <Maximize2 className="w-4 h-4 mr-2" />
              Return to Fullscreen
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowFullscreenWarning(false);
                navigate('/dashboard');
              }}
              className="w-full text-destructive hover:text-destructive"
            >
              Cancel Assessment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Navigation Warning Modal */}
      <Dialog open={showNavigationWarning} onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-md"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <DialogTitle>Leave Assessment?</DialogTitle>
            </div>
            <DialogDescription>
              You have an assessment in progress. If you leave now, your assessment will be marked as incomplete and you may not be able to retake it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex-col gap-2">
            <Button
              onClick={() => {
                setShowNavigationWarning(false);
              }}
              className="w-full"
            >
              Continue Assessment
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowNavigationWarning(false);
                setIsAssessmentCompleted(true);
                unblock();
                navigate('/dashboard');
              }}
              className="w-full text-destructive hover:text-destructive"
            >
              Leave Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Media Blocked Warning Modal */}
      <Dialog open={showMediaBlockedWarning} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-destructive/10">
                <Camera className="w-5 h-5 text-destructive" />
              </div>
              <DialogTitle>Camera/Microphone Access Required</DialogTitle>
            </div>
            <DialogDescription>
              Your camera or microphone access was blocked. The assessment timer is paused.
              Please grant access to continue.
              {mediaBlockedCount > 1 && (
                <span className="block mt-2 text-destructive font-medium">
                  Warning: Camera/microphone has been blocked {mediaBlockedCount} times. This will be flagged in your integrity report.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              onClick={requestMediaPermission}
              className="w-full"
            >
              <Camera className="w-4 h-4 mr-2" />
              Grant Access & Resume
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CandidateAssessment;
