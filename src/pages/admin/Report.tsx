import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Mail, CheckCircle2, XCircle, AlertTriangle, ChevronRight, Brain, Target, TrendingUp, AlertCircle, Monitor, Maximize2, Users, User, Code, Copy, Clock, Flag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { api } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import FitToRoleGauge from '@/components/assessment/FitToRoleGauge';

// =============================================================================
// TYPE DEFINITIONS - Aligned with Bloom's Taxonomy Scoring
// =============================================================================

interface AssessmentFlag {
  type: string;
  severity: string;
  message?: string;
  task_id?: string;
  task_name?: string;
}

interface TaskData {
  task_name: string;
  task_score: number;
  ceiling_score: number;
  accuracy_score?: number;
  highest_level?: string;
  confidence?: number;
  confidence_label?: string;
  status: string;
  correct_count?: number;
  incorrect_count?: number;
  insight?: string;
  can_do?: string;
  cannot_do?: string | null;
  level?: string;
  flags?: AssessmentFlag[];
}

interface SkillData {
  skill_name: string;
  skill_score: number;
  pass_fail: 'PASS' | 'FAIL';
  confidence_score?: number;
  confidence_label?: string;
  correct_count?: number;
  incorrect_count?: number;
  capability?: string;
  limitation?: string | null;
  tasks: TaskData[];
  flags?: Array<{
    type: string;
    severity: string;
    message: string;
    task_name?: string;
  }>;
}

interface PatternInsight {
  pattern: string;
  scope: string;
  observation: string;
  inference: string;
}

interface KnowledgeGap {
  skill?: string;
  gap?: string;
  bloom_level_gap?: string;
  failed_on?: string;
  severity?: string;
  error_count?: number;
  what_went_wrong?: string;
  why_this_pattern?: string;
}

interface FlaggedActivity {
  type: string;  // tab_switch, fullscreen_exit, multiple_faces, no_face, timing, etc.
  icon: string;  // browser, fullscreen, users, user, clock
  label: string;  // Human-readable label
  count: number;  // Number of occurrences
  flag_level: string;  // "flag" (🚩) or "warning" (🏳)
  timestamps?: string[] | null;  // ["4:51", "5:06"]
}

interface LLMReport {
  metadata?: {
    candidate_name?: string;
    position?: string;
    skill_name?: string;
    assessment_date?: string;
    overall_score?: number;
    skill_score?: number;
    overall_fitment?: 'RECOMMENDED' | 'CONDITIONAL' | 'NOT_RECOMMENDED';
    pass_fail?: 'PASS' | 'FAIL';
    confidence_score?: number;
    confidence_label?: string;
    has_critical_flags?: boolean;
  };

  // Persona Report Fields
  assessment_summary?: {
    profile_type?: string;
    standout_signal?: string;
    fit_assessment?: string;
    overall_readiness?: string;
  };
  pattern_analysis?: {
    cross_question_insights?: PatternInsight[];
    learning_style_indicator?: {
      evidence?: string;
      hypothesis?: string;
    };
    knowledge_gap_structure?: {
      surface_gap?: string;
      root_cause?: string;
      evidence?: string;
    };
    persona_summary?: string;
  };
  section_1_summary?: {
    next_round_fitment?: string;
    candidate_profile?: string;
  };
  section_2_skills?: SkillData[];
  section_3_strengths?: {
    technical_strengths?: string[];
    demonstrated_capabilities?: string[];
  };
  section_4_development?: {
    growth_areas?: string[];
    gaps_detail?: KnowledgeGap[];
    interview_focus?: string[];
  };
  section_5_flags?: {
    critical_flags?: string[];
    warning_flags?: string[];
    assessment_quality?: string;
  };

  // Skill Report Fields
  proficiency_summary?: {
    skill_profile?: string;
    mastery_level?: string;
    core_insight?: string;
    practical_implication?: string;
  };
  task_performance?: TaskData[];
  blooms_breakdown?: {
    highest_level_achieved?: string;
    levels_demonstrated?: string[];
    level_breakdown?: Record<string, string>;
    interpretation?: string;
  };
  task_assignment_guide?: {
    ready_to_own?: Array<{
      task_category: string;
      examples: string;
      evidence: string;
    }>;
    needs_supervision?: Array<{
      task_category: string;
      examples: string;
      evidence: string;
    }>;
  };
  knowledge_gaps?: KnowledgeGap[];
  recommendations?: {
    focus_areas?: string[];
    next_steps?: string[];
    target_bloom_level?: string;
  };
  flags?: {
    issues?: string[];
    confidence_note?: string | null;
  };
}

