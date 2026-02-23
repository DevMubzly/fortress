interface SpeedometerGaugeProps {
  value: number;
  max: number;
  label: string;
  unit?: string;
}

const SpeedometerGauge = ({ value, max, label, unit = "" }: SpeedometerGaugeProps) => {
  const percentage = (value / max) * 100;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference * 0.75;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-20 overflow-hidden">
        <svg
          className="w-32 h-32 -mt-2"
          viewBox="0 0 100 100"
        >
          {/* Background arc */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference * 0.75}
            strokeDashoffset={0}
            transform="rotate(135 50 50)"
          />
          {/* Value arc */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(135 50 50)"
            className="animate-gauge transition-all duration-1000"
            style={{ filter: "drop-shadow(0 0 6px hsl(var(--primary) / 0.5))" }}
          />
        </svg>
        {/* Center value */}
        <div className="absolute inset-0 flex items-end justify-center pb-1">
          <div className="text-center">
            <span className="text-2xl font-bold font-mono">{value}</span>
            <span className="text-xs text-muted-foreground ml-1">{unit}</span>
          </div>
        </div>
      </div>
      <span className="text-xs text-muted-foreground mt-1">{label}</span>
    </div>
  );
};

export default SpeedometerGauge;
