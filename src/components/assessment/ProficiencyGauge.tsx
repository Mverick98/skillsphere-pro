import { useMemo } from 'react';

interface ProficiencyGaugeProps {
  level: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const ProficiencyGauge = ({ level, size = 'md', showLabel = true }: ProficiencyGaugeProps) => {
  const dimensions = {
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
      
      {/* Center content */}
      <div 
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{ top: 0, left: 0, right: 0, bottom: 0 }}
      >
        <span 
          className="font-bold"
          style={{ 
            fontSize: size === 'lg' ? '2.5rem' : size === 'md' ? '1.75rem' : '1.25rem',
            color 
          }}
        >
          {level}
        </span>
        <span className="text-xs text-muted-foreground">/5</span>
      </div>

      {showLabel && (
        <span 
          className="mt-2 font-medium"
          style={{ color, fontSize: size === 'lg' ? '1rem' : '0.875rem' }}
        >
          {levelLabels[level - 1]}
        </span>
      )}
    </div>
  );
};

export default ProficiencyGauge;
