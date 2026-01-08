import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, Download, Check, X, AlertTriangle, ArrowUp, ArrowDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import ProficiencyGauge from '@/components/assessment/ProficiencyGauge';
import { cn } from '@/lib/utils';

// Results are fetched based on assessment type
// For single skill assessments, only that skill is shown

interface SkillResult {
  skill_id: string;
  skill_name: string;
  proficiency_level: number;
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
}

interface ResultsData {
  assessment_id: string;
  test_name: string;
  role_name: string;
  overall_score: number;
  proficiency_level: number;
  percentile: number;
  time_taken_minutes: number;
  questions_answered: number;
  total_questions: number;
  accuracy: number;
  integrity_score: number;
  skill_results: SkillResult[];
  recommendations: string[];
  tab_switches: number;
  face_detection_issues: number;
}

export const CandidateResults = () => {
  const { assessmentId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [results, setResults] = useState<ResultsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get assessment type from navigation state
  const navigationState = location.state as { isSkillAssessment?: boolean; skillName?: string } | null;

  useEffect(() => {
    const loadResults = async () => {
      // Check if this is a skill assessment from navigation state
      const isSkillAssessment = navigationState?.isSkillAssessment ?? false;
      const skillName = navigationState?.skillName || 'API Design';
      const mockData: ResultsData = {
        assessment_id: assessmentId || 'a1',
        test_name: isSkillAssessment ? `${skillName} Skill Assessment` : 'Backend Developer Assessment',
        role_name: isSkillAssessment ? 'Skill Assessment' : 'Backend Developer',
        overall_score: 78,
        proficiency_level: 4,
        percentile: 72,
        time_taken_minutes: 18,
        questions_answered: isSkillAssessment ? 4 : 12,
        total_questions: isSkillAssessment ? 4 : 12,
        accuracy: 83,
        integrity_score: 95,
        skill_results: isSkillAssessment ? [
          {
            skill_id: 'tested-skill',
            skill_name: skillName,
            proficiency_level: 4,
            is_strength: true,
            task_results: [
              { task_id: 't1', task_name: 'REST Endpoint Design', correct: true, time_taken: 12, status: 'proficient' },
              { task_id: 't2', task_name: 'API Versioning Strategies', correct: true, time_taken: 18, status: 'proficient' },
              { task_id: 't3', task_name: 'GraphQL Schema Design', correct: true, time_taken: 25, status: 'needs-practice' },
              { task_id: 't4', task_name: 'API Security Implementation', correct: false, time_taken: 40, status: 'not-proficient' },
            ],
            strengths: ['Strong REST API design knowledge', 'Good understanding of versioning strategies'],
            weaknesses: ['Review API security best practices'],
          }
        ] : [
          {
            skill_id: 'api-design',
            skill_name: 'API Design',
            proficiency_level: 4,
            is_strength: true,
            task_results: [
              { task_id: 't1', task_name: 'REST Endpoint Design', correct: true, time_taken: 12, status: 'proficient' },
              { task_id: 't2', task_name: 'API Versioning Strategies', correct: true, time_taken: 18, status: 'proficient' },
            ],
            strengths: ['Strong REST API design knowledge', 'Good understanding of versioning strategies'],
            weaknesses: ['Review API security best practices'],
          },
          {
            skill_id: 'database',
            skill_name: 'Database Management',
            proficiency_level: 3,
            is_strength: false,
            task_results: [
              { task_id: 't5', task_name: 'Complex SQL Queries', correct: true, time_taken: 20, status: 'needs-practice' },
              { task_id: 't6', task_name: 'Database Indexing', correct: false, time_taken: 45, status: 'not-proficient' },
            ],
            strengths: ['Good data modeling skills'],
            weaknesses: ['Review database indexing strategies', 'Practice complex SQL queries'],
          },
        ],
        recommendations: isSkillAssessment 
          ? ['Review API security concepts and OAuth implementations', 'Practice GraphQL schema design']
          : ['Review API security concepts', 'Practice database indexing strategies', 'Work on complex SQL query optimization'],
        tab_switches: 1,
        face_detection_issues: 0,
      };
      
      setResults(mockData);
      setIsLoading(false);
    };
    loadResults();
  }, [assessmentId, navigationState]);

  if (isLoading || !results) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const integrityRisk = results.integrity_score >= 90 ? 'LOW' : results.integrity_score >= 70 ? 'MEDIUM' : 'HIGH';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Assessment Complete</h1>
          <p className="text-muted-foreground">{results.role_name}</p>
        </div>
        <Button variant="outline" onClick={() => toast({ title: 'Downloading...', description: 'Your report will download shortly' })}>
          <Download className="h-4 w-4 mr-2" />
          Download Report
        </Button>
      </div>

      {/* Overall Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Your Proficiency Report</CardTitle>
          <p className="text-center text-muted-foreground">{results.test_name}</p>
        </CardHeader>
        <CardContent className="py-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <ProficiencyGauge level={results.proficiency_level} size="lg" />
            <div className="flex-1 text-center md:text-left">
              <p className="text-muted-foreground mb-4">
                You scored better than <span className="text-primary font-semibold">{results.percentile}%</span> of candidates
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">{results.time_taken_minutes}m</div>
                  <div className="text-sm text-muted-foreground">Time</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{results.questions_answered}/{results.total_questions}</div>
                  <div className="text-sm text-muted-foreground">Answered</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{results.accuracy}%</div>
                  <div className="text-sm text-muted-foreground">Accuracy</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{results.integrity_score}%</div>
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
          {results.skill_results.map(skill => (
            <Card key={skill.skill_id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{skill.skill_name}</span>
                  {skill.is_strength ? (
                    <Badge className="bg-success/10 text-success">
                      <ArrowUp className="h-3 w-3 mr-1" />
                      Strength
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-warning">
                      <ArrowDown className="h-3 w-3 mr-1" />
                      Needs Work
                    </Badge>
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

      {/* Detailed Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Skill Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" defaultValue={results.skill_results.map(s => s.skill_id)}>
            {results.skill_results.map(skill => (
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
                              <Check className="h-4 w-4 text-success flex-shrink-0" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2 text-warning">Areas to Improve</h4>
                        <ul className="space-y-1">
                          {skill.weaknesses.map((w, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm">
                              <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0" />
                              {w}
                            </li>
                          ))}
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
              <div className="text-3xl font-bold">{results.integrity_score}%</div>
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
          {results.tab_switches === 0 && results.face_detection_issues === 0 ? (
            <p className="text-sm text-success flex items-center gap-2">
              <Check className="h-4 w-4" />
              No significant issues detected
            </p>
          ) : (
            <div className="space-y-2 text-sm">
              {results.tab_switches > 0 && (
                <p className="text-warning">• {results.tab_switches} tab switch(es) detected</p>
              )}
              {results.face_detection_issues > 0 && (
                <p className="text-warning">• {results.face_detection_issues} face detection issue(s)</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
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

      {/* Actions */}
      <div className="flex justify-center gap-4">
        <Button variant="outline" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default CandidateResults;
