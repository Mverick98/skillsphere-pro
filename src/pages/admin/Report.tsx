import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Mail, Check, X, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { api } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import ProficiencyGauge from '@/components/assessment/ProficiencyGauge';
import { cn } from '@/lib/utils';

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
    proficiency_level: 1 | 2 | 3 | 4 | 5;
    is_strength: boolean;
    task_results: Array<{
      task_id: string;
      task_name: string;
      correct: boolean;
      time_taken: number;
      status: string;
    }>;
    strengths: string[];
    weaknesses: string[];
  }>;
  recommendations: string[];
  tab_switches: number;
  face_detection_issues: number;
}

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

  const integrityRisk = report.integrity_score >= 90 ? 'LOW' : report.integrity_score >= 70 ? 'MEDIUM' : 'HIGH';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/candidates')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Assessment Report: {report.candidate.name}</h1>
            <p className="text-muted-foreground">{report.template.name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => toast({ title: 'Downloading PDF...', description: 'Report will download shortly' })}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Button variant="outline" onClick={() => toast({ title: 'Email sent', description: 'Report has been sent to the candidate' })}>
            <Mail className="h-4 w-4 mr-2" />
            Send to Candidate
          </Button>
        </div>
      </div>

      {/* Admin Details */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Candidate:</span>
            <p className="font-medium">{report.candidate.name} ({report.candidate.email})</p>
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

      {/* Overall Summary */}
      <Card>
        <CardContent className="py-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <ProficiencyGauge level={report.proficiency_level} size="lg" />
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold mb-2">{report.template.role}</h2>
              <p className="text-muted-foreground mb-4">
                You scored better than <span className="text-primary font-semibold">{report.percentile}%</span> of candidates
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">{report.duration_minutes}m</div>
                  <div className="text-sm text-muted-foreground">Time</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{report.questions_answered}/{report.total_questions}</div>
                  <div className="text-sm text-muted-foreground">Answered</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{report.accuracy}%</div>
                  <div className="text-sm text-muted-foreground">Accuracy</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{report.integrity_score}%</div>
                  <div className="text-sm text-muted-foreground">Integrity</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skill Breakdown */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Skill Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {report.skill_results.map(skill => (
            <Card key={skill.skill_id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{skill.skill_name}</span>
                  {skill.is_strength ? (
                    <Badge className="bg-success/10 text-success">↑ Strength</Badge>
                  ) : (
                    <Badge variant="outline" className="text-warning">↓ Needs Work</Badge>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Progress value={(skill.proficiency_level / 5) * 100} className="flex-1" />
                  <span className="text-sm font-medium">{skill.proficiency_level}/5</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Detailed Skill Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Skill Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple">
            {report.skill_results.map(skill => (
              <AccordionItem key={skill.skill_id} value={skill.skill_id}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{skill.skill_name}</span>
                    <Badge variant="secondary">Level {skill.proficiency_level}</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-2">
                    {/* Task Performance Table */}
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Task Name</TableHead>
                          <TableHead>Result</TableHead>
                          <TableHead>Time</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {skill.task_results.map(task => (
                          <TableRow 
                            key={task.task_id}
                            className={cn(
                              task.status === 'proficient' && 'bg-success/5',
                              task.status === 'needs-practice' && 'bg-warning/5',
                              task.status === 'not-proficient' && 'bg-destructive/5'
                            )}
                          >
                            <TableCell>{task.task_name}</TableCell>
                            <TableCell>
                              {task.correct ? (
                                <Check className="h-4 w-4 text-success" />
                              ) : (
                                <X className="h-4 w-4 text-destructive" />
                              )}
                            </TableCell>
                            <TableCell>{task.time_taken}s</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Strengths & Weaknesses */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2 text-success">Strengths</h4>
                        <ul className="space-y-1">
                          {skill.strengths.map((s, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm">
                              <Check className="h-4 w-4 text-success" />
                              {s}
                            </li>
                          ))}
                          {skill.strengths.length === 0 && (
                            <li className="text-sm text-muted-foreground">No specific strengths identified</li>
                          )}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2 text-warning">Areas to Improve</h4>
                        <ul className="space-y-1">
                          {skill.weaknesses.map((w, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm">
                              <AlertTriangle className="h-4 w-4 text-warning" />
                              {w}
                            </li>
                          ))}
                          {skill.weaknesses.length === 0 && (
                            <li className="text-sm text-muted-foreground">No areas of concern identified</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Integrity Assessment */}
      <Card>
        <CardHeader>
          <CardTitle>Integrity Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold">{report.integrity_score}%</div>
              <Badge 
                className={cn(
                  integrityRisk === 'LOW' && 'bg-success/10 text-success',
                  integrityRisk === 'MEDIUM' && 'bg-warning/10 text-warning',
                  integrityRisk === 'HIGH' && 'bg-destructive/10 text-destructive'
                )}
              >
                {integrityRisk} RISK
              </Badge>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tab Switches:</span>
              <span className={report.tab_switches > 2 ? 'text-warning' : ''}>{report.tab_switches}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Face Detection Issues:</span>
              <span className={report.face_detection_issues > 0 ? 'text-warning' : ''}>{report.face_detection_issues}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Recommended Learning Path</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2">
            {report.recommendations.map((rec, i) => (
              <li key={i} className="text-muted-foreground">{rec}</li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminReport;
