import { Home, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  className?: string;
}

export const PageHeader = ({ title, description, icon: Icon, className }: PageHeaderProps) => {
  return (
    <div className={cn("space-y-1.5 mb-6", className)}>
       <div className="flex items-center justify-between">
         <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-2">
           <Home className="w-3.5 h-3.5" />
           <span>/</span>
           <span className="text-foreground">{title}</span>
         </div>
       </div>

      <div className="flex items-center gap-3">
        {Icon && (
            <div className="p-2 bg-primary/10 rounded-lg">
                <Icon className="w-5 h-5 text-primary" />
            </div>
        )}
        <div className="space-y-0.5">
            <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
            {description && (
                <p className="text-sm text-muted-foreground">
                    {description}
                </p>
            )}
        </div>
      </div>
    </div>
  );
};

export default PageHeader;