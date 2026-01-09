import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Star, Mail, Copy, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { api } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { InviteModal } from '@/components/admin/InviteModal';

interface TemplateDetails {
  id: string;
  name: string;
  description: string;
  role_id: string;
  role_name: string;
  skills: Array<{
    id: string;
    name: string;
    importance: string;
    tasks: Array<{ id: string; name: string }>;
  }>;
  created_at: string;
  candidates_count: number;
}

export const TemplateView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [template, setTemplate] = useState<TemplateDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    const loadTemplate = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const data = await api.admin.getTemplateDetails(id);
        setTemplate(data);
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to load template', variant: 'destructive' });
        navigate('/admin/templates');
      }
      setIsLoading(false);
    };
    loadTemplate();
  }, [id, navigate, toast]);

  const handleDelete = async () => {
    if (!id) return;
    await api.admin.deleteTemplate(id);
    toast({ title: 'Template deleted', description: 'The test template has been deleted' });
    navigate('/admin/templates');
  };

  const handleDuplicate = async () => {
    if (!id) return;
    const result = await api.admin.duplicateTemplate(id);
    if (result.success) {
      toast({ title: 'Template duplicated', description: 'A copy of this template has been created' });
      navigate(`/admin/templates/${result.id}`);
    } else {
      toast({ title: 'Error', description: 'Failed to duplicate template', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!template) {
    return null;
  }

  const totalTasks = template.skills.reduce((sum, s) => sum + s.tasks.length, 0);
  const estimatedTime = template.skills.length === 0 ? 0 :
    Math.min(10 + (template.skills.length - 1) * 5, 30);

  return (
    <div className="space-y-6">
      {/* Header with Edit button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/templates')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{template.name}</h1>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/admin/templates/${id}/edit`)}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
            <p className="text-muted-foreground">
              {template.description || 'No description provided'}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowInviteModal(true)}>
            <Mail className="h-4 w-4 mr-2" />
            Invite Candidates
          </Button>
          <Button variant="outline" onClick={handleDuplicate}>
            <Copy className="h-4 w-4 mr-2" />
            Duplicate
          </Button>
          <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Role Info */}
          <Card>
            <CardHeader>
              <CardTitle>Role</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{template.role_name}</p>
            </CardContent>
          </Card>

          {/* Skills & Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Skills & Tasks</span>
                <Badge variant="outline">{template.skills.length} skills</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {template.skills.map(skill => (
                <div key={skill.id} className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium">{skill.name}</span>
                    {skill.importance === 'important' && (
                      <Star className="h-4 w-4 text-warning fill-warning" />
                    )}
                    <Badge variant="secondary" className="ml-auto">
                      {skill.tasks.length} tasks
                    </Badge>
                  </div>
                  <div className="pl-4 space-y-1">
                    {skill.tasks.map(task => (
                      <div key={task.id} className="text-sm text-muted-foreground">
                        • {task.name}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Summary Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Role</span>
                <span className="font-medium">{template.role_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Skills</span>
                <span className="font-medium">{template.skills.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tasks</span>
                <span className="font-medium">{totalTasks}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Est. Time</span>
                <span className="font-medium">{estimatedTime} min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Candidates Invited</span>
                <span className="font-medium">{template.candidates_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span className="font-medium">{new Date(template.created_at).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{template.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Invite Modal */}
      <InviteModal
        open={showInviteModal}
        onOpenChange={setShowInviteModal}
        templates={[{ id: template.id, name: template.name }]}
        preselectedTemplateId={template.id}
      />
    </div>
  );
};

export default TemplateView;
