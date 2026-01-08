import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Users, CheckCircle, TrendingUp, Plus, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { api } from '@/services/api';
import { InviteModal } from '@/components/admin/InviteModal';

interface DashboardStats {
  total_templates: number;
  total_candidates: number;
  tests_completed: number;
  average_score: number;
  recent_activity: Array<{
    id: string;
    candidate_name: string;
    test_name: string;
    status: string;
    score: number | null;
    date: string;
  }>;
}

export const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadStats = async () => {
      const data = await api.admin.getDashboardStats();
      setStats(data);
      setIsLoading(false);
    };
    loadStats();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">Pending</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">In Progress</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-success/10 text-success border-success/30">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your assessment platform</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Test Templates</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_templates || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Candidates Invited</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_candidates || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tests Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.tests_completed || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.average_score || 0}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate Name</TableHead>
                <TableHead>Test Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats?.recent_activity.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell className="font-medium">{activity.candidate_name}</TableCell>
                  <TableCell>{activity.test_name}</TableCell>
                  <TableCell>{getStatusBadge(activity.status)}</TableCell>
                  <TableCell>{activity.score !== null ? `${activity.score}%` : '-'}</TableCell>
                  <TableCell>{new Date(activity.date).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button onClick={() => navigate('/admin/templates/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Create New Test
          </Button>
          <Button variant="outline" onClick={() => setInviteOpen(true)}>
            <Mail className="h-4 w-4 mr-2" />
            Invite Candidates
          </Button>
        </CardContent>
      </Card>

      <InviteModal
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        templateId="t1"
        templateName="Backend Developer Assessment"
      />
    </div>
  );
};

export default AdminDashboard;