interface ReportData {
  invite_id: string;
  candidate: { name: string; email: string };
  template: { name: string; role: string };
  invited_at: string;
  started_at: string;
  completed_at: string;
  duration_minutes: number;
  overall_score: number;
  proficiency_level: number;
  percentile: number;
  questions_answered: number;
  total_questions: number;
  accuracy: number;
  integrity_score: number;
  skill_results: Array<{
    skill_id: string;
    skill_name: string;
    skill_score?: number;
    pass_fail?: string;
    confidence_label?: string;
    proficiency_level: number;
    is_strength: boolean;
    tasks?: TaskData[];
    task_results?: Array<{
      task_id: string;
      task_name: string;
      correct: boolean;
      time_taken: number;
      status: string;
    }>;
    strengths: string[];
    weaknesses: string[];
    flags?: Array<{ type: string; severity: string; message: string }>;
  }>;
  recommendations: string[];
  tab_switches: number;
  face_detection_issues: number;
  report?: LLMReport | null;
  report_ready?: boolean;
  overall_fitment?: string;
  confidence_label?: string;
  has_critical_flags?: boolean;
  flags?: Array<{ type: string; severity: string; message: string; task_name?: string; task_id?: string }>;
  flagged_activities?: FlaggedActivity[] | null;
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

const FitmentBadge = ({ fitment }: { fitment?: string }) => {
  const config = {
    RECOMMENDED: { color: 'bg-green-500/10 text-green-600 border-green-500/30', icon: CheckCircle2, label: 'Recommended' },
    CONDITIONAL: { color: 'bg-amber-500/10 text-amber-600 border-amber-500/30', icon: AlertTriangle, label: 'Conditional' },
    NOT_RECOMMENDED: { color: 'bg-red-500/10 text-red-600 border-red-500/30', icon: XCircle, label: 'Not Recommended' },
  }[fitment || 'CONDITIONAL'] || { color: 'bg-gray-500/10 text-gray-600 border-gray-500/30', icon: AlertCircle, label: fitment || 'Unknown' };

  const Icon = config.icon;

  return (
    <div className={cn('inline-flex items-center gap-2 px-4 py-2 rounded-full border font-semibold', config.color)}>
      <Icon className="h-5 w-5" />
      <span>{config.label}</span>
    </div>
  );
};

const PassFailStamp = ({ status, size = 'md' }: { status: 'PASS' | 'FAIL' | string; size?: 'sm' | 'md' | 'lg' }) => {
  const isPassing = status === 'PASS';
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  }[size];

  return (
    <span className={cn(
      'inline-flex items-center gap-1 font-bold rounded uppercase tracking-wide',
      sizeClasses,
      isPassing ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
    )}>
      {isPassing ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
      {status}
    </span>
  );
};

const ConfidenceBadge = ({ label }: { label?: string }) => {
  const colors = {
    High: 'bg-green-500/10 text-green-600',
    Medium: 'bg-amber-500/10 text-amber-600',
    Low: 'bg-orange-500/10 text-orange-600',
    Insufficient: 'bg-red-500/10 text-red-600',
  }[label || 'Medium'] || 'bg-gray-500/10 text-gray-600';

  return (
    <Badge variant="outline" className={cn('text-xs', colors)}>
      {label || 'Medium'} Confidence
    </Badge>
  );
};

const BloomLevelBadge = ({ level }: { level?: string }) => {
  const colors = {
    remember: 'bg-slate-500/10 text-slate-600',
    understand: 'bg-blue-500/10 text-blue-600',
    apply: 'bg-cyan-500/10 text-cyan-600',
    analyze: 'bg-violet-500/10 text-violet-600',
    evaluate: 'bg-purple-500/10 text-purple-600',
  }[level?.toLowerCase() || 'apply'] || 'bg-gray-500/10 text-gray-600';

  return (
    <Badge variant="outline" className={cn('text-xs capitalize', colors)}>
      {level || 'apply'}
    </Badge>
  );
};

const ScoreGauge = ({ score, label, size = 'md' }: { score: number; label: string; size?: 'sm' | 'md' | 'lg' }) => {
  const getColor = (s: number) => {
    if (s >= 70) return 'text-green-600';
    if (s >= 50) return 'text-amber-600';
    return 'text-red-600';
  };

  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-5xl',
  }[size];

