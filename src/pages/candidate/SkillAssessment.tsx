import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Target, Check, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/services/api';
import { cn } from '@/lib/utils';

interface Role {
  id: string;
  name: string;
  description: string;
}

interface Skill {
  id: string;
  name: string;
  description: string;
  importance: string;
  tasks: { id: string; name: string }[];
}

export const SkillAssessment = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [roles, setRoles] = useState<Role[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [selectedSkillId, setSelectedSkillId] = useState<string>('');
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  // Load roles on mount
  useEffect(() => {
    const loadRoles = async () => {
      const data = await api.roles.getAll();
      setRoles(data);
    };
    loadRoles();
  }, []);

  // Load skills when role changes
  useEffect(() => {
    if (selectedRoleId) {
      const loadSkills = async () => {
        const data = await api.roles.getSkills(selectedRoleId);
        setSkills(data);
        setSelectedSkillId('');
        setSelectedTaskIds([]);
      };
      loadSkills();
    } else {
      setSkills([]);
    }
  }, [selectedRoleId]);

  // Auto-select all tasks when skill is selected
  useEffect(() => {
    if (selectedSkillId) {
      const skill = skills.find(s => s.id === selectedSkillId);
      if (skill) {
        setSelectedTaskIds(skill.tasks.map(t => t.id));
      }
    } else {
      setSelectedTaskIds([]);
    }
  }, [selectedSkillId, skills]);

  const selectedRole = roles.find(r => r.id === selectedRoleId);
  const selectedSkill = skills.find(s => s.id === selectedSkillId);

  const toggleTask = (taskId: string) => {
    setSelectedTaskIds(prev => {
      const isDeselecting = prev.includes(taskId);
      if (isDeselecting) {
        toast({ 
          title: 'Task deselected', 
          description: 'Deselecting tasks may limit proficiency assessment accuracy',
          variant: 'destructive'
        });
        return prev.filter(id => id !== taskId);
      }
      return [...prev, taskId];
    });
  };

  const handleBegin = () => {
    if (!selectedSkillId) {
      toast({ title: 'Error', description: 'Please select a skill', variant: 'destructive' });
      return;
    }
    if (selectedTaskIds.length === 0) {
      toast({ title: 'Error', description: 'Please select at least one task', variant: 'destructive' });
      return;
    }
    // Navigate to proctoring consent
    navigate('/assessment/skill/proctoring', {
      state: {
        roleId: selectedRoleId,
        skillId: selectedSkillId,
        taskIds: selectedTaskIds,
        assessmentType: 'skill',
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Skill Assessment</h1>
          <p className="text-muted-foreground">Test your proficiency in a specific skill</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Select Role */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Step 1: Select Role</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role for context" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(role => (
                    <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedRole && (
                <p className="text-sm text-muted-foreground">{selectedRole.description}</p>
              )}
            </CardContent>
          </Card>

          {/* Step 2: Select Skill (single selection) */}
          {skills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Step 2: Select Skill (choose ONE)</span>
                  <Badge variant="outline">1 skill selected</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={selectedSkillId} onValueChange={setSelectedSkillId}>
                  <div className="space-y-3">
                    {skills.map(skill => (
                      <div
                        key={skill.id}
                        className={cn(
                          'flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors',
                          selectedSkillId === skill.id ? 'bg-primary/5 border-primary' : 'hover:bg-muted/50'
                        )}
                        onClick={() => setSelectedSkillId(skill.id)}
                      >
                        <RadioGroupItem value={skill.id} id={skill.id} />
                        <Label htmlFor={skill.id} className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{skill.name}</span>
                            {skill.importance === 'important' && (
                              <Star className="h-4 w-4 text-warning fill-warning" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground font-normal">{skill.description}</p>
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Select Tasks */}
          {selectedSkill && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Step 3: Select Tasks</span>
                  <Badge variant="outline">{selectedTaskIds.length}/{selectedSkill.tasks.length} selected</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {selectedSkill.tasks.map(task => {
                    const isSelected = selectedTaskIds.includes(task.id);
                    return (
                      <div
                        key={task.id}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors',
                          isSelected ? 'bg-muted' : 'hover:bg-muted/50'
                        )}
                        onClick={() => toggleTask(task.id)}
                      >
                        <Checkbox checked={isSelected} />
                        <span>{task.name}</span>
                        {isSelected && <Check className="h-4 w-4 text-primary ml-auto" />}
                      </div>
                    );
                  })}
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  All tasks selected ({selectedTaskIds.length}/{selectedSkill.tasks.length})
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Summary Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium">Skill Assessment</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Role</span>
                <span className="font-medium">{selectedRole?.name || '-'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Skill</span>
                <span className="font-medium">{selectedSkill?.name || '-'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tasks</span>
                <span className="font-medium">{selectedTaskIds.length} selected</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Time</span>
                <span className="font-medium">10 minutes</span>
              </div>
              
              <div className="pt-4 border-t">
                <Button 
                  className="w-full" 
                  onClick={handleBegin}
                  disabled={!selectedSkillId || selectedTaskIds.length === 0}
                >
                  Begin Assessment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SkillAssessment;
