import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Target, Eye, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';

interface SkillProfile {
  skill_id: string;
  skill_name: string;
  proficiency_level: number;
  tested_at: string;
}

interface DashboardData {
  pending_tests_count: number;
  recent_results: Array<{
    assessment_id: string;
    test_name: string;
    date: string;
    score: number;
  }>;
  skill_profile: SkillProfile[];
}

export const CandidateDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const result = await api.candidate.getDashboard();
      setData(result);
      setIsLoading(false);
    };
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {user?.name || 'there'}!</h1>
        <p className="text-muted-foreground">Choose how you'd like to proceed:</p>
      </div>

      {/* Main Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Assigned Tests Card */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <ClipboardList className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Assigned Tests</h3>
              <p className="text-muted-foreground mb-4">
                Tests assigned to you by your organization
              </p>
              {data && data.pending_tests_count > 0 && (
                <Badge variant="destructive" className="mb-4">
                  {data.pending_tests_count} pending
                </Badge>
              )}
              <Button onClick={() => navigate('/tests')} className="w-full">
                View Tests
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Skill Assessment Card */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Skill Assessment</h3>
              <p className="text-muted-foreground mb-4">
                Test your proficiency in a specific skill
              </p>
              <div className="mb-4 h-6" /> {/* Spacer to align with badge above */}
              <Button onClick={() => navigate('/skill-assessment')} className="w-full">
                Start Assessment
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Skill Profile */}
      {data && data.skill_profile && data.skill_profile.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle>Your Skill Profile</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">Skills you've been tested on</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.skill_profile.map((skill) => (
                <div key={skill.skill_id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{skill.skill_name}</span>
                    <Badge variant="outline">{skill.proficiency_level}/5</Badge>
                  </div>
                  <Progress value={(skill.proficiency_level / 5) * 100} className="h-2 mb-2" />
                  <p className="text-xs text-muted-foreground">
                    Tested: {new Date(skill.tested_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Results */}
      {data && data.recent_results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Results</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Test Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead className="w-[100px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recent_results.map((result) => (
                  <TableRow key={result.assessment_id}>
                    <TableCell className="font-medium">{result.test_name}</TableCell>
                    <TableCell>{new Date(result.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                        {result.score}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/results/${result.assessment_id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CandidateDashboard;
