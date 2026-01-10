import { useState, useEffect } from 'react';
import { Video, Volume2, Monitor, Flag, Users, User, Eye, EyeOff, Maximize2, Code, Copy, Clock, AlertCircle, Smartphone, Laptop, BookOpen, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { api } from '@/services/api';
import { cn } from '@/lib/utils';

interface Violation {
  id: string;
  type: string;
  start?: number;
  end?: number;
  duration?: number;
  severity: string;
  label?: string;
  clip_url?: string;
  has_clip?: boolean;
  snapshot_url?: string;
  has_snapshot?: boolean;
}

interface BrowserEvent {
  id: string;
  type: string;
  occurred_at?: string;
  duration_seconds?: number;
  severity: string;
}

interface ViolationsData {
  post_hoc_violations?: Violation[];
  violations?: Violation[];
  real_time_events?: BrowserEvent[];
  events?: BrowserEvent[];
  summary?: {
    violations_by_type?: Record<string, number>;
  };
}

interface ProctoringEvidenceProps {
  assessmentId: string;
  showVideoClips?: boolean;
  isAdmin?: boolean;
}

// Violation type categories
const CATEGORIES = {
  video: {
    label: "Video Evidence",
    icon: Video,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-200",
    types: ["no_face", "multiple_faces", "looking_away", "looking_down"]
  },
  objects: {
    label: "Prohibited Objects",
    icon: Flag,
    color: "text-red-600",
    bgColor: "bg-red-600/10",
    borderColor: "border-red-300",
    types: ["object_detected_cell_phone", "object_detected_laptop", "object_detected_book", "object_detected_remote"]
  },
  audio: {
    label: "Audio Evidence",
    icon: Volume2,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-200",
    types: ["multiple_speakers", "other_speaker", "suspicious_speech"]
  },
  browser: {
    label: "Browser Activity",
    icon: Monitor,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-200",
    types: ["tab_switch", "tab_return", "fullscreen_exit", "devtools_opened", "copy_paste_attempt", "blocked_shortcut", "window_blur", "window_focus", "lighting_change"]
  }
};

// Human-readable labels for violation types
const TYPE_LABELS: Record<string, string> = {
  no_face: "No face detected",
  multiple_faces: "Multiple faces detected",
  looking_away: "Looking away from screen",
  looking_down: "Looking down",
  // Prohibited objects (YOLO detection)
  object_detected_cell_phone: "Cell phone detected",
  object_detected_laptop: "Secondary laptop detected",
  object_detected_book: "Book/notes detected",
  object_detected_remote: "Remote device detected",
  // Audio
  multiple_speakers: "Multiple speakers detected",
  other_speaker: "Other speaker detected",
  suspicious_speech: "Suspicious speech detected",
  // Browser events
  tab_switch: "Tab switched",
  tab_return: "Returned to tab",
  fullscreen_exit: "Exited fullscreen",
  devtools_opened: "Developer tools opened",
  copy_paste_attempt: "Copy/paste attempted",
  blocked_shortcut: "Keyboard shortcut blocked",
  window_blur: "Window lost focus",
  window_focus: "Window regained focus",
  lighting_change: "Sudden lighting change"
};

// Format seconds to MM:SS
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Get icon for violation type
const getViolationIcon = (type: string) => {
  const iconProps = { className: "h-4 w-4" };
  switch (type) {
    case 'no_face': return <EyeOff {...iconProps} />;
    case 'multiple_faces': return <Users {...iconProps} />;
    case 'looking_away':
    case 'looking_down': return <Eye {...iconProps} />;
    // Prohibited objects
    case 'object_detected_cell_phone': return <Smartphone {...iconProps} />;
    case 'object_detected_laptop': return <Laptop {...iconProps} />;
    case 'object_detected_book': return <BookOpen {...iconProps} />;
    case 'object_detected_remote': return <Monitor {...iconProps} />;
    // Audio
    case 'multiple_speakers':
    case 'other_speaker':
    case 'suspicious_speech': return <Volume2 {...iconProps} />;
    // Browser events
    case 'tab_switch':
    case 'tab_return':
    case 'window_blur':
    case 'window_focus': return <Monitor {...iconProps} />;
    case 'fullscreen_exit': return <Maximize2 {...iconProps} />;
    case 'devtools_opened': return <Code {...iconProps} />;
    case 'copy_paste_attempt': return <Copy {...iconProps} />;
    case 'blocked_shortcut': return <Clock {...iconProps} />;
    case 'lighting_change': return <Lightbulb {...iconProps} />;
    default: return <AlertCircle {...iconProps} />;
  }
};

export const ProctoringEvidence = ({
  assessmentId,
  showVideoClips = false,
  isAdmin = false
}: ProctoringEvidenceProps) => {
  const [data, setData] = useState<ViolationsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchViolations = async () => {
      if (!assessmentId) {
        setIsLoading(false);
        return;
      }

      try {
        const result = isAdmin
          ? await api.admin.getProctoringViolations(assessmentId)
          : await api.candidate.getProctoringViolations(assessmentId);
        setData(result);
      } catch (err) {
        console.error('Failed to fetch violations:', err);
        setError('Failed to load proctoring data');
      }
      setIsLoading(false);
    };

    fetchViolations();
  }, [assessmentId, isAdmin]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            <span className="ml-2 text-muted-foreground">Loading proctoring data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return null; // Silently fail - don't show error card
  }

  // Combine violations and events
  const violations = data?.post_hoc_violations || data?.violations || [];
  const events = data?.real_time_events || data?.events || [];

  // Group by category
  const grouped: Record<string, { violations: Violation[]; events: BrowserEvent[] }> = {
    video: { violations: [], events: [] },
    objects: { violations: [], events: [] },
    audio: { violations: [], events: [] },
    browser: { violations: [], events: [] }
  };

  violations.forEach(v => {
    for (const [category, config] of Object.entries(CATEGORIES)) {
      if (config.types.includes(v.type)) {
        grouped[category].violations.push(v);
        break;
      }
    }
  });

  events.forEach(e => {
    for (const [category, config] of Object.entries(CATEGORIES)) {
      if (config.types.includes(e.type)) {
        grouped[category].events.push(e);
        break;
      }
    }
  });

  // Calculate total count per category
  const getCategoryCount = (category: string) => {
    return grouped[category].violations.length + grouped[category].events.length;
  };

  // Check if we have any data to show
  const totalIssues = Object.keys(grouped).reduce((sum, cat) => sum + getCategoryCount(cat), 0);

  if (totalIssues === 0) {
    return null; // Don't show card if no issues
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flag className="h-5 w-5 text-amber-500" />
          Flagged Activities
          <Badge variant="outline" className="ml-2">{totalIssues} issues</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="space-y-2">
          {Object.entries(CATEGORIES).map(([categoryKey, category]) => {
            const count = getCategoryCount(categoryKey);
            if (count === 0) return null;

            const CategoryIcon = category.icon;
            const categoryViolations = grouped[categoryKey].violations;
            const categoryEvents = grouped[categoryKey].events;

            return (
              <AccordionItem
                key={categoryKey}
                value={categoryKey}
                className="border rounded-lg overflow-hidden"
              >
                <AccordionTrigger className="hover:no-underline px-4 py-3 bg-muted/30">
                  <div className="flex items-center gap-3 w-full pr-4">
                    <CategoryIcon className={cn("h-5 w-5", category.color)} />
                    <span className="font-medium">{category.label}</span>
                    <Badge
                      variant="outline"
                      className={cn("ml-auto", category.bgColor, category.borderColor, category.color)}
                    >
                      {count}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 py-3 bg-background">
                  <div className="space-y-3">
                    {/* Post-hoc violations (with timestamps and clips) */}
                    {categoryViolations.map((violation) => (
                      <div
                        key={violation.id}
                        className="border rounded-lg p-3 bg-muted/20"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {getViolationIcon(violation.type)}
                            <span className="font-medium">
                              {TYPE_LABELS[violation.type] || violation.label || violation.type}
                            </span>
                          </div>
                          <Badge
                            variant={violation.severity === 'HIGH' ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {violation.severity}
                          </Badge>
                        </div>

                        {/* Timestamp info */}
                        {violation.start !== undefined && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {formatTime(violation.start)}
                            {violation.end !== undefined && ` - ${formatTime(violation.end)}`}
                            {violation.duration !== undefined && ` (${violation.duration.toFixed(1)}s)`}
                          </p>
                        )}

                        {/* Snapshot image (for object detection) */}
                        {showVideoClips && violation.snapshot_url && (
                          <div className="mt-3">
                            <img
                              src={violation.snapshot_url}
                              alt={`Evidence: ${violation.type}`}
                              className="w-full max-w-md rounded border"
                            />
                          </div>
                        )}

                        {/* Video clip */}
                        {showVideoClips && violation.clip_url && (
                          <div className="mt-3">
                            <video
                              controls
                              src={violation.clip_url}
                              className="w-full max-w-md rounded border"
                              preload="metadata"
                            >
                              Your browser does not support video playback.
                            </video>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Real-time events (grouped by type with count) */}
                    {(() => {
                      // Group events by type
                      const eventsByType: Record<string, BrowserEvent[]> = {};
                      categoryEvents.forEach(e => {
                        if (!eventsByType[e.type]) eventsByType[e.type] = [];
                        eventsByType[e.type].push(e);
                      });

                      return Object.entries(eventsByType).map(([type, typeEvents]) => (
                        <div
                          key={type}
                          className="border rounded-lg p-3 bg-muted/20"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              {getViolationIcon(type)}
                              <span className="font-medium">
                                {TYPE_LABELS[type] || type}
                              </span>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {typeEvents.length}x
                            </Badge>
                          </div>

                          {/* Show timestamps if available */}
                          {typeEvents.some(e => e.occurred_at) && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {typeEvents
                                .filter(e => e.occurred_at)
                                .slice(0, 5)  // Show max 5 timestamps
                                .map(e => {
                                  const date = new Date(e.occurred_at!);
                                  return `${date.getMinutes()}:${date.getSeconds().toString().padStart(2, '0')}`;
                                })
                                .join(' | ')}
                              {typeEvents.length > 5 && ` +${typeEvents.length - 5} more`}
                            </p>
                          )}
                        </div>
                      ));
                    })()}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default ProctoringEvidence;
