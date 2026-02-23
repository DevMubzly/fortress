import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-transparent text-primary hover:bg-transparent/80 border-none",
        secondary: "bg-transparent text-secondary-foreground hover:bg-transparent/80 border-none",
        destructive: "bg-transparent text-destructive hover:bg-transparent/80 border-none",
        outline: "text-foreground bg-transparent border-none",
        success: "text-emerald-500 bg-transparent border-none", // Custom one I might want
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
