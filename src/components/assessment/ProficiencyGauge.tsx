import { useMemo } from 'react';

interface ProficiencyGaugeProps {
  level: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const ProficiencyGauge = ({ level, size = 'md', showLabel = true }: ProficiencyGaugeProps) => {
  const dimensions = {
    xs: { outer: 56, inner: 44, stroke: 5 },
    sm: { outer: 80, inner: 60, stroke: 8 },
    md: { outer: 120, inner: 90, stroke: 12 },
    lg: { outer: 160, inner: 120, stroke: 16 },
  };

  const { outer, inner, stroke } = dimensions[size];
  const radius = (outer - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (level / 5) * 100;
  const dashOffset = circumference - (progress / 100) * circumference;

  const levelLabels = ['Beginner', 'Basic', 'Intermediate', 'Advanced', 'Expert'];
  const levelColors = [
    'hsl(var(--proficiency-1))',
    'hsl(var(--proficiency-2))',
    'hsl(var(--proficiency-3))',
    'hsl(var(--proficiency-4))',
    'hsl(var(--proficiency-5))',
  ];

  const color = levelColors[level - 1];

  return (
    <div className="relative inline-flex flex-col items-center">
      <svg width={outer} height={outer} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={outer / 2}
          cy={outer / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={stroke}
        />
        {/* Progress circle */}
        <circle
          cx={outer / 2}
          cy={outer / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      
      {/* Center content - positioned over the SVG */}
      <div
        className="absolute flex items-center justify-center"
        style={{ top: 0, left: 0, width: outer, height: outer }}
      >
        <span className="flex items-baseline" style={{ color }}>
          <span
            className="font-bold"
            style={{
              fontSize: size === 'lg' ? '2rem' : size === 'md' ? '1.5rem' : size === 'sm' ? '1.25rem' : '1rem',
            }}
          >
            {level}
          </span>
          <span
            className="text-muted-foreground"
            style={{
              fontSize: size === 'lg' ? '0.875rem' : size === 'md' ? '0.75rem' : '0.625rem',
            }}
          >
            /5
          </span>
        </span>
      </div>

      {showLabel && (
        <span
          className="mt-1 font-medium"
          style={{ color, fontSize: size === 'lg' ? '0.875rem' : size === 'md' ? '0.75rem' : '0.625rem' }}
        >
          {levelLabels[level - 1]}
        </span>
      )}
    </div>
  );
};

export default ProficiencyGauge;
