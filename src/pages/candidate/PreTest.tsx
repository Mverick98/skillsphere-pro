import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, AlertTriangle, Camera, Monitor, Timer } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/services/api';

interface TestDetails {
  invite_id: string;
  template_name: string;
  description: string;
  role_name: string;
  role_id: string;
  skills: { id: string; name: string }[];
  task_count: number;
  time_limit_minutes: number;
  status: string;
}

export const PreTest = () => {
  const { inviteId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState<TestDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTest = async () => {
      if (inviteId) {
        const data = await api.candidate.getTestDetails(inviteId);
        setTest(data);
        setIsLoading(false);
      }
    };
    loadTest();
  }, [inviteId]);

  const handleBegin = () => {
    // Navigate to assessment with proctoring consent
    navigate(`/assessment/${inviteId}/proctoring`);
  };

  if (isLoading || !test) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/tests')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Ready to Begin</h1>
      </div>

      {/* Test Details Card */}
      <Card>
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">{test.template_name}</h2>
            {test.description && (
              <p className="text-muted-foreground">{test.description}</p>
            )}
          </div>

          {/* Test Info */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Role</p>
              <p className="font-semibold">{test.role_name}</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Time Limit</p>
              <p className="font-semibold">{test.time_limit_minutes} minutes</p>
            </div>
          </div>

          {/* Skills */}
          <div className="mb-8">
            <p className="text-sm text-muted-foreground mb-2">Skills:</p>
            <div className="flex flex-wrap gap-2">
              {test.skills.map((skill) => (
                <Badge key={skill.id} variant="secondary">{skill.name}</Badge>
              ))}
            </div>
          </div>

          {/* Task Count */}
          <div className="text-center mb-8">
            <p className="text-muted-foreground">Total Tasks: <span className="font-semibold text-foreground">{test.task_count}</span></p>
          </div>

          {/* Important Notes */}
          <div className="bg-warning/10 border border-warning/30 rounded-lg p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <h3 className="font-semibold">Important Notes:</h3>
            </div>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-sm">
                <Camera className="h-4 w-4 text-muted-foreground" />
                <span>This test is proctored - your camera will be used</span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <Timer className="h-4 w-4 text-muted-foreground" />
                <span>You cannot pause once started</span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <Monitor className="h-4 w-4 text-muted-foreground" />
                <span>Tab switches will be recorded</span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Ensure stable internet connection</span>
              </li>
            </ul>
          </div>

          {/* Begin Button */}
          <Button onClick={handleBegin} size="lg" className="w-full">
            Begin Assessment
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PreTest;
