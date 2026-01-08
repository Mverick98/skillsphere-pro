import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Mail, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/services/api';

interface Template {
  id: string;
  name: string;
}

interface InviteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates?: Template[];
  preselectedTemplateId?: string;
}

export const InviteModal = ({ open, onOpenChange, templates = [], preselectedTemplateId }: InviteModalProps) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState(preselectedTemplateId || '');
  const [singleEmail, setSingleEmail] = useState('');
  const [bulkEmails, setBulkEmails] = useState('');
  const [addedEmails, setAddedEmails] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  useEffect(() => {
    if (preselectedTemplateId) {
      setSelectedTemplateId(preselectedTemplateId);
    }
  }, [preselectedTemplateId]);

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  };

  const addEmail = (email: string) => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    
    if (!isValidEmail(trimmed)) {
      toast({ title: 'Invalid email', description: `"${trimmed}" is not a valid email address`, variant: 'destructive' });
      return;
    }
    
    if (addedEmails.includes(trimmed)) {
      toast({ title: 'Duplicate', description: 'This email has already been added', variant: 'destructive' });
      return;
    }
    
    setAddedEmails(prev => [...prev, trimmed]);
  };

  const handleAddSingle = () => {
    addEmail(singleEmail);
    setSingleEmail('');
  };

  const handleAddBulk = () => {
    const emails = bulkEmails.split('\n').filter(e => e.trim());
    emails.forEach(addEmail);
    setBulkEmails('');
  };

  const removeEmail = (email: string) => {
    setAddedEmails(prev => prev.filter(e => e !== email));
  };

  const handleSend = async () => {
    if (!selectedTemplateId) {
      toast({ title: 'No template selected', description: 'Please select a test template', variant: 'destructive' });
      return;
    }
    if (addedEmails.length === 0) {
      toast({ title: 'No emails', description: 'Please add at least one email address', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      await api.admin.inviteCandidates(selectedTemplateId, addedEmails);
      toast({ title: 'Invitations sent', description: `Successfully invited ${addedEmails.length} candidate(s)` });
      setAddedEmails([]);
      onOpenChange(false);
    } catch {
      toast({ title: 'Error', description: 'Failed to send invitations', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setAddedEmails([]);
    setSingleEmail('');
    setBulkEmails('');
    if (!preselectedTemplateId) {
      setSelectedTemplateId('');
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Invite Candidates</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template Selector */}
          <div className="space-y-2">
            <Label>Select Test Template *</Label>
            <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a test template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map(template => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Single email input */}
          <div className="space-y-2">
            <Label>Add Candidate Email</Label>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Enter email address"
                value={singleEmail}
                onChange={(e) => setSingleEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSingle()}
              />
              <Button onClick={handleAddSingle} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Bulk emails */}
          <div className="space-y-2">
            <Label>Or add multiple (one per line)</Label>
            <div className="flex gap-2">
              <Textarea
                placeholder="john@example.com&#10;jane@example.com&#10;bob@example.com"
                value={bulkEmails}
                onChange={(e) => setBulkEmails(e.target.value)}
                rows={3}
              />
            </div>
            {bulkEmails && (
              <Button variant="outline" size="sm" onClick={handleAddBulk}>
                Add All
              </Button>
            )}
          </div>

          {/* Added emails list */}
          {addedEmails.length > 0 && (
            <div className="space-y-2">
              <Label>Added ({addedEmails.length})</Label>
              <div className="border rounded-lg p-3 max-h-32 overflow-y-auto space-y-2">
                {addedEmails.map((email) => (
                  <div key={email} className="flex items-center justify-between bg-muted/50 rounded px-3 py-1.5">
                    <span className="text-sm">{email}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeEmail(email)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Email Preview */}
          {selectedTemplate && (
            <div className="space-y-2">
              <Label>Email Preview</Label>
              <div className="border rounded-lg p-4 bg-muted/30 text-sm">
                <p className="font-medium mb-2">Subject: You've been invited to take an assessment</p>
                <p className="text-muted-foreground">
                  Hi,<br /><br />
                  You have been invited to take a proficiency assessment for {selectedTemplate.name}.<br /><br />
                  Click the link below to begin your assessment...
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSend} disabled={!selectedTemplateId || addedEmails.length === 0 || isLoading}>
            <Mail className="h-4 w-4 mr-2" />
            Send to {addedEmails.length} candidate{addedEmails.length !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InviteModal;
