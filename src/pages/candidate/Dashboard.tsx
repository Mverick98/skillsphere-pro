import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Target, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';

interface DashboardData {
  pending_tests_count: number;
  recent_results: Array<{
    assessment_id: string;
    test_name: string;
    date: string;
    score: number;
  }>;
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
