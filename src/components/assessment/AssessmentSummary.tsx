import { useAssessment } from '@/context/AssessmentContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Briefcase, BookOpen, ListChecks, Clock, ArrowRight, AlertCircle, Target, Users } from 'lucide-react';

const AssessmentSummary = () => {
  const {
    assessmentType,
    selectedRole,
    selectedSkills,
    selectedTasks,
    getEstimatedTime,
    canStartAssessment,
    setStep,
  } = useAssessment();

  const handleBeginAssessment = () => {
    setStep('proctoring');
  };

  const isSkillMode = assessmentType === 'skill';
  const maxSkills = isSkillMode ? 1 : 5;

  const validationErrors = [];
  if (selectedSkills.length === 0) {
    validationErrors.push(isSkillMode ? 'Select a skill' : 'Select at least 1 skill');
  } else {
    selectedSkills.forEach(skill => {
      const hasTasks = selectedTasks.some(t => t.skillId === skill.id);
      if (!hasTasks) {
        validationErrors.push(`Select tasks for ${skill.name}`);
      }
    });
  }

  return (
    <Card className="border shadow-card sticky top-6">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <ListChecks className="w-5 h-5 text-primary" />
          Assessment Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Assessment Type */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg gradient-primary">
            {isSkillMode ? (
              <Target className="w-4 h-4 text-primary-foreground" />
            ) : (
              <Users className="w-4 h-4 text-primary-foreground" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Assessment Type</p>
            <p className="font-medium text-foreground">
              {isSkillMode ? 'Skill Assessment' : 'Persona Assessment'}
            </p>
          </div>
        </div>

        <Separator />

        {/* Role */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted">
            <Briefcase className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Selected Role</p>
            <p className="font-medium text-foreground">
              {selectedRole?.name || 'Not selected'}
            </p>
          </div>
        </div>

        <Separator />

        {/* Skills */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted">
            <BookOpen className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">
              {isSkillMode ? 'Skill Selected' : 'Skills Selected'}
            </p>
            <p className="font-medium text-foreground">
              {selectedSkills.length} / {maxSkills}
            </p>
          </div>
        </div>

        {/* Tasks */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted">
            <ListChecks className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Total Tasks</p>
            <p className="font-medium text-foreground">
              {selectedTasks.length}
            </p>
          </div>
        </div>

        <Separator />

        {/* Estimated Time */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg gradient-primary">
            <Clock className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Estimated Time</p>
            <p className="font-semibold text-foreground">
              {selectedSkills.length > 0 ? `${getEstimatedTime()} minutes` : '—'}
            </p>
          </div>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="p-3 rounded-lg bg-warning/10 space-y-1">
            {validationErrors.map((error, index) => (
              <div key={index} className="flex items-center gap-2 text-xs text-warning">
                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                <span>{error}</span>
              </div>
            ))}
          </div>
        )}

        {/* Begin Button */}
        <Button
          className="w-full h-11 gradient-primary hover:opacity-90 transition-opacity"
          disabled={!canStartAssessment()}
          onClick={handleBeginAssessment}
        >
          Begin Assessment
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          You'll need to enable your camera for proctoring
        </p>
      </CardContent>
    </Card>
  );
};

export default AssessmentSummary;
