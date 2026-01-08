import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { AssessmentProvider } from "@/context/AssessmentContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Admin Pages
import AdminLogin from "./pages/admin/Login";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminTemplates from "./pages/admin/Templates";
import TemplateEditor from "./pages/admin/TemplateEditor";
import AdminCandidates from "./pages/admin/Candidates";
import AdminReport from "./pages/admin/Report";
import AdminLayout from "./layouts/AdminLayout";

// Candidate Pages
import CandidateLogin from "./pages/candidate/Login";
import CandidateDashboard from "./pages/candidate/Dashboard";
import CandidateTests from "./pages/candidate/Tests";
import PreTest from "./pages/candidate/PreTest";
import SkillAssessment from "./pages/candidate/SkillAssessment";
import CandidateProctoring from "./pages/candidate/Proctoring";
import CandidateResults from "./pages/candidate/Results";
import InviteLanding from "./pages/candidate/InviteLanding";
import CandidateAssessment from "./pages/candidate/Assessment";
import CandidateLayout from "./layouts/CandidateLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Legacy assessment flow (original demo) */}
            <Route path="/demo" element={
              <AssessmentProvider>
                <Index />
              </AssessmentProvider>
            } />
            
            {/* Root redirects to candidate login */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            {/* Candidate Portal - Public Routes */}
            <Route path="/login" element={<CandidateLogin />} />
            <Route path="/register" element={<CandidateLogin />} />
            <Route path="/invite/:token" element={<InviteLanding />} />
            
            {/* Candidate Portal - Protected Routes */}
            <Route element={<CandidateLayout />}>
              <Route path="/dashboard" element={<CandidateDashboard />} />
              <Route path="/tests" element={<CandidateTests />} />
              <Route path="/tests/:inviteId" element={<PreTest />} />
              <Route path="/skill-assessment" element={<SkillAssessment />} />
              <Route path="/results/:assessmentId" element={<CandidateResults />} />
            </Route>
            
            {/* Candidate - Proctoring (full screen) */}
            <Route path="/assessment/:inviteId/proctoring" element={<CandidateProctoring />} />
            <Route path="/assessment/skill/proctoring" element={<CandidateProctoring />} />
            
            {/* Candidate - Assessment Window (full screen) */}
            <Route path="/assessment/:inviteId" element={<CandidateAssessment />} />
            <Route path="/assessment/skill" element={<CandidateAssessment />} />
            
            {/* Admin Portal */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="templates" element={<AdminTemplates />} />
              <Route path="templates/new" element={<TemplateEditor />} />
              <Route path="templates/:id" element={<TemplateEditor />} />
              <Route path="candidates" element={<AdminCandidates />} />
              <Route path="reports/:inviteId" element={<AdminReport />} />
            </Route>
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
