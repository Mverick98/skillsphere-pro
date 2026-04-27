import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/services/api';

interface Role {
  id: string;
  name: string;
  description: string;
}

const CandidateLogin = () => {
  const [activeTab, setActiveTab] = useState('login');
  
  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  
  // Register state
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [roles, setRoles] = useState<Role[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const { loginCandidate, registerCandidate } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Load roles when register tab is active
  useEffect(() => {
    if (activeTab === 'register' && roles.length === 0) {
      const loadRoles = async () => {
        const data = await api.roles.getAll();
        setRoles(data);
      };
      loadRoles();
    }
  }, [activeTab, roles.length]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!loginEmail || !loginPassword) {
      toast({ title: 'Error', description: 'Please fill in all fields', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    const result = await loginCandidate(loginEmail, loginPassword);
    setIsLoading(false);

    if (result.success) {
      // If the candidate arrived here via an invite link, InviteLanding stashed
      // the specific invite_id under sessionStorage.pending_invite. Send them
      // straight to that test's pre-test page instead of the generic dashboard.
      const pendingInviteId = sessionStorage.getItem('pending_invite');
      if (pendingInviteId) {
        sessionStorage.removeItem('pending_invite');
        navigate(`/tests/${pendingInviteId}`);
        return;
      }

      // Otherwise: role-selection if missing, else dashboard
      if (result.needsRoleSelection) {
        navigate('/select-role');
      } else {
        navigate('/dashboard');
      }
    } else {
      toast({ title: 'Error', description: 'Invalid credentials', variant: 'destructive' });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!registerName || !registerEmail || !registerPassword || !registerConfirmPassword || !selectedRoleId) {
      toast({ title: 'Error', description: 'Please fill in all fields including your job role', variant: 'destructive' });
      return;
    }

    if (registerPassword.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }

    if (registerPassword !== registerConfirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    const success = await registerCandidate(registerName, registerEmail, registerPassword, selectedRoleId);
    setIsLoading(false);

    if (success) {
      toast({ title: 'Account created', description: 'Welcome to SkillSphere!' });
      // Same invite-link handoff as login: jump straight to the pre-test page
      // if the registration was kicked off from an invite link.
      const pendingInviteId = sessionStorage.getItem('pending_invite');
      if (pendingInviteId) {
        sessionStorage.removeItem('pending_invite');
        navigate(`/tests/${pendingInviteId}`);
        return;
      }
      navigate('/dashboard');
    } else {
      toast({ title: 'Error', description: 'Failed to create account', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Target className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">SkillSphere</CardTitle>
          <CardDescription>Proficiency Assessment Platform</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showLoginPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                    >
                      {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-name">Full Name</Label>
                  <Input
                    id="register-name"
                    type="text"
                    placeholder="John Doe"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="you@example.com"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-role">Job Role *</Label>
                  <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your job role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map(role => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedRoleId && roles.find(r => r.id === selectedRoleId)?.description && (
                    <p className="text-xs text-muted-foreground">
                      {roles.find(r => r.id === selectedRoleId)?.description}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="register-password"
                      type={showRegisterPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                    >
                      {showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-confirm">Confirm Password</Label>
                  <Input
                    id="register-confirm"
                    type="password"
                    placeholder="••••••••"
                    value={registerConfirmPassword}
                    onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default CandidateLogin;
