import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/services/api';

interface Test {
  invite_id: string;
  template_name: string;
  role_name: string;
  skills: { id: string; name: string }[];
  status: string;
  score: number | null;
  invited_at: string;
  completed_at: string | null;
  task_count: number;
  time_limit_minutes: number;
}

export const CandidateTests = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState<Test[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTests = async () => {
      const data = await api.candidate.getTests();
      setTests(data);
      setIsLoading(false);
    };
    loadTests();
  }, []);

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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">My Assigned Tests</h1>
          <p className="text-muted-foreground">Tests assigned to you by your organization</p>
        </div>
      </div>

      {/* Empty State */}
      {tests.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No tests assigned to you yet</h3>
            <p className="text-muted-foreground text-center">
              When your organization assigns you a test, it will appear here
            </p>
          </CardContent>
        </Card>
      )}

      {/* Test Cards */}
      <div className="space-y-4">
        {tests.map((test) => (
          <Card key={test.invite_id} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{test.template_name}</h3>
                    {test.status === 'pending' ? (
                      <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
                        Pending
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completed
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground mb-3">Role: {test.role_name}</p>
                  <div className="flex flex-wrap gap-2">
                    {test.skills.map((skill) => (
                      <Badge key={skill.id} variant="secondary">{skill.name}</Badge>
                    ))}
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  {test.status === 'pending' ? (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Invited: {new Date(test.invited_at).toLocaleDateString()}
                      </p>
                      <Button onClick={() => navigate(`/tests/${test.invite_id}`)}>
                        Start Test
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-success">{test.score}%</p>
                        <p className="text-sm text-muted-foreground">
                          Completed: {test.completed_at ? new Date(test.completed_at).toLocaleDateString() : '-'}
                        </p>
                      </div>
                      <Button variant="outline" onClick={() => navigate(`/results/${test.invite_id}`)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Report
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CandidateTests;
