import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '@/services/api';

export const InviteLanding = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const validateInvite = async () => {
      if (!token) {
        setError('Invalid invitation link');
        return;
      }

      try {
        const result = await api.invite.validate(token);
        
        if (result.valid) {
          // Redirect to pre-test screen or login
          const authToken = localStorage.getItem('auth_token');
          if (authToken) {
            navigate(`/tests/${result.invite_id}`);
          } else {
            // Store invite ID and redirect to login
            localStorage.setItem('pending_invite', result.invite_id);
            navigate('/login');
          }
        } else {
          setError('This invitation link is invalid or has expired');
        }
      } catch {
        setError('Failed to validate invitation');
      }
    };

    validateInvite();
  }, [token, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Invalid Invitation</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <a href="/login" className="text-primary hover:underline">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
};

export default InviteLanding;
