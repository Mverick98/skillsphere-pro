import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Star, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { api } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
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

export const TemplateEditor = () => {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  
  const [roles, setRoles] = useState<Role[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load roles on mount
  useEffect(() => {
    const loadRoles = async () => {
      const data = await api.roles.getAll();
      setRoles(data);
    };
    loadRoles();
  }, []);

  // Load template data if editing
  useEffect(() => {
    if (isEditing && id) {
      const loadTemplate = async () => {
        setIsLoading(true);
        const data = await api.admin.getTemplate(id);
        setName(data.name);
        setDescription(data.description || '');
        setSelectedRoleId(data.role_id);
        setSelectedSkillIds(data.skill_ids);
        setSelectedTaskIds(data.task_ids);
        setIsLoading(false);
      };
      loadTemplate();
    }
  }, [isEditing, id]);

  // Load skills when role changes
  useEffect(() => {
    if (selectedRoleId) {
      const loadSkills = async () => {
        const data = await api.roles.getSkills(selectedRoleId);
        setSkills(data);
        
        // Auto-select all tasks for newly selected skills
        if (!isEditing) {
          const allTaskIds = data.flatMap((s: Skill) => s.tasks.map(t => t.id));
          setSelectedTaskIds(allTaskIds);
        }
      };
      loadSkills();
    } else {
      setSkills([]);
    }
  }, [selectedRoleId, isEditing]);

  const selectedRole = roles.find(r => r.id === selectedRoleId);

  const toggleSkill = (skillId: string) => {
    setSelectedSkillIds(prev => {
      const isSelected = prev.includes(skillId);
      if (isSelected) {
        // Remove skill and its tasks
        const skill = skills.find(s => s.id === skillId);
        if (skill) {
          setSelectedTaskIds(t => t.filter(tid => !skill.tasks.some(st => st.id === tid)));
        }
        return prev.filter(id => id !== skillId);
      } else if (prev.length < 5) {
        // Add skill and auto-select all its tasks
        const skill = skills.find(s => s.id === skillId);
        if (skill) {
          setSelectedTaskIds(t => [...t, ...skill.tasks.map(st => st.id)]);
        }
        return [...prev, skillId];
      } else {
        toast({ title: 'Maximum skills', description: 'You can select up to 5 skills', variant: 'destructive' });
        return prev;
      }
    });
  };

  const toggleTask = (taskId: string) => {
    setSelectedTaskIds(prev => {
      const isDeselecting = prev.includes(taskId);
      if (isDeselecting) {
        toast({ 
          title: 'Task deselected', 
          description: 'Deselecting tasks may affect proficiency accuracy',
          variant: 'destructive'
        });
        return prev.filter(id => id !== taskId);
      }
      return [...prev, taskId];
    });
  };

  const selectAllTasks = (skill: Skill) => {
    setSelectedTaskIds(prev => {
      const taskIds = skill.tasks.map(t => t.id);
      return [...new Set([...prev, ...taskIds])];
    });
  };

  const deselectAllTasks = (skill: Skill) => {
    toast({ 
      title: 'Tasks deselected', 
      description: 'Deselecting tasks may affect proficiency accuracy',
      variant: 'destructive'
    });
    setSelectedTaskIds(prev => prev.filter(id => !skill.tasks.some(t => t.id === id)));
  };

  const getSelectedTasksForSkill = (skill: Skill) => {
    return skill.tasks.filter(t => selectedTaskIds.includes(t.id)).length;
  };

  const totalSelectedTasks = selectedTaskIds.length;
  const estimatedTime = selectedSkillIds.length === 0 ? 0 : 
    Math.min(10 + (selectedSkillIds.length - 1) * 5, 30);

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: 'Error', description: 'Please enter a template name', variant: 'destructive' });
      return;
    }
    if (!selectedRoleId) {
      toast({ title: 'Error', description: 'Please select a role', variant: 'destructive' });
      return;
    }
    if (selectedSkillIds.length === 0) {
      toast({ title: 'Error', description: 'Please select at least one skill', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    const data = { name, description, role_id: selectedRoleId, skill_ids: selectedSkillIds, task_ids: selectedTaskIds };
    
    if (isEditing && id) {
      await api.admin.updateTemplate(id, data);
      toast({ title: 'Template updated', description: 'Your changes have been saved' });
    } else {
      await api.admin.createTemplate(data);
      toast({ title: 'Template created', description: 'Your test template has been created' });
    }
    
    setIsSaving(false);
    navigate('/admin/templates');
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
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/templates')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{isEditing ? `Edit: ${name}` : 'Create Test Template'}</h1>
          <p className="text-muted-foreground">Configure your assessment template</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Backend Developer Assessment"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of this assessment..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Role Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Role Selection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
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

          {/* Skills Selection */}
          {skills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Skills Selection</span>
                  <Badge variant="outline">{selectedSkillIds.length}/5 selected</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {skills.map(skill => {
                  const isSelected = selectedSkillIds.includes(skill.id);
                  return (
                    <div
                      key={skill.id}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                        isSelected ? 'bg-primary/5 border-primary' : 'hover:bg-muted/50'
                      )}
                      onClick={() => toggleSkill(skill.id)}
                    >
                      <Checkbox checked={isSelected} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{skill.name}</span>
                          {skill.importance === 'important' && (
                            <Star className="h-4 w-4 text-warning fill-warning" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{skill.description}</p>
                      </div>
                      {isSelected && <Check className="h-5 w-5 text-primary" />}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Tasks Selection */}
          {selectedSkillIds.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tasks Selection</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" defaultValue={selectedSkillIds}>
                  {skills.filter(s => selectedSkillIds.includes(s.id)).map(skill => (
                    <AccordionItem key={skill.id} value={skill.id}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center justify-between w-full pr-4">
                          <span className="font-medium">{skill.name}</span>
                          <Badge variant="secondary">
                            {getSelectedTasksForSkill(skill)}/{skill.tasks.length}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 pt-2">
                          <div className="flex gap-2 mb-3">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); selectAllTasks(skill); }}
                            >
                              Select All
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); deselectAllTasks(skill); }}
                            >
                              Deselect All
                            </Button>
                          </div>
                          {skill.tasks.map(task => {
                            const isSelected = selectedTaskIds.includes(task.id);
                            return (
                              <div
                                key={task.id}
                                className={cn(
                                  'flex items-center gap-3 p-2 rounded cursor-pointer',
                                  isSelected ? 'bg-muted' : 'hover:bg-muted/50'
                                )}
                                onClick={() => toggleTask(task.id)}
                              >
                                <Checkbox checked={isSelected} />
                                <span>{task.name}</span>
                              </div>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Summary Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Template Name</span>
                <span className="font-medium">{name || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Role</span>
                <span className="font-medium">{selectedRole?.name || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Skills</span>
                <span className="font-medium">{selectedSkillIds.length}/5</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tasks</span>
                <span className="font-medium">{totalSelectedTasks}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Est. Time</span>
                <span className="font-medium">{estimatedTime ? `${estimatedTime} min` : '-'}</span>
              </div>
              
              <div className="pt-4 border-t space-y-2">
                <Button className="w-full" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Template'}
                </Button>
                <Button variant="outline" className="w-full" onClick={() => navigate('/admin/templates')}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TemplateEditor;
