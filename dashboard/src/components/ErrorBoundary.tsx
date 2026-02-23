import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-full flex flex-col items-center justify-center p-4 bg-background text-foreground">
          <div className="max-w-md w-full p-6 bg-card rounded-lg border border-border shadow-lg space-y-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-6 w-6" />
              <h1 className="text-xl font-semibold">Something went wrong</h1>
            </div>
            
            <div className="p-4 bg-muted/50 rounded text-sm font-mono overflow-auto max-h-[200px] border border-border">
              <p className="font-bold text-destructive mb-2">{this.state.error?.message}</p>
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                {this.state.errorInfo?.componentStack}
              </pre>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={() => window.location.reload()} 
                variant="default"
                className="w-full"
              >
                Reload Page
              </Button>
              <Button 
                onClick={() => window.location.href = "/"} 
                variant="outline"
                className="w-full"
              >
                Go Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
