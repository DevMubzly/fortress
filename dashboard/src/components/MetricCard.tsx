import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | ReactNode;
  subtitle?: string;
  icon: React.ElementType;
  trend?: {
    value: string;
    positive: boolean;
  };
  children?: ReactNode;
  className?: string;
  iconColor?: string;
}

const MetricCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  children,
  className,
  iconColor = "text-primary",
}: MetricCardProps) => {
  return (
    <div
      className={cn(
        "glass-hover rounded-xl p-5 space-y-4",
        "opacity-0 animate-fade-in",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg bg-primary/10 border border-primary/20", iconColor.includes("success") && "bg-success/10 border-success/20", iconColor.includes("warning") && "bg-warning/10 border-warning/20")}>
            <Icon className={cn("w-5 h-5", iconColor)} />
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
            {subtitle && (
              <p className="text-xs text-muted-foreground/70">{subtitle}</p>
            )}
          </div>
        </div>
        {trend && (
          <span
            className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full",
              trend.positive
                ? "bg-success/10 text-success"
                : "bg-destructive/10 text-destructive"
            )}
          >
            {trend.positive ? "+" : ""}{trend.value}
          </span>
        )}
      </div>

      {/* Value */}
      <div className="text-3xl font-bold tracking-tight">{value}</div>

      {/* Children (for custom content like gauges) */}
      {children}
    </div>
  );
};

export default MetricCard;
