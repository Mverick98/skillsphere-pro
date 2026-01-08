import { useState } from 'react';
import { useAssessment } from '@/context/AssessmentContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import ProficiencyGauge from '@/components/assessment/ProficiencyGauge';
import {
  ClipboardCheck,
  Clock,
  Target,
  Percent,
  Shield,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  AlertTriangle,
  BookOpen,
  Download,
  RefreshCw,
  LogOut,
  Eye,
  Monitor,
} from 'lucide-react';

const EvaluationDashboard = () => {
  const { result, selectedRole, resetAssessment, logout, proctoringEnabled } = useAssessment();
  const [expandedSkills, setExpandedSkills] = useState<Set<string>>(new Set());

  if (!result) return null;

  const toggleSkill = (skillId: string) => {
    const newExpanded = new Set(expandedSkills);
    if (newExpanded.has(skillId)) {
      newExpanded.delete(skillId);
    } else {
      newExpanded.add(skillId);
    }
    setExpandedSkills(newExpanded);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getIntegrityBadge = (score: number) => {
    if (score >= 90) return { label: 'LOW RISK', className: 'bg-success/10 text-success' };
    if (score >= 70) return { label: 'MEDIUM RISK', className: 'bg-warning/10 text-warning' };
    return { label: 'HIGH RISK', className: 'bg-destructive/10 text-destructive' };
  };

  const integrityBadge = getIntegrityBadge(result.integrityScore);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg gradient-primary">
              <ClipboardCheck className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-semibold text-foreground">Assessment Complete</h1>
              <p className="text-xs text-muted-foreground">{selectedRole?.name}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Section A: Role-Level Summary */}
            <Card className="border shadow-card overflow-hidden">
              <div className="gradient-primary p-6 text-primary-foreground">
                <h2 className="text-lg font-semibold mb-1">Your Proficiency Report</h2>
                <p className="text-sm opacity-90">{selectedRole?.name} Assessment</p>
              </div>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <ProficiencyGauge level={result.proficiencyLevel} size="lg" />
                  
                  <div className="flex-1 space-y-4">
                    <p className="text-lg text-foreground">
                      You scored better than{' '}
                      <span className="font-bold text-primary">{result.percentile}%</span>{' '}
                      of candidates
                    </p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 rounded-lg bg-muted">
                        <Clock className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
                        <p className="text-sm font-medium text-foreground">{formatTime(result.timeTaken)}</p>
                        <p className="text-xs text-muted-foreground">Time Taken</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-muted">
                        <Target className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
                        <p className="text-sm font-medium text-foreground">{result.questionsAnswered}/{result.totalQuestions}</p>
                        <p className="text-xs text-muted-foreground">Answered</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-muted">
                        <Percent className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
                        <p className="text-sm font-medium text-foreground">{result.accuracy}%</p>
                        <p className="text-xs text-muted-foreground">Accuracy</p>
                      </div>
                      {proctoringEnabled && (
                        <div className="text-center p-3 rounded-lg bg-muted">
                          <Shield className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
                          <p className="text-sm font-medium text-foreground">{result.integrityScore}%</p>
                          <p className="text-xs text-muted-foreground">Integrity</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section B: Skill Breakdown */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Skill Breakdown</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {result.skillResults.map((skill) => (
                  <Card
                    key={skill.skillId}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      skill.isStrength ? 'border-success/30' : 'border-warning/30'
                    }`}
                    onClick={() => toggleSkill(skill.skillId)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-foreground">{skill.skillName}</h4>
                            {skill.isStrength ? (
                              <TrendingUp className="w-4 h-4 text-success" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-warning" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="proficiency-bar flex-1">
                              <div
                                className={`progress-fill ${
                                  skill.proficiencyLevel >= 4 ? 'gradient-success' : 'gradient-primary'
                                }`}
                                style={{ width: `${(skill.proficiencyLevel / 5) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-muted-foreground">
                              {skill.proficiencyLevel}/5
                            </span>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="ml-2">
                          {expandedSkills.has(skill.skillId) ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Section C: Detailed Skill Analysis */}
            {result.skillResults.map((skill) => (
              <Collapsible
                key={skill.skillId}
                open={expandedSkills.has(skill.skillId)}
                onOpenChange={() => toggleSkill(skill.skillId)}
              >
                <CollapsibleContent>
                  <Card className="border shadow-card animate-fade-in">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-primary" />
                        {skill.skillName} Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Task Performance Table */}
                      <div className="rounded-lg border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead>Task Name</TableHead>
                              <TableHead className="w-24">Complexity</TableHead>
                              <TableHead className="w-20">Result</TableHead>
                              <TableHead className="w-24">Time</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {skill.taskResults.map((task) => (
                              <TableRow
                                key={task.taskId}
                                className={
                                  task.status === 'proficient'
                                    ? 'result-row-proficient'
                                    : task.status === 'needs-practice'
                                    ? 'result-row-needs-practice'
                                    : 'result-row-not-proficient'
                                }
                              >
                                <TableCell className="font-medium">{task.taskName}</TableCell>
                                <TableCell>
                                  <span className={`complexity-badge complexity-${task.complexity.toLowerCase()}`}>
                                    {task.complexity}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  {task.correct ? (
                                    <Check className="w-5 h-5 text-success" />
                                  ) : (
                                    <X className="w-5 h-5 text-destructive" />
                                  )}
                                </TableCell>
                                <TableCell className="text-muted-foreground">{task.timeTaken}s</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Strengths & Weaknesses */}
                      <div className="grid md:grid-cols-2 gap-4">
                        {skill.strengths.length > 0 && (
                          <div className="space-y-2">
                            <h5 className="text-sm font-medium text-success flex items-center gap-2">
                              <TrendingUp className="w-4 h-4" />
                              Strengths
                            </h5>
                            <ul className="space-y-1">
                              {skill.strengths.map((s, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                  <Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                                  {s}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {skill.weaknesses.length > 0 && (
                          <div className="space-y-2">
                            <h5 className="text-sm font-medium text-warning flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4" />
                              Areas for Improvement
                            </h5>
                            <ul className="space-y-1">
                              {skill.weaknesses.map((w, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                  <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                                  {w}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </CollapsibleContent>
              </Collapsible>
            ))}

            {/* Section D: Integrity Assessment */}
            {proctoringEnabled && (
              <Card className="border shadow-card">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    Integrity Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="relative w-20 h-20">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle
                            cx="40"
                            cy="40"
                            r="35"
                            fill="none"
                            stroke="hsl(var(--muted))"
                            strokeWidth="6"
                          />
                          <circle
                            cx="40"
                            cy="40"
                            r="35"
                            fill="none"
                            stroke={result.integrityScore >= 70 ? 'hsl(var(--success))' : 'hsl(var(--warning))'}
                            strokeWidth="6"
                            strokeDasharray={`${2 * Math.PI * 35}`}
                            strokeDashoffset={`${2 * Math.PI * 35 * (1 - result.integrityScore / 100)}`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-lg font-bold">{result.integrityScore}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1">
                      <Badge className={`${integrityBadge.className} border-0`}>
                        {integrityBadge.label}
                      </Badge>
                      <div className="mt-3 space-y-2 text-sm">
                        {result.tabSwitches > 0 && (
                          <div className="flex items-center gap-2 text-warning">
                            <Monitor className="w-4 h-4" />
                            <span>{result.tabSwitches} tab switch(es) detected</span>
                          </div>
                        )}
                        {result.faceDetectionIssues > 0 && (
                          <div className="flex items-center gap-2 text-warning">
                            <Eye className="w-4 h-4" />
                            <span>{result.faceDetectionIssues} face detection issue(s)</span>
                          </div>
                        )}
                        {result.tabSwitches === 0 && result.faceDetectionIssues === 0 && (
                          <div className="flex items-center gap-2 text-success">
                            <Check className="w-4 h-4" />
                            <span>No integrity issues detected</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Section E: Recommendations Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border shadow-card sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg">Recommended Learning Path</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Based on your results, we recommend focusing on these areas:
                </p>
                
                <div className="space-y-3">
                  {result.recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-medium text-primary">{i + 1}</span>
                      </div>
                      <p className="text-sm text-foreground">{rec}</p>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-3">
                  <Button className="w-full" variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Download Report (PDF)
                  </Button>
                  <Button className="w-full gradient-primary hover:opacity-90" onClick={resetAssessment}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retake Assessment
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EvaluationDashboard;
