import { useAssessment } from '@/context/AssessmentContext';
import RoleSelector from '@/components/assessment/RoleSelector';
import SkillSelector from '@/components/assessment/SkillSelector';
import TaskSelector from '@/components/assessment/TaskSelector';
import AssessmentSummary from '@/components/assessment/AssessmentSummary';
import { Button } from '@/components/ui/button';
import { ClipboardCheck, LogOut } from 'lucide-react';

const AssessmentConfig = () => {
  const { selectedRole, selectedSkills, logout } = useAssessment();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg gradient-primary">
              <ClipboardCheck className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-semibold text-foreground">Proficiency Assessment</h1>
              <p className="text-xs text-muted-foreground">Configure your evaluation</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground">Configure Your Assessment</h2>
          <p className="text-muted-foreground mt-1">
            Select a role, skills, and tasks to customize your evaluation
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Configuration Steps */}
          <div className="lg:col-span-2 space-y-8">
            <RoleSelector />
            
            {selectedRole && <SkillSelector />}
            
            {selectedSkills.length > 0 && <TaskSelector />}
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <AssessmentSummary />
          </div>
        </div>
      </main>
    </div>
  );
};

export default AssessmentConfig;
