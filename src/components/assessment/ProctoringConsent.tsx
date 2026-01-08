import { useState, useRef, useEffect } from 'react';
import { useAssessment } from '@/context/AssessmentContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, Eye, Monitor, User, Shield, AlertCircle, CheckCircle2 } from 'lucide-react';

const ProctoringConsent = () => {
  const { currentStep, setStep, enableProctoring, setCameraActive, startAssessment } = useAssessment();
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const isOpen = currentStep === 'proctoring';

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const handleEnableCamera = async () => {
    try {
      setCameraError('');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 320, height: 240 },
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraEnabled(true);
      setCameraActive(true);
    } catch (error) {
      setCameraError('Unable to access camera. Please grant permission and try again.');
      console.error('Camera access error:', error);
    }
  };

  const handleStartAssessment = () => {
    enableProctoring();
    startAssessment();
  };

  const handleClose = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setCameraEnabled(false);
    setCameraActive(false);
    setConsentChecked(false);
    setStep('config');
  };

  const monitoringItems = [
    { icon: Camera, text: 'Webcam recording throughout the assessment' },
    { icon: Monitor, text: 'Tab switch and window focus detection' },
    { icon: User, text: 'Face presence verification' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg gradient-primary">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <DialogTitle className="text-xl">Proctored Assessment</DialogTitle>
          </div>
          <DialogDescription>
            This assessment is monitored to ensure integrity. Please review and consent to the following.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Monitoring Items */}
          <Card className="border-muted">
            <CardContent className="p-4 space-y-3">
              <h4 className="font-medium text-sm text-foreground flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary" />
                What will be monitored:
              </h4>
              {monitoringItems.map((item, index) => (
                <div key={index} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.text}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Camera Section */}
          <div className="space-y-3">
            <div className="aspect-video bg-muted rounded-lg overflow-hidden relative">
              {cameraEnabled ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <Camera className="w-12 h-12 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Camera preview will appear here</span>
                </div>
              )}
              {cameraEnabled && (
                <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-success/90 text-success-foreground text-xs">
                  <CheckCircle2 className="w-3 h-3" />
                  Camera Active
                </div>
              )}
            </div>

            {cameraError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{cameraError}</span>
              </div>
            )}

            {!cameraEnabled && (
              <Button onClick={handleEnableCamera} className="w-full" variant="outline">
                <Camera className="w-4 h-4 mr-2" />
                Enable Camera
              </Button>
            )}
          </div>

          {/* Consent Checkbox */}
          <div
            className={`flex items-start gap-3 p-4 rounded-lg border transition-colors cursor-pointer ${
              consentChecked ? 'border-primary bg-primary/5' : 'hover:border-primary/30'
            }`}
            onClick={() => setConsentChecked(!consentChecked)}
          >
            <Checkbox
              checked={consentChecked}
              onCheckedChange={(checked) => setConsentChecked(!!checked)}
              className="mt-0.5"
            />
            <label className="text-sm text-muted-foreground cursor-pointer">
              I understand that this assessment is proctored and I consent to webcam monitoring, tab switch detection, and face verification during the evaluation.
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button
              className="flex-1 gradient-primary hover:opacity-90"
              disabled={!cameraEnabled || !consentChecked}
              onClick={handleStartAssessment}
            >
              Start Assessment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProctoringConsent;