  return (
    <div className="text-center">
      <div className={cn('font-bold', sizeClasses, getColor(score))}>{score.toFixed(0)}%</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
};

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

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const AdminReport = () => {
  const { inviteId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [report, setReport] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadReport = async () => {
      if (inviteId) {
        const data = await api.admin.getCandidateReport(inviteId);
        setReport(data);
        setIsLoading(false);
      }
    };
    loadReport();
  }, [inviteId]);

  if (isLoading || !report) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const llm = report.report;
  const isSkillReport = !!llm?.proficiency_summary;
  const overallFitment = llm?.metadata?.overall_fitment || report.overall_fitment || 'CONDITIONAL';
  const overallScore = llm?.metadata?.overall_score || llm?.metadata?.skill_score || report.overall_score;
  const confidenceLabel = llm?.metadata?.confidence_label || report.confidence_label || 'Medium';
  const hasCriticalFlags = llm?.metadata?.has_critical_flags || report.has_critical_flags || false;

  return (
    <div className="space-y-6 print:space-y-4">
      {/* ========== HEADER ========== */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/candidates')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{report.candidate.name}</h1>
            <p className="text-muted-foreground">{report.template.name} • {report.template.role}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" onClick={async () => {
            try {
              await api.admin.sendReportEmail(inviteId!);
              toast({ title: 'Email sent', description: 'Report has been sent to the candidate' });
            } catch {
              toast({ title: 'Error', description: 'Failed to send email', variant: 'destructive' });
            }
          }}>
            <Mail className="h-4 w-4 mr-2" />
            Send Report
          </Button>
        </div>
      </div>

