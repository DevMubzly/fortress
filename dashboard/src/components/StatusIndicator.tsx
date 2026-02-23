import { cn } from "@/lib/utils";

interface StatusIndicatorProps {
  label: string;
  status: "healthy" | "warning" | "critical" | "offline";
  value?: string;
}

const StatusIndicator = ({ label, status, value }: StatusIndicatorProps) => {
  const statusConfig = {
    healthy: { color: "bg-success", text: "text-success", label: "Healthy" },
    warning: { color: "bg-warning", text: "text-warning", label: "Warning" },
    critical: { color: "bg-destructive", text: "text-destructive", label: "Critical" },
    offline: { color: "bg-muted-foreground", text: "text-muted-foreground", label: "Offline" },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">
      <div className="flex items-center gap-3">
        <span className={cn("w-2.5 h-2.5 rounded-full", config.color, status === "healthy" && "animate-pulse")} />
        <span className="text-sm">{label}</span>
      </div>
      <div className="text-right">
        {value && <span className="text-sm font-mono text-muted-foreground">{value}</span>}
        <span className={cn("text-xs ml-2", config.text)}>{config.label}</span>
      </div>
    </div>
  );
};

export default StatusIndicator;
