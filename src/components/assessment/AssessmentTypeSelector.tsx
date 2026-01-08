import { useAssessment } from '@/context/AssessmentContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Target, Users, Check, ArrowRight } from 'lucide-react';

const AssessmentTypeSelector = () => {
  const { assessmentType, setAssessmentType, setStep } = useAssessment();

  const handleContinue = () => {
    if (assessmentType) {
      setStep('config');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-4xl animate-fade-in">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-foreground">Choose Assessment Type</h1>
          <p className="text-muted-foreground mt-2">
            Select the type of assessment that best fits your evaluation needs
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Skill Assessment Card */}
          <Card
            className={`cursor-pointer transition-all duration-200 relative overflow-hidden ${
              assessmentType === 'skill'
                ? 'border-primary ring-2 ring-primary/20 shadow-lg'
                : 'hover:border-primary/30 hover:shadow-md'
            }`}
            onClick={() => setAssessmentType('skill')}
          >
            {assessmentType === 'skill' && (
              <div className="absolute top-4 right-4">
                <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </div>
              </div>
            )}
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${
                  assessmentType === 'skill' ? 'gradient-primary' : 'bg-muted'
                }`}>
                  <Target className={`w-6 h-6 ${
                    assessmentType === 'skill' ? 'text-primary-foreground' : 'text-muted-foreground'
                  }`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-semibold text-foreground">Skill Assessment</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">10 minutes</p>
                  <Badge variant="outline" className="mb-4">Single Skill</Badge>
                  <p className="text-sm text-muted-foreground mb-4">
                    Deep dive into a single skill. Test your proficiency on one specific skill with focused questions.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Select one role for context
                    </li>
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Choose exactly ONE skill to assess
                    </li>
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Detailed task-level analysis
                    </li>
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      ~15-20 questions
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Persona Assessment Card */}
          <Card
            className={`cursor-pointer transition-all duration-200 relative overflow-hidden ${
              assessmentType === 'persona'
                ? 'border-primary ring-2 ring-primary/20 shadow-lg'
                : 'hover:border-primary/30 hover:shadow-md'
            }`}
            onClick={() => setAssessmentType('persona')}
          >
            {assessmentType === 'persona' && (
              <div className="absolute top-4 right-4">
                <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </div>
              </div>
            )}
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${
                  assessmentType === 'persona' ? 'gradient-primary' : 'bg-muted'
                }`}>
                  <Users className={`w-6 h-6 ${
                    assessmentType === 'persona' ? 'text-primary-foreground' : 'text-muted-foreground'
                  }`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-semibold text-foreground">Persona Assessment</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">Up to 30 minutes</p>
                  <Badge variant="outline" className="mb-4">Multi-Skill</Badge>
                  <p className="text-sm text-muted-foreground mb-4">
                    Comprehensive role-based evaluation. Validate your proficiency across multiple skills required for a role.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Select one role
                    </li>
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Choose 1-5 skills to assess
                    </li>
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Role-level proficiency score
                    </li>
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      ~15-50 questions based on selection
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 flex justify-center">
          <Button
            className="h-12 px-8 gradient-primary hover:opacity-90 transition-opacity"
            disabled={!assessmentType}
            onClick={handleContinue}
          >
            Continue
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AssessmentTypeSelector;