      {/* ========== FITMENT SUMMARY CARD ========== */}
      <Card className="border-2 overflow-hidden">
        <CardContent className="py-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Speedometer Gauge - Fit to Role */}
            <div className="flex-shrink-0">
              <FitToRoleGauge score={overallScore} size="md" />
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Quick Stats */}
            <div className="flex gap-6 text-center">
              <div>
                <div className="text-xl font-bold">{report.duration_minutes}m</div>
                <div className="text-xs text-muted-foreground">Duration</div>
              </div>
              <div>
                <div className="text-xl font-bold">{report.questions_answered}/{report.total_questions}</div>
                <div className="text-xs text-muted-foreground">Answered</div>
              </div>
              <div>
                <div className="text-xl font-bold">{report.accuracy}%</div>
                <div className="text-xs text-muted-foreground">Accuracy</div>
              </div>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <ConfidenceBadge label={confidenceLabel} />
              {/* Overall-level flags (e.g., ASSESSMENT_INCOMPLETE) */}
              {report.flags && report.flags.filter(f => !f.task_name).map((flag, fi) => (
                <Badge key={fi} variant="outline" className={cn(
                  "text-xs",
                  flag.severity === 'HIGH' ? 'bg-red-500/10 text-red-600 border-red-200' :
                  'bg-amber-500/10 text-amber-600 border-amber-200'
                )}>
                  {flag.type.replace(/_/g, ' ')}
                </Badge>
              ))}
            </div>
          </div>

          {/* Assessment Summary */}
          {llm?.assessment_summary?.overall_readiness && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm">{llm.assessment_summary.overall_readiness}</p>
            </div>
          )}
          {llm?.section_1_summary?.candidate_profile && !llm?.assessment_summary?.overall_readiness && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm">{llm.section_1_summary.candidate_profile}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assessment Flags section removed - using Flagged Activities instead */}

      {/* ========== SKILL REPORT: PROFICIENCY SUMMARY ========== */}
      {isSkillReport && llm?.proficiency_summary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Proficiency Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {llm.proficiency_summary.skill_profile && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Profile</h4>
                <p className="text-sm">{llm.proficiency_summary.skill_profile}</p>
              </div>
            )}
            {llm.proficiency_summary.mastery_level && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Mastery Level</h4>
                <p className="text-sm">{llm.proficiency_summary.mastery_level}</p>
              </div>
            )}
            {llm.proficiency_summary.core_insight && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Core Insight</h4>
                <p className="text-sm font-medium text-primary">{llm.proficiency_summary.core_insight}</p>
              </div>
            )}
            {llm.proficiency_summary.practical_implication && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Practical Implication</h4>
                <p className="text-sm">{llm.proficiency_summary.practical_implication}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ========== PERSONA REPORT: STRENGTHS & DEVELOPMENT (Moved above Detailed Skill Assessment) ========== */}
      {!isSkillReport && (llm?.section_3_strengths || llm?.section_4_development) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Strengths */}
          {llm?.section_3_strengths && (
            <Card className="border-green-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-green-600 flex items-center gap-2 text-base">
                  <CheckCircle2 className="h-4 w-4" />
                  Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                {llm.section_3_strengths.technical_strengths && llm.section_3_strengths.technical_strengths.length > 0 && (
                  <ul className="space-y-1">
                    {llm.section_3_strengths.technical_strengths.map((s, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                )}
                {llm.section_3_strengths.demonstrated_capabilities && llm.section_3_strengths.demonstrated_capabilities.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <span className="text-xs font-medium text-muted-foreground">Demonstrated:</span>
                    <ul className="mt-1 space-y-1">
                      {llm.section_3_strengths.demonstrated_capabilities.map((c, i) => (
                        <li key={i} className="text-xs text-muted-foreground">{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Development Areas */}
          {llm?.section_4_development && (
            <Card className="border-amber-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-amber-600 flex items-center gap-2 text-base">
                  <TrendingUp className="h-4 w-4" />
                  Development Areas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {llm.section_4_development.growth_areas && llm.section_4_development.growth_areas.length > 0 && (
                  <ul className="space-y-1">
                    {llm.section_4_development.growth_areas.map((g, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        {g}
                      </li>
                    ))}
                  </ul>
                )}
                {llm.section_4_development.interview_focus && llm.section_4_development.interview_focus.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <span className="text-xs font-medium text-muted-foreground">Interview Focus:</span>
                    <ul className="mt-1 space-y-1">
                      {llm.section_4_development.interview_focus.map((f, i) => (
                        <li key={i} className="text-xs text-primary">{f}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ========== DETAILED SKILL ASSESSMENT ========== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {isSkillReport ? 'Task Performance' : 'Detailed Skill Assessment'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="space-y-3">
            {/* Skill Report: Task Performance - Simple list */}
            {isSkillReport && llm?.task_performance && llm.task_performance.map((task, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3 border rounded-lg bg-muted/20">
                <span className="font-semibold">{task.task_name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    {task.correct_count || 0}/{(task.correct_count || 0) + (task.incorrect_count || 0)}
                  </span>
                  <span className="text-sm font-bold">{task.task_score?.toFixed(0)}%</span>
                  <Badge variant={task.status === 'proficient' ? 'default' : task.status === 'needs_practice' ? 'secondary' : 'outline'}>
                    {task.status?.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            ))}

            {/* Persona Report: Skills with nested tasks */}
            {!isSkillReport && (llm?.section_2_skills || report.skill_results)?.map((skill, i) => {
              const skillData = skill as SkillData;
              const passFail = skillData.pass_fail || (skillData.skill_score >= 60 ? 'PASS' : 'FAIL');

              return (
                <AccordionItem key={i} value={`skill-${i}`} className="border rounded-lg overflow-hidden">
                  <AccordionTrigger className="hover:no-underline px-4 py-3 bg-muted/30">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">{skillData.skill_name}</span>
                        <PassFailStamp status={passFail} size="sm" />
                        {skillData.confidence_label && (
                          <ConfidenceBadge label={skillData.confidence_label} />
                        )}
                        {/* Skill-level flags - show count if there are any task flags */}
                        {skillData.flags && skillData.flags.length > 0 && (
                          <Badge variant="outline" className={cn(
                            "text-xs",
                            skillData.flags.some(f => f.severity === 'HIGH')
                              ? 'bg-red-500/10 text-red-600 border-red-200'
                              : 'bg-amber-500/10 text-amber-600 border-amber-200'
                          )}>
                            {skillData.flags.length} {skillData.flags.length === 1 ? 'flag' : 'flags'}
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm font-medium">{skillData.skill_score?.toFixed(0) || '-'}%</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 py-3 bg-background">
                    {/* Capability / Limitation */}
                    {skillData.capability && (
                      <div className="mb-3">
                        <span className="text-xs font-medium text-green-600">Demonstrated Capabilities:</span>
                        <p className="text-sm">{skillData.capability}</p>
                      </div>
                    )}
                    {skillData.limitation && (
                      <div className="mb-3">
                        <span className="text-xs font-medium text-amber-600">Areas for Development:</span>
                        <p className="text-sm">{skillData.limitation}</p>
                      </div>
                    )}

                    {/* Flags removed - too detailed */}

                    {/* Nested Tasks - Expandable for can_do/cannot_do */}
                    {skillData.tasks && skillData.tasks.length > 0 && (
                      <div className="mt-4">
                        <h5 className="text-xs font-medium text-muted-foreground mb-2">Task Breakdown</h5>
                        <Accordion type="multiple" className="space-y-1">
                          {skillData.tasks.map((task, ti) => (
                            <AccordionItem key={ti} value={`skill-${i}-task-${ti}`} className="border rounded bg-muted/20">
                              <AccordionTrigger className="hover:no-underline px-3 py-2 text-sm">
                                <div className="flex items-center justify-between w-full pr-2">
                                  <div className="flex items-center gap-2">
                                    <span>{task.task_name}</span>
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
                                    <span className="text-xs text-muted-foreground">
                                      {task.correct_count || 0}/{(task.correct_count || 0) + (task.incorrect_count || 0)}
                                    </span>
                                    <span className="font-bold">{task.task_score?.toFixed(0)}%</span>
                                    <Badge variant={task.status === 'proficient' ? 'default' : task.status === 'needs_practice' ? 'secondary' : 'outline'} className="text-xs">
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
                              <AccordionContent className="px-3 py-2 bg-background/50">
                                {task.can_do && (
                                  <div className="mb-2">
                                    <span className="text-xs font-medium text-green-600">Can Do:</span>
                                    <p className="text-xs">{task.can_do}</p>
                                  </div>
                                )}
                                {task.cannot_do && (
                                  <div>
                                    <span className="text-xs font-medium text-amber-600">Developing:</span>
                                    <p className="text-xs">{task.cannot_do}</p>
                                  </div>
                                )}
                                {!task.can_do && !task.cannot_do && task.insight && (
                                  <p className="text-xs text-muted-foreground">{task.insight}</p>
                                )}
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>

      {/* Bloom's Taxonomy Breakdown and Task Assignment Guide removed - Task Performance covers this */}

      {/* ========== PERSONA REPORT: PATTERN ANALYSIS (Moved below Detailed Skill Assessment) ========== */}
      {!isSkillReport && llm?.pattern_analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Pattern Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Persona Summary - Always visible at top */}
            {llm.pattern_analysis.persona_summary && (
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20 mb-4">
                <p className="text-sm font-medium">{llm.pattern_analysis.persona_summary}</p>
              </div>
            )}

            {/* Accordion for pattern sections */}
            <Accordion type="multiple" className="space-y-2">
              {/* Cross-Question Insights */}
              {llm.pattern_analysis.cross_question_insights && llm.pattern_analysis.cross_question_insights.length > 0 && (
                <AccordionItem value="cross-question" className="border rounded-lg overflow-hidden">
                  <AccordionTrigger className="hover:no-underline px-4 py-3 bg-muted/30">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-purple-500" />
                      <span className="font-semibold">Cross-Question Patterns</span>
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {llm.pattern_analysis.cross_question_insights.length} patterns
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 py-3 bg-background">
                    <div className="space-y-3">
                      {llm.pattern_analysis.cross_question_insights.map((insight, i) => (
                        <div key={i} className="p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="text-xs">{insight.pattern}</Badge>
                            <span className="text-xs text-muted-foreground">{insight.scope}</span>
                          </div>
                          <p className="text-sm mb-1">{insight.observation}</p>
                          <p className="text-sm text-primary">{insight.inference}</p>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Learning Style */}
              {llm.pattern_analysis.learning_style_indicator?.hypothesis && (
                <AccordionItem value="learning-style" className="border rounded-lg overflow-hidden">
                  <AccordionTrigger className="hover:no-underline px-4 py-3 bg-muted/30">
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4 text-blue-500" />
                      <span className="font-semibold">Learning Style</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 py-3 bg-background">
                    <div className="p-3 bg-blue-500/5 rounded-lg border border-blue-500/20">
                      <p className="text-sm font-medium text-blue-600 mb-1">{llm.pattern_analysis.learning_style_indicator.hypothesis}</p>
                      {llm.pattern_analysis.learning_style_indicator.evidence && (
                        <p className="text-xs text-muted-foreground">{llm.pattern_analysis.learning_style_indicator.evidence}</p>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Knowledge Gap Structure */}
              {llm.pattern_analysis.knowledge_gap_structure?.root_cause && (
                <AccordionItem value="knowledge-gap" className="border rounded-lg overflow-hidden">
                  <AccordionTrigger className="hover:no-underline px-4 py-3 bg-muted/30">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      <span className="font-semibold">Knowledge Gap Analysis</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 py-3 bg-background">
                    <div className="p-3 bg-amber-500/5 rounded-lg border border-amber-500/20">
                      <p className="text-sm mb-1"><strong>Surface:</strong> {llm.pattern_analysis.knowledge_gap_structure.surface_gap}</p>
                      <p className="text-sm mb-1"><strong>Root Cause:</strong> {llm.pattern_analysis.knowledge_gap_structure.root_cause}</p>
                      {llm.pattern_analysis.knowledge_gap_structure.evidence && (
                        <p className="text-xs text-muted-foreground mt-2">{llm.pattern_analysis.knowledge_gap_structure.evidence}</p>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* ========== KNOWLEDGE GAPS - Commented out as detailed skill assessment covers this ========== */}
      {/*
      {((isSkillReport && llm?.knowledge_gaps && llm.knowledge_gaps.length > 0) ||
        (!isSkillReport && llm?.section_4_development?.gaps_detail && llm.section_4_development.gaps_detail.length > 0)) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Knowledge Gaps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(isSkillReport ? llm?.knowledge_gaps : llm?.section_4_development?.gaps_detail)?.map((gap, i) => (
                <div key={i} className="p-4 bg-red-500/5 rounded-lg border border-red-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold">{gap.gap || gap.skill}</span>
                    {gap.severity && (
                      <Badge variant={gap.severity === 'High' ? 'destructive' : 'outline'} className="text-xs">
                        {gap.severity}
                      </Badge>
                    )}
                    {gap.error_count && (
                      <span className="text-xs text-muted-foreground">({gap.error_count} errors)</span>
                    )}
                    {gap.bloom_level_gap && (
                      <span className="text-xs text-muted-foreground">Bloom's: {gap.bloom_level_gap}</span>
                    )}
                  </div>
                  {gap.what_went_wrong && (
                    <p className="text-sm mb-2">{gap.what_went_wrong}</p>
                  )}
                  {gap.failed_on && (
                    <p className="text-sm mb-2">{gap.failed_on}</p>
                  )}
                  {gap.why_this_pattern && (
                    <p className="text-xs text-muted-foreground italic">{gap.why_this_pattern}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      */}

      {/* ========== RECOMMENDATIONS ========== */}
      {llm?.recommendations && (
        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {llm.recommendations.focus_areas && llm.recommendations.focus_areas.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Focus Areas</h4>
                  <ul className="space-y-1">
                    {llm.recommendations.focus_areas.map((f, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <Target className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {llm.recommendations.next_steps && llm.recommendations.next_steps.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Next Steps</h4>
                  <ul className="space-y-1">
                    {llm.recommendations.next_steps.map((s, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {llm.recommendations.target_bloom_level && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Target Level</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Work towards:</span>
                    <BloomLevelBadge level={llm.recommendations.target_bloom_level} />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section 5 Flags removed - using Flagged Activities instead */}

      {/* ========== FLAGGED ACTIVITIES (Only show if there are flags) ========== */}
      {report.flagged_activities && report.flagged_activities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-amber-500" />
              Flagged Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {report.flagged_activities.map((activity, i) => (
                <div key={i} className="flex items-start justify-between text-sm py-2 border-b border-muted last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">
                      {getActivityIcon(activity.icon)}
                    </span>
                    <span>{activity.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {activity.flag_level === "flag" ? (
                      <span className="text-red-500 font-medium">🚩 {activity.count}</span>
                    ) : (
                      <span className="text-amber-500">🏳</span>
                    )}
                  </div>
                </div>
              ))}
              {/* Timestamps section */}
              {report.flagged_activities.filter(a => a.timestamps && a.timestamps.length > 0).map((activity, i) => (
                <div key={`ts-${i}`} className="text-xs text-muted-foreground pl-7">
                  <span className="font-medium">{activity.label} timestamps:</span>{' '}
                  {activity.timestamps?.join(' | ')}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ========== ADMIN DETAILS ========== */}
      <Card className="print:hidden">
        <CardHeader>
          <CardTitle>Assessment Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Candidate:</span>
            <p className="font-medium">{report.candidate.name}</p>
            <p className="text-xs text-muted-foreground">{report.candidate.email}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Test:</span>
            <p className="font-medium">{report.template.name}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Invited:</span>
            <p className="font-medium">{new Date(report.invited_at).toLocaleDateString()}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Started:</span>
            <p className="font-medium">{new Date(report.started_at).toLocaleString()}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Completed:</span>
            <p className="font-medium">{new Date(report.completed_at).toLocaleString()}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Duration:</span>
            <p className="font-medium">{report.duration_minutes} minutes</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminReport;
