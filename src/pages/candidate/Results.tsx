import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Download, Check, X, AlertTriangle, ArrowUp, ArrowDown, CheckCircle, Target, BookOpen, Trophy, Star, Monitor, Maximize2, Users, User, Code, Copy, Clock, Flag, AlertCircle, Brain, TrendingUp, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import StarRating from '@/components/assessment/StarRating';
import { cn } from '@/lib/utils';
import { api } from '@/services/api';
import ProctoringEvidence from '@/components/proctoring/ProctoringEvidence';

interface AssessmentFlag {
  type: string;
  severity: string;
  message?: string;
  task_id?: string;
  task_name?: string;
}

interface SkillResult {
  skill_id: string;
  skill_name: string;
  proficiency_level: number;
  score: number;
  is_strength: boolean;
  tasks: Array<{
    task_id: string;
    task_name: string;
    correct: boolean;
    time_taken_seconds: number;
    status: string;
    flags?: AssessmentFlag[];
  }>;
  strengths: string[];
  weaknesses: string[];
  flags?: AssessmentFlag[];
}

interface FlaggedActivity {
  type: string;
  icon: string;
  label: string;
  count: number;
  flag_level: string;
  timestamps?: string[] | null;
}

interface LLMSkillReport {
  metadata: {
    candidate_name?: string;
    skill_name?: string;
    assessment_date?: string;
    skill_score?: number;
    pass_fail?: 'PASS' | 'FAIL';
    confidence_score?: number;
    confidence_label?: string;
  };
  proficiency_summary?: {
    skill_profile?: string;
    mastery_level?: string;
    core_insight?: string;
    practical_implication?: string;
  };
  performance_summary?: string;  // One-liner positive summary from LLM
  task_performance?: Array<{
    task_name: string;
    task_score: number;
    ceiling_score: number;
    accuracy_score?: number;
    highest_level?: string;
    confidence_label?: string;
    status: string;
    can_do?: string;
    cannot_do?: string | null;
    flags?: AssessmentFlag[];
  }>;
  blooms_breakdown?: {
    highest_level_achieved?: string;
    levels_demonstrated?: string[];
    level_breakdown?: Record<string, string>;
    interpretation?: string;
  };
  knowledge_gaps?: Array<{
    gap: string;
    severity: string;
    error_count?: number;
    what_went_wrong?: string;
    why_this_pattern?: string;
  }>;
  recommendations?: {
    focus_areas?: string[];
    next_steps?: string[];
    target_bloom_level?: string;
  };
}

interface ResultsData {
  assessment_id: string;
  role_name: string;
  skill_name?: string;
  candidate_name?: string;
  assessment_type?: string;
  overall: {
    proficiency_level: number;
    score: number;
    accuracy_percentage: number;
    total_time_seconds: number;
    percentile: number | null;
    confidence_score?: number;
    confidence_label?: string;
    flags?: AssessmentFlag[];
  };
  skills: SkillResult[];
  recommendations: string[];
  integrity?: {
    cheating_risk: string;
    integrity_score: number;
    flags: Array<{ question_id: string; severity: string; reason: string }>;
    recommendation: string;
  };
  report?: LLMSkillReport | Record<string, unknown>;
  report_ready?: boolean;
  flagged_activities?: FlaggedActivity[] | null;
}

