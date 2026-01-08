import { useAssessment, AssessmentProvider } from '@/context/AssessmentContext';
import Login from './Login';
import AssessmentConfig from './AssessmentConfig';
import AssessmentWindow from '@/components/assessment/AssessmentWindow';
import AssessmentLoading from '@/components/assessment/AssessmentLoading';
import EvaluationDashboard from './EvaluationDashboard';
import ProctoringConsent from '@/components/assessment/ProctoringConsent';
import AssessmentTypeSelector from '@/components/assessment/AssessmentTypeSelector';

const AssessmentRouter = () => {
  const { currentStep, isAuthenticated } = useAssessment();

  if (!isAuthenticated) {
    return <Login />;
  }

  switch (currentStep) {
    case 'type-select':
      return <AssessmentTypeSelector />;
    case 'config':
      return (
        <>
          <AssessmentConfig />
          <ProctoringConsent />
        </>
      );
    case 'proctoring':
      return (
        <>
          <AssessmentConfig />
          <ProctoringConsent />
        </>
      );
    case 'assessment':
      return <AssessmentWindow />;
    case 'loading':
      return <AssessmentLoading />;
    case 'results':
      return <EvaluationDashboard />;
    default:
      return <Login />;
  }
};

const Index = () => {
  return (
    <AssessmentProvider>
      <AssessmentRouter />
    </AssessmentProvider>
  );
};

export default Index;
