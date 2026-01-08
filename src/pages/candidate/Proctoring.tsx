import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Camera, Monitor, Clock, CheckCircle, Video } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export const CandidateProctoring = () => {
  const { inviteId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Get assessment config from state (for skill assessment)
  const assessmentConfig = location.state as {
    roleId?: string;
    skillId?: string;
    taskIds?: string[];
    assessmentType?: 'skill' | 'persona';
  } | null;

  const enableCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      setCameraEnabled(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch {
      toast({ 
        title: 'Camera access denied', 
        description: 'Please allow camera access to continue with the assessment',
        variant: 'destructive'
      });
    }
  };

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const handleStartAssessment = () => {
    // Navigate to the actual assessment window
    if (inviteId && inviteId !== 'skill') {
      // Assigned test
      navigate(`/assessment/${inviteId}`, { state: { proctoring: true } });
    } else if (assessmentConfig) {
      // Skill assessment
      navigate('/assessment/skill', { state: { ...assessmentConfig, proctoring: true } });
    } else {
      navigate('/dashboard');
    }
  };

  const canStart = cameraEnabled && consentChecked;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Video className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Proctoring Setup</CardTitle>
          <p className="text-muted-foreground mt-2">
            This assessment is proctored to ensure integrity.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* What will be monitored */}
          <div className="space-y-3">
            <h3 className="font-medium">What will be monitored:</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm">
                <Camera className="h-4 w-4 text-muted-foreground" />
                <span>Webcam captures during the test</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Monitor className="h-4 w-4 text-muted-foreground" />
                <span>Tab/window switches</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Time spent on each question</span>
              </div>
            </div>
          </div>

          {/* Camera Preview */}
          <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
            {cameraEnabled ? (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Camera className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Camera preview will appear here</p>
              </div>
            )}
            {cameraEnabled && (
              <div className="absolute bottom-2 right-2">
                <div className="flex items-center gap-1 px-2 py-1 bg-success/90 text-white text-xs rounded">
                  <CheckCircle className="h-3 w-3" />
                  Camera Active
                </div>
              </div>
            )}
          </div>

          {/* Enable Camera Button */}
          {!cameraEnabled && (
            <Button onClick={enableCamera} className="w-full">
              <Camera className="h-4 w-4 mr-2" />
              Enable Camera
            </Button>
          )}

          {/* Consent Checkbox */}
          <div className="flex items-start gap-3">
            <Checkbox
              id="consent"
              checked={consentChecked}
              onCheckedChange={(checked) => setConsentChecked(checked === true)}
            />
            <Label htmlFor="consent" className="text-sm leading-relaxed cursor-pointer">
              I understand and consent to proctoring. I acknowledge that my webcam, tab switches, and response times will be monitored during this assessment.
            </Label>
          </div>

          {/* Start Button */}
          <Button 
            onClick={handleStartAssessment} 
            disabled={!canStart}
            size="lg"
            className="w-full"
          >
            Start Assessment
          </Button>

          {!canStart && (
            <p className="text-xs text-center text-muted-foreground">
              Please enable your camera and accept the consent to continue
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CandidateProctoring;
