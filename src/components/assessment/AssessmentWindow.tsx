import { useState, useEffect, useRef, useCallback } from 'react';
import { useAssessment } from '@/context/AssessmentContext';
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

const AssessmentWindow = () => {
  const {
    questions,
    currentQuestionIndex,
    answers,
    timeLimit,
    startTime,
    proctoringEnabled,
    cameraActive,
    submitAnswer,
    nextQuestion,
    skipQuestion,
    recordTabSwitch,
    finishAssessment,
  } = useAssessment();

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [showTabWarning, setShowTabWarning] = useState(false);
  const [tabAwayTime, setTabAwayTime] = useState(0);
  const [bonusProgress, setBonusProgress] = useState(100);
  const videoRef = useRef<HTMLVideoElement>(null);
  const tabAwayStartRef = useRef<number | null>(null);

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const hasAnswered = answers.has(currentQuestion?.id);

  // Timer
  useEffect(() => {
    if (!startTime) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, timeLimit - elapsed);
      setTimeRemaining(remaining);

      if (remaining === 0) {
        finishAssessment();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, timeLimit, finishAssessment]);

  // Speed bonus drain
  useEffect(() => {
    setQuestionStartTime(Date.now());
    setBonusProgress(100);
    setSelectedOption(null);

    const interval = setInterval(() => {
      const elapsed = (Date.now() - questionStartTime) / 1000;
      const progress = Math.max(0, 100 - (elapsed / 15) * 100);
      setBonusProgress(progress);
    }, 100);

    return () => clearInterval(interval);
  }, [currentQuestionIndex]);

  // Tab visibility detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        tabAwayStartRef.current = Date.now();
      } else if (tabAwayStartRef.current) {
        const awayDuration = Math.floor((Date.now() - tabAwayStartRef.current) / 1000);
        setTabAwayTime(awayDuration);
        setShowTabWarning(true);
        recordTabSwitch();
        tabAwayStartRef.current = null;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [recordTabSwitch]);

  // Camera stream
  useEffect(() => {
    if (proctoringEnabled && cameraActive) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'user', width: 160, height: 120 } })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(console.error);
    }

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [proctoringEnabled, cameraActive]);

  const handleSelectOption = (optionId: string) => {
    if (hasAnswered) return;
    setSelectedOption(optionId);
  };

  const handleSubmitAndNext = () => {
    if (!selectedOption || !currentQuestion) return;

    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
    submitAnswer(currentQuestion.id, selectedOption, timeSpent);

    if (isLastQuestion) {
      finishAssessment();
    } else {
      nextQuestion();
    }
  };

  const handleSkip = () => {
    if (isLastQuestion) {
      finishAssessment();
    } else {
      skipQuestion();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyDots = (difficulty: 1 | 2 | 3) => {
    return Array.from({ length: 3 }, (_, i) => (
      <span
        key={i}
        className={`w-2 h-2 rounded-full ${
          i < difficulty ? 'bg-primary' : 'bg-muted'
        }`}
      />
    ));
  };

  if (!currentQuestion) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Bar */}
      <header className="border-b bg-card sticky top-0 z-20">
        <div className="container max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Question Counter */}
          <div className="text-sm font-medium text-foreground">
            Question {currentQuestionIndex + 1} of {questions.length}
          </div>

          {/* Progress Bar */}
          <div className="flex-1 max-w-md mx-8">
            <Progress
              value={((currentQuestionIndex + 1) / questions.length) * 100}
              className="h-2"
            />
          </div>

          {/* Timer */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
              timeRemaining < 60
                ? 'bg-destructive/10 timer-warning'
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
              <div className="flex items-center gap-1">
                {getDifficultyDots(currentQuestion.difficulty)}
              </div>
            </div>

            {/* Question */}
            <Card className="border shadow-card">
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
                    className={`option-card ${isSelected ? 'option-card-selected' : ''}`}
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
              <div className="proficiency-bar">
                <div
                  className="progress-fill gradient-primary"
                  style={{ width: `${bonusProgress}%` }}
                />
              </div>
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
                className="gradient-primary hover:opacity-90"
              >
                {isLastQuestion ? 'Finish Assessment' : 'Next'}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* Proctoring Sidebar */}
          {proctoringEnabled && (
            <div className="lg:col-span-1">
              <Card className="sticky top-20 overflow-hidden">
                <div className={`aspect-video bg-muted relative ${cameraActive ? 'proctoring-border-active' : 'proctoring-border-warning'}`}>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {!cameraActive && (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted">
                      <Camera className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
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

export default AssessmentWindow;
