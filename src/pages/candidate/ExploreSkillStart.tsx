import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Target, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/services/api';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  name: string;
}

interface SkillDetails {
  id: string;
  name: string;
  description: string;
  importance: string;
  tasks: Task[];
}

export const ExploreSkillStart = () => {
  const navigate = useNavigate();
  const { skillId } = useParams<{ skillId: string }>();
  const { toast } = useToast();

  const [skill, setSkill] = useState<SkillDetails | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeselectionWarning, setShowDeselectionWarning] = useState(false);

  useEffect(() => {
    const loadSkill = async () => {
      if (!skillId) return;

      setIsLoading(true);
      const skillDetails = await api.skills.getDetails(skillId);
      if (skillDetails) {
        setSkill(skillDetails);
        setSelectedTaskIds(skillDetails.tasks.map((t: Task) => t.id));
      }
      setIsLoading(false);
    };
    loadSkill();
  }, [skillId]);

  const toggleTask = (taskId: string) => {
    setSelectedTaskIds(prev => {
      const isDeselecting = prev.includes(taskId);
      if (isDeselecting) {
        setShowDeselectionWarning(true);
        setTimeout(() => setShowDeselectionWarning(false), 5000);
        return prev.filter(id => id !== taskId);
      }
      setShowDeselectionWarning(false);
      return [...prev, taskId];
    });
  };

  const selectAllTasks = () => {
    if (skill) {
      setSelectedTaskIds(skill.tasks.map(t => t.id));
    }
  };

  const deselectAllTasks = () => {
    setShowDeselectionWarning(true);
    setTimeout(() => setShowDeselectionWarning(false), 5000);
    setSelectedTaskIds([]);
  };

  const handleBegin = () => {
    if (selectedTaskIds.length === 0) {
      toast({ title: 'Error', description: 'Please select at least one task', variant: 'destructive' });
      return;
    }

    const userData = sessionStorage.getItem('user_data');
    const profile = userData ? JSON.parse(userData) : {};

    navigate('/assessment/skill/proctoring', {
      state: {
        roleId: profile.job_role_id,
        skillId: skillId,
        taskIds: selectedTaskIds,
        assessmentType: 'skill',
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!skill) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/request-role')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Alert variant="destructive">
          <AlertTitle>Skill not found</AlertTitle>
          <AlertDescription>The requested skill could not be found.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/request-role')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{skill.name}</h1>
          <p className="text-muted-foreground">Skill Assessment</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Select Tasks to Assess</CardTitle>
              {skill.description && (
                <p className="text-sm text-muted-foreground">{skill.description}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAllTasks}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={deselectAllTasks}>
                  Deselect All
                </Button>
              </div>

              {showDeselectionWarning && (
                <Alert variant="destructive" className="border-destructive bg-destructive/10">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Task Deselected</AlertTitle>
                  <AlertDescription>
                    Deselecting tasks may limit proficiency assessment accuracy.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                {skill.tasks.map(task => {
                  const isSelected = selectedTaskIds.includes(task.id);
                  return (
                    <div
                      key={task.id}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg cursor-pointer border',
                        isSelected ? 'bg-primary/5 border-primary' : 'hover:bg-muted/50 border-transparent'
                      )}
                      onClick={() => toggleTask(task.id)}
                    >
                      <Checkbox checked={isSelected} />
                      <span className="text-sm">{task.name}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
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
                <span className="text-muted-foreground">Skill</span>
                <span className="font-medium">{skill.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tasks</span>
                <span className="font-medium">{selectedTaskIds.length}/{skill.tasks.length} selected</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Time</span>
                <span className="font-medium">10 minutes</span>
              </div>

              <div className="pt-4 border-t">
                <Button
                  className="w-full"
                  onClick={handleBegin}
                  disabled={selectedTaskIds.length === 0}
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

export default ExploreSkillStart;
