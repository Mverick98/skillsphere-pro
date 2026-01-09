import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, Briefcase } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/services/api';

interface Role {
  id: string;
  name: string;
  description: string;
}

const SelectRole = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const loadRoles = async () => {
      const data = await api.roles.getAll();
      setRoles(data);
    };
    loadRoles();
  }, []);

  const handleSubmit = async () => {
    if (!selectedRoleId) {
      toast({ title: 'Error', description: 'Please select a job role', variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    try {
      const result = await api.candidate.updateProfile(selectedRoleId);

      if (result.error) {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
        setIsLoading(false);
        return;
      }

      // Update localStorage with new role info
      const userData = localStorage.getItem('user_data');
      if (userData) {
        const user = JSON.parse(userData);
        user.job_role_id = result.job_role_id;
        user.job_role_name = result.job_role_name;
        localStorage.setItem('user_data', JSON.stringify(user));
      }

      toast({ title: 'Success', description: 'Job role selected successfully!' });
      navigate('/dashboard');
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update profile', variant: 'destructive' });
    }

    setIsLoading(false);
  };

  const selectedRole = roles.find(r => r.id === selectedRoleId);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Target className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Select Your Job Role</CardTitle>
          <CardDescription>
            Choose your current job role to personalize your skill assessments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Briefcase className="h-4 w-4" />
              <span>Your job role determines which skills you can assess</span>
            </div>
            <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
              <SelectTrigger>
                <SelectValue placeholder="Select your job role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map(role => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedRole?.description && (
              <p className="text-xs text-muted-foreground mt-2">
                {selectedRole.description}
              </p>
            )}
          </div>

          <Button
            onClick={handleSubmit}
            className="w-full"
            disabled={!selectedRoleId || isLoading}
          >
            {isLoading ? 'Saving...' : 'Continue to Dashboard'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SelectRole;
