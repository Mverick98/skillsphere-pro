import { cn } from '@/lib/utils';

interface FitToRoleGaugeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

const FitToRoleGauge = ({ score, size = 'md' }: FitToRoleGaugeProps) => {
  const dimensions = {
    sm: { width: 160, height: 100, strokeWidth: 12, fontSize: 16, labelSize: 10 },
    md: { width: 240, height: 140, strokeWidth: 16, fontSize: 24, labelSize: 12 },
    lg: { width: 320, height: 180, strokeWidth: 20, fontSize: 32, labelSize: 14 },
  };

  const { width, height, strokeWidth, fontSize, labelSize } = dimensions[size];
  const radius = (width - strokeWidth) / 2;
  const centerX = width / 2;
  const centerY = height - 10;

  // Normalize score to 0-100
  const normalizedScore = Math.min(100, Math.max(0, score));

  // Needle angle: 180° (left) for 0%, 0° (right) for 100%
  const needleAngle = 180 - (normalizedScore / 100) * 180;
  const needleRad = (needleAngle * Math.PI) / 180;

  // Needle endpoint
  const needleLength = radius - 15;
  const needleX = centerX + needleLength * Math.cos(needleRad);
  const needleY = centerY - needleLength * Math.sin(needleRad);

  // Get fitment label and color based on score
  const getFitment = (score: number) => {
    if (score >= 70) return { label: 'Recommended', color: 'text-green-600' };
    if (score >= 40) return { label: 'Conditional', color: 'text-amber-600' };
    return { label: 'Not Recommended', color: 'text-red-600' };
  };

  const fitment = getFitment(normalizedScore);

  // Create arc path using describeArc helper
  // For SVG: 0° is at 3 o'clock, angles go clockwise
  // We want: 180° (9 o'clock/left) to 0° (3 o'clock/right) going UPWARD (counter-clockwise in standard math)
  const polarToCartesian = (cx: number, cy: number, r: number, angleDeg: number) => {
    const angleRad = (angleDeg * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(angleRad),
      y: cy - r * Math.sin(angleRad), // Subtract because SVG y-axis is inverted
    };
  };

  const describeArc = (startAngle: number, endAngle: number) => {
    const start = polarToCartesian(centerX, centerY, radius, startAngle);
    const end = polarToCartesian(centerX, centerY, radius, endAngle);
    const largeArcFlag = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;
    // sweep-flag: 1 = clockwise in SVG (going UP through top of circle)
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
  };

  // Zone angles (from left 180° to right 0°):
  // Red: 0-40% → 180° to 108°
  // Amber: 40-70% → 108° to 54°
  // Green: 70-100% → 54° to 0°
  const redEnd = 180 - (40 * 180 / 100);    // 108°
  const amberEnd = 180 - (70 * 180 / 100);  // 54°

  return (
    <div className="flex flex-col items-center">
      <svg width={width} height={height} className="overflow-visible">
        {/* Background track */}
        <path
          d={describeArc(180, 0)}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Red zone: 0-40% (left side, 180° to 108°) */}
        <path
          d={describeArc(180, redEnd)}
          fill="none"
          stroke="#ef4444"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Amber zone: 40-70% (middle, 108° to 54°) */}
        <path
          d={describeArc(redEnd, amberEnd)}
          fill="none"
          stroke="#f59e0b"
          strokeWidth={strokeWidth}
        />

        {/* Green zone: 70-100% (right side, 54° to 0°) */}
        <path
          d={describeArc(amberEnd, 0)}
          fill="none"
          stroke="#22c55e"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Needle */}
        <line
          x1={centerX}
          y1={centerY}
          x2={needleX}
          y2={needleY}
          stroke="hsl(var(--foreground))"
          strokeWidth={3}
          strokeLinecap="round"
        />

        {/* Needle base circle */}
        <circle
          cx={centerX}
          cy={centerY}
          r={6}
          fill="hsl(var(--foreground))"
        />

        {/* Score text */}
        <text
          x={centerX}
          y={centerY - 30}
          textAnchor="middle"
          className="fill-foreground font-bold"
          style={{ fontSize }}
        >
          {Math.round(normalizedScore)}%
        </text>
      </svg>

      {/* Labels */}
      <div className="text-center mt-1">
        <div className={cn("font-semibold", fitment.color)} style={{ fontSize: labelSize + 2 }}>
          {fitment.label}
        </div>
        <div className="text-muted-foreground" style={{ fontSize: labelSize }}>
          Fit to Role
        </div>
      </div>
    </div>
  );
};

export default FitToRoleGauge;
