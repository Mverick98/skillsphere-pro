import { useState, useEffect } from 'react';
import { Search, Users as UsersIcon, Briefcase, ClipboardList, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { api } from '@/services/api';

interface UserItem {
  id: string;
  name: string;
  email: string;
  job_role: { id: string; name: string } | null;
  assessment_count: number;
  assigned_tests: number;
  created_at: string | null;
  last_login: string | null;
  is_active: boolean;
}

interface Role {
  id: string;
  name: string;
}

export const Users = () => {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Load roles on mount
  useEffect(() => {
    const loadRoles = async () => {
      const data = await api.roles.getAll();
      setRoles(data);
    };
    loadRoles();
  }, []);

  // Load users with filters
  useEffect(() => {
    const loadUsers = async () => {
      setIsLoading(true);
      const data = await api.admin.getUsers({
        search: search || undefined,
        role_id: roleFilter !== 'all' ? roleFilter : undefined,
      });
      setUsers(data);
      setIsLoading(false);
    };

    // Debounce search
    const timeoutId = setTimeout(loadUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [search, roleFilter]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-muted-foreground">Manage all registered candidates</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <UsersIcon className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{users.length}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <UsersIcon className="h-5 w-5 text-success" />
              <span className="text-2xl font-bold">
                {users.filter(u => {
                  if (!u.last_login) return false;
                  const today = new Date().toDateString();
                  return new Date(u.last_login).toDateString() === today;
                }).length}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Assessments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">
                {users.reduce((acc, u) => acc + u.assessment_count, 0)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <UsersIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No users found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Job Role</TableHead>
                  <TableHead className="text-center">Assessments</TableHead>
                  <TableHead className="text-center">Assigned Tests</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.job_role ? (
                        <Badge variant="outline" className="flex items-center gap-1 w-fit">
                          <Briefcase className="h-3 w-3" />
                          {user.job_role.name}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{user.assessment_count}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{user.assigned_tests}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(user.created_at)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(user.last_login)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? "default" : "secondary"}>
                        {user.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Users;
