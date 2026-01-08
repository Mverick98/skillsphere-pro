import { useAssessment } from '@/context/AssessmentContext';
import { roles } from '@/data/mockData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Briefcase, ChevronRight } from 'lucide-react';

const RoleSelector = () => {
  const { selectedRole, selectRole } = useAssessment();

  const handleRoleChange = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (role) {
      selectRole(role);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-full gradient-primary text-primary-foreground text-sm font-semibold">
          1
        </div>
        <h2 className="text-lg font-semibold text-foreground">Select Your Role</h2>
      </div>

      <Select value={selectedRole?.id || ''} onValueChange={handleRoleChange}>
        <SelectTrigger className="h-12 text-base">
          <SelectValue placeholder="Choose a role to assess..." />
        </SelectTrigger>
        <SelectContent>
          {roles.map(role => (
            <SelectItem key={role.id} value={role.id} className="py-3">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary" />
                <span>{role.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedRole && (
        <Card className="animate-fade-in border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Briefcase className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-foreground">{selectedRole.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{selectedRole.description}</p>
                <div className="flex items-center gap-1 mt-2 text-xs text-primary">
                  <span>{selectedRole.skills.length} skills available</span>
                  <ChevronRight className="w-3 h-3" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RoleSelector;
