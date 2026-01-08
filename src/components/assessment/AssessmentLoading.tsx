import { useAssessment } from '@/context/AssessmentContext';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, BarChart3, Brain, CheckCircle2 } from 'lucide-react';

const AssessmentLoading = () => {
  const { questions } = useAssessment();

  const skillCount = new Set(questions.map(q => q.skillId)).size;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full border shadow-lg animate-fade-in">
        <CardContent className="p-8 text-center space-y-6">
          {/* Loading Animation */}
          <div className="relative">
            <div className="w-20 h-20 mx-auto rounded-full border-4 border-muted flex items-center justify-center">
              <div className="w-16 h-16 rounded-full border-4 border-t-primary border-r-primary border-b-transparent border-l-transparent animate-spin" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Brain className="w-8 h-8 text-primary animate-pulse-slow" />
            </div>
          </div>

          {/* Text */}
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">
              Analyzing Your Responses
            </h2>
            <p className="text-muted-foreground">
              Please wait while we evaluate your assessment...
            </p>
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-8 pt-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-primary">
                <BarChart3 className="w-4 h-4" />
                <span className="text-2xl font-bold">{questions.length}</span>
              </div>
              <p className="text-xs text-muted-foreground">Questions</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-primary">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-2xl font-bold">{skillCount}</span>
              </div>
              <p className="text-xs text-muted-foreground">Skills</p>
            </div>
          </div>

          {/* Progress Dots */}
          <div className="flex justify-center gap-2 pt-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-primary animate-pulse"
                style={{ animationDelay: `${i * 0.3}s` }}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AssessmentLoading;
