import { FileText, Sparkles, Bug, Shield, Zap, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ReleaseNote {
  version: string;
  date: string;
  type: "major" | "minor" | "patch";
  highlights: string[];
  features: string[];
  fixes: string[];
  security?: string[];
  performance?: string[];
}

const releaseNotes: ReleaseNote[] = [
  {
    version: "1.0.0",
    date: "2024-03-01",
    type: "major",
    highlights: ["Initial GA release", "Enterprise-ready features"],
    features: [
      "AI Chat interface with model selection",
      "API Key management with model binding",
      "SSO/OIDC integration",
      "Audit logging with full traceability",
      "Model Hub with download management",
      "Document vault with RAG support",
    ],
    fixes: [],
    security: ["End-to-end encryption for API keys", "Role-based access control"],
    performance: ["Optimized inference routing", "Efficient token streaming"],
  },
  {
    version: "0.9.5",
    date: "2024-02-15",
    type: "minor",
    highlights: ["Beta refinements"],
    features: [
      "Personal RAG document upload",
      "Prompt library with templates",
      "Department-based agent organization",
    ],
    fixes: [
      "Fixed model download progress tracking",
      "Resolved SSO callback issues",
      "Fixed token counting accuracy",
    ],
    security: ["Improved input sanitization"],
  },
  {
    version: "0.9.0",
    date: "2024-02-01",
    type: "minor",
    highlights: ["Public beta launch"],
    features: [
      "Core chat functionality",
      "Basic agent management",
      "System health monitoring",
    ],
    fixes: ["Various stability improvements"],
  },
];

const ReleaseNotesPage = () => {
  const [expandedVersions, setExpandedVersions] = useState<string[]>([releaseNotes[0].version]);

  const toggleVersion = (version: string) => {
    setExpandedVersions(prev =>
      prev.includes(version)
        ? prev.filter(v => v !== version)
        : [...prev, version]
    );
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "major":
        return <Badge className="bg-primary/20 text-primary border-primary/30">Major</Badge>;
      case "minor":
        return <Badge className="bg-success/20 text-success border-success/30">Minor</Badge>;
      case "patch":
        return <Badge variant="outline">Patch</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 h-full overflow-auto">
      <div>
        <h2 className="text-lg font-semibold">Release Notes</h2>
        <p className="text-sm text-muted-foreground">What's new in Fortress AI Gateway</p>
      </div>

      <div className="space-y-4">
        {releaseNotes.map((release) => (
          <Card key={release.version} className="overflow-hidden">
            <CardHeader 
              className="cursor-pointer hover:bg-muted/50 transition-colors pb-3"
              onClick={() => toggleVersion(release.version)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-base font-mono">v{release.version}</CardTitle>
                  {getTypeBadge(release.type)}
                  <span className="text-xs text-muted-foreground">{release.date}</span>
                </div>
                {expandedVersions.includes(release.version) ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {release.highlights.map((highlight) => (
                  <Badge key={highlight} variant="secondary" className="text-xs">
                    {highlight}
                  </Badge>
                ))}
              </div>
            </CardHeader>

            <CardContent className={cn(
              "space-y-4 transition-all",
              expandedVersions.includes(release.version) ? "block" : "hidden"
            )}>
              {/* Features */}
              {release.features.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Sparkles className="w-4 h-4 text-primary" />
                    New Features
                  </div>
                  <ul className="space-y-1 pl-6">
                    {release.features.map((feature, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground list-disc">{feature}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Bug Fixes */}
              {release.fixes.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Bug className="w-4 h-4 text-warning" />
                    Bug Fixes
                  </div>
                  <ul className="space-y-1 pl-6">
                    {release.fixes.map((fix, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground list-disc">{fix}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Security */}
              {release.security && release.security.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Shield className="w-4 h-4 text-success" />
                    Security
                  </div>
                  <ul className="space-y-1 pl-6">
                    {release.security.map((item, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground list-disc">{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Performance */}
              {release.performance && release.performance.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Zap className="w-4 h-4 text-primary" />
                    Performance
                  </div>
                  <ul className="space-y-1 pl-6">
                    {release.performance.map((item, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground list-disc">{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ReleaseNotesPage;