export const CandidateResults = () => {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [countdown, setCountdown] = useState(5);

  // Get assessment type from navigation state
  const locationState = location.state as { isSkillAssessment?: boolean; skillName?: string } | null;
  const isSkillAssessment = locationState?.isSkillAssessment ?? false;
  const skillName = locationState?.skillName;

  // Auto-redirect countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          navigate('/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  // Show congratulations and redirect
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full">
        <CardContent className="text-center py-12">
          <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-success" />
          </div>
          <h1 className="text-2xl font-bold mb-3">
            {isSkillAssessment ? 'Assessment Complete!' : 'Assessment Submitted'}
          </h1>
          <p className="text-muted-foreground mb-2">
            {isSkillAssessment
              ? `Great job completing the ${skillName || 'skill'} assessment!`
              : 'Your assessment has been submitted successfully.'}
          </p>
          <p className="text-muted-foreground mb-6">
            {isSkillAssessment
              ? "We're generating your detailed proficiency report. You'll be notified when it's ready to view on your dashboard."
              : 'Your hiring manager will review your results and get back to you.'}
          </p>
          <Button onClick={() => navigate('/dashboard')} className="w-full">
            Go to Dashboard ({countdown}s)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

// Component for viewing detailed results (accessed from dashboard)
export const CandidateResultsDetail = () => {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [results, setResults] = useState<ResultsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPollingReport, setIsPollingReport] = useState(false);

  useEffect(() => {
    const loadResults = async () => {
      if (!assessmentId) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await api.assessments.getResults(assessmentId);
        setResults(data);

        // If report is not ready, start polling
        if (data.report_ready === false) {
          setIsPollingReport(true);
        }
      } catch (error) {
        console.error('Failed to load results:', error);
        toast({ title: 'Error', description: 'Failed to load assessment results', variant: 'destructive' });
      }
      setIsLoading(false);
    };
    loadResults();
  }, [assessmentId, toast]);

  // Poll for report when it's not ready
  useEffect(() => {
    if (!isPollingReport || !assessmentId) return;

    const pollInterval = setInterval(async () => {
      try {
        const data = await api.assessments.getResults(assessmentId);
        setResults(data);

        if (data.report_ready === true) {
          setIsPollingReport(false);
          toast({ title: 'Report Ready', description: 'Your detailed proficiency report is now available!' });
        }
      } catch (error) {
        console.error('Polling failed:', error);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  }, [isPollingReport, assessmentId, toast]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!results) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <p className="text-muted-foreground">No results available</p>
      </div>
    );
  }

  const isSkillAssessment = results.assessment_type === 'skill';

  // Check if we have an LLM-generated skill report (NEW FORMAT)
  const llmReport = results.report as LLMSkillReport | undefined;
  const hasLLMReport = results.report_ready === true && llmReport && llmReport.metadata && llmReport.proficiency_summary;
  const isReportPending = results.report_ready === false;

  // Helper function for flagged activity icons
  const getActivityIcon = (iconType: string) => {
    const iconProps = { className: "h-4 w-4" };
    switch (iconType) {
      case 'browser': return <Monitor {...iconProps} />;
      case 'fullscreen': return <Maximize2 {...iconProps} />;
      case 'users': return <Users {...iconProps} />;
      case 'user': return <User {...iconProps} />;
      case 'code': return <Code {...iconProps} />;
      case 'copy': return <Copy {...iconProps} />;
      case 'clock': return <Clock {...iconProps} />;
      default: return <AlertCircle {...iconProps} />;
    }
  };

  // Use LLM report data if available, fallback to basic data
  const proficiencyLevel = results.overall.proficiency_level;

  const scoreDisplay = hasLLMReport && llmReport.metadata.skill_score !== undefined
    ? `${llmReport.metadata.skill_score.toFixed(0)}%`
    : `${results.overall.score}%`;

  const skillName = hasLLMReport && llmReport.metadata.skill_name
    ? llmReport.metadata.skill_name
    : results.skill_name || results.role_name;

  const passFail = hasLLMReport ? llmReport.metadata.pass_fail : undefined;

  const handleDownload = () => {
    // Use browser's print dialog which allows saving as PDF
    // This maintains the exact same styling as the screen
    toast({ title: 'Preparing PDF...', description: 'Print dialog will open - select "Save as PDF"' });

    // Small delay to show toast before print dialog
    setTimeout(() => {
      window.print();
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Assessment Complete</h1>
          <p className="text-muted-foreground">{skillName}</p>
        </div>
        <Button variant="outline" onClick={handleDownload} disabled={isReportPending}>
          <Download className="h-4 w-4 mr-2" />
          {isReportPending ? 'Report Generating...' : 'Download Report'}
        </Button>
      </div>

      {/* Overall Summary with LLM Report - Compact Layout */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-6">
            {/* Left: Star Rating */}
            <div className="flex-shrink-0">
              <StarRating level={proficiencyLevel} size="md" />
            </div>

            {/* Stats - inline with stars */}
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-xl font-bold">{Math.round(results.overall.total_time_seconds / 60)}m</div>
                <div className="text-xs text-muted-foreground">Time</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold">{scoreDisplay}</div>
                <div className="text-xs text-muted-foreground">Score</div>
              </div>
            </div>

            {/* One-liner summary */}
            {hasLLMReport && llmReport.performance_summary && (
              <div className="flex-1 px-4">
                <p className="text-sm text-muted-foreground italic">{llmReport.performance_summary}</p>
              </div>
            )}

            {/* Spacer if no summary */}
            {(!hasLLMReport || !llmReport.performance_summary) && <div className="flex-1" />}

            {/* Right: Badges */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Confidence Badge */}
              {hasLLMReport && llmReport.metadata.confidence_label && (
                <Badge className={cn(
                  "text-sm px-3 py-1",
                  llmReport.metadata.confidence_label === 'High' ? 'bg-green-500/10 text-green-600 border-green-200' :
                  llmReport.metadata.confidence_label === 'Medium' ? 'bg-amber-500/10 text-amber-600 border-amber-200' :
                  'bg-orange-500/10 text-orange-600 border-orange-200'
                )} variant="outline">
                  {llmReport.metadata.confidence_label} Confidence
                </Badge>
              )}
              {/* Overall-level flags (e.g., ASSESSMENT_INCOMPLETE) */}
              {results.overall.flags && results.overall.flags.filter(f => !f.task_id).map((flag, fi) => (
                <Badge key={fi} variant="outline" className={cn(
                  "text-sm px-3 py-1",
                  flag.severity === 'HIGH' ? 'bg-red-500/10 text-red-600 border-red-200' :
                  'bg-amber-500/10 text-amber-600 border-amber-200'
                )}>
                  {flag.type.replace(/_/g, ' ')}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Generating Status */}
      {isReportPending && (
        <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
          <CardContent className="py-6">
            <div className="flex items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              <div>
                <h3 className="font-semibold">Generating Detailed Report...</h3>
                <p className="text-sm text-muted-foreground">
                  Our AI is analyzing your performance to provide personalized insights.
                  This usually takes 15-30 seconds. The page will update automatically when ready.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* LLM Report: Task Performance */}
      {hasLLMReport && llmReport.task_performance && llmReport.task_performance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Task Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="space-y-2">
              {llmReport.task_performance.map((task, i) => (
                <AccordionItem key={i} value={`task-${i}`} className="border rounded-lg overflow-hidden">
                  <AccordionTrigger className="hover:no-underline px-4 py-3 bg-muted/30">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">{task.task_name}</span>
                        {/* Task-level flags */}
                        {task.flags && task.flags.length > 0 && task.flags.map((flag, fi) => (
                          <Badge key={fi} variant="outline" className={cn(
                            "text-xs",
                            flag.severity === 'HIGH' ? 'bg-red-500/10 text-red-600 border-red-200' :
                            'bg-amber-500/10 text-amber-600 border-amber-200'
                          )}>
                            {flag.type.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold">{task.task_score?.toFixed(0)}%</span>
                        <Badge variant={task.status === 'proficient' ? 'default' : task.status === 'needs_practice' ? 'secondary' : 'outline'}>
                          {task.status?.replace('_', ' ')}
                        </Badge>
                        {task.confidence_label && (
                          <Badge variant="outline" className={cn(
                            "text-xs",
                            task.confidence_label === 'High' ? 'text-green-600 border-green-200' :
                            task.confidence_label === 'Medium' ? 'text-amber-600 border-amber-200' :
                            'text-orange-600 border-orange-200'
                          )}>
                            {task.confidence_label}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 py-3 bg-background">
                    {task.can_do && (
                      <div className="mb-2">
                        <span className="text-xs font-medium text-green-600">Can Do:</span>
                        <p className="text-sm">{task.can_do}</p>
                      </div>
                    )}
                    {task.cannot_do && (
                      <div>
                        <span className="text-xs font-medium text-amber-600">Developing:</span>
                        <p className="text-sm">{task.cannot_do}</p>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* Knowledge Gaps / Areas for Development removed - covered by Recommendations */}

      {/* Skill Breakdown and Detailed Skill Analysis removed - Task Performance covers this */}

      {/* LLM Recommendations - Moved above Flagged Activities */}
      {hasLLMReport && llmReport.recommendations && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Focus Areas */}
              {llmReport.recommendations.focus_areas && llmReport.recommendations.focus_areas.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Focus Areas</h4>
                  <ul className="space-y-2">
                    {llmReport.recommendations.focus_areas.map((focus, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Target className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        {focus}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Next Steps */}
              {llmReport.recommendations.next_steps && llmReport.recommendations.next_steps.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Next Steps</h4>
                  <ul className="space-y-2">
                    {llmReport.recommendations.next_steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <ChevronRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Basic Recommendations (fallback) */}
      {!hasLLMReport && results.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recommended Learning Path</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2">
              {results.recommendations.map((rec, i) => (
                <li key={i} className="text-muted-foreground">{rec}</li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Flagged Activities (Proctoring Evidence) */}
      <ProctoringEvidence
        assessmentId={results.assessment_id}
        showVideoClips={true}
        isAdmin={false}
      />

      {/* Actions */}
      <div className="flex justify-center gap-4">
        <Button variant="outline" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
};

// Helper to convert proficiency level string to number
function getProficiencyLevelNumber(level: string): number {
  const levels: Record<string, number> = {
    'Expert': 5,
    'Advanced': 4,
    'Intermediate': 3,
    'Developing': 2,
    'Beginner': 1
  };
  return levels[level] || 3;
}

export default CandidateResults;
