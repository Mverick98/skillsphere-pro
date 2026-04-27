import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Target, Star, AlertCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/services/api';
import { cn } from '@/lib/utils';

interface Skill {
  id: string;
  name: string;
  description: string;
  importance: string;
  tasks: { id: string; name: string }[];
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  job_role_id?: string;
  job_role_name?: string;
}

export const SkillAssessment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Check for preselected skill from Explore Skills page
  const preselectedSkillId = (location.state as { preselectedSkillId?: string })?.preselectedSkillId;

  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedSkillId, setSelectedSkillId] = useState<string>('');
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showDeselectionWarning, setShowDeselectionWarning] = useState(false);

  // Load user profile and skills based on their job role
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);

      // Get user profile from sessionStorage (set during login)
      const userData = sessionStorage.getItem('user_data');
      if (userData) {
        const profile = JSON.parse(userData) as UserProfile;
        setUserProfile(profile);

        let skillsData: Skill[] = [];

        // If user has a job role, load skills for that role
        if (profile.job_role_id) {
          skillsData = await api.roles.getSkills(profile.job_role_id);
        }

        // If preselected skill exists, fetch it and add if not in list
        if (preselectedSkillId) {
          const existingSkill = skillsData.find((s: Skill) => s.id === preselectedSkillId);
          if (existingSkill) {
            // Skill is in user's role - just select it
            setSelectedSkillId(preselectedSkillId);
            setSelectedTaskIds(existingSkill.tasks.map((t: { id: string }) => t.id));
          } else {
            // Skill is from another role - fetch and add it
            const skillDetails = await api.skills.getDetails(preselectedSkillId);
            if (skillDetails) {
              skillsData = [skillDetails, ...skillsData];
              setSelectedSkillId(preselectedSkillId);
              setSelectedTaskIds(skillDetails.tasks.map((t: { id: string }) => t.id));
            }
          }
        }

        setSkills(skillsData);
      }

      setIsLoading(false);
    };
    loadData();
  }, [preselectedSkillId]);

  const selectedSkill = skills.find(s => s.id === selectedSkillId);

  const selectSkill = (skillId: string) => {
    if (selectedSkillId === skillId) {
      // Deselect if clicking the same skill
      setSelectedSkillId('');
      setSelectedTaskIds([]);
    } else {
      // Select new skill and auto-select all its tasks
      setSelectedSkillId(skillId);
      const skill = skills.find(s => s.id === skillId);
      if (skill) {
        setSelectedTaskIds(skill.tasks.map(t => t.id));
      }
    }
  };

  const toggleTask = (taskId: string) => {
    setSelectedTaskIds(prev => {
      const isDeselecting = prev.includes(taskId);
      if (isDeselecting) {
        // Show red ribbon warning
        setShowDeselectionWarning(true);
        // Auto-dismiss after 5 seconds
        setTimeout(() => setShowDeselectionWarning(false), 5000);
        return prev.filter(id => id !== taskId);
      }
      setShowDeselectionWarning(false);
      return [...prev, taskId];
    });
  };

  const selectAllTasks = () => {
    if (selectedSkill) {
      setSelectedTaskIds(selectedSkill.tasks.map(t => t.id));
    }
  };

  const deselectAllTasks = () => {
    setShowDeselectionWarning(true);
    setTimeout(() => setShowDeselectionWarning(false), 5000);
    setSelectedTaskIds([]);
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
        roleId: userProfile?.job_role_id,
        skillId: selectedSkillId,
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

  // If user has no job role set, show message to update profile
  if (!userProfile?.job_role_id) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Skill Assessment</h1>
            <p className="text-muted-foreground">Test your proficiency in a specific skill</p>
          </div>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Job Role Required</AlertTitle>
          <AlertDescription>
            Please update your profile to set your job role before taking skill assessments.
            Your job role determines which skills are available for assessment.
          </AlertDescription>
        </Alert>
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
          <h1 className="text-2xl font-bold">Skill Assessment</h1>
          <p className="text-muted-foreground">
            Test your proficiency as a {userProfile.job_role_name}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Skills & Tasks Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Select a Skill to Assess</span>
                {selectedSkillId && (
                  <Badge variant="outline">1 skill selected</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion
                type="single"
                value={selectedSkillId}
                onValueChange={selectSkill}
                className="space-y-2"
              >
                {skills.map(skill => {
                  const isSelected = selectedSkillId === skill.id;
                  const selectedTasksForSkill = isSelected ? selectedTaskIds.length : 0;

                  return (
                    <AccordionItem
                      key={skill.id}
                      value={skill.id}
                      className={cn(
                        'border rounded-lg px-3',
                        isSelected ? 'border-primary bg-primary/5' : ''
                      )}
                    >
                      <AccordionTrigger className="hover:no-underline py-4">
                        <div className="flex items-center justify-between w-full pr-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{skill.name}</span>
                            {skill.importance === 'important' && (
                              <Star className="h-4 w-4 text-warning fill-warning" />
                            )}
                          </div>
                          {isSelected && (
                            <Badge variant="secondary" className="ml-2">
                              {selectedTasksForSkill}/{skill.tasks.length} tasks
                            </Badge>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="pb-3 space-y-3">
                          <p className="text-sm text-muted-foreground">{skill.description}</p>

                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); selectAllTasks(); }}
                            >
                              Select All
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); deselectAllTasks(); }}
                            >
                              Deselect All
                            </Button>
                          </div>

                          {/* Red ribbon warning for task deselection */}
                          {showDeselectionWarning && (
                            <Alert variant="destructive" className="border-destructive bg-destructive/10">
                              <AlertTriangle className="h-4 w-4" />
                              <AlertTitle>Task Deselected</AlertTitle>
                              <AlertDescription>
                                Deselecting tasks may limit proficiency assessment accuracy. Consider keeping all tasks selected for best results.
                              </AlertDescription>
                            </Alert>
                          )}

                          <div className="space-y-2">
                            {skill.tasks.map(task => {
                              const isTaskSelected = selectedTaskIds.includes(task.id);
                              return (
                                <div
                                  key={task.id}
                                  className={cn(
                                    'flex items-center gap-3 p-2 rounded cursor-pointer',
                                    isTaskSelected ? 'bg-muted' : 'hover:bg-muted/50'
                                  )}
                                  onClick={() => toggleTask(task.id)}
                                >
                                  <Checkbox checked={isTaskSelected} />
                                  <span className="text-sm">{task.name}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
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
                <span className="text-muted-foreground">Role</span>
                <span className="font-medium">{userProfile.job_role_name || '-'}</span>
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
